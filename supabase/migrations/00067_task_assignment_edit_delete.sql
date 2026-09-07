-- Migration 00067: Cho phep TAC GIA giao viec (assigner) sua/xoa viec da
-- giao (task_assignments).
-- Ngay: 2026-09-07
--
-- Boi canh: task_assignments tu truoc den nay chi co RPC tao moi
-- (create_task_assignment) va nguoi NHAN viec tu dat han (set_task_due_date)
-- - chua co cach nao de nguoi GIAO viec sua lai (vd. go nham ten/mo ta,
-- doi han goi y) hoac xoa han (vd. giao nham nguoi, viec khong con can
-- lam nua). Bang khong co RLS UPDATE/DELETE (chi co SELECT, xem migration
-- 00031/00044/00046) - moi thay doi du lieu deu di qua RPC SECURITY
-- DEFINER, giong nguyen tac create_task_assignment/set_task_due_date da
-- dung, nen khong can them policy UPDATE/DELETE rieng.
--
-- Pham vi: sua/xoa theo CA NHOM (task_group_id) - 1 lan giao cho nhieu
-- nguoi (chu tri + phoi hop) sua/xoa cung luc, dung voi cach hien thi 1
-- the/nhom o taskGroupCardHtml. Chi sua duoc tieu de/mo ta/han goi y -
-- KHONG doi duoc danh sach nguoi nhan (qua phuc tap, ngoai pham vi yeu
-- cau). Xoa an toan vi work_logs.task_assignment_id la ON DELETE SET NULL
-- (migration 00031) - nhat ky da bao cao/duyet khong bi mat, chi go lien
-- ket voi viec da giao.

CREATE OR REPLACE FUNCTION update_task_assignment(
  p_task_group_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_suggested_due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_updated INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập tên công việc');
  END IF;

  UPDATE task_assignments
  SET title = trim(p_title), description = p_description, suggested_due_date = p_suggested_due_date, updated_at = now()
  WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy việc đã giao hoặc bạn không có quyền sửa');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION delete_task_assignment(p_task_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_deleted INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  DELETE FROM task_assignments WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy việc đã giao hoặc bạn không có quyền xoá');
  END IF;

  RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted);
END;
$$;
