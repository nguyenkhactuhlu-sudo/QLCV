-- Migration 00012: Sua loi xac nhan tai khoan bang RPC rieng
-- Ngay: 24/08/2026
--
-- Nguyen nhan: chinh sach RLS cho phep quan tri vien sua bang profiles
-- (profiles_admin_all) lai dung ham public.user_role(), ma ham nay cung doc
-- tu chinh bang profiles - khi sua (UPDATE) ngay tren bang profiles, viec
-- RLS phai doc lai profiles de kiem tra quyen gay xung dot ngam, khien
-- PostgREST tra ve "thanh cong" nhung 0 dong duoc sua (da kiem chung bang
-- dong lenh truc tiep: sua bang khac thi binh thuong, chi rieng bang
-- profiles bi loi nay).
--
-- Cach sua: dua thao tac xac nhan tai khoan vao 1 ham rieng (SECURITY
-- DEFINER), giong cach da lam voi duyet nhat ky / duyet diem thang - ham nay
-- tu kiem tra quyen roi sua truc tiep, khong di qua RLS cua bang profiles
-- nen khong con xung dot.

CREATE OR REPLACE FUNCTION approve_pending_account(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role user_role;
  v_updated_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role IS DISTINCT FROM 'administrator'::user_role THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen xac nhan tai khoan');
  END IF;

  UPDATE profiles SET is_active = true WHERE id = p_user_id AND is_active = false
    RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong tim thay tai khoan dang cho hoac da duoc xac nhan truoc do');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
