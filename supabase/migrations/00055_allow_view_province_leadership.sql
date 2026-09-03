-- Migration 00055: Cho phep moi nguoi xem duoc ho so Vien truong/Pho Vien
-- truong tinh (chi ten + vai tro), phuc vu tinh nang moi "Nop cho lanh dao"
-- Ngay: 03/09/2026
--
-- Boi canh: Truong phong/Vien truong khu vuc gio phai chon nop nhat ky cua
-- CHINH HO len cho 1 Pho Vien truong tinh hoac Vien truong tinh (thay vi
-- nop xuong Pho phong cua chinh don vi minh nhu truoc) - xem
-- refreshJournalSubmitToOptions() trong app.js. Nhung RLS hien tai tren
-- bang profiles KHONG co policy nao cho phep 1 unit_head doc duoc ho so
-- cua province_head/province_deputy (cac policy hien co chi cho xem: chinh
-- minh, dong nghiep cung don vi, hoac - voi province_head/administrator -
-- toan bo). Ket qua thuc te: truy van tra ve rong, o "Nop cho lanh dao" cua
-- Truong phong/Vien truong khu vuc khong co ai de chon, chan han viec ghi
-- nhat ky cua chinh ho (o do dang bat buoc phai chon).
--
-- Fix: them 1 policy rieng, CHI mo cho dung 2 vai tro lanh dao cap tinh -
-- day la thong tin cong khai trong noi bo (ai cung biet ai la Vien
-- truong/Pho Vien truong tinh), khong lo lieu nhay cam nao khac trong bang
-- profiles bi anh huong (khong mo rong sang xem duoc ho so cua ai khac).

CREATE POLICY "profiles_select_province_leadership" ON profiles
  FOR SELECT USING (
    role IN ('province_head'::user_role, 'province_deputy'::user_role)
  );
