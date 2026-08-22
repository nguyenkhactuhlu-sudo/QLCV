# Cấu trúc và hướng dẫn bàn giao dự án QLCV

> Tài liệu đọc nhanh dành cho lập trình viên hoặc LLM tiếp quản dự án. Cập nhật gần nhất: 23/08/2026.

## 1. Mục tiêu dự án

QLCV là bản demo web tĩnh mô phỏng hệ thống nhật ký và đánh giá kết quả công tác của Viện kiểm sát nhân dân cấp tỉnh.

Trang đầu tiên là màn hình đăng nhập demo lấy cảm hứng từ giao diện Bộ công cụ Kiểm sát: nền xanh sáng, hoa sen, biểu trưng trong khối kính và hiệu ứng vòng sóng nhẹ.

Luồng nghiệp vụ cốt lõi:

1. Kiểm sát viên, cán bộ, công chức ghi **kết quả công việc đã hoàn thành** trong ngày.
2. Người đứng đầu đơn vị kiểm tra và chấm riêng:
   - Độ phức tạp: 1–10.
   - Chất lượng hoàn thành: 1–10.
3. Lãnh đạo xác nhận hoặc yêu cầu bổ sung.
4. Nếu bị yêu cầu bổ sung, người ghi sửa nhật ký và trình lại để lãnh đạo chấm lại.
5. Số liệu đã xác nhận được tổng hợp theo người, đơn vị và thời gian cho lãnh đạo các cấp.

Đây là **prototype trình diễn**, chưa phải hệ thống vận hành chính thức.

## 2. Công nghệ và cách chạy

- HTML thuần: `index.html`.
- CSS thuần: `styles.css`.
- JavaScript thuần: `app.js`.
- Không framework, không bundler, không bước build, không CDN.
- Dữ liệu và trạng thái thao tác lưu bằng `localStorage` của trình duyệt.
- Có thể triển khai trực tiếp bằng GitHub Pages.

Chạy cục bộ:

```powershell
python -m http.server 8080
```

Mở `http://localhost:8080`.

## 3. Cấu trúc repository

```text
QLCV/
├── index.html                 # Khung trang, menu, topbar, modal nhật ký/đăng ký
├── styles.css                # Toàn bộ giao diện, biểu đồ, bảng, responsive
├── app.js                    # Dữ liệu mẫu, phân quyền, nghiệp vụ và render UI
├── README.md                 # Hướng dẫn sử dụng demo
├── PROJECT_STRUCTURE.md      # Tài liệu bàn giao này
├── .nojekyll                 # Phục vụ trực tiếp trên GitHub Pages
├── .gitignore                # Loại dữ liệu nguồn và công cụ dựng tài liệu
├── assets/
│   ├── logo-kiem-sat.png
│   ├── lotus.webp
│   └── fonts/                # Be Vietnam Pro và giấy phép OFL
└── outputs/
    ├── 01_Bao_cao_...docx    # Báo cáo phương án đã cập nhật
    └── 02_Mo_ta_...docx      # Mô tả cấu trúc hệ thống chi tiết
```

Các script Python/Powershell dựng tài liệu và các file PDF/XLSX nguồn chỉ dùng cục bộ, không thuộc website phát hành và được loại qua `.gitignore`.

## 4. Kiến trúc chạy của bản demo

```text
index.html
   ├── tải styles.css
   └── tải app.js
          ├── dữ liệu mẫu: units, users, sampleLogs, sampleMonthly
          ├── trạng thái giao diện: state
          ├── dữ liệu thay đổi: localStorage
          ├── kiểm tra phạm vi và quyền thao tác
          └── render từng màn hình vào #appView
```

`app.js` hiện là một module đơn tệp. Các hàm render tạo chuỗi HTML và gắn lại sự kiện sau mỗi lần render.

Điểm khởi động là `initialize()`, được gọi ở cuối `app.js`.

## 5. Vai trò và phạm vi quyền

