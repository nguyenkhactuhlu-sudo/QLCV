# Task 07 — Dashboard, thông báo và xuất báo cáo

**Ưu tiên:** P1  
**Ước lượng:** 10–16 ngày công  
**Phụ thuộc:** Task 03, 04, 05

## Công việc

- [ ] Chuyển dashboard sang view/RPC tổng hợp; không tải toàn bộ nhật ký về browser để tính.
- [ ] Định nghĩa một nguồn công thức chuẩn cho: tổng kết quả, tổng/bình quân phức tạp, chất lượng có trọng số và tỷ lệ đạt từ 8.
- [ ] Thêm index, giới hạn kỳ thời gian, pagination và cache danh mục ít đổi.
- [ ] Đối soát số dashboard với truy vấn SQL độc lập trên bộ dữ liệu kiểm thử đã biết kết quả.
- [ ] Giữ bộ lọc kỳ/đơn vị/cá nhân theo đúng phạm vi RLS.
- [ ] Triển khai notification server-side cho nhật ký chờ chấm, bị trả lại, được duyệt, tài khoản chờ xác nhận và ủy quyền sắp hết hạn.
- [ ] Realtime chỉ subscribe dữ liệu cần thiết; có fallback refresh/poll hợp lý và dọn subscription khi đổi màn hình.
- [ ] Đánh dấu đã đọc phải idempotent và chỉ tác động thông báo của user hiện tại.
- [ ] Xuất CSV UTF-8/BOM hoặc XLSX theo mẫu đã duyệt; export lớn xử lý server-side.
- [ ] Chống CSV formula injection đối với nội dung do người dùng nhập.
- [ ] Audit các lần xuất báo cáo có dữ liệu cá nhân hoặc phạm vi toàn tỉnh.

## Chỉ tiêu hiệu năng pilot

- Trang nghiệp vụ chính có phản hồi dữ liệu thông thường dưới 2 giây ở staging gần điều kiện production.
- Dashboard phổ biến dưới 3 giây với dữ liệu tối thiểu tương đương 12 tháng và quy mô dự kiến sau mở rộng.
- Danh sách không trả quá giới hạn trang đã định; không có truy vấn N+1 từ browser.
- 30 người thao tác đồng thời trong kịch bản pilot không tạo lỗi dữ liệu hoặc timeout đáng kể.

## Tiêu chí nghiệm thu

- Kết quả tổng hợp khớp 100% bộ dữ liệu đối soát.
- Người dùng chỉ xuất được dữ liệu họ có quyền xem.
- Notification đưa người dùng đến đúng bản ghi và tự cập nhật trạng thái hợp lý.
- File xuất mở đúng tiếng Việt trong Excel/LibreOffice và không thực thi công thức từ dữ liệu nhập.

