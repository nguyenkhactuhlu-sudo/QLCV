# Task 01 — Chốt nghiệp vụ, quyền và an toàn dữ liệu

**Ưu tiên:** P0  
**Ước lượng:** 5–8 ngày công  
**Phụ thuộc:** Không  
**Chặn:** Mọi hoạt động đưa dữ liệu thật lên cloud

## Công việc

- [ ] Chỉ định một chủ sản phẩm nghiệp vụ và một người có quyền duyệt thay đổi.
- [ ] Chốt danh sách 30 người pilot, đơn vị, chức danh và vai trò; lưu danh sách ở nơi nội bộ được phép.
- [ ] Rà soát và phê duyệt các vai trò hiện có: `province_head`, `province_deputy`, `unit_head`, `unit_deputy`, `staff`, `administrator`.
- [ ] Lập ma trận quyền theo hành động: xem, tạo, sửa, gửi duyệt, trả lại, chấm, duyệt tháng, xuất báo cáo, quản lý người dùng, điều chuyển, ủy quyền và quản lý tệp.
- [ ] Chốt quy tắc cấp trên trực tiếp, phạm vi `assignedUnits` và thời gian hiệu lực của ủy quyền.
- [ ] Chốt trạng thái và chuyển trạng thái hợp lệ của nhật ký/tháng; quy định trường hợp được mở khóa hoặc hủy.
- [ ] Chốt danh mục loại công việc, trường bắt buộc, độ dài nội dung, giới hạn ngày nhập bù và thang điểm.
- [ ] Chốt biểu mẫu báo cáo/CSV bắt buộc và công thức tính chất lượng có trọng số.
- [ ] Phân loại dữ liệu được phép lưu trên Supabase/Drive; xác nhận rõ dữ liệu bị cấm.
- [ ] Chốt thời hạn lưu nhật ký, phiên bản chỉnh sửa, audit log, tệp và backup.
- [ ] Chọn đăng nhập: Google Workspace qua Supabase OAuth nếu có miền tổ chức; nếu không, dùng email/password hoặc magic link có mời và phê duyệt.
- [ ] Chọn kho tệp: ưu tiên Shared Drive của tổ chức; dùng Supabase Storage nếu chưa có Shared Drive/Google Workspace phù hợp.
- [ ] Chốt môi trường `development`, `staging`, `production` và người giữ quyền quản trị từng môi trường.

## Sản phẩm bàn giao

- `docs/requirements.md`: quy trình và business rules đã duyệt.
- `docs/permission-matrix.md`: ma trận vai trò × hành động × phạm vi.
- `docs/data-classification.md`: phân loại, nơi lưu, thời hạn lưu và người chịu trách nhiệm.
- `docs/adr/`: ADR cho lựa chọn đăng nhập, kho tệp và kiến trúc frontend.

## Tiêu chí nghiệm thu

- Mọi ô trong ma trận quyền có kết quả rõ ràng: cho phép/từ chối/cho phép có điều kiện.
- Có chữ ký hoặc xác nhận điện tử của người phụ trách nghiệp vụ và người phụ trách dữ liệu.
- Không còn giả định mở ảnh hưởng đến schema, RLS hoặc cách tích hợp Drive.
- Có bộ 15–25 kịch bản UAT đầu-cuối làm chuẩn cho các task sau.

