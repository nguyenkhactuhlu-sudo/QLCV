-- Migration 00009: Dang ky tai khoan bang ma don vi, co chan that o database
-- Ngay: 24/08/2026
--
-- Yeu cau nghiep vu (theo trao doi voi nguoi phu trach):
-- - Moi ma dang ky gan voi 1 don vi, dung nhieu lan, QTV bat/tat khi can.
-- - Ma sai/het han -> KHONG tao duoc tai khoan nao ca (khong phai tao ra roi
--   xoa) - phai chan ngay trong buoc dang ky, o phia database vi phia trinh
--   duyet khong the ngan nguoi co y dinh xau tu goi thang API.
-- - Ma dung -> tai khoan duoc tao, dang nhap duoc, nhung o trang thai CHUA
--   KICH HOAT (is_active=false) cho toi khi QTV doi chieu va xac nhan. Trong
--   luc chua kich hoat, khong doc/ghi duoc du lieu nghiep vu that.
-- - Nguoi tu dang ky khong duoc tu chon vai tro lanh dao hay don vi khac -
--   luon la 'staff' va dung don vi gan voi ma.

-- ============================================
-- 1. Bo sung so lan da dung cho ma (chi de theo doi, khong gioi han)
-- ============================================
ALTER TABLE registration_codes ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- 2. RPC cong khai: kiem tra ma truoc khi dang ky (khong can dang nhap)
--    Chi de goi y giao dien; cong chan that su nam o trigger ben duoi.
-- ============================================
CREATE OR REPLACE FUNCTION check_registration_code(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code registration_codes%ROWTYPE;
  v_unit units%ROWTYPE;
BEGIN
  SELECT * INTO v_code FROM registration_codes
    WHERE code = p_code AND is_active = true
      AND (expires_at IS NULL OR expires_at > now());
  IF v_code.id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  SELECT * INTO v_unit FROM units WHERE id = v_code.unit_id;
  RETURN jsonb_build_object('valid', true, 'unit_name', COALESCE(v_unit.short_name, v_unit.code));
END;
$$;

GRANT EXECUTE ON FUNCTION check_registration_code(TEXT) TO anon, authenticated;

-- ============================================
-- 3. Trigger tao ho so: bat buoc ma hop le neu la tu dang ky, huy toan bo
--    viec tao tai khoan neu ma sai/het han/bi khoa
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code_text TEXT;
  v_code registration_codes%ROWTYPE;
  v_unit_id UUID;
  v_role user_role;
  v_full_name TEXT;
BEGIN
  v_code_text := NEW.raw_user_meta_data->>'registration_code';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF v_code_text IS NOT NULL THEN
    -- Tu dang ky bang ma don vi
    SELECT * INTO v_code FROM registration_codes
      WHERE code = v_code_text AND is_active = true
        AND (expires_at IS NULL OR expires_at > now());
    IF v_code.id IS NULL THEN
      RAISE EXCEPTION 'Ma dang ky khong hop le hoac da het han';
    END IF;

    INSERT INTO public.profiles (id, full_name, role, unit_id, is_active)
    VALUES (NEW.id, v_full_name, 'staff'::user_role, v_code.unit_id, false);

    UPDATE registration_codes SET use_count = use_count + 1 WHERE id = v_code.id;
  ELSE
    -- Tao boi quan tri vien (qua Dashboard hoac cong cu quan tri), tin tuong
    -- truc tiep theo metadata duoc khai bao luc tao, kich hoat ngay
    v_unit_id := (NEW.raw_user_meta_data->>'unit_id')::UUID;
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'::user_role);
    IF v_unit_id IS NULL THEN
      SELECT id INTO v_unit_id FROM units ORDER BY created_at LIMIT 1;
    END IF;

    INSERT INTO public.profiles (id, full_name, role, unit_id, is_active)
    VALUES (NEW.id, v_full_name, v_role, v_unit_id, true);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 4. Cho tai khoan chua kich hoat khong doc/ghi duoc du lieu nghiep vu that
--    public.user_role() da duoc dung boi rat nhieu policy khac (migration
--    00006, 00007, 00008) nen chi can sua 1 cho nay la chan duoc tat ca
--    policy dang kiem tra theo vai tro.
-- ============================================
CREATE OR REPLACE FUNCTION public.user_role() RETURNS user_role
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND is_active = true;
$$;

-- work_logs_select_unit va work_logs_insert_staff khong di qua public.user_role(),
-- phai sua truc tiep de tai khoan chua kich hoat khong doc/ghi duoc nhat ky
-- cua don vi minh vua khai khi dang ky.
DROP POLICY IF EXISTS "work_logs_select_unit" ON work_logs;
CREATE POLICY "work_logs_select_unit" ON work_logs
  FOR SELECT USING (
    unit_id IN (SELECT p.unit_id FROM profiles p WHERE p.id = auth.uid() AND p.is_active = true)
  );

DROP POLICY IF EXISTS "work_logs_insert_staff" ON work_logs;
CREATE POLICY "work_logs_insert_staff" ON work_logs
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "work_logs_update_own" ON work_logs;
CREATE POLICY "work_logs_update_own" ON work_logs
  FOR UPDATE USING (
    author_id = auth.uid()
    AND status IN ('pending', 'revision')
    AND is_locked = false
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );
