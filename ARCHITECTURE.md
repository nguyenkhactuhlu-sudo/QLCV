# Cơ chế hoạt động và luồng dữ liệu — QLCV

> Cập nhật: 30/08/2026. Mục đích của file này KHÁC `PROJECT_STRUCTURE.md`: file kia mô tả *cấu trúc code/triển khai* (file nào thật, file nào rác, deploy ra sao); file NÀY mô tả *cơ chế nghiệp vụ và luồng dữ liệu* — vai trò nào làm được gì, dữ liệu đi qua bảng/hàm nào, và các cạm bẫy đã từng gây lỗi thật. Đọc file này để xác nhận hiểu đúng hệ thống trước khi sửa lỗi hoặc thêm tính năng có khả năng đụng vào các luồng đã mô tả.

## 1. Mô hình vai trò và đơn vị

7 vai trò (`profiles.role`, kiểu enum `user_role`), theo thứ tự cấp bậc quản lý giảm dần:

| Vai trò | Ý nghĩa | Quản lý trực tiếp ai |
|---|---|---|
| `administrator` | Quản trị hệ thống — quản lý tài khoản, KHÔNG nằm trong chuỗi duyệt/chấm điểm nội dung | Không quản lý ai theo nghĩa nghiệp vụ (không đọc được `work_logs` qua RLS trừ vài trường hợp) |
| `province_head` | Viện trưởng tỉnh | `province_deputy`, `unit_head`, và bất kỳ ai thuộc "đơn vị cấp tỉnh" (`PROVINCE_UNIT_ID`) |
| `province_deputy` | Phó Viện trưởng tỉnh | Chỉ `unit_head` của các đơn vị được phân công (`unit_assignments`) |
| `unit_head` | Trưởng phòng / Viện trưởng khu vực | Mọi người trong đơn vị mình, trừ `unit_head` khác |
| `unit_deputy` | Phó phòng / Phó Viện trưởng khu vực | `staff`/`support_staff` cùng đơn vị — nhưng riêng việc DUYỆT NHẬT KÝ chỉ giới hạn ở người "nộp cho mình" (`work_logs.submitted_to_id`), trừ khi đang có ủy quyền toàn quyền (mục 4) |
| `staff` | Cán bộ, công chức, Kiểm sát viên | — |
| `support_staff` | Người lao động | — |

`administrator` **không phải** một nấc trong chuỗi quản lý nội dung — vai trò này chỉ có quyền trên `profiles`/tài khoản, không tự động có quyền đọc/duyệt `work_logs` như `province_head` (xem RLS ở mục 3).

## 2. Mô hình quyền hạn — 3 hàm nền tảng

Toàn bộ quyền "ai được xem/duyệt/quản lý ai" dồn vào 3 hàm SQL `SECURITY DEFINER`, định nghĩa mới nhất nằm ở `supabase/migrations/00041_permission_model_rework.sql`:

| Hàm SQL | Tham số | Trả lời câu hỏi |
|---|---|---|
| `can_manage_person(p_target_id UUID)` | UUID của **1 người** | "Tôi có nằm trong chuỗi quản lý người này không?" — dùng cho Giao việc, và cho việc lãnh đạo cấp trên điều chỉnh điểm đã chấm bởi 1 người khác |
| `can_review_log(p_log_id UUID)` | UUID của **1 nhật ký** | "Tôi có duyệt được ĐÚNG nhật ký này không?" — khác `can_manage_person` ở chỗ Phó phòng chỉ duyệt được nhật ký đã "nộp cho mình" (`submitted_to_id`), trừ khi có ủy quyền toàn quyền |
| `can_approve_monthly(p_target_user_id UUID)` | UUID của **1 người** | "Tôi có chấm điểm tháng cho người này không?" |

Mỗi hàm có **1 bản mirror JavaScript phía client** để hiện/ẩn nút bấm trước khi gọi server (server luôn là chốt chặn thật, client chỉ là gợi ý giao diện):

| Hàm SQL | Mirror `production/app.js` | Mirror `demo/app.js` |
|---|---|---|
| `can_manage_person` | `canManagePerson(person)` | `canManagePerson(target, viewer)` |
| `can_review_log` | `canReviewLog(log, author)` | `canReviewLog(log, viewer)` |
| `can_approve_monthly` | `canApproveMonthly(person)` | hàm cùng tên |

