-- Migration 00026: Canh bao khi lanh dao cham khac de xuat cua can bo qua
-- 3 lan/thang (tiep noi migration 00025)
-- Ngay: 27/08/2026
--
-- Boi canh: dem theo TUNG CAN BO (khong phan biet ai cham) trong 1 thang -
-- neu tong so nhat ky da duyet cua 1 tac gia co diem chinh thuc khac diem
-- tu cham VUOT QUA 3 (tu lan thu 4) thi bao cho cap tren cua nguoi VUA
-- THUC HIEN luot cham gay vuot nguong do (khong phai cap tren cua tac gia -
-- 2 khai niem nay thuong trung nhau nhung khong luon luon, vi du khi co uy
-- quyen).
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

  -- Canh bao chenh lech: chi xet khi diem chinh thuc khac diem tu cham, va
  -- ca 2 gia tri tu cham deu da co (khong ep neu can bo chua tung tu cham).
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
