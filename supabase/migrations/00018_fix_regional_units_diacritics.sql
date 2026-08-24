-- Migration 00018: Sua dau tieng Viet cho 9 don vi VKSND khu vuc
-- Ngay: 24/08/2026
-- 9 don vi nay khong nam trong seed goc (00001_seed_data.sql chi co khoi
-- phong thuoc tinh), duoc them truc tiep sau do nen bi thieu dau giong
-- truong hop da sua o migration 00011.

UPDATE units SET name = 'VKSND Khu vực 1', short_name = 'Khu vực 1' WHERE code = 'KV1';
UPDATE units SET name = 'VKSND Khu vực 2', short_name = 'Khu vực 2' WHERE code = 'KV2';
UPDATE units SET name = 'VKSND Khu vực 3', short_name = 'Khu vực 3' WHERE code = 'KV3';
UPDATE units SET name = 'VKSND Khu vực 4', short_name = 'Khu vực 4' WHERE code = 'KV4';
UPDATE units SET name = 'VKSND Khu vực 5', short_name = 'Khu vực 5' WHERE code = 'KV5';
UPDATE units SET name = 'VKSND Khu vực 6', short_name = 'Khu vực 6' WHERE code = 'KV6';
UPDATE units SET name = 'VKSND Khu vực 7', short_name = 'Khu vực 7' WHERE code = 'KV7';
UPDATE units SET name = 'VKSND Khu vực 8', short_name = 'Khu vực 8' WHERE code = 'KV8';
UPDATE units SET name = 'VKSND Khu vực 9', short_name = 'Khu vực 9' WHERE code = 'KV9';

-- Danh muc "linh vuc cong tac" trong seed goc (00001_seed_data.sql) cung
-- bi thieu dau tuong tu, sua luon cho dung.
UPDATE work_categories SET name = 'Thực hành quyền công tố' WHERE code = 'THUC_HANH_QUYEN_CONG_TO';
UPDATE work_categories SET name = 'Kiểm sát điều tra' WHERE code = 'KIEM_SAT_DIEU_TRA';
UPDATE work_categories SET name = 'Kiểm sát xét xử' WHERE code = 'KIEM_SAT_XET_XU';
UPDATE work_categories SET name = 'Kiểm sát thi hành án' WHERE code = 'KIEM_SAT_THI_HANH_AN';
UPDATE work_categories SET name = 'Giải quyết đơn thư' WHERE code = 'GIAI_QUYET_DON_THU';
UPDATE work_categories SET name = 'Kiểm sát tạm giữ, tạm giam' WHERE code = 'KIEM_SAT_TAM_GIU_TAM_GIAM';
UPDATE work_categories SET name = 'Công tác đảng đoàn thể' WHERE code = 'CONG_TAC_DANG_DOAN_THE';
UPDATE work_categories SET name = 'Quản lý, chỉ đạo điều hành' WHERE code = 'QUAN_LY_CHI_DAO_DIEU_HANH';
UPDATE work_categories SET name = 'Công tác khác' WHERE code = 'CONG_TAC_KHAC';
