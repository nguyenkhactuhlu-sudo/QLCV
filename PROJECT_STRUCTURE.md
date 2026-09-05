# Cấu trúc và hướng dẫn bàn giao dự án QLCV

> Tài liệu đọc nhanh dành cho lập trình viên hoặc LLM tiếp quản dự án. Cập nhật gần nhất: 05/09/2026.
> Tài liệu này **thay thế hoàn toàn** bản trước đó (23/08/2026) — bản cũ mô tả 1 kiến trúc single-file demo đã lỗi thời, không còn đúng thực tế từ khi dự án tách thành 2 nhánh `demo/` + `production/` và có backend Supabase thật.
> **Thay đổi lớn từ 29/08 → 05/09/2026** (xem chi tiết đúng mục tương ứng): cơ chế "Nộp cho lãnh đạo" đổi theo đúng cấp bậc tổ chức thay vì chỉ cùng đơn vị (mục 6.2); bổ sung "Công việc nhiều ngày" + "Nghỉ phép" — nhân bản nhật ký theo khoảng ngày (mục 6.4); sửa lỗi ủy quyền của Viện trưởng tỉnh gán sai cấp (mục 6.3); "Chấm điểm tháng" đổi cả độ phức tạp lẫn chất lượng từ cộng dồn/trọng số sang bình quân đơn giản; gợi ý mức chấm điểm hiện thêm ngay lúc tự chấm, không chỉ lúc lãnh đạo duyệt; production đã có **84 hồ sơ thật, tập trung ở 5 đơn vị** (VKSND tỉnh, Văn phòng, Phòng 10, Phòng 15, Khu vực 1 — trong tổng ~20 đơn vị đã dựng sẵn khung, không còn chỉ 8 hồ sơ thí điểm ở Văn phòng, xem mục 8); migration đã lên tới 00061.
> File này mô tả *cấu trúc code/deploy*. Xem [ARCHITECTURE.md](ARCHITECTURE.md) để biết *cơ chế nghiệp vụ/luồng dữ liệu* (vai trò, quyền hạn, luồng nhật ký/đánh giá/thông báo) + quy trình rà soát lỗi logic định kỳ.

## 0. Đọc trước — cảnh báo về mã nguồn tàn dư trong repo

Repo này còn sót lại **1 bộ khung Vite/React-style hoàn toàn không dùng**, từ 1 lần thử kiến trúc "app thật" ở giai đoạn rất sớm rồi bị bỏ để chuyển sang cách làm đơn giản hơn (2 file HTML/JS thuần, không build). **Không sửa các đường dẫn sau khi nhận yêu cầu thay đổi tính năng** — chúng không được deploy đi đâu cả và không ai đọc:

- `src/` (toàn bộ), `vite.config.js`, `eslint.config.js`, `package.json`, `package-lock.json`
- `tests/` (toàn bộ — `vitest`/`playwright` cấu hình cho `src/`, không phải test đang dùng thật)
- `docs/adr/`, `docs/requirements.md`, `docs/permission-matrix.md`, `docs/data-classification.md`, `docs/runbook.md` (nội dung ngày 23/08/2026, mô tả mô hình quyền **cũ**, đã sai từ sau đợt rework 29/08/2026)
- File gốc `index.html` — vẫn có tác dụng thật, nhưng CHỈ là 1 trang redirect tĩnh sang `demo/index.html` (xem mục 2). Không thêm logic vào file này.
- File gốc `app.js`, `styles.css` — **mồ côi hoàn toàn**, không được `index.html` gốc load, không tham chiếu ở đâu cả, là bản chụp cũ của `demo/app.js` từ 23/08/2026 (1406 dòng so với `demo/app.js` hiện đã hơn 3300 dòng). Không sửa 2 file này.
- `.github/workflows/ci.yml` — chạy `npm run lint/test/build` nhắm vào `src/` (bộ khung chết ở trên), không liên quan gì đến việc deploy thật. Workflow **duy nhất có tác dụng thật** là `.github/workflows/deploy-cloudflare.yml` (xem mục 4).
- `README.md` ở gốc repo — cũng mô tả bộ khung Vite đã bỏ (`npm run dev/build/test`). Không đúng thực tế, chưa được cập nhật lại; đừng làm theo hướng dẫn "Cài đặt/Build" trong đó.
- `supabase/functions/handle-file/` — Edge Function CHẾT, sót lại từ khung Vite bỏ dở, dùng anon key (không phải service role), không được gọi ở đâu trong `production/app.js`/`demo/app.js`. Đừng sửa hay tái dùng. Phân biệt với `supabase/functions/admin-manage-users/` (thêm 30/08/2026) — đây là Edge Function THẬT DUY NHẤT đang chạy trong dự án, được `production/app.js` gọi (biến `FUNCTIONS`) để Quản trị viên/Viện trưởng tỉnh tạo tài khoản mới và đặt lại mật khẩu người khác ngay trên giao diện, không cần vào Supabase SQL Editor. Giữ service role key làm secret riêng của function này (`supabase secrets set`), không bao giờ đặt trong code/git.

Nếu một yêu cầu tương lai thực sự muốn hồi sinh kiến trúc build-based này, cần hỏi lại người dùng trước — khả năng cao đây chỉ là rác lịch sử cần dọn, không phải nền tảng cần phát triển tiếp.

## 1. Mục tiêu và hiện trạng dự án

QLCV là hệ thống nhật ký công tác và đánh giá kết quả công việc hằng ngày cho VKSND tỉnh Bắc Ninh (Viện kiểm sát nhân dân cấp tỉnh + các Phòng nghiệp vụ/Văn phòng + VKSND khu vực trực thuộc).

Dự án tồn tại song song **2 bản, tách biệt hoàn toàn về code lẫn dữ liệu**:

