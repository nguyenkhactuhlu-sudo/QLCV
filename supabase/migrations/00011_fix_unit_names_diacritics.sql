-- Migration 00011: Sua lai ten don vi cho co dau tieng Viet
-- Ngay: 24/08/2026
-- Du lieu goc trong seed (00001_seed_data.sql) bi nhap thieu dau, sua lai
-- cho dung nhu ten hien thi tren ban demo.

UPDATE units SET name = 'VKSND tỉnh', short_name = 'VKSND tỉnh' WHERE code = 'PROVINCE';
UPDATE units SET name = 'Phòng Thực hành quyền công tố, kiểm sát điều tra án trật tự xã hội', short_name = 'Phòng 1' WHERE code = 'P1';
UPDATE units SET name = 'Phòng nghiệp vụ 2', short_name = 'Phòng 2' WHERE code = 'P2';
UPDATE units SET name = 'Phòng nghiệp vụ 3', short_name = 'Phòng 3' WHERE code = 'P3';
UPDATE units SET name = 'Phòng Kiểm sát thi hành án dân sự', short_name = 'Phòng 7' WHERE code = 'P7';
UPDATE units SET name = 'Phòng nghiệp vụ 8', short_name = 'Phòng 8' WHERE code = 'P8';
UPDATE units SET name = 'Phòng nghiệp vụ 9', short_name = 'Phòng 9' WHERE code = 'P9';
UPDATE units SET name = 'Phòng nghiệp vụ 10', short_name = 'Phòng 10' WHERE code = 'P10';
UPDATE units SET name = 'Phòng nghiệp vụ 15', short_name = 'Phòng 15' WHERE code = 'P15';
UPDATE units SET name = 'Thanh tra - Khiếu tố', short_name = 'Thanh tra - Khiếu tố' WHERE code = 'TT';
UPDATE units SET name = 'Văn phòng tổng hợp', short_name = 'Văn phòng' WHERE code = 'VP';
