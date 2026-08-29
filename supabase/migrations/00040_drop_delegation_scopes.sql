-- Migration 00040: Bo bang delegation_scopes (khong con dung)
-- Ngay: 28/08/2026
--
-- Uy quyen doi nghia thanh "thay mat 100% toan don vi" (xem migration
-- 00043), khong con chon danh sach nguoi cu the nua. Da xac nhan bang
-- delegations/delegation_scopes hien dang rong trong production (chua
-- ai thuc su cap uy quyen qua giao dien), an toan de xoa truc tiep.
DROP POLICY IF EXISTS "delegation_scopes_select" ON delegation_scopes;
DROP TABLE IF EXISTS delegation_scopes;
