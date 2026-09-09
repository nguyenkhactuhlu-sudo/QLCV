-- Migration 00077: Uy quyen xem/xuat bao cao tong hop thang toan tinh
-- Ngay: 2026-09-09
--
-- Yeu cau nguoi dung: Phong 15 la bo phan tham muu chinh ve cong tac nhan
-- su, can 1 tinh nang de Vien truong uy quyen cho 1 nguoi nao do (vi du
-- Truong phong 15) trich xuat bieu tong hop thang GIONG NHU tren tai khoan
-- Vien truong. Cac quyet dinh da chot voi nguoi dung:
-- 1) Pham vi: TOAN TINH nhu Vien truong (xem duoc ca Vien truong/Pho VT).
-- 2) VO THOI HAN - khong co ngay ket thuc, chi het hieu luc khi bi thu hoi
--    (KHAC han bang `delegations` hien co - bang do bat buoc co ends_at,
--    dung cho "thay mat 100%" mang tinh giai doan - xem migration 00043/
--    00061. Khong tai su dung bang do vi se phai noi long rang buoc
--    ends_at NOT NULL, anh huong toi 1 tinh nang khac khong lien quan).
-- 3) CHI THEM 1 quyen duy nhat (xem/xuat "Cham diem thang" toan tinh) -
--    KHONG doi vai tro goc cua nguoi duoc uy quyen o bat ky man hinh nao
--    khac (giao viec, duyet nhat ky don vi minh... giu nguyen) - KHONG cap
--    quyen duyet/sua diem cua ai (can_approve_monthly khong doi).

CREATE TABLE monthly_report_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES profiles(id),
  delegate_id UUID NOT NULL REFERENCES profiles(id),
  granted_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_monthly_report_delegations_delegate_active
  ON monthly_report_delegations(delegate_id) WHERE status = 'active';

ALTER TABLE monthly_report_delegations ENABLE ROW LEVEL SECURITY;

-- Chi nguoi cap (delegator) va chinh nguoi duoc uy quyen (delegate) xem
-- duoc dong lien quan toi minh - khong ai khac xem duoc uy quyen cua
-- nguoi khac (kha nang xoa/thu hoi di qua RPC rieng, khong co policy
-- UPDATE/INSERT truc tiep).
CREATE POLICY "monthly_report_delegations_select" ON monthly_report_delegations
  FOR SELECT USING (delegator_id = auth.uid() OR delegate_id = auth.uid());

CREATE TRIGGER trg_audit_monthly_report_delegations
  AFTER INSERT OR UPDATE OR DELETE ON monthly_report_delegations
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Ham dung chung o RLS cua cac bang du lieu nghiep vu ben duoi, giong kieu
-- has_active_delegation() da co (migration 00041).
CREATE OR REPLACE FUNCTION public.has_active_monthly_report_delegation(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM monthly_report_delegations
    WHERE delegate_id = COALESCE(p_user_id, auth.uid()) AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION grant_monthly_report_delegation(p_delegate_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_delegate profiles%ROWTYPE;
  v_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'province_head') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ Viện trưởng tỉnh mới cấp được ủy quyền này');
  END IF;
  IF p_delegate_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không thể tự ủy quyền cho chính mình');
  END IF;

  SELECT * INTO v_delegate FROM profiles WHERE id = p_delegate_id AND is_active = true;
  IF v_delegate.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy người được ủy quyền hoặc tài khoản đã bị khoá');
  END IF;
  IF v_delegate.role = 'administrator' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không ủy quyền được cho tài khoản Quản trị viên');
  END IF;

  IF EXISTS (SELECT 1 FROM monthly_report_delegations WHERE delegate_id = p_delegate_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Người này đang có ủy quyền còn hiệu lực');
  END IF;

  INSERT INTO monthly_report_delegations (delegator_id, delegate_id, granted_by)
  VALUES (v_user_id, p_delegate_id, v_user_id)
  RETURNING id INTO v_id;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    p_delegate_id,
    'monthly_report_delegation_granted',
    'Bạn được ủy quyền xem/xuất báo cáo tổng hợp tháng toàn tỉnh',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã ủy quyền cho bạn xem và xuất báo cáo tổng hợp chấm điểm tháng của toàn tỉnh - có hiệu lực ngay, không có ngày hết hạn, chỉ mất hiệu lực khi bị thu hồi.',
    v_id,
    'monthly_report_delegation'
  );

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION revoke_monthly_report_delegation(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_row monthly_report_delegations%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT * INTO v_row FROM monthly_report_delegations WHERE id = p_id;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy ủy quyền này');
  END IF;
  IF v_row.delegator_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ người đã cấp ủy quyền này mới thu hồi được');
  END IF;
  IF v_row.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ủy quyền này đã được thu hồi trước đó');
  END IF;

  UPDATE monthly_report_delegations
    SET status = 'revoked', revoked_at = now(), revoked_by = v_user_id
    WHERE id = p_id;

  INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (
    v_row.delegate_id,
    'monthly_report_delegation_revoked',
    'Ủy quyền xem/xuất báo cáo tổng hợp tháng đã bị thu hồi',
    (SELECT full_name FROM profiles WHERE id = v_user_id) || ' đã thu hồi ủy quyền xem/xuất báo cáo tổng hợp tháng toàn tỉnh của bạn.',
    p_id,
    'monthly_report_delegation'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Mo rong pham vi xem CHI o 3 bang can cho man hinh "Cham diem thang" +
-- xuat bao cao (profiles, work_logs, monthly_reviews) + score_adjustments
-- (de bao cao hien du "diem cong/tru dot xuat"). KHONG dung toi bat ky
-- bang/RPC nao khac - can_approve_monthly/can_manage_person KHONG doi, nen
-- create_score_adjustment/delete_score_adjustment/approve_work_log/
-- override_work_log_score... nguoi giu uy quyen nay VAN KHONG goi duoc
-- (dung y "chi xem/xuat, khong duyet/sua" da chot).
DROP POLICY IF EXISTS "work_logs_select_province" ON work_logs;
CREATE POLICY "work_logs_select_province" ON work_logs
  FOR SELECT USING (
    public.user_role() = 'province_head'::user_role
    OR public.has_active_monthly_report_delegation()
  );

DROP POLICY IF EXISTS "profiles_select_province_scope" ON profiles;
CREATE POLICY "profiles_select_province_scope" ON profiles
  FOR SELECT USING (
    user_role() = ANY (ARRAY['province_head'::user_role, 'administrator'::user_role])
    OR public.has_active_monthly_report_delegation()
  );

CREATE POLICY "monthly_reviews_select_monthly_report_delegate" ON monthly_reviews
  FOR SELECT USING (public.has_active_monthly_report_delegation());

CREATE POLICY "score_adjustments_select_monthly_report_delegate" ON score_adjustments
  FOR SELECT USING (public.has_active_monthly_report_delegation());

COMMENT ON TABLE monthly_report_delegations IS 'Uy quyen VO THOI HAN (den khi bi thu hoi) cho 1 nguoi xem/xuat bao cao tong hop cham diem thang toan tinh nhu Vien truong - khong cap quyen duyet/sua diem cua ai.';
