-- Migration 00068: Pho phong (unit_deputy) xem duoc DIEM CONG/TRU DOT
-- XUAT cua CA DON VI, khong chi cua rieng minh.
-- Ngay: 2026-09-07
--
-- Boi canh: RLS SELECT hien tai cua score_adjustments (migration 00066)
-- chi cho xem "chinh minh" (user_id = auth.uid()) HOAC "nguoi minh co
-- QUYEN DUYET XEP LOAI THANG" (can_approve_monthly) - ham nay voi
-- unit_deputy YEU CAU dang duoc uy quyen 100% (has_active_delegation),
-- vi day la muc dung cho hanh dong CHAM DIEM CHINH THUC, co chu dinh chi
-- danh cho nguoi dang thay mat toan quyen. Hau qua phu: 1 Pho phong BINH
-- THUONG (chua duoc uy quyen) dang bi COI NHU khong co quyen XEM CA don
-- vi, chi thay dung ban ghi cua chinh minh - trong khi day chi la muc
-- XEM (minh bach, giong cach ho da xem duoc ca Nhat ky cong tac cua don
-- vi khong can uy quyen - RLS work_logs_select_unit khong doi hoi uy
-- quyen). Nguoi dung yeu cau: tach rieng "xem" (khong can uy quyen) voi
-- "duoc THEM/XOA dieu chinh" (van giu nguyen yeu cau can_approve_monthly -
-- KHONG doi trong migration nay, xem create_score_adjustment/
-- delete_score_adjustment o migration 00066).

CREATE POLICY "score_adjustments_select_unit_deputy" ON score_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles me
      WHERE me.id = auth.uid()
        AND me.role = 'unit_deputy'
        AND me.unit_id = (SELECT p.unit_id FROM profiles p WHERE p.id = score_adjustments.user_id)
    )
  );
