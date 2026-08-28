-- Migration 00035: Vet lai 2 cot tu cham diem bi thieu (ghi nhan su co)
-- Ngay: 28/08/2026
--
-- Boi canh: migration 00025 da gop chung "ALTER TABLE work_logs ADD COLUMN"
-- voi "ALTER TYPE notification_type ADD VALUE" trong CUNG 1 lan chay. Theo
-- dung quy tac Postgres, "ALTER TYPE ... ADD VALUE" khong duoc chay chung
-- transaction voi lenh khac - toan bo migration 00025 bi Postgres tu huy
-- (rollback) ma khong ai de y, khien self_complexity_score/self_quality_score
-- CHUA TUNG thuc su ton tai trong database that, du giao dien van hien thi
-- binh thuong tu do den gio. Loi duoc phat hien khi nguoi dung bao "loi HTTP
-- 400 khi bam gui nhat ky" - tai hien bang tai khoan that xac nhan dung la
-- "column work_logs.self_complexity_score does not exist" (Postgres 42703).
--
-- Migration nay chi chua ALTER TABLE (an toan de chay lai nhieu lan nho
-- IF NOT EXISTS) - phan ALTER TYPE duoc tach rieng sang migration 00036
-- dung theo quy tac, khong lap lai loi cu.
ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS self_complexity_score INTEGER
  CHECK (self_complexity_score >= 1 AND self_complexity_score <= 10);
ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS self_quality_score INTEGER
  CHECK (self_quality_score >= 1 AND self_quality_score <= 10);
