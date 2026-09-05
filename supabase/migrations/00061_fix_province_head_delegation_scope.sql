-- Migration 00061: Sua uy quyen cua Vien truong tinh dang gan sai cap -
-- hien cho phep uy quyen cho BAT KY Pho phong/Pho Vien truong khu vuc nao
-- trong toan tinh (khong gioi han don vi), trong khi dung ra Vien truong
-- tinh chi nen uy quyen cho CAP PHO TRUC TIEP cua minh - Pho Vien truong
-- tinh (province_deputy).
-- Ngay: 05/09/2026
--
-- Nguyen nhan (migration 00043, grant_delegation): dieu kien bat buoc
-- "v_delegate.role != 'unit_deputy'" nghia la Vien truong tinh CHUA BAO
-- GIO uy quyen duoc cho dung Pho Vien truong tinh (role province_deputy)
-- - nguoc lai, lai duoc phep chon BAT KY unit_deputy nao trong toan tinh
-- (nhanh "v_delegator_role = 'province_head'" khong co dieu kien don vi
-- nao ca). Day la loi logic thuc su, khong chi giao dien.
--
-- SUA:
-- 1) grant_delegation: Vien truong tinh -> CHI duoc uy quyen cho
--    province_deputy (khong con unit_deputy nao ca). Truong phong/Vien
--    truong khu vuc -> giu nguyen, chi Pho cua DUNG don vi minh.
-- 2) can_manage_person + can_approve_monthly: bo sung nhanh cho
--    province_deputy dang duoc uy quyen (has_active_delegation()) - luc
--    do co toan quyen NHU VIEN TRUONG TINH (quan ly duoc moi unit_head +
--    province_deputy khac + nhan su thuoc don vi lanh dao tinh), thay vi
--    chi gioi han trong cac don vi duoc phan cong qua unit_assignments
--    nhu binh thuong. can_review_log KHONG can sua - nhanh reviewer khac
--    unit_deputy da fallback goi thang can_manage_person(author_id), tu
--    dong ke thua ban sua nay.

DROP FUNCTION IF EXISTS grant_delegation(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION grant_delegation(
  p_delegate_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_delegate profiles%ROWTYPE;
  v_delegator_role user_role;
  v_delegator_unit UUID;
  v_delegation_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_ends_at <= p_starts_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ngày kết thúc phải sau ngày bắt đầu');
  END IF;

  SELECT * INTO v_delegate FROM profiles WHERE id = p_delegate_id;
  IF v_delegate.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy người được ủy quyền');
  END IF;

  SELECT role, unit_id INTO v_delegator_role, v_delegator_unit FROM profiles WHERE id = v_user_id;

  IF v_delegator_role = 'province_head' THEN
    IF v_delegate.role != 'province_deputy' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Viện trưởng tỉnh chỉ được ủy quyền cho Phó Viện trưởng tỉnh');
    END IF;
  ELSIF v_delegator_role = 'unit_head' THEN
    IF v_delegate.role != 'unit_deputy' OR v_delegate.unit_id != v_delegator_unit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Chỉ được ủy quyền cho Phó phòng/Phó Viện trưởng khu vực của chính đơn vị mình');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền ủy quyền cho người này');
  END IF;

  IF EXISTS (
    SELECT 1 FROM delegations
    WHERE delegator_id = v_user_id AND status = 'active' AND ends_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn đang có 1 ủy quyền còn hiệu lực - hãy thu hồi trước khi cấp ủy quyền mới');
  END IF;

  INSERT INTO delegations (delegator_id, delegate_id, unit_id, starts_at, ends_at, status, granted_by)
  VALUES (v_user_id, p_delegate_id, v_delegate.unit_id, p_starts_at, p_ends_at, 'active', v_user_id)
  RETURNING id INTO v_delegation_id;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    p_delegate_id,
    'delegation_granted',
    'Bạn được ủy quyền thay mặt chấm điểm toàn bộ đơn vị',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã ủy quyền cho bạn thay mặt chấm điểm toàn bộ đơn vị, từ '
      || to_char(p_starts_at, 'DD/MM/YYYY') || ' đến ' || to_char(p_ends_at, 'DD/MM/YYYY') || '.',
    v_delegation_id,
    'delegation'
  );

  RETURN jsonb_build_object('success', true, 'delegation_id', v_delegation_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_person(p_target_id UUID)
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
    IF public.has_active_delegation() THEN
      -- Dang duoc Vien truong tinh uy quyen thay mat toan tinh - toan
      -- quyen NHU Vien truong tinh (giong het dieu kien nhanh tren).
      SELECT id INTO v_province_unit_id FROM units WHERE type = 'province' LIMIT 1;
      RETURN v_target_role = 'province_deputy' OR v_target_role = 'unit_head' OR v_target_unit = v_province_unit_id;
    END IF;
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role IN ('staff', 'support_staff');
  END IF;
  RETURN false;
END;
$$;

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
    IF public.has_active_delegation() THEN
      RETURN v_target_role IN ('province_deputy', 'unit_head');
    END IF;
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    RETURN public.has_active_delegation() AND v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  END IF;
  RETURN false;
END;
$$;
