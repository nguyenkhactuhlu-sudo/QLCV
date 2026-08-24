# Task 06 — Google Drive và quản lý tệp đính kèm

**Ưu tiên:** P1  
**Ước lượng:** 7–12 ngày công  
**Phụ thuộc:** Task 01, 03, 04  
**Ghi chú:** Việc đã đăng nhập Drive trong trình duyệt không thay thế cấu hình OAuth/service account cho production.

## Kiến trúc đề xuất

Frontend → Supabase Edge Function/server integration → Google Drive API → Shared Drive/thư mục đã phê duyệt. Database chỉ lưu metadata và Google file ID. Không đưa refresh token hoặc credential Google xuống trình duyệt.

## Công việc

- [ ] Xác nhận Shared Drive/thư mục đích, chủ sở hữu dữ liệu và tài khoản tích hợp.
- [ ] Tạo Google Cloud project/OAuth hoặc service account theo mô hình Workspace đã duyệt; cấp quyền tối thiểu.
- [ ] Lưu secret trong secret manager của môi trường server; lập quy trình xoay/thu hồi credential.
- [ ] Xây Edge Function cho upload, lấy metadata, tải/xem và xóa logic; mỗi request kiểm tra JWT + RLS + quyền trên bản ghi cha.
- [ ] Quy định tên file vật lý không chứa dữ liệu nhạy cảm; dùng ID ngẫu nhiên và metadata trong database.
- [ ] Giới hạn MIME, phần mở rộng, kích thước, số tệp/bản ghi và tổng quota pilot.
- [ ] Kiểm tra magic bytes/MIME thực; từ chối file nguy hiểm. Đánh giá quét malware nếu cho phép Office/PDF từ nguồn ngoài.
- [ ] Không cấp link Drive công khai. Link xem/tải phải ngắn hạn hoặc đi qua server kiểm tra quyền.
- [ ] Ghi audit cho upload, download nhạy cảm, thay thế và xóa; không ghi token vào log.
- [ ] Xử lý retry/idempotency để không tạo file trùng khi mạng chập chờn.
- [ ] Có job đối soát file mồ côi giữa Drive và bảng `attachments`.
- [ ] Có phương án fallback Supabase Storage nếu Google integration chưa được phê duyệt đúng hạn.

## Tiêu chí nghiệm thu

- Người không có quyền trên nhật ký không lấy được file dù biết Google file ID hoặc URL cũ.
- Tệp không public và không bị lộ qua index/search/link sharing.
- Upload lỗi không để bản ghi/file mồ côi; retry không tạo bản sao ngoài ý muốn.
- Thu hồi tài khoản hoặc đổi đơn vị làm mất quyền xem theo chính sách ngay lập tức.
- Có test quota, file sai loại, file quá lớn, token hết hạn và Drive API bị gián đoạn.

