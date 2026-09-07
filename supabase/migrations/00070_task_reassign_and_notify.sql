-- Migration 00070: Cho phep sua CA nguoi chu tri/phoi hop khi sua 1 viec
-- da giao, kem co che giu lai lich su cho nguoi bi rut khoi viec (khong
-- xoa/ghi de nhat ky/du lieu ho da bao cao), va thong bao day du moi thay
-- doi lien quan (giao viec/rut khoi viec/cap nhat noi dung).
-- Ngay: 2026-09-07
--
-- Boi canh: truoc day "Sua viec da giao" (migration 00067) chi sua duoc
-- tieu de/mo ta/han goi y, KHONG doi duoc nguoi chu tri/phoi hop. Nguoi
-- dung yeu cau sua duoc toan bo, nhung phai dam bao: neu nguoi CU da lo
-- nop nhat ky bao cao roi ma bi rut khoi viec, KHONG duoc xoa/doi ten
-- tren dong da co san cua ho (se lam sai lech nhat ky da nop) - phai giu
-- nguyen dong do tren tai khoan cua ho.
--
-- Nguyen tac (da thong nhat voi nguoi dung):
-- 1) Nguoi dang "cho thuc hien" (status=pending, chua co linked_log_id)
--    bi rut khoi viec -> XOA HAN dong do (chua co gi de mat).
-- 2) Nguoi DA bao cao (status != pending HOAC co linked_log_id) bi rut
--    khoi viec -> GIU NGUYEN dong do, chi danh dau removed_at=now() (an
--    khoi danh sach "dang hoat dong" cua nhom nay, nhung van con nguyen
--    tren "Cong viec duoc giao"/"Nhat ky cua toi" cua chinh ho).
-- 3) Nguoi MOI duoc them (chu tri hoac phoi hop, chua tung co dong active
--    nao trong nhom) -> them dong moi, trang thai "cho thuc hien".
-- 4) Nguoi VAN con trong danh sach nhung DOI vai tro (tu phoi hop thanh
--    chu tri hoac nguoc lai) -> cap nhat vai tro tren CHINH dong cu (cung
--    1 nguoi, khong mat du lieu, khong can tao/xoa).
-- 5) Thong bao day du moi thay doi lien quan den ho (giao moi/bi rut/noi
--    dung viec doi) - truoc day GIAO VIEC LAN DAU khong he co thong bao,
--    nguoi dung yeu cau chuong thong bao phai bao het moi thay doi.

ALTER TABLE task_assignments ADD COLUMN removed_at TIMESTAMPTZ;
CREATE INDEX idx_task_assignments_removed_at ON task_assignments(removed_at) WHERE removed_at IS NOT NULL;

-- ============================================
-- RPC: giao viec (them thong bao "task_assigned" cho tung nguoi - truoc
-- day KHONG co thong bao gi khi giao viec lan dau).
-- ============================================
CREATE OR REPLACE FUNCTION create_task_assignment(
  p_lead_assignee_id UUID,
  p_support_assignee_ids UUID[],
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_suggested_due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
  v_assignee_id UUID;
  v_assignee profiles%ROWTYPE;
  v_first_task_id UUID;
  v_assigner_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập tên công việc');
  END IF;
  IF p_lead_assignee_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng chọn người chủ trì');
  END IF;

  SELECT * INTO v_assignee FROM profiles WHERE id = p_lead_assignee_id;
  IF v_assignee.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy người chủ trì');
  END IF;
  IF NOT public.can_manage_person(p_lead_assignee_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền giao việc cho người chủ trì này');
  END IF;

  IF p_support_assignee_ids IS NOT NULL AND array_length(p_support_assignee_ids, 1) IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM unnest(p_support_assignee_ids) AS sid WHERE sid = p_lead_assignee_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Người chủ trì không được trùng với người phối hợp');
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(p_support_assignee_ids) AS sid
      LEFT JOIN profiles p ON p.id = sid
      WHERE p.id IS NULL
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Danh sách người phối hợp không hợp lệ');
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(p_support_assignee_ids) AS sid
      WHERE NOT public.can_manage_person(sid)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Không có quyền giao việc cho một hoặc nhiều người phối hợp');
    END IF;
  END IF;

  v_group_id := gen_random_uuid();
  SELECT full_name INTO v_assigner_name FROM profiles WHERE id = v_user_id;

  INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date, work_role, task_group_id)
  VALUES (v_user_id, p_lead_assignee_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date, 'chu_tri', v_group_id)
  RETURNING id INTO v_first_task_id;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (p_lead_assignee_id, 'task_assigned', 'Bạn được giao việc mới (chủ trì)',
    coalesce(v_assigner_name, 'Lãnh đạo') || ' đã giao việc "' || trim(p_title) || '" cho bạn (chủ trì).',
    v_group_id, 'task_group');

  IF p_support_assignee_ids IS NOT NULL THEN
    FOREACH v_assignee_id IN ARRAY p_support_assignee_ids LOOP
      SELECT * INTO v_assignee FROM profiles WHERE id = v_assignee_id;
      INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date, work_role, task_group_id)
      VALUES (v_user_id, v_assignee_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date, 'phoi_hop', v_group_id);

      INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
      VALUES (v_assignee_id, 'task_assigned', 'Bạn được giao việc mới (phối hợp)',
        coalesce(v_assigner_name, 'Lãnh đạo') || ' đã giao việc "' || trim(p_title) || '" cho bạn (phối hợp).',
        v_group_id, 'task_group');
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'task_group_id', v_group_id, 'task_id', v_first_task_id);
END;
$$;

