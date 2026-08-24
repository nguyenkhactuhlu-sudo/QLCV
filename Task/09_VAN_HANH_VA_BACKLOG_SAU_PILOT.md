# Task 09 — Vận hành và backlog sau pilot

**Ưu tiên:** P1  
**Ước lượng ban đầu:** 5–10 ngày công, sau đó duy trì định kỳ  
**Phụ thuộc:** Task 08

## Runbook phải có

- [ ] Tạo/khóa/thu hồi tài khoản và xử lý người chuyển đơn vị.
- [ ] Cấp/thu hồi ủy quyền khẩn cấp và kiểm tra quyền hiệu lực.
- [ ] Xem log, phân loại sự cố, thông báo người dùng và escalation.
- [ ] Backup/restore database, đối soát Drive và khôi phục metadata tệp.
- [ ] Xoay Supabase/Google credential và xử lý khi nghi lộ secret.
- [ ] Triển khai hotfix, rollback frontend và xử lý migration lỗi.
- [ ] Theo dõi quota/chi phí và điều kiện nâng gói.
- [ ] Xuất/khóa/xóa dữ liệu theo thời hạn lưu đã phê duyệt.

## Nhịp vận hành

- Hằng ngày trong tuần đầu: lỗi, auth, hàng chờ, Edge Function, Drive, backup.
- Hằng tuần trong pilot: dung lượng DB/tệp, truy vấn chậm, chi phí, tài khoản không dùng và phản hồi người dùng.
- Hằng tháng: rà soát role/ủy quyền, test restore mẫu, dependency update và báo cáo SLA.
- Hằng quý: rà soát RLS, credential, retention, quyền Shared Drive và kế hoạch capacity.

## Backlog sau khi pilot 30 người ổn định

- [ ] Tối ưu và kiểm thử tải 100–150 người trước đợt mở rộng tiếp theo.
- [ ] Kiểm thử mục tiêu 500 người theo tiêu chí của phương án tổng thể.
- [ ] SSO/SCIM hoặc đồng bộ danh bạ nếu tổ chức có Google Workspace phù hợp.
- [ ] Email/lịch nhắc việc có cấu hình opt-in và chống gửi trùng.
- [ ] Báo cáo PDF/XLSX theo biểu mẫu chính thức và ký số nếu có yêu cầu pháp lý.
- [ ] Chính sách lưu trữ dài hạn/archiving, legal hold và xóa theo lịch.
- [ ] Dashboard quản trị SLA, chất lượng dữ liệu và lịch sử truy cập.
- [ ] Đánh giá an toàn thông tin độc lập trước khi đưa dữ liệu nhạy cảm hơn vào hệ thống.

## Tiêu chí hoàn thành

- Runbook đã được một người không trực tiếp viết hệ thống thực hành thành công.
- Có lịch trực, chủ sở hữu từng dịch vụ và danh sách liên hệ khi sự cố.
- Backlog được ưu tiên theo rủi ro/giá trị, không mở rộng số người dùng chỉ dựa trên cảm nhận.
- Mọi quyết định nâng gói dựa trên CPU/RAM/kết nối/latency/quota/chi phí đo được.

