-- Migration 00066: Diem cong/tru dot xuat (khen thuong/ky luat phat hien
-- sau khi thang da cham xong) - tinh nang moi theo yeu cau nguoi dung.
-- Can migration 00065 chay truoc (them gia tri enum notification_type).
-- Ngay: 06/09/2026
--
-- Boi canh: co truong hop 1 nhat ky da duoc cham diem, tong ket xong (vi
-- du truy to xong, da cham diem thang) nhung sau do moi phat hien thieu
-- sot/vi pham (vi du bi tra ho so), hoac co thanh tich dot xuat can khen
-- thuong/cong diem - trong khi thang cu DA CHOT, khong nen sua nguoc lai
-- diem da cong bo.
--
-- QUYET DINH DA BAN VOI NGUOI DUNG (khong hoi lai):
-- 1) Ghi thanh 1 BAN GHI RIENG (khong phai nhat ky cong viec, khong ghi
--    de/xoa duoc nhu monthly_reviews.official_score hien tai - xem phat
--    hien quan trong: is_locked chua tung duoc bat, sua thang cu hien tai
--    la GHI DE mat dau vet, chi con 1 dong "note" duy nhat) - moi lan
--    dieu chinh la 1 dong MOI, khong bao gio bi mat di.
-- 2) Luon ap dung vao THANG HIEN TAI (thang phat hien/ra quyet dinh) -
--    KHONG cho chon thang khac, tranh sua nguoc diem thang da chot/da
--    xuat bao cao. Muon lam ro lien quan toi viec cu, ghi trong ly do.
-- 3) Diem goi y duoc TU DIEN vao o "Diem chinh thuc" NEU thang do CHUA
--    duoc duyet lan nao (tranh ghi de len quyet dinh da co san cua lanh
--    dao) - nguoi duyet van sua tay duoc binh thuong. Logic nay lam o
--    client (monthlyDetailHtml), khong can gi them o day.
-- 4) Dung THAM QUYEN DUYET XEP LOAI THANG da co san (can_approve_monthly)
--    - khong them buoc duyet rieng.
-- 5) Nguoi bi ap dung diem duoc XEM lai duoc ly do (RLS SELECT rieng).

CREATE TABLE score_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period VARCHAR NOT NULL,
  delta NUMERIC(5,2) NOT NULL CHECK (delta <> 0 AND delta BETWEEN -100 AND 100),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX score_adjustments_user_period_idx ON score_adjustments(user_id, period);

ALTER TABLE score_adjustments ENABLE ROW LEVEL SECURITY;

-- Chinh nguoi bi/duoc ap dung xem duoc ly do (minh bach, giong moi nhan
-- xet khac trong he thong).
CREATE POLICY "score_adjustments_select_own" ON score_adjustments
  FOR SELECT USING (user_id = auth.uid());

-- Lanh dao co tham quyen duyet xep loai thang cua nguoi do cung xem duoc.
CREATE POLICY "score_adjustments_select_scope" ON score_adjustments
  FOR SELECT USING (public.can_approve_monthly(user_id));

CREATE POLICY "score_adjustments_admin_all" ON score_adjustments
  FOR ALL USING (public.user_role() = 'administrator'::user_role);

-- Khong co policy INSERT/UPDATE/DELETE truc tiep cho nguoi dung thuong -
-- bat buoc di qua 2 RPC ben duoi (giong monthly_reviews) de kiem tra dung
-- tham quyen va ep period luon la thang hien tai.

CREATE TRIGGER trg_audit_score_adjustments AFTER INSERT OR UPDATE OR DELETE ON score_adjustments
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE OR REPLACE FUNCTION create_score_adjustment(
  p_user_id UUID,
  p_delta NUMERIC,
  p_reason TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_creator UUID;
  v_period VARCHAR;
  v_id UUID;
  v_reason TEXT;
BEGIN
  v_creator := auth.uid();
  IF v_creator IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF NOT public.can_approve_monthly(p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền điều chỉnh điểm của người này');
  END IF;

  v_reason := trim(coalesce(p_reason, ''));
  IF v_reason = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập lý do/căn cứ');
  END IF;
  IF p_delta IS NULL OR p_delta = 0 OR abs(p_delta) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số điểm điều chỉnh không hợp lệ');
  END IF;

  -- Luon ap dung vao THANG HIEN TAI theo gio Viet Nam, khong nhan period
  -- tu client - tranh sua nguoc diem thang da chot.
  v_period := to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM');

  INSERT INTO score_adjustments (user_id, period, delta, reason, created_by)
  VALUES (p_user_id, v_period, p_delta, v_reason, v_creator)
  RETURNING id INTO v_id;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    p_user_id,
    'score_adjustment_added',
    CASE WHEN p_delta > 0 THEN 'Bạn được cộng điểm đột xuất' ELSE 'Bạn bị trừ điểm đột xuất' END,
    (SELECT full_name FROM profiles WHERE id = v_creator) || ' đã ' ||
      (CASE WHEN p_delta > 0 THEN 'cộng ' ELSE 'trừ ' END) || abs(p_delta) ||
      ' điểm vào đánh giá tháng ' || v_period || ' - lý do: ' || v_reason,
    v_id,
    'score_adjustment'
  );

  RETURN jsonb_build_object('success', true, 'id', v_id, 'period', v_period);
END;
$$;

CREATE OR REPLACE FUNCTION delete_score_adjustment(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
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

  DELETE FROM score_adjustments WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
