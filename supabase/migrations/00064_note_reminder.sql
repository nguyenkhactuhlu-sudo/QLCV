-- Migration 00064: Nhac han ghi chu cong viec qua chuong thong bao.
-- Ngay: 06/09/2026
--
-- Ghi chu ca nhan (personal_notes) truoc gio chi co ngay, khong co gio -
-- khong du de nhac theo GIO cu the ("truoc 2 tieng" v.v. theo yeu cau).
-- Them 2 cot khong bat buoc:
-- - due_time: gio han chot trong ngay (neu bo trong, client tinh mac
--   dinh la cuoi ngay 23:59 khi tinh thoi diem can nhac - xem
--   fetchNotifications() trong production/app.js).
-- - remind_before_minutes: so phut muon duoc nhac TRUOC han (null = khong
--   nhac). Tinh toan thoi diem can nhac hoan toan o phia client, tai lai
--   moi lan mo chuong thong bao (giong het co che "viec giao qua han" da
--   co san) - khong can them tac vu chay nen/cron rieng.

ALTER TABLE personal_notes
  ADD COLUMN IF NOT EXISTS due_time TIME,
  ADD COLUMN IF NOT EXISTS remind_before_minutes INTEGER;