| | `demo/` | `production/` |
|---|---|---|
| Mục đích | Trình diễn, thuyết trình, không cần tài khoản thật | **Hệ thống đang phục vụ người dùng thật** |
| Lưu trữ | `localStorage` trình duyệt, dữ liệu mẫu dựng sẵn | Supabase Postgres thật (REST + RPC) |
| Đăng nhập | Giả lập, chọn tài khoản demo trên UI | Supabase Auth thật (email/password) |
| Deploy | GitHub Pages, đường dẫn `/demo/` | Cloudflare Pages, tên miền `qlcv-b29.pages.dev` |
| File chính | `demo/index.html`, `demo/app.js`, `demo/styles.css` | `production/index.html`, `production/app.js`, `production/config.js` (dùng chung `demo/styles.css`) |

**Vì production đang có người dùng thật**, mọi thay đổi ảnh hưởng nghiệp vụ phải được cân nhắc kỹ, migrate DB đúng thứ tự, kiểm thử bằng dữ liệu/tài khoản thật (curl trực tiếp vào Supabase) trước khi merge `main`, không chỉ dựa vào demo.

Luồng nghiệp vụ cốt lõi (áp dụng cho cả 2 bản):

1. Kiểm sát viên/cán bộ ghi **kết quả công việc đã hoàn thành**, tự chọn nộp cho ai trong số lãnh đạo hợp lệ (xem mục 6.2 — mỗi cấp có đúng 1 danh sách hợp lệ khác nhau tùy theo cấp bậc của chính người viết, không phải lúc nào cũng là lãnh đạo cùng đơn vị).
2. Lãnh đạo hợp lệ chấm 2 tiêu chí: Độ phức tạp (1–10), Chất lượng (1–10) — khi tự chấm, hệ thống đã hiện sẵn gợi ý theo mức điểm ngay lúc nhập (dùng chung dữ liệu với màn hình lãnh đạo duyệt, xem `scoringGuide()`).
3. Lãnh đạo xác nhận hoặc yêu cầu bổ sung; nếu yêu cầu bổ sung, tác giả sửa và trình lại.
4. Số liệu đã xác nhận được tổng hợp theo người/đơn vị/thời gian (tính **bình quân**, không cộng dồn — xem mục 6.4); đánh giá xếp loại theo tháng.
5. Lãnh đạo cấp trưởng có thể ủy quyền **thay mặt 100% toàn đơn vị/toàn tỉnh** cho đúng 1 cấp phó trực tiếp của mình trong 1 khoảng thời gian nhất định — Viện trưởng tỉnh chỉ ủy quyền được cho Phó Viện trưởng tỉnh, Trưởng phòng/Viện trưởng khu vực chỉ ủy quyền được cho Phó của đúng đơn vị mình (xem mục 6.3).
6. Lãnh đạo (Phó phòng trở lên có quyền quản lý người) có thể **giao việc cho nhiều người cùng lúc** (1 chủ trì + N phối hợp), hạn hoàn thành chính xác đến giờ:phút.
7. Công việc **kéo dài nhiều ngày** hoặc **nghỉ phép** có thể ghi 1 lần cho cả khoảng ngày — hệ thống tự nhân bản ra từng ngày sau khi được xử lý xong (xem mục 6.4).

## 2. Deploy — nơi 2 bản thực sự đang chạy

- **Production**: `https://qlcv-b29.pages.dev/` — Cloudflare Pages project tên `qlcv`.
- **Demo**: `https://nguyenkhactuhlu-sudo.github.io/QLCV/` — GitHub Pages phục vụ trực tiếp từ gốc nhánh `main`. `index.html` ở gốc chỉ redirect (`meta refresh` + `location.replace`) sang `demo/index.html` — bản demo thật nằm ở `https://nguyenkhactuhlu-sudo.github.io/QLCV/demo/`.
- **Supabase**: project `bmdwpiticfrqhsjolxkl` (xem `production/config.js` cho URL/anon key — anon key là publishable key, không phải service role, an toàn để lộ trong client).

## 3. Cấu trúc thư mục đang dùng thật

```text
QLCV/
├── index.html                 # CHỈ 1 trang redirect tĩnh sang demo/index.html (xem muc 0)
├── demo/
│   ├── index.html             # Bản demo thật
│   ├── app.js                 # Toàn bộ logic demo: dữ liệu mẫu, state, render, phân quyền
│   ├── styles.css             # CSS DÙNG CHUNG cho cả demo/ VÀ production/
│   └── assets/                # Logo, font, ảnh nền
├── production/
│   ├── index.html             # Khung trang thật, nạp app.js + config.js + supabase-auth.js (../)
│   ├── app.js                 # Toàn bộ logic production: gọi Supabase REST/RPC, không có dữ liệu mẫu
│   ├── config.js              # DUY NHẤT nơi cấu hình Supabase URL + anon key
│   └── assets/                # Bản sao/liên kết tới demo/assets khi build deploy
├── supabase-auth.js            # Xử lý đăng nhập và khôi phục phiên, dùng chung production
├── supabase/
│   ├── config.toml
│   ├── migrations/            # 00001 → 00061 (+ 1 file gộp tiện dụng), xem mục 7
│   └── seed/00001_seed_data.sql
└── .github/workflows/
    └── deploy-cloudflare.yml  # DUY NHẤT workflow có tác dụng thật (xem mục 4)
```

Ghi chú quan trọng:

- **`demo/styles.css` được `production/index.html` load trực tiếp** (`../demo/styles.css`) — sửa CSS chỉ cần sửa 1 chỗ, áp dụng cho cả 2 bản. Không tạo `production/styles.css` riêng.
- `production/app.js` **không có dữ liệu mẫu nào** — mọi thứ đọc/ghi qua Supabase REST (`fetch(API + '...')`) hoặc RPC (`fetch(API + 'rpc/...')`). `demo/app.js` giữ nguyên toàn bộ dữ liệu mẫu + state trong biến JS + `localStorage`.
- 2 file `app.js` **không dùng chung code** — mỗi khi sửa 1 tính năng nghiệp vụ, phải sửa **cả 2 file song song** (khác nhau về style code: `demo/` dùng `const`/arrow function/camelCase hiện đại; `production/` dùng `var`/`function` kiểu cũ hơn, biến toàn cục như `U`, `LOGS`, `UNITS`, `CATS`). Đây là quy ước đã áp dụng xuyên suốt cả dự án, không tự ý đổi phong cách code của 1 trong 2 file khi sửa.

