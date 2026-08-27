-- Migration 00031: Tinh nang Giao viec (task_assignments)
-- Ngay: 27/08/2026
--
-- Lanh dao truc tiep giao viec cho cap duoi trong pham vi duyet duoc
-- (dung lai can_review_log, khong tao ma tran quyen moi). Han goi y
-- khong bat buoc; nguoi nhan tu dat han thuc te (set_task_due_date).
-- Bao cao ket qua = 1 nhat ky binh thuong, gan qua link_task_to_log;
-- duyet/tra lai nhat ky do tu dong dong bo trang thai task (sua lai
-- approve_work_log/reject_work_log tu migration 00028).

CREATE TYPE task_assignment_status AS ENUM ('pending', 'reported', 'done');

CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  suggested_due_date DATE,
  actual_due_date DATE,
  status task_assignment_status NOT NULL DEFAULT 'pending',
  linked_log_id UUID REFERENCES work_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_assignments_select" ON task_assignments
  FOR SELECT USING (assigner_id = auth.uid() OR assignee_id = auth.uid());

CREATE INDEX idx_task_assignments_assigner_id ON task_assignments(assigner_id);
CREATE INDEX idx_task_assignments_assignee_id ON task_assignments(assignee_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);

CREATE TRIGGER trg_task_assignments_updated_at BEFORE UPDATE ON task_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE work_logs ADD COLUMN task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE SET NULL;

