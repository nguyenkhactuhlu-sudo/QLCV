-- Migration 00039: Chuan bi schema cho 2 thay doi lon
-- (1) Nhat ky duoc "nop cho" dich danh 1 lanh dao cu the (thay cho uy
--     quyen theo danh sach nguoi cu the) - them work_logs.submitted_to_id.
-- (2) Giao viec cho nhieu nguoi cung luc (1 chu tri + N phoi hop) va han
--     hoan thanh chinh xac den gio:phut - them task_group_id/work_role,
--     doi kieu cot han tu DATE sang TIMESTAMPTZ.
-- Ngay: 28/08/2026
--
-- Chi them cot/doi kieu (khong dung enum moi), an toan chay 1 lan.

ALTER TABLE work_logs ADD COLUMN submitted_to_id UUID REFERENCES profiles(id);

ALTER TABLE task_assignments ADD COLUMN task_group_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE task_assignments ADD COLUMN work_role VARCHAR(50) NOT NULL DEFAULT 'chu_tri' CHECK (work_role IN ('chu_tri', 'phoi_hop'));
ALTER TABLE task_assignments ALTER COLUMN suggested_due_date TYPE TIMESTAMPTZ USING suggested_due_date::timestamptz;
ALTER TABLE task_assignments ALTER COLUMN actual_due_date TYPE TIMESTAMPTZ USING actual_due_date::timestamptz;

CREATE INDEX idx_task_assignments_group_id ON task_assignments(task_group_id);
CREATE INDEX idx_work_logs_submitted_to_id ON work_logs(submitted_to_id);
