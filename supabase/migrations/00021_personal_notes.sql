-- Migration 00021: Ghi chu cong viec ca nhan (lich thang + ghi chu chi tiet)
-- Ngay: 25/08/2026
--
-- Boi canh: cong cu lap ke hoach ca nhan, tach biet hoan toan khoi
-- "work_logs" (viec DA lam de cham diem). Rieng tu tuyet doi - chi 1 policy
-- duy nhat (user_id = auth.uid()), khong co ngoai le cho lanh dao/QTV nhu
-- cac bang khac trong he thong.

CREATE TABLE personal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX personal_notes_user_date_idx ON personal_notes(user_id, note_date);

ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;

-- Khong co RPC: CRUD di thang qua REST vi khong co logic phan quyen nhieu
-- cap nhu work_logs/monthly_reviews - policy nay la du.
CREATE POLICY "personal_notes_owner_all" ON personal_notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
