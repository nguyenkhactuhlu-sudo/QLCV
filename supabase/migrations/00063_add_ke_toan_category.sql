-- Migration 00063: Bo sung linh vuc cong tac "Ke toan" - don vi nao cung
-- co cong viec ke toan, truoc day chua co danh muc rieng cho no (phai
-- ghi tam vao "Cong tac khac").
-- Chen vao gan cuoi danh sach (sau cac linh vuc nghiep vu chinh, truoc
-- "Cong tac khac") - day lui 3 danh muc con lai +1 sort_order de "Cong
-- tac khac" van la muc cuoi cung (catch-all).
-- Ngay: 06/09/2026

UPDATE work_categories SET sort_order = 12 WHERE code = 'CONG_TAC_KHAC';
UPDATE work_categories SET sort_order = 11 WHERE code = 'QUAN_LY_CHI_DAO_DIEU_HANH';
UPDATE work_categories SET sort_order = 10 WHERE code = 'CONG_TAC_DANG_DOAN_THE';

INSERT INTO work_categories (code, name, sort_order, is_active) VALUES
  ('KE_TOAN', 'Kế toán', 9, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = true;