## 4. CI/CD thật — `deploy-cloudflare.yml`

```text
push vào main (chạm production/**, demo/styles.css, demo/assets/**, hoặc supabase-auth.js)
   │
   ▼
GitHub Actions: đóng gói deploy/ = production/*.html,*.js,config.js + supabase-auth.js + demo/styles.css + demo/assets/*
   │  (sed thay ../demo/styles.css?v=... , ../supabase-auth.js?v=... , ./app.js?v=...
   │   bằng SHORT_SHA của commit — cache-busting tự động, KHÔNG cần tự tay bump version)
   ▼
wrangler pages deploy deploy/ --project-name=qlcv --branch=main
   │
   ▼
https://qlcv-b29.pages.dev/  (thường live sau 1-3 phút)
```

Kiểm tra deploy xong bằng cách poll `https://qlcv-b29.pages.dev/app.js?v=<7 ký tự đầu SHA>` tới khi trả về HTTP 200 — đây là cách đã dùng xuyên suốt dự án để xác nhận deploy thành công thay vì đoán thời gian.

**`demo/` không đi qua workflow này** — GitHub Pages tự phục vụ trực tiếp từ nhánh `main`, không cần build, live gần như ngay khi push xong.

Do repo còn `ci.yml` (dead, xem mục 0) chạy song song trên mọi push, **đừng hoảng khi thấy 1 workflow báo lỗi/fail trên GitHub Actions** — kiểm tra đúng tên `deploy-cloudflare.yml` mới là workflow cần quan tâm.

## 5. Cách chạy/kiểm thử cục bộ

Cả 2 bản đều không cần build:

```powershell
python -m http.server 8899
```

- Demo: `http://localhost:8899/demo/index.html`
- Production (cần internet để gọi Supabase thật, không mock được API dễ dàng): `http://localhost:8899/production/index.html`

Quy ước kiểm thử đã dùng suốt dự án (xem lịch sử commit để tham khảo mẫu cụ thể):

1. `node --check demo/app.js` và `node --check production/app.js` sau mọi lần sửa — bắt lỗi cú pháp trước khi mất công test UI.
2. Viết test Playwright dạng `.cjs`, **copy vào thư mục gốc repo trước khi chạy `node`** (module resolution cần nằm dưới thư mục có `node_modules`), xóa lại sau khi xong.
3. Với `production/app.js`: **bắt buộc mock `window.fetch`** trong test — sandbox không có mạng thật ra ngoài, một `fetch` không được mock sẽ **treo vô thời hạn** (không lỗi ngay, không timeout ngắn) chứ không phải reject nhanh, làm cả chuỗi `await` phía trên treo theo. Luôn dùng `indexOf(...) !== -1` (chứa chuỗi) để so khớp URL trong mock, không dùng `indexOf(...) === 0` (URL thật luôn có tiền tố `https://.../rest/v1/...`, không bao giờ bắt đầu ngay từ tên bảng).
4. `production/index.html`'s `#appShell` mặc định có `hidden` — chỉ được gỡ sau khi đăng nhập thật. Test không đăng nhập thật cần tự set `document.getElementById('appShell').hidden = false` để các thao tác cần "visible" (Playwright `selectOption`/`click`/`check`) hoạt động được; các kiểm tra chỉ đọc `innerHTML`/DOM presence thì không cần.
5. Với thay đổi động chạm dữ liệu Supabase thật: **verify bằng curl thật** trên các tài khoản test (mục 8) trước khi coi là xong — Playwright mock không phát hiện được lỗi RLS/SQL phía server.

## 6. Mô hình phân quyền hiện tại (đã rework 29/08/2026)

Vai trò (`role`, giống nhau ở cả demo và production):

| Vai trò | Ý nghĩa | Ghi chú |
|---|---|---|
| `administrator` | Quản trị hệ thống | Không tham gia nghiệp vụ chấm điểm |
| `province_head` | Viện trưởng tỉnh | Toàn quyền xem/quản lý toàn tỉnh |
| `province_deputy` | Phó Viện trưởng tỉnh | Quản lý các đơn vị được phân công (`assignedUnits`/`unit_assignments`) |
| `unit_head` | Trưởng phòng / Viện trưởng VKSND khu vực | Toàn quyền trong đơn vị mình, luôn là 1 "lãnh đạo trực tiếp" hợp lệ |
| `unit_deputy` | Phó phòng / Phó Viện trưởng khu vực | Xem mục dưới — quyền phụ thuộc TỪNG việc cụ thể, khác hẳn `unit_head` |
| `staff` / `support_staff` | Kiểm sát viên/cán bộ/công chức/người lao động | Ghi nhật ký, chọn nộp cho đúng lãnh đạo đã giao việc |

**Không phân biệt theo loại đơn vị** (`department` = Phòng/Văn phòng, `regional` = VKSND khu vực) — mọi logic quyền chỉ so `role` + `unit_id`, nên mọi cơ chế dưới đây áp dụng giống hệt nhau cho cả 2 loại đơn vị.

### 6.1. Vì sao "ủy quyền theo danh sách người" bị bỏ

Thiết kế ban đầu: Trưởng phòng chỉ định 1 danh sách cố định người mà 1 Phó phòng được chấm thay. Vấn đề thật: 1 cán bộ/KSV thường được **nhiều lãnh đạo khác nhau trong đơn vị giao việc** — gán cứng "người này luôn do Phó X chấm" không phản ánh đúng ai thực sự giao việc đó. Đã thay bằng 2 cơ chế song song:

### 6.2. Nộp đích danh theo `submitted_to_id` — danh sách hợp lệ khác nhau theo TỪNG cấp (rework 05/09/2026)

