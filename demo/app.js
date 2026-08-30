const STORAGE_KEY = "vks-worklog-demo-v3";
const MONTHLY_STORAGE_KEY = "vks-monthly-demo-v1";
const PERSONNEL_STORAGE_KEY = "vks-personnel-demo-v1";
const AUDIT_STORAGE_KEY = "vks-audit-demo-v1";
const REGISTERED_ACCOUNT_STORAGE_KEY = "vks-registered-accounts-demo-v1";
const NOTIFICATION_READ_STORAGE_KEY = "vks-notification-read-demo-v1";
const PERSONAL_NOTES_STORAGE_KEY = "vks-personal-notes-demo-v1";
const STICKY_NOTES_STORAGE_KEY = "vks-sticky-notes-demo-v1";
const SYSTEM_NOTIFICATIONS_STORAGE_KEY = "vks-override-notifications-demo-v1";
const DELEGATIONS_STORAGE_KEY = "vks-delegations-demo-v1";
const TASK_ASSIGNMENTS_STORAGE_KEY = "vks-task-assignments-demo-v1";

const units = [
  { id: "province", name: "VKSND tỉnh", short: "VKSND tỉnh", type: "province", parentId: null },
  { id: "p1", name: "Phòng Thực hành quyền công tố, kiểm sát điều tra án trật tự xã hội", short: "Phòng 1", type: "department", parentId: "province" },
  { id: "p2", name: "Phòng nghiệp vụ 2", short: "Phòng 2", type: "department", parentId: "province" },
  { id: "p3", name: "Phòng nghiệp vụ 3", short: "Phòng 3", type: "department", parentId: "province" },
  { id: "p7", name: "Phòng Kiểm sát thi hành án dân sự", short: "Phòng 7", type: "department", parentId: "province" },
  { id: "p8", name: "Phòng nghiệp vụ 8", short: "Phòng 8", type: "department", parentId: "province" },
  { id: "p9", name: "Phòng nghiệp vụ 9", short: "Phòng 9", type: "department", parentId: "province" },
  { id: "p10", name: "Phòng nghiệp vụ 10", short: "Phòng 10", type: "department", parentId: "province" },
  { id: "p15", name: "Phòng nghiệp vụ 15", short: "Phòng 15", type: "department", parentId: "province" },
  { id: "tt", name: "Thanh tra - Khiếu tố", short: "Thanh tra - Khiếu tố", type: "department", parentId: "province" },
  { id: "vp", name: "Văn phòng tổng hợp", short: "Văn phòng", type: "department", parentId: "province" },
  { id: "kv1", name: "VKSND Khu vực 1", short: "Khu vực 1", type: "regional", parentId: "province" },
  { id: "kv2", name: "VKSND Khu vực 2", short: "Khu vực 2", type: "regional", parentId: "province" },
  { id: "kv3", name: "VKSND Khu vực 3", short: "Khu vực 3", type: "regional", parentId: "province" },
  { id: "kv4", name: "VKSND Khu vực 4", short: "Khu vực 4", type: "regional", parentId: "province" },
  { id: "kv5", name: "VKSND Khu vực 5", short: "Khu vực 5", type: "regional", parentId: "province" },
  { id: "kv6", name: "VKSND Khu vực 6", short: "Khu vực 6", type: "regional", parentId: "province" },
  { id: "kv7", name: "VKSND Khu vực 7", short: "Khu vực 7", type: "regional", parentId: "province" },
  { id: "kv8", name: "VKSND Khu vực 8", short: "Khu vực 8", type: "regional", parentId: "province" },
  { id: "kv9", name: "VKSND Khu vực 9", short: "Khu vực 9", type: "regional", parentId: "province" }
];

