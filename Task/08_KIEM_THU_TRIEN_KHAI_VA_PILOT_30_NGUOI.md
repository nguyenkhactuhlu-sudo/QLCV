# Task 08 — Kiểm thử, triển khai và pilot 30 người

**Ưu tiên:** P0 trước go-live  
**Ước lượng:** 15–22 ngày công  
**Phụ thuộc:** Task 02–07

## CI/CD và môi trường

- [ ] Tạo Supabase project riêng cho staging và production; không dùng chung dữ liệu/auth.
- [ ] Triển khai frontend lên Cloudflare Pages với preview per PR và production branch được bảo vệ.
- [ ] Thiết lập migration pipeline có bước review/backup và không tự chạy migration phá hủy.
- [ ] Kiểm tra security headers, HTTPS, CSP phù hợp, cache policy và source map production.
- [ ] Thiết lập logging/monitoring cho frontend, Edge Function, database, auth và Drive API.
- [ ] Thiết lập cảnh báo lỗi, dung lượng, quota, chi phí, backup thất bại và truy vấn chậm.

## Kiểm thử bắt buộc

- [ ] Unit test business rules và công thức dashboard.
- [ ] Integration test database/RPC/Edge Functions.
- [ ] RLS test gọi API trực tiếp cho toàn bộ ma trận quyền.
- [ ] E2E test các luồng UAT trên desktop và mobile phổ biến.
- [ ] Test concurrent update, double-submit, refresh session và mạng gián đoạn.
- [ ] Test file upload/permission/quota nếu bật Drive/Storage.
- [ ] Kiểm tra dependency, secret scanning và các lỗi web phổ biến (XSS, CSRF theo mô hình auth, injection, IDOR).
- [ ] Test tải pilot 30 user và test dự phòng ít nhất 100 user; kịch bản dài hạn hướng tới 500 user theo kế hoạch tổng thể.
- [ ] Kiểm tra accessibility cơ bản và tiếng Việt/locale/timezone Asia/Ho_Chi_Minh.
- [ ] Backup database trước go-live và thực hiện ít nhất một lần restore vào môi trường tách biệt.

## Kế hoạch pilot

1. Dry-run nội bộ 3–5 người, đủ vai trò, dùng dữ liệu giả.
2. Sửa toàn bộ lỗi Critical/High và lỗi sai số liệu/quyền.
3. Nhập danh mục và 30 tài khoản đã phê duyệt; gửi hướng dẫn ngắn.
4. Pilot 2–4 tuần với đầu mối hỗ trợ và kênh ghi nhận lỗi.
5. Theo dõi hằng ngày tuần đầu: lỗi, latency, quota, chi phí, hàng chờ và chênh lệch báo cáo.
6. Chốt UAT, danh sách tồn tại được chấp nhận và quyết định go-live/rollback.

## Điều kiện go-live

- Không còn lỗi Critical/High; không có lỗi phân quyền hoặc mất/sai dữ liệu chưa xử lý.
- Tất cả migration production đã review và có kế hoạch rollback/restore.
- Restore drill thành công, có ghi thời gian phục hồi thực tế.
- Chủ nghiệp vụ ký UAT và người phụ trách dữ liệu xác nhận phạm vi dữ liệu được phép.
- Có ít nhất hai người biết cách khóa tài khoản, thu hồi credential và bật trang thông báo sự cố.

## Điều kiện rollback

- Phát hiện truy cập trái phép, sai dữ liệu hàng loạt, mất audit hoặc không thể khôi phục.
- Tỷ lệ lỗi/timeout vượt ngưỡng đã chốt trong 15 phút liên tục.
- Tích hợp Drive làm lộ quyền chia sẻ hoặc tạo file ngoài vị trí được phê duyệt.

