-- Migration 00010: Vam nghiem trong - chan tu nang quyen luc dang ky
-- Ngay: 24/08/2026
--
-- Loi: migration 00009 phan biet "dang ky cong khai" va "duoc quan tri vien
-- tao" chi dua vao viec metadata co gui "registration_code" hay khong - day
-- la thu nguoi goi API tu quyet dinh duoc, khong xac thuc duoc thuc su ai la
-- nguoi tao tai khoan. Ke tan cong co the tu goi API dang ky, khong gui ma,
-- nhung khai "role":"administrator" trong metadata va duoc tin ngay.
--
-- Sua: tai khoan MOI TAO, du di duong nao, LUON la staff va CHUA KICH HOAT.
-- Muon co quyen cao hon hoac kich hoat ngay, quan tri vien phai tu tay nang
-- quyen sau do bang thao tac rieng (da duoc RLS/trigger kiem tra quyen o
-- migration 00004 va 00006), khong con duong nao tin truc tiep vao metadata
-- luc dang ky nua.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code_text TEXT;
  v_code registration_codes%ROWTYPE;
  v_unit_id UUID;
  v_full_name TEXT;
BEGIN
  v_code_text := NEW.raw_user_meta_data->>'registration_code';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF v_code_text IS NOT NULL THEN
    SELECT * INTO v_code FROM registration_codes
      WHERE code = v_code_text AND is_active = true
        AND (expires_at IS NULL OR expires_at > now());
    IF v_code.id IS NULL THEN
      RAISE EXCEPTION 'Ma dang ky khong hop le hoac da het han';
    END IF;
    v_unit_id := v_code.unit_id;
    UPDATE registration_codes SET use_count = use_count + 1 WHERE id = v_code.id;
  ELSE
    SELECT id INTO v_unit_id FROM units ORDER BY created_at LIMIT 1;
  END IF;

  -- Khong bao gio tin "role" nguoi goi tu gui len trong metadata luc dang ky.
  INSERT INTO public.profiles (id, full_name, role, unit_id, is_active)
  VALUES (NEW.id, v_full_name, 'staff'::user_role, v_unit_id, false);

  RETURN NEW;
END;
$$;