| Vai trò trong code | Ý nghĩa | Phạm vi chính |
|---|---|---|
| `province_head` | Viện trưởng tỉnh | Xem toàn tỉnh; đánh giá cấp phó tỉnh, người đứng đầu đơn vị và người thuộc Viện tỉnh theo cơ chế demo |
| `province_deputy` | Phó Viện trưởng tỉnh | Xem đơn vị được phân công; đánh giá người đứng đầu các đơn vị đó |
| `unit_head` | Trưởng phòng hoặc Viện trưởng VKSND khu vực | Xem đơn vị mình; đánh giá cấp phó và cán bộ thuộc đơn vị |
| `unit_deputy` | Phó Trưởng phòng hoặc Phó Viện trưởng khu vực | Ghi nhật ký; được hỗ trợ đánh giá cán bộ khi có `delegated: true` |
| `staff` | Kiểm sát viên/cán bộ/công chức | Ghi và xem nhật ký cá nhân; sửa nhật ký bị yêu cầu bổ sung |
| `administrator` | Quản trị demo | Quản lý mã đăng ký, tài khoản, điều chuyển, ủy quyền và lịch sử thay đổi |

Các hàm quyền quan trọng:

- `visibleUnitIds()` — đơn vị người hiện tại được xem.
- `dashboardLogs()` — nhật ký theo phạm vi, kỳ và bộ lọc.
- `canReviewLog()` — người hiện tại có được chấm nhật ký hay không.
- `reviewQueue()` — danh sách nhật ký đang chờ người hiện tại xử lý.
- `canApproveMonthly()` — quyền duyệt đánh giá tháng.

Không được chỉ dựa vào việc ẩn nút trên giao diện khi xây bản thật. Backend chính thức phải kiểm tra lại toàn bộ quyền.

## 6. Các màn hình chính

`state.currentView` nhận một trong các giá trị:

| View | Hàm render | Nội dung |
|---|---|---|
| `dashboard` | `renderDashboard()` | Chỉ số, biểu đồ và bảng kết quả theo đơn vị/cán bộ |
| `journal` | `renderJournal()` | Nhật ký cá nhân, trạng thái và thao tác sửa/trình lại |
| `reviews` | `renderReviews()` | Hàng chờ, hướng dẫn chấm hai tiêu chí, duyệt/trả lại |
| `monthly` | `renderMonthly()` | Tự chấm, điểm chính thức và xếp loại tháng |
| `organization` | `renderOrganization()` | Cơ cấu, vai trò và phạm vi quản lý |
| `administration` | `renderAdministration()` | Mã đăng ký, tài khoản, nhân sự, ủy quyền và nhật ký quản trị |

Menu được cập nhật bằng `updateNav()`. Tiêu đề, số mục chờ và thông báo được cập nhật bằng `updateChrome()`.

### Đăng nhập demo

- `DEMO_ACCOUNT_IDS` xác định các tài khoản được đưa lên màn hình đăng nhập.
- `demoCredentials` chứa mật khẩu mô phỏng và nhãn vai trò.
- `selectDemoAccount()` điền tài khoản và mật khẩu đã lưu.
- `submitDemoLogin()` kiểm tra mật khẩu demo và mở ứng dụng.
- `activateDemoUser()` thiết lập lại phạm vi xem theo người vừa đăng nhập.
- `showLoginScreen()` đăng xuất khỏi giao diện và quay về màn hình chọn tài khoản.

Đây chỉ là mô phỏng phía trình duyệt. Không tái sử dụng mật khẩu hoặc cơ chế này cho bản chính thức.

## 7. Mô hình dữ liệu chính

### 7.1. Đơn vị — `units`

```js
{
  id, name, short,
  type: "province" | "department" | "regional",
  parentId
}
```

### 7.2. Người dùng — `users`

```js
{
  id, name, title, professionalTitle,
  role, unitId, initials,
  assignedUnits?, delegated?, accountStatus?
}
```

### 7.3. Nhật ký — `logs`

```js
{
  id, authorId, unitId, date,
  category, title, result,
  workRole, duration, evidence,
  status: "pending" | "approved" | "revision",
  complexity, quality,
  reviewerId, comment,
  createdAt, reviewedAt,
  updatedAt?, resubmittedAt?, revisionCount?, reviewHistory?
}
```

Ý nghĩa trạng thái:

- `pending`: đã gửi hoặc đã trình lại, đang chờ lãnh đạo chấm.
- `approved`: đã chấm và xác nhận.
- `revision`: lãnh đạo yêu cầu người ghi bổ sung, sửa đổi.

