-- Migration 00069: them 3 gia tri enum thong bao lien quan Giao viec
-- (task_assigned/task_unassigned/task_updated) - PHAI la migration
-- RIENG, khong gop DDL/DML khac (ALTER TYPE ... ADD VALUE khong duoc
-- chay chung transaction voi cau lenh khac, dung bai hoc da rut ra tu
-- cac migration truoc - 00058/00065).
-- Ngay: 2026-09-07

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_unassigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_updated';
