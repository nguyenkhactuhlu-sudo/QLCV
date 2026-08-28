-- Migration 00036: Vet lai gia tri enum bi thieu (ghi nhan su co, xem 00035)
-- Ngay: 28/08/2026
--
-- Phan con lai cua migration 00025 bi rollback chung voi 2 cot tu cham diem
-- (xem giai thich day du o migration 00035). Tach rieng dung quy tac.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'score_override_escalation';
