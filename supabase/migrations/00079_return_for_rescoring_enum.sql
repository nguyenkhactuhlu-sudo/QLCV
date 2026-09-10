-- Bo sung 2 loai thong bao cho tinh nang "Tra de cham diem lai" (yeu cau
-- nguoi dung 2026-09-10). Rieng file nay CHI them enum value (theo dung
-- nguyen tac an toan da ap dung tu truoc - ALTER TYPE ADD VALUE phai tach
-- rieng, khong gop chung DDL/DML khac trong cung 1 migration/transaction -
-- xem PROJECT_STRUCTURE.md muc 9 bai hoc so 1).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'work_log_returned_for_rescoring';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'work_log_returned_for_rescoring_author_notice';
