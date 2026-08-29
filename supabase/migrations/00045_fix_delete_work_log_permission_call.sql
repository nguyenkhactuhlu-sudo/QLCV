-- Migration 00045: Fix delete_work_log goi nham can_review_log (da doi
-- tham so o migration 00041)
-- Ngay: 29/08/2026
--
-- Su co: delete_work_log (migration 00038) goi public.can_review_log(v_log.author_id)
-- - dung CHU KY CU cua can_review_log (nhan p_target_id la NGUOI, migration
-- 00030). Migration 00041 da CREATE OR REPLACE can_review_log voi chu ky
-- MOI nhan p_log_id la NHAT KY (van chi 1 tham so UUID nen Postgres THAY
-- THE ham cu, khong tao ham 2 chu ky song song). Sau 00041, loi goi cu se
-- am tham lay UUID cua TAC GIA dua vao nhu the do la 1 log_id, tra ve KET
-- QUA SAI (khong tim thay dong work_logs nao co id = author_id) thay vi
-- loi ro rang - lam hong quyen "lanh dao xoa nhat ky cap duoi" da co san.
--
-- Xu ly: quyen xoa ho cap duoi la cau hoi THU BAC voi TAC GIA (giong het
-- ban chat cua override_work_log_score da sua o 00041), khong lien quan
-- "nop cho ai" cua rieng 1 nhat ky - dung can_manage_person(v_log.author_id)
-- thay vi can_review_log.
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
    IF NOT public.can_manage_person(v_log.author_id) THEN
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