Khi tạo nhật ký, tác giả **tự chọn nộp cho ai** — nhưng danh sách hợp lệ phụ thuộc chính vai trò của tác giả (hàm dùng chung `refreshSubmitToOptions(selectId, presetId)`, gọi cho cả form nhật ký lẫn form nghỉ phép):

- `staff`/`support_staff`/`unit_deputy`: chọn trong số lãnh đạo **cùng đơn vị** (Trưởng phòng hoặc bất kỳ Phó phòng nào — `directLeadersFor()`).
- `unit_head`: **không** nộp xuống Phó phòng của chính mình (không hợp lý) — chọn trong số lãnh đạo **cấp tỉnh** (Phó Viện trưởng tỉnh hoặc Viện trưởng tỉnh — `provinceLeadersFor()`), vì cấp trên thật của Trưởng phòng không cùng `unit_id`.
- `province_deputy`: chỉ có đúng 1 Viện trưởng tỉnh — ô tự khóa, gán sẵn, không cần chọn.

Nếu nhật ký gắn với 1 việc được giao qua "Giao việc", hệ thống **tự động khóa** ô này theo đúng người đã giao việc đó (`applyTaskLinkToSubmitTo()` phía client cho UX; `link_task_to_log` RPC tự ghi đè `submitted_to_id` phía server để đảm bảo đúng dù client bị can thiệp).

**Lưu ý RLS quan trọng** (migration 00055): để `unit_head` đọc được tên Phó Viện trưởng tỉnh/Viện trưởng tỉnh khi hiện danh sách trên, bảng `profiles` cần 1 policy SELECT riêng mở đúng 2 vai trò `province_head`/`province_deputy` cho mọi người dùng đã đăng nhập (thông tin công khai nội bộ, không nhạy cảm) — nếu thiếu policy này, danh sách sẽ luôn rỗng dù code JS đúng.

### 6.3. Ủy quyền "thay mặt 100%" — ĐÚNG 2 cấp, mỗi cấp chỉ ủy quyền cho cấp phó TRỰC TIẾP của mình (sửa lỗi 05/09/2026, migration 00061)

`grant_delegation(p_delegate_id, p_starts_at, p_ends_at)`:

- **Trưởng phòng/Viện trưởng khu vực** (`unit_head`) → ủy quyền cho **1 Phó phòng/Phó VT khu vực của đúng đơn vị mình** (`role='unit_deputy'` + cùng `unit_id`) — thay mặt **toàn bộ đơn vị**.
- **Viện trưởng tỉnh** (`province_head`) → ủy quyền cho **1 Phó Viện trưởng tỉnh** (`role='province_deputy'`) — thay mặt **toàn tỉnh**.
- Không còn trường hợp nào khác được phép (kể cả `administrator`).

Chỉ 1 ủy quyền active tại 1 thời điểm cho 1 người ủy quyền (`delegator_id`) — cấp mới khi đang có cái active sẽ bị chặn (`grant_delegation` tự kiểm tra qua `delegator_id`, UI cũng tự chặn hiện form dựa trên `delegations.delegator_id===U.id`, không còn suy luận qua `unit_id`).

**Lỗi thật đã sửa (không chỉ giao diện)**: trước 00061, `grant_delegation` bắt buộc người được ủy quyền phải có `role='unit_deputy'` — nghĩa là Viện trưởng tỉnh **không bao giờ** ủy quyền được đúng cho Phó Viện trưởng tỉnh, nhưng lại được phép chọn **bất kỳ** Phó phòng nào trong **toàn tỉnh** (không giới hạn đơn vị) — gán hoàn toàn sai cấp. `can_manage_person`/`can_approve_monthly` cũng được bổ sung 1 nhánh: khi `province_deputy` đang có ủy quyền active (`has_active_delegation()`), họ có toàn quyền **như Viện trưởng tỉnh** (quản lý mọi `unit_head` + nhân sự thuộc đơn vị lãnh đạo tỉnh), không chỉ giới hạn trong các đơn vị được phân công qua `unit_assignments` như bình thường. `can_review_log` **không cần sửa** — nhánh dành cho vai trò khác `unit_deputy` đã fallback gọi `can_manage_person(author_id)` sẵn, tự động kế thừa bản sửa này.

### 6.4. "Công việc nhiều ngày" và "Nghỉ phép" — nhân bản nhật ký theo khoảng ngày (thêm 05/09/2026)

Vẫn giữ nguyên "1 dòng `work_logs` = 1 ngày" (cấu trúc này dùng khắp Tổng quan/Nhật ký đơn vị/Chấm điểm tháng/hàng chờ duyệt) — không đổi sang lưu khoảng ngày trên 1 dòng. Thay vào đó, thêm 3 cột đánh dấu: `range_start_date` (chỉ có ở dòng "gốc"), `is_clone` (`true` ở dòng tự sinh), `clone_group_id` (dòng nhân bản trỏ về id dòng gốc, `ON DELETE CASCADE` — xóa dòng gốc tự xóa sạch cả nhóm).

Nguyên tắc cốt lõi: **dòng nhân bản chỉ được tạo SAU KHI đã xử lý xong dòng gốc** (helper dùng chung `create_work_log_clones(p_primary_id)`, bỏ thứ Bảy/Chủ nhật) — nhờ vậy hàng chờ duyệt/chuông thông báo không bao giờ bị nhân N lần cho cùng 1 việc.

