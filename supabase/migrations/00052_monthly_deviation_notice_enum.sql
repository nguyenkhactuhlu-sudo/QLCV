-- Migration 00052: Them gia tri enum moi cho notification_type
-- Ngay: 30/08/2026
--
-- Migration 00051 dung type moi 'monthly_score_deviation_notice' - PHAI la
-- 1 migration RIENG (khong duoc chung transaction voi cho DUNG gia tri
-- nay) - dung quy tac da ap dung cho cac gia tri enum truoc (xem migration
-- 00025, 00027, 00033, 00037, 00050).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'monthly_score_deviation_notice';
