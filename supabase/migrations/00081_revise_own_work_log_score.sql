-- Migration 00081: "Sua diem da cham" - TAM THOI mo cho lanh dao tu dieu
-- chinh diem CHINH MINH da cham cho can bo/KSV, do co thay doi co cau
-- cham diem. Yeu cau nguoi dung 2026-09-10.
--
-- Cac quyet dinh da chot voi nguoi dung:
-- - Khong lam cong tac bat/tat - cu them vao, sau nay go bo (chi can
--   DROP FUNCTION revise_own_work_log_score + go nut/dieu kien o client).
-- - CHI cho sua nhat ky co log_date thuoc THANG HIEN TAI (gio Viet Nam) -
--   tranh sua nguoc diem cac thang da chot/da xuat bao cao.
-- - Moi lanh dao da tung cham (reviewer_id = chinh minh) deu dung duoc.
--
-- Khac override_work_log_score (migration 00062): ham do danh cho CAP
-- TREN cua nguoi da cham (chan reviewer_id = auth.uid()). Ham nay nguoc
-- lai: BAT BUOC reviewer_id = auth.uid() (tu sua diem CUA CHINH MINH).
-- Dung lai cach dong bo nhom nhan ban + ghi work_log_reviews + thong bao
-- tac gia y het override_work_log_score de nhat quan; dung lai enum
-- notification_type 'score_overridden_by_senior' co san (dieu huong tac
-- gia ve "Nhat ky cua toi") - KHONG them enum value moi de sau nay go
-- tinh nang khong de lai enum thua (ALTER TYPE ADD VALUE la 1 chieu).

CREATE OR REPLACE FUNCTION revise_own_work_log_score(
  p_log_id UUID,
  p_complexity_score INTEGER,
  p_quality_score INTEGER,
  p_comment TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_comment TEXT;
  v_is_leave BOOLEAN;
  v_anchor_id UUID;
  v_cur_month TEXT;
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
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ sửa được điểm của nhật ký đã duyệt');
  END IF;
  IF v_log.reviewer_id IS DISTINCT FROM v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không phải người đã chấm nhật ký này');
  END IF;

  SELECT is_leave INTO v_is_leave FROM work_categories WHERE id = v_log.category_id;
  IF COALESCE(v_is_leave, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký nghỉ phép không có điểm để sửa');
  END IF;

  v_cur_month := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM');
  IF to_char(v_log.log_date, 'YYYY-MM') <> v_cur_month THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ sửa được điểm nhật ký trong tháng hiện tại');
  END IF;

  UPDATE work_logs SET
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = v_comment,
    reviewed_at = now()
  WHERE id = p_log_id;

  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, v_comment);

  -- Dong bo diem + nhan xet cho ca nhom nhan ban ("cong viec nhieu ngay")
  -- - giong het override_work_log_score.
  v_anchor_id := COALESCE(v_log.clone_group_id, p_log_id);
  UPDATE work_logs
  SET complexity_score = p_complexity_score, quality_score = p_quality_score, review_comment = v_comment
  WHERE id <> p_log_id AND (id = v_anchor_id OR clone_group_id = v_anchor_id);

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    v_log.author_id,
    'score_overridden_by_senior',
    'Điểm nhật ký của bạn đã được chấm lại',
    'Công việc "' || v_log.title || '" đã được lãnh đạo chấm lại điểm (điều chỉnh theo cơ cấu chấm điểm mới).',
    p_log_id,
    'work_log'
  );

  RETURN jsonb_build_object('success', true, 'message', 'Đã sửa lại điểm');
END;
$$;
