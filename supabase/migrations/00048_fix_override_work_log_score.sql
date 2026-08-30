-- Migration 00048: Bo bat buoc nhap nhan xet khi lanh dao cap tren dieu
-- chinh diem da cham cua cap duoi
-- Ngay: 30/08/2026
--
-- Boi canh: kiem tra truc tiep tren du lieu that cho thay quyen han cua
-- override_work_log_score() (migration 00029) van hoat dong dung (Vien
-- truong tinh dieu chinh duoc diem da duyet boi Truong phong/Chanh Van
-- phong) - KHONG sua gi phan kiem tra quyen (public.can_review_log(...)),
-- tranh dong vao phan dang chay dung de khong lo phat sinh loi moi.
--
-- Cai thuc su can sua: ham dang BAT BUOC p_comment khac rong (loi "Bat
-- buoc nhap nhan xet khi dieu chinh diem") - day chinh la thu nguoi dung
-- gap phai va tuong nham la "khong dieu chinh duoc". Theo yeu cau moi:
-- lanh dao cap tren dieu chinh diem CO THE giai thich hoac KHONG can giai
-- thich - bo bat buoc, chi con bat buoc khi CO nhap thi luu dung nhu da go.
--
-- PHAT HIEN THEM khi kiem tra tren du lieu that: bang work_log_reviews da
-- BAT ROW LEVEL SECURITY (migration 00002) nhung CHUA TUNG CO POLICY SELECT
-- nao - nghia la KHONG AI (ke ca Vien truong tinh) doc duoc lich su dieu
-- chinh diem qua API, du ham override_work_log_score() van ghi du lieu vao
-- dung. Day chinh la ly do "can bo, KSV cap duoi khong xem duoc ai da
-- chinh diem, ly do" - khong phai thieu giao dien, ma du lieu khong the
-- doc duoc tu goc. Them policy: ai xem duoc nhat ky (work_logs, da co san
-- 4 policy SELECT khac) thi xem duoc lich su cham/dieu chinh cua chinh
-- nhat ky do.
CREATE POLICY "work_log_reviews_select_via_log" ON work_log_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM work_logs wl WHERE wl.id = work_log_reviews.log_id)
  );

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

  -- "cap tren" = bat ky ai hop le de duyet duoc CHINH nguoi da cham truoc
  -- do (khong doi - da kiem tra truc tiep tren du lieu that, hoat dong dung).
  IF NOT public.can_review_log(v_log.reviewer_id) THEN
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

  -- Tach rieng 2 loai thong bao (khac migration 00029 goc dung chung 1
  -- type) de client dieu huong dung: tac gia co the la nhan vien thuong
  -- (khong vao duoc "Nhat ky cong tac cua don vi" - trang chi lanh dao),
  -- trong khi nguoi CHAM TRUOC luon la 1 lanh dao (moi duyet duoc nhat ky
  -- nguoi khac) nen vao duoc trang do de xem lai.
  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES
    (v_log.author_id, 'score_overridden_by_senior', 'Điểm nhật ký đã bị lãnh đạo cấp trên thay đổi',
     'Công việc "' || v_log.title || '" đã bị lãnh đạo cấp trên thay đổi điểm.', p_log_id, 'work_log'),
    (v_previous_reviewer_id, 'score_overridden_reviewer_notice', 'Điểm bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh',
     'Công việc "' || v_log.title || '" bạn đã chấm đã bị lãnh đạo cấp trên điều chỉnh lại điểm.', p_log_id, 'work_log');

  RETURN jsonb_build_object('success', true, 'message', 'Đã điều chỉnh điểm');
END;
$$;
