-- Migration 00019: Sua loi RLS tu tham chieu khien Truong/Pho phong (va Pho
-- Vien truong don vi co uy quyen) khong tra duoc ho so dong nghiep cung don
-- vi - lam hang cho duyet ("Duyet & cham diem") luon trong vi khong doi
-- chieu duoc ho so tac gia (fetchReviewQueue can profiles?id=in.(...)).
-- Ngay: 24/08/2026
--
-- Loi: policy "profiles_select_unit" (tao o migration 00002, giu nguyen o
-- 00006) dung subquery truc tiep ngay trong policy cua chinh bang profiles:
--   unit_id IN (SELECT p.unit_id FROM profiles p WHERE p.id = auth.uid())
-- Day la lop loi tu-tham-chieu giong het loi da gap va sua bang ham
-- SECURITY DEFINER "public.user_role()" (migration 00006) - Postgres danh
-- gia lai RLS cho chinh subquery do, dan den ket qua khong on dinh (kiem
-- chung thuc te: Truong phong khong thay duoc ho so nhan vien cung phong).
--
-- Fix: dung ham SECURITY DEFINER de lay don vi cua chinh nguoi goi (bo qua
-- RLS khi tra cuu), roi dung ham do trong policy thay vi subquery truc tiep.

CREATE OR REPLACE FUNCTION public.my_unit_id() RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT unit_id FROM profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "profiles_select_unit" ON profiles;
CREATE POLICY "profiles_select_unit" ON profiles
  FOR SELECT USING (
    unit_id = public.my_unit_id()
  );
