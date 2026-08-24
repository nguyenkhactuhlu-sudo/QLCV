# Task 04 — Đăng nhập thật, RLS và quản trị tài khoản

**Ưu tiên:** P0/Critical  
**Ước lượng:** 12–20 ngày công  
**Phụ thuộc:** Task 01, Task 03

## Công việc

- [ ] Cấu hình Supabase Auth theo ADR đã duyệt; tách redirect URL cho local/staging/production.
- [ ] Chỉ cho email thuộc allowlist/miền hợp lệ tham gia pilot; tài khoản mới ở trạng thái chờ duyệt nếu nghiệp vụ yêu cầu.
- [ ] Tạo profile server-side khi có user mới; không cho client tự gán role lãnh đạo/quản trị.
- [ ] Thiết kế helper SQL xác định user hiện tại, đơn vị, vai trò hiệu lực, phạm vi được giao và ủy quyền còn hạn.
- [ ] Bật RLS trên toàn bộ bảng exposed qua API; policy nền là deny-by-default.
- [ ] Viết policy SELECT/INSERT/UPDATE/DELETE riêng cho từng bảng và từng vai trò.
- [ ] Chỉ chính tác giả được sửa nhật ký ở trạng thái cho phép; nhật ký đã duyệt không sửa trực tiếp.
- [ ] Người chấm không được chấm chính mình và chỉ chấm đúng tuyến/ủy quyền còn hiệu lực.
- [ ] Chỉ administrator được xác nhận tài khoản, đổi vai trò, điều chuyển và cấp/thu hồi ủy quyền; mọi thao tác qua RPC kiểm soát.
- [ ] Service-role key không xuất hiện ở frontend, log trình duyệt hoặc Cloudflare public variables.
- [ ] Cấu hình timeout/session refresh, đăng xuất, thu hồi tài khoản và xử lý tài khoản bị khóa.
- [ ] Rate-limit luồng đăng nhập/đăng ký/mã mời ở lớp phù hợp.
- [ ] Viết test ma trận RLS bằng nhiều JWT test và gọi REST/RPC trực tiếp, bao gồm ca phủ định.

## Bộ test bắt buộc

- Staff A không đọc/sửa nhật ký của Staff B ngoài phạm vi.
- Unit head chỉ đọc/chấm đúng đơn vị và không chấm bản thân.
- Province deputy chỉ thấy `assignedUnits` hiệu lực.
- Unit deputy chỉ chấm khi delegation còn hiệu lực; hết hạn phải bị từ chối ngay cả khi UI cũ còn mở.
- Administrator không mặc nhiên được đọc nội dung nghiệp vụ nếu ma trận quyền không cho phép.
- Người dùng không thể tự đổi `role`, `unit_id`, `author_id`, điểm, reviewer hoặc status qua payload giả.
- Anon user không đọc được dữ liệu nghiệp vụ.

## Tiêu chí nghiệm thu

- 100% ca trong ma trận quyền có test cho phép và test từ chối.
- Không thể vượt quyền bằng cách sửa request trong DevTools hoặc gọi Supabase API trực tiếp.
- Quy trình mời, duyệt, khóa, mở khóa và thu hồi phiên có audit đầy đủ.
- Có tài liệu xử lý mất quyền truy cập OAuth/email và quy trình cấp lại an toàn.

