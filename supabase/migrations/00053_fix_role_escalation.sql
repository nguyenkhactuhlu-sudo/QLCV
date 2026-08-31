-- Migration 00053: Chan tu phong Quan tri vien qua chuc nang "chuyen cong tac"
-- Ngay: 30/08/2026
--
-- LO HONG (phat hien qua ra soat bao mat): assign_account_role() chi kiem
-- tra NGUOI GOI la administrator/province_head, nhung khong kiem tra:
-- 1. Vai tro (p_role) dinh gan la gi - "Vien truong tinh" co the goi RPC
--    nay tu phong CHINH MINH (hoac bat ky ai) thanh 'administrator' - vai
--    tro cao nhat, dang le chi Quan tri vien moi cap duoc.
-- 2. p_user_id co phai chinh nguoi goi khong - cho phep tu doi vai tro/don
--    vi cua chinh minh qua chuc nang "chuyen cong tac" (dang le viec nay
--    phai do NGUOI KHAC thuc hien, khong tu lam cho ban than).
--
-- SUA: them 2 dieu kien chan o dau ham, giu nguyen toan bo logic con lai.
CREATE OR REPLACE FUNCTION assign_account_role(
  p_user_id UUID,
  p_role user_role,
  p_unit_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role NOT IN ('administrator', 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen gan vai tro/don vi');
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong the tu doi vai tro/don vi cua chinh minh qua chuc nang nay');
  END IF;

  IF p_role = 'administrator' AND v_caller_role != 'administrator' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chi Quan tri vien moi duoc gan vai tro Quan tri vien');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM units WHERE id = p_unit_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Don vi khong hop le');
  END IF;

  UPDATE profiles SET role = p_role, unit_id = p_unit_id, is_active = true
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong tim thay tai khoan');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
