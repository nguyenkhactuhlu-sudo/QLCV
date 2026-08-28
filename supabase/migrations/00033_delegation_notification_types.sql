-- Migration 00033: Them 2 loai thong bao cho su kien uy quyen
-- Ngay: 27/08/2026
--
-- Boi canh: sau khi Truong phong/Chanh van phong cap uy quyen cho Pho
-- phong, ben tai khoan Pho phong khong nhan duoc thong bao gi ca - phai
-- tu vao "Nhat ky cong tac cua don vi" moi biet minh vua duoc uy quyen.
-- Them 2 loai su kien that (dung bang notifications, giong cach da lam
-- voi score_override_escalation/score_overridden_by_senior): cap uy
-- quyen va thu hoi uy quyen. Tach rieng migration nay (chi ALTER TYPE)
-- vi khong the dung gia tri enum moi trong cung transaction vua them no.
ALTER TYPE notification_type ADD VALUE 'delegation_granted';
ALTER TYPE notification_type ADD VALUE 'delegation_revoked';
