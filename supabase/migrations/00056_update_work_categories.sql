-- Gom cac linh vuc hinh su cu va bo sung danh muc linh vuc cong tac.
-- Giu cac ban ghi cu o trang thai khong hoat dong de bao toan khoa ngoai
-- va lich su du lieu; toan bo work_logs duoc chuyen sang danh muc moi.

INSERT INTO work_categories (code, name, sort_order, is_active) VALUES
  ('THQCT_KS_GIAI_QUYET_VU_AN_HINH_SU', 'THQCT & KS giải quyết vụ án hình sự', 1, true),
  ('KIEM_SAT_GIAI_QUYET_AN_DAN_SU_HANH_CHINH_KDTM', 'Kiểm sát việc giải quyết án dân sự, hành chính, KDTM, v.v.', 2, true),
  ('CONG_TAC_QUAN_LY_AN_HINH_SU', 'Công tác quản lý án hình sự', 6, true),
  ('CONG_TAC_THAM_MUU_TONG_HOP', 'Công tác tham mưu, tổng hợp', 7, true),
  ('CONG_TAC_CNTT_CHUYEN_DOI_SO', 'Công tác công nghệ thông tin & chuyển đổi số', 8, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

WITH category_ids AS (
  SELECT
    (SELECT id FROM work_categories
      WHERE code = 'THQCT_KS_GIAI_QUYET_VU_AN_HINH_SU') AS target_id,
    ARRAY(
      SELECT id FROM work_categories
      WHERE code IN (
        'THUC_HANH_QUYEN_CONG_TO',
        'KIEM_SAT_DIEU_TRA',
        'KIEM_SAT_XET_XU'
      )
    ) AS legacy_ids
)
UPDATE work_logs
SET category_id = category_ids.target_id
FROM category_ids
WHERE work_logs.category_id = ANY(category_ids.legacy_ids);

UPDATE work_categories
SET is_active = false
WHERE code IN (
  'THUC_HANH_QUYEN_CONG_TO',
  'KIEM_SAT_DIEU_TRA',
  'KIEM_SAT_XET_XU'
);

UPDATE work_categories SET sort_order = 3 WHERE code = 'KIEM_SAT_THI_HANH_AN';
UPDATE work_categories SET sort_order = 4 WHERE code = 'GIAI_QUYET_DON_THU';
UPDATE work_categories SET sort_order = 5 WHERE code = 'KIEM_SAT_TAM_GIU_TAM_GIAM';
UPDATE work_categories SET sort_order = 9 WHERE code = 'CONG_TAC_DANG_DOAN_THE';
UPDATE work_categories SET sort_order = 10 WHERE code = 'QUAN_LY_CHI_DAO_DIEU_HANH';
UPDATE work_categories SET sort_order = 11 WHERE code = 'CONG_TAC_KHAC';
