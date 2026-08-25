-- Migration 00020: Thang xep loai A/B/C/D ap dung toan he thong + Vien
-- truong tinh tu cham diem, tu xep loai
-- Ngay: 25/08/2026
--
-- Boi canh: theo mau "Thong bao tong hop cham diem" thuc te cua nganh, dong
-- cua Vien truong tinh co "Diem tu cham" va "Xep loai" nhung KHONG co "Diem
-- duoc duyet chinh thuc" - vi Vien truong tinh khong co cap tren trong he
-- thong nay de duyet cho ho. can_approve_monthly() da tra ve false ngay khi
-- p_target_user_id = auth.uid(), nen truoc migration nay khong co duong nao
-- de Vien truong tinh tu xep loai duoc ca. Ngoai ra, nguoi dung yeu cau doi
-- thang xep loai chung cho TOAN BO he thong (khong rieng Vien truong tinh):
-- 90-100 = A, 80-89 = B, 70-79 = C, tu 69 tro xuong = D.

-- ============================================
-- 0. Bo sung RLS: Vien truong tinh duoc XEM (khong ghi) toan bo monthly_reviews
-- ============================================
-- can_approve_monthly() chi cho Vien truong tinh DUYET truc tiep
-- province_deputy/unit_head (dung 1 cap), nen policy "monthly_reviews_select_scope"
-- (dua tren can_approve_monthly) an toan chan luon viec Vien truong tinh XEM
-- diem cua nhung nguoi cach 2 cap tro len (vi du nhan vien). Tinh nang xuat
-- bao cao thang (va man hinh "Cham diem thang" pham vi toan tinh) can Vien
-- truong tinh xem duoc TOAN BO du lieu de tong hop dung thuc te - phai them
-- rieng 1 policy CHI-DOC cho vai tro nay, tach biet voi quyen duyet.
CREATE POLICY "monthly_reviews_select_province_head" ON monthly_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'province_head')
  );

-- ============================================
-- 1. Noi rong thang xep loai: A / B / C / D
-- ============================================
ALTER TABLE monthly_reviews DROP CONSTRAINT IF EXISTS monthly_reviews_classification_check;
ALTER TABLE monthly_reviews ADD CONSTRAINT monthly_reviews_classification_check
  CHECK (classification IN ('A', 'B', 'C', 'D'));

-- ============================================
-- 2. Cap nhat RPC duyet danh gia thang: chap nhan them xep loai D
-- ============================================
CREATE OR REPLACE FUNCTION approve_monthly_review(
  p_user_id UUID,
  p_period VARCHAR,
  p_score NUMERIC,
  p_classification VARCHAR,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reviewer UUID;
  v_existing monthly_reviews%ROWTYPE;
BEGIN
  v_reviewer := auth.uid();
  IF v_reviewer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF NOT public.can_approve_monthly(p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet ho so nay');
  END IF;
  IF p_classification NOT IN ('A', 'B', 'C', 'D') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Xep loai khong hop le');
  END IF;
  IF p_score < 0 OR p_score > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diem chinh thuc phai tu 0 den 100');
  END IF;

  SELECT * INTO v_existing FROM monthly_reviews WHERE user_id = p_user_id AND period = p_period;
  IF v_existing.id IS NOT NULL AND v_existing.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ky danh gia nay da khoa');
  END IF;

  IF v_existing.id IS NOT NULL AND v_existing.self_score IS NOT NULL
     AND abs(p_score - v_existing.self_score) >= 2
     AND (p_note IS NULL OR length(trim(p_note)) = 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can nhap giai trinh khi dieu chinh tu 2 diem tro len so voi tu cham');
  END IF;

  INSERT INTO monthly_reviews (user_id, period, official_score, classification, note, reviewer_id, reviewed_at, status)
  VALUES (p_user_id, p_period, p_score, p_classification, p_note, v_reviewer, now(), 'approved')
  ON CONFLICT (user_id, period) DO UPDATE SET
    official_score = p_score,
    classification = p_classification,
    note = p_note,
    reviewer_id = v_reviewer,
    reviewed_at = now(),
    status = 'approved';

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 3. RPC moi: Vien truong tinh tu cham diem VA tu xep loai (khong co
-- "diem duyet chinh thuc" - khong ai duyet cho ho trong he thong nay)
-- ============================================
CREATE OR REPLACE FUNCTION save_province_head_self_evaluation(
  p_period VARCHAR,
  p_score NUMERIC,
  p_classification VARCHAR
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_role user_role;
  v_existing monthly_reviews%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  IF v_role IS DISTINCT FROM 'province_head' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chi Vien truong tinh moi tu xep loai duoc');
  END IF;
  IF p_classification NOT IN ('A', 'B', 'C', 'D') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Xep loai khong hop le');
  END IF;
  IF p_score < 0 OR p_score > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diem tu cham phai tu 0 den 100');
  END IF;

  SELECT * INTO v_existing FROM monthly_reviews WHERE user_id = v_user_id AND period = p_period;
  IF v_existing.id IS NOT NULL AND v_existing.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ky danh gia nay da khoa');
  END IF;

  INSERT INTO monthly_reviews (user_id, period, self_score, classification, reviewer_id, reviewed_at, status)
  VALUES (v_user_id, p_period, p_score, p_classification, v_user_id, now(), 'approved')
  ON CONFLICT (user_id, period) DO UPDATE SET
    self_score = p_score,
    classification = p_classification,
    reviewer_id = v_user_id,
    reviewed_at = now(),
    status = 'approved';

  RETURN jsonb_build_object('success', true);
END;
$$;
