-- Migration 00037: Them loai thong bao cho su kien xoa nhat ky
-- Ngay: 28/08/2026
--
-- Chi 1 lenh ALTER TYPE, tach rieng khoi migration dung gia tri nay (dung
-- quy tac - xem bai hoc that su tu migration 00025/00035/00036).
ALTER TYPE notification_type ADD VALUE 'work_log_deleted_by_leader';
