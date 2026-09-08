-- Bo sung cac loai thong bao con thieu, phat hien khi ra soat toan bo cac
-- RPC thay doi du lieu so voi bang notifications (yeu cau nguoi dung,
-- 2026-09-08): "moi thay doi/chinh sua/them moi... lien quan den nguoi
-- dung deu phai co thong bao". Rieng file nay CHI them enum value (theo
-- dung nguyen tac an toan da ap dung tu truoc - ALTER TYPE ADD VALUE phai
-- tach rieng, khong gop chung DDL/DML khac trong cung 1 migration/transaction).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'score_adjustment_removed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_role_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_scope_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_active_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'leave_acknowledged';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'monthly_self_score_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_due_date_set';
