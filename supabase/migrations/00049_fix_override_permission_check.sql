-- Migration 00049: Sua dung goc loi "cap tren khong dieu chinh duoc diem
-- da cham cua cap duoi" (migration 00048 chua sua dung phan nay)
-- Ngay: 30/08/2026
--
-- Kiem tra truc tiep bang RPC rieng le (goi thang can_review_log qua API)
-- xac nhan chac chan: ham public.can_review_log() HIEN TAI nhan tham so la
-- p_log_id (UUID cua 1 NHAT KY, dung migration 00041) - KHONG con nhan
-- tham so la nguoi nhu truoc migration 00041.
--
-- override_work_log_score() van dang goi public.can_review_log(v_log.
-- reviewer_id) - tuc la truyen UUID cua NGUOI DA CHAM TRUOC vao 1 tham so
-- gio day duoc hieu la UUID cua NHAT KY. Truy van "WHERE id = p_log_id"
-- ben trong khong tim thay dong nao (2 khong gian UUID khac nhau hoan
-- toan) -> luon tra ve false -> KHONG AI dieu chinh duoc, du dung quyen.
-- Da kiem chung truc tiep: rpc/can_review_log voi p_log_id = UUID cua
-- Chanh Van phong tra ve false; rpc/can_manage_person voi p_target_id =
-- UUID cua Chanh Van phong (goi tu tai khoan Vien truong) tra ve true.
--
-- SUA: dung can_manage_person(p_target_id) - dung ham nay moi hop voi y
-- dinh ban dau cua override_work_log_score (kiem tra quyen quan ly CHINH
-- NGUOI DA CHAM TRUOC DO, khong phai tac gia nhat ky).
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

  -- "cap tren" = nguoi hop le de quan ly duoc CHINH nguoi da cham truoc do
  -- (sua o day - xem giai thich phia tren).
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

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES
    (v_log.author_id, 'score_overridden_by_senior', 'Điểm nhật ký đã bị lãnh đạo cấp trên thay đổi',
     'Công việc "' || v_log.title || '" đã bị lãnh đạo cấp trên thay đổi điểm.', p_log_id, 'work_log'),
    (v_previous_reviewer_id, 'score_overridden_reviewer_notice', 'Điểm bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh',
     'Công việc "' || v_log.title || '" bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh lại điểm.', p_log_id, 'work_log');

  RETURN jsonb_build_object('success', true, 'message', 'Đã điều chỉnh điểm');
END;
$$;
