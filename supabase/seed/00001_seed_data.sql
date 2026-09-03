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
  ('THQCT_KS_GIAI_QUYET_VU_AN_HINH_SU', 'THQCT & KS giải quyết vụ án hình sự', 1),
  ('KIEM_SAT_GIAI_QUYET_AN_DAN_SU_HANH_CHINH_KDTM', 'Kiểm sát việc giải quyết án dân sự, hành chính, KDTM, v.v.', 2),
  ('KIEM_SAT_THI_HANH_AN', 'Kiểm sát thi hành án', 3),
  ('GIAI_QUYET_DON_THU', 'Giải quyết đơn thư', 4),
  ('KIEM_SAT_TAM_GIU_TAM_GIAM', 'Kiểm sát tạm giữ, tạm giam', 5),
  ('CONG_TAC_QUAN_LY_AN_HINH_SU', 'Công tác quản lý án hình sự', 6),
  ('CONG_TAC_THAM_MUU_TONG_HOP', 'Công tác tham mưu, tổng hợp', 7),
  ('CONG_TAC_CNTT_CHUYEN_DOI_SO', 'Công tác công nghệ thông tin & chuyển đổi số', 8),
  ('CONG_TAC_DANG_DOAN_THE', 'Công tác đảng đoàn thể', 9),
  ('QUAN_LY_CHI_DAO_DIEU_HANH', 'Quản lý, chỉ đạo điều hành', 10),
  ('CONG_TAC_KHAC', 'Công tác khác', 11)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- ============================================
-- TEST ACCOUNTS (chi dung cho development)
-- ============================================
-- NOTE: These need actual auth.users entries to work.
-- In local dev, create users via Supabase Auth first, then link profiles.