### 7.4. Đánh giá tháng — `monthlyReviews`

```js
{
  userId, period,
  selfScore, officialScore,
  classification,
  status, note, approvedAt
}
```

### 7.5. Mã đăng ký và tài khoản mới

- `registrationCodes`: mã gắn với một đơn vị, số lượt dùng, hạn dùng và trạng thái.
- `registeredAccounts`: tài khoản tạo từ mã; mặc định là `staff` và chờ xác nhận.
- Người đăng ký không tự chọn quyền lãnh đạo.

## 8. Vòng đời nhật ký và yêu cầu bổ sung

```text
KSV gửi nhật ký
      │
      ▼
   pending ──────► lãnh đạo chấm ──────► approved
      ▲                    │
      │                    ▼
      └── KSV sửa ◄── revision
```

Các hàm liên quan:

- `openJournalModal(logId?)` — mở biểu mẫu mới hoặc nạp nhật ký `revision` để sửa.
- `submitJournal()` — tạo mới hoặc cập nhật và trình lại.
- `applyReview()` — chấm, duyệt hoặc yêu cầu bổ sung.
- `journalCard()` — hiển thị nhận xét và nút **Sửa và trình lại**.
- `reviewDetail()` — cho lãnh đạo xem yêu cầu trước khi chấm lại.

Khi trình lại:

- Chỉ chính tác giả được sửa.
- Chỉ nhật ký ở trạng thái `revision` được sửa.
- Điểm hiện tại được đặt lại `null` để lãnh đạo chấm lại.
- Yêu cầu, điểm và nội dung trước khi sửa được thêm vào `reviewHistory`.
- `revisionCount` tăng sau mỗi lần trình lại.

## 9. Dashboard và cách tính

- `aggregateByUnit()` và `aggregateByUser()` tạo dữ liệu tổng hợp.
- `aggregateRow()` trả về số kết quả, tổng/bình quân phức tạp, chất lượng có trọng số và số kết quả chất lượng từ 8.
- `weightedQuality()` lấy độ phức tạp làm trọng số cho chất lượng.
- `summaryTable()` cho phép sắp xếp tăng/giảm theo:
  - Kết quả.
  - Tổng phức tạp.
  - Phức tạp bình quân.
  - Chất lượng.
  - Tỷ lệ chất lượng từ 8.
- `groupedUnitComparisonChart()` chia đơn vị thành hai nhóm: phòng thuộc Viện tỉnh và VKSND khu vực để tránh biểu đồ quá dài.

Chỉ các nhật ký phù hợp với phạm vi và trạng thái cần thiết mới được đưa vào từng chỉ số. Không tự ý đổi điều kiện lọc mà chưa kiểm tra ảnh hưởng tới dashboard.

## 10. Trung tâm thông báo

Giao diện nằm trong `#notificationCenter` ở `index.html`.

Các hàm chính:

- `notificationsForCurrentUser()` — tạo thông báo phù hợp vai trò.
- `renderNotifications()` — cập nhật huy hiệu và danh sách.
- `openNotification()` — đánh dấu đã đọc và chuyển đến đúng view/hồ sơ.
- `markAllNotificationsRead()` — đánh dấu toàn bộ thông báo hiện tại.

Loại thông báo hiện có:

- KSV: nhật ký bị yêu cầu bổ sung; bấm để mở biểu mẫu sửa.
- Lãnh đạo: nhật ký mới hoặc nhật ký trình lại đang chờ chấm; bấm để mở đúng hồ sơ.
- Viện trưởng tỉnh/quản trị: tài khoản mới chờ xác nhận; bấm để mở quản trị.

Thông báo được sinh từ trạng thái dữ liệu hiện tại, không lưu thành bảng riêng. Chỉ danh sách ID đã đọc được lưu trong `localStorage`.

## 11. Các khóa `localStorage`

| Khóa | Nội dung |
|---|---|
| `vks-worklog-demo-v3` | Nhật ký công việc |
| `vks-monthly-demo-v1` | Đánh giá tháng |
| `vks-personnel-demo-v1` | Đơn vị, vai trò, ủy quyền nhân sự |
| `vks-audit-demo-v1` | Lịch sử thao tác quản trị |
| `vks-registration-codes-demo-v1` | Mã đăng ký đơn vị |
| `vks-registered-accounts-demo-v1` | Tài khoản đăng ký mới |
| `vks-notification-read-demo-v1` | ID thông báo đã đọc theo người dùng |

