-- Migration 00065: Them gia tri enum moi cho notification_type
-- Ngay: 06/09/2026
--
-- Migration 00066 se dung type moi 'score_adjustment_added' - PHAI la 1
-- migration RIENG (khong duoc chung transaction voi noi DUNG gia tri nay,
-- neu khong Postgres se am tham rollback ca migration - da tung gay mat
-- du lieu that o migration 00025, xem bai hoc so 1 trong PROJECT_STRUCTURE.md)
-- - dung quy tac da ap dung cho cac gia tri enum truoc (xem migration
-- 00025, 00027, 00033, 00037, 00050, 00052).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'score_adjustment_added';
