-- Thung rac cho nhat ky cong tac: thay vi xoa vinh vien ngay (khong the khoi phuc), nay chuyen
-- sang XOA MEM (soft delete) - nguoi xoa (chinh minh hoac lanh dao) van khoi phuc lai duoc, hoac
-- xoa vinh vien tu thung rac neu chac chan khong can nua.
-- Yeu cau nguoi dung 2026-09-12: "Phat trien them muc thung rac" - tranh rui ro mat du lieu that
-- khi bam nham nut Xoa (truoc day xoa la mat han, khong co duong lay lai).

ALTER TABLE work_logs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_work_logs_deleted_at ON work_logs(deleted_at) WHERE deleted_at IS NOT NULL;

-- delete_work_log: GIU NGUYEN toan bo logic phan quyen nhu truoc (tu xoa chi khi con
-- pending/revision; xoa ho nguoi khac phai co quyen quan ly + bat buoc nhap ly do; bao cho tac
-- gia neu bi nguoi khac xoa) - CHI DOI hanh dong cuoi tu "DELETE FROM work_logs" (mat han) sang
-- "UPDATE ... SET deleted_at=..." (chuyen vao thung rac, khoi phuc lai duoc).
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
  IF v_log.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký này đã ở trong thùng rác');
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
        || to_char(v_log.log_date, 'DD/MM/YYYY') || '. Lý do: ' || trim(p_reason) || ' (có thể khôi phục trong Thùng rác)',
      'work_log'
    );
  END IF;

  UPDATE work_logs
  SET deleted_at = now(), deleted_by = v_user_id, delete_reason = p_reason
  WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Danh sach nhat ky dang trong thung rac ma nguoi goi duoc phep thay: cua chinh minh (du tu
-- xoa hay bi lanh dao xoa), hoac cua nguoi minh co quyen quan ly (can_manage_person) - dung
-- cung dieu kien quyen nhu delete_work_log/restore/purge ben duoi cho nhat quan.
CREATE OR REPLACE FUNCTION list_trash_work_logs()
RETURNS TABLE(
  id UUID,
  author_id UUID,
  author_name TEXT,
  unit_id UUID,
  title TEXT,
  result TEXT,
  category_id UUID,
  log_date DATE,
  status TEXT,
  complexity_score TEXT,
  quality_score TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deleted_by_name TEXT,
  delete_reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT wl.id, wl.author_id, p1.full_name, wl.unit_id, wl.title, wl.result,
         wl.category_id, wl.log_date, wl.status::TEXT, wl.complexity_score::TEXT, wl.quality_score::TEXT,
         wl.deleted_at, wl.deleted_by, p2.full_name, wl.delete_reason
  FROM work_logs wl
  LEFT JOIN profiles p1 ON p1.id = wl.author_id
  LEFT JOIN profiles p2 ON p2.id = wl.deleted_by
  WHERE wl.deleted_at IS NOT NULL
    AND (wl.author_id = auth.uid() OR public.can_manage_person(wl.author_id))
  ORDER BY wl.deleted_at DESC;
END;
$$;

-- Khoi phuc: tra ve trang thai binh thuong (deleted_at=NULL) - cho phep chinh tac gia hoac
-- nguoi co quyen quan ly tac gia do. Bao cho tac gia neu nguoi khoi phuc khong phai chinh ho.
CREATE OR REPLACE FUNCTION restore_work_log(p_log_id UUID)
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
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy nhật ký');
  END IF;
  IF v_log.deleted_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký này không ở trong thùng rác');
  END IF;

  IF v_log.author_id <> v_user_id AND NOT public.can_manage_person(v_log.author_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền khôi phục nhật ký này');
  END IF;

  UPDATE work_logs SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE id = p_log_id;

  IF v_log.author_id <> v_user_id THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type)
    VALUES (
      v_log.author_id,
      'work_log_restored',
      'Nhật ký của bạn đã được khôi phục',
      (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã khôi phục nhật ký "' || v_log.title || '" ngày '
        || to_char(v_log.log_date, 'DD/MM/YYYY') || ' từ thùng rác.',
      'work_log'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Xoa vinh vien tu thung rac (khong con duong khoi phuc) - chi ap dung cho nhat ky DA nam san
-- trong thung rac (deleted_at khong null), cung dieu kien quyen nhu tren.
CREATE OR REPLACE FUNCTION purge_work_log(p_log_id UUID)
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
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy nhật ký');
  END IF;
  IF v_log.deleted_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ xoá vĩnh viễn được nhật ký đang ở trong thùng rác');
  END IF;

  IF v_log.author_id <> v_user_id AND NOT public.can_manage_person(v_log.author_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền xoá vĩnh viễn nhật ký này');
  END IF;

  DELETE FROM work_logs WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