**Đây là 2 bản logic tách rời, không có cơ chế nào tự đồng bộ khi 1 bên đổi.** Đã rà soát trực tiếp (30/08/2026): tại thời điểm này cả 3 cặp đều khớp đúng bản SQL mới nhất — nhưng bất kỳ lần sửa quyền hạn nào sau này PHẢI sửa cả 2 phía, và nên rà lại theo mục 6.

## 3. Luồng dữ liệu theo từng tính năng

### 3.1. Nhật ký công việc (`work_logs`)

```
staff/support_staff tạo (status=pending, tự chấm self_complexity_score/self_quality_score)
        │
        ▼
người duyệt hợp lệ (can_review_log) gọi approve_work_log HOẶC reject_work_log
        │                                         │
   status=approved                          status=revision
   (ghi complexity_score/quality_score,      (review_comment = lý do,
    reviewer_id, work_log_reviews thêm 1     tác giả sửa+trình lại →
    dòng lịch sử)                            quay lại pending)
        │
        ▼ (TÙY CHỌN — chỉ khi đã approved)
lãnh đạo CAO HƠN người duyệt trước (can_manage_person(reviewer cũ))
gọi override_work_log_score → ghi đè complexity_score/quality_score/
reviewer_id, review_comment MỚI (có thể để trống), thêm 1 dòng nữa vào
work_log_reviews, gửi 2 thông báo khác loại (mục 3.5)
```

- `work_logs.unit_id` ghi **cố định tại thời điểm tạo**, không đổi theo nếu sau này tác giả bị chuyển đơn vị (`assign_account_role`, migration 00013 chỉ `UPDATE profiles`, không đụng `work_logs`) — đã kiểm chứng trực tiếp trên dữ liệu thật trong phiên trước.
- `work_log_reviews` lưu **mọi lượt chấm/điều chỉnh** (cả lần duyệt gốc lẫn mọi lần override sau đó) — dùng để tính "đã bị điều chỉnh chưa" (`_reviewCount >= 2` phía client) và hiển thị lý do cho tác giả.
- Xoá nhật ký: tác giả tự xoá khi còn `pending`/`revision` (RLS trực tiếp); lãnh đạo xoá hộ cấp dưới ở BẤT KỲ trạng thái nào qua RPC `delete_work_log` (yêu cầu lý do, dùng `can_manage_person(author)`).

### 3.2. Đánh giá tháng (`monthly_reviews`)

Không có bảng lịch sử riêng như `work_log_reviews` — mỗi `(user_id, period)` chỉ có 1 dòng, ghi đè trực tiếp qua 3 RPC:
- `save_monthly_self_score` — người bị chấm tự ghi điểm tự chấm.
- `approve_monthly_review` — người duyệt hợp lệ (`can_approve_monthly`) ghi điểm chính thức + xếp loại; bắt buộc giải trình nếu chênh lệch ≥ 2 điểm so với tự chấm (khác `work_logs`, quy tắc "bắt buộc giải trình" này KHÔNG bị đụng vào trong đợt sửa vừa rồi, chỉ đúng phạm vi `override_work_log_score`).
- `save_province_head_self_evaluation` — Viện trưởng tỉnh không có cấp trên nên tự chấm + tự xếp loại luôn.

### 3.3. Giao việc (`task_assignments`)

`create_task_assignment` (chủ trì + nhiều người phối hợp cùng lúc, mỗi người 1 dòng riêng trong `task_assignments`, nhóm lại bằng `task_group_id`) — quyền tạo dựa trên `can_manage_person` cho CẢ người chủ trì lẫn từng người phối hợp. Khi tác giả ghi nhật ký cho việc được giao, `work_logs.task_assignment_id` liên kết qua `link_task_to_log`; khi nhật ký đó được duyệt (`approve_work_log`), `task_assignments.status` tự chuyển `done`.

### 3.4. Ủy quyền (`delegations`)

Chỉ áp dụng cho `unit_deputy` (Phó phòng) — được `unit_head`/cấp trên cấp cho quyền "thay mặt Trưởng phòng duyệt toàn bộ đơn vị" trong 1 khoảng thời gian (`grant_delegation`/`revoke_delegation`). Khi đang có ủy quyền active, `can_review_log` cho `unit_deputy` bỏ qua điều kiện `submitted_to_id`, coi như duyệt được cả đơn vị.

### 3.5. Thông báo (`notifications`)

