-- Migration 00057: Them cot cho co che "nhan ban theo khoang ngay" - dung
-- chung cho 2 tinh nang: (1) cong viec keo dai nhieu ngay, (2) nghi phep.
-- Ngay: 05/09/2026
--
-- Thiet ke: van giu dung "1 dong = 1 ngay" (khong doi sang luu khoang ngay
-- tren 1 dong duy nhat) vi cau truc nay dang duoc dung khap noi (Tong
-- quan, Nhat ky cong tac cua don vi, Cham diem thang, hang cho duyet). Khi
-- 1 nguoi ghi 1 viec/1 dot nghi phep keo dai nhieu ngay, he thong tao
-- DUNG 1 dong "goc" luc gui (mang them range_start_date), va CHI sau khi
-- da xu ly xong dong goc (lanh dao da duyet+cham diem, hoac da xac nhan
-- nghi phep) moi tu sinh them cac dong "nhan ban" cho tung ngay con lai -
-- nho vay hang cho duyet/chuong thong bao khong bao gio bi nhan N lan cho
-- cung 1 viec (ca hai deu lay truc tiep tu so dong status='pending').
--
-- is_clone=true danh dau day la dong tu sinh (khong phai dong nguoi dung
-- tuc tiep ghi) - dung de LOAI RA khoi moi noi dang cong don theo thang
-- (tong do phuc tap, so luong nhat ky...) de 1 viec keo dai 5 ngay khong
-- bi tinh nang gap 5 lan so voi viec y het lam trong 1 ngay - trong khi
-- van hien du o moi noi liet ke theo ngay (Nhat ky cong tac cua don vi,
-- Nhat ky cua toi) de dung la thay ngay nao cung co lam viec do.

ALTER TABLE work_logs ADD COLUMN range_start_date DATE;
ALTER TABLE work_logs ADD COLUMN is_clone BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE work_logs ADD COLUMN clone_group_id UUID REFERENCES work_logs(id) ON DELETE CASCADE;

-- Rang buoc an toan: khoang ngay phai hop le va khong qua dai (chan nham
-- lan nhap khoang qua lon, vi du go nham nam thay vi ngay).
ALTER TABLE work_logs ADD CONSTRAINT chk_work_logs_range_valid
  CHECK (range_start_date IS NULL OR range_start_date <= log_date);
ALTER TABLE work_logs ADD CONSTRAINT chk_work_logs_range_max_60_days
  CHECK (range_start_date IS NULL OR log_date - range_start_date <= 60);

CREATE INDEX idx_work_logs_clone_group_id ON work_logs(clone_group_id) WHERE clone_group_id IS NOT NULL;

-- Danh muc rieng "Nghi phep" - dung field is_leave de giao dien nhan biet
-- day la nhat ky khong can cham diem (chi can lanh dao xac nhan da biet).
ALTER TABLE work_categories ADD COLUMN is_leave BOOLEAN NOT NULL DEFAULT false;

INSERT INTO work_categories (code, name, sort_order, is_active, is_leave)
VALUES ('NGHI_PHEP', 'Nghỉ phép', 99, true, true)
ON CONFLICT (code) DO UPDATE SET is_leave = true, is_active = true, name = EXCLUDED.name;
