# Kế hoạch bàn giao phát triển hệ thống QLCV (UPDATED)

> Cập nhật: 23/08/2026. Mục tiêu gần nhất: phiên bản pilot dùng thật, ổn định cho 30 người.

## Tiến độ hiện tại

| Task | Trạng thái |
|------|-----------|
| 00 - Tổng quan bàn giao | ✅ Hoàn thành |
| 01 - Chốt nghiệp vụ, quyền & an toàn dữ liệu | ✅ Hoàn thành |
| 02 - Chuẩn hóa frontend & môi trường phát triển | ✅ Hoàn thành |
| 03 - Supabase database & migration | ⏳ Chờ thực hiện |
| 04 - Auth, RLS & quản trị tài khoản | ⏳ Chờ thực hiện |
| 05 - Chuyển luồng nghiệp vụ cốt lõi | ⏳ Chờ thực hiện |
| 06 - Google Drive & quản lý tệp | ⏳ Chờ thực hiện |
| 07 - Dashboard, thông báo & báo cáo | ⏳ Chờ thực hiện |
| 08 - Kiểm thử, triển khai & pilot | ⏳ Chờ thực hiện |
| 09 - Vận hành & backlog sau pilot | ⏳ Chờ thực hiện |

## Các mục tiêu phát hành pilot

Phiên bản được coi là sẵn sàng cho 30 người khi:

- [ ] 30 tài khoản thật đăng nhập được, đúng đơn vị và đúng vai trò.
- [ ] Nhật ký, quy trình duyệt/trả lại/trình lại, đánh giá tháng và dashboard chạy trên dữ liệu Supabase thật.
- [ ] RLS chặn được truy cập trái phép ngay cả khi gọi API trực tiếp.
- [ ] Tệp đính kèm được lưu qua cơ chế đã phê duyệt.
- [ ] Có audit log bất biến đối với thay đổi điểm, trạng thái, quyền, nhân sự và tệp.
- [ ] Có backup, kiểm tra khôi phục, log lỗi, cảnh báo và tài liệu vận hành.
- [ ] Hoàn thành UAT với đại diện mọi vai trò.
