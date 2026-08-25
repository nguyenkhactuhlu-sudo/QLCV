-- Migration 00022: Ghi chu tu do khong gan ngay ("sticky notes")
-- Ngay: 25/08/2026
--
-- Boi canh: bo sung cho "personal_notes" (migration 00021) - danh cho viec
-- KHONG co han cu the, khong gan vao 1 ngay nao tren lich. Cung khuon rieng
-- tu tuyet doi: 1 policy duy nhat, khong co ngoai le cho lanh dao/QTV.

CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  width INTEGER NOT NULL DEFAULT 220,
  height INTEGER NOT NULL DEFAULT 160,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Khong co RPC: CRUD di thang qua REST, cung ly do nhu personal_notes
-- (khong co logic phan quyen nhieu cap).
CREATE POLICY "sticky_notes_owner_all" ON sticky_notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