const users = [
  { id: "u01", name: "Phạm Hải Anh", title: "Viện trưởng", professionalTitle: "KSV cao cấp", role: "province_head", unitId: "province", initials: "PA" },
  { id: "u02", name: "Nguyễn Văn Lượng", title: "Phó Viện trưởng", professionalTitle: "KSV cao cấp", role: "province_deputy", unitId: "province", assignedUnits: ["p1", "p7", "kv1"], initials: "NL" },
  { id: "u03", name: "Lưu Thị Lệ Phương", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p1", initials: "LP" },
  { id: "u04", name: "Phùng Đức Khương", title: "Phó Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_deputy", unitId: "p1", initials: "PK" },
  { id: "u05", name: "Nguyễn Văn Quân", title: "Kiểm sát viên", professionalTitle: "KSV Trung cấp", role: "staff", unitId: "p1", initials: "NQ" },
  { id: "u06", name: "Nguyễn Tiến Trung", title: "Kiểm sát viên", professionalTitle: "KSV Trung cấp", role: "staff", unitId: "p1", initials: "NT" },
  { id: "u07", name: "Phạm Hữu Cường", title: "Kiểm sát viên", professionalTitle: "KSV Trung cấp", role: "staff", unitId: "p1", initials: "PC" },
  { id: "u08", name: "Nguyễn Ngọc Cường", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv1", initials: "NC" },
  { id: "u09", name: "Trần Thị Huệ", title: "Phó Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_deputy", unitId: "kv1", initials: "TH" },
  { id: "u10", name: "Vi Xuân Vượng", title: "Kiểm sát viên", professionalTitle: "KSV sơ cấp", role: "staff", unitId: "kv1", initials: "VV" },
  { id: "u11", name: "Trần Văn Mạnh", title: "Kiểm sát viên", professionalTitle: "KSV sơ cấp", role: "staff", unitId: "kv1", initials: "TM" },
  { id: "u12", name: "Hoàng Văn Quý", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p7", initials: "HQ" },
  { id: "u13", name: "Thân Thanh Huyền", title: "Kiểm sát viên", professionalTitle: "KSV Trung cấp", role: "staff", unitId: "p7", initials: "TH" },
  { id: "u14", name: "Nguyễn Thế Anh", title: "Chánh Văn phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "vp", initials: "NA" },
  { id: "u15", name: "Nguyễn Thị Huệ Anh", title: "Phó Chánh Văn phòng", professionalTitle: "KSV Trung cấp", role: "unit_deputy", unitId: "vp", initials: "HA" },
  { id: "u16", name: "Hoàng Tùng", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv2", initials: "HT" },
  { id: "u17", name: "Phạm Thu Hà", title: "Phó Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_deputy", unitId: "kv2", initials: "PH" },
  { id: "u18", name: "Ngô Văn Tuấn", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv3", initials: "NT" },
  { id: "u19", name: "Nguyễn Văn Hải", title: "Kiểm sát viên", professionalTitle: "KSV sơ cấp", role: "staff", unitId: "kv3", initials: "NH" },
  { id: "u20", name: "Quản trị hệ thống", title: "Quản trị demo", professionalTitle: "", role: "administrator", unitId: "province", initials: "QT" },
  { id: "u21", name: "Lưu Hồng Anh", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p2", initials: "LA" },
  { id: "u22", name: "Vũ Công Thập", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p3", initials: "VT" },
  { id: "u23", name: "Nguyễn Thị Hồng", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p8", initials: "NH" },
  { id: "u24", name: "Lê Đình Tuấn", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p9", initials: "LT" },
  { id: "u25", name: "Ngô Minh Hiệu", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p10", initials: "NH" },
  { id: "u26", name: "Nguyễn Huy Quang", title: "Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "p15", initials: "NQ" },
  { id: "u27", name: "Nguyễn Văn Lương", title: "Chánh Thanh tra", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "tt", initials: "NL" },
  { id: "u28", name: "Nguyễn Thị Kim Huyền", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv4", initials: "NH" },
  { id: "u29", name: "Nguyễn Văn Vĩnh", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv5", initials: "NV" },
  { id: "u30", name: "Ngô Thanh Tuấn", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv6", initials: "NT" },
  { id: "u31", name: "Đoàn Xuân Chanh", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv7", initials: "ĐC" },
  { id: "u32", name: "Hoàng Thị Kim Oanh", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv8", initials: "HO" },
  { id: "u33", name: "Vũ Văn Mạnh", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv9", initials: "VM" },
  { id: "u34", name: "Trần Văn Bình", title: "Nhân viên lái xe", professionalTitle: "", role: "support_staff", unitId: "vp", initials: "TB" },
  { id: "u35", name: "Lê Thị Hoa", title: "Nhân viên phục vụ", professionalTitle: "", role: "support_staff", unitId: "vp", initials: "LH" }
];

const sampleMonthly = [
  ["u01", null, 90, "A"], ["u02", 89.5, 89.5, "B"], ["u03", 90, 90, "A"], ["u04", 87, 89, "B"],
  ["u05", 87, 87, "B"], ["u06", 89, 89, "B"], ["u07", 90, 90, "A"], ["u08", 90, 90, "A"],
  ["u09", 90, 90, "A"], ["u10", 88, 88, "B"], ["u11", 90, 90, "A"], ["u12", 90, 90, "A"],
  ["u13", 90, 90, "A"], ["u14", 90, 90, "A"], ["u15", 89, 89, "B"], ["u16", 89, 89, "B"],
  ["u17", 89, 89, "B"], ["u18", 89, 89, "B"], ["u19", 84, 82, "B"], ["u21", 89, 89, "B"],
  ["u22", 90, 90, "A"], ["u23", 89, 89, "B"], ["u24", 89, 89, "B"], ["u25", 89, 89, "B"],
  ["u26", 90, 90, "A"], ["u27", 89, 89, "B"], ["u28", 89, 89, "B"], ["u29", 89, 89, "B"],
  ["u30", 89, 89, "B"], ["u31", 89, 89, "B"], ["u32", 89, 89, "B"], ["u33", 90, 90, "A"],
  ["u34", 86, 86, "B"], ["u35", 90, 90, "A"]
].map(([userId, selfScore, officialScore, classification]) => ({
  userId, period: "2026-06", selfScore, officialScore, classification,
  status: officialScore == null ? "pending" : "approved", note: "", approvedAt: officialScore == null ? null : "2026-07-27T09:00:00"
}));

// Uy quyen cham diem: THAY MAT 100% toan don vi (khong con chon danh sach
// nguoi cu the) - Truong phong uy quyen cho 1 Pho phong thay minh cham
// diem CA DON VI, trong 1 khoang thoi gian. Chi 1 uy quyen active tai 1
// thoi diem cho 1 nguoi uy quyen (xem grantDelegation()).
const sampleDelegations = [
  { id: "DEL001", delegatorId: "u03", delegateId: "u04", unitId: "p1", startsAt: "2026-08-01", endsAt: "2026-08-31", status: "active" }
];

// Giao viec: lanh dao giao viec cho cap duoi trong pham vi duyet duoc
// (dung lai canReviewLog) - hạn gợi ý khong bat buoc, nguoi nhan tu dat
// han thuc te; bao cao ket qua = 1 nhat ky binh thuong qua dung quy
// trinh Duyet & cham diem hien co (xem submitJournal/applyReview).
// Giao viec ho tro giao CUNG LUC cho nhieu nguoi (1 chu tri + N phoi hop),
// dung chung 1 taskGroupId de gom hien thi phia nguoi giao - moi nguoi
// van la 1 dong rieng, tu theo doi tien do/han rieng (xem workRole).
const sampleTaskAssignments = [
  { id: "TASK001", taskGroupId: "TG001", assignerId: "u03", assigneeId: "u05", workRole: "chu_tri", unitId: "p1", title: "Rà soát hồ sơ vụ án Nguyễn Văn A", description: "Tổng hợp chứng cứ, đối chiếu với cáo trạng trước khi báo cáo lãnh đạo.", suggestedDueDate: "2026-08-19T16:30:00", actualDueDate: "2026-08-20T16:30:00", status: "done", linkedLogId: "NK001", createdAt: "2026-08-15T09:00:00" },
  { id: "TASK002", taskGroupId: "TG002", assignerId: "u03", assigneeId: "u06", workRole: "chu_tri", unitId: "p1", title: "Chuẩn bị báo cáo kiểm sát tháng 8", description: "Tổng hợp số liệu kiểm sát điều tra tháng 8 gửi lãnh đạo phòng trước 30/8.", suggestedDueDate: "2026-08-28T17:00:00", actualDueDate: null, status: "pending", linkedLogId: null, createdAt: "2026-08-20T10:00:00" },
  { id: "TASK002B", taskGroupId: "TG002", assignerId: "u03", assigneeId: "u07", workRole: "phoi_hop", unitId: "p1", title: "Chuẩn bị báo cáo kiểm sát tháng 8", description: "Tổng hợp số liệu kiểm sát điều tra tháng 8 gửi lãnh đạo phòng trước 30/8.", suggestedDueDate: "2026-08-28T17:00:00", actualDueDate: null, status: "pending", linkedLogId: null, createdAt: "2026-08-20T10:00:00" },
  { id: "TASK003", taskGroupId: "TG003", assignerId: "u01", assigneeId: "u03", workRole: "chu_tri", unitId: "p1", title: "Tổng hợp kết quả công tác quý III toàn Viện", description: "Trưởng phòng tổng hợp báo cáo quý III của Phòng 1 gửi Viện trưởng.", suggestedDueDate: "2026-08-20T14:30:00", actualDueDate: "2026-08-20T14:30:00", status: "pending", linkedLogId: null, createdAt: "2026-08-10T08:00:00" }
];

const sampleLogs = [
  ["NK001","u05","p1","2026-08-22","Kiểm sát điều tra","Nghiên cứu hồ sơ vụ án và đề xuất yêu cầu điều tra bổ sung","Dự thảo yêu cầu điều tra gồm 5 nội dung trọng tâm","Chủ trì","Trên 4 giờ","HS-2026-018","approved",8,9,"u03"],
  ["NK002","u06","p1","2026-08-22","Thực hành quyền công tố","Dự thảo cáo trạng vụ án trộm cắp tài sản","Hoàn thành dự thảo cáo trạng và bảng kê tài liệu","Chủ trì","Trên 4 giờ","HS-2026-022","approved",7,8,"u03"],
  ["NK003","u07","p1","2026-08-22","Tham mưu, tổng hợp","Rà soát số liệu án tạm đình chỉ trong tháng","Hoàn thành bảng đối chiếu 42 hồ sơ","Phối hợp","2–4 giờ","BC-08-2026","pending",null,null,null],
  ["NK004","u04","p1","2026-08-21","Kiểm sát xét xử","Tham gia xét xử sơ thẩm và báo cáo kết quả","Báo cáo kết quả phiên tòa, đề xuất 2 nội dung rút kinh nghiệm","Chủ trì","Trên 4 giờ","HS-2026-014","pending",null,null,null],
  ["NK005","u05","p1","2026-08-21","Thực hành quyền công tố","Tham gia hỏi cung bị can cùng Điều tra viên","Biên bản hỏi cung và báo cáo đánh giá lời khai","Chủ trì","2–4 giờ","HS-2026-018","approved",6,9,"u03"],
  ["NK006","u06","p1","2026-08-20","Kiểm sát điều tra","Kiểm sát việc khám nghiệm hiện trường","Hoàn thành biên bản kiểm sát và báo cáo nhanh","Phối hợp","Trên 4 giờ","HS-2026-025","approved",8,8,"u03"],
  ["NK007","u07","p1","2026-08-20","Tham mưu, tổng hợp","Số hóa tài liệu phục vụ họp liên ngành","Hoàn thành bộ tài liệu điện tử 126 trang","Phối hợp","2–4 giờ","TL-2026-119","approved",3,9,"u04"],
  ["NK008","u03","p1","2026-08-19","Tham mưu, tổng hợp","Chủ trì họp rà soát án phức tạp của phòng","Kết luận phân công xử lý 6 vụ án có khó khăn, vướng mắc","Chủ trì","Trên 4 giờ","BB-19-08","pending",null,null,null],

  ["NK009","u10","kv1","2026-08-22","Kiểm sát xét xử","Chuẩn bị đề cương xét hỏi phiên tòa hình sự","Đề cương xét hỏi và dự kiến tình huống tranh tụng","Chủ trì","2–4 giờ","HS-KV1-031","approved",7,8,"u08"],
  ["NK010","u11","kv1","2026-08-22","Khiếu nại, tố cáo","Phân loại và tham mưu xử lý đơn khiếu nại","Phiếu phân loại và dự thảo văn bản trả lời","Chủ trì","2–4 giờ","Đ-2026-044","approved",5,9,"u08"],
  ["NK011","u09","kv1","2026-08-21","Kiểm sát điều tra","Kiểm tra tiến độ giải quyết nguồn tin về tội phạm","Báo cáo 8 nguồn tin, đề xuất đôn đốc 2 trường hợp","Chủ trì","Trên 4 giờ","BC-KV1-08","pending",null,null,null],
  ["NK012","u10","kv1","2026-08-20","Thực hành quyền công tố","Phê chuẩn quyết định khởi tố bị can","Báo cáo đề xuất phê chuẩn và dự thảo quyết định","Chủ trì","2–4 giờ","HS-KV1-028","approved",6,8,"u08"],
  ["NK013","u11","kv1","2026-08-19","Kiểm sát thi hành án","Kiểm sát trực tiếp hồ sơ thi hành án treo","Biên bản kiểm sát và 3 kiến nghị khắc phục","Phối hợp","Trên 4 giờ","THA-2026-07","revision",7,4,"u08"],

  ["NK014","u13","p7","2026-08-22","Kiểm sát thi hành án","Rà soát quyết định cưỡng chế thi hành án","Bảng tổng hợp 17 quyết định và 2 hồ sơ cần kiểm tra","Chủ trì","Trên 4 giờ","THADS-08","approved",7,9,"u12"],
  ["NK015","u12","p7","2026-08-21","Kiểm sát thi hành án","Làm việc liên ngành về vụ việc thi hành án phức tạp","Biên bản thống nhất phương án xử lý và mốc thực hiện","Chủ trì","Trên 4 giờ","BBLN-08","pending",null,null,null],
  ["NK016","u13","p7","2026-08-20","Tham mưu, tổng hợp","Tổng hợp vi phạm trong thi hành án dân sự","Dự thảo kiến nghị tổng hợp quý III","Chủ trì","Nhiều ngày","KT-2026-Q3","approved",8,8,"u12"],

  ["NK017","u15","vp","2026-08-22","Tham mưu, tổng hợp","Tổng hợp báo cáo công tác tuần của các đơn vị","Hoàn thành báo cáo tuần và phụ lục 7 đơn vị","Chủ trì","Trên 4 giờ","BC-T32","approved",6,9,"u14"],
  ["NK018","u15","vp","2026-08-21","Công nghệ thông tin","Cập nhật danh mục tài khoản hệ thống nghiệp vụ","Đối chiếu và cập nhật 24 tài khoản thay đổi đơn vị","Phối hợp","2–4 giờ","CNTT-0821","approved",4,8,"u14"],
  ["NK019","u14","vp","2026-08-20","Tham mưu, tổng hợp","Xây dựng chương trình họp giao ban lãnh đạo","Chương trình, tài liệu và dự thảo kết luận giao ban","Chủ trì","Trên 4 giờ","GB-08-2026","approved",7,9,"u01"],

  ["NK020","u17","kv2","2026-08-22","Kiểm sát xét xử","Tham gia phiên tòa dân sự sơ thẩm","Báo cáo kết quả và dự thảo phát biểu của Kiểm sát viên","Chủ trì","Trên 4 giờ","DS-KV2-016","approved",7,7,"u16"],
  ["NK021","u17","kv2","2026-08-20","Khiếu nại, tố cáo","Xác minh nội dung đơn kiến nghị","Biên bản xác minh và dự thảo báo cáo đề xuất","Chủ trì","Nhiều ngày","Đ-KV2-021","revision",6,4,"u16"],
  ["NK022","u16","kv2","2026-08-19","Tham mưu, tổng hợp","Rà soát chỉ tiêu nghiệp vụ 8 tháng","Báo cáo kết quả, xác định 3 chỉ tiêu cần tập trung","Chủ trì","Trên 4 giờ","BC-KV2-08","approved",6,8,"u01"],

  ["NK023","u19","kv3","2026-08-22","Kiểm sát điều tra","Nghiên cứu đề nghị gia hạn tạm giam","Báo cáo đề xuất và dự thảo quyết định phê chuẩn","Chủ trì","2–4 giờ","HS-KV3-012","approved",6,8,"u18"],
  ["NK024","u19","kv3","2026-08-21","Thực hành quyền công tố","Xây dựng luận tội vụ án cố ý gây thương tích","Hoàn thành dự thảo luận tội và đề cương tranh luận","Chủ trì","Trên 4 giờ","HS-KV3-009","approved",8,9,"u18"],
  ["NK025","u18","kv3","2026-08-20","Tham mưu, tổng hợp","Tổ chức họp tháo gỡ vụ án có quan điểm khác nhau","Kết luận cuộc họp và báo cáo xin ý kiến lãnh đạo tỉnh","Chủ trì","Trên 4 giờ","BC-KV3-15","approved",8,8,"u01"],

  ["NK026","u02","province","2026-08-22","Tham mưu, tổng hợp","Kiểm tra tiến độ thực hiện chỉ tiêu các đơn vị phụ trách","Kết luận chỉ đạo đối với 3 đơn vị và 5 nhiệm vụ trọng tâm","Chủ trì","Trên 4 giờ","KL-22-08","pending",null,null,null],
  ["NK027","u02","province","2026-08-21","Tham mưu, tổng hợp","Chủ trì giao ban lãnh đạo Viện","Kết luận giao ban và phân công nhiệm vụ tuần tiếp theo","Chủ trì","Trên 4 giờ","KLGB-08","approved",8,9,"u01"]
].map(([id,authorId,unitId,date,category,title,result,workRole,duration,evidence,status,complexity,quality,reviewerId]) => ({
  id, authorId, unitId, date, category, title, result, workRole, duration, evidence,
  status, complexity, quality, reviewerId,
  comment: status === "revision" ? "Cần bổ sung căn cứ và làm rõ kết quả xử lý." : "",
  createdAt: `${date}T16:30:00`, reviewedAt: reviewerId ? `${date}T18:00:00` : null
}));

const demoWorkTemplates = [
  ["Kiểm sát điều tra", "Nghiên cứu hồ sơ và đề xuất yêu cầu xác minh", "Hoàn thành phiếu nghiên cứu, xác định các nội dung cần tiếp tục làm rõ"],
  ["Thực hành quyền công tố", "Xây dựng dự thảo văn bản tố tụng", "Hoàn thành dự thảo và bảng kiểm căn cứ pháp lý kèm theo"],
  ["Kiểm sát xét xử", "Chuẩn bị nội dung tham gia phiên tòa", "Hoàn thành đề cương xét hỏi, dự kiến tình huống tranh tụng"],
  ["Kiểm sát thi hành án", "Rà soát hồ sơ thi hành án", "Lập bảng đối chiếu hồ sơ và kiến nghị xử lý các nội dung còn thiếu"],
  ["Khiếu nại, tố cáo", "Phân loại và tham mưu xử lý đơn", "Hoàn thành phiếu phân loại cùng dự thảo văn bản trả lời"],
  ["Tham mưu, tổng hợp", "Tổng hợp số liệu phục vụ báo cáo định kỳ", "Hoàn thành báo cáo và phụ lục đối chiếu số liệu các đơn vị"],
  ["Công nghệ thông tin", "Cập nhật dữ liệu trên hệ thống nghiệp vụ", "Đối chiếu, chuẩn hóa dữ liệu và ghi nhận kết quả cập nhật"],
  ["Kiểm sát tạm giữ, tạm giam", "Kiểm tra hồ sơ quản lý người bị tạm giữ", "Hoàn thành biên bản kiểm sát và tổng hợp nội dung cần khắc phục"],
  ["Công tác xây dựng ngành", "Rà soát tiến độ thực hiện nhiệm vụ trọng tâm", "Hoàn thành bảng theo dõi, xác định nhiệm vụ cần đôn đốc"],
  ["Phối hợp liên ngành", "Chuẩn bị nội dung cuộc họp liên ngành", "Hoàn thành tài liệu họp, dự thảo kết luận và phân công thực hiện"]
];

function generateDemoLogs(total = 1200) {
  const authors = users.filter(user => !["province_head", "administrator"].includes(user.role));
  const durations = ["Dưới 2 giờ", "2–4 giờ", "Trên 4 giờ", "Nhiều ngày"];
  const roles = ["Chủ trì", "Phối hợp", "Tham gia"];
  const start = Date.UTC(2026, 2, 1);
  const spanDays = 175;

  return Array.from({ length: total }, (_, index) => {
    const author = authors[(index * 13 + Math.floor(index / 17)) % authors.length];
    const template = demoWorkTemplates[(index * 7 + author.unitId.length) % demoWorkTemplates.length];
    const date = new Date(start + ((index * 37) % spanDays) * 86400000).toISOString().slice(0, 10);
    const status = index % 19 === 0 ? "revision" : index % 7 === 0 ? "pending" : "approved";
    const complexity = status === "pending" ? null : 3 + ((index * 5 + author.id.length) % 7);
    const quality = status === "pending" ? null : status === "revision" ? 3 + (index % 3) : 6 + ((index * 3 + author.unitId.length) % 5);
    const unitHead = users.find(user => user.unitId === author.unitId && user.role === "unit_head");
    const reviewer = author.role === "unit_head" || author.unitId === "province" ? users.find(user => user.role === "province_head") : unitHead;
    const sequence = String(index + 1).padStart(4, "0");

    return {
      id: `DM${sequence}`,
      authorId: author.id,
      unitId: author.unitId,
      date,
      category: template[0],
      title: `${template[1]} - lượt ${sequence}`,
      result: template[2],
      workRole: roles[(index + author.id.length) % roles.length],
      duration: durations[(index * 3) % durations.length],
      evidence: `MC-${date.replaceAll("-", "")}-${sequence}`,
      status,
      complexity,
      quality,
      reviewerId: status === "pending" ? null : reviewer?.id || "u01",
      comment: status === "revision" ? "Cần bổ sung căn cứ, tài liệu minh chứng và làm rõ kết quả xử lý." : "",
      createdAt: `${date}T16:30:00`,
      reviewedAt: status === "pending" ? null : `${date}T18:00:00`
    };
  });
}

sampleLogs.push(...generateDemoLogs());

function recentPeriods() {
  const now = new Date();
  const periods = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return periods;
}

function periodLabel(period) {
  const [year, month] = period.split("-");
  return `Tháng ${month}/${year}`;
}

// "Hom nay" trong demo la ngay co dinh de khop voi du lieu mau, khong dung
// ngay thuc cua may nguoi xem.
const DEMO_TODAY = "2026-08-22";

// Thang xep loai chinh thuc, ap dung cho toan bo nguoi dung: 90-100=A,
// 80-89=B, 70-79=C, tu 69 tro xuong=D.
function classificationFromScore(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return null;
  if (value >= 90) return "A";
  if (value >= 80) return "B";
  if (value >= 70) return "C";
  return "D";
}

// sampleMonthly chi co san du lieu day du cho ky "2026-06" (da chot); tao
// them du lieu mo phong cho cac ky gan day khac de thu nghiem tinh nang
// "xem thang truoc". Ky gan nhat (thang hien tai) coi nhu chua cham diem.
function generateMonthlyHistory() {
  const periods = recentPeriods();
  const currentPeriod = periods[0];
  const rows = [];
  periods.forEach(period => {
    if (period === "2026-06") return;
    sampleMonthly.forEach((seedRow, index) => {
      if (period === currentPeriod) {
        rows.push({ userId: seedRow.userId, period, selfScore: null, officialScore: null, classification: null, status: "pending", note: "", approvedAt: null });
        return;
      }
      if (seedRow.officialScore == null) {
        rows.push({ userId: seedRow.userId, period, selfScore: null, officialScore: null, classification: null, status: "pending", note: "", approvedAt: null });
        return;
      }
      const jitter = ((index * 7 + period.charCodeAt(period.length - 1)) % 5) - 2;
      const official = Math.max(80, Math.min(95, seedRow.officialScore + jitter));
      const classification = official >= 90 ? "A" : "B";
      rows.push({ userId: seedRow.userId, period, selfScore: official, officialScore: official, classification, status: "approved", note: "", approvedAt: `${period}-27T09:00:00` });
    });
  });
  return rows;
}

// Nho bo loc lan truoc (ky bao cao, don vi dang xem...) giua cac lan dung,
// khong phai chon lai tu dau moi lan vao. Chi la tien loi giao dien, KHONG
// anh huong pham vi du lieu duoc phep xem.
const FILTER_PREFS_KEY = "vks-filter-prefs-demo-v1";
function loadFilterPrefs() {
  try { return JSON.parse(localStorage.getItem(FILTER_PREFS_KEY)) || {}; } catch { return {}; }
}
function saveFilterPrefs(patch) {
  const prefs = loadFilterPrefs();
  Object.assign(prefs, patch);
  localStorage.setItem(FILTER_PREFS_KEY, JSON.stringify(prefs));
}
const filterPrefs = loadFilterPrefs();

const query = new URLSearchParams(window.location.search);
const requestedUser = query.get("role");
const requestedView = query.get("view");
const state = {
  currentUserId: users.some(user => user.id === requestedUser) ? requestedUser : "u01",
  currentView: ["dashboard", "journal", "notes", "reviews", "unitJournal", "monthly", "organization", "administration", "settings"].includes(requestedView) ? requestedView : "dashboard",
  selectedReviewId: null,
  reviewQueueCollapsed: false,
  editingJournalId: null,
  selectedMonthlyUserId: null,
  dashboardUnit: filterPrefs.dashboardUnit || "all",
  dashboardPeriod: filterPrefs.dashboardPeriod || "2026-08",
  dashboardComparisonMode: filterPrefs.dashboardComparisonMode || "unit",
  dashboardPersonUnit: filterPrefs.dashboardPersonUnit || "all",
  dashboardSummarySort: { key: "count", direction: "desc" },
  monthlyUnit: filterPrefs.monthlyUnit || "all",
  monthlyPeriod: filterPrefs.monthlyPeriod || "2026-06",
  monthlySearch: "",
  journalStatusFilter: "all",
  journalSearch: "",
  ujMode: "person",
  ujUnitFilter: "all",
  ujSearch: "",
  ujSelectedPersonId: null,
  ujPeriod: recentPeriods()[0],
  orgExpandedUnitId: null,
  notesMonth: DEMO_TODAY.slice(0, 7),
  notesSelectedDate: DEMO_TODAY
};

const DEMO_ACCOUNT_IDS = ["u01", "u02", "u03", "u04", "u05", "u08", "u20"];
const demoCredentials = {
  u01: { password: "VT-Tinh@2026", label: "Viện trưởng tỉnh" },
  u02: { password: "PVT-Tinh@2026", label: "Phó VT tỉnh" },
  u03: { password: "TP-P1@2026", label: "Trưởng phòng" },
  u04: { password: "PP-P1@2026", label: "Phó phòng" },
  u05: { password: "KSV-P1@2026", label: "Kiểm sát viên" },
  u08: { password: "VT-KV1@2026", label: "Viện trưởng KV" },
  u20: { password: "Admin@2026", label: "Quản trị" }
};

const samplePersonalNotes = [
  { id: "PN001", userId: "u01", noteDate: "2026-08-25", title: "Duyệt báo cáo quý III", content: "Xem và ký duyệt báo cáo tổng hợp quý III trước khi gửi VKSND tối cao.", isDone: false },
  { id: "PN002", userId: "u01", noteDate: "2026-08-18", title: "Họp giao ban khu vực", content: "Chuẩn bị nội dung họp giao ban với các VKSND khu vực.", isDone: false },
  { id: "PN003", userId: "u03", noteDate: "2026-08-24", title: "Nộp kế hoạch kiểm sát tháng 9", content: "Hoàn thiện và nộp kế hoạch công tác kiểm sát điều tra tháng 9 cho lãnh đạo Viện.", isDone: false },
  { id: "PN004", userId: "u03", noteDate: "2026-08-20", title: "Rà soát hồ sơ án tồn đọng", content: "Đã rà soát xong 5 hồ sơ án tồn đọng của phòng.", isDone: true }
].map(note => ({ ...note, createdAt: `${note.noteDate}T08:00:00` }));

let logs = loadLogs();
let monthlyReviews = loadJson(MONTHLY_STORAGE_KEY, sampleMonthly.concat(generateMonthlyHistory()));
let registeredAccounts = loadJson(REGISTERED_ACCOUNT_STORAGE_KEY, []);
let notificationReadState = loadJson(NOTIFICATION_READ_STORAGE_KEY, {});
let personalNotes = loadJson(PERSONAL_NOTES_STORAGE_KEY, samplePersonalNotes);
let stickyNotes = loadJson(STICKY_NOTES_STORAGE_KEY, []);
let systemNotifications = loadJson(SYSTEM_NOTIFICATIONS_STORAGE_KEY, []);
let delegations = loadJson(DELEGATIONS_STORAGE_KEY, sampleDelegations);
let taskAssignments = loadJson(TASK_ASSIGNMENTS_STORAGE_KEY, sampleTaskAssignments);
registeredAccounts.forEach(account => {
  if (!users.some(user => user.id === account.id)) users.push(account);
});
let auditEvents = loadJson(AUDIT_STORAGE_KEY, [
  { at: "2026-08-20T08:15:00", actor: "Quản trị hệ thống", action: "Cập nhật danh mục nhân sự tháng 8", detail: "Đồng bộ đơn vị, chức vụ và trạng thái hiệu lực" },
  { at: "2026-08-18T14:30:00", actor: "Phạm Hải Anh", action: "Phân công lãnh đạo phụ trách", detail: "Phạm vi Phòng 1, Phòng 7 và Khu vực 1" }
]);
const defaultPersonnelState = users.map(user => ({ id: user.id, unitId: user.unitId, role: user.role, delegated: Boolean(user.delegated), active: user.active !== false, assignedUnits: user.assignedUnits }));
loadPersonnelState();

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function loadPersonnelState() {
  const saved = loadJson(PERSONNEL_STORAGE_KEY, defaultPersonnelState);
  saved.forEach(item => {
    const user = users.find(candidate => candidate.id === item.id);
    if (user) Object.assign(user, { unitId: item.unitId, role: item.role, delegated: Boolean(item.delegated), active: item.active !== false, assignedUnits: item.assignedUnits });
  });
}

function savePersonnelState() {
  localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(users.map(user => ({ id: user.id, unitId: user.unitId, role: user.role, delegated: Boolean(user.delegated), active: user.active !== false, assignedUnits: user.assignedUnits }))));
}

function loadLogs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(sampleLogs);
  } catch {
    return structuredClone(sampleLogs);
  }
}

function saveLogs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function savePersonalNotes() {
  localStorage.setItem(PERSONAL_NOTES_STORAGE_KEY, JSON.stringify(personalNotes));
}

function saveStickyNotes() {
  localStorage.setItem(STICKY_NOTES_STORAGE_KEY, JSON.stringify(stickyNotes));
}

function saveSystemNotifications() {
  localStorage.setItem(SYSTEM_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(systemNotifications));
}

function saveDelegations() {
  localStorage.setItem(DELEGATIONS_STORAGE_KEY, JSON.stringify(delegations));
}

function saveTaskAssignments() {
  localStorage.setItem(TASK_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(taskAssignments));
}

function isDelegationActive(delegation) {
  return delegation.status === "active" && delegation.startsAt <= DEMO_TODAY && DEMO_TODAY <= delegation.endsAt;
}

function hasActiveDelegation(delegateId) {
  return delegations.some(d => d.delegateId === delegateId && isDelegationActive(d));
}

// Cap tren cua nguoi VUA THUC HIEN luot cham (khac voi cap tren cua tac
// gia - 2 khai niem thuong trung nhau nhung khong luon luon, vi du khi co
// uy quyen).
function findSuperiorFor(reviewer) {
  if (reviewer.role === "unit_head") {
    const deputy = users.find(u => u.role === "province_deputy" && (u.assignedUnits || []).includes(reviewer.unitId));
    return deputy || users.find(u => u.role === "province_head");
  }
  if (reviewer.role === "unit_deputy") {
    return users.find(u => u.role === "unit_head" && u.unitId === reviewer.unitId);
  }
  if (reviewer.role === "province_deputy") {
    return users.find(u => u.role === "province_head");
  }
  return null;
}

function currentUser() { return users.find(user => user.id === state.currentUserId); }
function unitById(id) { return units.find(unit => unit.id === id); }
function userById(id) { return users.find(user => user.id === id); }
function isLeader(user = currentUser()) { return ["province_head", "province_deputy", "unit_head", "unit_deputy"].includes(user.role); }
function isAdministrator(user = currentUser()) { return user.role === "administrator"; }
function formatDate(date) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`)); }
function shortDate(date) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T00:00:00`)); }
// Dinh dang co dinh "dd/mm/yyyy, hh:mm", tu ghep chuoi (khong dung
// toLocaleString mac dinh) de khong bao gio bi dao nguoc theo locale trinh
// duyet cua nguoi xem.
function shortDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p2 = n => String(n).padStart(2, "0");
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}, ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
// Thoi gian "nop" thuc te: neu da tung tra lai (revisionCount>0) tinh theo
// lan sua/trinh lai gan nhat, con lai la lan tao dau tien.
function submittedAtOf(log) { return (log.revisionCount ? log.resubmittedAt : log.createdAt) || log.createdAt || log.resubmittedAt; }
function scoreClass(score) { return score >= 8 ? "score-high" : score >= 6 ? "score-mid" : "score-low"; }
function statusLabel(status) { return ({ pending: "Chờ đánh giá", approved: "Đã xác nhận", revision: "Cần bổ sung" })[status] || status; }
function statusClass(status) { return ({ pending: "status-pending", approved: "status-approved", revision: "status-revision" })[status] || ""; }
function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function weightedQuality(items) {
  const reviewed = items.filter(item => Number.isFinite(item.complexity) && Number.isFinite(item.quality));
  const weight = reviewed.reduce((sum, item) => sum + item.complexity, 0);
  return weight ? reviewed.reduce((sum, item) => sum + item.complexity * item.quality, 0) / weight : 0;
}

function visibleUnitIds(user = currentUser()) {
  if (user.role === "province_head" || user.role === "administrator") return units.map(unit => unit.id);
  if (user.role === "province_deputy") return ["province", ...(user.assignedUnits || [])];
  return [user.unitId];
}

// visibleUnitIds() chi loc theo DON VI, khong phan biet CAP BAC trong
// cung 1 don vi - vi du Pho phong (unit_deputy) va Truong phong
// (unit_head) o cung 1 unitId, nen truoc day Pho phong van "thay" duoc
// Truong phong trong danh sach nguoi/nhat ky cua don vi (loi that: cap
// duoi xem duoc nhat ky cap tren). Dung thang bac de loai nguoi CAO HON
// viewer ra khoi pham vi xem - khong anh huong cac truong hop dung san
// (vi du Pho VT tinh van thay duoc Truong phong don vi minh phu trach,
// vi 2 <= 3).
const ROLE_RANK = { province_head: 4, province_deputy: 3, unit_head: 2, unit_deputy: 1, staff: 0, support_staff: 0 };
function isVisibleInUnitScope(person, viewer = currentUser()) {
  if (person.role === "administrator") return false;
  return (ROLE_RANK[person.role] ?? 0) <= (ROLE_RANK[viewer.role] ?? 0);
}

function dashboardLogs(includeAllPeriods = false) {
  const user = currentUser();
  let scoped = logs.filter(log => visibleUnitIds(user).includes(log.unitId));
  if (user.role === "staff" || user.role === "support_staff") scoped = scoped.filter(log => log.authorId === user.id);
  if (state.dashboardUnit !== "all") scoped = scoped.filter(log => log.unitId === state.dashboardUnit);
  if (!includeAllPeriods && state.dashboardPeriod === "2026-08") scoped = scoped.filter(log => log.date.startsWith("2026-08"));
  if (!includeAllPeriods && state.dashboardPeriod === "2026-Q3") scoped = scoped.filter(log => log.date >= "2026-07-01" && log.date <= "2026-09-30");
  return scoped;
}

// "Co nam trong chuoi quan ly nguoi nay khong" - dung cho Giao viec va lam
// nen cho canReviewLog/canApproveMonthly. Khac canReviewLog: KHONG xet
// nhat ky cu the nao (khong co khai niem "nop cho ai"), chi xet vai
// tro + don vi - vi du dung de kiem tra "Pho phong nay co giao viec duoc
// cho cán bo kia khong", ap dung cho MOI Pho phong trong don vi (khong
// con gioi han theo danh sach uy quyen cu).
function canManagePerson(person, viewer = currentUser()) {
  if (!person || person.id === viewer.id) return false;
  if (viewer.role === "province_head") {
    return person.role === "province_deputy" || person.role === "unit_head" || person.unitId === "province";
  }
  if (viewer.role === "province_deputy") {
    return person.role === "unit_head" && (viewer.assignedUnits || []).includes(person.unitId);
  }
  if (viewer.role === "unit_head") return person.unitId === viewer.unitId && person.role !== "unit_head";
  if (viewer.role === "unit_deputy") return person.unitId === viewer.unitId && (person.role === "staff" || person.role === "support_staff");
  return false;
}

// Co duyet duoc DUNG NHAT KY NAY khong - khac canManagePerson o cho: Pho
// phong (unit_deputy) chi duyet duoc nhat ky da duoc "nop cho" dung minh
// (log.submittedToId), TRU KHI dang duoc uy quyen thay mat 100% toan don
// vi (hasActiveDelegation) thi duyet duoc ca don vi nhu Truong phong.
function canReviewLog(log, reviewer = currentUser()) {
  const author = userById(log.authorId);
  if (!author || reviewer.id === author.id) return false;
  if (reviewer.role === "unit_deputy") {
    if (author.unitId === reviewer.unitId && hasActiveDelegation(reviewer.id)) return true;
    return log.submittedToId === reviewer.id;
  }
  return canManagePerson(author, reviewer);
}

function reviewQueue() {
  return logs.filter(log => log.status === "pending" && canReviewLog(log)).sort((a, b) => {
    const aTime = a.resubmittedAt || a.createdAt || `${a.date}T00:00:00`;
    const bTime = b.resubmittedAt || b.createdAt || `${b.date}T00:00:00`;
    return bTime.localeCompare(aTime);
  });
}

function initialize() {
  initializeLoginWaves();
  const loginSelect = document.getElementById("loginUserSelect");
  loginSelect.innerHTML = DEMO_ACCOUNT_IDS.map(id => {
    const user = userById(id);
    return `<option value="${id}">${user.name} — ${demoCredentials[id].label}</option>`;
  }).join("");
  document.getElementById("demoAccountCards").innerHTML = DEMO_ACCOUNT_IDS.map(id => {
    const user = userById(id);
    return `<button class="quick-account" type="button" data-login-account="${id}" title="${user.name} — ${user.title}"><span class="quick-account-avatar">${user.initials}</span><span>${demoCredentials[id].label}</span></button>`;
  }).join("");
  loginSelect.addEventListener("change", () => selectDemoAccount(loginSelect.value));
  document.querySelectorAll("[data-login-account]").forEach(button => button.addEventListener("click", () => selectDemoAccount(button.dataset.loginAccount)));
  document.getElementById("demoLoginForm").addEventListener("submit", submitDemoLogin);
  document.getElementById("toggleLoginPassword").addEventListener("click", toggleLoginPassword);
  selectDemoAccount(state.currentUserId);

  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;
      updateNav();
      render();
      document.getElementById("sidebar").classList.remove("is-open");
    });
  });
  document.getElementById("mobileMenu").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("is-open"));
  document.getElementById("notificationToggle").addEventListener("click", () => {
    const panel = document.getElementById("notificationPanel");
    panel.hidden = !panel.hidden;
    document.getElementById("notificationToggle").setAttribute("aria-expanded", String(!panel.hidden));
  });
  document.getElementById("markAllNotificationsRead").addEventListener("click", markAllNotificationsRead);
  document.addEventListener("click", event => {
    const center = document.getElementById("notificationCenter");
    if (!center.contains(event.target)) closeNotificationPanel();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNotificationPanel();
  });
  document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", closeJournalModal));
  document.getElementById("journalModal").addEventListener("click", event => {
    if (event.target.id === "journalModal") closeJournalModal();
  });
  document.getElementById("journalForm").addEventListener("submit", submitJournal);
  document.getElementById("journalForm").elements.workDate.addEventListener("change", checkJournalDateWarning);
  document.getElementById("journalTaskSelect").addEventListener("change", applyTaskLinkToSubmitTo);
  document.getElementById("toggleCopyJournal").addEventListener("click", () => {
    const panel = document.getElementById("copyJournalPanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) document.getElementById("copyJournalSearch").focus();
  });
  document.getElementById("copyJournalSearch").addEventListener("input", event => renderCopyJournalList(event.target.value));
  document.querySelectorAll("[data-close-export]").forEach(button => button.addEventListener("click", closeExportModal));
  document.getElementById("exportModal").addEventListener("click", event => {
    if (event.target.id === "exportModal") closeExportModal();
  });
  document.getElementById("exportPeriodSelect").addEventListener("change", event => renderExportSummary(event.target.value));
  document.getElementById("exportExcelButton").addEventListener("click", () => exportMonthlyExcel(document.getElementById("exportPeriodSelect").value));
  document.getElementById("exportPdfButton").addEventListener("click", () => exportMonthlyPdf(document.getElementById("exportPeriodSelect").value));
  document.querySelectorAll("[data-close-note]").forEach(button => button.addEventListener("click", closeNoteModal));
  document.getElementById("noteModal").addEventListener("click", event => {
    if (event.target.id === "noteModal") closeNoteModal();
  });
  document.getElementById("noteForm").addEventListener("submit", submitNote);
  document.querySelectorAll("[data-close-override]").forEach(button => button.addEventListener("click", closeOverrideModal));
  document.getElementById("overrideScoreModal").addEventListener("click", event => {
    if (event.target.id === "overrideScoreModal") closeOverrideModal();
  });
  document.getElementById("overrideScoreForm").addEventListener("submit", submitOverrideScore);
  document.querySelectorAll("[data-close-delete-log]").forEach(button => button.addEventListener("click", closeDeleteLogModal));
  document.getElementById("deleteLogModal").addEventListener("click", event => {
    if (event.target.id === "deleteLogModal") closeDeleteLogModal();
  });
  document.getElementById("deleteLogForm").addEventListener("submit", submitDeleteLogForm);
  updateNav();
  render();
  document.getElementById("loginUserSelect").focus();
}

function initializeLoginWaves() {
  document.querySelectorAll(".login-wave").forEach(wave => {
    const varyWave = firstRun => {
      wave.style.setProperty("--wave-end", (1.52 + Math.random() * .3).toFixed(2));
      wave.style.setProperty("--wave-peak", (.52 + Math.random() * .18).toFixed(2));
      if (firstRun) {
        wave.style.animationDuration = `${(4.15 + Math.random() * 1.35).toFixed(2)}s`;
        wave.style.animationDelay = `${(-Math.random() * 4.8).toFixed(2)}s`;
      }
    };
    varyWave(true);
    wave.addEventListener("animationiteration", () => varyWave(false));
  });
}

function selectDemoAccount(userId) {
  const selectedId = demoCredentials[userId] ? userId : DEMO_ACCOUNT_IDS[0];
  document.getElementById("loginUserSelect").value = selectedId;
  document.getElementById("loginPassword").value = demoCredentials[selectedId].password;
  document.querySelectorAll("[data-login-account]").forEach(button => button.classList.toggle("is-selected", button.dataset.loginAccount === selectedId));
}

function submitDemoLogin(event) {
  event.preventDefault();
  const userId = document.getElementById("loginUserSelect").value;
  const password = document.getElementById("loginPassword").value;
  if (!demoCredentials[userId] || password !== demoCredentials[userId].password) {
    showToast("Mật khẩu demo chưa đúng. Hãy chọn lại tài khoản để điền mật khẩu đã lưu.");
    document.getElementById("loginPassword").focus();
    return;
  }
  document.getElementById("loginScreen").hidden = true;
  document.getElementById("appShell").hidden = false;
  document.body.classList.remove("login-active");
  activateDemoUser(userId);
  showToast(`Đã đăng nhập với vai trò ${demoCredentials[userId].label}.`);
}

function activateDemoUser(userId) {
  if (!DEMO_ACCOUNT_IDS.includes(userId)) return;
  closeNotificationPanel();
  closeJournalModal();
  state.currentUserId = userId;
  state.currentView = "dashboard";
  state.dashboardUnit = "all";
  state.selectedReviewId = null;
  state.selectedMonthlyUserId = null;
  updateNav();
  render();
}

function toggleLoginPassword() {
  togglePasswordField("loginPassword", "toggleLoginPassword");
}

// Ham dung chung cho moi o mat khau co nut an/hien (dang ky, doi mat khau...)
// - tach rieng khoi toggleLoginPassword() de tai su dung, khong sua lai
// ham cu de tranh dong cham noi da dang hoat dong on dinh.
function togglePasswordField(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  if (!input || !button) return;
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  button.textContent = showing ? "Hiện" : "Ẩn";
  button.setAttribute("aria-label", showing ? "Hiện mật khẩu" : "Ẩn mật khẩu");
}

function showLoginScreen() {
  closeNotificationPanel();
  closeJournalModal();
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("appShell").hidden = true;
  document.getElementById("loginScreen").hidden = false;
  document.body.classList.add("login-active");
  document.getElementById("loginPassword").type = "password";
  document.getElementById("toggleLoginPassword").textContent = "Hiện";
  document.getElementById("toggleLoginPassword").setAttribute("aria-label", "Hiện mật khẩu");
  selectDemoAccount(state.currentUserId);
  document.getElementById("loginUserSelect").focus();
}

// document.querySelector(...).hidden khong thuc su an duoc vi ".nav-item{display:flex}"
// (author stylesheet) de len tren mac dinh "[hidden]{display:none}" (UA stylesheet)
// cua trinh duyet - dung style.display truc tiep de dam bao thang chac chan.
function setVisible(el, visible) {
  if (el) el.style.display = visible ? "" : "none";
}

function updateNav() {
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("is-active", button.dataset.view === state.currentView));
  const leader = isLeader();
  setVisible(document.querySelector(".review-nav"), leader);
  if (!leader && state.currentView === "reviews") state.currentView = "dashboard";
  setVisible(document.querySelector(".unit-journal-nav"), leader);
  if (!leader && state.currentView === "unitJournal") state.currentView = "dashboard";
  const admin = isAdministrator() || currentUser().role === "province_head";
  // Truong phong/Chanh van phong (unit_head) cung can vao duoc de tu uy
  // quyen cho pho cua minh, nhung chi thay muc "Uy quyen co thoi han"
  // (xem renderAdministration) - khong thay cac muc quan tri toan phan.
  const adminNavVisible = admin || currentUser().role === "unit_head";
  setVisible(document.querySelector(".admin-nav"), adminNavVisible);
  if (!adminNavVisible && state.currentView === "administration") state.currentView = "dashboard";
  // Co cau to chuc gio bao gom gan vai tro/don vi + khoa/mo tai khoan, chi
  // danh cho Vien truong tinh va QTV (giong pham vi ".admin-nav").
  setVisible(document.querySelector(".org-nav"), admin);
  if (!admin && state.currentView === "organization") state.currentView = "dashboard";
  // QTV khong ghi cong viec, khong can Nhat ky/Cham diem thang.
  const adminOnly = isAdministrator();
  setVisible(document.querySelector(".journal-nav"), !adminOnly);
  setVisible(document.querySelector(".monthly-nav"), !adminOnly);
  setVisible(document.querySelector(".tasks-nav"), !adminOnly);
  if (adminOnly && (state.currentView === "journal" || state.currentView === "monthly" || state.currentView === "tasks")) state.currentView = "dashboard";
}

function updateChrome(title, eyebrow) {
  const user = currentUser();
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageEyebrow").textContent = eyebrow;
  document.getElementById("sidebarUserName").textContent = user.name;
  document.getElementById("sidebarUserTitle").textContent = user.title || "";
  document.getElementById("pendingNavCount").textContent = reviewQueue().length;
  const taskBadge = document.getElementById("taskOverdueNavCount");
  if (taskBadge) {
    const overdueCount = taskAssignments.filter(task => (task.assignerId === user.id || task.assigneeId === user.id) && isTaskOverdue(task)).length;
    taskBadge.textContent = overdueCount;
    taskBadge.hidden = overdueCount === 0;
  }
  renderNotifications();
}

function notificationsForCurrentUser() {
  const user = currentUser();
  const notifications = [];
  logs.filter(log => log.authorId === user.id && log.status === "revision").forEach(log => {
    const reviewer = userById(log.reviewerId);
    notifications.push({
      id: `revision-${log.id}-${log.reviewedAt || "pending"}`,
      tone: "revision",
      title: "Nhật ký cần bổ sung",
      message: `${reviewer?.name || "Lãnh đạo"}: ${log.comment || "Yêu cầu chỉnh sửa, làm rõ kết quả."}`,
      time: shortDate(log.date),
      view: "journal",
      logId: log.id
    });
  });
  // Canh bao chenh lech dat NGAY SAU nhom "can bo sung" (ca 2 deu la tin
  // rieng, quan trong) va TRUOC hang doi cho cham diem (co the rat dai voi
  // lanh dao pham vi rong) - de khong bi ".slice(0, 20)" ben duoi cat mat.
  const SYSTEM_NOTIFICATION_TONES = { score_overridden: "revision", delegation_granted: "account", delegation_revoked: "account", work_log_deleted: "revision" };
  systemNotifications.filter(n => n.userId === user.id).forEach(n => {
    notifications.push({
      id: n.id,
      tone: SYSTEM_NOTIFICATION_TONES[n.type] || "escalation",
      title: n.title,
      message: n.message,
      time: shortDate(n.createdAt.slice(0, 10)),
      view: n.view || "unitJournal"
    });
  });
  // Nhac qua han giao viec: hien cho CA NGUOI GIAO va NGUOI NHAN, dat ngay
  // sau canh bao chenh lech (cung la tin "su kien" rieng) va truoc hang
  // doi cho cham diem, vi ly do tranh bi ".slice(0, 20)" cat mat nhu tren.
  taskAssignments.filter(task => task.assigneeId === user.id && isTaskOverdue(task)).forEach(task => {
    notifications.push({
      id: `task-overdue-assignee-${task.id}`,
      tone: "escalation",
      title: "Việc được giao đã quá hạn",
      message: `${task.title} — hạn ${formatDateTime(taskDueDate(task))}`,
      time: formatDateTime(taskDueDate(task)),
      view: "tasks"
    });
  });
  taskAssignments.filter(task => task.assignerId === user.id && isTaskOverdue(task)).forEach(task => {
    const assignee = userById(task.assigneeId);
    notifications.push({
      id: `task-overdue-assigner-${task.id}`,
      tone: "escalation",
      title: "Việc đã giao quá hạn chưa hoàn thành",
      message: `${assignee ? assignee.name : "Cán bộ"}: ${task.title}`,
      time: formatDateTime(taskDueDate(task)),
      view: "tasks"
    });
  });
  if (isLeader(user)) reviewQueue().forEach(log => {
    const author = userById(log.authorId);
    notifications.push({
      id: `review-${log.id}-${log.resubmittedAt || log.createdAt || log.date}`,
      tone: log.revisionCount ? "resubmitted" : "pending",
      title: log.revisionCount ? `Nhật ký trình lại lần ${log.revisionCount}` : "Nhật ký chờ chấm điểm",
      message: `${author?.name || "Cán bộ"}: ${log.title}`,
      time: shortDate(log.date),
      view: "reviews",
      logId: log.id
    });
  });
  if (user.role === "province_head" || isAdministrator(user)) registeredAccounts.filter(account => account.accountStatus === "pending").forEach(account => {
    notifications.push({
      id: `account-${account.id}-${account.registeredAt}`,
      tone: "account",
      title: "Tài khoản chờ xác nhận",
      message: `${account.name} · ${unitById(account.unitId)?.short || "Chưa xác định đơn vị"}`,
      time: "Mới đăng ký",
      view: "administration"
    });
  });
  return notifications.slice(0, 20);
}

function readNotificationIds() {
  return notificationReadState[currentUser().id] || [];
}

function saveNotificationReadState() {
  localStorage.setItem(NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(notificationReadState));
}

function renderNotifications() {
  const notifications = notificationsForCurrentUser();
  const readIds = new Set(readNotificationIds());
  const unreadCount = notifications.filter(item => !readIds.has(item.id)).length;
  const badge = document.getElementById("notificationBadge");
  badge.hidden = unreadCount === 0;
  badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  document.getElementById("notificationToggle").setAttribute("aria-label", unreadCount ? `Mở thông báo, ${unreadCount} tin chưa đọc` : "Mở thông báo, không có tin chưa đọc");
  document.getElementById("notificationSummary").textContent = unreadCount ? `${unreadCount} tin chưa đọc` : "Không có tin mới";
  document.getElementById("markAllNotificationsRead").hidden = unreadCount === 0;
  document.getElementById("notificationList").innerHTML = notifications.length ? notifications.map(item => `
    <button type="button" class="notification-item ${readIds.has(item.id) ? "is-read" : "is-unread"}" data-notification-id="${item.id}" data-notification-view="${item.view}" ${item.logId ? `data-notification-log="${item.logId}"` : ""}>
      <span class="notification-dot ${item.tone}" aria-hidden="true"></span>
      <span class="notification-copy"><strong>${item.title}</strong><span>${item.message}</span><small>${item.time}</small></span>
    </button>`).join("") : `<div class="notification-empty"><strong>Không có thông báo</strong><span>Các nội dung mới cần xử lý sẽ xuất hiện tại đây.</span></div>`;
  document.querySelectorAll("[data-notification-id]").forEach(button => button.addEventListener("click", () => openNotification(button)));
}

function markNotificationRead(id) {
  const userId = currentUser().id;
  const ids = new Set(notificationReadState[userId] || []);
  ids.add(id);
  notificationReadState[userId] = [...ids].slice(-100);
  saveNotificationReadState();
}

function markAllNotificationsRead() {
  const userId = currentUser().id;
  notificationReadState[userId] = notificationsForCurrentUser().map(item => item.id).slice(-100);
  saveNotificationReadState();
  renderNotifications();
}

function closeNotificationPanel() {
  const panel = document.getElementById("notificationPanel");
  panel.hidden = true;
  document.getElementById("notificationToggle").setAttribute("aria-expanded", "false");
}

function openNotification(button) {
  markNotificationRead(button.dataset.notificationId);
  closeNotificationPanel();
  const view = button.dataset.notificationView;
  const logId = button.dataset.notificationLog || null;
  state.currentView = view;
  if (view === "reviews") state.selectedReviewId = logId;
  updateNav();
  render();
  if (view === "journal" && logId) openJournalModal(logId);
}

function render() {
  const renderers = { dashboard: renderDashboard, journal: renderJournal, notes: renderNotes, tasks: renderTasks, reviews: renderReviews, unitJournal: renderUnitJournal, monthly: renderMonthly, organization: renderOrganization, administration: renderAdministration, settings: renderSettings };
  (renderers[state.currentView] || renderDashboard)();
}

function renderSettings() {
  const user = currentUser();
  updateChrome("Cài đặt tài khoản", "TÀI KHOẢN");
  document.getElementById("appView").innerHTML = `
    <div class="panel" style="padding:18px;margin-bottom:14px;max-width:520px">
      <h3 style="margin:0 0 12px">Họ và tên</h3>
      <form id="settingsNameForm" class="form-grid">
        <label class="field field-wide"><span>Họ và tên hiển thị</span><input name="fullName" id="settingsFullName" value="${user.name}" required></label>
        <div class="form-actions field-wide"><button type="submit" class="button button-primary">Lưu tên</button></div>
      </form>
    </div>
    <div class="panel" style="padding:18px;margin-bottom:14px;max-width:520px">
      <h3 style="margin:0 0 12px">Đổi mật khẩu</h3>
      <form id="settingsPasswordForm" class="form-grid">
        <label class="field"><span>Mật khẩu mới</span><input name="newPassword" type="password" minlength="8" required autocomplete="new-password"></label>
        <label class="field"><span>Nhập lại mật khẩu mới</span><input name="confirmNewPassword" type="password" minlength="8" required autocomplete="new-password"></label>
        <div class="form-actions field-wide"><button type="submit" class="button button-primary">Đổi mật khẩu</button></div>
      </form>
    </div>
    <div class="panel" style="padding:18px;max-width:520px">
      <div class="form-actions field-wide"><button type="button" class="button button-danger" id="settingsLogout">Đăng xuất</button></div>
    </div>`;
  document.getElementById("settingsNameForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = document.getElementById("settingsFullName").value.trim();
    if (!name) return showToast("Họ tên không được để trống.");
    user.name = name;
    updateChrome("Cài đặt tài khoản", "TÀI KHOẢN");
    showToast("Đã lưu tên hiển thị (chỉ áp dụng trong phiên demo này).");
  });
  document.getElementById("settingsPasswordForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.target;
    if (form.newPassword.value !== form.confirmNewPassword.value) return showToast("Mật khẩu nhập lại không khớp.");
    form.reset();
    showToast("Đã đổi mật khẩu (mô phỏng, không lưu thật).");
  });
  document.getElementById("settingsLogout").addEventListener("click", showLoginScreen);
}

function renderDashboard() {
  const user = currentUser();
  const provinceScope = ["province_head", "province_deputy", "administrator"].includes(user.role);
  const scope = dashboardLogs();
  const reviewed = scope.filter(log => log.status === "approved" || log.status === "revision");
  const approved = scope.filter(log => log.status === "approved");
  const trendScope = dashboardLogs(true).filter(log => log.status === "approved");
  const complexityTotal = approved.reduce((sum, log) => sum + (log.complexity || 0), 0);
  const complexityAvg = average(approved.map(log => log.complexity).filter(Number.isFinite));
  const quality = weightedQuality(approved);
  const reviewRate = scope.length ? reviewed.length / scope.length * 100 : 0;
  const title = user.role === "province_head" ? "Tổng quan toàn tỉnh" : user.role === "province_deputy" ? "Các đơn vị được phân công" : user.role === "administrator" ? "Tổng quan dữ liệu demo" : (user.role === "staff" || user.role === "support_staff") ? "Kết quả công tác của tôi" : `Tổng quan ${unitById(user.unitId).short}`;
  updateChrome(title, "BÁO CÁO ĐIỀU HÀNH");

  const availableUnits = units.filter(unit => visibleUnitIds(user).includes(unit.id) && unit.id !== "province");
  const unitFilter = provinceScope ? `
    <label class="filter-field"><span>Đơn vị</span><select id="dashboardUnitFilter">
      <option value="all">Tất cả đơn vị</option>
      ${availableUnits.map(unit => `<option value="${unit.id}" ${state.dashboardUnit === unit.id ? "selected" : ""}>${unit.short}</option>`).join("")}
    </select></label>` : "";

  const grouping = provinceScope ? aggregateByUnit(approved) : aggregateByUser(approved, user.unitId);
  const comparisonMode = provinceScope ? state.dashboardComparisonMode : "person";
  const personUnitId = state.dashboardPersonUnit === "all" ? null : state.dashboardPersonUnit;
  const personalGrouping = aggregateVisibleUsers(approved, personUnitId);
  const comparisonGrouping = comparisonMode === "person" ? personalGrouping : grouping;
  const tableTitle = provinceScope ? "Kết quả theo đơn vị" : "Kết quả theo cán bộ";

  document.getElementById("appView").innerHTML = `
    <div class="demo-notice dashboard-notice"><strong>Bản trình diễn</strong><span>Nhân sự và kết quả tháng 6/2026 được trích từ tài liệu đã cung cấp; hơn 1.200 nhật ký chi tiết là dữ liệu mô phỏng để thử nghiệm báo cáo quy mô lớn.</span></div>
    <div class="toolbar dashboard-toolbar">
      <label class="filter-field"><span>Kỳ báo cáo</span><select id="dashboardPeriodFilter"><option value="2026-08" ${state.dashboardPeriod === "2026-08" ? "selected" : ""}>Tháng 08/2026</option><option value="2026-Q3" ${state.dashboardPeriod === "2026-Q3" ? "selected" : ""}>Quý III/2026</option><option value="all" ${state.dashboardPeriod === "all" ? "selected" : ""}>6 tháng gần nhất</option></select></label>
      ${unitFilter}
      <div class="spacer"></div>
      <button class="button button-secondary" id="resetDemo">Khôi phục dữ liệu mẫu</button>
    </div>
    <div class="dashboard-summary-bento">
      <section class="dashboard-kpi-cluster" aria-label="Các chỉ số chính">
        ${compactMetric("Tổng công việc", approved.length, `${scope.filter(log => log.status === "pending").length} chờ chấm`, "")}
        ${compactMetric("Độ phức tạp", complexityAvg ? complexityAvg.toFixed(1) : "—", "Thang 10", "gold")}
        ${compactMetric("Chất lượng", quality ? quality.toFixed(1) : "—", "Thang 10", "green")}
        ${compactMetric("Đã đánh giá", `${reviewRate.toFixed(0)}%`, `${reviewed.length}/${scope.length}`, "blue")}
      </section>
      <section class="insight-strip dashboard-insight">
        ${qualityGauge(quality, scope, approved)}
      </section>
    </div>
    <div class="dashboard-grid dashboard-bento">
      <section class="panel bento-tile bento-trend">
        <div class="panel-header"><div><h2>Xu hướng chất lượng và phức tạp 6 tháng</h2><p>Hai đường dùng chung thang điểm 1–10 · đường mảnh thể hiện chiều biến động</p></div><span class="chart-unit">Điểm</span></div>
        ${trendChart(trendScope)}
      </section>
      <div class="bento-side-stack">
        <section class="panel bento-tile bento-distribution">
          <div class="panel-header"><div><h2>Phân bố chất lượng</h2><p>Nhật ký đã được đánh giá</p></div></div>
          ${qualityDistribution(approved)}
        </section>
        <section class="panel bento-tile bento-progress">
          <div class="panel-header"><div><h2>Tiến độ đánh giá</h2><p>Tình trạng xử lý nhật ký</p></div><span class="chart-unit">${scope.length} nhật ký</span></div>
          ${reviewStatusChart(scope)}
        </section>
      </div>
      <section class="panel bento-tile bento-comparison">
        <div class="panel-header"><div><h2>So sánh chất lượng ${comparisonMode === "unit" ? "theo đơn vị" : "theo cá nhân"}</h2><p>${comparisonMode === "unit" ? "Hai nhóm đơn vị trên cùng thang điểm" : "Xếp theo chất lượng; luôn đọc cùng điểm phức tạp và số kết quả"}</p></div><div class="comparison-controls">${provinceScope ? `<select id="comparisonMode" aria-label="Chọn cách so sánh"><option value="unit" ${comparisonMode === "unit" ? "selected" : ""}>Theo đơn vị</option><option value="person" ${comparisonMode === "person" ? "selected" : ""}>Theo cá nhân</option></select>` : ""}${provinceScope && comparisonMode === "person" ? `<select id="comparisonPersonUnit" aria-label="Lọc đơn vị khi so sánh cá nhân"><option value="all">Tất cả đơn vị</option>${availableUnits.map(unit => `<option value="${unit.id}" ${state.dashboardPersonUnit === unit.id ? "selected" : ""}>${unit.short}</option>`).join("")}</select>` : ""}</div></div>
        ${comparisonBarChart(comparisonGrouping, comparisonMode === "person" ? 12 : Infinity)}
      </section>
      <section class="panel panel-wide bento-tile bento-summary">
        <div class="panel-header"><div><h2>${tableTitle}</h2><p>Khối lượng, độ phức tạp và chất lượng trong kỳ</p></div></div>
        ${summaryTable(grouping, provinceScope)}
      </section>
    </div>`;

  document.getElementById("resetDemo").addEventListener("click", resetDemo);
  document.getElementById("dashboardPeriodFilter").addEventListener("change", event => { state.dashboardPeriod = event.target.value; saveFilterPrefs({ dashboardPeriod: state.dashboardPeriod }); renderDashboard(); });
  const filter = document.getElementById("dashboardUnitFilter");
  if (filter) filter.addEventListener("change", event => { state.dashboardUnit = event.target.value; saveFilterPrefs({ dashboardUnit: state.dashboardUnit }); renderDashboard(); });
  const comparisonModeSelect = document.getElementById("comparisonMode");
  if (comparisonModeSelect) comparisonModeSelect.addEventListener("change", event => { state.dashboardComparisonMode = event.target.value; saveFilterPrefs({ dashboardComparisonMode: state.dashboardComparisonMode }); renderDashboard(); });
  const comparisonPersonUnit = document.getElementById("comparisonPersonUnit");
  if (comparisonPersonUnit) comparisonPersonUnit.addEventListener("change", event => { state.dashboardPersonUnit = event.target.value; saveFilterPrefs({ dashboardPersonUnit: state.dashboardPersonUnit }); renderDashboard(); });
  document.querySelectorAll("[data-summary-sort]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.summarySort;
    state.dashboardSummarySort = {
      key,
      direction: state.dashboardSummarySort.key === key && state.dashboardSummarySort.direction === "desc" ? "asc" : "desc"
    };
    renderDashboard();
  }));
  document.querySelectorAll("[data-summary-unit]").forEach(tr => tr.addEventListener("click", event => {
    if (event.target.closest("[data-summary-sort]")) return;
    state.ujUnitFilter = tr.dataset.summaryUnit; state.ujSelectedPersonId = null; state.ujMode = "person";
    state.currentView = "unitJournal"; updateNav(); render();
  }));
  document.querySelectorAll("[data-summary-person]").forEach(tr => tr.addEventListener("click", event => {
    if (event.target.closest("[data-summary-sort]")) return;
    state.ujSelectedPersonId = tr.dataset.summaryPerson; state.ujMode = "person";
    state.currentView = "unitJournal"; updateNav(); render();
  }));
}

function metricCard(label, value, context, tone) {
  return `<article class="metric-card ${tone}"><span class="metric-label">${label}</span><div class="metric-value">${value}</div><span class="metric-context">${context}</span></article>`;
}

function compactMetric(label, value, context, tone) {
  return `<div class="compact-metric ${tone}"><span>${label}</span><strong>${value}</strong><small>${context}</small></div>`;
}

function qualityGauge(quality, scope, approved) {
  const score = Number.isFinite(quality) ? quality : 0;
  const angle = Math.max(0, Math.min(10, score)) * 18;
  const message = score >= 8 ? "Chất lượng đang ở mức tốt" : score >= 6.5 ? "Chất lượng ở mức khá" : "Có chỉ số cần theo dõi";
  return `<div class="gauge-wrap"><div class="gauge-visual"><div class="mini-gauge" aria-label="Chất lượng ${score.toFixed(1)} trên 10"><div class="gauge-dial"></div><span class="gauge-needle" style="transform:rotate(${angle}deg)"></span><i></i><small class="gauge-min">0</small><small class="gauge-mid">5</small><small class="gauge-max">10</small></div><div class="gauge-reading"><strong>${score ? score.toFixed(1) : "—"}</strong><span>/10</span></div><span>Điểm chất lượng tổng hợp</span></div><div class="gauge-copy"><span class="eyebrow">NHẬN ĐỊNH NHANH</span><strong>${message}</strong><p>${scope.filter(log => log.status === "pending").length} chờ xử lý · ${scope.filter(log => log.status === "revision").length} cần bổ sung · ${approved.filter(log => log.complexity >= 7 && log.quality >= 8).length} nổi bật</p></div></div>`;
}

function trendChart(sourceLogs) {
  const periods = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
  const months = ["T3", "T4", "T5", "T6", "T7", "T8"];
  const qualityValues = periods.map(period => weightedQuality(sourceLogs.filter(log => log.date.startsWith(period))));
  const complexityValues = periods.map(period => average(sourceLogs.filter(log => log.date.startsWith(period)).map(log => log.complexity).filter(Number.isFinite)));
  const width = 620, height = 170, left = 42, right = 18, top = 16, bottom = 32;
  const x = index => left + index / (qualityValues.length - 1) * (width - left - right);
  const y = value => top + (10 - (value || 5)) / 5 * (height - top - bottom);
  const qualityPoints = qualityValues.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const complexityPoints = complexityValues.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const horizontalGrid = [6, 7, 8, 9, 10].map(value => `<line class="grid-line" x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}"/><text class="tick-label" x="${left - 9}" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join("");
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const squareColumns = Math.max(1, Math.round(plotWidth / (plotHeight / 5)));
  const squareGrid = Array.from({ length: squareColumns + 1 }, (_, index) => {
    const gridX = left + index / squareColumns * plotWidth;
    return `<line class="grid-line square-grid" x1="${gridX}" x2="${gridX}" y1="${top}" y2="${height - bottom}"/>`;
  }).join("");
  const monthGrid = qualityValues.map((value, index) => `<line class="grid-line month-grid" x1="${x(index)}" x2="${x(index)}" y1="${top}" y2="${height - bottom}"/>`).join("");
  const delta = values => values.length > 1 ? values.at(-1) - values.at(-2) : 0;
  const deltaChip = (label, values, tone) => {
    const change = delta(values);
    const direction = change > .04 ? "↑" : change < -.04 ? "↓" : "→";
    const cls = change > .04 ? "up" : change < -.04 ? "down" : "flat";
    return `<span class="trend-delta ${cls} ${tone}"><i></i>${label} <strong>${values.at(-1).toFixed(1)}</strong> ${direction} ${Math.abs(change).toFixed(1)}</span>`;
  };
  return `<div class="trend-summary">${deltaChip("Chất lượng", qualityValues, "quality")}${deltaChip("Phức tạp", complexityValues, "complexity")}</div><svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Xu hướng chất lượng và độ phức tạp trong 6 tháng"><rect class="trend-plot" x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}"/>${squareGrid}${horizontalGrid}${monthGrid}<polyline class="trend-line quality" points="${qualityPoints}"/><polyline class="trend-line complexity" points="${complexityPoints}"/>${qualityValues.map((value, index) => `<g><circle class="trend-point quality" cx="${x(index)}" cy="${y(value)}" r="3"><title>${months[index]} · Chất lượng ${value.toFixed(1)}</title></circle><circle class="trend-point complexity" cx="${x(index)}" cy="${y(complexityValues[index])}" r="3"><title>${months[index]} · Phức tạp ${complexityValues[index].toFixed(1)}</title></circle><text class="tick-label" x="${x(index)}" y="${height - 10}" text-anchor="middle">${months[index]}</text></g>`).join("")}</svg><div class="chart-legend trend-legend"><span><i class="legend-line quality"></i>Chất lượng</span><span><i class="legend-line complexity"></i>Phức tạp bình quân</span><span>↑ tăng · ↓ giảm so với tháng trước</span></div>`;
}

function reviewStatusChart(items) {
  const approved = items.filter(item => item.status === "approved").length;
  const revision = items.filter(item => item.status === "revision").length;
  const pending = items.filter(item => item.status === "pending").length;
  const total = Math.max(1, items.length);
  const a = approved / total * 100;
  const b = (approved + revision) / total * 100;
  const revisionRate = revision / total * 100;
  const pendingRate = pending / total * 100;
  return `<div class="compact-pie-layout"><div class="compact-pie review-pie" style="--p1:${a}%;--p2:${b}%"><div><strong>${Math.round(a)}%</strong><span>đã xác nhận</span></div></div><div class="compact-pie-legend"><div><i class="legend-swatch swatch-green"></i><span>Đã xác nhận</span><strong>${Math.round(a)}% <small>(${approved})</small></strong></div><div><i class="legend-swatch swatch-red"></i><span>Cần bổ sung</span><strong>${Math.round(revisionRate)}% <small>(${revision})</small></strong></div><div><i class="legend-swatch swatch-gold"></i><span>Chờ đánh giá</span><strong>${Math.round(pendingRate)}% <small>(${pending})</small></strong></div></div></div>`;
}

function comparisonBarChart(rows, limit = Infinity) {
  if (!rows.length) return `<div class="empty-state"><strong>Chưa có dữ liệu được xác nhận</strong>Hãy chọn phạm vi khác hoặc duyệt thêm nhật ký.</div>`;
  const isUnitComparison = rows.every(row => unitById(row.id));
  if (isUnitComparison) return groupedUnitComparisonChart(rows);
  const sorted = [...rows].sort((a, b) => b.quality - a.quality || b.complexityAvg - a.complexityAvg);
  const visibleRows = sorted.slice(0, limit);
  return `<div class="comparison-chart"><div class="comparison-head"><span>Đối tượng</span><span>Chất lượng</span><span>Phức tạp</span></div>${visibleRows.map(row => {
    const tone = row.quality >= 8 ? "green" : row.quality >= 6.5 ? "blue" : "gold";
    return `<div class="comparison-row"><div class="comparison-label"><strong>${row.label}</strong><span>${row.sublabel ? `${row.sublabel} · ` : ""}${row.count} kết quả${row.people > 1 ? ` · ${row.people} người` : ""}</span></div><div class="comparison-score"><div class="bar-track"><div class="bar-fill ${tone}" style="width:${row.quality * 10}%"></div></div><strong>${row.quality.toFixed(1)}</strong></div><span class="complexity-chip">${row.complexityAvg.toFixed(1)}</span></div>`;
  }).join("")}</div>${sorted.length > visibleRows.length ? `<p class="comparison-limit-note">Đang hiển thị 12 cá nhân có chất lượng cao nhất trong phạm vi đã chọn. Chọn một đơn vị để xem danh sách tập trung hơn.</p>` : ""}<div class="chart-legend"><span><i class="legend-swatch swatch-green"></i>Chất lượng từ 8</span><span><i class="legend-swatch swatch-blue"></i>Từ 6,5 đến dưới 8</span><span><i class="legend-swatch swatch-gold"></i>Dưới 6,5</span></div>`;
}

function groupedUnitComparisonChart(rows) {
  const definitions = [
    { type: "department", title: "Phòng thuộc VKSND tỉnh", tone: "department" },
    { type: "regional", title: "VKSND khu vực", tone: "regional" }
  ];
  const groups = definitions.map(definition => ({
    ...definition,
    rows: rows.filter(row => unitById(row.id)?.type === definition.type).sort((a, b) => b.quality - a.quality || b.complexityAvg - a.complexityAvg)
  })).filter(group => group.rows.length);

  const renderRow = row => {
    const displayQuality = Number(row.quality.toFixed(1));
    const tone = displayQuality >= 8 ? "green" : displayQuality >= 6.5 ? "blue" : "gold";
    return `<div class="unit-compare-row" aria-label="${row.label}: chất lượng ${displayQuality.toFixed(1)}, phức tạp ${row.complexityAvg.toFixed(1)}, ${row.count} kết quả"><div class="unit-compare-label"><strong>${row.label}</strong><span>${row.count} kết quả</span></div><div class="unit-compare-bar"><div class="bar-track"><div class="bar-fill ${tone}" style="width:${row.quality * 10}%"></div></div></div><strong class="unit-quality">${displayQuality.toFixed(1)}</strong><span class="unit-complexity">PT ${row.complexityAvg.toFixed(1)}</span></div>`;
  };

  return `<div class="unit-comparison-grid ${groups.length === 1 ? "is-single" : ""}" role="group" aria-label="So sánh chất lượng giữa các đơn vị">${groups.map(group => `<section class="unit-comparison-group ${group.tone}"><div class="unit-group-header"><div><span class="unit-group-stripe"></span><h3>${group.title}</h3></div><strong>${group.rows.length} đơn vị</strong></div><div class="unit-column-labels"><span>Đơn vị</span><span>Chất lượng</span><span>Điểm</span><span>Phức tạp</span></div><div class="unit-compare-list">${group.rows.map(renderRow).join("")}</div></section>`).join("")}</div><div class="chart-legend"><span><i class="legend-swatch swatch-green"></i>Chất lượng từ 8</span><span><i class="legend-swatch swatch-blue"></i>Từ 6,5 đến dưới 8</span><span><i class="legend-swatch swatch-gold"></i>Dưới 6,5</span><span>PT = độ phức tạp bình quân</span></div>`;
}

function aggregateByUnit(items) {
  return units.filter(unit => unit.id !== "province" && visibleUnitIds().includes(unit.id)).map(unit => {
    const subset = items.filter(item => item.unitId === unit.id);
    return aggregateRow(unit.id, unit.short, subset, users.filter(user => user.unitId === unit.id).length);
  }).filter(row => row.count > 0);
}

function aggregateByUser(items, unitId) {
  const viewer = currentUser();
  return users.filter(user => user.unitId === unitId && isVisibleInUnitScope(user, viewer)).map(user => {
    const subset = items.filter(item => item.authorId === user.id);
    return aggregateRow(user.id, user.name, subset, 1, user.title);
  }).filter(row => row.count > 0);
}

function aggregateVisibleUsers(items, unitId = null) {
  const viewer = currentUser();
  const visibleUnits = visibleUnitIds(viewer);
  return users.filter(user => visibleUnits.includes(user.unitId) && (!unitId || user.unitId === unitId) && isVisibleInUnitScope(user, viewer)).map(user => {
    const subset = items.filter(item => item.authorId === user.id);
    return aggregateRow(user.id, user.name, subset, 1, `${user.title} · ${unitById(user.unitId).short}`);
  }).filter(row => row.count > 0);
}

function aggregateRow(id, label, items, people, sublabel = "") {
  return {
    id, label, sublabel, people, count: items.length,
    complexityTotal: items.reduce((sum, item) => sum + (item.complexity || 0), 0),
    complexityAvg: average(items.map(item => item.complexity).filter(Number.isFinite)),
    quality: weightedQuality(items),
    highQuality: items.filter(item => item.quality >= 8).length
  };
}

function matrixChart(rows) {
  if (!rows.length) return `<div class="empty-state"><strong>Chưa có dữ liệu được xác nhận</strong>Hãy chọn phạm vi khác hoặc duyệt thêm nhật ký.</div>`;
  const width = 720, height = 390, left = 52, right = 28, top = 28, bottom = 44;
  const plotW = width - left - right, plotH = height - top - bottom;
  const x = value => left + (Math.max(1, Math.min(10, value)) - 1) / 9 * plotW;
  const y = value => top + plotH - (Math.max(1, Math.min(10, value)) - 1) / 9 * plotH;
  const grid = [1,3,5,7,9].map(tick => `<line class="grid-line" x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${top + plotH}"/><line class="grid-line" x1="${left}" x2="${left + plotW}" y1="${y(tick)}" y2="${y(tick)}"/><text class="tick-label" x="${x(tick)}" y="${height - 19}" text-anchor="middle">${tick}</text><text class="tick-label" x="${left - 12}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`).join("");
  const bubbles = rows.map((row, index) => {
    const radius = Math.min(24, 9 + Math.sqrt(row.count) * 4);
    const labelY = y(row.quality) - radius - 5;
    return `<g><circle class="bubble" tabindex="0" cx="${x(row.complexityAvg)}" cy="${y(row.quality)}" r="${radius}" aria-label="${row.label}: độ phức tạp ${row.complexityAvg.toFixed(1)}, chất lượng ${row.quality.toFixed(1)}, ${row.count} kết quả"><title>${row.label}\nPhức tạp ${row.complexityAvg.toFixed(1)} · Chất lượng ${row.quality.toFixed(1)} · ${row.count} kết quả</title></circle><text class="bubble-label" x="${x(row.complexityAvg)}" y="${labelY}" text-anchor="middle">${row.label.length > 18 ? row.label.slice(0,17) + "…" : row.label}</text></g>`;
  }).join("");
  return `<div class="matrix-wrap"><svg class="matrix-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Biểu đồ ma trận độ phức tạp và chất lượng">
    <rect x="${x(6.5)}" y="${top}" width="${left + plotW - x(6.5)}" height="${y(6.5) - top}" fill="rgba(31,122,85,.06)"/>
    <rect x="${x(6.5)}" y="${y(6.5)}" width="${left + plotW - x(6.5)}" height="${top + plotH - y(6.5)}" fill="rgba(189,101,29,.06)"/>
    ${grid}<line class="axis-line" x1="${left}" x2="${left + plotW}" y1="${top + plotH}" y2="${top + plotH}"/><line class="axis-line" x1="${left}" x2="${left}" y1="${top}" y2="${top + plotH}"/>
    <line class="axis-line" x1="${x(6.5)}" x2="${x(6.5)}" y1="${top}" y2="${top + plotH}" stroke-dasharray="4 5"/><line class="axis-line" x1="${left}" x2="${left + plotW}" y1="${y(6.5)}" y2="${y(6.5)}" stroke-dasharray="4 5"/>
    <text class="quadrant-label" x="${left + 12}" y="${top + 18}">Tốt · công việc thường xuyên</text><text class="quadrant-label" x="${left + plotW - 12}" y="${top + 18}" text-anchor="end">Kết quả nổi bật</text>
    <text class="quadrant-label" x="${left + plotW - 12}" y="${top + plotH - 10}" text-anchor="end">Cần hỗ trợ</text>
    ${bubbles}<text class="axis-label" x="${left + plotW / 2}" y="${height - 2}" text-anchor="middle">Độ phức tạp bình quân →</text><text class="axis-label" transform="translate(13 ${top + plotH / 2}) rotate(-90)" text-anchor="middle">Chất lượng có trọng số →</text>
  </svg></div>`;
}

function qualityDistribution(items) {
  const bands = [
    { label: "Rất tốt (9–10)", count: items.filter(item => item.quality >= 9).length, cls: "green" },
    { label: "Tốt (7–8)", count: items.filter(item => item.quality >= 7 && item.quality < 9).length, cls: "blue" },
    { label: "Đạt (5–6)", count: items.filter(item => item.quality >= 5 && item.quality < 7).length, cls: "gold" },
    { label: "Cần bổ sung (1–4)", count: items.filter(item => item.quality && item.quality < 5).length, cls: "" }
  ];
  const total = Math.max(1, bands.reduce((sum, band) => sum + band.count, 0));
  const rates = bands.map(band => band.count / total * 100);
  const p1 = rates[0], p2 = p1 + rates[1], p3 = p2 + rates[2];
  return `<div class="compact-pie-layout"><div class="compact-pie quality-pie" style="--p1:${p1}%;--p2:${p2}%;--p3:${p3}%"><div><strong>${total}</strong><span>kết quả</span></div></div><div class="compact-pie-legend">${bands.map((band, index) => `<div><i class="legend-swatch ${index === 0 ? "swatch-green" : index === 1 ? "swatch-blue" : index === 2 ? "swatch-gold" : "swatch-red"}"></i><span>${band.label}</span><strong>${Math.round(rates[index])}% <small>(${band.count})</small></strong></div>`).join("")}</div></div>`;
}

function summaryTable(rows, isUnit) {
  if (!rows.length) return `<div class="empty-state"><strong>Chưa có dữ liệu</strong>Không có kết quả phù hợp với phạm vi đã chọn.</div>`;
  const { key, direction } = state.dashboardSummarySort;
  const valueOf = row => key === "highQualityRate" ? row.highQuality / row.count : row[key];
  const sortedRows = [...rows].sort((a, b) => {
    const difference = valueOf(a) - valueOf(b);
    return (direction === "asc" ? difference : -difference) || a.label.localeCompare(b.label, "vi");
  });
  const sortableHeader = (label, sortKey) => {
    const active = key === sortKey;
    const symbol = active ? (direction === "asc" ? "↑" : "↓") : "↕";
    const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";
    const hint = active ? `Đang sắp xếp ${direction === "asc" ? "tăng dần" : "giảm dần"}` : "Nhấn để sắp xếp giảm dần";
    return `<th class="numeric sortable-column" aria-sort="${ariaSort}"><button type="button" class="sort-button ${active ? "is-active" : ""}" data-summary-sort="${sortKey}" title="${hint}"><span>${label}</span><span class="sort-indicator" aria-hidden="true">${symbol}</span></button></th>`;
  };
  const clickable = isLeader();
  return `<div class="table-sort-help">Chọn tên cột để sắp xếp · nhấn lần nữa để đổi chiều${clickable ? " · Nhấn 1 dòng để xem nhật ký công tác" : ""}</div><div class="table-wrap"><table><thead><tr><th>${isUnit ? "Đơn vị" : "Cán bộ"}</th>${sortableHeader("Kết quả", "count")}${sortableHeader("Tổng phức tạp", "complexityTotal")}${sortableHeader("Phức tạp BQ", "complexityAvg")}${sortableHeader("Chất lượng", "quality")}${sortableHeader("Tỷ lệ ≥ 8", "highQualityRate")}</tr></thead><tbody>${sortedRows.map(row => {
    const rowAttr = clickable ? (isUnit ? ` class="summary-row-clickable" data-summary-unit="${row.id}"` : ` class="summary-row-clickable" data-summary-person="${row.id}"`) : "";
    return `<tr${rowAttr}><td>${isUnit ? `<strong>${row.label}</strong><br><span class="metric-context">${row.people} người</span>` : `<div class="person-cell"><span class="mini-avatar">${userById(row.id).initials}</span><div><strong>${row.label}</strong><span>${row.sublabel}</span></div></div>`}</td><td class="numeric">${row.count}</td><td class="numeric">${row.complexityTotal}</td><td class="numeric">${row.complexityAvg.toFixed(1)}</td><td class="numeric"><span class="score-pill ${scoreClass(row.quality)}">${row.quality.toFixed(1)}</span></td><td class="numeric">${(row.highQuality / row.count * 100).toFixed(0)}%</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function renderJournal() {
  const user = currentUser();
  const mine = logs.filter(log => log.authorId === user.id).sort((a,b) => Number(b.status === "revision") - Number(a.status === "revision") || b.date.localeCompare(a.date));
  const pendingCount = mine.filter(item => item.status === "pending").length;
  const revisionCount = mine.filter(item => item.status === "revision").length;
  const filtered = mine.filter(item => {
    if (state.journalStatusFilter !== "all" && item.status !== state.journalStatusFilter) return false;
    if (state.journalSearch) {
      const q = state.journalSearch.normalize("NFC").toLowerCase();
      const hay = `${item.title} ${item.result}`.normalize("NFC").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  updateChrome("Nhật ký của tôi", "KẾT QUẢ CÔNG TÁC HẰNG NGÀY");
  const noJournalToday = user.role !== "administrator" && !mine.some(log => log.date === DEMO_TODAY);
  document.getElementById("appView").innerHTML = `
    ${noJournalToday ? `<div class="demo-notice journal-reminder-notice"><strong>Nhắc nhở</strong><span>Hôm nay bạn chưa ghi nhật ký công tác. Hãy ghi lại kết quả trong ngày để không bỏ sót khi chấm điểm cuối tháng.</span></div>` : ""}
    <div class="journal-header"><div><h2>${user.name}</h2><p>${user.title} · ${unitById(user.unitId).short}</p></div><button class="button button-primary" id="newJournal">+ Ghi nhật ký mới</button></div>
    <div class="metric-grid journal-stats-row">
      ${metricCard("Nhật ký đã gửi", mine.length, "Trong dữ liệu demo", "")}
      ${metricCard("Đã xác nhận", mine.filter(item => item.status === "approved").length, "Kết quả được công nhận", "green")}
      ${metricCard("Cần xử lý", pendingCount + revisionCount, `${pendingCount} chờ đánh giá · ${revisionCount} cần bổ sung`, "gold")}
      ${metricCard("Chất lượng", weightedQuality(mine.filter(item => item.status === "approved")).toFixed(1) || "—", "Bình quân có trọng số", "blue")}
    </div>
    <div class="toolbar">
      <label class="filter-field"><span>Trạng thái</span><select id="journalStatusFilter">
        <option value="all" ${state.journalStatusFilter === "all" ? "selected" : ""}>Tất cả</option>
        <option value="pending" ${state.journalStatusFilter === "pending" ? "selected" : ""}>Chờ đánh giá</option>
        <option value="approved" ${state.journalStatusFilter === "approved" ? "selected" : ""}>Đã xác nhận</option>
        <option value="revision" ${state.journalStatusFilter === "revision" ? "selected" : ""}>Cần bổ sung</option>
      </select></label>
      <label class="field"><span>Tìm theo nội dung</span><input type="text" id="journalSearchInput" value="${state.journalSearch}" placeholder="Nhập từ khoá..."></label>
    </div>
    <div class="journal-list">${filtered.length ? filtered.map(l => journalCard(l)).join("") : `<div class="empty-state"><strong>Không có nhật ký phù hợp</strong>Thử đổi bộ lọc hoặc ghi nhật ký mới.</div>`}</div>`;
  document.getElementById("newJournal").addEventListener("click", () => openJournalModal());
  document.querySelectorAll("[data-edit-journal]").forEach(button => button.addEventListener("click", () => openJournalModal(button.dataset.editJournal)));
  document.querySelectorAll("[data-delete-log]").forEach(button => button.addEventListener("click", () => handleDeleteLogClick(button)));
  document.getElementById("journalStatusFilter").addEventListener("change", event => { state.journalStatusFilter = event.target.value; renderJournal(); });
  const searchInput = document.getElementById("journalSearchInput");
  searchInput.addEventListener("input", event => {
    state.journalSearch = event.target.value;
    const caret = searchInput.selectionStart;
    renderJournal();
    const newInput = document.getElementById("journalSearchInput");
    newInput.focus();
    newInput.setSelectionRange(caret, caret);
  });
}

function journalCard(log, opts = {}) {
  const canEdit = log.status === "revision" && log.authorId === currentUser().id && !opts.readOnly;
  // "Cap tren" cua nguoi DA CHAM (khong phai tac gia) - cau hoi thu bac
  // chung, dung canManagePerson (khong phu thuoc submitted_to_id cua
  // rieng nhat ky nay, khac canReviewLog).
  const canOverride = log.status === "approved" && log.reviewerId && canManagePerson(userById(log.reviewerId), currentUser());
  const overridden = (log.scoringHistory || []).length >= 2;
  const submittedToTag = log.submittedToId ? `<span class="meta-tag">Nộp cho: ${userById(log.submittedToId)?.name || "—"}</span>` : "";
  // Tu xoa: chi chinh tac gia, chi khi con "cho duyet"/"can bo sung" (da
  // duyet roi coi la du lieu chinh thuc, phai qua lanh dao). Lanh dao xoa
  // ho cap duoi: dung dung pham vi da co san trong canReviewLog, khong gioi
  // han trang thai.
  const isSelf = log.authorId === currentUser().id;
  const canDeleteSelf = !opts.readOnly && isSelf && (log.status === "pending" || log.status === "revision");
  const canDeleteAsLeader = !isSelf && canReviewLog(log, currentUser());
  const canDelete = canDeleteSelf || canDeleteAsLeader;
  const revisionFeedback = log.status === "revision" ? `<div class="revision-feedback"><strong>Lãnh đạo yêu cầu bổ sung</strong><span>${log.comment || "Cần chỉnh sửa, làm rõ kết quả công tác."}</span></div>` : "";
  const resubmission = log.revisionCount ? `<span class="meta-tag">Đã trình lại ${log.revisionCount} lần</span>` : "";
  const overriddenTag = overridden ? `<span class="meta-tag meta-tag-warning">Điểm đã được lãnh đạo cấp trên điều chỉnh</span>` : "";
  const authorTag = opts.authorName ? (opts.authorId ? `<button type="button" class="meta-tag journal-author-tag" data-uj-jump-person="${opts.authorId}">${opts.authorName}</button>` : `<span class="meta-tag journal-author-tag">${opts.authorName}</span>`) : "";
  return `<article class="journal-card ${log.status === "revision" ? "is-revision" : ""}"><div class="journal-date"><strong>${shortDate(log.date)}</strong>${log.date.slice(0,4)}</div><div class="journal-body"><h3>${log.title}</h3><p>${log.result}</p>${revisionFeedback}<div class="journal-meta">${authorTag}<span class="meta-tag">${log.category}</span><span class="meta-tag">${log.workRole}</span><span class="meta-tag">${log.duration}</span>${submittedToTag}${resubmission}${overriddenTag}<span class="status-pill ${statusClass(log.status)}">${statusLabel(log.status)}</span></div></div><div class="journal-side"><div class="journal-scores"><div class="score-box"><span>Phức tạp</span><strong>${log.complexity ?? "—"}</strong></div><div class="score-box"><span>Chất lượng</span><strong>${log.quality ?? "—"}</strong></div></div>${canEdit ? `<button type="button" class="button button-primary button-small" data-edit-journal="${log.id}">Sửa và trình lại</button>` : ""}${canOverride ? `<button type="button" class="button button-secondary button-small" data-override-score="${log.id}">Điều chỉnh điểm</button>` : ""}${canDelete ? `<button type="button" class="button button-danger button-small" data-delete-log="${log.id}" data-delete-self="${canDeleteSelf ? "1" : "0"}">Xoá</button>` : ""}</div></article>`;
}

// Gom danh sach cho duyet theo tung tac gia (KSV), xep theo lan nop gan
// nhat cua tung nguoi; trong 1 nhom sap theo thoi gian nop moi nhat truoc.
// An toan: neu khong tim thay tac gia (du lieu khong khop), gom vao 1 nhom
// rieng thay vi lam vo danh sach.
// ============================================
// GHI CHU CONG VIEC CA NHAN - lich thang + khung chi tiet, rieng tu tuyet
// doi cho tung nguoi dung (khac han "Nhat ky cong tac" la viec DA lam).
// ============================================
function personalNotesForCurrentUser() {
  return personalNotes.filter(note => note.userId === currentUser().id);
}

// Luoi 6 hang x 7 cot (T2->CN), bao gom ca ngay dem dau/cuoi thang lien ke
// de nguoi dung van them/xem ghi chu duoc o ranh gioi thang.
function notesGridDates(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - startWeekday);
  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + index);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function shiftMonth(monthStr, delta) {
  const [year, month] = monthStr.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fullDateLabelVi(dateStr) {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const d = new Date(`${dateStr}T00:00:00`);
  return `${days[d.getDay()]}, ${formatDate(dateStr)}`;
}

function renderNotes() {
  const mine = personalNotesForCurrentUser();
  const gridDates = notesGridDates(state.notesMonth);
  if (!gridDates.includes(state.notesSelectedDate)) {
    state.notesSelectedDate = state.notesMonth === DEMO_TODAY.slice(0, 7) ? DEMO_TODAY : `${state.notesMonth}-01`;
  }
  const notesByDate = {};
  mine.forEach(note => {
    (notesByDate[note.noteDate] ||= []).push(note);
  });
  updateChrome("Ghi chú công việc", "KẾ HOẠCH CÁ NHÂN");
  document.getElementById("appView").innerHTML = `
    <div class="journal-header"><div><h2>Ghi chú công việc</h2><p>Kế hoạch cá nhân — chỉ bạn nhìn thấy</p></div><button class="button button-primary" id="newNote">+ Thêm ghi chú</button></div>
    <div class="toolbar">
      <div class="month-nav"><button type="button" class="icon-button" id="notesPrevMonth" aria-label="Tháng trước">‹</button><strong>${periodLabel(state.notesMonth)}</strong><button type="button" class="icon-button" id="notesNextMonth" aria-label="Tháng sau">›</button></div>
      <div class="spacer"></div>
      <button class="button button-secondary" id="notesToday">Hôm nay</button>
    </div>
    <div class="monthly-layout">
      <section class="panel monthly-table-panel">
        <div class="calendar-grid">
          ${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(w => `<div class="calendar-weekday">${w}</div>`).join("")}
          ${gridDates.map(dateStr => calendarDayCellHtml(dateStr, notesByDate[dateStr] || [])).join("")}
        </div>
      </section>
      <section class="panel monthly-detail">${notesDetailHtml(state.notesSelectedDate, notesByDate[state.notesSelectedDate] || [])}</section>
    </div>
    ${stickyBoardHtml()}`;
  document.getElementById("newNote").addEventListener("click", () => openNoteModal(state.notesSelectedDate));
  document.getElementById("notesPrevMonth").addEventListener("click", () => { state.notesMonth = shiftMonth(state.notesMonth, -1); renderNotes(); });
  document.getElementById("notesNextMonth").addEventListener("click", () => { state.notesMonth = shiftMonth(state.notesMonth, 1); renderNotes(); });
  document.getElementById("notesToday").addEventListener("click", () => { state.notesMonth = DEMO_TODAY.slice(0, 7); state.notesSelectedDate = DEMO_TODAY; renderNotes(); });
  document.querySelectorAll("[data-notes-day]").forEach(cell => cell.addEventListener("click", () => { state.notesSelectedDate = cell.dataset.notesDay; renderNotes(); }));
  const newForDay = document.getElementById("newNoteForDay");
  if (newForDay) newForDay.addEventListener("click", () => openNoteModal(state.notesSelectedDate));
  document.querySelectorAll("[data-edit-note]").forEach(button => button.addEventListener("click", () => openNoteModal(null, button.dataset.editNote)));
  document.querySelectorAll("[data-delete-note]").forEach(button => button.addEventListener("click", () => deleteNote(button.dataset.deleteNote)));
  document.querySelectorAll("[data-toggle-note-done]").forEach(checkbox => checkbox.addEventListener("change", () => toggleNoteDone(checkbox.dataset.toggleNoteDone)));
  bindStickyBoard();
}

// ============================================
// GHI CHU TU DO (khong gan ngay) - "sticky notes", tu xep theo luoi, keo
// goc duoi-phai tung o de doi kich thuoc bang co che resize goc cua trinh
// duyet (khong dinh vi tu do, khong can thu vien keo-tha).
// ============================================
function stickyNotesForCurrentUser() {
  return stickyNotes.filter(note => note.userId === currentUser().id);
}

function stickyBoardHtml() {
  const mine = stickyNotesForCurrentUser();
  return `<section class="panel sticky-board-panel">
    <div class="panel-header"><div><h2>Việc chưa có hạn cụ thể</h2><p>Ghi chú tự do, không gắn ngày — kéo góc dưới-phải để đổi kích thước</p></div><button class="button button-secondary" id="newSticky">+ Thêm ô ghi chú</button></div>
    <div class="sticky-board">${mine.length ? mine.map(stickyNoteHtml).join("") : `<p class="metric-context">Chưa có ghi chú nào.</p>`}</div>
  </section>`;
}

function stickyNoteHtml(note) {
  return `<div class="sticky-note" style="width:${note.width || 220}px;height:${note.height || 160}px" data-sticky-id="${note.id}">
    <button type="button" class="sticky-note-delete" data-delete-sticky="${note.id}" aria-label="Xoá ghi chú">×</button>
    <textarea class="sticky-note-text" data-sticky-text="${note.id}" placeholder="Ghi việc chưa có hạn...">${note.content || ""}</textarea>
  </div>`;
}

function bindStickyBoard() {
  const newSticky = document.getElementById("newSticky");
  if (newSticky) newSticky.addEventListener("click", () => {
    stickyNotes.push({ id: `SN-${Date.now()}`, userId: currentUser().id, content: "", width: 220, height: 160, createdAt: new Date().toISOString() });
    saveStickyNotes();
    renderNotes();
  });
  document.querySelectorAll("[data-delete-sticky]").forEach(button => button.addEventListener("click", () => {
    stickyNotes = stickyNotes.filter(note => note.id !== button.dataset.deleteSticky);
    saveStickyNotes();
    renderNotes();
  }));
  document.querySelectorAll("[data-sticky-text]").forEach(textarea => {
    let debounceTimer;
    textarea.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const note = stickyNotes.find(item => item.id === textarea.dataset.stickyText);
        if (note) { note.content = textarea.value; saveStickyNotes(); }
      }, 400);
    });
  });
  document.querySelectorAll(".sticky-note").forEach(el => {
    let debounceTimer;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      // "* { box-sizing: border-box }" toan cuc -> style.width/height dat khi
      // ve lai la KICH THUOC BORDER-BOX, phai luu dung border-box (khong
      // dung contentRect - loai tru padding, se lam o "co lai" moi lan
      // resize+tai lai trang do padding bi tru lap).
      const box = entry.borderBoxSize && entry.borderBoxSize[0];
      const width = box ? box.inlineSize : el.offsetWidth;
      const height = box ? box.blockSize : el.offsetHeight;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const note = stickyNotes.find(item => item.id === el.dataset.stickyId);
        if (note) {
          note.width = Math.round(width);
          note.height = Math.round(height);
          saveStickyNotes();
        }
      }, 400);
    });
    observer.observe(el);
  });
}

function calendarDayCellHtml(dateStr, dayNotes) {
  const inMonth = dateStr.startsWith(state.notesMonth);
  const isToday = dateStr === DEMO_TODAY;
  const isSelected = dateStr === state.notesSelectedDate;
  const dayNumber = Number(dateStr.slice(8, 10));
  const visible = dayNotes.slice(0, 3);
  const rest = dayNotes.length - visible.length;
  const chips = visible.map(note => {
    const overdue = note.noteDate < DEMO_TODAY && !note.isDone;
    return `<span class="calendar-day-chip ${note.isDone ? "is-done" : ""} ${overdue ? "is-overdue" : ""}">${note.title}</span>`;
  }).join("");
  return `<button type="button" class="calendar-day ${inMonth ? "" : "is-other-month"} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}" data-notes-day="${dateStr}">
    <span class="calendar-day-number">${dayNumber}</span>${chips}${rest > 0 ? `<span class="calendar-day-more">+${rest} khác</span>` : ""}
  </button>`;
}

function notesDetailHtml(dateStr, dayNotes) {
  const sorted = dayNotes.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return `<div class="panel-header"><div><span class="eyebrow">CHI TIẾT NGÀY</span><h2>${fullDateLabelVi(dateStr)}</h2></div></div>
    <div class="note-list">${sorted.length ? sorted.map(note => noteCardHtml(note)).join("") : `<div class="empty-state compact-empty"><strong>Chưa có ghi chú</strong><span>Chưa có việc gì được ghi cho ngày này.</span></div>`}</div>
    <div class="form-actions" style="padding-top:14px"><button type="button" class="button button-secondary" id="newNoteForDay">+ Thêm ghi chú cho ngày này</button></div>`;
}

function noteCardHtml(note) {
  const overdue = note.noteDate < DEMO_TODAY && !note.isDone;
  return `<article class="note-card ${note.isDone ? "is-done" : ""} ${overdue ? "is-overdue" : ""}">
    <label class="note-card-check"><input type="checkbox" data-toggle-note-done="${note.id}" ${note.isDone ? "checked" : ""}><span>${note.title}</span></label>
    ${note.content ? `<p>${note.content}</p>` : ""}
    <div class="note-card-actions"><button type="button" class="button button-secondary button-small" data-edit-note="${note.id}">Sửa</button><button type="button" class="button button-danger button-small" data-delete-note="${note.id}">Xoá</button></div>
  </article>`;
}

function openNoteModal(dateStr, noteId = null) {
  const form = document.getElementById("noteForm");
  form.reset();
  const note = noteId ? personalNotes.find(item => item.id === noteId) : null;
  document.getElementById("noteModalTitle").textContent = note ? "Sửa ghi chú công việc" : "Thêm ghi chú công việc";
  document.getElementById("noteSubmitButton").textContent = note ? "Lưu thay đổi" : "Lưu ghi chú";
  form.dataset.editingNoteId = note ? note.id : "";
  form.elements.noteDate.value = note ? note.noteDate : (dateStr || state.notesSelectedDate);
  form.elements.title.value = note ? note.title : "";
  form.elements.content.value = note ? note.content || "" : "";
  document.getElementById("noteModal").hidden = false;
  form.elements.title.focus();
}

function closeNoteModal() {
  document.getElementById("noteModal").hidden = true;
}

function submitNote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const editingId = form.dataset.editingNoteId;
  const noteDate = data.get("noteDate");
  const title = String(data.get("title") || "").trim();
  const content = String(data.get("content") || "").trim();
  if (!noteDate || !title) return;
  if (editingId) {
    const note = personalNotes.find(item => item.id === editingId);
    if (note) Object.assign(note, { noteDate, title, content });
  } else {
    personalNotes.push({ id: `PN-${Date.now()}`, userId: currentUser().id, noteDate, title, content, isDone: false, createdAt: new Date().toISOString() });
  }
  savePersonalNotes();
  closeNoteModal();
  state.notesSelectedDate = noteDate;
  if (!noteDate.startsWith(state.notesMonth)) state.notesMonth = noteDate.slice(0, 7);
  showToast(editingId ? "Đã cập nhật ghi chú." : "Đã thêm ghi chú.");
  renderNotes();
}

function toggleNoteDone(noteId) {
  const note = personalNotes.find(item => item.id === noteId);
  if (!note) return;
  note.isDone = !note.isDone;
  savePersonalNotes();
  renderNotes();
}

function deleteNote(noteId) {
  personalNotes = personalNotes.filter(item => item.id !== noteId);
  savePersonalNotes();
  showToast("Đã xoá ghi chú.");
  renderNotes();
}

function groupQueueByAuthor(queue) {
  const order = [], byId = {};
  queue.forEach(log => {
    const key = log.authorId || "__unknown__";
    if (!byId[key]) { byId[key] = { author: userById(log.authorId) || null, items: [] }; order.push(key); }
    byId[key].items.push(log);
  });
  const groups = order.map(key => byId[key]);
  groups.forEach(g => g.items.sort((a, b) => (submittedAtOf(b) || "").localeCompare(submittedAtOf(a) || "")));
  groups.sort((a, b) => {
    const at = a.items[0] ? submittedAtOf(a.items[0]) : "";
    const bt = b.items[0] ? submittedAtOf(b.items[0]) : "";
    return (bt || "").localeCompare(at || "");
  });
  return groups;
}

function renderReviews() {
  if (!isLeader()) { state.currentView = "dashboard"; renderDashboard(); return; }
  const queue = reviewQueue();
  if (!state.selectedReviewId || !queue.some(log => log.id === state.selectedReviewId)) state.selectedReviewId = queue[0]?.id || null;
  const selected = logs.find(log => log.id === state.selectedReviewId);
  updateChrome("Duyệt và chấm điểm", "TRÁCH NHIỆM NGƯỜI ĐỨNG ĐẦU");
  document.getElementById("appView").innerHTML = `
    <div class="toolbar"><div><h2>${queue.length} nhật ký chờ đánh giá</h2><p class="metric-context">Chỉ hiển thị cán bộ, công chức thuộc phạm vi được phân công.</p></div></div>
    <div class="review-layout">
      <section><details class="review-queue-details" ${state.reviewQueueCollapsed ? "" : "open"}><summary>Danh sách hàng chờ <span class="review-queue-hint">(bấm để thu gọn/mở rộng)</span></summary><div class="review-queue">${queue.length ? groupQueueByAuthor(queue).map(g => {
        const authorName = g.author ? g.author.name : "Không xác định tác giả";
        const authorUnit = g.author ? unitById(g.author.unitId).short : "";
        const items = g.items.map((log, idx) => `<button class="queue-item ${log.id === state.selectedReviewId ? "is-selected" : ""}" data-review-id="${log.id}"><span class="queue-index">${idx + 1}</span><span class="queue-item-body"><p>${log.title}</p><span class="queue-meta">${log.revisionCount ? `<span class="resubmission-badge">Trình lại lần ${log.revisionCount}</span>` : ""}<span>${shortDateTime(submittedAtOf(log))}</span></span></span></button>`).join("");
        return `<div class="queue-group"><div class="queue-group-header"><strong>${authorName}</strong>${authorUnit ? `<span>${authorUnit}</span>` : ""}</div>${items}</div>`;
      }).join("") : `<div class="panel empty-state"><strong>Đã xử lý hết</strong>Không còn nhật ký chờ đánh giá.</div>`}</div></details></section>
      <section class="panel review-detail">${selected ? reviewDetail(selected) : `<div class="empty-state"><strong>Không có nhật ký cần xử lý</strong>Hãy quay lại khi có nhật ký mới.</div>`}</section>
    </div>`;
  document.querySelectorAll("[data-review-id]").forEach(button => button.addEventListener("click", () => {
    state.selectedReviewId = button.dataset.reviewId;
    // Tren man hinh hep, chon xong tu thu gon hang cho de do phai cuon qua
    // het danh sach moi toi form cham diem (man hinh rong van hien song
    // song ca 2 ben nen khong can thu gon).
    if (window.innerWidth <= 820) state.reviewQueueCollapsed = true;
    renderReviews();
  }));
  const queueDetails = document.querySelector(".review-queue-details");
  if (queueDetails) queueDetails.addEventListener("toggle", () => { state.reviewQueueCollapsed = !queueDetails.open; });
  if (selected) bindReviewActions(selected);
}

const scoringGuides = {
  complexity: [
    { max: 2, title: "Đơn giản", text: "Công việc lặp lại, quy trình rõ ràng và phạm vi xử lý hẹp." },
    { max: 4, title: "Thông thường", text: "Có xử lý chuyên môn nhưng ít tình huống phát sinh hoặc phối hợp." },
    { max: 6, title: "Khá phức tạp", text: "Nhiều bước xử lý, cần phối hợp hoặc tổng hợp từ nhiều nguồn." },
    { max: 8, title: "Phức tạp", text: "Đòi hỏi chuyên môn sâu, xử lý tình huống khó hoặc có tác động đáng kể." },
    { max: 10, title: "Đặc biệt phức tạp", text: "Tác động lớn, nhiều bên liên quan hoặc cần giải pháp chuyên sâu." }
  ],
  quality: [
    { max: 2, title: "Không đạt", text: "Có sai sót nghiêm trọng, kết quả chưa sử dụng được hoặc phải làm lại." },
    { max: 4, title: "Cần bổ sung", text: "Kết quả chưa đầy đủ và cần chỉnh sửa đáng kể trước khi sử dụng." },
    { max: 6, title: "Đạt yêu cầu", text: "Hoàn thành yêu cầu cơ bản, kết quả có thể sử dụng." },
    { max: 8, title: "Tốt", text: "Kết quả đúng, đầy đủ, kịp thời và trình bày rõ ràng." },
    { max: 10, title: "Rất tốt", text: "Kết quả nổi bật, hiệu quả cao hoặc có sáng kiến mang lại giá trị." }
  ]
};

function scoringGuide(type, value) {
  const numericValue = Number(value);
  return scoringGuides[type].find(item => numericValue <= item.max) || scoringGuides[type].at(-1);
}

function scoringGuideMarkup(type, value) {
  const guide = scoringGuide(type, value);
  const band = Number(value) <= 4 ? "low" : Number(value) <= 8 ? "standard" : "high";
  return `<div class="score-guide" id="${type}Guide" data-type="${type}" data-band="${band}" aria-live="polite"><strong id="${type}GuideTitle">Mức ${value} · ${guide.title}</strong><span id="${type}GuideText">${guide.text}</span></div>`;
}

function updateScoringGuide(type, value) {
  const guide = scoringGuide(type, value);
  const guideElement = document.getElementById(`${type}Guide`);
  document.getElementById(`${type}Value`).textContent = value;
  document.getElementById(`${type}GuideTitle`).textContent = `Mức ${value} · ${guide.title}`;
  document.getElementById(`${type}GuideText`).textContent = guide.text;
  guideElement.dataset.band = Number(value) <= 4 ? "low" : Number(value) <= 8 ? "standard" : "high";
}

function reviewDetail(log) {
  const author = userById(log.authorId);
  const hasSelfScore = log.selfComplexity != null && log.selfQuality != null;
  const complexity = log.complexity || log.selfComplexity || 6;
  const quality = log.quality || log.selfQuality || 8;
  const lastRevision = log.reviewHistory?.at(-1);
  const revisionContext = lastRevision ? `<div class="resubmission-context"><strong>Báo cáo đã được chỉnh sửa và trình lại lần ${log.revisionCount || log.reviewHistory.length}</strong><span>Yêu cầu trước: ${lastRevision.comment}</span></div>` : "";
  const selfScoreNote = hasSelfScore ? `<div class="self-score-note"><span>Cán bộ tự chấm: Độ phức tạp <strong>${log.selfComplexity}</strong> · Chất lượng <strong>${log.selfQuality}</strong></span><button type="button" class="button button-secondary button-small" id="acceptSelfScore">Đồng ý với tự chấm</button></div>` : "";
  return `<div class="panel-header"><div><span class="eyebrow">${log.id} · ${formatDate(log.date)}</span><h2>${log.title}</h2><p>${author.name} · ${author.title} · ${unitById(log.unitId).short}</p></div></div>
    ${revisionContext}<div class="detail-section"><h3>Kết quả báo cáo</h3><p>${log.result}</p><div class="detail-grid"><div class="detail-item"><span>Lĩnh vực</span><strong>${log.category}</strong></div><div class="detail-item"><span>Vai trò</span><strong>${log.workRole}</strong></div><div class="detail-item"><span>Thời gian</span><strong>${log.duration}</strong></div><div class="detail-item"><span>Minh chứng</span><strong>${log.evidence || "Không có"}</strong></div></div></div>
    <div class="detail-section">${selfScoreNote}<div class="rating-grid">
      <div class="rating-control"><div class="rating-head"><div><h3>Độ phức tạp</h3><span class="metric-context">Bản chất và phạm vi công việc</span></div><span class="rating-value" id="complexityValue">${complexity}</span></div><input id="complexityRange" type="range" min="1" max="10" value="${complexity}" aria-label="Điểm độ phức tạp"><div class="range-labels"><span>Đơn giản</span><span>Đặc biệt phức tạp</span></div>${scoringGuideMarkup("complexity", complexity)}</div>
      <div class="rating-control"><div class="rating-head"><div><h3>Chất lượng</h3><span class="metric-context">Đúng, đủ, kịp thời và sử dụng được</span></div><span class="rating-value" id="qualityValue">${quality}</span></div><input id="qualityRange" type="range" min="1" max="10" value="${quality}" aria-label="Điểm chất lượng"><div class="range-labels"><span>Không đạt</span><span>Rất tốt</span></div>${scoringGuideMarkup("quality", quality)}</div>
    </div></div>
    <div class="detail-section"><label class="field"><span>Nhận xét của lãnh đạo</span><textarea id="reviewComment" rows="3" placeholder="Bắt buộc khi điểm chất lượng dưới 5 hoặc từ 9 trở lên"></textarea></label><div class="review-actions"><button class="button button-danger" id="requestRevision">Yêu cầu bổ sung</button><button class="button button-primary" id="approveLog">Xác nhận kết quả</button></div></div>`;
}

function bindReviewActions(log) {
  const complexity = document.getElementById("complexityRange");
  const quality = document.getElementById("qualityRange");
  complexity.addEventListener("input", () => updateScoringGuide("complexity", complexity.value));
  quality.addEventListener("input", () => updateScoringGuide("quality", quality.value));
  const acceptSelfScore = document.getElementById("acceptSelfScore");
  if (acceptSelfScore) acceptSelfScore.addEventListener("click", () => {
    complexity.value = log.selfComplexity;
    quality.value = log.selfQuality;
    updateScoringGuide("complexity", log.selfComplexity);
    updateScoringGuide("quality", log.selfQuality);
  });
  document.getElementById("approveLog").addEventListener("click", () => applyReview(log, "approved"));
  document.getElementById("requestRevision").addEventListener("click", () => applyReview(log, "revision"));
}

function applyReview(log, status) {
  const complexity = Number(document.getElementById("complexityRange").value);
  const quality = Number(document.getElementById("qualityRange").value);
  const comment = document.getElementById("reviewComment").value.trim();
  if ((quality < 5 || quality >= 9 || status === "revision") && !comment) {
    showToast("Vui lòng nhập nhận xét cho mức điểm hoặc quyết định này.");
    document.getElementById("reviewComment").focus();
    return;
  }
  const reviewer = currentUser();
  const reviewedAt = new Date().toISOString();
  Object.assign(log, { complexity, quality, comment, status, reviewerId: reviewer.id, reviewedAt });
  if (status === "approved") {
    log.scoringHistory = [...(log.scoringHistory || []), { reviewerId: reviewer.id, complexity, quality, comment, at: reviewedAt }];
  }
  // Nhat ky gan voi 1 viec duoc giao: duyet xong -> viec hoan thanh; tra
  // lai bo sung -> viec quay ve "cho thuc hien" (chua thuc su bao cao xong).
  if (log.taskAssignmentId) {
    const task = taskAssignments.find(item => item.id === log.taskAssignmentId);
    if (task) {
      task.status = status === "approved" ? "done" : "pending";
      saveTaskAssignments();
    }
  }
  saveLogs();
  // Canh bao chenh lech: dem theo TUNG CAN BO trong thang (khong phan biet
  // ai cham), bao cap tren cua NGUOI VUA CHAM khi vuot qua 3 lan.
  if (status === "approved" && log.selfComplexity != null && log.selfQuality != null
      && (complexity !== log.selfComplexity || quality !== log.selfQuality)) {
    const month = log.reviewedAt.slice(0, 7);
    const overrideCount = logs.filter(l => l.authorId === log.authorId && l.status === "approved"
      && l.selfComplexity != null && l.selfQuality != null && l.reviewedAt && l.reviewedAt.startsWith(month)
      && (l.complexity !== l.selfComplexity || l.quality !== l.selfQuality)).length;
    if (overrideCount > 3) {
      const superior = findSuperiorFor(reviewer);
      if (superior) {
        systemNotifications.push({
          id: `ON-${Date.now()}`, userId: superior.id, authorId: log.authorId, type: "escalation",
          title: "Chênh lệch điểm tự chấm vượt ngưỡng",
          message: `${userById(log.authorId).name} đã bị chấm điểm khác đề xuất tự chấm quá 3 lần trong tháng này.`,
          view: "unitJournal",
          createdAt: new Date().toISOString()
        });
        saveSystemNotifications();
      }
    }
  }
  state.selectedReviewId = null;
  state.editingJournalId = null;
  showToast(status === "approved" ? "Đã xác nhận và chấm điểm nhật ký." : "Đã gửi yêu cầu bổ sung.");
  renderReviews();
}

// ============================================
// CAP TREN DIEU CHINH DIEM DA CHAM CUA CAP DUOI - mo lai duoc ca nhat ky
// da duyet, dieu kien: nguoi xem hop le de duyet duoc CHINH nguoi da cham
// truoc do (dung lai canReviewLog voi "tac gia" gia = nguoi da cham).
// ============================================
let overridingLogId = null;

function openOverrideModal(logId) {
  const log = logs.find(item => item.id === logId);
  if (!log) return;
  overridingLogId = logId;
  const form = document.getElementById("overrideScoreForm");
  form.reset();
  form.elements.overrideComplexity.value = log.complexity ?? "";
  form.elements.overrideQuality.value = log.quality ?? "";
  document.getElementById("overrideScoreModal").hidden = false;
  form.elements.overrideComplexity.focus();
}

function closeOverrideModal() {
  overridingLogId = null;
  document.getElementById("overrideScoreModal").hidden = true;
}

function submitOverrideScore(event) {
  event.preventDefault();
  const log = logs.find(item => item.id === overridingLogId);
  if (!log) { closeOverrideModal(); return; }
  const data = new FormData(event.currentTarget);
  const complexity = Number(data.get("overrideComplexity"));
  const quality = Number(data.get("overrideQuality"));
  const comment = String(data.get("overrideComment") || "").trim();
  if (!comment) { showToast("Vui lòng nhập nhận xét khi điều chỉnh điểm."); return; }
  const previousReviewer = userById(log.reviewerId);
  const reviewer = currentUser();
  const reviewedAt = new Date().toISOString();
  Object.assign(log, { complexity, quality, comment, reviewerId: reviewer.id, reviewedAt });
  log.scoringHistory = [...(log.scoringHistory || []), { reviewerId: reviewer.id, complexity, quality, comment, at: reviewedAt }];
  saveLogs();
  const author = userById(log.authorId);
  const notifyTargets = [author, previousReviewer].filter(Boolean);
  notifyTargets.forEach(target => {
    systemNotifications.push({
      id: `ON-${Date.now()}-${target.id}`, userId: target.id, type: "score_overridden",
      title: "Điểm nhật ký đã bị lãnh đạo cấp trên thay đổi",
      message: `Công việc "${log.title}" đã bị lãnh đạo cấp trên thay đổi điểm.`,
      view: "unitJournal",
      createdAt: reviewedAt
    });
  });
  saveSystemNotifications();
  closeOverrideModal();
  showToast("Đã điều chỉnh điểm và gửi thông báo.");
  renderUnitJournalContent();
}

// ============================================
// XOA NHAT KY NHAP NHAM/NHAP SAI - tac gia tu xoa duoc khi con "cho duyet"/
// "can bo sung"; lanh dao hop le (dung pham vi da co san trong
// canReviewLog) xoa duoc nhat ky cap duoi o bat ky trang thai nao, nhung
// bat buoc nhap ly do va tac gia duoc thong bao ngay.
// ============================================
let deletingLogId = null;

function handleDeleteLogClick(button) {
  const logId = button.dataset.deleteLog;
  const isSelf = button.dataset.deleteSelf === "1";
  if (isSelf) {
    if (!confirm("Xoá nhật ký này? Không thể khôi phục lại.")) return;
    deleteWorkLog(logId, null);
  } else {
    openDeleteLogModal(logId);
  }
}

function openDeleteLogModal(logId) {
  deletingLogId = logId;
  const form = document.getElementById("deleteLogForm");
  form.reset();
  document.getElementById("deleteLogModal").hidden = false;
  form.elements.deleteLogReason.focus();
}

function closeDeleteLogModal() {
  deletingLogId = null;
  document.getElementById("deleteLogModal").hidden = true;
}

function submitDeleteLogForm(event) {
  event.preventDefault();
  const reason = String(new FormData(event.currentTarget).get("deleteLogReason") || "").trim();
  if (!reason) { showToast("Vui lòng nhập lý do xoá."); return; }
  if (!confirm("Xoá nhật ký này? Tác giả sẽ nhận được thông báo kèm lý do. Không thể khôi phục lại.")) return;
  const logId = deletingLogId;
  closeDeleteLogModal();
  deleteWorkLog(logId, reason);
}

function deleteWorkLog(logId, reason) {
  const index = logs.findIndex(item => item.id === logId);
  if (index === -1) return;
  const log = logs[index];
  if (reason) {
    systemNotifications.push({
      id: `ON-${Date.now()}-${log.authorId}`, userId: log.authorId, type: "work_log_deleted",
      title: "Nhật ký của bạn đã bị lãnh đạo xoá",
      message: `${currentUser().name} đã xoá nhật ký "${log.title}" ngày ${formatDate(log.date)}. Lý do: ${reason}`,
      view: "journal",
      createdAt: new Date().toISOString()
    });
    saveSystemNotifications();
  }
  logs.splice(index, 1);
  saveLogs();
  showToast("Đã xoá nhật ký.");
  if (state.currentView === "journal") renderJournal();
  else if (state.currentView === "unitJournal") renderUnitJournalContent();
}

// ============================================
// NHAT KY CONG TAC CUA DON VI - tra cuu lich su day du (khong chi pending)
// cho lanh dao, theo don vi/pham vi da co san.
// ============================================
function ujScopeUnitIds() { return visibleUnitIds().filter(id => id !== "province"); }

function ujScopePeople() {
  const user = currentUser();
  const scopeUnits = ujScopeUnitIds();
  return users.filter(p => scopeUnits.includes(p.unitId) && p.accountStatus !== "pending" && isVisibleInUnitScope(p, user));
}

function ujScopeLogs() {
  const user = currentUser();
  const scopeUnits = ujScopeUnitIds();
  const visibleAuthorIds = new Set(ujScopePeople().map(p => p.id));
  return logs.filter(l => scopeUnits.includes(l.unitId) && l.date.startsWith(state.ujPeriod) && (visibleAuthorIds.has(l.authorId) || l.authorId === user.id));
}

function ujFilteredPeople() {
  let list = state.ujUnitFilter === "all" ? ujScopePeople() : ujScopePeople().filter(p => p.unitId === state.ujUnitFilter);
  if (state.ujSearch) {
    const q = state.ujSearch.normalize("NFC").toLowerCase();
    list = list.filter(p => p.name.normalize("NFC").toLowerCase().includes(q));
  }
  return list;
}

function ujFilteredLogs() {
  const scoped = ujScopeLogs();
  return state.ujUnitFilter === "all" ? scoped : scoped.filter(l => l.unitId === state.ujUnitFilter);
}

function ujCountsByAuthor(logsList) {
  const map = {};
  logsList.forEach(l => {
    if (!map[l.authorId]) map[l.authorId] = { count: 0, last: null };
    map[l.authorId].count++;
    if (!map[l.authorId].last || l.date > map[l.authorId].last) map[l.authorId].last = l.date;
  });
  return map;
}

// Nhom theo ngay, moi ngay sap theo gio nop moi nhat truoc. An toan: log
// thieu ngay van gom vao 1 nhom rieng, khong bi rot khoi danh sach.
function groupLogsByDate(logsList) {
  const order = [], byDate = {};
  logsList.forEach(l => {
    const key = l.date || "__unknown__";
    if (!byDate[key]) { byDate[key] = { date: l.date || null, items: [] }; order.push(key); }
    byDate[key].items.push(l);
  });
  const groups = order.map(k => byDate[k]);
  groups.forEach(g => g.items.sort((a, b) => (submittedAtOf(b) || "").localeCompare(submittedAtOf(a) || "")));
  groups.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return groups;
}

function ujAuthorName(id) {
  const p = userById(id);
  return p ? p.name : "Không xác định";
}

// Ngay day du "dd/mm/yyyy" tu chuoi "YYYY-MM-DD", ghep truc tiep - tranh
// dao nguoc thu tu theo locale nguoi xem.
function fullDate(d) { if (!d) return ""; const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; }

function renderUnitJournal() {
  if (!isLeader()) { state.currentView = "dashboard"; renderDashboard(); return; }
  updateChrome("Nhật ký công tác của đơn vị", "TRA CỨU");
  const availableUnits = units.filter(u => ujScopeUnitIds().includes(u.id));
  const unitFilterHtml = availableUnits.length > 1 ? `<label class="filter-field"><span>Đơn vị</span><select id="ujUnitFilter"><option value="all">Tất cả đơn vị</option>${availableUnits.map(u => `<option value="${u.id}" ${state.ujUnitFilter === u.id ? "selected" : ""}>${u.short}</option>`).join("")}</select></label>` : "";
  const periodFilterHtml = `<label class="filter-field"><span>Kỳ</span><select id="ujPeriodFilter">${recentPeriods().map(p => `<option value="${p}" ${state.ujPeriod === p ? "selected" : ""}>${periodLabel(p)}</option>`).join("")}</select></label>`;
  const searchHtml = (state.ujMode === "person" && !state.ujSelectedPersonId) ? `<label class="field"><span>Tìm theo tên</span><input type="text" id="ujSearchInput" value="${state.ujSearch}" placeholder="Nhập tên..."></label>` : "";
  document.getElementById("appView").innerHTML = `
    <div class="toolbar uj-toolbar">
      <div class="uj-mode-toggle">
        <button type="button" class="uj-mode-btn ${state.ujMode === "person" ? "is-active" : ""}" data-uj-mode="person">Theo người</button>
        <button type="button" class="uj-mode-btn ${state.ujMode === "timeline" ? "is-active" : ""}" data-uj-mode="timeline">Theo thời gian</button>
      </div>${unitFilterHtml}${periodFilterHtml}${searchHtml}
    </div>
    <div id="ujContent"></div>`;
  renderUnitJournalContent();
  document.querySelectorAll("[data-uj-mode]").forEach(b => b.addEventListener("click", () => { state.ujMode = b.dataset.ujMode; renderUnitJournal(); }));
  const unitSel = document.getElementById("ujUnitFilter");
  if (unitSel) unitSel.addEventListener("change", e => { state.ujUnitFilter = e.target.value; state.ujSelectedPersonId = null; renderUnitJournal(); });
  document.getElementById("ujPeriodFilter").addEventListener("change", e => { state.ujPeriod = e.target.value; renderUnitJournal(); });
  const searchInput = document.getElementById("ujSearchInput");
  if (searchInput) searchInput.addEventListener("input", e => {
    state.ujSearch = e.target.value;
    const caret = searchInput.selectionStart;
    renderUnitJournalContent();
    const ni = document.getElementById("ujSearchInput");
    if (ni) { ni.focus(); ni.setSelectionRange(caret, caret); }
  });
}

function renderUnitJournalContent() {
  let html;
  if (state.ujMode === "timeline") html = renderUjTimelineHtml();
  else if (state.ujSelectedPersonId) html = renderUjPersonDetailHtml(state.ujSelectedPersonId);
  else html = renderUjPersonListHtml();
  document.getElementById("ujContent").innerHTML = html;
  document.querySelectorAll("[data-uj-person]").forEach(b => b.addEventListener("click", () => { state.ujSelectedPersonId = b.dataset.ujPerson; renderUnitJournalContent(); }));
  const back = document.getElementById("ujBackToList");
  if (back) back.addEventListener("click", () => { state.ujSelectedPersonId = null; renderUnitJournalContent(); });
  document.querySelectorAll("[data-uj-jump-person]").forEach(b => b.addEventListener("click", () => { state.ujMode = "person"; state.ujSelectedPersonId = b.dataset.ujJumpPerson; renderUnitJournal(); }));
  document.querySelectorAll("[data-override-score]").forEach(b => b.addEventListener("click", () => openOverrideModal(b.dataset.overrideScore)));
  document.querySelectorAll("[data-delete-log]").forEach(b => b.addEventListener("click", () => handleDeleteLogClick(b)));
}

// Tach rieng "Nguoi lao dong" (support_staff) khoi "Can bo/KSV" - truoc
// day 1 danh sach phang lam kho quet mat khi 1 don vi co toi 30-70 nguoi
// (lai xe, bao ve, phuc vu... xen lan voi KSV/lanh dao).
function ujPersonCardHtml(p, counts) {
  const c = counts[p.id] || { count: 0, last: null };
  return `<button type="button" class="uj-person-card" data-uj-person="${p.id}">
    <div class="uj-person-info"><strong>${p.name}</strong><span>${p.title} · ${unitById(p.unitId).short}</span></div>
    <div class="uj-person-stats"><span class="score-pill ${c.count ? "score-mid" : ""}">${c.count} nhật ký</span><span class="uj-last-date">${c.last ? `Gần nhất: ${fullDate(c.last)}` : "Chưa nộp trong kỳ"}</span></div>
  </button>`;
}

function renderUjPersonListHtml() {
  const people = ujFilteredPeople();
  if (!people.length) return `<div class="empty-state"><strong>Không có ai trong phạm vi này</strong></div>`;
  const counts = ujCountsByAuthor(ujFilteredLogs());
  const staffGroup = people.filter(p => p.role !== "support_staff");
  const supportGroup = people.filter(p => p.role === "support_staff");
  let h = "";
  if (staffGroup.length) h += `<div class="uj-group-heading">Cán bộ, công chức, Kiểm sát viên (${staffGroup.length})</div><div class="uj-person-list">${staffGroup.map(p => ujPersonCardHtml(p, counts)).join("")}</div>`;
  if (supportGroup.length) h += `<div class="uj-group-heading">Người lao động (${supportGroup.length})</div><div class="uj-person-list">${supportGroup.map(p => ujPersonCardHtml(p, counts)).join("")}</div>`;
  return h;
}

function renderUjPersonDetailHtml(personId) {
  const person = userById(personId);
  const personLogs = ujScopeLogs().filter(l => l.authorId === personId);
  const groups = groupLogsByDate(personLogs);
  let h = `<div class="uj-back"><button type="button" class="button button-secondary button-small" id="ujBackToList">← Quay lại danh sách</button></div>`;
  h += `<div class="panel-header"><div><h2>${person ? person.name : "Không xác định"}</h2><p>${person ? person.title : ""} · ${person ? unitById(person.unitId).short : ""}</p></div></div>`;
  h += groups.length ? groups.map(g => ujDateGroupHtml(g)).join("") : `<div class="empty-state"><strong>Không có nhật ký trong kỳ này</strong></div>`;
  return h;
}

function renderUjTimelineHtml() {
  const groups = groupLogsByDate(ujFilteredLogs());
  if (!groups.length) return `<div class="empty-state"><strong>Không có nhật ký trong kỳ này</strong></div>`;
  return groups.map(g => ujDateGroupHtml(g, true)).join("");
}

function ujDateGroupHtml(g, showAuthor) {
  const items = g.items.map((l, idx) => {
    const opts = { readOnly: true };
    if (showAuthor) { opts.authorName = ujAuthorName(l.authorId); opts.authorId = l.authorId; }
    return `<div class="uj-numbered-item"><span class="queue-index">${idx + 1}</span>${journalCard(l, opts)}</div>`;
  }).join("");
  return `<div class="uj-date-group"><div class="uj-date-group-header"><strong>${fullDate(g.date) || "Không xác định ngày"}</strong><span>${g.items.length} việc</span></div><div class="uj-date-items">${items}</div></div>`;
}

function monthlyScope() {
  const user = currentUser();
  let scopedUsers = users.filter(person => person.role !== "administrator");
  if (user.role === "staff" || user.role === "support_staff") scopedUsers = scopedUsers.filter(person => person.id === user.id);
  if (user.role === "unit_head" || user.role === "unit_deputy") scopedUsers = scopedUsers.filter(person => person.unitId === user.unitId && isVisibleInUnitScope(person, user));
  if (user.role === "province_deputy") scopedUsers = scopedUsers.filter(person => person.role === "unit_head" && (user.assignedUnits || []).includes(person.unitId));
  if (state.monthlyUnit !== "all") scopedUsers = scopedUsers.filter(person => person.unitId === state.monthlyUnit);
  return monthlyReviews.filter(review => review.period === state.monthlyPeriod && scopedUsers.some(person => person.id === review.userId));
}

function canApproveMonthly(person, reviewer = currentUser()) {
  if (!person || person.id === reviewer.id) return false;
  if (reviewer.role === "province_head") return person.role === "province_deputy" || person.role === "unit_head";
  if (reviewer.role === "province_deputy") return person.role === "unit_head" && (reviewer.assignedUnits || []).includes(person.unitId);
  if (reviewer.role === "unit_head") return person.unitId === reviewer.unitId && person.role !== "unit_head";
  if (reviewer.role === "unit_deputy") return hasActiveDelegation(reviewer.id) && person.unitId === reviewer.unitId && person.role !== "unit_head";
  return false;
}

function journalEvidence(userId) {
  const items = logs.filter(log => log.authorId === userId);
  const reviewed = items.filter(log => ["approved", "revision"].includes(log.status));
  const approved = items.filter(log => log.status === "approved");
  return {
    total: items.length,
    approved: approved.length,
    pending: items.filter(log => log.status === "pending").length,
    revision: items.filter(log => log.status === "revision").length,
    complexity: approved.reduce((sum, log) => sum + (log.complexity || 0), 0),
    quality: weightedQuality(approved),
    reviewRate: items.length ? reviewed.length / items.length * 100 : 0
  };
}

function renderMonthly() {
  const user = currentUser();
  const rows = monthlyScope();
  const approved = rows.filter(row => row.status === "approved");
  const counts = ["A", "B", "C"].reduce((result, grade) => ({ ...result, [grade]: approved.filter(row => row.classification === grade).length }), {});
  const deltas = approved.filter(row => Number.isFinite(row.selfScore)).map(row => Math.abs(row.officialScore - row.selfScore));
  const averageDelta = deltas.length ? average(deltas) : 0;
  const provinceScope = ["province_head", "administrator"].includes(user.role);
  const visibleUnits = units.filter(unit => unit.id !== "province" && visibleUnitIds(user).includes(unit.id));
  const unitFilter = provinceScope ? `<label class="filter-field"><span>Đơn vị</span><select id="monthlyUnitFilter"><option value="all">Tất cả đơn vị</option>${visibleUnits.map(unit => `<option value="${unit.id}" ${state.monthlyUnit === unit.id ? "selected" : ""}>${unit.short}</option>`).join("")}</select></label>` : "";
  if (!state.selectedMonthlyUserId || !rows.some(row => row.userId === state.selectedMonthlyUserId)) state.selectedMonthlyUserId = rows[0]?.userId || null;
  const selected = rows.find(row => row.userId === state.selectedMonthlyUserId);

  updateChrome("Chấm điểm và xếp loại tháng", `KẾT QUẢ ${periodLabel(state.monthlyPeriod).toUpperCase()}`);
  document.getElementById("appView").innerHTML = `
    <div class="demo-notice"><strong>Dữ liệu tham chiếu</strong><span>Danh mục và điểm ${periodLabel(state.monthlyPeriod).toLowerCase()} lấy từ bảng tổng hợp đã cung cấp (hoặc mô phỏng cho các kỳ khác). Demo đang nạp 32 hồ sơ đại diện trong tổng số 428 cán bộ, công chức và người lao động.</span></div>
    <div class="toolbar">
      <label class="filter-field"><span>Kỳ đánh giá</span><select id="monthlyPeriodFilter">${recentPeriods().map(period => `<option value="${period}" ${state.monthlyPeriod === period ? "selected" : ""}>${periodLabel(period)}${period === recentPeriods()[0] ? " · Đang chấm" : " · Đã chốt"}</option>`).join("")}</select></label>
      ${unitFilter}<label class="field"><span>Tìm theo tên</span><input type="text" id="monthlySearchInput" value="${state.monthlySearch}" placeholder="Nhập tên..."></label><div class="spacer"></div><button class="button button-secondary" id="exportMonthly">Xuất báo cáo tháng</button>
    </div>
    <div class="metric-grid">
      ${metricCard("Hồ sơ trong phạm vi", rows.length, `${approved.length} hồ sơ đã duyệt`, "")}
      ${metricCard("Xếp loại A", counts.A || 0, `${counts.B || 0} xếp loại B`, "green")}
      ${metricCard("Chênh lệch bình quân", averageDelta.toFixed(1), "Điểm tự chấm ↔ điểm chính thức", "gold")}
      ${metricCard("Chờ hoàn thành", rows.length - approved.length, "Tự chấm hoặc chờ duyệt", "blue")}
    </div>
    <div class="monthly-layout">
      <section class="panel monthly-table-panel">
        <div class="panel-header"><div><h2>Danh sách đánh giá tháng</h2><p>Giữ nguyên cấu trúc điểm tự chấm, điểm duyệt chính thức và xếp loại hiện hành</p></div></div>
        ${monthlyTable(monthlyFilteredRows(rows))}
      </section>
      <section class="panel monthly-detail">${selected ? monthlyDetail(selected) : `<div class="empty-state"><strong>Không có hồ sơ</strong>Chưa có dữ liệu phù hợp với phạm vi này.</div>`}</section>
    </div>`;

  document.querySelectorAll("[data-monthly-user]").forEach(button => button.addEventListener("click", () => { state.selectedMonthlyUserId = button.dataset.monthlyUser; renderMonthly(); }));
  const filter = document.getElementById("monthlyUnitFilter");
  if (filter) filter.addEventListener("change", event => { state.monthlyUnit = event.target.value; saveFilterPrefs({ monthlyUnit: state.monthlyUnit }); state.selectedMonthlyUserId = null; renderMonthly(); });
  document.getElementById("monthlyPeriodFilter").addEventListener("change", event => { state.monthlyPeriod = event.target.value; saveFilterPrefs({ monthlyPeriod: state.monthlyPeriod }); state.selectedMonthlyUserId = null; renderMonthly(); });
  const monthlySearchInput = document.getElementById("monthlySearchInput");
  monthlySearchInput.addEventListener("input", event => {
    state.monthlySearch = event.target.value;
    const focusPos = monthlySearchInput.selectionStart;
    renderMonthly();
    const newInput = document.getElementById("monthlySearchInput");
    newInput.focus();
    newInput.setSelectionRange(focusPos, focusPos);
  });
  document.getElementById("exportMonthly").addEventListener("click", openExportModal);
  const saveButton = document.getElementById("saveMonthlyReview");
  if (saveButton && selected) saveButton.addEventListener("click", () => saveMonthlyReview(selected));
  const officialScoreInput = document.getElementById("officialScore");
  const classificationSelect = document.getElementById("classification");
  if (officialScoreInput && classificationSelect) officialScoreInput.addEventListener("input", () => {
    const suggestion = classificationFromScore(officialScoreInput.value);
    if (suggestion) classificationSelect.value = suggestion;
  });
  const selfButton = document.getElementById("saveSelfScore");
  if (selfButton && selected) selfButton.addEventListener("click", () => saveSelfScore(selected));
  const headSelfButton = document.getElementById("saveHeadSelfEvaluation");
  if (headSelfButton && selected) headSelfButton.addEventListener("click", () => saveHeadSelfEvaluation(selected));
  const headSelfScoreInput = document.getElementById("headSelfScore");
  const headSelfClassificationSelect = document.getElementById("headSelfClassification");
  if (headSelfScoreInput && headSelfClassificationSelect) headSelfScoreInput.addEventListener("input", () => {
    const suggestion = classificationFromScore(headSelfScoreInput.value);
    if (suggestion) headSelfClassificationSelect.value = suggestion;
  });
}

// Loc theo ten - can thiet tu khi 1 don vi co toi 30-70 nguoi thay vi
// vai nguoi nhu truoc, cuon tim thu cong rat lau. Chi loc bang, khong
// dong lai metric-grid/chi tiet ben phai.
function monthlyFilteredRows(rows) {
  if (!state.monthlySearch) return rows;
  const q = state.monthlySearch.normalize("NFC").toLowerCase();
  return rows.filter(row => userById(row.userId).name.normalize("NFC").toLowerCase().includes(q));
}

function monthlyRowHtml(row) {
  const person = userById(row.userId);
  const selected = row.userId === state.selectedMonthlyUserId;
  return `<tr class="${selected ? "is-selected-row" : ""}"><td><div class="person-cell"><span class="mini-avatar">${person.initials}</span><div><strong>${person.name}</strong><span>${person.professionalTitle || ""}</span></div></div></td><td>${person.title}</td><td>${unitById(person.unitId).short}</td><td class="numeric">${row.selfScore ?? "—"}</td><td class="numeric"><strong>${row.officialScore ?? "—"}</strong></td><td class="numeric"><span class="grade-badge grade-${(row.classification || "pending").toLowerCase()}">${row.classification || "Chờ"}</span></td><td class="numeric"><button class="button button-secondary button-small" data-monthly-user="${person.id}">Xem căn cứ</button></td></tr>`;
}

// Tach rieng "Nguoi lao dong" (support_staff) khoi "Can bo/KSV" bang 1
// dong tieu de gom nhom (colspan) - cung ly do voi renderUjPersonListHtml.
function monthlyTable(rows) {
  if (!rows.length) return `<div class="empty-state"><strong>Không có dữ liệu</strong>Hãy chọn phạm vi khác.</div>`;
  const staffRows = rows.filter(row => userById(row.userId).role !== "support_staff");
  const supportRows = rows.filter(row => userById(row.userId).role === "support_staff");
  let body = "";
  if (staffRows.length) body += `<tr class="table-group-row"><td colspan="7">Cán bộ, công chức, Kiểm sát viên (${staffRows.length})</td></tr>${staffRows.map(monthlyRowHtml).join("")}`;
  if (supportRows.length) body += `<tr class="table-group-row"><td colspan="7">Người lao động (${supportRows.length})</td></tr>${supportRows.map(monthlyRowHtml).join("")}`;
  return `<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Chức vụ, chức danh</th><th>Đơn vị</th><th class="numeric">Tự chấm</th><th class="numeric">Chính thức</th><th class="numeric">Xếp loại</th><th></th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function monthlyDetail(row) {
  const person = userById(row.userId);
  const evidence = journalEvidence(person.id);
  const mayApprove = canApproveMonthly(person);
  const isSelf = currentUser().id === person.id;
  return `<div class="panel-header"><div><span class="eyebrow">HỒ SƠ ĐÁNH GIÁ THÁNG</span><h2>${person.name}</h2><p>${person.title} · ${person.professionalTitle || ""} · ${unitById(person.unitId).short}</p></div><span class="grade-seal grade-${(row.classification || "pending").toLowerCase()}">${row.classification || "…"}</span></div>
    <div class="evidence-grid">
      <div><span>Nhật ký</span><strong>${evidence.total}</strong></div><div><span>Được công nhận</span><strong>${evidence.approved}</strong></div><div><span>Tổng phức tạp</span><strong>${evidence.complexity}</strong></div><div><span>Chất lượng trọng số</span><strong>${evidence.quality ? evidence.quality.toFixed(1) : "—"}</strong></div>
    </div>
    <div class="detail-section"><h3>Căn cứ hỗ trợ quyết định</h3><p class="metric-context">Dữ liệu nhật ký chỉ là căn cứ tham khảo; người có thẩm quyền vẫn quyết định điểm chính thức và xếp loại theo quy định.</p><div class="progress-line"><span>Tỷ lệ nhật ký đã xử lý</span><strong>${evidence.reviewRate.toFixed(0)}%</strong><div class="bar-track"><div class="bar-fill green" style="width:${evidence.reviewRate}%"></div></div></div></div>
    <div class="detail-section"><div class="detail-grid"><div class="detail-item"><span>Điểm tự chấm</span><strong>${row.selfScore ?? "Chưa có"}</strong></div><div class="detail-item"><span>Điểm được duyệt</span><strong>${row.officialScore ?? "Chưa duyệt"}</strong></div></div></div>
    ${mayApprove ? `<div class="detail-section"><div class="form-grid compact-form"><label class="field"><span>Điểm chính thức</span><input id="officialScore" type="number" min="0" max="100" step="0.25" value="${row.officialScore ?? row.selfScore ?? 0}"></label><label class="field"><span>Xếp loại</span><select id="classification"><option ${row.classification === "A" ? "selected" : ""}>A</option><option ${row.classification === "B" ? "selected" : ""}>B</option><option ${row.classification === "C" ? "selected" : ""}>C</option><option ${row.classification === "D" ? "selected" : ""}>D</option></select></label><label class="field field-wide"><span>Nhận xét/giải trình điều chỉnh</span><textarea id="monthlyNote" rows="2">${row.note || ""}</textarea></label></div><div class="review-actions"><button class="button button-primary" id="saveMonthlyReview">Duyệt và lưu</button></div></div>` : ""}
    ${isSelf && person.role === "province_head" ? `<div class="detail-section"><p class="metric-context">Viện trưởng tỉnh không có cấp trên trong hệ thống nên tự chấm điểm và tự xếp loại; không có điểm duyệt chính thức.</p><div class="form-grid compact-form"><label class="field"><span>Điểm tự chấm</span><input id="headSelfScore" type="number" min="0" max="100" step="0.25" value="${row.selfScore ?? 0}"></label><label class="field"><span>Xếp loại</span><select id="headSelfClassification"><option ${row.classification === "A" ? "selected" : ""}>A</option><option ${row.classification === "B" ? "selected" : ""}>B</option><option ${row.classification === "C" ? "selected" : ""}>C</option><option ${row.classification === "D" ? "selected" : ""}>D</option></select></label></div><div class="review-actions"><button class="button button-primary" id="saveHeadSelfEvaluation">Lưu điểm và xếp loại</button></div></div>` : ""}
    ${isSelf && person.role !== "province_head" ? `<div class="detail-section"><label class="field"><span>Điểm tự chấm của cá nhân</span><input id="selfScore" type="number" min="0" max="100" step="0.25" value="${row.selfScore ?? 0}"></label><div class="review-actions"><button class="button button-primary" id="saveSelfScore">Lưu điểm tự chấm</button></div></div>` : ""}
    ${!mayApprove && !isSelf ? `<div class="permission-note">Vai trò hiện tại chỉ được xem hồ sơ này; không có quyền thay đổi kết quả.</div>` : ""}`;
}

function saveMonthlyReview(row) {
  const score = Number(document.getElementById("officialScore").value);
  const classification = document.getElementById("classification").value;
  const note = document.getElementById("monthlyNote").value.trim();
  if (!Number.isFinite(score) || score < 0 || score > 100) return showToast("Điểm chính thức phải nằm trong khoảng 0–100.");
  if (Number.isFinite(row.selfScore) && Math.abs(score - row.selfScore) >= 2 && !note) return showToast("Vui lòng nhập giải trình khi điều chỉnh từ 2 điểm trở lên.");
  Object.assign(row, { officialScore: score, classification, note, status: "approved", approvedAt: new Date().toISOString(), approverId: currentUser().id });
  localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(monthlyReviews));
  showToast("Đã lưu điểm chính thức và xếp loại.");
  renderMonthly();
}

function saveSelfScore(row) {
  const score = Number(document.getElementById("selfScore").value);
  if (!Number.isFinite(score) || score < 0 || score > 100) return showToast("Điểm tự chấm phải nằm trong khoảng 0–100.");
  row.selfScore = score;
  if (row.status !== "approved") row.status = "pending";
  localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(monthlyReviews));
  showToast("Đã lưu điểm tự chấm và gửi người có thẩm quyền.");
  renderMonthly();
}

function saveHeadSelfEvaluation(row) {
  const score = Number(document.getElementById("headSelfScore").value);
  const classification = document.getElementById("headSelfClassification").value;
  if (!Number.isFinite(score) || score < 0 || score > 100) return showToast("Điểm tự chấm phải nằm trong khoảng 0–100.");
  Object.assign(row, { selfScore: score, classification, status: "approved", approvedAt: new Date().toISOString(), approverId: currentUser().id });
  localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(monthlyReviews));
  showToast("Đã lưu điểm tự chấm và tự xếp loại.");
  renderMonthly();
}

// ============================================
// XUAT BAO CAO THANG - hop thoai chon ky, canh bao thieu du lieu, xuat
// Excel (chinh sua duoc) hoac PDF (de in, tranh sua du lieu).
// ============================================
function monthlyExportScope(period) {
  const user = currentUser();
  let scopedUsers = users.filter(person => person.role !== "administrator");
  if (user.role === "staff" || user.role === "support_staff") scopedUsers = scopedUsers.filter(person => person.id === user.id);
  if (user.role === "unit_head" || user.role === "unit_deputy") scopedUsers = scopedUsers.filter(person => person.unitId === user.unitId && isVisibleInUnitScope(person, user));
  if (user.role === "province_deputy") scopedUsers = scopedUsers.filter(person => person.role === "unit_head" && (user.assignedUnits || []).includes(person.unitId));
  return scopedUsers.map(person => ({ person, review: monthlyReviews.find(r => r.period === period && r.userId === person.id) || null }));
}

function monthlyExportSections(period) {
  const scope = monthlyExportScope(period);
  const groupA = scope.filter(item => ["province_head", "province_deputy", "unit_head"].includes(item.person.role))
    .sort((a, b) => a.person.name.localeCompare(b.person.name, "vi"));
  const groupB = scope.filter(item => ["unit_deputy", "staff"].includes(item.person.role))
    .sort((a, b) => unitDisplayName(a.person.unitId).localeCompare(unitDisplayName(b.person.unitId), "vi") || a.person.name.localeCompare(b.person.name, "vi"));
  const groupC = scope.filter(item => item.person.role === "support_staff")
    .sort((a, b) => unitDisplayName(a.person.unitId).localeCompare(unitDisplayName(b.person.unitId), "vi") || a.person.name.localeCompare(b.person.name, "vi"));
  return [
    { title: "I. VIỆN TRƯỞNG VIỆN KSND TỈNH BẮC NINH ĐÁNH GIÁ, CHẤM ĐIỂM, XẾP LOẠI", items: groupA },
    { title: "II. THỦ TRƯỞNG ĐƠN VỊ CƠ SỞ ĐÁNH GIÁ, CHẤM ĐIỂM, XẾP LOẠI CÁN BỘ, CÔNG CHỨC", items: groupB },
    // STT rieng cho nhom Nguoi lao dong, dung mau goc (khac 2 nhom tren chay STT lien tuc)
    { title: "III. THỦ TRƯỞNG ĐƠN VỊ CƠ SỞ ĐÁNH GIÁ, CHẤM ĐIỂM, XẾP LOẠI NGƯỜI LAO ĐỘNG", items: groupC, resetStt: true }
  ];
}

// Diem duyet chinh thuc cua Vien truong tinh khong tinh la "thieu" - theo
// thiet ke, ho tu cham va tu xep loai, khong ai duyet chinh thuc cho ho.
function monthlyExportCompleteness(period) {
  const scope = monthlyExportScope(period);
  let missingSelf = 0, missingOfficial = 0, missingClassification = 0, officialApplicable = 0;
  const byUnit = {};
  scope.forEach(({ person, review }) => {
    const missing = [];
    if (!review || review.selfScore == null) { missing.push("chưa tự chấm điểm"); missingSelf++; }
    if (person.role !== "province_head") {
      officialApplicable++;
      if (!review || review.officialScore == null) { missing.push("chưa có điểm duyệt chính thức"); missingOfficial++; }
    }
    if (!review || review.classification == null) { missing.push("chưa xếp loại"); missingClassification++; }
    if (missing.length) {
      if (!byUnit[person.unitId]) byUnit[person.unitId] = [];
      byUnit[person.unitId].push({ person, missing });
    }
  });
  return { total: scope.length, missingSelf, missingOfficial, missingClassification, officialApplicable, byUnit };
}

function openExportModal() {
  const select = document.getElementById("exportPeriodSelect");
  select.innerHTML = recentPeriods().map(period => `<option value="${period}" ${period === state.monthlyPeriod ? "selected" : ""}>${periodLabel(period)}</option>`).join("");
  renderExportSummary(select.value);
  document.getElementById("exportModal").hidden = false;
}

function closeExportModal() {
  document.getElementById("exportModal").hidden = true;
}

function renderExportSummary(period) {
  const stats = monthlyExportCompleteness(period);
  document.getElementById("exportSummary").innerHTML = `<div class="demo-notice export-summary-notice"><strong>Kiểm tra trước khi xuất</strong><span>${stats.total - stats.missingSelf}/${stats.total} đã tự chấm điểm · ${stats.officialApplicable - stats.missingOfficial}/${stats.officialApplicable} đã có điểm duyệt chính thức · ${stats.total - stats.missingClassification}/${stats.total} đã xếp loại. Người còn thiếu sẽ để trống ô tương ứng khi xuất, không chờ.</span></div>`;
  const unitIds = Object.keys(stats.byUnit).sort((a, b) => unitDisplayName(a).localeCompare(unitDisplayName(b), "vi"));
  document.getElementById("exportIncompleteGroups").innerHTML = unitIds.length ? unitIds.map(unitId => {
    const items = stats.byUnit[unitId];
    return `<details class="unit-group"><summary><strong>${unitDisplayName(unitId)}</strong><span>${items.length} người còn thiếu</span></summary><div class="export-missing-list">${items.map(item => `<div class="export-missing-row"><strong>${item.person.name}</strong><span>${item.missing.join(", ")}</span></div>`).join("")}</div></details>`;
  }).join("") : `<div class="empty-state compact-empty"><strong>Đã đầy đủ dữ liệu</strong>Tất cả nhân sự trong phạm vi đã tự chấm điểm, được duyệt điểm chính thức và xếp loại.</div>`;
}

const EXCEL_BORDER = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };

async function exportMonthlyExcel(period) {
  const sections = monthlyExportSections(period);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tổng hợp", { pageSetup: { orientation: "landscape", fitToPage: true } });
  sheet.columns = [{ width: 6 }, { width: 26 }, { width: 20 }, { width: 18 }, { width: 24 }, { width: 12 }, { width: 10 }, { width: 10 }];

  let r = 1;
  sheet.mergeCells(`A${r}:D${r}`);
  sheet.getCell(`A${r}`).value = "VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO";
  sheet.getCell(`A${r}`).font = { bold: true, underline: true, name: "Times New Roman", size: 12 };
  sheet.mergeCells(`E${r}:H${r}`);
  sheet.getCell(`E${r}`).value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
  sheet.getCell(`E${r}`).font = { bold: true, name: "Times New Roman", size: 12 };
  sheet.getCell(`E${r}`).alignment = { horizontal: "center" };
  r++;
  sheet.mergeCells(`A${r}:D${r}`);
  sheet.getCell(`A${r}`).value = "VIỆN KIỂM SÁT NHÂN DÂN TỈNH BẮC NINH";
  sheet.getCell(`A${r}`).font = { bold: true, underline: true, name: "Times New Roman", size: 12 };
  sheet.mergeCells(`E${r}:H${r}`);
  sheet.getCell(`E${r}`).value = "Độc lập - Tự do - Hạnh phúc";
  sheet.getCell(`E${r}`).font = { bold: true, underline: true, name: "Times New Roman", size: 12 };
  sheet.getCell(`E${r}`).alignment = { horizontal: "center" };
  r += 2;
  sheet.mergeCells(`A${r}:H${r}`);
  sheet.getCell(`A${r}`).value = "THÔNG BÁO";
  sheet.getCell(`A${r}`).font = { bold: true, size: 14, name: "Times New Roman" };
  sheet.getCell(`A${r}`).alignment = { horizontal: "center" };
  r++;
  sheet.mergeCells(`A${r}:H${r}`);
  sheet.getCell(`A${r}`).value = "Tổng hợp kết quả đánh giá, chấm điểm, xếp loại công chức và người lao động";
  sheet.getCell(`A${r}`).font = { bold: true, name: "Times New Roman", size: 12 };
  sheet.getCell(`A${r}`).alignment = { horizontal: "center" };
  r++;
  const [exportYear, exportMonth] = period.split("-");
  sheet.mergeCells(`A${r}:H${r}`);
  sheet.getCell(`A${r}`).value = `tháng ${Number(exportMonth)} năm ${exportYear}`;
  sheet.getCell(`A${r}`).font = { italic: true, name: "Times New Roman", size: 12 };
  sheet.getCell(`A${r}`).alignment = { horizontal: "center" };
  r += 2;

  const headerRow1 = r, headerRow2 = r + 1;
  sheet.mergeCells(`A${headerRow1}:A${headerRow2}`); sheet.getCell(`A${headerRow1}`).value = "Số TT";
  sheet.mergeCells(`B${headerRow1}:B${headerRow2}`); sheet.getCell(`B${headerRow1}`).value = "Họ và tên";
  sheet.mergeCells(`C${headerRow1}:D${headerRow1}`); sheet.getCell(`C${headerRow1}`).value = "Chức vụ, chức danh";
  sheet.getCell(`C${headerRow2}`).value = "Chức vụ";
  sheet.getCell(`D${headerRow2}`).value = "Chức danh";
  sheet.mergeCells(`E${headerRow1}:E${headerRow2}`); sheet.getCell(`E${headerRow1}`).value = "Đơn vị công tác";
  sheet.mergeCells(`F${headerRow1}:F${headerRow2}`); sheet.getCell(`F${headerRow1}`).value = "Điểm tự chấm";
  sheet.mergeCells(`G${headerRow1}:H${headerRow1}`); sheet.getCell(`G${headerRow1}`).value = "Điểm được duyệt chính thức";
  sheet.getCell(`G${headerRow2}`).value = "Điểm";
  sheet.getCell(`H${headerRow2}`).value = "Xếp loại";
  ["A", "B", "C", "D", "E", "F", "G", "H"].forEach(col => [headerRow1, headerRow2].forEach(row => {
    const cell = sheet.getCell(`${col}${row}`);
    cell.font = { bold: true, name: "Times New Roman", size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = EXCEL_BORDER;
  }));
  r = headerRow2 + 1;

  let stt = 1;
  sections.forEach(section => {
    if (!section.items.length) return;
    if (section.resetStt) stt = 1;
    sheet.mergeCells(`A${r}:H${r}`);
    const titleCell = sheet.getCell(`A${r}`);
    titleCell.value = section.title;
    titleCell.font = { bold: true, name: "Times New Roman", size: 11 };
    r++;
    section.items.forEach(({ person, review }) => {
      sheet.getCell(`A${r}`).value = stt++;
      sheet.getCell(`B${r}`).value = person.name;
      sheet.getCell(`C${r}`).value = person.title || "";
      sheet.getCell(`D${r}`).value = person.professionalTitle || "";
      sheet.getCell(`E${r}`).value = unitDisplayName(person.unitId);
      sheet.getCell(`F${r}`).value = review?.selfScore ?? "";
      sheet.getCell(`G${r}`).value = person.role === "province_head" ? "" : (review?.officialScore ?? "");
      sheet.getCell(`H${r}`).value = review?.classification ?? "";
      ["A", "B", "C", "D", "E", "F", "G", "H"].forEach(col => {
        const cell = sheet.getCell(`${col}${r}`);
        cell.border = EXCEL_BORDER;
        cell.font = { name: "Times New Roman", size: 11 };
        if (["A", "F", "G", "H"].includes(col)) cell.alignment = { horizontal: "center" };
      });
      r++;
    });
  });

  r++;
  const today = new Date();
  sheet.mergeCells(`E${r}:H${r}`);
  sheet.getCell(`E${r}`).value = `Bắc Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  sheet.getCell(`E${r}`).font = { italic: true, name: "Times New Roman", size: 11 };
  sheet.getCell(`E${r}`).alignment = { horizontal: "center" };
  r++;
  sheet.mergeCells(`E${r}:H${r}`);
  sheet.getCell(`E${r}`).value = "VIỆN TRƯỞNG";
  sheet.getCell(`E${r}`).font = { bold: true, name: "Times New Roman", size: 12 };
  sheet.getCell(`E${r}`).alignment = { horizontal: "center" };
  r += 3;
  const head = users.find(person => person.role === "province_head");
  sheet.mergeCells(`E${r}:H${r}`);
  sheet.getCell(`E${r}`).value = head ? head.name : "";
  sheet.getCell(`E${r}`).font = { bold: true, name: "Times New Roman", size: 12 };
  sheet.getCell(`E${r}`).alignment = { horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  link.download = `tong-hop-cham-diem-${period}-demo.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Đã xuất file Excel.");
}

const PDF_EXPORT_CSS = `
  .pdf-export-root { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #111; background: #fff; padding: 14mm; box-sizing: border-box; }
  .pdf-export-root .letterhead { display: flex; justify-content: space-between; margin-bottom: 16px; }
  .pdf-export-root .letterhead div { text-align: center; }
  .pdf-export-root .letterhead strong { display: block; text-decoration: underline; }
  .pdf-export-root h1 { text-align: center; font-size: 15pt; margin: 4px 0; }
  .pdf-export-root .subtitle { text-align: center; font-weight: bold; margin: 2px 0; }
  .pdf-export-root .period { text-align: center; font-style: italic; margin: 2px 0 16px; }
  .pdf-export-root table { width: 100%; border-collapse: collapse; }
  .pdf-export-root th, .pdf-export-root td { border: 1px solid #333; padding: 4px 6px; font-size: 10.5pt; }
  .pdf-export-root th { text-align: center; font-weight: bold; }
  .pdf-export-root td.c { text-align: center; }
  .pdf-export-root tr { break-inside: avoid; page-break-inside: avoid; }
  .pdf-export-root .section-row td { font-weight: bold; text-align: left; background: #f3f3f3; }
  .pdf-export-root .signature { margin-top: 26px; width: 100%; }
  .pdf-export-root .signature td { border: none; text-align: center; }
  .pdf-export-root .sig-title { font-weight: bold; }
  .pdf-export-root .sig-date { font-style: italic; }
`;

function monthlyReportBodyHtml(period) {
  const sections = monthlyExportSections(period);
  const head = users.find(person => person.role === "province_head");
  const [reportYear, reportMonth] = period.split("-");
  const today = new Date();
  let stt = 0;
  const rowsHtml = sections.map(section => {
    if (!section.items.length) return "";
    if (section.resetStt) stt = 0;
    const body = section.items.map(({ person, review }) => {
      stt++;
      return `<tr><td class="c">${stt}</td><td>${person.name}</td><td>${person.title || ""}</td><td>${person.professionalTitle || ""}</td><td>${unitDisplayName(person.unitId)}</td><td class="c">${review?.selfScore ?? ""}</td><td class="c">${person.role === "province_head" ? "" : (review?.officialScore ?? "")}</td><td class="c">${review?.classification ?? ""}</td></tr>`;
    }).join("");
    return `<tr class="section-row"><td colspan="8">${section.title}</td></tr>${body}`;
  }).join("");
  return `
    <div class="letterhead">
      <div><strong>VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO</strong><span>VIỆN KIỂM SÁT NHÂN DÂN TỈNH BẮC NINH</span></div>
      <div><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><span style="text-decoration:underline">Độc lập - Tự do - Hạnh phúc</span></div>
    </div>
    <h1>THÔNG BÁO</h1>
    <div class="subtitle">Tổng hợp kết quả đánh giá, chấm điểm, xếp loại công chức và người lao động</div>
    <div class="period">tháng ${Number(reportMonth)} năm ${reportYear}</div>
    <table>
      <thead><tr><th rowspan="2">Số TT</th><th rowspan="2">Họ và tên</th><th colspan="2">Chức vụ, chức danh</th><th rowspan="2">Đơn vị công tác</th><th rowspan="2">Điểm tự chấm</th><th colspan="2">Điểm được duyệt chính thức</th></tr>
      <tr><th>Chức vụ</th><th>Chức danh</th><th>Điểm</th><th>Xếp loại</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <table class="signature"><tr><td style="width:50%"></td><td style="width:50%"><span class="sig-date">Bắc Ninh, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</span><br><span class="sig-title">VIỆN TRƯỞNG</span><br><br><br><br><strong>${head ? head.name : ""}</strong></td></tr></table>`;
}

// Xuat PDF that (tai xuong 1 lan bam), khong qua hop thoai in cua trinh
// duyet - dung html2canvas de "chup" chinh xac phan da render bang CSS
// Times New Roman cua trinh duyet (chu tieng Viet luon dung, khong can
// nhung font rieng cho jsPDF), roi tu cat thanh nhieu trang qua jsPDF.
// Dung truc tiep html2canvas+jsPDF (khong qua html2pdf.js) vi ham
// toContainer() cua html2pdf.js bien phan tu muc tieu thanh con cua 1 wrapper
// position:absolute rieng cua no - phan tu muc tieu van con "position" inline
// nen bi dua ra khoi luong binh thuong va khong dong gop chieu cao cho
// wrapper do, khien html2canvas do duoc chieu cao = 0 va xuat ra PDF trang.
async function exportMonthlyPdf(period) {
  if (typeof html2canvas === "undefined" || typeof window.jspdf === "undefined") { showToast("Chưa tải được thư viện xuất PDF, thử lại sau."); return; }
  let styleEl = document.getElementById("pdfExportStyle");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "pdfExportStyle";
    styleEl.textContent = PDF_EXPORT_CSS;
    document.head.appendChild(styleEl);
  }
  const container = document.createElement("div");
  container.className = "pdf-export-root";
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.style.width = "1600px";
  container.innerHTML = monthlyReportBodyHtml(period);
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a3", orientation: "landscape" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidthMm = pageWidth;
    const imgHeightMm = canvas.height * imgWidthMm / canvas.width;
    let heightLeft = imgHeightMm;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeight;
    }
    pdf.save(`tong-hop-cham-diem-${period}-demo.pdf`);
    showToast("Đã xuất file PDF.");
  } catch (e) {
    showToast("Lỗi khi xuất PDF: " + e.message);
  } finally {
    container.remove();
  }
}

const ROLE_LABELS = { province_head: "Viện trưởng tỉnh", province_deputy: "Phó Viện trưởng tỉnh", unit_head: "Trưởng phòng/Viện trưởng KV", unit_deputy: "Phó phòng/Phó Viện trưởng KV", staff: "Cán bộ/Kiểm sát viên", support_staff: "Người lao động", administrator: "Quản trị viên" };
const ROLE_OPTIONS = ["staff", "support_staff", "unit_deputy", "unit_head", "province_deputy", "province_head", "administrator"];

function renderOrganization() {
  // Trang nay gio bao gom gan vai tro/don vi va khoa/mo tai khoan, chi danh
  // cho Vien truong tinh va QTV - giong pham vi ban chinh thuc.
  if (!(isAdministrator() || currentUser().role === "province_head")) { state.currentView = "dashboard"; renderDashboard(); return; }
  updateChrome("Cơ cấu và phân quyền", "MÔ HÌNH TỔ CHỨC");
  const departments = units.filter(unit => unit.type === "department");
  const regionals = units.filter(unit => unit.type === "regional");
  const assignablePeople = users.filter(person => person.accountStatus !== "pending");
  document.getElementById("appView").innerHTML = `<div class="dashboard-grid">
    <section class="panel panel-wide"><div class="panel-header"><div><h2>Cây tổ chức trong demo</h2><p>Hai nhóm đơn vị ngang cấp, cùng trực thuộc VKSND tỉnh</p></div></div><div class="org-tree"><div class="org-root"><strong>VKSND tỉnh</strong><span>Viện trưởng · Các Phó Viện trưởng</span></div><div class="org-branches"><div class="org-column"><h3>Phòng chuyên trách</h3>${departments.map(orgUnitCard).join("")}</div><div class="org-column"><h3>VKSND khu vực</h3>${regionals.map(orgUnitCard).join("")}</div></div></div></section>
    <section class="panel panel-wide"><div class="panel-header"><div><h2>Gán vai trò và đơn vị</h2><p>Chỉ định chức vụ và đơn vị cho từng tài khoản, nhóm theo đơn vị. Viện trưởng/Phó Viện trưởng tỉnh chọn "Lãnh đạo Viện tỉnh" làm đơn vị. Với vai trò Phó Viện trưởng tỉnh, tick chọn thêm các đơn vị được phân công phụ trách.</p></div></div>${assignRoleGroupedTable(assignablePeople)}</section>
    <section class="panel panel-wide"><div class="panel-header"><div><h2>Quy tắc người chấm</h2><p>Không cho phép người dùng tự chấm nhật ký của mình</p></div></div><div class="org-role-list">
      <div class="org-role-row"><strong>Cán bộ, công chức</strong><p>Người đứng đầu đơn vị trực tiếp đánh giá; cấp phó chỉ chấm khi có ủy quyền.</p></div>
      <div class="org-role-row"><strong>Phó lãnh đạo đơn vị</strong><p>Viện trưởng khu vực hoặc Trưởng phòng đánh giá.</p></div>
      <div class="org-role-row"><strong>Người đứng đầu đơn vị</strong><p>Lãnh đạo tỉnh được phân công phụ trách đơn vị đánh giá.</p></div>
      <div class="org-role-row"><strong>Phó Viện trưởng tỉnh</strong><p>Viện trưởng tỉnh đánh giá.</p></div>
    </div></section></div>`;
  document.querySelectorAll("[data-save-role]").forEach(button => button.addEventListener("click", () => saveAccountRole(button.dataset.saveRole)));
  document.querySelectorAll("[data-toggle-active]").forEach(button => button.addEventListener("click", () => toggleAccountActive(button.dataset.toggleActive)));
  document.querySelectorAll("[data-org-unit-toggle]").forEach(button => button.addEventListener("click", () => {
    state.orgExpandedUnitId = state.orgExpandedUnitId === button.dataset.orgUnitToggle ? null : button.dataset.orgUnitToggle;
    renderOrganization();
  }));
  bindRoleSelectToggle();
  bindAssignRoleSearch();
}

const LEADERSHIP_UNIT_ID = "province";
const LEADERSHIP_UNIT_LABEL = "Lãnh đạo Viện tỉnh";

// "province" la don vi cap tinh co san (unitById tra ve "VKSND tinh"), dung
// lam ten hien thi rieng khi no dong vai tro "don vi" cua Vien truong/Pho
// Vien truong tinh - nhung nguoi khong thuoc phong/khu vuc nao.
function unitDisplayName(unitId) {
  return unitId === LEADERSHIP_UNIT_ID ? LEADERSHIP_UNIT_LABEL : unitById(unitId).short;
}

function assignRoleTable(people) {
  if (!people.length) return `<div class="empty-state compact-empty"><strong>Chưa có tài khoản nào</strong></div>`;
  const sorted = people.slice().sort((a, b) => { const aActive = a.active !== false, bActive = b.active !== false; return aActive === bActive ? 0 : (aActive ? 1 : -1); });
  // Don vi that (phong/khu vuc) - dung lam danh sach "don vi phu trach".
  const deptUnits = units.filter(unit => unit.type !== "province");
  // Vien truong/Pho Vien truong tinh khong thuoc phong/khu vuc nao - them
  // muc rieng tro ve don vi cap tinh de co the chon lam "Don vi" cua ho.
  const homeUnitOptions = [{ id: LEADERSHIP_UNIT_ID, short: LEADERSHIP_UNIT_LABEL }, ...deptUnits];
  return `<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Trạng thái</th><th>Vai trò</th><th>Đơn vị</th><th>Đơn vị phụ trách (Phó VT tỉnh)</th><th></th></tr></thead><tbody>${sorted.map(person => {
    const roleSel = `<select data-role-select="${person.id}">${ROLE_OPTIONS.map(role => `<option value="${role}" ${person.role === role ? "selected" : ""}>${ROLE_LABELS[role]}</option>`).join("")}</select>`;
    const unitSel = `<select data-unit-select="${person.id}">${homeUnitOptions.map(unit => `<option value="${unit.id}" ${person.unitId === unit.id ? "selected" : ""}>${unit.short}</option>`).join("")}</select>`;
    const assigned = person.assignedUnits || [];
    const isDeputy = person.role === "province_deputy";
    const checklist = `<div class="unit-checklist" data-assigned-checklist="${person.id}" style="display:${isDeputy ? "" : "none"}">${deptUnits.map(unit => `<label><input type="checkbox" value="${unit.id}" ${assigned.includes(unit.id) ? "checked" : ""}> ${unit.short}</label>`).join("")}</div>`
      + `<span class="unit-checklist-empty" data-assigned-empty="${person.id}" style="display:${isDeputy ? "none" : ""}">Chỉ áp dụng cho Phó Viện trưởng tỉnh</span>`;
    const isSelf = person.id === currentUser().id;
    const active = person.active !== false;
    const lockBtn = isSelf ? "" : `<button type="button" class="button button-small ${active ? "button-danger" : "button-secondary"}" data-toggle-active="${person.id}">${active ? "Khoá" : "Mở lại"}</button>`;
    return `<tr data-person-name="${(person.name || "").normalize("NFC").toLowerCase()}"><td><strong>${person.name}</strong></td><td><span class="status-pill ${active ? "status-approved" : "status-pending"}">${active ? "Đang hoạt động" : "Đã khoá"}</span></td><td>${roleSel}</td><td>${unitSel}</td><td>${checklist}</td><td class="numeric"><button class="button button-primary button-small" data-save-role="${person.id}">Lưu</button> ${lockBtn}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

// Nhom bang gan vai tro/don vi theo tung don vi (thu tu: Lanh dao Vien
// tinh, roi Phong, roi Khu vuc), gap/mo bang <details>, kem o tim ten.
// Nguoi thieu vai tro hoac don vi hop le duoc gom rieng vao 1 nhom canh
// bao dau danh sach thay vi bi rot khoi bang.
function assignRoleGroupedTable(allPeople) {
  if (!allPeople.length) return `<div class="empty-state compact-empty"><strong>Chưa có tài khoản nào</strong></div>`;
  const isAssigned = p => p.role && ROLE_LABELS[p.role] && p.unitId && unitById(p.unitId);
  const unassigned = allPeople.filter(p => !isAssigned(p));
  const assigned = allPeople.filter(isAssigned);
  const groupUnits = [
    { id: LEADERSHIP_UNIT_ID, short: LEADERSHIP_UNIT_LABEL },
    ...units.filter(u => u.type === "department"),
    ...units.filter(u => u.type === "regional")
  ];
  let h = `<label class="field" style="max-width:320px;margin-bottom:14px"><span>Tìm theo tên</span><input type="text" id="assignRoleSearch" placeholder="Nhập tên..."></label>`;
  if (unassigned.length) {
    h += `<details class="unit-group is-unassigned" open data-role-group><summary><strong>Chưa phân loại (thiếu vai trò hoặc đơn vị)</strong><span>${unassigned.length} người</span></summary>${assignRoleTable(unassigned)}</details>`;
  }
  groupUnits.forEach(u => {
    const members = assigned.filter(p => p.unitId === u.id);
    if (!members.length) return;
    h += `<details class="unit-group" data-role-group><summary><strong>${u.short}</strong><span>${members.length} người</span></summary>${assignRoleTable(members)}</details>`;
  });
  return h;
}

function bindAssignRoleSearch() {
  const input = document.getElementById("assignRoleSearch");
  if (!input) return;
  input.addEventListener("input", () => {
    const q = input.value.trim().normalize("NFC").toLowerCase();
    document.querySelectorAll("[data-role-group]").forEach(group => {
      let anyMatch = false;
      group.querySelectorAll("[data-person-name]").forEach(row => {
        const match = !q || row.dataset.personName.includes(q);
        row.style.display = match ? "" : "none";
        if (match) anyMatch = true;
      });
      if (q) group.open = anyMatch;
      else if (!group.classList.contains("is-unassigned")) group.open = false;
    });
  });
}

function bindRoleSelectToggle() {
  document.querySelectorAll("[data-role-select]").forEach(select => {
    select.addEventListener("change", () => {
      const id = select.dataset.roleSelect;
      const isDeputy = select.value === "province_deputy";
      const list = document.querySelector(`[data-assigned-checklist="${id}"]`);
      const empty = document.querySelector(`[data-assigned-empty="${id}"]`);
      if (list) list.style.display = isDeputy ? "" : "none";
      if (empty) empty.style.display = isDeputy ? "none" : "";
    });
  });
}

function saveAccountRole(id) {
  const person = userById(id);
  const roleSel = document.querySelector(`[data-role-select="${id}"]`);
  const unitSel = document.querySelector(`[data-unit-select="${id}"]`);
  const checklist = document.querySelector(`[data-assigned-checklist="${id}"]`);
  if (!person || !roleSel || !unitSel) return;
  const oldRole = person.role, oldUnit = unitDisplayName(person.unitId);
  person.role = roleSel.value;
  person.unitId = unitSel.value;
  person.assignedUnits = roleSel.value === "province_deputy" ? Array.from(checklist.querySelectorAll("input:checked")).map(cb => cb.value) : undefined;
  savePersonnelState();
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: "Gán vai trò và đơn vị", detail: `${person.name}: ${ROLE_LABELS[oldRole]} tại ${oldUnit} → ${ROLE_LABELS[person.role]} tại ${unitDisplayName(person.unitId)}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast("Đã cập nhật vai trò và đơn vị.");
  updateNav();
  renderOrganization();
}

function toggleAccountActive(id) {
  const person = userById(id);
  if (!person || person.id === currentUser().id) return;
  person.active = !(person.active !== false);
  savePersonnelState();
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: person.active ? "Mở lại tài khoản" : "Khoá tài khoản", detail: `${person.name} · ${unitDisplayName(person.unitId)}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast(person.active ? "Đã mở lại tài khoản." : "Đã khoá tài khoản.");
  renderOrganization();
}

// Quan tri toan phan (dieu chuyen nhan su, ma dang ky, duyet tai khoan,
// nhat ky thay doi) chi danh cho Quan tri vien/Vien truong tinh. Rieng
// "Uy quyen co thoi han" con mo them cho Truong phong/Chanh van phong
// (unit_head) de HO TU uy quyen cho pho cua chinh minh - dung RPC
// grant_delegation/revoke_delegation da cho phep tu migration 00030,
// truoc day chi thieu loi vao tu giao dien.
function canManageAllAdministration(user = currentUser()) {
  return isAdministrator(user) || user.role === "province_head";
}

function renderAdministration() {
  const user = currentUser();
  const fullAccess = canManageAllAdministration(user);
  if (!(fullAccess || user.role === "unit_head")) { state.currentView = "dashboard"; renderDashboard(); return; }
  const activeUsers = users.filter(person => person.role !== "administrator");
  const heads = activeUsers.filter(person => person.role === "unit_head");
  const activeDelegationsCount = delegations.filter(isDelegationActive).length;
  const pendingAccounts = registeredAccounts.filter(account => account.accountStatus === "pending");
  const movableUsers = activeUsers.filter(person => !["province_head", "province_deputy", "unit_head"].includes(person.role));
  updateChrome(fullAccess ? "Quản trị nhân sự và phân quyền" : "Ủy quyền có thời hạn", fullAccess ? "CẤU HÌNH CÓ THỜI GIAN HIỆU LỰC" : "PHÓ PHÒNG ĐƯỢC CHẤM THAY");
  let html = fullAccess ? `<div class="demo-notice"><strong>Mô phỏng quản trị</strong><span>Mọi thay đổi chỉ lưu trong trình duyệt này. Nhật ký cũ giữ nguyên đơn vị tại thời điểm phát sinh; quyền mới áp dụng từ thời điểm có hiệu lực.</span></div>
    <div class="metric-grid">
      ${metricCard("Nhân sự và tài khoản", activeUsers.length, `${pendingAccounts.length} tài khoản chờ xác nhận`, "")}
      ${metricCard("Đơn vị trực thuộc", units.length - 1, "Phòng chuyên trách và VKSND khu vực", "blue")}
      ${metricCard("Người đứng đầu", heads.length, "Đang có hiệu lực", "green")}
      ${metricCard("Ủy quyền đang hiệu lực", activeDelegationsCount, "Có thể thu hồi tức thời", "gold")}
    </div>` : "";
  html += `<div class="admin-grid">`;
  if (fullAccess) html += `<section class="panel"><div class="panel-header"><div><h2>Điều chuyển nhân sự</h2><p>Không sửa lịch sử; kết thúc phân công cũ và tạo phân công mới</p></div></div>
        <div class="form-grid compact-form">
          <label class="field field-wide"><span>Nhân sự</span><select id="adminPerson">${movableUsers.map(person => `<option value="${person.id}">${person.name} · ${person.title} · ${unitById(person.unitId).short}</option>`).join("")}</select></label>
          <label class="field"><span>Đơn vị mới</span><select id="adminTargetUnit">${units.filter(unit => unit.id !== "province").map(unit => `<option value="${unit.id}">${unit.short}</option>`).join("")}</select></label>
          <label class="field"><span>Ngày hiệu lực</span><input id="adminEffectiveDate" type="date" value="2026-09-01"></label>
        </div><div class="review-actions"><button class="button button-primary" id="applyTransfer">Mô phỏng điều chuyển</button></div>
      </section>`;
  html += `<section class="panel panel-wide"><div class="panel-header"><div><h2>Ủy quyền có thời hạn</h2><p>Chỉ định cụ thể Phó phòng/Phó Viện trưởng KV được chấm điểm thay cho những ai, trong khoảng thời gian nào${fullAccess ? "" : " (trong đơn vị của bạn)"}</p></div></div>
        ${delegationGrantFormHtml()}
        ${delegationsTableHtml()}
      </section>`;
  if (fullAccess) html += `<section class="panel panel-wide"><div class="panel-header"><div><h2>Tài khoản chờ xác nhận</h2><p>Đối chiếu đúng người, đúng đơn vị trước khi kích hoạt</p></div></div>${pendingAccountTable(pendingAccounts)}</section>
      <section class="panel panel-wide"><div class="panel-header"><div><h2>Nhật ký thay đổi</h2><p>Không xóa lịch sử thay đổi nhân sự và phân quyền</p></div></div><div class="audit-list">${auditEvents.slice().reverse().map(event => `<div class="audit-row"><span class="audit-time">${new Date(event.at).toLocaleString("vi-VN")}</span><div><strong>${event.action}</strong><p>${event.detail}</p></div><span>${event.actor}</span></div>`).join("")}</div></section>`;
  html += `</div>`;
  document.getElementById("appView").innerHTML = html;
  if (fullAccess) document.getElementById("applyTransfer").addEventListener("click", applyPersonnelTransfer);
  bindDelegationForm();
  document.querySelectorAll("[data-revoke-delegation]").forEach(button => button.addEventListener("click", () => revokeDelegation(button.dataset.revokeDelegation)));
  if (fullAccess) {
    document.querySelectorAll("[data-approve-account]").forEach(button => button.addEventListener("click", () => approveRegisteredAccount(button.dataset.approveAccount)));
  }
}

function pendingAccountTable(accounts) {
  if (!accounts.length) return `<div class="empty-state compact-empty"><strong>Không có tài khoản chờ xử lý</strong>Tài khoản đăng ký hợp lệ sẽ xuất hiện tại đây.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Người đăng ký</th><th>Email</th><th>Đơn vị từ mã</th><th>Mã sử dụng</th><th></th></tr></thead><tbody>${accounts.map(account => `<tr><td><strong>${account.name}</strong></td><td>${account.email}</td><td>${unitById(account.unitId).short}</td><td><code>${account.registrationCode}</code></td><td class="numeric"><button class="button button-primary button-small" data-approve-account="${account.id}">Xác nhận tài khoản</button></td></tr>`).join("")}</tbody></table></div>`;
}

function approveRegisteredAccount(accountId) {
  const account = registeredAccounts.find(item => item.id === accountId);
  if (!account) return;
  account.accountStatus = "active";
  const runtimeAccount = userById(accountId);
  if (runtimeAccount) runtimeAccount.accountStatus = "active";
  localStorage.setItem(REGISTERED_ACCOUNT_STORAGE_KEY, JSON.stringify(registeredAccounts));
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: "Xác nhận tài khoản", detail: `${account.name} · ${unitById(account.unitId).short}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast("Đã xác nhận tài khoản với quyền cán bộ mặc định.");
  renderAdministration();
}

function applyPersonnelTransfer() {
  const person = userById(document.getElementById("adminPerson").value);
  const targetUnit = document.getElementById("adminTargetUnit").value;
  const effectiveDate = document.getElementById("adminEffectiveDate").value;
  if (!person || !targetUnit || !effectiveDate) return showToast("Vui lòng chọn đủ thông tin điều chuyển.");
  if (person.unitId === targetUnit) return showToast("Đơn vị mới phải khác đơn vị hiện tại.");
  const oldUnit = unitById(person.unitId).short;
  const newUnit = unitById(targetUnit).short;
  person.unitId = targetUnit;
  savePersonnelState();
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: "Mô phỏng điều chuyển nhân sự", detail: `${person.name}: ${oldUnit} → ${newUnit}, hiệu lực ${formatDate(effectiveDate)}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast(`Đã chuyển ${person.name} sang ${newUnit} trong dữ liệu demo.`);
  renderAdministration();
}

// ============================================
// UY QUYEN THAY MAT 100% TOAN DON VI - Truong phong/Vien truong KV uy
// quyen cho 1 Pho phong THAY MINH cham diem CA DON VI, trong 1 khoang
// thoi gian - khong con chon danh sach nguoi cu the (truoc day 1 can
// bo/KSV co the duoc NHIEU lanh dao khac nhau giao viec, gan co dinh
// "nguoi nay luon do Pho X cham" khong dung thuc te - xem canReviewLog()
// va "Nop cho lanh dao" trong form tao nhat ky).
// ============================================
// Quan tri vien/Vien truong tinh thay duoc TAT CA Pho phong/don vi; rieng
// Truong phong/Chanh van phong (unit_head) chi thay va chon duoc pho
// CUA DUNG DON VI MINH.
function delegationGrantFormHtml() {
  const user = currentUser();
  const scoped = !canManageAllAdministration(user);
  const deputies = users.filter(person => person.role === "unit_deputy" && (!scoped || person.unitId === user.unitId));
  const delegatorId = scoped ? user.id : null;
  const alreadyHasActive = delegatorId && delegations.some(d => d.delegatorId === delegatorId && isDelegationActive(d));
  if (alreadyHasActive) {
    return `<div class="empty-state compact-empty"><strong>Bạn đang có 1 ủy quyền còn hiệu lực</strong><span>Thu hồi ủy quyền hiện tại ở bảng bên dưới trước khi cấp ủy quyền mới.</span></div>`;
  }
  return `<div class="form-grid compact-form">
    <label class="field field-wide"><span>Phó phòng/Phó Viện trưởng KV được ủy quyền</span><select id="delegationDeputy">${deputies.map(d => `<option value="${d.id}">${d.name} · ${unitById(d.unitId).short}</option>`).join("")}</select></label>
    <label class="field"><span>Từ ngày</span><input type="date" id="delegationStart" value="${DEMO_TODAY}"></label>
    <label class="field"><span>Đến ngày</span><input type="date" id="delegationEnd"></label>
    <p class="metric-context field-wide">Trong thời gian này, Phó phòng được chọn sẽ thay mặt chấm điểm và duyệt nhật ký cho <strong>toàn bộ đơn vị</strong>, như Trưởng phòng.</p>
  </div><div class="review-actions"><button class="button button-primary" id="grantDelegation">Cấp ủy quyền</button></div>`;
}

function delegationsTableHtml() {
  const user = currentUser();
  const scoped = !canManageAllAdministration(user);
  const visible = scoped ? delegations.filter(d => d.unitId === user.unitId) : delegations;
  if (!visible.length) return `<div class="empty-state compact-empty"><strong>Chưa có ủy quyền nào</strong></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Phó phòng/Phó VT KV</th><th>Đơn vị</th><th>Phạm vi</th><th>Thời hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>${visible.slice().reverse().map(d => {
    const deputy = userById(d.delegateId);
    const active = isDelegationActive(d);
    const statusLabel = d.status === "revoked" ? "Đã thu hồi" : active ? "Đang hiệu lực" : "Hết hạn";
    const statusTone = d.status === "revoked" ? "status-revision" : active ? "status-approved" : "status-pending";
    return `<tr><td><strong>${deputy ? deputy.name : "—"}</strong></td><td>${unitDisplayName(d.unitId)}</td><td>Toàn bộ đơn vị</td><td>${formatDate(d.startsAt)}–${formatDate(d.endsAt)}</td><td><span class="status-pill ${statusTone}">${statusLabel}</span></td><td class="numeric">${d.status === "active" ? `<button class="button button-danger button-small" data-revoke-delegation="${d.id}">Thu hồi</button>` : ""}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function bindDelegationForm() {
  const grantButton = document.getElementById("grantDelegation");
  if (!grantButton) return;
  grantButton.addEventListener("click", grantDelegation);
}

function grantDelegation() {
  const deputy = userById(document.getElementById("delegationDeputy").value);
  const startsAt = document.getElementById("delegationStart").value;
  const endsAt = document.getElementById("delegationEnd").value;
  if (!deputy || !startsAt || !endsAt) return showToast("Vui lòng chọn đầy đủ Phó phòng và khoảng thời gian.");
  if (endsAt < startsAt) return showToast("Ngày kết thúc phải sau ngày bắt đầu.");
  const delegator = users.find(user => user.unitId === deputy.unitId && user.role === "unit_head");
  const grantedBy = delegator || currentUser();
  if (delegations.some(d => d.delegatorId === grantedBy.id && isDelegationActive(d))) {
    return showToast("Bạn đang có 1 ủy quyền còn hiệu lực - hãy thu hồi trước khi cấp ủy quyền mới.");
  }
  delegations.push({
    id: `DEL-${Date.now()}`, delegatorId: grantedBy.id, delegateId: deputy.id,
    unitId: deputy.unitId, startsAt, endsAt, status: "active"
  });
  saveDelegations();
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: "Cấp ủy quyền chấm điểm", detail: `${deputy.name} · Thay mặt toàn bộ đơn vị · ${formatDate(startsAt)}–${formatDate(endsAt)}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  // Bao cho NGUOI DUOC UY QUYEN biet - truoc day khong co gi ca, ho phai
  // tu vao "Nhat ky cong tac cua don vi" moi phat hien minh vua duoc uy quyen.
  systemNotifications.push({
    id: `ON-${Date.now()}-${deputy.id}`, userId: deputy.id, type: "delegation_granted",
    title: "Bạn được ủy quyền thay mặt chấm điểm toàn bộ đơn vị",
    message: `${grantedBy.name} đã ủy quyền cho bạn thay mặt chấm điểm toàn bộ đơn vị, từ ${formatDate(startsAt)} đến ${formatDate(endsAt)}.`,
    view: "administration",
    createdAt: new Date().toISOString()
  });
  saveSystemNotifications();
  showToast("Đã cấp ủy quyền.");
  renderAdministration();
}

function revokeDelegation(id) {
  const delegation = delegations.find(d => d.id === id);
  if (!delegation) return;
  delegation.status = "revoked";
  saveDelegations();
  const deputy = userById(delegation.delegateId);
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: "Thu hồi ủy quyền", detail: `${deputy ? deputy.name : "—"} · ${unitDisplayName(delegation.unitId)}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  if (deputy) {
    systemNotifications.push({
      id: `ON-${Date.now()}-${deputy.id}`, userId: deputy.id, type: "delegation_revoked",
      title: "Ủy quyền chấm điểm đã bị thu hồi",
      message: `${currentUser().name} đã thu hồi ủy quyền chấm điểm của bạn.`,
      view: "administration",
      createdAt: new Date().toISOString()
    });
    saveSystemNotifications();
  }
  showToast("Đã thu hồi ủy quyền.");
  renderAdministration();
}

// ============================================
// GIAO VIEC - lanh dao giao viec cho cap duoi trong pham vi duyet duoc
// (dung canManagePerson, khong con gioi han theo danh sach uy quyen cu -
// bat ky Pho phong nao cung giao viec duoc cho bat ky ai trong don vi,
// khop voi thuc te "1 nguoi duoc nhieu lanh dao giao viec"). Ho tro giao
// CUNG LUC cho nhieu nguoi (1 chu tri + N phoi hop, dung chung 1
// taskGroupId de gom hien thi phia nguoi giao - moi nguoi van la 1 dong
// rieng, tu theo doi tien do/han rieng). Han gop y/han hoan thanh chinh
// xac den gio:phut. Bao cao ket qua = 1 nhat ky binh thuong, gan qua
// select "Gan voi viec duoc giao" trong form tao nhat ky (xem
// submitJournal/openJournalModal); duyet xong tu chuyen task sang "done"
// (xem applyReview).
// ============================================
const TASK_STATUS_LABELS = { pending: "Chờ thực hiện", reported: "Đã báo cáo, chờ duyệt", done: "Hoàn thành" };
const TASK_STATUS_TONES = { pending: "status-pending", reported: "status-info", done: "status-approved" };
const TASK_WORK_ROLE_LABELS = { chu_tri: "Chủ trì", phoi_hop: "Phối hợp" };

// Dinh dang co dinh "dd/mm/yyyy hh:mm" (giong shortDateTime nhung khong co
// dau phay, dung cho han giao viec).
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p2 = n => String(n).padStart(2, "0");
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

function assignableUsers(user = currentUser()) {
  return users.filter(person => canManagePerson(person, user));
}

function taskDueDate(task) {
  return task.actualDueDate || task.suggestedDueDate || null;
}

// So sanh timestamp DAY DU (gio:phut), dung thoi gian THUC TE - giong
// cach da lam voi dem so lan cham khac de xuat trong thang (dung new
// Date() that, khong dung lich gia lap co dinh cua demo), vi han giao
// viec gio la mot moc thoi gian that, khong con la 1 "ngay" trong the
// gioi demo nua.
function isTaskOverdue(task) {
  const due = taskDueDate(task);
  return task.status !== "done" && !!due && new Date(due) < new Date();
}

function tasksAssignedByMe() {
  return taskAssignments.filter(task => task.assignerId === currentUser().id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function tasksAssignedToMe() {
  return taskAssignments.filter(task => task.assigneeId === currentUser().id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Gom cac dong "Viec toi da giao" theo taskGroupId thanh 1 nhom - 1 lan
// giao cho nhieu nguoi hien thanh 1 the duy nhat.
function taskGroupsAssignedByMe() {
  const mine = tasksAssignedByMe();
  const seen = new Set();
  const groups = [];
  mine.forEach(task => {
    if (seen.has(task.taskGroupId)) return;
    seen.add(task.taskGroupId);
    groups.push(mine.filter(item => item.taskGroupId === task.taskGroupId));
  });
  return groups;
}

function renderTasks() {
  updateChrome("Giao việc", "PHÂN CÔNG VÀ THEO DÕI TIẾN ĐỘ");
  const user = currentUser();
  const candidates = assignableUsers(user);
  const groupsByMe = taskGroupsAssignedByMe();
  const assignedToMe = tasksAssignedToMe();
  document.getElementById("appView").innerHTML = `<div class="admin-grid">
    <section class="panel"><div class="panel-header"><div><h2>Việc tôi đã giao</h2><p>${groupsByMe.length} việc</p></div></div>
      ${candidates.length ? taskAssignFormHtml(candidates) : `<p class="metric-context">Bạn chưa có cán bộ/đơn vị nào thuộc phạm vi được phép giao việc.</p>`}
      <div class="task-list">${groupsByMe.length ? groupsByMe.map(taskGroupCardHtml).join("") : `<div class="empty-state compact-empty"><strong>Chưa giao việc nào</strong></div>`}</div>
    </section>
    <section class="panel"><div class="panel-header"><div><h2>Việc được giao cho tôi</h2><p>${assignedToMe.length} việc</p></div></div>
      <div class="task-list">${assignedToMe.length ? assignedToMe.map(task => taskCardHtml(task, "assignee")).join("") : `<div class="empty-state compact-empty"><strong>Chưa có việc được giao</strong></div>`}</div>
    </section>
  </div>`;
  if (candidates.length) bindTaskAssignForm();
  document.querySelectorAll("[data-set-due-form]").forEach(form => form.addEventListener("submit", submitTaskDueDate));
  document.querySelectorAll("[data-report-task]").forEach(button => button.addEventListener("click", () => openJournalModal(null, button.dataset.reportTask)));
}

function taskAssignFormHtml(candidates) {
  const options = candidates.map(person => `<option value="${person.id}">${person.name} · ${unitById(person.unitId).short}</option>`).join("");
  const checklist = candidates.map(person => `<label data-name="${person.name.toLowerCase()}"><input type="checkbox" name="supportIds" value="${person.id}"> ${person.name} · ${unitById(person.unitId).short}</label>`).join("");
  return `<form class="form-grid compact-form" id="taskAssignForm">
    <label class="field field-wide"><span>Người chủ trì</span><select name="leadId" required>${options}</select></label>
    <div class="field field-wide"><span>Người phối hợp (không bắt buộc) — <span id="taskSupportCount">chưa chọn ai</span></span>
      ${candidates.length > 6 ? `<input type="text" id="taskSupportSearch" placeholder="Tìm theo tên...">` : ""}
      <div class="unit-checklist" id="taskSupportChecklist">${checklist}</div></div>
    <label class="field field-wide"><span>Tên công việc</span><input type="text" name="title" required maxlength="200"></label>
    <label class="field field-wide"><span>Mô tả / yêu cầu</span><textarea name="description" rows="2"></textarea></label>
    <label class="field"><span>Hạn gợi ý (không bắt buộc)</span><input type="datetime-local" name="suggestedDueDate"></label>
    <div class="review-actions"><button type="submit" class="button button-primary">Giao việc</button></div>
  </form>`;
}

// Tim theo ten + dem so nguoi da chon - can thiet tu khi don vi co toi
// 30-70 nguoi (truoc day chi vai nguoi, khung 5 dong la du dung).
function bindTaskSupportExtras() {
  const search = document.getElementById("taskSupportSearch");
  const checklist = document.getElementById("taskSupportChecklist");
  if (!checklist) return;
  const updateCount = () => {
    const n = checklist.querySelectorAll('input[type="checkbox"]:checked').length;
    const el = document.getElementById("taskSupportCount");
    if (el) el.textContent = n ? `${n} đã chọn` : "chưa chọn ai";
  };
  checklist.addEventListener("change", updateCount);
  updateCount();
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().normalize("NFC").toLowerCase();
      checklist.querySelectorAll("label").forEach(label => {
        label.style.display = (!q || (label.dataset.name || "").includes(q)) ? "" : "none";
      });
    });
  }
}

function bindTaskAssignForm() {
  const form = document.getElementById("taskAssignForm");
  if (!form) return;
  bindTaskSupportExtras();
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const lead = userById(data.get("leadId"));
    if (!lead) { showToast("Vui lòng chọn người chủ trì."); return; }
    const title = String(data.get("title") || "").trim();
    if (!title) { showToast("Vui lòng nhập tên công việc."); return; }
    const supportUsers = Array.from(form.querySelectorAll('input[name="supportIds"]:checked'))
      .map(checkbox => checkbox.value).filter(id => id !== lead.id).map(userById).filter(Boolean);
    const description = String(data.get("description") || "").trim();
    const suggestedDueDate = data.get("suggestedDueDate") || null;
    const groupId = `TG-${Date.now()}`;
    const createdAt = new Date().toISOString();
    taskAssignments.push({
      id: `TASK-${Date.now()}-lead`, taskGroupId: groupId, assignerId: currentUser().id, assigneeId: lead.id, workRole: "chu_tri",
      unitId: lead.unitId, title, description, suggestedDueDate, actualDueDate: null, status: "pending", linkedLogId: null, createdAt
    });
    supportUsers.forEach((person, index) => {
      taskAssignments.push({
        id: `TASK-${Date.now()}-s${index}`, taskGroupId: groupId, assignerId: currentUser().id, assigneeId: person.id, workRole: "phoi_hop",
        unitId: person.unitId, title, description, suggestedDueDate, actualDueDate: null, status: "pending", linkedLogId: null, createdAt
      });
    });
    saveTaskAssignments();
    showToast(`Đã giao việc cho ${1 + supportUsers.length} người.`);
    renderTasks();
  });
}

// The gop 1 nhom giao viec (phia nguoi giao) - liet ke ro chu tri/phoi
// hop kem trang thai rieng cua tung nguoi.
function taskGroupCardHtml(rows) {
  const lead = rows.find(row => row.workRole === "chu_tri") || rows[0];
  const others = rows.filter(row => row !== lead);
  const overdueAny = rows.some(isTaskOverdue);
  const memberRow = row => {
    const person = userById(row.assigneeId);
    return `<div class="task-member-row"><span>${person ? person.name : "—"}</span><span class="meta-tag">${TASK_WORK_ROLE_LABELS[row.workRole]}</span><span class="status-pill ${TASK_STATUS_TONES[row.status]}">${TASK_STATUS_LABELS[row.status]}</span></div>`;
  };
  return `<article class="task-card ${overdueAny ? "is-overdue" : ""}">
    <div class="task-card-header"><strong>${lead.title}</strong>${overdueAny ? `<span class="meta-tag meta-tag-warning">Có người quá hạn</span>` : ""}</div>
    ${lead.description ? `<p>${lead.description}</p>` : ""}
    <div class="task-card-meta">
      ${lead.suggestedDueDate ? `<span>Hạn gợi ý: ${formatDateTime(lead.suggestedDueDate)}</span>` : ""}
    </div>
    <div class="task-member-list">${memberRow(lead)}${others.map(memberRow).join("")}</div>
  </article>`;
}

function taskCardHtml(task, perspective) {
  const assigner = userById(task.assignerId);
  const assignee = userById(task.assigneeId);
  const counterpart = perspective === "assigner" ? assignee : assigner;
  const counterpartLabel = perspective === "assigner" ? "Giao cho" : "Người giao";
  const overdue = isTaskOverdue(task);
  const roleTag = perspective === "assignee" ? `<span class="meta-tag">${TASK_WORK_ROLE_LABELS[task.workRole] || "Chủ trì"}</span>` : "";
  const coAssignees = perspective === "assignee"
    ? taskAssignments.filter(item => item.taskGroupId === task.taskGroupId && item.id !== task.id).map(item => userById(item.assigneeId)?.name).filter(Boolean)
    : [];
  const dueSetter = perspective === "assignee" && task.status !== "done"
    ? `<form class="task-due-form" data-set-due-form="${task.id}"><label><span>Hạn hoàn thành</span><input type="datetime-local" name="dueDate" value="${task.actualDueDate || ""}"></label><button type="submit" class="button button-secondary button-small">Đặt hạn</button></form>`
    : "";
  const reportButton = perspective === "assignee" && task.status === "pending"
    ? `<button type="button" class="button button-primary button-small" data-report-task="${task.id}">Ghi nhật ký cho việc này</button>` : "";
  return `<article class="task-card ${overdue ? "is-overdue" : ""}">
    <div class="task-card-header"><strong>${task.title}</strong><span class="status-pill ${TASK_STATUS_TONES[task.status]}">${TASK_STATUS_LABELS[task.status]}</span></div>
    ${task.description ? `<p>${task.description}</p>` : ""}
    <div class="task-card-meta">
      <span>${counterpartLabel}: <strong>${counterpart ? counterpart.name : "—"}</strong></span>
      ${roleTag}
      ${task.suggestedDueDate ? `<span>Hạn gợi ý: ${formatDateTime(task.suggestedDueDate)}</span>` : ""}
      ${task.actualDueDate ? `<span>Hạn đã đặt: ${formatDateTime(task.actualDueDate)}</span>` : ""}
      ${overdue ? `<span class="meta-tag meta-tag-warning">Quá hạn</span>` : ""}
      ${coAssignees.length ? `<span>Cùng thực hiện: ${coAssignees.join(", ")}</span>` : ""}
    </div>
    ${dueSetter}${reportButton}
  </article>`;
}

function submitTaskDueDate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const task = taskAssignments.find(item => item.id === form.dataset.setDueForm);
  if (!task) return;
  const value = form.elements.dueDate.value;
  if (!value) { showToast("Vui lòng chọn thời điểm hoàn thành."); return; }
  task.actualDueDate = value;
  saveTaskAssignments();
  showToast("Đã đặt hạn hoàn thành.");
  renderTasks();
}

function orgUnitCard(unit) {
  const head = users.find(user => user.unitId === unit.id && user.role === "unit_head");
  const members = users.filter(user => user.unitId === unit.id && user.accountStatus !== "pending")
    .slice().sort((a, b) => (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0) || a.name.localeCompare(b.name));
  const expanded = state.orgExpandedUnitId === unit.id;
  const memberRows = expanded
    ? `<div class="org-unit-members">${members.length ? members.map(m => `<div class="org-member-row"><span>${m.name}</span><span class="meta-tag">${ROLE_LABELS[m.role] || m.role}</span>${m.active === false ? `<span class="meta-tag meta-tag-warning">Đã khoá</span>` : ""}</div>`).join("") : `<span class="unit-checklist-empty">Chưa có nhân sự</span>`}</div>`
    : "";
  return `<div class="org-unit-wrap"><button type="button" class="org-unit ${expanded ? "is-expanded" : ""}" data-org-unit-toggle="${unit.id}"><div><strong>${unit.short}</strong><span>${head ? head.name : "Chưa phân công người đứng đầu"}</span></div><span class="score-pill score-mid">${members.length} người</span></button>${memberRows}</div>`;
}

function openJournalModal(logId = null, presetTaskId = null) {
  const form = document.getElementById("journalForm");
  form.reset();
  const log = typeof logId === "string" ? logs.find(item => item.id === logId) : null;
  const canEdit = log && log.authorId === currentUser().id && log.status === "revision";
  state.editingJournalId = canEdit ? log.id : null;
  document.getElementById("journalModalTitle").textContent = canEdit ? "Chỉnh sửa và trình lại kết quả" : "Ghi nhận kết quả công việc";
  document.getElementById("journalSubmitButton").textContent = canEdit ? "Lưu và trình lại" : "Gửi nhật ký";
  const notice = document.getElementById("journalRevisionNotice");
  notice.hidden = !canEdit;
  document.getElementById("journalRevisionComment").textContent = canEdit ? log.comment : "";
  if (canEdit) {
    form.elements.workDate.value = log.date;
    form.elements.category.value = log.category;
    form.elements.title.value = log.title;
    form.elements.result.value = log.result;
    form.elements.workRole.value = log.workRole;
    form.elements.duration.value = log.duration;
    form.elements.evidence.value = log.evidence || "";
    form.elements.selfComplexity.value = log.selfComplexity || "";
    form.elements.selfQuality.value = log.selfQuality || "";
  } else {
    form.elements.workDate.value = DEMO_TODAY;
    // Khoi phuc nhap dang go do (neu co) - chi khi tao MOI thuc su (khong
    // phai dang gan san 1 viec duoc giao, tranh de nham noi dung cu).
    if (!presetTaskId) {
      const draft = loadJournalDraft();
      if (draft) {
        if (draft.category) form.elements.category.value = draft.category;
        form.elements.title.value = draft.title || "";
        form.elements.result.value = draft.result || "";
        if (draft.workRole) form.elements.workRole.value = draft.workRole;
        if (draft.duration) form.elements.duration.value = draft.duration;
        form.elements.evidence.value = draft.evidence || "";
        if (draft.selfComplexity) form.elements.selfComplexity.value = draft.selfComplexity;
        if (draft.selfQuality) form.elements.selfQuality.value = draft.selfQuality;
        if (draft.workDate) form.elements.workDate.value = draft.workDate;
        showToast("Đã khôi phục nội dung nháp trước đó.");
      }
    }
  }
  setVisible(document.getElementById("copyJournalBlock"), !canEdit);
  document.getElementById("copyJournalPanel").hidden = true;
  document.getElementById("copyJournalSearch").value = "";
  renderCopyJournalList("");
  refreshJournalSubmitToOptions(canEdit ? log : null);
  refreshJournalTaskOptions(canEdit ? log : null, presetTaskId);
  checkJournalDateWarning();
  document.getElementById("journalModal").hidden = false;
  (canEdit ? form.elements.title : form.elements.category).focus();
  if (!canEdit) bindJournalDraftAutosave();
}

// Tu luu nhap noi dung dang go trong form tao nhat ky MOI (khong ap dung
// khi dang sua/trinh lai, vi du lieu do da la that) - phong khi lo tat
// tab/mat mang giua chung, khong mat trang noi dung da go.
const JOURNAL_DRAFT_KEY = "vks-journal-draft-demo-v1";
function loadJournalDraft() {
  try { return JSON.parse(localStorage.getItem(JOURNAL_DRAFT_KEY)); } catch { return null; }
}
function clearJournalDraft() { localStorage.removeItem(JOURNAL_DRAFT_KEY); }
function saveJournalDraft() {
  if (state.editingJournalId) return;
  const f = document.getElementById("journalForm");
  if (!f) return;
  const draft = {
    workDate: f.elements.workDate.value, category: f.elements.category.value, title: f.elements.title.value,
    result: f.elements.result.value, workRole: f.elements.workRole.value, duration: f.elements.duration.value,
    evidence: f.elements.evidence.value, selfComplexity: f.elements.selfComplexity.value, selfQuality: f.elements.selfQuality.value
  };
  if (!draft.title && !draft.result) { clearJournalDraft(); return; }
  localStorage.setItem(JOURNAL_DRAFT_KEY, JSON.stringify(draft));
}
let journalDraftBound = false;
function bindJournalDraftAutosave() {
  if (journalDraftBound) return;
  journalDraftBound = true;
  document.getElementById("journalForm").addEventListener("input", saveJournalDraft);
}

// Gan nhat ky voi 1 viec duoc giao (khong bat buoc) - chi cho chon khi
// TAO MOI (giong "Sao chep nhat ky cu"), vi khi sua/trinh lai lien ket
// da co san va khong thay doi. Danh sach chi liet ke viec dang "cho
// thuc hien" cua CHINH minh (task.assigneeId === currentUser().id).
// Khi chon 1 viec, tu dong "nop" nhat ky cho DUNG nguoi da giao viec do
// (task.assignerId) va khoa o "Nop cho lanh dao" lai - khong con chon
// tay, tranh nham lan.
function refreshJournalTaskOptions(editingLog, presetTaskId) {
  const field = document.getElementById("journalTaskField");
  const select = document.getElementById("journalTaskSelect");
  if (!field || !select) return;
  if (editingLog) { field.hidden = true; return; }
  const pendingTasks = tasksAssignedToMe().filter(task => task.status === "pending");
  field.hidden = pendingTasks.length === 0;
  select.innerHTML = `<option value="">— Không gắn với việc được giao —</option>` + pendingTasks.map(task => `<option value="${task.id}">${task.title}</option>`).join("");
  if (presetTaskId && pendingTasks.some(task => task.id === presetTaskId)) {
    select.value = presetTaskId;
    const task = pendingTasks.find(item => item.id === presetTaskId);
    if (task) document.getElementById("journalForm").elements.title.value = task.title;
  }
  applyTaskLinkToSubmitTo();
}

// Dong bo o "Nop cho lanh dao" theo lua chon o "Gan voi viec duoc giao"
// hien tai - goi lai moi khi mo form HOAC nguoi dung tu doi lua chon o
// select viec (xem binding trong initialize()).
function applyTaskLinkToSubmitTo() {
  const taskSelect = document.getElementById("journalTaskSelect");
  const submitToSelect = document.getElementById("journalSubmitToSelect");
  if (!taskSelect || !submitToSelect) return;
  const task = taskSelect.value ? taskAssignments.find(item => item.id === taskSelect.value) : null;
  if (task) {
    submitToSelect.value = task.assignerId;
    submitToSelect.disabled = true;
  } else {
    submitToSelect.disabled = false;
  }
}

// Liet ke lanh dao truc tiep cua 1 don vi (Truong phong + toan bo Pho
// phong) - cho phep cán bo/KSV tu chon nop nhat ky cho dung nguoi da
// giao viec do, thay vi gan co dinh 1 nguoi duoc uy quyen (xem
// canReviewLog()).
function directLeadersFor(unitId, excludeId = null) {
  return users.filter(user => user.unitId === unitId && (user.role === "unit_head" || user.role === "unit_deputy") && user.id !== excludeId);
}

function refreshJournalSubmitToOptions(editingLog) {
  const select = document.getElementById("journalSubmitToSelect");
  if (!select) return;
  const user = currentUser();
  const leaders = directLeadersFor(user.unitId, user.id);
  select.innerHTML = leaders.map(leader => `<option value="${leader.id}">${leader.name} · ${ROLE_LABELS[leader.role]}</option>`).join("");
  select.disabled = false;
  if (editingLog && editingLog.submittedToId) select.value = editingLog.submittedToId;
}

// Cho phep nhap lui ngay (khong khoa qua khu), chi canh bao nhe khi chon
// ngay qua xa - khong chan gui.
function checkJournalDateWarning() {
  const input = document.getElementById("journalForm").elements.workDate;
  const warning = document.getElementById("journalDateWarning");
  const value = input.value;
  if (!value) { warning.hidden = true; return; }
  const diffDays = Math.round((new Date(`${DEMO_TODAY}T00:00:00`) - new Date(`${value}T00:00:00`)) / 86400000);
  if (diffDays > 14) {
    warning.textContent = `Bạn đang ghi nhật ký cho một ngày khá xa (${diffDays} ngày trước) — hãy đảm bảo đúng thực tế công việc.`;
    warning.hidden = false;
  } else {
    warning.hidden = true;
  }
}

// Tim va sao chep nhat ky cu: chi hien trong form tao MOI (khong phai
// sua/trinh lai), liet ke nhat ky cua chinh nguoi dung, moi nhat truoc,
// loc song theo tu khoa.
function renderCopyJournalList(query) {
  const user = currentUser();
  const q = query.trim().normalize("NFC").toLowerCase();
  const mine = logs.filter(log => log.authorId === user.id)
    .filter(log => !q || `${log.title} ${log.result}`.normalize("NFC").toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
  const list = document.getElementById("copyJournalList");
  list.innerHTML = mine.length ? mine.slice(0, 30).map(log => `<button type="button" class="copy-journal-item" data-copy-journal="${log.id}"><strong>${log.title}</strong><span>${shortDate(log.date)} · ${log.category}</span></button>`).join("") : `<div class="empty-state compact-empty"><strong>Không tìm thấy nhật ký phù hợp</strong></div>`;
  list.querySelectorAll("[data-copy-journal]").forEach(button => button.addEventListener("click", () => applyCopyJournal(button.dataset.copyJournal)));
}

function applyCopyJournal(logId) {
  const log = logs.find(item => item.id === logId);
  if (!log) return;
  const form = document.getElementById("journalForm");
  form.elements.category.value = log.category;
  form.elements.title.value = log.title;
  form.elements.result.value = log.result;
  form.elements.workRole.value = log.workRole;
  form.elements.duration.value = log.duration;
  form.elements.evidence.value = log.evidence || "";
  document.getElementById("copyJournalPanel").hidden = true;
  showToast("Đã sao chép nội dung từ nhật ký cũ — kiểm tra lại trước khi gửi.");
}

function closeJournalModal() {
  state.editingJournalId = null;
  document.getElementById("journalModal").hidden = true;
}

function submitJournal(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const user = currentUser();
  // Doc truc tiep tu DOM (khong qua FormData) vi o nay co the bi disable
  // khi khoa theo viec duoc giao - truong "disabled" bi FormData bo qua.
  const submittedToId = event.currentTarget.elements.submittedToId.value || null;
  const editingLog = state.editingJournalId ? logs.find(log => log.id === state.editingJournalId) : null;
  if (editingLog) {
    if (editingLog.authorId !== user.id || editingLog.status !== "revision") {
      showToast("Nhật ký này không còn ở trạng thái được phép chỉnh sửa.");
      closeJournalModal();
      renderJournal();
      return;
    }
    const now = new Date().toISOString();
    const reviewHistory = [...(editingLog.reviewHistory || []), {
      status: "revision",
      reviewerId: editingLog.reviewerId,
      reviewedAt: editingLog.reviewedAt,
      complexity: editingLog.complexity,
      quality: editingLog.quality,
      comment: editingLog.comment,
      previousTitle: editingLog.title,
      previousResult: editingLog.result,
      resubmittedAt: now
    }];
    Object.assign(editingLog, {
      date: data.get("workDate"), category: data.get("category"), title: data.get("title"), result: data.get("result"),
      workRole: data.get("workRole"), duration: data.get("duration"), evidence: data.get("evidence"),
      selfComplexity: Number(data.get("selfComplexity")), selfQuality: Number(data.get("selfQuality")),
      submittedToId: submittedToId || editingLog.submittedToId,
      status: "pending", complexity: null, quality: null, reviewerId: null, comment: "", reviewedAt: null,
      updatedAt: now, resubmittedAt: now, revisionCount: reviewHistory.length, reviewHistory
    });
    saveLogs();
    // Neu nhat ky nay gan voi 1 viec duoc giao, trinh lai cung dua task
    // ve "reported" (truoc do bi applyReview dua ve "pending" khi tra lai).
    if (editingLog.taskAssignmentId) {
      const task = taskAssignments.find(item => item.id === editingLog.taskAssignmentId);
      if (task) { task.status = "reported"; saveTaskAssignments(); }
    }
    closeJournalModal();
    showToast("Đã chỉnh sửa và trình lại lãnh đạo chấm điểm.");
    renderJournal();
    return;
  }
  const nextId = `NK${String(logs.length + 1).padStart(3, "0")}`;
  const taskAssignmentId = data.get("taskAssignmentId") || null;
  const linkedTask = taskAssignmentId ? taskAssignments.find(item => item.id === taskAssignmentId && item.assigneeId === user.id && item.status === "pending") : null;
  // Neu co gan voi 1 viec duoc giao, luon "nop" cho DUNG nguoi da giao
  // viec do (khong tin o "Nop cho lanh dao" - da bi khoa o giao dien,
  // nhung van tinh toan lai o day cho chac chan, phong khi bi can thiep).
  logs.push({
    id: nextId, authorId: user.id, unitId: user.unitId, date: data.get("workDate"), category: data.get("category"),
    title: data.get("title"), result: data.get("result"), workRole: data.get("workRole"), duration: data.get("duration"), evidence: data.get("evidence"),
    selfComplexity: Number(data.get("selfComplexity")), selfQuality: Number(data.get("selfQuality")),
    submittedToId: linkedTask ? linkedTask.assignerId : submittedToId,
    status: "pending", complexity: null, quality: null, reviewerId: null, comment: "", createdAt: new Date().toISOString(), reviewedAt: null,
    taskAssignmentId
  });
  if (linkedTask) { linkedTask.linkedLogId = nextId; linkedTask.status = "reported"; saveTaskAssignments(); }
  saveLogs();
  closeJournalModal();
  clearJournalDraft();
  showToast("Đã gửi nhật ký đến người đứng đầu đơn vị.");
  renderJournal();
}

function resetDemo() {
  logs = structuredClone(sampleLogs);
  personalNotes = structuredClone(samplePersonalNotes);
  stickyNotes = [];
  systemNotifications = [];
  delegations = structuredClone(sampleDelegations);
  taskAssignments = structuredClone(sampleTaskAssignments);
  monthlyReviews = structuredClone(sampleMonthly.concat(generateMonthlyHistory()));
  users.splice(0, users.length, ...users.filter(user => !user.id.startsWith("reg-")));
  registeredAccounts = [];
  defaultPersonnelState.forEach(item => {
    const user = userById(item.id);
    if (user) Object.assign(user, structuredClone(item));
  });
  auditEvents = [
    { at: "2026-08-20T08:15:00", actor: "Quản trị hệ thống", action: "Cập nhật danh mục nhân sự tháng 8", detail: "Đồng bộ đơn vị, chức vụ và trạng thái hiệu lực" },
    { at: "2026-08-18T14:30:00", actor: "Phạm Hải Anh", action: "Phân công lãnh đạo phụ trách", detail: "Phạm vi Phòng 1, Phòng 7 và Khu vực 1" }
  ];
  saveLogs();
  savePersonalNotes();
  saveStickyNotes();
  saveSystemNotifications();
  saveDelegations();
  saveTaskAssignments();
  localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(monthlyReviews));
  localStorage.setItem(REGISTERED_ACCOUNT_STORAGE_KEY, JSON.stringify(registeredAccounts));
  savePersonnelState();
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  notificationReadState = {};
  localStorage.removeItem(NOTIFICATION_READ_STORAGE_KEY);
  state.selectedReviewId = null;
  state.editingJournalId = null;
  state.selectedMonthlyUserId = null;
  state.dashboardUnit = "all";
  state.dashboardPeriod = "2026-08";
  state.dashboardComparisonMode = "unit";
  state.dashboardPersonUnit = "all";
  state.monthlyUnit = "all";
  state.monthlyPeriod = "2026-06";
  state.monthlySearch = "";
  state.journalStatusFilter = "all";
  state.journalSearch = "";
  state.notesMonth = DEMO_TODAY.slice(0, 7);
  state.notesSelectedDate = DEMO_TODAY;
  showToast("Đã khôi phục dữ liệu mẫu.");
  render();
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

initialize();