- **Công việc nhiều ngày**: chọn "Thời gian thực hiện" = "Nhiều ngày" → hiện thêm ô "Bắt đầu từ ngày". Vẫn chỉ tạo/trình duyệt **1 dòng gốc**; `approve_work_log` sau khi duyệt+chấm điểm xong tự gọi `create_work_log_clones()`. `override_work_log_score` đã mở rộng để đồng bộ điểm mới cho **cả nhóm** khi sửa điểm sau này (dù sửa từ dòng gốc hay 1 dòng nhân bản).
- **Nghỉ phép**: nút riêng "+ Ghi nghỉ phép", dùng 1 danh mục đặc biệt trong `work_categories` (`code='NGHI_PHEP'`, cột mới `is_leave=true`) — **không** hiện trong danh sách lĩnh vực chọn thủ công khi ghi nhật ký thường. Không chấm điểm — lãnh đạo dùng RPC riêng `acknowledge_leave_log(p_log_id)` (chỉ "Xác nhận đã biết", không có điểm) thay vì `approve_work_log` (RPC này chủ động từ chối nếu category `is_leave=true`, buộc dùng đúng RPC).
- **Công bằng khi tổng hợp tháng**: dòng `is_clone=true` VÀ mọi nhật ký nghỉ phép đều bị loại khỏi Tổng quan/`monthlyEvidence()` (đọc `work_logs?is_clone=eq.false` + lọc client-side qua `isLeaveCategory()`) — 1 việc kéo dài 5 ngày không bị tính nặng gấp 5 lần. Ngược lại, các nơi liệt kê theo ngày (Nhật ký của tôi, Nhật ký công tác của đơn vị) **không lọc** — vẫn hiện đủ để thấy đúng ngày nào cũng có ghi nhận.
- **Giới hạn đã biết**: tối đa 60 ngày/lần ghi (CHECK constraint), nội dung mô tả sao y nguyên giống hệt mọi ngày nhân bản (không sửa riêng từng ngày), tự động bỏ thứ Bảy/Chủ nhật (không có tùy chọn bật lại).

### 6.5. Ba hàm kiểm tra quyền — KHÔNG được nhầm lẫn

Cả demo (`canManagePerson`/`canReviewLog`) và production (hàm SQL `can_manage_person`/`can_review_log` cộng bản mirror JS cùng tên phía client) đều có cặp hàm sau, cố ý tách biệt:

- **`can_manage_person(target_id)`** — "Tôi có nằm trong chuỗi quản lý của NGƯỜI NÀY không", không xét nhật ký cụ thể nào. Dùng cho: Giao việc (ai giao được việc cho ai), `override_work_log_score` (kiểm tra thứ bậc với người ĐÃ CHẤM TRƯỚC — 1 câu hỏi về người, không liên quan routing của 1 log cụ thể), `delete_work_log` (lãnh đạo xóa hộ — cũng là câu hỏi thứ bậc với TÁC GIẢ, không phải routing). Nhánh `unit_deputy`: cùng đơn vị + đối tượng là `staff`/`support_staff` — **không giới hạn theo danh sách**, bất kỳ Phó phòng nào cũng quản lý được bất kỳ ai trong đơn vị.
- **`can_review_log(log_id)`** — "Tôi có duyệt được ĐÚNG NHẬT KÝ NÀY không". Nhánh `unit_deputy`: được duyệt nếu **đang có ủy quyền toàn quyền hiệu lực** (xem cả đơn vị như Trưởng phòng) HOẶC `submitted_to_id` của log này đúng là mình. Các vai trò khác (`unit_head` trở lên) fallback về `can_manage_person(author_id)` — cấp trưởng luôn có toàn quyền, không phụ thuộc `submitted_to_id`.
- **`can_approve_monthly(target_id)`** — quyền duyệt đánh giá xếp loại tháng, logic tương tự `can_manage_person` (nhánh `unit_deputy` cũng cần ủy quyền toàn quyền đang active).

**Sai lầm cần tránh** (đã từng mắc phải và phải sửa lại giữa chừng): dùng `can_review_log` cho các trường hợp thực chất là câu hỏi về NGƯỜI (điều chỉnh điểm, xóa hộ) — sẽ vô tình gắn quyền vào việc "nhật ký cụ thể này nộp cho ai" thay vì đúng bản chất "tôi có quản lý được người này không".

Ngoài ra còn `ROLE_RANK`/`isVisibleInUnitScope` — **không liên quan** đến bộ 3 hàm trên, chỉ dùng để chặn cấp dưới xem được dữ liệu của cấp trên khi duyệt danh sách/dashboard trong cùng 1 đơn vị (Phó phòng và Trưởng phòng cùng `unit_id`).

## 7. Mô hình dữ liệu chính (Postgres, `supabase/migrations/`)

- **`profiles`**: `id, full_name, role, unit_id, title, professional_title, is_active`. Tài khoản mới luôn tạo với `role='staff', is_active=false` (trigger `handle_new_user()` ép cứng, không tin metadata client gửi lên) — quản trị viên phải duyệt và gán đúng vai trò/đơn vị sau.
- **`units`**: `id, short_name, code, type ('province'|'department'|'regional'), parent_id`.
- **`work_logs`**: các cột nghiệp vụ chuẩn (`author_id, unit_id, log_date, category_id, title, result, work_role, duration, evidence, status, complexity_score, quality_score, reviewer_id, self_complexity_score, self_quality_score, revision_count, task_assignment_id`) **+ `submitted_to_id UUID`** (thêm ở 00039) — người được chọn/tự động gán để nộp nhật ký này cho **+ `range_start_date DATE`, `is_clone BOOLEAN`, `clone_group_id UUID`** (thêm ở 00057, xem mục 6.4) — cơ chế "công việc nhiều ngày"/"nghỉ phép".
- **`work_categories`**: `id, code, name, is_active, sort_order` **+ `is_leave BOOLEAN`** (thêm ở 00057) — đúng 1 dòng `code='NGHI_PHEP'` được đánh dấu `is_leave=true`, dùng để giao diện/RPC nhận biết nhật ký nào không cần chấm điểm.
- **`task_assignments`**: mô hình **1 dòng = 1 người được giao** (mỗi người tự theo dõi `status`/`actual_due_date`/`linked_log_id` riêng) **+ `task_group_id UUID`** (các dòng cùng 1 lần giao — 1 chủ trì + N phối hợp — dùng chung giá trị này để gộp hiển thị phía người giao) **+ `work_role ('chu_tri'|'phoi_hop')`** (thêm ở 00039/00042). `suggested_due_date`/`actual_due_date` là `TIMESTAMPTZ` (đổi từ `DATE` ở 00039) — hạn giao việc chính xác đến giờ:phút.
- **`delegations`**: `delegator_id, delegate_id, unit_id, starts_at, ends_at, status`. Bảng `delegation_scopes` (danh sách người cụ thể) đã **bị xóa hẳn** ở migration 00040 — ủy quyền giờ luôn là toàn quyền cả đơn vị/toàn tỉnh, không còn khái niệm "phạm vi người". Client-side nên lọc theo `delegator_id` (không phải `unit_id`) để xác định "người này có đang là bên ủy quyền của 1 ủy quyền active không" — xem mục 6.3.
- **`notifications`**: hệ thống thông báo real event (không phải suy luận ad-hoc), RLS chỉ cho đọc thông báo của chính mình.
- Enum quan trọng: `notification_type` (đã có `score_override_escalation`, `work_log_deleted_by_leader`, `delegation_granted`, `delegation_revoked`, `score_overridden_by_senior`, ...).

