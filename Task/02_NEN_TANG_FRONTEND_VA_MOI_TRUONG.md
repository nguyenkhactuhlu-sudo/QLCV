# Task 02 — Chuẩn hóa frontend và môi trường phát triển

**Ưu tiên:** P0  
**Ước lượng:** 8–12 ngày công  
**Phụ thuộc:** Task 01 (có thể khởi động phần kỹ thuật trước)

## Hướng triển khai đề xuất

Giữ thiết kế HTML/CSS và hành vi đã có, nhưng chuyển sang Vite + JavaScript ES modules để có biến môi trường, build, lint và test. Không đổi sang framework lớn chỉ để viết lại giao diện.

## Công việc

- [ ] Khởi tạo `package.json`, Vite và cấu trúc `src/` theo module: `auth`, `api`, `permissions`, `journal`, `reviews`, `monthly`, `dashboard`, `admin`, `notifications`.
- [ ] Tách dữ liệu demo khỏi logic UI; chỉ bật demo bằng cờ môi trường riêng, mặc định tắt ở staging/production.
- [ ] Tạo lớp truy cập dữ liệu; component/render không gọi Supabase trực tiếp rải rác.
- [ ] Tạo quản lý session và trạng thái tải/lỗi/empty state thống nhất.
- [ ] Bổ sung validation client cho tất cả form nhưng xác định rõ server/database vẫn là nguồn kiểm tra cuối cùng.
- [ ] Chống XSS khi render nội dung do người dùng nhập; bỏ cách ghép HTML không escape cho dữ liệu thật.
- [ ] Bổ sung pagination, debounce bộ lọc và hủy request cũ khi đổi điều kiện.
- [ ] Tạo `.env.example` chỉ chứa tên biến và giá trị giả; cập nhật `.gitignore` cho mọi file secret.
- [ ] Thiết lập ESLint/Prettier, Vitest và Playwright (hoặc bộ tương đương được thống nhất).
- [ ] Tạo script chuẩn: `dev`, `build`, `preview`, `lint`, `test`, `test:e2e`.
- [ ] Đảm bảo responsive và khả năng dùng bàn phím cho các màn hình chính.
- [ ] Viết hướng dẫn setup local không phụ thuộc tài khoản của một cá nhân.

## Tiêu chí nghiệm thu

- `npm ci`, `npm run build`, `npm test` chạy thành công trên máy mới.
- Không có secret trong bundle build hoặc git history mới.
- Các màn hình hiện tại vẫn hoạt động với adapter demo trong khi backend được xây dựng.
- Có thể chuyển adapter từ demo sang Supabase bằng cấu hình môi trường, không sửa logic từng màn hình.
- Lighthouse/accessibility không có lỗi nghiêm trọng ở đăng nhập, nhật ký và hàng chờ duyệt.

