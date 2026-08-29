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
