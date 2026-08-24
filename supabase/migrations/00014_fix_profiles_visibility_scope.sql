-- Migration 00014: Thu hep pham vi xem ho so nguoi dung (profiles) dung theo cap
-- Ngay: 24/08/2026
--
-- Loi: policy "profiles_select_unit_leaders" (migration 00006) cho phep bat
-- ky ai co vai tro lanh dao (province_head, province_deputy, unit_head,
-- administrator) xem duoc TOAN BO ho so trong he thong, khong phan biet
-- pham vi phu trach - vi du 1 Truong phong o Phong 1 xem duoc ho so cua
-- VKSND Khu vuc 9. Chi Vien truong tinh va Quan tri vien la thuc su can xem
-- toan tinh; Pho Vien truong tinh chi nen xem dung cac don vi duoc phan
-- cong; Truong/Pho phong da duoc xem dung don vi minh qua policy
-- "profiles_select_unit" co san (migration 00002), khong can them quyen gi.

DROP POLICY IF EXISTS "profiles_select_unit_leaders" ON profiles;

-- Chi Vien truong tinh va Quan tri vien duoc xem toan bo (dung pham vi toan tinh)
CREATE POLICY "profiles_select_province_scope" ON profiles
  FOR SELECT USING (
    public.user_role() IN ('province_head'::user_role, 'administrator'::user_role)
  );

-- Pho Vien truong tinh chi xem duoc ho so trong cac don vi duoc phan cong
CREATE POLICY "profiles_select_assigned" ON profiles
  FOR SELECT USING (
    unit_id IN (SELECT ua.unit_id FROM unit_assignments ua WHERE ua.user_id = auth.uid())
  );
