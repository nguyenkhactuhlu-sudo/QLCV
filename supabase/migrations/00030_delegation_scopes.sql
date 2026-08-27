-- Migration 00030: Uy quyen cham diem theo danh sach nguoi cu the
-- (delegation_scopes) - thay the co che cu "ap dung ca don vi"
-- Ngay: 27/08/2026
--
-- Boi canh: bang delegations hien tai chi co unit_id (uy quyen theo CA DON
-- VI), khong chon duoc tung nguoi cu the. Them bang delegation_scopes de
-- Truong phong/Vien truong KV chi dinh dung ai duoc Pho phong cham thay.
-- Khong co RLS INSERT truc tiep cho delegations (chi co
-- select_own/admin_all) - moi thao tac di qua 2 RPC moi
-- (grant_delegation/revoke_delegation) de kiem tra quyen day du.

CREATE TABLE delegation_scopes (
  delegation_id UUID NOT NULL REFERENCES delegations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (delegation_id, staff_id)
);
ALTER TABLE delegation_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delegation_scopes_select" ON delegation_scopes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM delegations d
      WHERE d.id = delegation_id AND (d.delegator_id = auth.uid() OR d.delegate_id = auth.uid())
    )
  );

-- ============================================
-- RPC: Truong phong/Vien truong KV (hoac Vien truong tinh) uy quyen cho
-- 1 Pho phong/Pho Vien truong KV, gan voi danh sach nguoi cu the
-- ============================================
CREATE OR REPLACE FUNCTION grant_delegation(
  p_delegate_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_scope_user_ids UUID[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_delegate profiles%ROWTYPE;
  v_delegator_role user_role;
  v_delegation_id UUID;
  v_staff_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_ends_at <= p_starts_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ngày kết thúc phải sau ngày bắt đầu');
  END IF;
  IF p_scope_user_ids IS NULL OR array_length(p_scope_user_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cần chọn ít nhất 1 người được chấm thay');
  END IF;

  SELECT * INTO v_delegate FROM profiles WHERE id = p_delegate_id;
  IF v_delegate.id IS NULL OR v_delegate.role != 'unit_deputy' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Người được ủy quyền phải là Phó phòng/Phó Viện trưởng KV');
  END IF;

  SELECT role INTO v_delegator_role FROM profiles WHERE id = v_user_id;
  IF NOT (
    v_delegator_role = 'province_head'
    OR (v_delegator_role = 'unit_head' AND EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id AND unit_id = v_delegate.unit_id))
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền ủy quyền cho người này');
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_scope_user_ids) AS sid
    LEFT JOIN profiles p ON p.id = sid
    WHERE p.id IS NULL OR p.unit_id != v_delegate.unit_id OR p.role NOT IN ('staff', 'support_staff')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Danh sách phạm vi không hợp lệ');
  END IF;

  INSERT INTO delegations (delegator_id, delegate_id, unit_id, starts_at, ends_at, status, granted_by)
  VALUES (v_user_id, p_delegate_id, v_delegate.unit_id, p_starts_at, p_ends_at, 'active', v_user_id)
  RETURNING id INTO v_delegation_id;

  FOREACH v_staff_id IN ARRAY p_scope_user_ids LOOP
    INSERT INTO delegation_scopes (delegation_id, staff_id) VALUES (v_delegation_id, v_staff_id);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'delegation_id', v_delegation_id);
END;
$$;

-- ============================================
-- RPC: thu hoi uy quyen (nguoi da uy quyen hoac Vien truong tinh)
-- ============================================
CREATE OR REPLACE FUNCTION revoke_delegation(p_delegation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_delegation delegations%ROWTYPE;
  v_role user_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  SELECT * INTO v_delegation FROM delegations WHERE id = p_delegation_id;
  IF v_delegation.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy ủy quyền'); END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  IF v_delegation.delegator_id != v_user_id AND v_role != 'province_head' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền thu hồi ủy quyền này');
  END IF;

  UPDATE delegations SET status = 'revoked', revoked_at = now(), revoked_by = v_user_id WHERE id = p_delegation_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- Cap nhat can_approve_monthly() va can_review_log(): nhanh unit_deputy
-- kiem tra delegation_scopes thay vi ap dung ca don vi
-- ============================================
CREATE OR REPLACE FUNCTION public.can_approve_monthly(p_target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
BEGIN
  IF p_target_user_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();
  SELECT role, unit_id INTO v_target_role, v_target_unit FROM profiles WHERE id = p_target_user_id;
  IF v_target_role IS NULL OR v_target_role = 'administrator' THEN RETURN false; END IF;

  IF v_reviewer_role = 'province_head' THEN
    RETURN v_target_role IN ('province_deputy', 'unit_head');
  ELSIF v_reviewer_role = 'province_deputy' THEN
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    RETURN EXISTS(
      SELECT 1 FROM delegations d
      JOIN delegation_scopes ds ON ds.delegation_id = d.id
      WHERE d.delegate_id = auth.uid() AND d.status = 'active'
        AND now() BETWEEN d.starts_at AND d.ends_at
        AND ds.staff_id = p_target_user_id
    );
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_review_log(p_target_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
  v_province_unit_id UUID;
BEGIN
  IF p_target_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();
  SELECT role, unit_id INTO v_target_role, v_target_unit FROM profiles WHERE id = p_target_id;
  IF v_target_role IS NULL THEN RETURN false; END IF;

  IF v_reviewer_role = 'province_head' THEN
    SELECT id INTO v_province_unit_id FROM units WHERE type = 'province' LIMIT 1;
    RETURN v_target_role = 'province_deputy' OR v_target_role = 'unit_head' OR v_target_unit = v_province_unit_id;
  ELSIF v_reviewer_role = 'province_deputy' THEN
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    RETURN EXISTS(
      SELECT 1 FROM delegations d
      JOIN delegation_scopes ds ON ds.delegation_id = d.id
      WHERE d.delegate_id = auth.uid() AND d.status = 'active'
        AND now() BETWEEN d.starts_at AND d.ends_at
        AND ds.staff_id = p_target_id
    );
  END IF;
  RETURN false;
END;
$$;
