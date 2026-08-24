-- Migration 00015: RPC phan cong don vi phu trach cho Pho Vien truong tinh
-- Ngay: 24/08/2026
--
-- Boi canh: sau migration 00014, Pho Vien truong tinh chi xem duoc ho so va
-- nhat ky cua cac don vi duoc phan cong (bang unit_assignments) - nhung
-- truoc gio chua co cach nao de gan phan cong nay qua giao dien. RPC nay cho
-- phep Vien truong tinh/Quan tri vien thiet lap lai toan bo danh sach don vi
-- 1 nguoi Pho Vien truong tinh phu trach trong 1 lan goi.

CREATE OR REPLACE FUNCTION set_unit_assignments(p_user_id UUID, p_unit_ids UUID[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role NOT IN ('administrator', 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen phan cong don vi phu trach');
  END IF;

  DELETE FROM unit_assignments WHERE user_id = p_user_id;

  IF p_unit_ids IS NOT NULL AND array_length(p_unit_ids, 1) > 0 THEN
    INSERT INTO unit_assignments (user_id, unit_id)
    SELECT p_user_id, u FROM unnest(p_unit_ids) AS u;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
