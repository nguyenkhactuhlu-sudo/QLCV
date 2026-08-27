-- Migration 00028: Ham can_review_log() (SQL) + vá lo hong quyen han trong
-- approve_work_log()
-- Ngay: 27/08/2026
--
-- Boi canh: approve_work_log() TRUOC DAY khong he kiem tra nguoi goi co
-- quyen duyet tac gia hay khong (chi kiem tra: da dang nhap, diem hop le,
-- log dang pending, khong tu duyet cua minh) - ve ly thuyet BAT KY tai
-- khoan nao cung goi duoc RPC nay de duyet/cham diem nhat ky cua BAT KY ai
-- khac, bo qua hoan toan viec loc quyen phia giao dien (RLS khong ap dung
-- vi ham la SECURITY DEFINER). Phat hien khi lam tinh nang "cap tren dieu
-- chinh diem" (can 1 ham quyen han tuong duong logic canReviewLog() phia
-- client) - nhan tien va luon ca cho duong duyet nhat ky lan dau.
CREATE OR REPLACE FUNCTION public.can_review_log(p_target_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
  v_is_delegated BOOLEAN;
  v_province_unit_id UUID;
BEGIN
  IF p_target_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();
  SELECT role, unit_id INTO v_target_role, v_target_unit FROM profiles WHERE id = p_target_id;
  IF v_target_role IS NULL THEN RETURN false; END IF;

  IF v_reviewer_role = 'province_head' THEN
    SELECT id INTO v_province_unit_id FROM units WHERE type = 'province' LIMIT 1;
    RETURN v_target_role = 'province_deputy' OR v_target_role = 'unit_head' OR v_target_unit = v_province_unit_id;
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
    RETURN v_is_delegated AND v_target_unit = v_reviewer_unit AND v_target_role IN ('staff', 'support_staff');
  END IF;
  RETURN false;
END;
$$;

-- Them dung kiem tra quyen vao approve_work_log() (giu nguyen toan bo logic
-- tu cham/escalation cua migration 00026, chi them 1 dieu kien).
CREATE OR REPLACE FUNCTION approve_work_log(
  p_log_id UUID,
  p_complexity_score INTEGER,
  p_quality_score INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_override_count INTEGER;
  v_superior_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_complexity_score < 1 OR p_complexity_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Complexity score must be 1-10');
  END IF;
  IF p_quality_score < 1 OR p_quality_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quality score must be 1-10');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;

  IF v_log.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log is not in pending status');
  END IF;

  IF v_log.author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot review own work log');
  END IF;

  IF NOT public.can_review_log(v_log.author_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet nhat ky nay');
  END IF;

  UPDATE work_logs
  SET
    status = 'approved',
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = p_comment,
    reviewer_id = v_user_id,
    reviewed_at = now()
  WHERE id = p_log_id;

  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, p_comment);

  IF v_log.self_complexity_score IS NOT NULL AND v_log.self_quality_score IS NOT NULL
     AND (p_complexity_score IS DISTINCT FROM v_log.self_complexity_score
          OR p_quality_score IS DISTINCT FROM v_log.self_quality_score) THEN

    SELECT count(*) INTO v_override_count
    FROM work_logs
    WHERE author_id = v_log.author_id
      AND status = 'approved'
      AND self_complexity_score IS NOT NULL AND self_quality_score IS NOT NULL
      AND date_trunc('month', reviewed_at) = date_trunc('month', now())
      AND (complexity_score IS DISTINCT FROM self_complexity_score
           OR quality_score IS DISTINCT FROM self_quality_score);

    IF v_override_count > 3 THEN
      SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = v_user_id;
      v_superior_id := NULL;

      IF v_reviewer_role = 'unit_head' THEN
        SELECT ua.user_id INTO v_superior_id
        FROM unit_assignments ua
        JOIN profiles p2 ON p2.id = ua.user_id AND p2.role = 'province_deputy'
        WHERE ua.unit_id = v_reviewer_unit LIMIT 1;
        IF v_superior_id IS NULL THEN
          SELECT id INTO v_superior_id FROM profiles WHERE role = 'province_head' LIMIT 1;
        END IF;
      ELSIF v_reviewer_role = 'unit_deputy' THEN
        SELECT id INTO v_superior_id FROM profiles WHERE unit_id = v_reviewer_unit AND role = 'unit_head' LIMIT 1;
      ELSIF v_reviewer_role = 'province_deputy' THEN
        SELECT id INTO v_superior_id FROM profiles WHERE role = 'province_head' LIMIT 1;
      END IF;

      IF v_superior_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (
          v_superior_id,
          'score_override_escalation',
          'Chênh lệch điểm tự chấm vượt ngưỡng trong tháng',
          (SELECT full_name FROM profiles WHERE id = v_log.author_id) || ' đã bị chấm điểm khác đề xuất tự chấm quá 3 lần trong tháng này.',
          v_log.author_id,
          'profile'
        );
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Work log approved');
END;
$$;

-- reject_work_log() co CUNG lo hong (khong kiem tra quyen) - va luon.
CREATE OR REPLACE FUNCTION reject_work_log(
  p_log_id UUID,
  p_comment TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_comment IS NULL OR length(trim(p_comment)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Comment is required when rejecting');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;

  IF v_log.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log is not in pending status');
  END IF;

  IF v_log.author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot review own work log');
  END IF;

  IF NOT public.can_review_log(v_log.author_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet nhat ky nay');
  END IF;

  INSERT INTO work_log_revisions (log_id, version, snapshot, complexity_score, quality_score, review_comment, created_by)
  VALUES (
    p_log_id,
    v_log.version,
    row_to_json(v_log)::jsonb,
    v_log.complexity_score,
    v_log.quality_score,
    p_comment,
    v_user_id
  );

  UPDATE work_logs
  SET
    status = 'revision',
    complexity_score = NULL,
    quality_score = NULL,
    review_comment = p_comment,
    reviewer_id = v_user_id,
    reviewed_at = now(),
    version = v_log.version + 1
  WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true, 'message', 'Work log sent back for revision');
END;
$$;