Mỗi thông báo có `type` (enum `notification_type`, phải `ALTER TYPE ... ADD VALUE` **ở 1 migration riêng** trước khi dùng — xem mục 5) và 1 `user_id` nhận. Phía client, `fetchNotifications()` (`production/app.js`) / hàm tương đương (`demo/app.js`) ánh xạ `type` → trang điều hướng khi bấm vào. Bảng dưới đây là kết quả rà soát trực tiếp toàn bộ các loại đang tồn tại (30/08/2026):

| `type` | Ai nhận | Trang điều hướng hiện tại | Đúng/sai |
|---|---|---|---|
| `score_overridden_by_senior` | Tác giả nhật ký (bất kỳ vai trò nào) | `journal` (Nhật ký của tôi) | Đúng (đã sửa) |
| `score_overridden_reviewer_notice` | Người đã chấm trước (luôn là lãnh đạo) | `unitJournal` | Đúng (đã sửa) |
| `score_override_escalation` | Cấp trên của người bị chênh điểm nhiều lần (luôn là lãnh đạo) | `unitJournal` (rơi vào nhánh mặc định) | Đúng |
| `delegation_granted` / `delegation_revoked` | Người được/bị thu ủy quyền — luôn là `unit_deputy` | `administration` | **SAI** — trang `administration` không cho `unit_deputy` vào (cả production lẫn demo), bấm thông báo bị đá về Tổng quan. Chưa sửa trong đợt này, cần anh duyệt hướng xử lý. |
| `work_log_deleted_by_leader` | Tác giả nhật ký bị xoá (bất kỳ vai trò nào) | `unitJournal` (rơi vào nhánh mặc định) | **SAI** ở `production/app.js` — tác giả thường không vào được `unitJournal`, nên bị đá về Tổng quan. Bản `demo/app.js` gán `view` trực tiếp lúc tạo (`"journal"`) nên KHÔNG bị lỗi này. Chưa sửa trong đợt này. |

### 3.6. Tài khoản (`profiles` + Supabase Auth)

Từ khi bỏ tự đăng ký, tạo/quản lý tài khoản chỉ qua **1 Edge Function thật duy nhất** của dự án: `supabase/functions/admin-manage-users/index.ts` — giữ `SERVICE_ROLE_KEY` làm secret riêng, tự xác thực người gọi là `administrator`/`province_head` đang hoạt động (qua anon key + JWT) trước khi dùng client thứ 2 (service role) để `auth.admin.createUser`/`updateUserById`. Đổi vai trò/đơn vị ("chuyển công tác") dùng RPC `assign_account_role` (migration 00013) — chỉ `UPDATE profiles`, không đụng dữ liệu lịch sử.

## 4. 3 cạm bẫy kiến trúc đã xác nhận gây lỗi thật

Đây chính là "họ lỗi" đứng sau vụ điều chỉnh điểm — biết trước 3 dạng này để rà soát nhanh hơn khi nghi có lỗi tương tự.

