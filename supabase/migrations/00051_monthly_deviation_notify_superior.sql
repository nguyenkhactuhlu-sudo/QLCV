-- Migration 00051: Bao cho cap tren cua nguoi cham khi cham diem thang
-- lech >=2 diem so voi tu cham (giu nguyen yeu cau bat buoc giai trinh -
-- CHI them thong bao, khong doi dieu kien bat buoc da co)
-- Ngay: 30/08/2026
--
-- Da ra soat lai co che "bat buoc giai trinh khi lech >=2 diem" theo yeu
-- cau: quyen han dung public.can_approve_monthly() - ham nay CHUA TUNG bi
-- doi ten/y nghia tham so (khac can_review_log), doi chieu clien-server
-- (production/app.js canApproveMonthly, demo/app.js cung ten) van khop
-- dung ban SQL hien tai (00041) - khong co loi am tham nao o day. Nguoi
-- dung xac nhan giu nguyen dieu kien bat buoc nay (khac voi
-- override_work_log_score da doi thanh KHONG bat buoc - 2 tinh nang khac
-- nhau, chu y khong nham lan).
--
-- Bo sung theo yeu cau: khi dieu kien lech >=2 diem duoc thoa (da co giai
-- trinh hop le, luu thanh cong), bao THEM 1 thong bao cho cap tren cua
-- CHINH NGUOI VUA CHAM (khong phai cap tren cua nguoi bi cham) - dung lai
-- nguyen logic tim "cap tren" da co san trong approve_work_log() (migration
-- 00041) de nhat quan trong toan he thong. Ghi chu giai trinh (p_note) da
-- luu san trong monthly_reviews.note tu truoc - hien thi lai cho MOI nguoi
-- xem duoc ho so nay (khong chi rieng nguoi duyet) o phan client, dong vai
-- tro "lich su de xem lai duoc" ngay tren chinh ho so.
CREATE OR REPLACE FUNCTION approve_monthly_review(
  p_user_id UUID,
  p_period VARCHAR,
  p_score NUMERIC,
  p_classification VARCHAR,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reviewer UUID;
  v_existing monthly_reviews%ROWTYPE;
  v_is_deviation BOOLEAN;
  v_reviewer_role user_role;
  v_reviewer_unit UUID;
  v_superior_id UUID;
BEGIN
  v_reviewer := auth.uid();
  IF v_reviewer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF NOT public.can_approve_monthly(p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Khong co quyen duyet ho so nay');
  END IF;
  IF p_classification NOT IN ('A', 'B', 'C', 'D') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Xep loai khong hop le');
  END IF;
  IF p_score < 0 OR p_score > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diem chinh thuc phai tu 0 den 100');
  END IF;

  SELECT * INTO v_existing FROM monthly_reviews WHERE user_id = p_user_id AND period = p_period;
  IF v_existing.id IS NOT NULL AND v_existing.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ky danh gia nay da khoa');
  END IF;

  v_is_deviation := v_existing.id IS NOT NULL AND v_existing.self_score IS NOT NULL
    AND abs(p_score - v_existing.self_score) >= 2;

  IF v_is_deviation AND (p_note IS NULL OR length(trim(p_note)) = 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can nhap giai trinh khi dieu chinh tu 2 diem tro len so voi tu cham');
  END IF;

  INSERT INTO monthly_reviews (user_id, period, official_score, classification, note, reviewer_id, reviewed_at, status)
  VALUES (p_user_id, p_period, p_score, p_classification, p_note, v_reviewer, now(), 'approved')
  ON CONFLICT (user_id, period) DO UPDATE SET
    official_score = p_score,
    classification = p_classification,
    note = p_note,
    reviewer_id = v_reviewer,
    reviewed_at = now(),
    status = 'approved';

  IF v_is_deviation THEN
    SELECT role, unit_id INTO v_reviewer_role, v_reviewer_unit FROM profiles WHERE id = v_reviewer;
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
    -- province_head khong co cap tren trong he thong nay - v_superior_id
    -- giu NULL, khong gui thong bao (dung nhu approve_work_log da lam).

    IF v_superior_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
      VALUES (
        v_superior_id,
        'monthly_score_deviation_notice',
        'Chấm điểm tháng lệch so với tự chấm',
        (SELECT full_name FROM profiles WHERE id = v_reviewer) || ' đã chấm điểm chính thức lệch ' ||
          abs(p_score - v_existing.self_score) || ' điểm so với tự chấm của ' ||
          (SELECT full_name FROM profiles WHERE id = p_user_id) || ' (kỳ ' || p_period || ').',
        p_user_id,
        'profile'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
