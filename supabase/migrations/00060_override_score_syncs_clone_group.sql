-- Migration 00060: Khi dieu chinh diem 1 nhat ky thuoc "cong viec nhieu
-- ngay", dong bo diem moi cho ca nhom nhan ban (dong goc + moi dong da
-- sinh ra cho tung ngay) - dung nhu yeu cau "dung chung diem da duyet
-- cung nhu thay doi neu co". Chan luon viec dieu chinh diem tren nhat ky
-- nghi phep (khong co gi de cham). Giu nguyen 100% logic con lai cua
-- override_work_log_score (migration 00049).
-- Ngay: 05/09/2026

CREATE OR REPLACE FUNCTION override_work_log_score(
  p_log_id UUID,
  p_complexity_score INTEGER,
  p_quality_score INTEGER,
  p_comment TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_previous_reviewer_id UUID;
  v_comment TEXT;
  v_is_leave BOOLEAN;
  v_anchor_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_comment := NULLIF(trim(coalesce(p_comment, '')), '');

  IF p_complexity_score < 1 OR p_complexity_score > 10 OR p_quality_score < 1 OR p_quality_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Điểm phải từ 1 đến 10');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;
  IF v_log.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ điều chỉnh được nhật ký đã duyệt');
  END IF;
  IF v_log.reviewer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký chưa có người chấm trước đó');
  END IF;
  IF v_log.reviewer_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn chính là người đã chấm - hãy chấm lại trực tiếp, không cần điều chỉnh');
  END IF;

  SELECT is_leave INTO v_is_leave FROM work_categories WHERE id = v_log.category_id;
  IF COALESCE(v_is_leave, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký nghỉ phép không có điểm để điều chỉnh');
  END IF;

  -- "cap tren" = nguoi hop le de quan ly duoc CHINH nguoi da cham truoc do
  -- (sua tu migration 00049).
  IF NOT public.can_manage_person(v_log.reviewer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền điều chỉnh điểm đã chấm bởi người này');
  END IF;

  v_previous_reviewer_id := v_log.reviewer_id;

  UPDATE work_logs SET
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = v_comment,
    reviewer_id = v_user_id,
    reviewed_at = now()
  WHERE id = p_log_id;

  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, v_comment);

  -- Dong bo diem cho ca nhom nhan ban (neu nhat ky nay la 1 phan cua
  -- "cong viec nhieu ngay") - v_anchor_id la id cua dong GOC: neu dong
  -- dang sua la 1 dong nhan ban thi anchor la clone_group_id cua no; neu
  -- dong dang sua chinh la dong goc thi anchor la chinh id cua no.
  v_anchor_id := COALESCE(v_log.clone_group_id, p_log_id);
  UPDATE work_logs
  SET complexity_score = p_complexity_score, quality_score = p_quality_score
  WHERE id <> p_log_id AND (id = v_anchor_id OR clone_group_id = v_anchor_id);

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES
    (v_log.author_id, 'score_overridden_by_senior', 'Điểm nhật ký đã bị lãnh đạo cấp trên thay đổi',
     'Công việc "' || v_log.title || '" đã bị lãnh đạo cấp trên thay đổi điểm.', p_log_id, 'work_log'),
    (v_previous_reviewer_id, 'score_overridden_reviewer_notice', 'Điểm bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh',
     'Công việc "' || v_log.title || '" bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh lại điểm.', p_log_id, 'work_log');

  RETURN jsonb_build_object('success', true, 'message', 'Đã điều chỉnh điểm');
END;
$$;