### RPC chính cần biết

| RPC | Vai trò |
|---|---|
| `approve_work_log` / `reject_work_log` | Duyệt/trả lại — kiểm tra `can_review_log(p_log_id)`. `approve_work_log` từ chối thẳng nếu category `is_leave=true` (buộc dùng `acknowledge_leave_log`); sau khi duyệt xong, nếu có `range_start_date` thì tự gọi `create_work_log_clones()` |
| `acknowledge_leave_log(p_log_id)` | Lãnh đạo "xác nhận đã biết" 1 nhật ký nghỉ phép — không chấm điểm, cũng tự gọi `create_work_log_clones()` sau khi xác nhận (thêm 00059) |
| `create_work_log_clones(p_primary_id)` | Helper dùng chung cho 2 RPC trên — sinh các dòng `is_clone=true` cho từng ngày trong `range_start_date..log_date`, bỏ thứ Bảy/Chủ nhật (thêm 00058) |
| `override_work_log_score` | Cấp trên điều chỉnh điểm đã chấm — kiểm tra `can_manage_person(v_log.reviewer_id)`; nếu log thuộc 1 nhóm nhân bản, đồng bộ điểm mới cho **cả nhóm**; từ chối nếu category `is_leave=true` (thêm 00060) |
| `delete_work_log(p_log_id, p_reason?)` | Tự xóa (chỉ khi `pending`/`revision`) hoặc lãnh đạo xóa hộ (mọi trạng thái, bắt buộc lý do, gửi thông báo) — kiểm tra `can_manage_person(author_id)`. Xóa dòng "gốc" tự cascade xóa sạch cả nhóm nhân bản qua FK `clone_group_id ON DELETE CASCADE`, không cần code riêng |
| `grant_delegation` / `revoke_delegation` | Cấp/thu hồi ủy quyền toàn quyền — chỉ đúng 2 cặp hợp lệ: `unit_head`→`unit_deputy` (cùng đơn vị) hoặc `province_head`→`province_deputy` (xem mục 6.3, sửa lỗi gán sai cấp ở 00061) |
| `create_task_assignment(p_lead_assignee_id, p_support_assignee_ids[], p_title, p_description?, p_suggested_due_date?)` | Giao 1 việc cho nhiều người cùng lúc, kiểm tra `can_manage_person` cho TỪNG người |
| `set_task_due_date(p_task_id, p_due_date TIMESTAMPTZ)` | Người được giao tự đặt hạn hoàn thành thực tế |
| `link_task_to_log(p_task_id, p_log_id)` | Gắn nhật ký với việc được giao — tự set `submitted_to_id = assigner_id`, task chuyển `status='reported'` |
| `has_active_delegation(p_user_id?)` | Helper kiểm tra ủy quyền còn hiệu lực |
| `can_manage_person` / `can_review_log` / `can_approve_monthly` | Xem mục 6.5 |

## 8. Tài khoản thật trên production

Đăng nhập tại `https://qlcv-b29.pages.dev/`. **Đã đổi hẳn quy mô so với giai đoạn thử nghiệm ban đầu**: tính đến 05/09/2026, production có **84 profile thật** (kiểm tra trực tiếp qua SQL), trải trên toàn bộ cơ cấu VKSND tỉnh Bắc Ninh — không còn là dữ liệu test cục bộ ở 1 đơn vị nữa. Việc rollout toàn cơ quan này diễn ra qua các commit "Cập nhật danh mục lĩnh vực công tác", "Bổ sung thống kê theo lĩnh vực công tác", "fix: remove obsolete account approval flow", "Phân quyền giao và nhận công việc theo vai trò" — **không phải do phiên làm việc này thực hiện**, nên khi cần chi tiết từng tài khoản/thay đổi phân quyền đó, đọc trực tiếp các commit này thay vì tin tài liệu ở đây là đầy đủ.

Phân bố 84 profile theo đơn vị (`units.type`):
- **`province`** (VKSND tỉnh): 3 người (Viện trưởng, Phó Viện trưởng tỉnh, Quản trị hệ thống).
- **`department`**: chỉ **Văn phòng** (35 người) và **Phòng 10** (10 người), **Phòng 15** (2 người) hiện có người thật; **Phòng 1/2/3/7/8/9** và **Thanh tra - Khiếu tố** đã có sẵn đơn vị trong hệ thống nhưng **0 profile** (chưa cấp tài khoản).
- **`regional`** (Khu vực 1–9, mô hình Viện khu vực): chỉ **Khu vực 1** có người thật (34 người); **Khu vực 2–9** đều **0 profile**.

Đơn vị có ≥2 `unit_deputy` (test được kịch bản "nhiều Phó cùng đơn vị", nộp đích danh cho đúng 1 Phó): **Văn phòng** (3 Phó), **Phòng 10** (4 Phó), **Khu vực 1** (4 Phó).

