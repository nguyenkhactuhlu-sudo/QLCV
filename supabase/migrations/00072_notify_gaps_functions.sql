-- Bo sung thong bao cho 8 truong hop thay doi/xoa du lieu dang KHONG co
-- bat ky hinh thuc bao nao (ra soat toan bo RPC, yeu cau nguoi dung 2026-09-08):
-- 1. delete_task_assignment - xoa han 1 viec da giao (khac update_task_assignment
--    da co thong bao tu migration 00070, cho truong hop sua/rut nguoi).
-- 2. delete_score_adjustment - xoa 1 diem cong/tru dot xuat (them diem da
--    co thong bao tu 00066, xoa thi chua - khong nhat quan).
-- 3. assign_account_role - doi vai tro/don vi 1 tai khoan.
-- 4. set_unit_assignments - doi pham vi don vi phu trach/uy quyen.
-- 5. set_account_active - khoa/mo khoa tai khoan.
-- 6. acknowledge_leave_log - lanh dao xac nhan da biet don nghi phep.
-- 7. save_monthly_self_score - cap duoi tu cham diem thang, bao cho nguoi
--    duyet (chi bao LAN DAU trong ky, tranh spam moi lan sua lai truoc khi nop).
-- 8. set_task_due_date - cap duoi tu dat han hoan thanh cho viec duoc giao,
--    bao cho nguoi giao viec.

