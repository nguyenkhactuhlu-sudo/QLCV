-- Migration 00025: Can bo tu cham diem tung viec (cot moi + gia tri
-- notification moi cho canh bao chenh lech)
-- Ngay: 27/08/2026
--
-- Boi canh: truoc day chi lanh dao cham diem tung nhat ky (complexity_score/
-- quality_score), can bo khong tu de xuat diem. Nay them 2 cot tu cham de
-- can bo de xuat ngay khi nop nhat ky, lanh dao xem lam can cu roi quyet
-- dinh dong y hoac cham khac (theo dung co che yeu cau nhan xet da co, khong
-- them luat moi). Them 1 gia tri notification_type moi de dung cho canh bao
-- "qua 3 lan/thang" o migration tiep theo (phai tach rieng theo dung quy tac
-- ALTER TYPE ... ADD VALUE khong dung chung transaction voi noi dung dung
-- gia tri do).
ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS self_complexity_score INTEGER
  CHECK (self_complexity_score >= 1 AND self_complexity_score <= 10);
ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS self_quality_score INTEGER
  CHECK (self_quality_score >= 1 AND self_quality_score <= 10);

ALTER TYPE notification_type ADD VALUE 'score_override_escalation';
