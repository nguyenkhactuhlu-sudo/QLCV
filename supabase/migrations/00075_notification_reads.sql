-- Bang luu trang thai "da doc" cua tung thong bao THEO NGUOI DUNG, dong bo
-- qua nhieu thiet bi/trinh duyet (truoc day chi luu trong localStorage cua
-- tung may/trinh duyet, khong dong bo duoc dien thoai <-> may tinh - loi
-- nguoi dung bao cao 2026-09-09).
--
-- notification_key la CHINH chuoi id da duoc client tu sinh san trong
-- fetchNotifications() (production/app.js) - vd 'db-<uuid>' (tu bang
-- notifications that), 'review-<uuid>-<created_at>' (hang cho duyet),
-- 'task-overdue-assignee-<uuid>'/'task-overdue-assigner-<uuid>' (viec qua
-- han), 'note-overdue-<uuid>'/'note-reminder-<uuid>' (nhac han ghi chu),
-- 'revision-<uuid>-<reviewed_at>' (nhat ky can bo sung) - dung lam khoa,
-- KHONG can doi cach sinh id hien co o client. Nhieu loai thong bao trong
-- so nay chi duoc tinh toan tam thoi tu cac bang khac (khong co dong rieng
-- trong bang `notifications`), nen dung 1 bang rieng, chung cho MOI loai,
-- thay vi chi dua vao cot is_read co san cua bang `notifications` (chi phu
-- duoc 1 phan cac loai thong bao).
CREATE TABLE notification_reads (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_key)
);

CREATE INDEX idx_notification_reads_user ON notification_reads(user_id);

ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Chi tu doc/tu ghi trang thai da doc cua CHINH minh - khong ai xem/sua
-- duoc trang thai da doc cua nguoi khac.
CREATE POLICY "notification_reads_select_own" ON notification_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_reads_insert_own" ON notification_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE notification_reads IS 'Trang thai da doc tung thong bao theo nguoi dung, dong bo qua nhieu thiet bi (thay the localStorage truoc day).';
