-- Migration 00038: RPC xoa nhat ky nhap nham/nhap sai
-- Ngay: 28/08/2026
--
-- Boi canh: chua co luong nao de xoa 1 nhat ky da lo nhap sai/nhap nham.
-- Yeu cau: (1) tac gia tu xoa duoc nhat ky CUA MINH, nhung chi khi con
-- "cho duyet"/"can bo sung" (da duyet roi thi coi la du lieu chinh thuc,
-- khong tu y xoa duoc nua); (2) lanh dao hop le (dung pham vi da co san
-- trong can_review_log - ai duyet duoc nguoi do thi xoa duoc nhat ky nguoi
-- do) xoa duoc nhat ky cap duoi o BAT KY trang thai nao, nhung BAT BUOC
-- nhap ly do va tac gia duoc thong bao ngay.
-- Khong them RLS DELETE truc tiep cho work_logs (hien chua co san) - moi
-- thao tac xoa deu di qua RPC nay de dam bao kiem tra quyen day du.
CREATE OR REPLACE FUNCTION delete_work_log(p_log_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_is_self BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy nhật ký');
  END IF;

  v_is_self := (v_log.author_id = v_user_id);

  IF v_is_self THEN
    IF v_log.status NOT IN ('pending', 'revision') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Nhật ký đã được duyệt, không thể tự xoá. Liên hệ lãnh đạo nếu cần xoá.');
    END IF;
  ELSE
    IF NOT public.can_review_log(v_log.author_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Không có quyền xoá nhật ký này');
    END IF;
    IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập lý do khi xoá nhật ký của người khác');
    END IF;
  END IF;

  IF NOT v_is_self THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type)
    VALUES (
      v_log.author_id,
      'work_log_deleted_by_leader',
      'Nhật ký của bạn đã bị lãnh đạo xoá',
      (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã xoá nhật ký "' || v_log.title || '" ngày '
        || to_char(v_log.log_date, 'DD/MM/YYYY') || '. Lý do: ' || trim(p_reason),
      'work_log'
    );
  END IF;

  DELETE FROM work_logs WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
