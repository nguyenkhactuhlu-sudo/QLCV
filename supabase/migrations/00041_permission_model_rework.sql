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
