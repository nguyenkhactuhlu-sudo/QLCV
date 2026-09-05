-- Migration 00059: RPC rieng cho lanh dao "xac nhan da biet" 1 nhat ky
-- nghi phep - khong cham diem, chi xac nhan, roi tu sinh cac dong nhan
-- ban cho tung ngay con lai trong khoang nghi phep (dung chung
-- create_work_log_clones() da them o migration 00058).
-- Ngay: 05/09/2026

CREATE OR REPLACE FUNCTION acknowledge_leave_log(p_log_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_is_leave BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy nhật ký');
  END IF;

  IF v_log.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký này không ở trạng thái chờ xác nhận');
  END IF;

  IF v_log.author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không thể tự xác nhận nghỉ phép của chính mình');
  END IF;

  IF NOT public.can_review_log(p_log_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền xác nhận nhật ký này');
  END IF;

  SELECT is_leave INTO v_is_leave FROM work_categories WHERE id = v_log.category_id;
  IF NOT COALESCE(v_is_leave, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký này không phải nghỉ phép, dùng chức năng Duyệt & chấm điểm thông thường');
  END IF;

  UPDATE work_logs
  SET status = 'approved', reviewer_id = v_user_id, reviewed_at = now()
  WHERE id = p_log_id;

  IF v_log.range_start_date IS NOT NULL THEN
    PERFORM public.create_work_log_clones(p_log_id);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
