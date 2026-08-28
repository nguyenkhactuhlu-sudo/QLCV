-- Migration 00032: Vien truong tinh (province_head) cung xem/thu hoi
-- duoc TOAN BO uy quyen, khong chi rieng cai minh tu cap
-- Ngay: 27/08/2026
--
-- Boi canh: RPC revoke_delegation() (migration 00030) da cho phep
-- province_head thu hoi BAT KY uy quyen nao (khong chi cai ho tu cap),
-- nhung RLS SELECT "delegations_admin_all" (migration 00006) chi cho
-- 'administrator' thay TAT CA - con province_head chi thay duoc dong
-- ho la delegator_id/delegate_id (chinh sach "delegations_select_own").
-- Ket qua: province_head khong thay duoc cac uy quyen do Truong phong/
-- Chanh van phong tu cap cho pho cua ho, nen khong the giam sat/thu hoi
-- qua giao dien du RPC da cho phep.

DROP POLICY IF EXISTS "delegations_admin_all" ON delegations;
CREATE POLICY "delegations_admin_all" ON delegations
  FOR ALL USING (
    public.user_role() IN ('administrator', 'province_head')
  );

DROP POLICY IF EXISTS "delegation_scopes_select" ON delegation_scopes;
CREATE POLICY "delegation_scopes_select" ON delegation_scopes
  FOR SELECT USING (
    public.user_role() IN ('administrator', 'province_head')
    OR EXISTS (
      SELECT 1 FROM delegations d
      WHERE d.id = delegation_id AND (d.delegator_id = auth.uid() OR d.delegate_id = auth.uid())
    )
  );
