-- Migration 00007: Bo sung RLS con thieu cho unit_assignments
-- Ngay: 24/08/2026
-- Bang unit_assignments da bat RLS tu migration 00001 nhung chua co policy nao,
-- nen khong ai doc duoc kem ca chinh minh. Can cho Pho Vien truong tinh xem duoc
-- danh sach don vi minh duoc phan cong de xet quyen cham diem.

CREATE POLICY "unit_assignments_select_own" ON unit_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "unit_assignments_select_leaders" ON unit_assignments
  FOR SELECT USING (
    public.user_role() IN ('province_head'::user_role, 'administrator'::user_role)
  );

CREATE POLICY "unit_assignments_admin_all" ON unit_assignments
  FOR ALL USING (public.user_role() = 'administrator'::user_role);
