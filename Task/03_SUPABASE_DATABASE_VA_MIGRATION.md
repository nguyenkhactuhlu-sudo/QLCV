# Task 03 — Supabase database, migration và dữ liệu nền

**Ưu tiên:** P0  
**Ước lượng:** 12–18 ngày công  
**Phụ thuộc:** Task 01

## Schema tối thiểu

- `units`: cây đơn vị.
- `profiles`: hồ sơ gắn 1–1 với `auth.users`.
- `user_roles` hoặc `memberships`: vai trò và đơn vị theo thời gian.
- `unit_assignments`: đơn vị được lãnh đạo tỉnh phụ trách.
- `delegations`: ủy quyền có `starts_at`, `ends_at`, người cấp và trạng thái.
- `work_categories`: danh mục công việc.
- `work_logs`: bản ghi nhật ký và trạng thái hiện tại.
- `work_log_revisions`: snapshot/lịch sử mỗi lần trả lại, sửa và trình lại.
- `work_log_reviews`: lần chấm, điểm, nhận xét, người chấm.
- `monthly_reviews`: tự chấm, điểm chính thức, xếp loại, người duyệt.
- `registration_codes` hoặc `invitations`: cơ chế mời/đăng ký có giới hạn và hết hạn.
- `attachments`: metadata tệp, provider, external file id, owner và trạng thái.
- `notifications`: thông báo trong ứng dụng và trạng thái đã đọc.
- `audit_logs`: log append-only cho hành động nhạy cảm.

## Công việc

- [ ] Cài Supabase CLI và tạo cấu trúc migration/seed trong repository.
- [ ] Thiết kế khóa chính UUID, khóa ngoại, unique constraint, check constraint và quy tắc `ON DELETE` rõ ràng.
- [ ] Chuẩn hóa thời gian dùng `timestamptz`; kỳ tháng dùng kiểu/constraint nhất quán.
- [ ] Định nghĩa enum hoặc check constraint cho role, status và classification; tránh chuỗi tùy ý.
- [ ] Tạo index cho các truy vấn chính: tác giả/ngày, đơn vị/ngày, trạng thái/ngày, reviewer, kỳ tháng và thông báo chưa đọc.
- [ ] Dùng transaction hoặc RPC cho thao tác nhiều bước: duyệt/trả lại, trình lại, điều chuyển, ủy quyền và xác nhận tài khoản.
- [ ] Tạo trigger ghi audit ở database cho thay đổi nhạy cảm; frontend không được tự ghi nội dung audit tùy ý.
- [ ] Tạo view/RPC tổng hợp dashboard có lọc theo thời gian và phạm vi.
- [ ] Tạo seed chỉ gồm đơn vị/danh mục/tài khoản test giả; không commit dữ liệu nhân sự thật.
- [ ] Viết script nhập dữ liệu ban đầu có dry-run, validation, log lỗi và khả năng chạy lại an toàn.
- [ ] Viết sơ đồ ERD và data dictionary.

## Tiêu chí nghiệm thu

- Có thể tạo lại database staging từ đầu chỉ bằng migration + seed.
- Migration chạy tiến và rollback/khôi phục theo quy trình đã mô tả.
- Constraint chặn được trạng thái sai, điểm ngoài 1–10, dữ liệu mồ côi và bản ghi tháng trùng.
- Truy vấn dashboard pilot có kế hoạch thực thi hợp lý và dùng đúng index.
- Audit record được tạo khi gọi API/RPC trực tiếp, không phụ thuộc UI.