**Email và mật khẩu của các tài khoản test này KHÔNG ghi trong file này** (repo GitHub đang để công khai - từng bị lộ nguyên bảng mật khẩu thật ở đây, đã gỡ bỏ ngày 31/08/2026) - xem file `Account.docx` lưu riêng ở máy, không đưa lên GitHub.

Đơn vị Văn phòng: `unit_id = e78884b8-6fc0-4c67-8034-5ac528450eeb`.

Ghi chú lịch sử (đã xử lý xong, không còn hiệu lực): 5 tài khoản Văn phòng từng bị nghi ngờ "chưa tồn tại" ở lần kiểm tra 29/08/2026 (Nguyễn Thị Huệ Anh, Ngô Hồng Lan, Nguyễn Thị Phương Hoa, Nguyễn Đức Chiến, Nguyễn Việt Hoàng) — kiểm tra lại 05/09/2026 xác nhận **cả 5 đã tồn tại** (nằm trong 35 người của Văn phòng hiện tại).

**Dọn tài khoản test rác**: khi tạo tài khoản test tạm thời rồi xóa sau khi kiểm chứng xong, nhớ `audit_logs.actor_id` tham chiếu tới `auth.users.id` **không có `ON DELETE CASCADE`** — nếu tài khoản đó từng thực hiện hành động nào bị ghi audit (duyệt, chấm điểm, ủy quyền...), phải `DELETE FROM audit_logs WHERE actor_id=...` trước, rồi mới `DELETE FROM auth.users` được, nếu không sẽ gặp lỗi vi phạm khóa ngoại.

## 9. Bài học migration đã trả giá thật — bắt buộc tuân thủ

1. **`ALTER TYPE ... ADD VALUE` không bao giờ được gộp chung transaction với DDL/DML khác.** Migration 00025 gộp `ALTER TABLE ADD COLUMN` với `ALTER TYPE ADD VALUE` trong cùng 1 file → Postgres âm thầm rollback TOÀN BỘ migration, làm mất cả 2 cột `self_complexity_score`/`self_quality_score` trong nhiều tuần mà không ai biết, gây lỗi HTTP 400 thật khi người dùng gửi nhật ký. Fix: mỗi `ALTER TYPE ADD VALUE` phải nằm 1 mình 1 file, tách biệt hoàn toàn.
2. **`CREATE OR REPLACE FUNCTION` không đổi được TÊN tham số của hàm đã tồn tại cùng kiểu dữ liệu** (lỗi `42P13`). Khi đổi `can_review_log(p_target_id UUID)` → `can_review_log(p_log_id UUID)` ở migration 00041, phải thêm `DROP FUNCTION IF EXISTS can_review_log(UUID);` trước — nếu không sẽ báo lỗi giữa chừng, làm rollback cả batch nếu chạy nhiều statement gộp chung 1 lần (Postgres chạy nhiều statement trong 1 query string như 1 transaction ngầm).
3. **Đổi tên tham số hoặc đổi kiểu tham số của 1 hàm SECURITY DEFINER đang được hàm KHÁC gọi tới theo tên** không được Postgres cảnh báo gì — hàm gọi cũ sẽ tự động resolve sang phiên bản MỚI ở lần chạy tiếp theo (PL/pgSQL resolve theo tên tại thời điểm biên dịch/chạy, không bind cứng theo OID xuyên phiên bản). Đã từng làm `delete_work_log` (migration 00038, gọi `can_review_log(v_log.author_id)` theo chữ ký NGƯỜI cũ) âm thầm sai sau khi 00041 đổi `can_review_log` sang nhận LOG_ID — tra nhầm 1 log không tồn tại thay vì báo lỗi rõ ràng. Fix ở migration 00045. **Bài học**: mỗi khi đổi ý nghĩa/chữ ký 1 hàm được gọi rộng rãi, phải `grep` toàn bộ migration tìm mọi nơi gọi tên hàm đó để rà lại logic, không chỉ sửa nơi vừa nghĩ tới.
4. **RLS policy tự tham chiếu lại chính bảng của nó qua subquery/EXISTS RẤT DỄ gây "infinite recursion detected in policy" (lỗi `42P17`)**, khác với suy đoán trực giác rằng nó sẽ tự hội tụ. Migration 00044 viết `EXISTS (SELECT 1 FROM task_assignments WHERE ...)` ngay trong chính policy SELECT của `task_assignments` → chặn đứng TOÀN BỘ SELECT trên bảng đó cho mọi người dùng (phát hiện bằng curl thật, không phải review tĩnh). Fix đúng (migration 00046): chuyển điều kiện tự tham chiếu sang 1 hàm `SECURITY DEFINER` riêng (hàm chạy với quyền chủ bảng, mặc định bỏ qua RLS của chính nó khi truy vấn bên trong), rồi gọi hàm đó trong policy thay vì viết thẳng subquery tự tham chiếu.
5. Tên bảng category thật là **`work_categories`**, không phải `work_log_categories` — dễ đoán nhầm khi viết test/script mới.
6. Giá trị hợp lệ của `work_logs.duration` là `duoi_2_gio`/`2_4_gio`/`tren_4_gio`/`nhieu_ngay` (xem `DURATION_LABEL` trong `app.js`) — nhãn hiển thị của `tren_4_gio` là **"4 giờ - 1 ngày"** (đổi 05/09/2026, giá trị lưu DB không đổi). Không phải tiếng Anh kiểu `under_1h`.
7. **CSS `[hidden]` bị 1 rule khác cùng độ ưu tiên (specificity) đè mất tác dụng.** Style mặc định của trình duyệt là `[hidden]{display:none}`; nếu 1 class trên cùng element (ví dụ `.field{display:grid}`) cũng set `display`, 2 rule có specificity ngang nhau và **rule trong stylesheet của trang luôn thắng** UA stylesheet — nên set `element.hidden=true` bằng JS xong mà phần tử vẫn hiện, dù `.hidden` property đã đúng `true`. Gặp lại đúng bug này khi ẩn/hiện `#journalRangeStartField` theo lựa chọn "Thời lượng" — verify sai lầm đầu tiên vì chỉ kiểm tra property `.hidden`, phải dùng `getComputedStyle(el).display` mới thấy đúng. Cách sửa ĐÚNG (đã dùng nhiều lần trong CSS của dự án — `.modal-backdrop[hidden]`, `.revision-notice[hidden]`, `.field-warning[hidden]`, `.copy-journal-panel[hidden]`): thêm riêng 1 rule `#id[hidden]{display:none}` cho từng phần tử cần ẩn/hiện động, **không** dùng JS `style.display` để né.
8. **`audit_logs.actor_id` không có `ON DELETE CASCADE`** — xóa 1 `auth.users` từng thực hiện hành động được ghi audit (duyệt, chấm điểm, ủy quyền...) sẽ báo lỗi vi phạm khóa ngoại, phải `DELETE FROM audit_logs WHERE actor_id=...` trước. Gặp khi dọn tài khoản test "Test Normal Sec" (xem mục 8).