-- ============================================
-- RPC: giao viec (pham vi = dung pham vi da co trong can_review_log)
-- ============================================
CREATE OR REPLACE FUNCTION create_task_assignment(
  p_assignee_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_suggested_due_date DATE DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_assignee profiles%ROWTYPE;
  v_task_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập tên công việc');
  END IF;

  SELECT * INTO v_assignee FROM profiles WHERE id = p_assignee_id;
  IF v_assignee.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy người được giao việc');
  END IF;
  IF NOT public.can_review_log(p_assignee_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền giao việc cho người này');
  END IF;

  INSERT INTO task_assignments (assigner_id, assignee_id, unit_id, title, description, suggested_due_date)
  VALUES (v_user_id, p_assignee_id, v_assignee.unit_id, trim(p_title), p_description, p_suggested_due_date)
  RETURNING id INTO v_task_id;

  RETURN jsonb_build_object('success', true, 'task_id', v_task_id);
END;
$$;

-- ============================================
-- RPC: nguoi nhan viec tu dang ky thoi han hoan thanh
-- ============================================
CREATE OR REPLACE FUNCTION set_task_due_date(p_task_id UUID, p_due_date DATE)
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

-- ============================================
-- RPC: gan 1 nhat ky (da co san, tac gia = nguoi nhan viec) voi 1 viec
-- duoc giao - "bao cao ket qua" = 1 nhat ky binh thuong (khong tao luong
-- duyet rieng), goi lai duoc khi trinh lai sau khi bi tra ve bo sung.
-- ============================================
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
  UPDATE work_logs SET task_assignment_id = p_task_id WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- Cap nhat approve_work_log()/reject_work_log() (giu nguyen toan bo logic
-- tu migration 00028): duyet xong -> viec gan voi nhat ky nay hoan thanh;
-- tra lai bo sung -> viec quay ve "cho thuc hien" (chua thuc su bao cao
-- xong, cho den khi trinh lai goi lai link_task_to_log).
-- ============================================
CREATE OR REPLACE FUNCTION approve_work_log(
  p_log_id UUID,
  p_complexity_score INTEGER,
  p_quality_score INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_override_count INTEGER;
  v_superior_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_complexity_score < 1 OR p_complexity_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Complexity score must be 1-10');
  END IF;
  IF p_quality_score < 1 OR p_quality_score > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quality score must be 1-10');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;

  IF v_log.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log is not in pending status');
  END IF;

  IF v_log.author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot review own work log');
  END IF;

  IF NOT public.can_review_log(v_log.author_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet nhat ky nay');
  END IF;

  UPDATE work_logs
  SET
    status = 'approved',
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = p_comment,
    reviewer_id = v_user_id,
    reviewed_at = now()
  WHERE id = p_log_id;

  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, p_comment);

  IF v_log.task_assignment_id IS NOT NULL THEN
    UPDATE task_assignments SET status = 'done', updated_at = now() WHERE id = v_log.task_assignment_id;
  END IF;

  IF v_log.self_complexity_score IS NOT NULL AND v_log.self_quality_score IS NOT NULL
     AND (p_complexity_score IS DISTINCT FROM v_log.self_complexity_score
          OR p_quality_score IS DISTINCT FROM v_log.self_quality_score) THEN

    SELECT count(*) INTO v_override_count
    FROM work_logs
    WHERE author_id = v_log.author_id
      AND status = 'approved'
      AND self_complexity_score IS NOT NULL AND self_quality_score IS NOT NULL
      AND date_trunc('month', reviewed_at) = date_trunc('month', now())
      AND (complexity_score IS DISTINCT FROM self_complexity_score
           OR quality_score IS DISTINCT FROM self_quality_score);

    IF v_override_count > 3 THEN
      SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = v_user_id;
      v_superior_id := NULL;

      IF v_reviewer_role = 'unit_head' THEN
        SELECT ua.user_id INTO v_superior_id
        FROM unit_assignments ua
        JOIN profiles p2 ON p2.id = ua.user_id AND p2.role = 'province_deputy'
        WHERE ua.unit_id = v_reviewer_unit LIMIT 1;
        IF v_superior_id IS NULL THEN
          SELECT id INTO v_superior_id FROM profiles WHERE role = 'province_head' LIMIT 1;
        END IF;
      ELSIF v_reviewer_role = 'unit_deputy' THEN
        SELECT id INTO v_superior_id FROM profiles WHERE unit_id = v_reviewer_unit AND role = 'unit_head' LIMIT 1;
      ELSIF v_reviewer_role = 'province_deputy' THEN
        SELECT id INTO v_superior_id FROM profiles WHERE role = 'province_head' LIMIT 1;
      END IF;

      IF v_superior_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (
          v_superior_id,
          'score_override_escalation',
          'Chênh lệch điểm tự chấm vượt ngưỡng trong tháng',
          (SELECT full_name FROM profiles WHERE id = v_log.author_id) || ' đã bị chấm điểm khác đề xuất tự chấm quá 3 lần trong tháng này.',
          v_log.author_id,
          'profile'
        );
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Work log approved');
END;
$$;

CREATE OR REPLACE FUNCTION reject_work_log(
  p_log_id UUID,
  p_comment TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_comment IS NULL OR length(trim(p_comment)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Comment is required when rejecting');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;

  IF v_log.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log is not in pending status');
  END IF;

  IF v_log.author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot review own work log');
  END IF;

  IF NOT public.can_review_log(v_log.author_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet nhat ky nay');
  END IF;

  INSERT INTO work_log_revisions (log_id, version, snapshot, complexity_score, quality_score, review_comment, created_by)
  VALUES (
    p_log_id,
    v_log.version,
    row_to_json(v_log)::jsonb,
    v_log.complexity_score,
    v_log.quality_score,
    p_comment,
    v_user_id
  );

  UPDATE work_logs
  SET
    status = 'revision',
    complexity_score = NULL,
    quality_score = NULL,
    review_comment = p_comment,
    reviewer_id = v_user_id,
    reviewed_at = now(),
    version = v_log.version + 1
  WHERE id = p_log_id;

  IF v_log.task_assignment_id IS NOT NULL THEN
    UPDATE task_assignments SET status = 'pending', updated_at = now() WHERE id = v_log.task_assignment_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Work log sent back for revision');
END;
$$;
