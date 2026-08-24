-- Migration 00003: RPC functions cho nghiep vu QLCV
-- Ngay: 23/08/2026

-- ============================================
-- RPC: Approve work log (duyet nhat ky)
-- ============================================
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
  v_user_role user_role;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate scores
  IF p_complexity_score < 1 OR p_complexity_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Complexity score must be 1-10');
  END IF;
  IF p_quality_score < 1 OR p_quality_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quality score must be 1-10');
  END IF;

  -- Get log
  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;

  -- Check status
  IF v_log.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log is not in pending status');
  END IF;

  -- Prevent self-review
  IF v_log.author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot review own work log');
  END IF;

  -- Update log
  UPDATE work_logs
  SET
    status = 'approved',
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = p_comment,
    reviewer_id = v_user_id,
    reviewed_at = now()
  WHERE id = p_log_id;

  -- Insert review record
  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, p_comment);

  RETURN jsonb_build_object('success', true, 'message', 'Work log approved');
END;
$$;

-- ============================================
-- RPC: Reject work log (tra lai nhat ky)
-- ============================================
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

  -- Save current version as revision snapshot
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

  -- Update log
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

-- ============================================
-- RPC: Resubmit work log (trinh lai)
-- ============================================
CREATE OR REPLACE FUNCTION resubmit_work_log(
  p_log_id UUID,
  p_title TEXT,
  p_result TEXT
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

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;

  IF v_log.status != 'revision' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log is not in revision status');
  END IF;

  IF v_log.author_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only author can resubmit');
  END IF;

  UPDATE work_logs
  SET
    status = 'pending',
    title = p_title,
    result = p_result,
    reviewer_id = NULL,
    reviewed_at = NULL,
    review_comment = NULL,
    revision_count = v_log.revision_count + 1,
    version = v_log.version + 1
  WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true, 'message', 'Work log resubmitted for review');
END;
$$;

-- ============================================
-- RPC: Get dashboard summary
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_unit_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT jsonb_build_object(
    'total_logs', COUNT(*),
    'approved_logs', COUNT(*) FILTER (WHERE status = 'approved'),
    'pending_logs', COUNT(*) FILTER (WHERE status = 'pending'),
    'revision_logs', COUNT(*) FILTER (WHERE status = 'revision'),
    'avg_complexity', ROUND(AVG(complexity_score)::numeric, 1),
    'avg_quality', ROUND(AVG(quality_score)::numeric, 1),
    'high_quality_rate', CASE
      WHEN COUNT(*) FILTER (WHERE quality_score IS NOT NULL) > 0
      THEN ROUND(
        (COUNT(*) FILTER (WHERE quality_score >= 8)::numeric /
         COUNT(*) FILTER (WHERE quality_score IS NOT NULL)::numeric) * 100, 1)
      ELSE 0
    END
  ) INTO v_result
  FROM work_logs
  WHERE (p_unit_id IS NULL OR unit_id = p_unit_id)
    AND (p_start_date IS NULL OR log_date >= p_start_date)
    AND (p_end_date IS NULL OR log_date <= p_end_date);

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$;
