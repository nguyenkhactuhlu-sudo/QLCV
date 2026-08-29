-- Migration 00042: Giao viec cho nhieu nguoi cung luc (1 chu tri + N phoi
-- hop), han hoan thanh chinh xac den gio:phut, va tu "nop" nhat ky cho
-- dung nguoi da giao viec khi gan (link_task_to_log).
-- Ngay: 28/08/2026

-- Giu nguyen mo hinh 1 dong = 1 nguoi duoc giao (moi nguoi tu theo doi
-- tien do/han rieng), chi doi tham so dau vao de tao NHIEU dong cung
-- luc, dung chung 1 task_group_id (them o migration 00039) de gom hien
-- thi phia nguoi giao.
DROP FUNCTION IF EXISTS create_task_assignment(UUID, TEXT, TEXT, DATE);
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

  INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date, work_role, task_group_id)
  VALUES (v_user_id, p_lead_assignee_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date, 'chu_tri', v_group_id)
  RETURNING id INTO v_first_task_id;

  IF p_support_assignee_ids IS NOT NULL THEN
    FOREACH v_assignee_id IN ARRAY p_support_assignee_ids LOOP
      SELECT * INTO v_assignee FROM profiles WHERE id = v_assignee_id;
      INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date, work_role, task_group_id)
      VALUES (v_user_id, v_assignee_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date, 'phoi_hop', v_group_id);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'task_group_id', v_group_id, 'task_id', v_first_task_id);
END;
$$;

-- Han hoan thanh gio chinh xac den gio:phut (TIMESTAMPTZ thay vi DATE).
DROP FUNCTION IF EXISTS set_task_due_date(UUID, DATE);
CREATE OR REPLACE FUNCTION set_task_due_date(p_task_id UUID, p_due_date TIMESTAMPTZ)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_task task_assignments%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_task FROM task_assignments WHERE id = p_task_id;
  IF v_task.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy việc được giao'); END IF;
  IF v_task.assignee_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ người được giao việc mới có thể đặt hạn hoàn thành');
  END IF;
  IF v_task.status = 'done' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Việc này đã hoàn thành, không thể đổi hạn');
  END IF;

  UPDATE task_assignments SET actual_due_date = p_due_date, updated_at = now() WHERE id = p_task_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Khi gan nhat ky voi 1 viec duoc giao, tu dong "nop" nhat ky do cho
-- DUNG nguoi da giao viec (submitted_to_id = assigner_id), khong can
-- cán bo tu chon lai o form tao nhat ky.
CREATE OR REPLACE FUNCTION link_task_to_log(p_task_id UUID, p_log_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_task task_assignments%ROWTYPE;
  v_log work_logs%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_task FROM task_assignments WHERE id = p_task_id;
  IF v_task.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy việc được giao'); END IF;
  IF v_task.assignee_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ người được giao việc mới có thể gắn nhật ký');
  END IF;
  IF v_task.status = 'done' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Việc này đã hoàn thành');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL OR v_log.author_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký không hợp lệ');
  END IF;

  UPDATE task_assignments SET linked_log_id = p_log_id, status = 'reported', updated_at = now() WHERE id = p_task_id;
  UPDATE work_logs SET task_assignment_id = p_task_id, submitted_to_id = v_task.assigner_id WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