CREATE OR REPLACE FUNCTION public.delete_task_assignment(p_task_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_deleted INTEGER;
  v_title TEXT;
  v_assigner_name TEXT;
  v_row RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT title INTO v_title FROM task_assignments
  WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id LIMIT 1;
  IF v_title IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy việc đã giao hoặc bạn không có quyền xoá');
  END IF;
  SELECT full_name INTO v_assigner_name FROM profiles WHERE id = v_user_id;

  -- Bao cho tung nguoi (ke ca da rut khoi viec truoc do, van tung tham
  -- gia nen van nen biet viec bi xoa han) TRUOC khi xoa, vi xoa xong
  -- khong con gi de tra cuu lai.
  FOR v_row IN
    SELECT DISTINCT assignee_id FROM task_assignments
    WHERE task_group_id = p_task_group_id AND assignee_id != v_user_id
  LOOP
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (
      v_row.assignee_id, 'task_deleted', 'Việc đã giao bị xoá',
      coalesce(v_assigner_name, 'Lãnh đạo') || ' đã xoá việc "' || v_title || '".',
      p_task_group_id, 'task_group'
    );
  END LOOP;

  DELETE FROM task_assignments WHERE task_group_id = p_task_group_id AND assigner_id = v_user_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_score_adjustment(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row score_adjustments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  SELECT * INTO v_row FROM score_adjustments WHERE id = p_id;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy điều chỉnh này');
  END IF;
  IF NOT public.can_approve_monthly(v_row.user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền xoá điều chỉnh này');
  END IF;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    v_row.user_id, 'score_adjustment_removed',
    CASE WHEN v_row.delta > 0 THEN 'Điểm cộng đột xuất của bạn đã bị xoá' ELSE 'Điểm trừ đột xuất của bạn đã được xoá' END,
    (SELECT full_name FROM profiles WHERE id = auth.uid()) || ' đã xoá điều chỉnh ' ||
      (CASE WHEN v_row.delta > 0 THEN '+' ELSE '' END) || v_row.delta || ' điểm (kỳ ' || v_row.period ||
      ') - lý do trước đó: ' || v_row.reason,
    NULL, 'score_adjustment'
  );

  DELETE FROM score_adjustments WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_account_role(p_user_id UUID, p_role user_role, p_unit_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role user_role;
  v_unit_name TEXT;
  v_role_label TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role NOT IN ('administrator', 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen gan vai tro/don vi');
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong the tu doi vai tro/don vi cua chinh minh qua chuc nang nay');
  END IF;

  IF p_role = 'administrator' AND v_caller_role != 'administrator' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chi Quan tri vien moi duoc gan vai tro Quan tri vien');
  END IF;

  SELECT name INTO v_unit_name FROM units WHERE id = p_unit_id;
  IF v_unit_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Don vi khong hop le');
  END IF;

  UPDATE profiles SET role = p_role, unit_id = p_unit_id, is_active = true
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong tim thay tai khoan');
  END IF;

  v_role_label := CASE p_role
    WHEN 'administrator' THEN 'Quản trị viên'
    WHEN 'province_head' THEN 'Viện trưởng tỉnh'
    WHEN 'province_deputy' THEN 'Phó Viện trưởng tỉnh'
    WHEN 'unit_head' THEN 'Trưởng phòng/Viện trưởng khu vực'
    WHEN 'unit_deputy' THEN 'Phó phòng/Phó Viện trưởng khu vực'
    WHEN 'staff' THEN 'Cán bộ, Kiểm sát viên'
    WHEN 'support_staff' THEN 'Nhân viên phục vụ'
    ELSE p_role::TEXT
  END;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    p_user_id, 'account_role_changed', 'Vai trò/đơn vị của bạn đã được thay đổi',
    (SELECT full_name FROM profiles WHERE id = auth.uid()) || ' đã đổi vai trò của bạn thành "' ||
      v_role_label || '", đơn vị "' || v_unit_name || '".',
    p_user_id, 'profile'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_unit_assignments(p_user_id UUID, p_unit_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role user_role;
  v_unit_names TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role NOT IN ('administrator', 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen phan cong don vi phu trach');
  END IF;

  DELETE FROM unit_assignments WHERE user_id = p_user_id;

  IF p_unit_ids IS NOT NULL AND array_length(p_unit_ids, 1) > 0 THEN
    INSERT INTO unit_assignments (user_id, unit_id)
    SELECT p_user_id, u FROM unnest(p_unit_ids) AS u;
    SELECT string_agg(name, ', ') INTO v_unit_names FROM units WHERE id = ANY(p_unit_ids);
  END IF;

  IF p_user_id != auth.uid() THEN
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (
      p_user_id, 'account_scope_changed', 'Phạm vi đơn vị phụ trách của bạn đã thay đổi',
      (SELECT full_name FROM profiles WHERE id = auth.uid()) || ' đã cập nhật phạm vi đơn vị bạn phụ trách' ||
        (CASE WHEN v_unit_names IS NOT NULL THEN ': ' || v_unit_names || '.' ELSE ' - hiện không còn phụ trách đơn vị nào.' END),
      p_user_id, 'profile'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_account_active(p_user_id UUID, p_active BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_user_id = auth.uid() AND p_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong the tu khoa chinh minh');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid() AND is_active = true;
  IF v_caller_role NOT IN ('administrator', 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen khoa/mo tai khoan');
  END IF;

  UPDATE profiles SET is_active = p_active WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong tim thay tai khoan');
  END IF;

  IF p_user_id != auth.uid() THEN
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (
      p_user_id, 'account_active_changed',
      CASE WHEN p_active THEN 'Tài khoản của bạn đã được mở lại' ELSE 'Tài khoản của bạn đã bị khoá' END,
      (SELECT full_name FROM profiles WHERE id = auth.uid()) ||
        (CASE WHEN p_active THEN ' đã mở lại tài khoản của bạn - bạn có thể đăng nhập lại.'
              ELSE ' đã khoá tài khoản của bạn.' END),
      p_user_id, 'profile'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_leave_log(p_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    v_log.author_id, 'leave_acknowledged', 'Lãnh đạo đã xác nhận đơn nghỉ phép',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã xác nhận đã biết đơn nghỉ phép "' || v_log.title || '" của bạn.',
    p_log_id, 'work_log'
  );

  IF v_log.range_start_date IS NOT NULL THEN
    PERFORM public.create_work_log_clones(p_log_id);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.save_monthly_self_score(p_period VARCHAR, p_score NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing monthly_reviews%ROWTYPE;
  v_self_role user_role;
  v_self_unit UUID;
  v_approver_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_score < 0 OR p_score > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diem tu cham phai tu 0 den 100');
  END IF;

  SELECT * INTO v_existing FROM monthly_reviews WHERE user_id = v_user_id AND period = p_period;
  IF v_existing.id IS NOT NULL AND v_existing.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ky danh gia nay da khoa');
  END IF;

  INSERT INTO monthly_reviews (user_id, period, self_score, status)
  VALUES (v_user_id, p_period, p_score, 'pending')
  ON CONFLICT (user_id, period) DO UPDATE SET
    self_score = p_score,
    status = CASE WHEN monthly_reviews.status = 'approved' THEN monthly_reviews.status ELSE 'pending' END,
    updated_at = now();

  -- Chi bao cho nguoi duyet 1 LAN DUY NHAT - lan dau tien tu cham trong ky
  -- nay (v_existing.self_score la NULL truoc do) - tranh spam moi lan
  -- nguoi dung sua di sua lai truoc khi lanh dao kip duyet.
  IF v_existing.self_score IS NULL THEN
    SELECT role, unit_id INTO v_self_role, v_self_unit FROM profiles WHERE id = v_user_id;
    v_approver_id := NULL;

    IF v_self_role = 'unit_head' THEN
      SELECT ua.user_id INTO v_approver_id
      FROM unit_assignments ua
      JOIN profiles p2 ON p2.id = ua.user_id AND p2.role = 'province_deputy'
      WHERE ua.unit_id = v_self_unit LIMIT 1;
      IF v_approver_id IS NULL THEN
        SELECT id INTO v_approver_id FROM profiles WHERE role = 'province_head' LIMIT 1;
      END IF;
    ELSIF v_self_role = 'province_deputy' THEN
      SELECT id INTO v_approver_id FROM profiles WHERE role = 'province_head' LIMIT 1;
    ELSE
      -- staff / support_staff / unit_deputy: nguoi duyet chinh la Truong
      -- phong/Vien truong khu vuc cua don vi.
      SELECT id INTO v_approver_id FROM profiles WHERE unit_id = v_self_unit AND role = 'unit_head' LIMIT 1;
    END IF;

    IF v_approver_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
      VALUES (
        v_approver_id, 'monthly_self_score_submitted', 'Có người vừa tự chấm điểm tháng, chờ duyệt',
        (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã tự chấm điểm tháng ' || p_period ||
          ' (' || p_score || ' điểm), đang chờ bạn duyệt.',
        v_user_id, 'profile'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_task_due_date(p_task_id UUID, p_due_date TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  IF v_task.assigner_id != v_user_id THEN
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (
      v_task.assigner_id, 'task_due_date_set', 'Có người vừa đặt hạn hoàn thành cho việc đã giao',
      (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã đặt hạn hoàn thành cho việc "' || v_task.title ||
        '": ' || to_char(p_due_date AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY') || '.',
      v_task.task_group_id, 'task_group'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
