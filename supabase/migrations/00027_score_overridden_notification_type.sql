-- Migration 00027: Gia tri notification_type moi cho canh bao "cap tren da
-- thay doi diem" (tach rieng, dung cho migration tiep theo)
-- Ngay: 27/08/2026
ALTER TYPE notification_type ADD VALUE 'score_overridden_by_senior';
