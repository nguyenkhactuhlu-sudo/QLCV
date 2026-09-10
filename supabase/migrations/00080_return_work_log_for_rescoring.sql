-- Migration 00080: "Tra de cham diem lai" - yeu cau nguoi dung 2026-09-10
--
-- Boi canh: co truong hop lanh dao (cap pho) bam nham "Xac nhan ket qua"
-- (cham diem/duyet) trong khi y dinh la "Yeu cau bo sung" - nhat ky bi
-- duyet+cham nham, khong the tu sua lai (nut "Yeu cau bo sung" chi dung
-- duoc khi con 'pending'). Can 1 tinh nang o tai khoan lanh dao TU cap
-- Truong phong/Vien truong khu vuc tro len (unit_head, province_deputy,
-- province_head) de tra 1 nhat ky DA DUYET ve dung nguoi da cham truoc do
-- (cap duoi cua ho) de cham lai, kem 1 loi nhan bat buoc giai thich ly do.
--
-- Dung LAI CHINH XAC dieu kien quyen han da co san cua "Dieu chinh diem"
-- (override_work_log_score, migration 00029/00048/00049/00062) -
-- can_manage_person(v_log.reviewer_id) - vi day chinh la dung pham vi
-- "tu Truong phong/Vien truong khu vuc tro len quan ly duoc nguoi da
-- cham" ma nguoi dung yeu cau (unit_deputy khong bao gio thoa dieu kien
-- nay tren thuc te, vi nguoi da cham 1 nhat ky luon la lanh dao - khong
-- bao gio la staff/support_staff - nen tu dong dung "tu Truong phong tro
-- len" ma khong can them dieu kien vai tro rieng). Ap dung dung cho ca
-- truong hop Pho Vien truong tinh tra lai cho Truong phong/Vien truong
-- khu vuc (can_manage_person da xu ly dung nhanh nay tu truoc).
--
-- Co che: dua nhat ky ve 'pending' (giong het huong xu ly cua
-- reject_work_log - xoa diem, ghi loi nhan cua cap tren vao
-- review_comment) + rieng them cot moi rescoring_requested_by de biet
-- CHINH XAC ai vua yeu cau (khac voi "Yeu cau bo sung" thuong - review_
-- comment cua truong hop do la loi nhan gui TAC GIA, khong co cot rieng
-- nay). Client dung dung 2 dieu kien "status='pending' VA rescoring_
-- requested_by khong rong" de nhan biet + hien banner rieng trong hang
-- cho duyet (khac voi 1 nhat ky pending binh thuong chua ai cham).

ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS rescoring_requested_by UUID REFERENCES profiles(id);

CREATE OR REPLACE FUNCTION return_work_log_for_rescoring(
  p_log_id UUID,
  p_comment TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_user_id UUID;
  v_comment TEXT;
  v_is_leave BOOLEAN;
  v_previous_reviewer_id UUID;
  v_anchor_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_comment := NULLIF(trim(coalesce(p_comment, '')), '');
  IF v_comment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập lời nhắn cho người chấm lại');
  END IF;

  SELECT * INTO v_log FROM work_logs WHERE id = p_log_id;
  IF v_log.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work log not found');
  END IF;
  IF v_log.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ trả lại được nhật ký đã duyệt');
  END IF;
  IF v_log.reviewer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký chưa có người chấm trước đó');
  END IF;
  IF v_log.reviewer_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn chính là người đã chấm - hãy chấm lại trực tiếp, không cần trả lại');
  END IF;

  SELECT is_leave INTO v_is_leave FROM work_categories WHERE id = v_log.category_id;
  IF COALESCE(v_is_leave, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký nghỉ phép không có điểm để trả lại chấm điểm');
  END IF;

  IF NOT public.can_manage_person(v_log.reviewer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền trả lại nhật ký đã chấm bởi người này');
  END IF;

  v_previous_reviewer_id := v_log.reviewer_id;

  INSERT INTO work_log_revisions (log_id, version, snapshot, complexity_score, quality_score, review_comment, created_by)
  VALUES (p_log_id, v_log.version, row_to_json(v_log)::jsonb, v_log.complexity_score, v_log.quality_score, v_log.review_comment, v_user_id);

  -- Neu la 1 phan cua "cong viec nhieu ngay" (co the la dong goc hoac 1
  -- dong nhan ban - xem migration 00058), xoa het ca nhom nhan ban truoc:
  -- se duoc sinh lai sach se qua create_work_log_clones() khi dong goc
  -- duoc cham lai va duyet, tranh sinh trung lap neu giu lai nhom cu.
  v_anchor_id := COALESCE(v_log.clone_group_id, p_log_id);
  DELETE FROM work_logs WHERE clone_group_id = v_anchor_id;

  UPDATE work_logs SET
    status = 'pending',
    complexity_score = NULL,
    quality_score = NULL,
    review_comment = v_comment,
    reviewer_id = NULL,
    reviewed_at = NULL,
    rescoring_requested_by = v_user_id,
    version = version + 1
  WHERE id = v_anchor_id;

  IF v_log.task_assignment_id IS NOT NULL THEN
    UPDATE task_assignments SET status = 'pending', updated_at = now() WHERE id = v_log.task_assignment_id;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES
    (v_previous_reviewer_id, 'work_log_returned_for_rescoring', 'Cấp trên yêu cầu bạn chấm lại 1 nhật ký',
     'Công việc "' || v_log.title || '" bạn đã chấm bị trả lại để chấm lại - lời nhắn: ' || v_comment, v_anchor_id, 'work_log'),
    (v_log.author_id, 'work_log_returned_for_rescoring_author_notice', 'Nhật ký của bạn đang được chấm lại',
     'Công việc "' || v_log.title || '" đang được lãnh đạo cấp trên yêu cầu chấm lại điểm, kết quả tạm thời quay về trạng thái chờ chấm điểm.', v_anchor_id, 'work_log');

  RETURN jsonb_build_object('success', true, 'message', 'Đã trả lại để chấm điểm lại');
END;
$$;

COMMENT ON COLUMN work_logs.rescoring_requested_by IS 'Nguoi (cap tren cua nguoi cham) vua tra nhat ky nay ve pending de cham lai - xem return_work_log_for_rescoring().';
