-- Migration 00062: Nhan xet cua lanh dao (work_logs.review_comment) truoc
-- day chi hien o giao dien khi nhat ky bi "yeu cau bo sung" hoac bi DIEU
-- CHINH LAI diem (lan cham thu 2 tro len) - nhat ky duyet+cham diem LAN
-- DAU voi nhan xet kem theo bi am tham khong hien o dau ca (chi luu trong
-- DB, khong ai xem lai duoc qua giao dien). Da sua o production/app.js va
-- demo/app.js de luon hien "Nhan xet cua lanh dao" kem nhat ky da xac
-- nhan, o ca "Nhat ky cua toi" (KSV tu tra cuu) lan "Nhat ky cong tac cua
-- don vi" (lanh dao tra cuu).
--
-- Migration nay sua PHIA DU LIEU cho dung voi thay doi UI tren, vi
-- review_comment truoc gio KHONG duoc dong bo sang nhom nhan ban ("cong
-- viec nhieu ngay"):
-- 1) create_work_log_clones() (migration 00058) khong copy review_comment
--    khi sinh cac dong nhan ban -> dong goc co nhan xet, cac dong nhan
--    ban cung viec do lai trong khong, khong dong nhat.
-- 2) override_work_log_score() (migration 00060) chi dong bo lai
--    complexity_score/quality_score cho ca nhom nhan ban, quen dong bo
--    luon review_comment moi -> sua diem xong, chi dung 1 dong (dong vua
--    bam sua) co nhan xet giai thich, cac dong con lai trong nhom van giu
--    nhan xet CU (hoac rong).
-- Ngay: 06/09/2026

CREATE OR REPLACE FUNCTION public.create_work_log_clones(p_primary_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log work_logs%ROWTYPE;
  v_day DATE;
BEGIN
  SELECT * INTO v_log FROM work_logs WHERE id = p_primary_id;
  IF v_log.id IS NULL OR v_log.range_start_date IS NULL THEN
    RETURN;
  END IF;

  v_day := v_log.range_start_date;
  WHILE v_day <= v_log.log_date LOOP
    IF v_day <> v_log.log_date AND EXTRACT(ISODOW FROM v_day) NOT IN (6, 7) THEN
      INSERT INTO work_logs (
        author_id, unit_id, log_date, category_id, title, result, work_role,
        duration, evidence, status, complexity_score, quality_score,
        reviewer_id, reviewed_at, review_comment, submitted_to_id,
        is_clone, clone_group_id
      ) VALUES (
        v_log.author_id, v_log.unit_id, v_day, v_log.category_id, v_log.title, v_log.result, v_log.work_role,
        v_log.duration, v_log.evidence, v_log.status, v_log.complexity_score, v_log.quality_score,
        v_log.reviewer_id, v_log.reviewed_at, v_log.review_comment, v_log.submitted_to_id,
        true, v_log.id
      );
    END IF;
    v_day := v_day + 1;
  END LOOP;
END;
$$;

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
  v_comment TEXT;
  v_is_leave BOOLEAN;
  v_anchor_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_comment := NULLIF(trim(coalesce(p_comment, '')), '');

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

  SELECT is_leave INTO v_is_leave FROM work_categories WHERE id = v_log.category_id;
  IF COALESCE(v_is_leave, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nhật ký nghỉ phép không có điểm để điều chỉnh');
  END IF;

  IF NOT public.can_manage_person(v_log.reviewer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền điều chỉnh điểm đã chấm bởi người này');
  END IF;

  v_previous_reviewer_id := v_log.reviewer_id;

  UPDATE work_logs SET
    complexity_score = p_complexity_score,
    quality_score = p_quality_score,
    review_comment = v_comment,
    reviewer_id = v_user_id,
    reviewed_at = now()
  WHERE id = p_log_id;

  INSERT INTO work_log_reviews (log_id, reviewer_id, complexity_score, quality_score, comment)
  VALUES (p_log_id, v_user_id, p_complexity_score, p_quality_score, v_comment);

  -- Dong bo diem VA nhan xet cho ca nhom nhan ban (neu nhat ky nay la 1
  -- phan cua "cong viec nhieu ngay") - them review_comment vao day (truoc
  -- migration 00062 chi dong bo 2 cot diem, bo sot nhan xet).
  v_anchor_id := COALESCE(v_log.clone_group_id, p_log_id);
  UPDATE work_logs
  SET complexity_score = p_complexity_score, quality_score = p_quality_score, review_comment = v_comment
  WHERE id <> p_log_id AND (id = v_anchor_id OR clone_group_id = v_anchor_id);

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES
    (v_log.author_id, 'score_overridden_by_senior', 'Điểm nhật ký đã bị lãnh đạo cấp trên thay đổi',
     'Công việc "' || v_log.title || '" đã bị lãnh đạo cấp trên thay đổi điểm.', p_log_id, 'work_log'),
    (v_previous_reviewer_id, 'score_overridden_reviewer_notice', 'Điểm bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh',
     'Công việc "' || v_log.title || '" bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh lại điểm.', p_log_id, 'work_log');

  RETURN jsonb_build_object('success', true, 'message', 'Đã điều chỉnh điểm');
END;
$$;

-- Du lieu da ton tai truoc migration nay: cac dong nhan ban da sinh ra
-- truoc do (neu co) van con thieu review_comment cua dong goc - dong bo
-- 1 lan cho du lieu hien co, tu day ve sau ham moi o tren se tu lo.
UPDATE work_logs AS clone_row
SET review_comment = primary_row.review_comment
FROM work_logs AS primary_row
WHERE clone_row.is_clone = true
  AND clone_row.clone_group_id = primary_row.id
  AND clone_row.review_comment IS NULL
  AND primary_row.review_comment IS NOT NULL;
