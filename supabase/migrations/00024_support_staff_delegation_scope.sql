-- Migration 00024: Cho phep Pho phong duoc uy quyen cham diem thang ca
-- "Nguoi lao dong" (khong chi 'staff') - tiep noi migration 00023.
-- Ngay: 27/08/2026
--
-- Boi canh: can_approve_monthly() nhanh unit_deputy (duoc uy quyen) dang
-- kiem tra cung "v_target_role = 'staff'" - phai mo rong sang ca
-- 'support_staff' de dung quyen han tuong duong da xac nhan. Cac nhanh
-- khac (province_head/province_deputy/unit_head) da dung dieu kien am tinh
-- (vi du "v_target_role != 'unit_head'") nen tu dong bao gom vai tro moi,
-- khong can sua.
CREATE OR REPLACE FUNCTION public.can_approve_monthly(p_target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
  v_is_delegated BOOLEAN;
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
    SELECT EXISTS(
      SELECT 1 FROM delegations
      WHERE delegate_id = auth.uid() AND status = 'active' AND now() BETWEEN starts_at AND ends_at
    ) INTO v_is_delegated;
    RETURN v_is_delegated AND v_target_unit = v_reviewer_unit AND v_target_role IN ('staff', 'support_staff');
  END IF;
  RETURN false;
END;
$$;
