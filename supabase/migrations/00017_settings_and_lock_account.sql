-- Migration 00017: Doi ten ca nhan (an toan) va khoa/mo tai khoan
-- Ngay: 24/08/2026
--
-- Ca 2 deu dung RPC (SECURITY DEFINER) thay vi sua truc tiep bang profiles
-- qua PostgREST, dung theo mau da on dinh tu migration 00012 tro di.

-- ============================================
-- 1. Nguoi dung tu doi ten hien thi cua chinh minh (KHONG doi duoc gi khac)
-- ============================================
CREATE OR REPLACE FUNCTION update_own_name(p_full_name TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ho ten khong duoc de trong');
  END IF;

  UPDATE profiles SET full_name = trim(p_full_name) WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 2. QTV/Vien truong tinh khoa hoac mo lai 1 tai khoan
-- ============================================
CREATE OR REPLACE FUNCTION set_account_active(p_user_id UUID, p_active BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_user_id = auth.uid() AND p_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong the tu khoa chinh minh');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role NOT IN ('administrator', 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen khoa/mo tai khoan');
  END IF;

  UPDATE profiles SET is_active = p_active WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong tim thay tai khoan');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
