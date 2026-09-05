-- Migration 00058: Sinh cac dong nhat ky "nhan ban" ngay sau khi 1 nhat ky
-- "cong viec nhieu ngay" duoc duyet + cham diem.
-- Ngay: 05/09/2026
--
-- Giu nguyen 100% logic goc cua approve_work_log (migration 00041) - chi
-- them: (1) chan khong cho duyet nham 1 nhat ky "Nghi phep" bang chuc nang
-- nay (nghi phep dung acknowledge_leave_log rieng, xem migration 00059);
-- (2) sau khi duyet xong, neu nhat ky co range_start_date (tuc la "cong
-- viec nhieu ngay"), tu goi create_work_log_clones() de sinh them cac
-- dong cho tung ngay con lai trong khoang da chon.

CREATE OR REPLACE FUNCTION public.create_work_log_clones(p_primary_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_day DATE;
BEGIN
  SELECT * INTO v_log FROM work_logs WHERE id = p_primary_id;
  IF v_log.id IS NULL OR v_log.range_start_date IS NULL THEN
    RETURN;
  END IF;

  v_day := v_log.range_start_date;
  WHILE v_day <= v_log.log_date LOOP
    -- Bo qua chinh ngay cua dong goc (da co san) va bo qua thu Bay/Chu nhat
    -- (EXTRACT(ISODOW...) tra ve 6=Thu Bay, 7=Chu nhat).
    IF v_day <> v_log.log_date AND EXTRACT(ISODOW FROM v_day) NOT IN (6, 7) THEN
      INSERT INTO work_logs (
        author_id, unit_id, log_date, category_id, title, result, work_role,
        duration, evidence, status, complexity_score, quality_score,
        reviewer_id, reviewed_at, submitted_to_id,
        is_clone, clone_group_id
      ) VALUES (
        v_log.author_id, v_log.unit_id, v_day, v_log.category_id, v_log.title, v_log.result, v_log.work_role,
        v_log.duration, v_log.evidence, v_log.status, v_log.complexity_score, v_log.quality_score,
        v_log.reviewer_id, v_log.reviewed_at, v_log.submitted_to_id,
        true, v_log.id
      );
    END IF;
    v_day := v_day + 1;
  END LOOP;
END;
$$;

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
  v_is_leave BOOLEAN;
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

  IF NOT public.can_review_log(p_log_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet nhat ky nay');
  END IF;

  SELECT is_leave INTO v_is_leave FROM work_categories WHERE id = v_log.category_id;
  IF COALESCE(v_is_leave, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đây là nhật ký nghỉ phép, dùng nút "Xác nhận đã biết" thay vì chấm điểm');
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

  IF v_log.task_assignment_id IS NOT NULL THEN
    UPDATE task_assignments SET status = 'done', updated_at = now() WHERE id = v_log.task_assignment_id;
  END IF;

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

  IF v_log.range_start_date IS NOT NULL THEN
    PERFORM public.create_work_log_clones(p_log_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Work log approved');
END;
$$;
