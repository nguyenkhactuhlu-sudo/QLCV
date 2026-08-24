-- Migration 00016: Vam nghiem trong - profiles_select_own dang mo cho tat ca
-- Ngay: 24/08/2026
--
-- Phat hien: policy "profiles_select_own" tren bang profiles dang co dieu
-- kien KHAC voi thiet ke ban dau trong migration 00002 (id = auth.uid()) -
-- kiem tra truc tiep tren du lieu that cho thay dieu kien nay khong khop,
-- khien BAT KY tai khoan da dang nhap nao cung doc duoc TOAN BO ho so nguoi
-- dung trong he thong, bo qua toan bo cac gioi han pham vi da thiet lap o
-- migration 00006 va 00014. Khong ro nguyen nhan thay doi (co the do thao
-- tac thu qua giao dien Policies cua Supabase truoc do). Sua lai dung nhu
-- thiet ke ban dau.

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Phat hien them: policy "profiles_admin_all" (migration 00006) cung da bien
-- mat khoi database, khong nam trong bat ky migration nao tung xoa no. Tao
-- lai cho dung thiet ke ban dau.
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

-- Theo dung xac nhan cua nguoi phu trach: QTV chi quan ly tai khoan/quyen
-- han, KHONG duoc xem noi dung nghiep vu (nhat ky cong viec). Truoc gio
-- work_logs_select_province (migration 00002) cho ca administrator doc duoc
-- toan bo nhat ky - bo administrator ra, chi con Vien truong tinh.
DROP POLICY IF EXISTS "work_logs_select_province" ON work_logs;

CREATE POLICY "work_logs_select_province" ON work_logs
  FOR SELECT USING (
    public.user_role() = 'province_head'::user_role
  );