Nút **Khôi phục dữ liệu mẫu** xóa thay đổi thử nghiệm và trả dữ liệu về trạng thái ban đầu.

## 12. Dữ liệu demo

- `units`, `users`, `sampleLogs`, `sampleMonthly` đặt ở đầu `app.js`.
- `generateDemoLogs()` tạo hơn 1.200 nhật ký mô phỏng cho sáu tháng.
- Họ tên, chức danh và kết quả tháng 6/2026 dựa trên tài liệu người dùng cung cấp.
- Nội dung nhật ký chi tiết và các xu hướng là dữ liệu mô phỏng.

Không đưa thêm dữ liệu cá nhân hoặc hồ sơ nghiệp vụ thật lên repository công khai khi chưa có phê duyệt.

## 13. Nguyên tắc sửa code hiện tại

1. Giữ website chạy trực tiếp, không thêm bước build nếu chưa được yêu cầu.
2. Không đổi tên `id` trong `index.html` nếu chưa cập nhật nơi tham chiếu trong `app.js`.
3. Sau khi `innerHTML` thay đổi, phải gắn lại listener cho các phần tử vừa render.
4. Mọi quyền thao tác phải đi qua hàm kiểm tra quyền, không chỉ dựa vào vai trò hiển thị.
5. Không cho sửa nhật ký `approved` hoặc `pending`; chỉ `revision` được sửa bởi tác giả.
6. Khi đổi trạng thái nhật ký, phải gọi `saveLogs()` và render lại view liên quan.
7. Giữ responsive ở các mốc 820 px và 620 px.
8. Chạy ít nhất:

```powershell
node --check app.js
git diff --check
```

Sau thay đổi giao diện, cần thử các tài khoản và luồng liên quan trên trình duyệt.

## 14. Những phần chưa phải sản phẩm chính thức

- Chưa có đăng nhập và xác thực thật.
- Chưa có backend hoặc cơ sở dữ liệu dùng chung.
- Chưa kết nối Google Drive, Sheets, Forms hoặc Looker Studio.
- Chưa có API, hàng đợi ghi dữ liệu, khóa đồng thời hoặc kiểm thử tải.
- Phân quyền hiện chỉ được mô phỏng ở phía trình duyệt.
- Thời gian và kỳ báo cáo demo đang dùng dữ liệu cố định năm 2026.
- Chưa có bộ kiểm thử tự động đầy đủ.

Khi xây bản chính thức, có thể giữ gần như nguyên giao diện nhưng phải chuyển dữ liệu, xác thực và kiểm tra quyền sang backend.

## 15. Trình tự đọc nhanh cho LLM tiếp quản

1. Đọc file này để hiểu nghiệp vụ và ranh giới bản demo.
2. Đọc `README.md` để hiểu cách trình diễn.
3. Đọc `index.html` để nắm các phần tử cố định và modal.
4. Đọc phần đầu `app.js` để nắm dữ liệu và `state`.
5. Tìm hàm `render...` tương ứng màn hình cần sửa.
6. Kiểm tra các hàm quyền trước khi thay đổi luồng thao tác.
7. Đọc vùng CSS của component liên quan và hai media query cuối file.
8. Kiểm tra thay đổi bằng cú pháp, luồng nghiệp vụ và responsive.

Khi nhận yêu cầu mới, LLM nên nêu rõ thay đổi thuộc **giao diện demo** hay **kiến trúc bản chính thức**, tránh hiểu `localStorage` là cơ sở dữ liệu sản xuất.

## 16. Repository và phát hành

- Repository: `https://github.com/nguyenkhactuhlu-sudo/QLCV`
- Nhánh phát hành: `main`
- GitHub Pages lấy trực tiếp từ thư mục gốc của nhánh `main`.

Chỉ commit tài nguyên cần công khai. Không commit PDF/XLSX nguồn, file tạm, dữ liệu nghiệp vụ thật hoặc tài liệu chưa được phê duyệt công khai.
