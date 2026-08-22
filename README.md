# Demo nhật ký công tác VKSND tỉnh

Bản demo mô phỏng các luồng nghiệp vụ chính:

1. Trang chào là màn hình đăng nhập mô phỏng; chọn tài khoản mẫu sẽ tự điền mật khẩu tương ứng hoặc mở đăng ký bằng mã đơn vị.
2. Người dùng đăng ký bằng mã do đơn vị cấp; hệ thống tự xác định đơn vị, tạo quyền cán bộ mặc định và đưa tài khoản vào trạng thái chờ xác nhận.
3. Cán bộ, công chức ghi nhật ký kết quả công việc hằng ngày.
4. Người đứng đầu đơn vị duyệt, chấm độ phức tạp và chất lượng trên thang 1–10.
5. Lãnh đạo tỉnh hoặc lãnh đạo đơn vị xem dashboard theo phạm vi được phân quyền; biểu đồ so sánh nhiều đơn vị được chia thành hai nhóm song song để giữ trang gọn và dễ đọc.
6. Cá nhân tự chấm, người có thẩm quyền duyệt điểm và xếp loại tháng.
7. Quản trị viên tạo/khóa mã đăng ký, xác nhận tài khoản, mô phỏng điều chuyển nhân sự và ủy quyền có thời hạn.
8. Xuất bảng tổng hợp tháng dưới dạng CSV.
9. Lãnh đạo trả lại nhật ký kèm nhận xét; người ghi sửa, trình lại và lãnh đạo chấm lại, đồng thời giữ lịch sử các lần bổ sung.
10. Trung tâm thông báo theo vai trò đưa người dùng đến đúng nhật ký, hồ sơ chờ chấm hoặc tài khoản chờ xác nhận.
11. Bảng kết quả cho phép sắp xếp theo số kết quả, tổng/bình quân phức tạp, chất lượng và tỷ lệ đạt từ 8 điểm.

Dữ liệu nhật ký mô phỏng gồm hơn 1.200 bản ghi trong 6 tháng, trải trên toàn bộ đơn vị, nhiều lĩnh vực công tác, trạng thái duyệt và mức điểm khác nhau. Bộ lọc kỳ báo cáo và biểu đồ xu hướng được tính trực tiếp từ tập dữ liệu này để trình diễn tải dữ liệu ở quy mô trung bình lớn.

## Chạy demo

Có thể mở trực tiếp `index.html`, hoặc chạy máy chủ tĩnh tại thư mục này:

```powershell
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## Tài khoản mô phỏng

Chọn tài khoản ngay trên màn hình đăng nhập; mật khẩu demo tương ứng được điền tự động:

- Viện trưởng tỉnh: xem toàn tỉnh và duyệt nhật ký của cấp dưới trực tiếp.
- Phó Viện trưởng tỉnh: xem các đơn vị được phân công và đánh giá người đứng đầu.
- Trưởng phòng/Viện trưởng khu vực: xem dashboard đơn vị và duyệt nhật ký cán bộ.
- Phó Trưởng phòng được ủy quyền: hỗ trợ chấm nhật ký cán bộ.
- Kiểm sát viên: ghi và xem nhật ký cá nhân.
- Quản trị hệ thống: tạo/khóa mã đăng ký theo đơn vị, xác nhận tài khoản mới, điều chuyển nhân sự, cấp/thu hồi ủy quyền và xem lịch sử thay đổi.

Mã thử trong demo: `P1-2026-A7K9` (Phòng 1) và `KV1-2026-M4N8` (Khu vực 1). Mã chỉ gán đúng đơn vị và không thể cấp quyền lãnh đạo.

Dữ liệu thay đổi được lưu trong `localStorage` của trình duyệt. Nút **Khôi phục dữ liệu mẫu** đưa demo về trạng thái ban đầu.

Tài liệu dành cho lập trình viên hoặc LLM tiếp quản: [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md).

Giao diện sử dụng bộ nhận diện xanh–vàng, biểu trưng ngành Kiểm sát, họa tiết hoa sen và phông Be Vietnam Pro được tham khảo từ Bộ công cụ Kiểm sát. Các tài nguyên được lưu cục bộ trong thư mục `assets`, không gọi CDN; giấy phép phông chữ được lưu tại `assets/fonts/OFL.txt`.

## Phạm vi

## Đưa lên GitHub Pages

1. Đẩy `index.html`, `styles.css`, `app.js` và `README.md` lên nhánh chính của repository.
2. Mở **Settings → Pages**.
3. Chọn **Deploy from a branch**, nhánh chính và thư mục gốc `/root`.
4. Lưu cấu hình và sử dụng đường dẫn GitHub Pages được tạo.

Không cần bước build và không cần máy chủ cơ sở dữ liệu.

## Phạm vi dữ liệu

Đây là prototype giao diện và nghiệp vụ, chưa kết nối Google Forms, Google Sheets, Apps Script hay hệ thống đăng nhập thật.

- Họ tên, chức vụ, chức danh, đơn vị và kết quả tháng 6/2026 được trích từ tài liệu người dùng cung cấp.
- Nhật ký công việc chi tiết, xu hướng biểu đồ, phân công và các thao tác thử nghiệm là dữ liệu mô phỏng.
- Mọi thay đổi chỉ lưu trong `localStorage` của trình duyệt và không làm thay đổi dữ liệu nguồn.

Nếu repository đặt ở chế độ công khai, cần được người có thẩm quyền xác nhận việc công khai danh sách nhân sự trước khi phát hành đường dẫn.