-- ============================================
-- RPC: sua 1 viec da giao - nay sua duoc CA nguoi chu tri/phoi hop
-- (p_lead_assignee_id/p_support_assignee_ids la NULL = chi sua noi dung,
-- giu nguyen nguoi nhu cu, tuong thich nguoc).
-- ============================================
DROP FUNCTION IF EXISTS update_task_assignment(UUID, TEXT, TEXT, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION update_task_assignment(
  p_task_group_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_suggested_due_date TIMESTAMPTZ DEFAULT NULL,
  p_lead_assignee_id UUID DEFAULT NULL,
  p_support_assignee_ids UUID[] DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_has_group BOOLEAN;
  v_assigner_name TEXT;
  v_row RECORD;
  v_desired_ids UUID[];
  v_new_id UUID;
  v_assignee profiles%ROWTYPE;
  v_handled_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập tên công việc');
  END IF;

  SELECT EXISTS(SELECT 1 FROM task_assignments WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id) INTO v_has_group;
  IF NOT v_has_group THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy việc đã giao hoặc bạn không có quyền sửa');
  END IF;

  SELECT full_name INTO v_assigner_name FROM profiles WHERE id = v_user_id;

  -- Cap nhat noi dung chung - ap dung cho MOI dong (ke ca da rut khoi
  -- viec), de giu nhat quan ten/mo ta cua "cung 1 viec" do.
  UPDATE task_assignments
  SET title = trim(p_title), description = p_description, suggested_due_date = p_suggested_due_date, updated_at = now()
  WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id;

  -- Khong truyen danh sach nguoi -> chi sua noi dung, giu nguyen nguoi
  -- nhu cu (tuong thich nguoc voi cach goi cu, migration 00067).
  IF p_lead_assignee_id IS NULL THEN
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    SELECT assignee_id, 'task_updated', 'Việc được giao vừa được cập nhật',
      coalesce(v_assigner_name, 'Lãnh đạo') || ' đã cập nhật nội dung việc "' || trim(p_title) || '".',
      p_task_group_id, 'task_group'
    FROM task_assignments WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id AND removed_at IS NULL;
    RETURN jsonb_build_object('success', true);
  END IF;

  SELECT * INTO v_assignee FROM profiles WHERE id = p_lead_assignee_id;
  IF v_assignee.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy người chủ trì');
  END IF;
  IF NOT public.can_manage_person(p_lead_assignee_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền giao việc cho người chủ trì này');
  END IF;
  IF p_support_assignee_ids IS NOT NULL AND array_length(p_support_assignee_ids, 1) IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM unnest(p_support_assignee_ids) AS sid WHERE sid = p_lead_assignee_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Người chủ trì không được trùng với người phối hợp');
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(p_support_assignee_ids) AS sid LEFT JOIN profiles p ON p.id = sid WHERE p.id IS NULL) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Danh sách người phối hợp không hợp lệ');
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(p_support_assignee_ids) AS sid WHERE NOT public.can_manage_person(sid)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Không có quyền giao việc cho một hoặc nhiều người phối hợp');
    END IF;
  END IF;

  v_desired_ids := array_append(coalesce(p_support_assignee_ids, ARRAY[]::UUID[]), p_lead_assignee_id);

  -- 1) Nguoi dang active nhung KHONG con trong danh sach moi -> rut khoi
  -- viec (xoa han neu chua bao cao gi, giu lai neu da co du lieu that).
  FOR v_row IN
    SELECT * FROM task_assignments
    WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id AND removed_at IS NULL
      AND assignee_id <> ALL(v_desired_ids)
  LOOP
    IF v_row.status = 'pending' AND v_row.linked_log_id IS NULL THEN
      DELETE FROM task_assignments WHERE id = v_row.id;
    ELSE
      UPDATE task_assignments SET removed_at = now(), updated_at = now() WHERE id = v_row.id;
    END IF;
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (v_row.assignee_id, 'task_unassigned', 'Bạn không còn được phân công việc này',
      coalesce(v_assigner_name, 'Lãnh đạo') || ' đã điều chỉnh lại việc "' || trim(p_title) || '" - bạn không còn được phân công tiếp tục. Nhật ký/kết quả bạn đã báo cáo (nếu có) vẫn được giữ nguyên trên tài khoản của bạn.',
      p_task_group_id, 'task_group');
    v_handled_ids := array_append(v_handled_ids, v_row.assignee_id);
  END LOOP;

  -- 2) Nguoi van con trong danh sach nhung DOI vai tro (chu tri <->
  -- phoi hop) -> cap nhat vai tro tren CHINH dong cu, khong tao/xoa.
  UPDATE task_assignments SET work_role = 'chu_tri', updated_at = now()
  WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id AND removed_at IS NULL
    AND assignee_id = p_lead_assignee_id AND work_role <> 'chu_tri';
  UPDATE task_assignments SET work_role = 'phoi_hop', updated_at = now()
  WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id AND removed_at IS NULL
    AND assignee_id = ANY(coalesce(p_support_assignee_ids, ARRAY[]::UUID[])) AND work_role <> 'phoi_hop';

  -- 3) Chu tri moi (chua co dong active nao trong nhom) -> them dong moi.
  IF NOT EXISTS (SELECT 1 FROM task_assignments WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id AND removed_at IS NULL AND assignee_id = p_lead_assignee_id) THEN
    INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date, work_role, task_group_id)
    VALUES (v_user_id, p_lead_assignee_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date, 'chu_tri', p_task_group_id);
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (p_lead_assignee_id, 'task_assigned', 'Bạn được giao việc mới (chủ trì)',
      coalesce(v_assigner_name, 'Lãnh đạo') || ' đã giao việc "' || trim(p_title) || '" cho bạn (chủ trì).',
      p_task_group_id, 'task_group');
    v_handled_ids := array_append(v_handled_ids, p_lead_assignee_id);
  END IF;

  -- 4) Nguoi phoi hop moi (chua co dong active nao trong nhom) -> them
  -- dong moi.
  IF p_support_assignee_ids IS NOT NULL THEN
    FOREACH v_new_id IN ARRAY p_support_assignee_ids LOOP
      IF NOT EXISTS (SELECT 1 FROM task_assignments WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id AND removed_at IS NULL AND assignee_id = v_new_id) THEN
        SELECT * INTO v_assignee FROM profiles WHERE id = v_new_id;
        INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date, work_role, task_group_id)
        VALUES (v_user_id, v_new_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date, 'phoi_hop', p_task_group_id);
        INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (v_new_id, 'task_assigned', 'Bạn được giao việc mới (phối hợp)',
          coalesce(v_assigner_name, 'Lãnh đạo') || ' đã giao việc "' || trim(p_title) || '" cho bạn (phối hợp).',
          p_task_group_id, 'task_group');
        v_handled_ids := array_append(v_handled_ids, v_new_id);
      END IF;
    END LOOP;
  END IF;

  -- 5) Nguoi khong doi gi (van active, van dung vai tro, khong vua duoc
  -- them/rut o tren) -> bao noi dung viec da duoc cap nhat.
  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  SELECT ta.assignee_id, 'task_updated', 'Việc được giao vừa được cập nhật',
    coalesce(v_assigner_name, 'Lãnh đạo') || ' đã cập nhật nội dung việc "' || trim(p_title) || '".',
    p_task_group_id, 'task_group'
  FROM task_assignments ta
  WHERE ta.task_group_id = p_task_group_id AND ta.assigner_id = v_user_id AND ta.removed_at IS NULL
    AND ta.assignee_id <> ALL(v_handled_ids);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- RPC: xoa 1 viec da giao - loai bo removed_at IS NOT NULL khoi dieu
-- kien XOA (van xoa duoc toan bo nhom ke ca dong da rut, dung y nhu cu -
-- "Xoa" la hanh dong manh, xoa het CA lich su cua nhom do, khac voi
-- "Sua" o tren chi rut 1 nguoi ra khoi nhom van con dang hoat dong).
-- Khong doi gi vi dieu kien WHERE cu (task_group_id + assigner_id) van
-- dung, chi ghi chu lai cho ro.
-- ============================================
