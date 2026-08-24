-- Migration 00013: Gan vai tro/don vi that cho tai khoan (RPC rieng)
-- Ngay: 24/08/2026
--
-- Cho phep Vien truong tinh / Quan tri vien "sap xep" tai khoan ngay trong
-- tab Co cau to chuc: chi dinh vai tro va don vi that, dong thoi kich hoat
-- luon neu tai khoan dang cho xac nhan. Dung RPC (SECURITY DEFINER) thay vi
-- sua truc tiep bang profiles qua PostgREST, vi da phat hien sua truc tiep
-- bang profiles bi xung dot ngam voi cach kiem tra quyen public.user_role()
-- (xem migration 00012).

-- Cap nhat luon dieu kien trong trigger check_profile_update (migration
-- 00004): truoc chi cho phep 'administrator' doi role/unit_id, gio RPC ben
-- duoi cung cho phep 'province_head' thao tac nen trigger phai khop theo,
-- neu khong se tu chan chinh RPC nay khi Vien truong tinh goi.
CREATE OR REPLACE FUNCTION check_profile_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.unit_id IS DISTINCT FROM OLD.unit_id
  ) AND (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('administrator', 'province_head') AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Only administrators or province head can change role or unit';
  END IF;

  RETURN NEW;
END;
$$;

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