1. **Migration là lịch sử, không phải trạng thái sống.** Dự án KHÔNG dùng `supabase db push` có theo dõi — mọi SQL đều được dán tay vào Supabase SQL Editor. File số cao hơn thường đáng tin hơn, nhưng khi cần chắc chắn 100% phải gọi thẳng RPC qua REST (`POST rest/v1/rpc/<ten_ham>`) để xem hành vi THẬT, không suy từ đọc file (đã bị nhầm 1 lần đúng trong phiên rà soát này: đọc file tưởng quyền hạn còn lỗi, gọi RPC thật lại thấy đã đúng — vì đợt kiểm tra đầu dính schema cache cũ).
2. **RLS bật nhưng thiếu policy = khoá câm, không báo lỗi.** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` mà không có `CREATE POLICY` cho 1 thao tác nào đó khiến MỌI vai trò (kể cả Viện trưởng) nhận về mảng rỗng khi SELECT, không có exception. Ca thật: `work_log_reviews` (sửa ở migration 00048). Đang "ngủ" nhưng cùng dạng: `attachments` (chỉ có policy SELECT cho chính tác giả, không ai khác đọc được, không có INSERT), `pending_accounts` (chỉ admin, nhưng có code cũ trong `src/` — đã xác nhận CHẾT — từng insert trực tiếp bảng này), `work_log_revisions` (SELECT chỉ tác giả + đúng người duyệt, không có cho `province_head`/admin) — cả 3 hiện không bị gọi bởi `production/app.js`/`demo/app.js` nên chưa vỡ, nhưng sẽ vỡ ngay nếu có tính năng mới dùng thẳng chúng.
3. **Đổi Ý NGHĨA tham số cùng kiểu dữ liệu khi `CREATE OR REPLACE FUNCTION` không gây lỗi cú pháp ở nơi gọi cũ — chỉ âm thầm trả sai.** Ca gốc: migration 00041 đổi `can_review_log(p_target_id UUID)` (ý nghĩa: 1 người) thành `can_review_log(p_log_id UUID)` (ý nghĩa: 1 nhật ký) — Postgres không phân biệt được vì cùng là `UUID`. Đã rà soát toàn bộ migration: đây là hàm DUY NHẤT từng bị đổi kiểu này; 2 nơi gọi cũ bị ảnh hưởng là `override_work_log_score` (migration 00029 — vừa sửa ở 00049) và `delete_work_log` (migration 00038 — hoá ra đã được tự sửa từ trước ở migration 00045, không cần đụng vào).

## 5. Quy trình rà soát định kỳ (checklist)

Khi nghi ngờ có lỗi logic "âm thầm" tương tự (không báo lỗi, chỉ sai kết quả hoặc trả rỗng), chạy lần lượt 4 bước sau — có thể giao song song cho 3 agent tìm kiếm (đã dùng cách này lần đầu, hiệu quả):

1. **Rà RLS**: liệt kê mọi bảng có `ENABLE ROW LEVEL SECURITY` (`grep -rn "ENABLE ROW LEVEL SECURITY" supabase/migrations/`), với mỗi bảng liệt kê mọi `CREATE POLICY ... ON <bảng>` gộp từ TẤT CẢ migration, xác định thao tác nào (SELECT/INSERT/UPDATE/DELETE) chưa có policy nào — rồi đối chiếu bảng đó có đang bị `production/app.js`/`demo/app.js` gọi trực tiếp (không qua RPC) cho đúng thao tác còn thiếu hay không.
2. **Rà đổi nghĩa tham số**: `grep -rn "DROP FUNCTION IF EXISTS public\." supabase/migrations/` — đây là dấu hiệu chắc chắn nhất của việc đổi tên/ý nghĩa tham số cùng kiểu (Postgres bắt buộc DROP tường minh cho trường hợp này). Với mỗi hàm bị DROP+định nghĩa lại, tìm mọi nơi gọi tên hàm đó ở các migration SỐ THẤP HƠN mốc đổi, đọc lại xem giá trị truyền vào có còn đúng ý nghĩa mới không.
3. **Rà định tuyến thông báo**: liệt kê mọi `INSERT INTO notifications` trong migrations, với mỗi `type` xác định "ai nhận" (vai trò gì), rồi đối chiếu bảng ánh xạ `type → view` phía client (mục 3.5) — mọi `type` phải dẫn tới 1 trang mà đúng vai trò người nhận vào được.
4. **Rà lệch quyền client-server**: với mỗi hàm `can*`/`is*` phía client (`grep -n "^function can\|^function is" production/app.js demo/app.js`), tìm hàm SQL cùng vai trò nó mirror (mục 2), đọc bản ĐỊNH NGHĨA MỚI NHẤT theo số migration, so từng nhánh điều kiện.

## 6. Đề xuất cần duyệt (chưa sửa trong đợt 30/08/2026)

| Việc | Vị trí | Đề xuất |
|---|---|---|
| Thông báo `work_log_deleted_by_leader` đá tác giả về Tổng quan | `production/app.js`, hàm `fetchNotifications()` | Thêm nhánh rõ ràng `n.type==='work_log_deleted_by_leader'?'journal':...` thay vì để rơi vào mặc định `unitJournal` |
| Thông báo `delegation_granted`/`delegation_revoked` đá `unit_deputy` về Tổng quan | `production/app.js` (`ra()`, gate dòng kiểm `fullAccess||U.rl==='unit_head'`) và `demo/app.js` (`renderAdministration()`) | Cần quyết định: cho `unit_deputy` xem 1 phần trang `administration` (chỉ mục ủy quyền của chính họ), hay đổi đích thông báo sang 1 nơi khác họ đã vào được sẵn (vd banner ở Tổng quan) |
