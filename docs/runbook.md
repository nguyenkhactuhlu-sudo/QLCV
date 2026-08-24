# Runbook v1.0 - He thong QLCV
# Ngay: 23/08/2026

## 1. Tao/Khoa/Thu hoi tai khoan
### Tao tai khoan moi
1. Admin dang nhap -> Quan tri -> Tai khoan -> Tao moi
2. Nhap email, ho ten, chon don vi
3. He thong gui email moi dang ky

### Khoa tai khoan
1. Admin -> Quan tri -> Tai khoan -> Tim kiem
2. Chon tai khoan -> Khoa

### Thu hoi tai khoan
1. Xoa pending_accounts record
2. Xoa auth.users record (neu can)
3. Kiem tra audit log

## 2. Backup/Restore Database
### Backup
supabase db dump -f backup_$(date +%Y%m%d).sql

### Restore
1. Tao database moi
2. Chay migration tu dau
3. Import seed data
4. Kiem tra consistency

## 3. Xu ly su co
### Mat quyen truy cap
1. Kiem tra session trong auth.users
2. Kiem tra RLS policy
3. Kiem tra delegation con han

### Loi migration
1. Chay rollback migration
2. Sua migration file
3. Chay lai migration
4. Kiem tra data integrity
