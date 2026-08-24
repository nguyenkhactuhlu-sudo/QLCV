-- Migration 00008: Hoan thien danh gia thang theo dung quy dinh noi bo nganh
-- Ngay: 24/08/2026
--
-- Boi canh: bang monthly_reviews da bat RLS tu migration 00001 nhung chua co
-- policy nao (khong ai doc/ghi duoc). Cau truc cot ban dau dung cap diem
-- phuc tap/chat luong (giong nhat ky) la SAI - theo quy dinh noi bo nganh,
-- danh gia THANG phai cham theo thang diem 0-100 kem xep loai A/B/C (rieng
-- biet voi cach cham TUNG viec le theo phuc tap/chat luong). Migration nay
-- sua lai dung cau truc do.

-- ============================================
-- 1. Doi cot diem thang tu cap phuc tap/chat luong sang 1 diem 0-100
-- ============================================
ALTER TABLE monthly_reviews DROP COLUMN IF EXISTS self_complexity_score;
ALTER TABLE monthly_reviews DROP COLUMN IF EXISTS self_quality_score;
ALTER TABLE monthly_reviews DROP COLUMN IF EXISTS official_complexity_score;
ALTER TABLE monthly_reviews DROP COLUMN IF EXISTS official_quality_score;

ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS self_score NUMERIC(5,2)
  CHECK (self_score >= 0 AND self_score <= 100);
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS official_score NUMERIC(5,2)
  CHECK (official_score >= 0 AND official_score <= 100);
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved'));

-- ============================================
-- 2. Sua lai thang xep loai cho dung quy dinh noi bo: A / B / C
-- ============================================
ALTER TABLE monthly_reviews DROP CONSTRAINT IF EXISTS monthly_reviews_classification_check;
ALTER TABLE monthly_reviews ADD CONSTRAINT monthly_reviews_classification_check
  CHECK (classification IN ('A', 'B', 'C'));

-- ============================================
-- 3. Ham kiem tra quyen duyet danh gia thang (tuong tu phan quyen cham nhat ky)
-- ============================================
CREATE OR REPLACE FUNCTION public.can_approve_monthly(p_target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
  v_is_delegated BOOLEAN;
BEGIN
  IF p_target_user_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();
  SELECT role, unit_id INTO v_target_role, v_target_unit FROM profiles WHERE id = p_target_user_id;
  IF v_target_role IS NULL OR v_target_role = 'administrator' THEN RETURN false; END IF;

  IF v_reviewer_role = 'province_head' THEN
    RETURN v_target_role IN ('province_deputy', 'unit_head');
  ELSIF v_reviewer_role = 'province_deputy' THEN
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    SELECT EXISTS(
      SELECT 1 FROM delegations
      WHERE delegate_id = auth.uid() AND status = 'active' AND now() BETWEEN starts_at AND ends_at
    ) INTO v_is_delegated;
    RETURN v_is_delegated AND v_target_unit = v_reviewer_unit AND v_target_role = 'staff';
  END IF;
  RETURN false;
END;
$$;

-- ============================================
-- 4. RLS cho monthly_reviews
-- ============================================
CREATE POLICY "monthly_reviews_select_own" ON monthly_reviews
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "monthly_reviews_select_scope" ON monthly_reviews
  FOR SELECT USING (public.can_approve_monthly(user_id));

CREATE POLICY "monthly_reviews_admin_all" ON monthly_reviews
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

-- Khong tao policy INSERT/UPDATE truc tiep cho nguoi dung thuong: moi thay doi
-- phai di qua 2 ham RPC ben duoi de bat buoc kiem tra quyen va dieu kien.

-- ============================================
-- 5. RPC: tu cham diem thang (nhan vien), thang 0-100
-- ============================================
CREATE OR REPLACE FUNCTION save_monthly_self_score(
  p_period VARCHAR,
  p_score NUMERIC
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_existing monthly_reviews%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_score < 0 OR p_score > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diem tu cham phai tu 0 den 100');
  END IF;

  SELECT * INTO v_existing FROM monthly_reviews WHERE user_id = v_user_id AND period = p_period;
  IF v_existing.id IS NOT NULL AND v_existing.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ky danh gia nay da khoa');
  END IF;

  INSERT INTO monthly_reviews (user_id, period, self_score, status)
  VALUES (v_user_id, p_period, p_score, 'pending')
  ON CONFLICT (user_id, period) DO UPDATE SET
    self_score = p_score,
    status = CASE WHEN monthly_reviews.status = 'approved' THEN monthly_reviews.status ELSE 'pending' END,
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 6. RPC: lanh dao duyet diem chinh thuc va xep loai thang (0-100, A/B/C)
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
  IF p_classification NOT IN ('A', 'B', 'C') THEN
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
