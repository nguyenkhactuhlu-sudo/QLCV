-- Migration 00047: Cho phep service_role qua duoc trigger check_profile_update
-- Ngay: 30/08/2026
--
-- Boi canh: Edge Function moi `admin-manage-users` (tao tai khoan moi tren
-- UI Quan tri, thay cho viet SQL tay - xem PROJECT_STRUCTURE.md) tu no da
-- xac thuc DOC LAP nguoi goi that su la administrator/province_head dang
-- hoat dong (qua anon key + JWT cua chinh ho, truoc khi dung service role).
-- Nhung sau do no dung client SERVICE ROLE de UPDATE profiles (gan
-- role/unit_id cho tai khoan vua tao) - luc nay khong con auth.uid() cua
-- nguoi dung that (service role khong dai dien 1 nguoi dung cu the), nen
-- trigger check_profile_update() (migration 00013) tu choi voi loi "Only
-- administrators or province head can change role or unit", du quyen han
-- da duoc kiem tra dung o tang Edge Function.
--
-- Sua: cho phep them truong hop auth.role() = 'service_role' di qua thang -
-- an toan vi day la request tu SERVICE ROLE KEY, chi Edge Function tu viet
-- (giu secret rieng, khong lo ra client) moi co, va Edge Function da tu
-- kiem tra quyen truoc khi toi day.
CREATE OR REPLACE FUNCTION check_profile_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.unit_id IS DISTINCT FROM OLD.unit_id
  ) AND (
    auth.role() != 'service_role'
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
