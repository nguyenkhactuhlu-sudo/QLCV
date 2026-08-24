-- Seed data cho QLCV development/staging
-- Chi chua du lieu danh muc va tai khoan gia, KHONG co du lieu nhan su that

-- ============================================
-- UNITS (don vi)
-- ============================================
INSERT INTO units (id, code, name, short_name, type, parent_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'PROVINCE', 'VKSND tinh', 'VKSND tinh', 'province', NULL),
  ('00000000-0000-0000-0000-000000000002', 'P1', 'Phong Thuc hanh quyen cong to, kiem sat dieu tra an trat tu xa hoi', 'Phong 1', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'P2', 'Phong nghiep vu 2', 'Phong 2', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000004', 'P3', 'Phong nghiep vu 3', 'Phong 3', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000005', 'P7', 'Phong Kiem sat thi hanh an dan su', 'Phong 7', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000006', 'P8', 'Phong nghiep vu 8', 'Phong 8', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000007', 'P9', 'Phong nghiep vu 9', 'Phong 9', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000008', 'P10', 'Phong nghiep vu 10', 'Phong 10', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000009', 'P15', 'Phong nghiep vu 15', 'Phong 15', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-00000000000a', 'TT', 'Thanh tra - Khieu to', 'Thanh tra', 'department', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-00000000000b', 'VP', 'Van phong tong hop', 'Van phong', 'department', '00000000-0000-0000-0000-000000000001');

-- ============================================
-- WORK CATEGORIES (danh muc cong viec)
-- ============================================
INSERT INTO work_categories (code, name, sort_order) VALUES
  ('THUC_HANH_QUYEN_CONG_TO', 'Thuc hanh quyen cong to', 1),
  ('KIEM_SAT_DIEU_TRA', 'Kiem sat dieu tra', 2),
  ('KIEM_SAT_XET_XU', 'Kiem sat xet xu', 3),
  ('KIEM_SAT_THI_HANH_AN', 'Kiem sat thi hanh an', 4),
  ('GIAI_QUYET_DON_THU', 'Giai quyet don thu', 5),
  ('KIEM_SAT_TAM_GIU_TAM_GIAM', 'Kiem sat tam giu tam giam', 6),
  ('CONG_TAC_DANG_DOAN_THE', 'Cong tac dang doan the', 7),
  ('QUAN_LY_CHI_DAO_DIEU_HANH', 'Quan ly chi dao dieu hanh', 8),
  ('CONG_TAC_KHAC', 'Cong tac khac', 9);

-- ============================================
-- TEST ACCOUNTS (chi dung cho development)
-- ============================================
-- NOTE: These need actual auth.users entries to work.
-- In local dev, create users via Supabase Auth first, then link profiles.
