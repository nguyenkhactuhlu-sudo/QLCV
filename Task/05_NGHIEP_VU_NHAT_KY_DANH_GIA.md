# Task 05 — Chuyển luồng nghiệp vụ cốt lõi sang dữ liệu thật

**Ưu tiên:** P0  
**Ước lượng:** 15–25 ngày công  
**Phụ thuộc:** Task 02, 03, 04

## Công việc

- [ ] Thay adapter `localStorage` bằng repository/API Supabase cho nhật ký, đánh giá tháng, nhân sự, ủy quyền và audit.
- [ ] Triển khai tạo nhật ký với validation ngày, danh mục, tiêu đề, kết quả, vai trò công việc, thời lượng và bằng chứng.
- [ ] Chốt và thực thi state machine thay vì cho client cập nhật `status` tùy ý.
- [ ] Triển khai hàng chờ người chấm theo đúng phạm vi RLS, có phân trang và sắp xếp ưu tiên bản trình lại.
- [ ] Triển khai duyệt/chấm hai tiêu chí 1–10 và trả lại có nhận xét bắt buộc.
- [ ] Khi trình lại: lưu snapshot cũ, tăng số lần, xóa điểm hiện tại theo rule và giữ toàn bộ lịch sử.
- [ ] Ngăn double-submit và xung đột cập nhật bằng transaction/version/`updated_at` check.
- [ ] Triển khai tự chấm tháng, duyệt điểm chính thức, xếp loại và khóa kỳ.
- [ ] Triển khai quản trị điều chuyển và ủy quyền theo ngày hiệu lực, không sửa hồi tố dữ liệu lịch sử.
- [ ] Hiển thị lỗi quyền/validation/thời gian hết phiên bằng thông báo dễ hiểu, không lộ chi tiết nội bộ.
- [ ] Xóa hoặc vô hiệu hóa nút “khôi phục dữ liệu mẫu” ở production.
- [ ] Viết unit/integration/E2E test cho toàn bộ state transition.

## Kịch bản nghiệm thu đầu-cuối

1. Staff tạo nhật ký → unit head thấy trong hàng chờ → chấm và duyệt → dashboard cập nhật.
2. Unit head trả lại → staff thấy nhận xét → sửa/trình lại → chấm lần hai → lịch sử còn đủ hai phiên bản.
3. Deputy có ủy quyền chấm trong thời hạn; ngoài thời hạn bị chặn.
4. Điều chuyển nhân sự không làm đổi đơn vị lịch sử của nhật ký cũ.
5. Đánh giá tháng lấy đúng dữ liệu kỳ, duyệt xong bị khóa theo rule.
6. Hai người cùng thao tác một bản ghi không ghi đè im lặng.

## Tiêu chí nghiệm thu

- Không còn thao tác nghiệp vụ production nào ghi vào `localStorage`.
- Mọi thay đổi nhạy cảm tạo audit và có actor/time/request context phù hợp.
- Refresh trang hoặc đăng nhập ở máy khác vẫn thấy dữ liệu nhất quán.
- E2E test các kịch bản trên chạy ổn định trên staging.

