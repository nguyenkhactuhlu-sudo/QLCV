-- ============================================================
-- FILE GOP: Migration 00039 -> 00045
-- Co che uy quyen + nop nhat ky cho lanh dao cu the + giao viec
-- nhieu nguoi + han gio:phut. Chay 1 lan, theo DUNG THU TU tu
-- tren xuong duoi trong Supabase SQL Editor.
-- Ngay tao file gop: 29/08/2026 (sua lan 2: them DROP FUNCTION
-- can_review_log truoc khi doi ten tham so, fix loi 42P13)
-- ============================================================

-- ============================================================
-- 00039_multiperson_tasks_and_submitted_to.sql
-- ============================================================
-- Migration 00039: Chuan bi schema cho 2 thay doi lon
-- (1) Nhat ky duoc "nop cho" dich danh 1 lanh dao cu the (thay cho uy
--     quyen theo danh sach nguoi cu the) - them work_logs.submitted_to_id.
-- (2) Giao viec cho nhieu nguoi cung luc (1 chu tri + N phoi hop) va han
--     hoan thanh chinh xac den gio:phut - them task_group_id/work_role,
--     doi kieu cot han tu DATE sang TIMESTAMPTZ.
-- Ngay: 28/08/2026
--
-- Chi them cot/doi kieu (khong dung enum moi), an toan chay 1 lan.

ALTER TABLE work_logs ADD COLUMN submitted_to_id UUID REFERENCES profiles(id);

ALTER TABLE task_assignments ADD COLUMN task_group_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE task_assignments ADD COLUMN work_role VARCHAR(50) NOT NULL DEFAULT 'chu_tri' CHECK (work_role IN ('chu_tri', 'phoi_hop'));
ALTER TABLE task_assignments ALTER COLUMN suggested_due_date TYPE TIMESTAMPTZ USING suggested_due_date::timestamptz;
ALTER TABLE task_assignments ALTER COLUMN actual_due_date TYPE TIMESTAMPTZ USING actual_due_date::timestamptz;

CREATE INDEX idx_task_assignments_group_id ON task_assignments(task_group_id);
CREATE INDEX idx_work_logs_submitted_to_id ON work_logs(submitted_to_id);


-- ============================================================
-- 00040_drop_delegation_scopes.sql
-- ============================================================
-- Migration 00040: Bo bang delegation_scopes (khong con dung)
-- Ngay: 28/08/2026
--
-- Uy quyen doi nghia thanh "thay mat 100% toan don vi" (xem migration
-- 00043), khong con chon danh sach nguoi cu the nua. Da xac nhan bang
-- delegations/delegation_scopes hien dang rong trong production (chua
-- ai thuc su cap uy quyen qua giao dien), an toan de xoa truc tiep.
DROP POLICY IF EXISTS "delegation_scopes_select" ON delegation_scopes;
DROP TABLE IF EXISTS delegation_scopes;


-- ============================================================
-- 00041_permission_model_rework.sql
-- ============================================================
-- Migration 00041: Doi mo hinh phan quyen cham diem - tach rieng
-- "co nam trong chuoi quan ly nguoi nay khong" (can_manage_person, dung
-- cho Giao viec) khoi "co duyet duoc DUNG NHAT KY NAY khong"
-- (can_review_log, doi tham so tu nguoi sang chinh nhat ky).
-- Ngay: 28/08/2026
--
-- Boi canh: 1 can bo/KSV co the duoc NHIEU lanh dao khac nhau trong don
-- vi giao viec (Truong phong giao viec A, 1 Pho phong giao viec B...) -
-- gan CO DINH "nguoi nay luon do Pho X cham" (uy quyen theo danh sach
-- cu) khong dung thuc te. Tu day, nguoi cham hop le cho 1 nhat ky la:
-- Truong phong (luon luon), HOAC dung Pho phong da duoc "nop nhat ky
-- cho" (work_logs.submitted_to_id), HOAC bat ky Pho phong nao dang duoc
-- uy quyen thay mat 100% toan don vi (xem migration 00043).

CREATE OR REPLACE FUNCTION public.has_active_delegation(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM delegations
    WHERE delegate_id = COALESCE(p_user_id, auth.uid())
      AND status = 'active'
      AND now() BETWEEN starts_at AND ends_at
  );
$$;

