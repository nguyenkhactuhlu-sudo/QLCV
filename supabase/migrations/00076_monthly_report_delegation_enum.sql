-- Bo sung 2 loai thong bao cho tinh nang "Uy quyen xem/xuat bao cao tong
-- hop thang" (yeu cau nguoi dung 2026-09-09). Rieng file nay CHI them enum
-- value (theo dung nguyen tac an toan da ap dung tu truoc - ALTER TYPE ADD
-- VALUE phai tach rieng, khong gop chung DDL/DML khac trong cung 1
-- migration/transaction - xem PROJECT_STRUCTURE.md muc 9 bai hoc so 1).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'monthly_report_delegation_granted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'monthly_report_delegation_revoked';
