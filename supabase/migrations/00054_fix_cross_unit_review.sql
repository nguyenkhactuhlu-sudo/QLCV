-- Migration 00054: Chan Pho phong duyet ho nhat ky KHAC don vi minh
-- Ngay: 30/08/2026
--
-- LO HONG (phat hien qua ra soat bao mat): can_review_log() nhanh
-- unit_deputy chi kiem tra "nhat ky co nop cho toi khong" (submitted_to_id
-- = auth.uid()), KHONG kiem tra lai nguoi nop va nguoi duyet co CUNG DON
-- VI khong. O man hinh ghi nhat ky, o "Nop cho lanh dao" da loc dung chi
-- hien lanh dao cung don vi - nhung day chi la loc GIAO DIEN, phia sau
-- (RPC nay) khong kiem tra lai. Neu ai do gui thang yeu cau (bo qua giao
-- dien) ghi submitted_to_id la 1 Pho phong o DON VI KHAC, Pho phong do
-- van duyet duoc - "chon" duoc nguoi de dai hon thay vi dung cap tren
-- that cua minh.
--
-- SUA: them dieu kien "cung don vi" (v_author_unit = v_reviewer_unit) vao
-- dung nhanh dang thieu, giu nguyen toan bo logic con lai.
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
    RETURN v_author_unit = v_reviewer_unit AND v_submitted_to_id IS NOT NULL AND v_submitted_to_id = auth.uid();
  END IF;

  -- province_head/province_deputy/unit_head: luon dua tren tac gia,
  -- khong phu thuoc submitted_to_id (cap truong luon co toan quyen).
  RETURN public.can_manage_person(v_author_id);
END;
$$;
