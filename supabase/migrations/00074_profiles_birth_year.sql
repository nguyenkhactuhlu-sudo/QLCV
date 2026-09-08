-- Them nam sinh vao ho so ca nhan - hien thi cung chuc vu/chuc danh (title/
-- professional_title da co san) tren cac man hinh lanh dao hay xem, de nam
-- bat so bo thong tin nguoi duoi quyen (yeu cau nguoi dung, 2026-09-08).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_year INTEGER;
COMMENT ON COLUMN profiles.birth_year IS 'Nam sinh - hien thi tren cac man hinh danh sach nguoi cho lanh dao (nhat ky don vi, cham diem thang, co cau to chuc, giao viec).';