-- "Co nam trong chuoi quan ly nguoi nay khong" - dung cho Giao viec va
-- lam nen cho can_review_log/can_approve_monthly. Giong het can_review_log
-- CU (migration 00030) nhung nhanh unit_deputy khong con check danh sach,
-- chi can cung don vi + dung vai tro staff/support_staff.
CREATE OR REPLACE FUNCTION public.can_manage_person(p_target_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
  v_province_unit_id UUID;
BEGIN
  IF p_target_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();
  SELECT role, unit_id INTO v_target_role, v_target_unit FROM profiles WHERE id = p_target_id;
  IF v_target_role IS NULL THEN RETURN false; END IF;

  IF v_reviewer_role = 'province_head' THEN
    SELECT id INTO v_province_unit_id FROM units WHERE type = 'province' LIMIT 1;
    RETURN v_target_role = 'province_deputy' OR v_target_role = 'unit_head' OR v_target_unit = v_province_unit_id;
  ELSIF v_reviewer_role = 'province_deputy' THEN
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role IN ('staff', 'support_staff');
  END IF;
  RETURN false;
END;
$$;

-- Doi THAM SO: truoc la p_target_id (nguoi), gio la p_log_id (chinh nhat
-- ky do) - vi quyen duyet gio phu thuoc submitted_to_id cua TUNG nhat ky,
-- khong con la thuoc tinh co dinh cua 1 nguoi. Cac RPC goi ham nay
-- (approve_work_log/reject_work_log) da co san p_log_id, chi doi 1 dong.
-- Postgres KHONG cho CREATE OR REPLACE doi TEN tham so dau vao cua 1 ham
-- da ton tai cung kieu (loi 42P13) - phai DROP tuong minh ham cu truoc.
DROP FUNCTION IF EXISTS public.can_review_log(UUID);
CREATE OR REPLACE FUNCTION public.can_review_log(p_log_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_author_id UUID;
  v_submitted_to_id UUID;
  v_author_unit UUID;
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
BEGIN
  SELECT author_id, submitted_to_id, unit_id INTO v_author_id, v_submitted_to_id, v_author_unit
  FROM work_logs WHERE id = p_log_id;
  IF v_author_id IS NULL THEN RETURN false; END IF;
  IF v_author_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();

  IF v_reviewer_role = 'unit_deputy' THEN
    IF v_author_unit = v_reviewer_unit AND public.has_active_delegation() THEN
      RETURN true; -- dang thay mat Truong phong, toan quyen ca don vi
    END IF;
    RETURN v_submitted_to_id IS NOT NULL AND v_submitted_to_id = auth.uid();
  END IF;

  -- province_head/province_deputy/unit_head: luon dua tren tac gia,
  -- khong phu thuoc submitted_to_id (cap truong luon co toan quyen).
  RETURN public.can_manage_person(v_author_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_approve_monthly(p_target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_target_role user_role;
  v_target_unit UUID;
BEGIN
  IF p_target_user_id = auth.uid() THEN RETURN false; END IF;

  SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = auth.uid();
  SELECT role, unit_id INTO v_target_role, v_target_unit FROM profiles WHERE id = p_target_user_id;
  IF v_target_role IS NULL OR v_target_role = 'administrator' THEN RETURN false; END IF;

  IF v_reviewer_role = 'province_head' THEN
    RETURN v_target_role IN ('province_deputy', 'unit_head');
  ELSIF v_reviewer_role = 'province_deputy' THEN
    RETURN v_target_role = 'unit_head' AND EXISTS(
      SELECT 1 FROM unit_assignments WHERE user_id = auth.uid() AND unit_id = v_target_unit
    );
  ELSIF v_reviewer_role = 'unit_head' THEN
    RETURN v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  ELSIF v_reviewer_role = 'unit_deputy' THEN
    RETURN public.has_active_delegation() AND v_target_unit = v_reviewer_unit AND v_target_role != 'unit_head';
  END IF;
  RETURN false;
END;
$$;

-- approve_work_log/reject_work_log: doi 1 dong duy nhat, goi can_review_log
-- theo DUNG NHAT KY (p_log_id) thay vi theo tac gia (v_log.author_id).
-- Giu nguyen 100% logic con lai tu migration 00031.
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

  IF NOT public.can_review_log(p_log_id) THEN
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

  IF NOT public.can_review_log(p_log_id) THEN
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

-- override_work_log_score: kiem tra quyen voi NGUOI DA CHAM TRUOC DO la
-- cau hoi thu bac chung (can_manage_person), khong lien quan submitted_to_id
-- cua rieng 1 nhat ky - doi tu can_review_log(v_log.reviewer_id) sang
-- can_manage_person(v_log.reviewer_id).
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_comment IS NULL OR length(trim(p_comment)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bắt buộc nhập nhận xét khi điều chỉnh điểm');
  END IF;
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
  IF NOT public.can_manage_person(v_log.reviewer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền điều chỉnh điểm đã chấm bởi người này');
  END IF;

  v_previous_reviewer_id := v_log.reviewer_id;

  UPDATE work_logs SET
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = p_comment,
    reviewer_id = v_user_id,
    reviewed_at = now()
  WHERE id = p_log_id;

  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, p_comment);

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES
    (v_log.author_id, 'score_overridden_by_senior', 'Điểm nhật ký đã bị lãnh đạo cấp trên thay đổi',
     'Công việc "' || v_log.title || '" đã bị lãnh đạo cấp trên thay đổi điểm.', p_log_id, 'work_log'),
    (v_previous_reviewer_id, 'score_overridden_by_senior', 'Điểm bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh',
     'Công việc "' || v_log.title || '" bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh lại điểm.', p_log_id, 'work_log');

  RETURN jsonb_build_object('success', true, 'message', 'Đã điều chỉnh điểm');
END;
$$;


-- ============================================================
-- 00042_multiperson_task_assignment.sql
-- ============================================================
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


-- ============================================================
-- 00043_delegation_full_unit_scope.sql
-- ============================================================
-- Migration 00043: Uy quyen doi thanh "thay mat 100% toan don vi"
-- Ngay: 28/08/2026
--
-- Boi canh: khong con chon danh sach nguoi cu the (xem migration 00039-
-- 00041) - Truong phong/Vien truong KV uy quyen cho 1 Pho phong/Pho VT
-- KV THAY MAT MINH cham diem TOAN BO don vi, trong 1 khoang thoi gian.
-- Chi 1 uy quyen dang hieu luc tai 1 thoi diem cho 1 cap truong - cap
-- moi khi dang co 1 cai active thi bao loi, phai thu hoi cai cu truoc
-- (dung tinh than "thay mat trong 1 giai doan nhat dinh").
DROP FUNCTION IF EXISTS grant_delegation(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID[]);
CREATE OR REPLACE FUNCTION grant_delegation(
  p_delegate_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_delegate profiles%ROWTYPE;
  v_delegator_role user_role;
  v_delegation_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF p_ends_at <= p_starts_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ngày kết thúc phải sau ngày bắt đầu');
  END IF;

  SELECT * INTO v_delegate FROM profiles WHERE id = p_delegate_id;
  IF v_delegate.id IS NULL OR v_delegate.role != 'unit_deputy' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Người được ủy quyền phải là Phó phòng/Phó Viện trưởng KV');
  END IF;

  SELECT role INTO v_delegator_role FROM profiles WHERE id = v_user_id;
  IF NOT (
    v_delegator_role = 'province_head'
    OR (v_delegator_role = 'unit_head' AND EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id AND unit_id = v_delegate.unit_id))
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền ủy quyền cho người này');
  END IF;

  IF EXISTS (
    SELECT 1 FROM delegations
    WHERE delegator_id = v_user_id AND status = 'active' AND ends_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn đang có 1 ủy quyền còn hiệu lực - hãy thu hồi trước khi cấp ủy quyền mới');
  END IF;

  INSERT INTO delegations (delegator_id, delegate_id, unit_id, starts_at, ends_at, status, granted_by)
  VALUES (v_user_id, p_delegate_id, v_delegate.unit_id, p_starts_at, p_ends_at, 'active', v_user_id)
  RETURNING id INTO v_delegation_id;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    p_delegate_id,
    'delegation_granted',
    'Bạn được ủy quyền thay mặt chấm điểm toàn bộ đơn vị',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã ủy quyền cho bạn thay mặt chấm điểm toàn bộ đơn vị, từ '
      || to_char(p_starts_at, 'DD/MM/YYYY') || ' đến ' || to_char(p_ends_at, 'DD/MM/YYYY') || '.',
    v_delegation_id,
    'delegation'
  );

  RETURN jsonb_build_object('success', true, 'delegation_id', v_delegation_id);
END;
$$;


-- ============================================================
-- 00044_task_assignments_group_visibility.sql
-- ============================================================
-- Migration 00044: Cho phep xem TEN cac dong CUNG NHOM (task_group_id) khi
-- 1 viec duoc giao cho nhieu nguoi cung luc (1 chu tri + N phoi hop).
-- Ngay: 29/08/2026
--
-- Ly do: RLS goc (migration 00031) chi cho xem dong ma minh la assigner
-- HOAC assignee - dung cho mo hinh cu "1 dong = 1 lan giao". Voi mo hinh
-- moi (nhieu dong cung 1 task_group_id, xem migration 00039/00042), phia
-- "Viec duoc giao cho toi" can hien "Cung thuc hien: ..." (ten nhung nguoi
-- khac trong CUNG 1 lan giao), nhung RLS cu se an het cac dong do vi
-- assignee_id cua ho khac voi minh. Mo rong policy: cho xem them cac dong
-- co task_group_id trung voi 1 dong ma minh da co quyen xem san (dung
-- EXISTS tu tham chieu, la mau RLS chuan cua Postgres/Supabase, khong gay
-- de quy vo han vi dieu kien goc (assigner_id/assignee_id = auth.uid())
-- luon tu dat duoc doc lap, khong phu thuoc nhanh EXISTS).
DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
CREATE POLICY "task_assignments_select" ON task_assignments
  FOR SELECT USING (
    assigner_id = auth.uid() OR assignee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM task_assignments t2
      WHERE t2.task_group_id = task_assignments.task_group_id
        AND (t2.assigner_id = auth.uid() OR t2.assignee_id = auth.uid())
    )
  );


-- ============================================================
-- 00045_fix_delete_work_log_permission_call.sql
-- ============================================================
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