**Quy trình migration đã thiết lập, tiếp tục áp dụng**: viết file `.sql` đánh số tiếp theo → đưa toàn bộ (hoặc file gộp) cho người dùng chạy trong Supabase SQL Editor → nhận xác nhận đã chạy xong → **tự mình curl thật vào Supabase để verify từng kịch bản** (không chỉ tin migration chạy không lỗi là đủ — như bài học số 4 ở trên, 1 migration chạy "thành công" vẫn có thể phá vỡ tính năng khác) → dọn dữ liệu test → mới commit/push.

## 10. Quy trình git đã thiết lập

- Nhánh mặc định: `main`. Với thay đổi lớn/kiến trúc, tạo nhánh riêng trước khi commit, sau khi test xong mới `git merge --ff-only` vào `main` rồi push — **không commit thẳng lên `main` cho thay đổi lớn**.
- Chỉ push khi người dùng yêu cầu rõ ràng.
- Sau khi push `main` (chạm đúng path mà `deploy-cloudflare.yml` theo dõi), luôn poll `app.js?v=<short-sha>` để xác nhận deploy xong thay vì báo "đã xong" ngay sau lệnh `git push`.
- Không commit `*.docx`, script build tài liệu (`build_*.py`, `write_prod_js.py`, ...) — đã có trong `.gitignore` hoặc cố tình để untracked theo yêu cầu người dùng.

## 11. Việc còn tồn đọng / lưu ý cho người tiếp quản

- `task_assignments` **không có RPC hay RLS DELETE nào** — không có cách nào xóa 1 dòng giao việc qua API (kể cả người giao việc). Đây là thiết kế cố ý (giữ lịch sử giao việc), không phải thiếu sót — nhưng nghĩa là dữ liệu test tạo qua `create_task_assignment` sẽ tồn tại vĩnh viễn trừ khi xóa tay qua SQL Editor.
- README.md và toàn bộ `docs/` ở gốc repo **chưa được cập nhật lại** theo hiện trạng — chỉ tin tài liệu này (`PROJECT_STRUCTURE.md`) và đọc trực tiếp code/migration khi cần chi tiết.
- Có 1 tài liệu hướng dẫn sử dụng dạng Word (`Tai_lieu_huong_dan_su_dung_QLCV.docx`, ở gốc repo, KHÔNG commit vào git) dành cho lãnh đạo/người dùng cuối — nội dung tóm tắt tính năng theo từng chức danh, không có minh chứng/dữ liệu nhạy cảm. Không phải tài liệu kỹ thuật, không cần đọc để sửa code.
- Chưa có bộ test tự động chạy trong CI cho `demo/`/`production/` (workflow `ci.yml` test nhắm nhầm vào `src/` chết, xem mục 0) — mọi kiểm thử hiện tại đều làm thủ công theo mục 5 mỗi khi có thay đổi, không có gate tự động chặn PR lỗi.
- **Giới hạn đã biết của "Công việc nhiều ngày"/"Nghỉ phép"** (mục 6.4): tối đa 60 ngày mỗi lần (`chk_work_logs_range_max_60_days`); nhân bản tự động bỏ qua thứ Bảy/Chủ nhật, không tính lịch nghỉ lễ; nội dung mọi ngày nhân bản **giống hệt** ngày gốc, không sửa riêng được từng ngày (nếu cần mô tả khác nhau theo ngày, phải ghi nhiều nhật ký riêng lẻ thay vì dùng tính năng này).
- Thư mục `Van_ban_lien_quan/` ở gốc repo (nếu có trên máy) **không commit vào git** — chứa `Account.docx` (tài khoản test thật) và các văn bản nội bộ thật khác; đã gitignore, nhắc lại vì dễ bị `git add -A` gom nhầm.

## 12. Trình tự đọc nhanh cho LLM tiếp quản

1. Đọc file này (toàn bộ, kể cả mục 0 — tránh sửa nhầm code chết).
2. Đọc `production/config.js` để biết Supabase project đang trỏ tới đâu.
3. Đọc migration mới nhất theo thứ tự số tăng dần trong `supabase/migrations/` để nắm đúng schema/RPC hiện tại — **không tin bất kỳ mô tả schema nào trong `docs/`**, chỉ tin file migration.
4. Xác định thay đổi cần làm ảnh hưởng `demo/` hay `production/` hay cả 2 — sửa song song nếu là 1 tính năng nghiệp vụ.
5. Với thay đổi đụng permission, tra kỹ mục 6.5 trước khi viết điều kiện mới — dễ nhầm giữa "quản lý người" và "duyệt đúng log này".
6. Với migration mới, đọc kỹ mục 9 trước khi viết SQL — 8 bài học ở đó đều từng gây lỗi thật trên production.
7. Kiểm thử theo mục 5, verify migration bằng curl thật theo mục 9 trước khi commit.
8. Theo quy trình git ở mục 10 trước khi push.
