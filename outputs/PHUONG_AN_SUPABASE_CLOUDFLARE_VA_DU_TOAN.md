# PHƯƠNG ÁN HẠ TẦNG VÀ DỰ TOÁN SƠ BỘ HỆ THỐNG QLCV

> Tài liệu phục vụ trao đổi và xin chủ trương. Cập nhật ngày 23/08/2026.

## 1. Kết luận đề xuất

Đề xuất xây dựng phiên bản vận hành chính thức theo phương án:

- **Cloudflare Pages** cung cấp giao diện web và phân phối nội dung qua CDN.
- **Supabase Pro** cung cấp PostgreSQL, đăng nhập, phân quyền, API, lưu trữ tệp và sao lưu.
- **Ứng dụng web hiện có** được giữ lại phần giao diện và luồng nghiệp vụ phù hợp, sau đó chuyển dữ liệu từ `localStorage` sang Supabase.
- **Google Apps Script hoặc Google API**, nếu cần, chỉ dùng cho các chức năng tích hợp như gửi thư, lịch và Google Drive; không dùng Google Sheets làm cơ sở dữ liệu chính.

Phương án này phù hợp với đội phát triển theo hướng vibe coding, ít kinh nghiệm quản trị hạ tầng, đồng thời đáp ứng quy mô dự kiến khoảng **300–400 người sử dụng thường xuyên**, kể cả khi tập trung truy cập trong một khung giờ.

## 2. Kiến trúc dự kiến

```text
Người sử dụng
      |
      v
Cloudflare Pages/CDN
      |
      v
Ứng dụng web QLCV
      |
      v
Supabase
  |-- Auth: đăng nhập và phiên làm việc
  |-- PostgreSQL: dữ liệu nghiệp vụ
  |-- Row Level Security: phân quyền theo người và đơn vị
  |-- Storage: tệp đính kèm
  |-- Realtime: thông báo/cập nhật có chọn lọc
  `-- Backup, log và công cụ quản trị
```

Nếu cần kết nối hệ sinh thái Google:

```text
Supabase/Edge Function --> Google API hoặc Apps Script
                       --> Gmail, Calendar, Drive
