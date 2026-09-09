-- Migration 00078: Sua lo hong that su o uy quyen "thay mat 100% toan
-- tinh" (bang delegations, migration 00043/00061/00041) - Pho Vien truong
-- tinh dang duoc uy quyen (has_active_delegation()=true) VAN KHONG doc
-- duoc work_logs/profiles cua cac don vi khac don vi lanh dao tinh, du
-- client (fetchDashboardScopeProfiles/fetchMonthlyScopeProfiles) da viet
-- theo dung y "duoc uy quyen thi xem toan tinh nhu Vien truong".
-- Ngay: 2026-09-09
--
-- Nguyen nhan goc: work_logs_select_province/profiles_select_province_
-- scope (2 policy quyet dinh pham vi "toan tinh") chi kiem tra dung
-- user_role()='province_head' (migration 00016) - chua bao gio co dieu
-- kien nao cho truong hop province_deputy dang co has_active_delegation().
-- can_manage_person/can_approve_monthly (2 ham quyet dinh AI duyet/sua
-- diem AI) co check dieu kien nay dung tu truoc (migration 00061) - chi
-- rieng tang doc DU LIEU THO (RLS SELECT) la bi thieu, nen truoc gio hau
-- qua la: nguoi dung/danh sach hien ra co the dung, nhung so lieu nhat ky/
-- diem cua nguoi o don vi khac se im lang tra ve rong (khong loi, PostgREST
-- van tra HTTP 200 kem mang rong khi RLS loc het), de bi hieu nham la
-- "chua co du lieu" thay vi "khong doc duoc du lieu".
--
-- Phat hien tinh co trong luc kiem tra tinh nang "Uy quyen xem/xuat bao
-- cao tong hop thang" (migration 00077) - khong lien quan truc tiep nhung
-- la loi that, sua luon theo yeu cau nguoi dung.

DROP POLICY IF EXISTS "work_logs_select_province" ON work_logs;
CREATE POLICY "work_logs_select_province" ON work_logs
  FOR SELECT USING (
    public.user_role() = 'province_head'::user_role
    OR (public.user_role() = 'province_deputy'::user_role AND public.has_active_delegation())
    OR public.has_active_monthly_report_delegation()
  );

DROP POLICY IF EXISTS "profiles_select_province_scope" ON profiles;
CREATE POLICY "profiles_select_province_scope" ON profiles
  FOR SELECT USING (
    user_role() = ANY (ARRAY['province_head'::user_role, 'administrator'::user_role])
    OR (user_role() = 'province_deputy'::user_role AND public.has_active_delegation())
    OR public.has_active_monthly_report_delegation()
  );

-- monthly_reviews_select_province_head co cung lo hong (chi kiem tra
-- role='province_head' theo nghia den) - bo sung dieu kien tuong tu.
DROP POLICY IF EXISTS "monthly_reviews_select_province_head" ON monthly_reviews;
CREATE POLICY "monthly_reviews_select_province_head" ON monthly_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'province_head'::user_role)
    OR (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'province_deputy'::user_role)
      AND public.has_active_delegation()
    )
  );
