-- Migration 00034: Thong bao cho Pho phong khi duoc/thoi uy quyen
-- Ngay: 27/08/2026
--
-- Boi canh: grant_delegation()/revoke_delegation() (migration 00030)
-- truoc day khong bao gio bao cho nguoi duoc uy quyen biet - ho phai tu
-- vao "Nhat ky cong tac cua don vi" moi phat hien. Them thong bao that
-- (bang notifications, dung enum vua them o migration 00033).
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

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    p_delegate_id,
    'delegation_granted',
    'Bạn được ủy quyền chấm điểm thay',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã ủy quyền cho bạn chấm điểm thay '
      || array_length(p_scope_user_ids, 1) || ' người, từ ' || to_char(p_starts_at, 'DD/MM/YYYY')
      || ' đến ' || to_char(p_ends_at, 'DD/MM/YYYY') || '.',
    v_delegation_id,
    'delegation'
  );

  RETURN jsonb_build_object('success', true, 'delegation_id', v_delegation_id);
END;
$$;

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

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    v_delegation.delegate_id,
    'delegation_revoked',
    'Ủy quyền chấm điểm đã bị thu hồi',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã thu hồi ủy quyền chấm điểm của bạn.',
    p_delegation_id,
    'delegation'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;