```

## 3. Cơ sở lựa chọn

### 3.1. Khả năng đáp ứng tải

Quy mô 300–400 người trong một giờ thuộc mức nhỏ đến trung bình đối với một backend PostgreSQL được thiết kế đúng. Đây chưa phải 300–400 yêu cầu phát sinh trong cùng một giây.

Ví dụ, nếu 400 trình duyệt tự tải lại dashboard mỗi 30 giây thì có thể tạo ra khoảng 48.000 lượt gọi API trong một giờ. Vì vậy, hiệu năng phụ thuộc nhiều vào cách viết ứng dụng hơn là chỉ phụ thuộc gói dịch vụ.

Phiên bản chính thức phải có:

- Phân trang danh sách, không tải toàn bộ nhật ký cùng lúc.
- Chỉ truy vấn các cột cần hiển thị.
- Chỉ mục database cho người dùng, đơn vị, trạng thái, ngày và kỳ báo cáo.
- Dashboard sử dụng truy vấn tổng hợp hoặc bảng tổng hợp phù hợp.
- Realtime có chọn lọc; không mở nhiều kết nối hoặc subscription không cần thiết.
- Cache cho danh mục ít thay đổi.
- Giới hạn kích thước, loại và số lượng tệp tải lên.
- Kiểm thử tải mô phỏng tối thiểu 500 người trước khi nghiệm thu.

### 3.2. Khả năng triển khai với đội ít chuyên môn hạ tầng

- Không phải tự vận hành máy chủ Linux và PostgreSQL.
- Có giao diện quản trị database, tài khoản, log và dung lượng.
- API, đăng nhập và lưu trữ tệp được cung cấp sẵn.
- Có thể phát triển từng phần, không phải hoàn thiện toàn bộ hạ tầng ngay từ đầu.
- PostgreSQL giúp dữ liệu dễ chuyển đổi hơn nếu sau này cần đổi nhà cung cấp hoặc tự triển khai.

### 3.3. An toàn dữ liệu và phân quyền

Giao diện hiện tại chỉ mô phỏng quyền ở phía trình duyệt. Bản chính thức phải đưa việc kiểm tra quyền xuống database bằng **Row Level Security (RLS)**.

Các nguyên tắc bắt buộc:

- Người dùng chỉ xem và sửa dữ liệu thuộc phạm vi được giao.
- Người ghi không được tự sửa nhật ký đã duyệt.
- Người chấm chỉ được xử lý hồ sơ thuộc thẩm quyền hoặc thời gian ủy quyền.
- Thay đổi điểm, trạng thái, nhân sự và phân quyền phải có nhật ký kiểm toán.
- Khóa bí mật quản trị không được đặt trong mã JavaScript chạy trên trình duyệt.
- Dữ liệu thật không được đưa vào repository công khai.

## 4. Phạm vi chuyển đổi từ prototype hiện tại

Phần có thể tận dụng:

- Thiết kế và bố cục giao diện.
- Các vai trò và luồng nghiệp vụ đã mô phỏng.
- Biểu mẫu nhật ký, hàng chờ chấm, đánh giá tháng và dashboard.
- Bộ lọc, cách tổng hợp và cấu trúc điều hướng.

Phần phải xây dựng hoặc làm lại cho bản chính thức:

- Cơ sở dữ liệu PostgreSQL và dữ liệu danh mục ban đầu.
- Đăng nhập thật, đặt lại mật khẩu và quản lý phiên.
- RLS và toàn bộ quy tắc phân quyền phía server/database.
- API đọc, ghi, duyệt, trả lại và trình lại hồ sơ.
- Audit log không thể sửa tùy ý từ trình duyệt.
- Cơ chế tệp đính kèm và kiểm soát quyền tải tệp.
- Dashboard truy vấn từ database thay cho dữ liệu mẫu.
- Xuất báo cáo, sao lưu, giám sát và cảnh báo.
- Kiểm thử chức năng, phân quyền, tải và quy trình khôi phục.

## 5. Dự toán chi phí hạ tầng

Các con số dưới đây là **dự toán sơ bộ**, chưa gồm thuế, phí thanh toán quốc tế và biến động tỷ giá. Quy đổi tham khảo dùng mức **25.000 đồng/USD** để dễ lập kế hoạch.

### 5.1. Giai đoạn phát triển và chạy thử

| Hạng mục | Dự kiến |
|---|---:|
| Supabase Free | 0 đồng |
| Cloudflare Pages | 0 đồng ở quy mô thử nghiệm |
| Tên miền | Khoảng 300.000–1.000.000 đồng/năm |
| Công cụ AI hỗ trợ lập trình | Khoảng 500.000–2.000.000 đồng/tháng, tùy công cụ |
| Email giao dịch | Có thể bắt đầu miễn phí; phát sinh theo nhà cung cấp và sản lượng |
| Tổng chi phí dịch vụ giai đoạn thử nghiệm | Khoảng 0,8–3 triệu đồng/tháng |

Không nên dùng gói miễn phí cho ngày vận hành chính thức vì có hạn mức, dự án miễn phí có thể bị tạm dừng khi không hoạt động và mức hỗ trợ thấp hơn.

### 5.2. Giai đoạn vận hành chính thức ban đầu

| Hạng mục | Dự kiến/tháng |
|---|---:|
| Supabase Pro | Từ khoảng 25 USD, tương đương 625.000 đồng |
| Cloudflare Pages/CDN | Thường 0 đồng ở mức tải dự kiến; dự phòng 0–250.000 đồng |
| Email giao dịch/thông báo | 0–500.000 đồng |
| Lưu tệp, băng thông hoặc compute vượt hạn mức | Dự phòng 0–750.000 đồng |
| Giám sát hoặc dịch vụ bổ sung | 0–500.000 đồng |
| **Tổng hạ tầng dự kiến** | **Khoảng 0,7–2,6 triệu đồng/tháng** |

Ngân sách nên trình để chủ động: **2–3 triệu đồng/tháng**, tương đương khoảng **24–36 triệu đồng/năm**. Đây là mức trần kế hoạch hợp lý cho giai đoạn đầu, không có nghĩa hệ thống chắc chắn sử dụng hết.

Nếu kết quả kiểm thử cho thấy cấu hình database mặc định chưa đủ, có thể phải nâng compute. Khi đó nên căn cứ số liệu CPU, RAM, kết nối, độ trễ và truy vấn chậm thay vì nâng gói theo cảm tính.

### 5.3. Chi phí năm đầu ngoài phát triển

| Khoản | Dự toán |
|---|---:|
| Hạ tầng 12 tháng | 24–36 triệu đồng |
| Tên miền và thiết lập DNS | 0,3–1 triệu đồng |
| Dự phòng tăng tải/dung lượng 20% | 5–8 triệu đồng |
| **Tổng ngân sách hạ tầng năm đầu nên dự kiến** | **Khoảng 30–45 triệu đồng** |

## 6. Dự toán theo phương án tự vibe code

Phương án được xác định là **không thuê lập trình viên, chuyên gia IT hoặc đơn vị triển khai**. Người phụ trách nội bộ cùng trợ lý AI sẽ trực tiếp phân tích, viết mã, kiểm thử, triển khai, vận hành và lập tài liệu.

Do không phát sinh hợp đồng phát triển phần mềm, dự toán được chia thành:

- **Chi phí tiền mặt:** hạ tầng cloud, công cụ AI, tên miền và các dịch vụ hỗ trợ.
- **Công sức nội bộ:** thời gian học, phát triển, thử nghiệm, sửa lỗi và hỗ trợ người dùng; không quy đổi thành tiền trong tổng dự toán.

### 6.1. Khối lượng ước tính

| Nhóm công việc | Công ước tính |
|---|---:|
| Khảo sát, chốt quy trình và tiêu chí nghiệm thu | 5–8 ngày công |
| Học và thử nghiệm Supabase, RLS, migration | 8–15 ngày công |
| Thiết kế database, quyền và kiến trúc | 8–14 ngày công |
| Chuyển giao diện hiện tại sang dữ liệu thật | 15–25 ngày công |
| Đăng nhập, tài khoản, RLS và ủy quyền | 12–20 ngày công |
| Nhật ký, duyệt, trả lại, chấm điểm và lịch sử | 12–20 ngày công |
| Dashboard, bộ lọc và xuất báo cáo | 10–18 ngày công |
| Tệp đính kèm, email và tích hợp cần thiết | 5–10 ngày công |
| Tự kiểm thử chức năng, phân quyền và tải | 12–20 ngày công |
| Sửa lỗi, triển khai, tài liệu và hướng dẫn sử dụng | 8–15 ngày công |
| **Tổng cộng sơ bộ** | **95–165 ngày công nội bộ** |

Số ngày trên là tổng khối lượng, không phải lịch liên tục. Vì một người phải vừa phát triển vừa tự kiểm thử và học công nghệ trong quá trình làm, thời gian lịch thực tế nên dự kiến **4–7 tháng**. Nếu chỉ có thể làm ngoài nhiệm vụ chuyên môn chính, tiến độ có thể kéo dài hơn.

### 6.2. Chi phí công cụ trong quá trình tự phát triển

| Hạng mục | Dự toán |
|---|---:|
| Một công cụ AI lập trình chính trong 4–7 tháng | 3–14 triệu đồng |
| Công cụ AI hoặc dịch vụ kiểm thử bổ sung | 0–3 triệu đồng |
| Supabase/Cloudflare trong giai đoạn phát triển | 0–3 triệu đồng |
| Tên miền và dịch vụ email thử nghiệm | 0,5–2 triệu đồng |
| **Tổng chi phí phát triển bằng tiền mặt** | **Khoảng 4–22 triệu đồng** |

Có thể giữ chi phí gần mức thấp nếu dùng một gói AI, Supabase Free và Cloudflare Free trong phần lớn thời gian phát triển. Không nên mua nhiều công cụ AI cùng chức năng chỉ để kỳ vọng rút ngắn tiến độ.

### 6.3. Mức ngân sách năm đầu nên trình sơ bộ

| Nội dung | Mức đề xuất |
|---|---:|
| Công cụ AI và dịch vụ trong thời gian phát triển | 4–22 triệu đồng |
| Hạ tầng vận hành và dự phòng năm đầu | 30–45 triệu đồng |
| Dự phòng phát sinh dịch vụ, dung lượng và tỷ giá | 5–10 triệu đồng |
| **Tổng chi phí tiền mặt năm đầu** | **Khoảng 40–75 triệu đồng** |
| Công phát triển nội bộ | 95–165 ngày công, không quy đổi tiền trong dự toán |

Mức nên đề nghị phê duyệt để chủ động là **tối đa khoảng 75 triệu đồng cho năm đầu**. Nếu sử dụng thấp, chi phí thực chi có thể chỉ khoảng **40–50 triệu đồng**. Từ năm thứ hai, khi không còn giai đoạn phát triển chính, dự kiến chủ yếu còn **24–36 triệu đồng/năm** cho hạ tầng và công cụ duy trì.

Đây là dự toán trần, không phải khoản phải chi hết. Mọi dịch vụ nên mua theo tháng trong thời gian đầu và chỉ nâng gói khi số liệu sử dụng thực tế chứng minh là cần thiết.

## 7. Tiến độ dự kiến

| Giai đoạn | Thời lượng |
|---|---:|
| Chốt nghiệp vụ, dữ liệu và phân quyền | 2–3 tuần |
| Học, thử nghiệm và thiết kế nền tảng | 2–4 tuần |
| Database, đăng nhập và phân quyền RLS | 3–5 tuần |
| Chuyển các chức năng nghiệp vụ chính | 6–10 tuần |
| Dashboard, báo cáo và tích hợp | 3–5 tuần |
| Tự kiểm thử, chạy thử giới hạn và sửa lỗi | 4–6 tuần |
| Mở rộng dần tới 300–400 người | 2–4 tuần |
| **Tổng thời gian dự kiến** | **Khoảng 4–7 tháng** |

Không nên mở ngay cho toàn bộ 300–400 người. Trình tự an toàn hơn là thử nội bộ, sau đó 20–50 người, 100–150 người và cuối cùng mới mở toàn bộ. Tiến độ phụ thuộc vào thời gian dành cho dự án, tốc độ phê duyệt nghiệp vụ và phản hồi của nhóm dùng thử.

## 8. Điều kiện trước khi triển khai

Cần có quyết định hoặc xác nhận về:

1. Phạm vi đơn vị và số lượng tài khoản chính thức.
2. Danh sách vai trò, quyền xem, quyền chấm và cơ chế ủy quyền.
3. Loại dữ liệu được phép đưa lên dịch vụ cloud và yêu cầu về vị trí lưu dữ liệu.
4. Thời gian lưu nhật ký, tệp, audit log và bản sao lưu.
5. Có sử dụng tài khoản Google Workspace/SSO hay đăng nhập riêng.
6. Các biểu mẫu và báo cáo bắt buộc phải xuất.
7. Yêu cầu an toàn thông tin, thẩm định hoặc kiểm thử độc lập của đơn vị.
8. Người chịu trách nhiệm nghiệp vụ và người phê duyệt thay đổi trong giai đoạn triển khai.

Nếu quy định nội bộ không cho phép lưu dữ liệu nghiệp vụ trên cloud quốc tế, phương án Supabase Cloud phải được xem xét lại; khi đó cần đánh giá phương án hạ tầng trong nước hoặc tự triển khai, đồng nghĩa chi phí và yêu cầu vận hành sẽ cao hơn.

## 9. Tiêu chí nghiệm thu tối thiểu

- 500 người dùng mô phỏng hoàn thành kịch bản tải đã thống nhất mà không mất dữ liệu.
- Các trang thao tác chính đạt thời gian phản hồi mục tiêu trong điều kiện kiểm thử.
- Kiểm thử đầy đủ ma trận quyền giữa cá nhân, đơn vị, lãnh đạo và quản trị.
- Không thể dùng trình duyệt để đọc/sửa dữ liệu ngoài quyền qua API trực tiếp.
- Có audit log cho thay đổi quan trọng.
- Có quy trình sao lưu và thử khôi phục thành công.
- Có giới hạn tải tệp và kiểm soát tệp theo quyền.
- Có cảnh báo chi phí, lỗi hệ thống và mức sử dụng tài nguyên.
- Có tài liệu quản trị, tài liệu người dùng và hướng dẫn xử lý sự cố cơ bản.

## 10. Rủi ro chính và biện pháp kiểm soát

| Rủi ro | Biện pháp |
|---|---|
| AI tạo code chạy được nhưng sai phân quyền | RLS mặc định từ chối, bộ kiểm thử tự động cho từng vai trò, kiểm thử API trực tiếp và mở người dùng theo từng đợt |
| Dashboard truy vấn quá nhiều dữ liệu | Index, phân trang, truy vấn tổng hợp, cache và kiểm thử tải |
| Chi phí phát sinh ngoài dự kiến | Spend cap/cảnh báo ngân sách và theo dõi hàng tuần lúc đầu |
| Dữ liệu nhạy cảm được đưa lên sai nơi | Phân loại dữ liệu và phê duyệt phương án lưu trữ trước khi nhập dữ liệu thật |
| Phụ thuộc một người phát triển | Tài liệu kiến trúc, migration database, mã nguồn có quản lý phiên bản và quy trình bàn giao |
| Mất dữ liệu hoặc thao tác nhầm | Backup, audit log, quy trình khôi phục và hạn chế quyền quản trị |

## 11. Đề xuất quyết định

Đề nghị phê duyệt theo hai bước:

1. **Phê duyệt chủ trương kỹ thuật:** dùng Cloudflare Pages và Supabase/PostgreSQL để xây phiên bản chạy thử có kiểm soát.
2. **Sau khi hoàn thành đặc tả:** phê duyệt dự toán chính thức, tiến độ, phương án an toàn dữ liệu và giao người phụ trách nội bộ tự phát triển với trợ lý AI.

Không nên mua gói dịch vụ dài hạn hoặc đưa dữ liệu nghiệp vụ thật lên hệ thống trước khi hoàn thành bước xác nhận phân quyền và yêu cầu lưu trữ dữ liệu. Do không có IT chuyên nghiệp tham gia, giai đoạn đầu chỉ nên xử lý dữ liệu nhật ký công việc thông thường; không đưa tài liệu mật, bí mật nhà nước, hồ sơ vụ án hoặc dữ liệu nhạy cảm lên hệ thống nếu chưa có văn bản cho phép và phương án an toàn thông tin phù hợp.

## 12. Nguồn tham khảo giá dịch vụ

- Supabase Pricing: <https://supabase.com/pricing>
- Supabase Billing: <https://supabase.com/docs/guides/platform/billing-on-supabase>
- Supabase Cost Control: <https://supabase.com/docs/guides/platform/cost-control>
- Cloudflare Pages Pricing: <https://developers.cloudflare.com/pages/functions/pricing/>

Giá và hạn mức dịch vụ có thể thay đổi; cần kiểm tra lại tại thời điểm phê duyệt mua dịch vụ.
