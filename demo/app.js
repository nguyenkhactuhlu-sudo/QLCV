const STORAGE_KEY = "vks-worklog-demo-v3";
const MONTHLY_STORAGE_KEY = "vks-monthly-demo-v1";
const PERSONNEL_STORAGE_KEY = "vks-personnel-demo-v1";
const AUDIT_STORAGE_KEY = "vks-audit-demo-v1";
const REGISTRATION_CODE_STORAGE_KEY = "vks-registration-codes-demo-v1";
const REGISTERED_ACCOUNT_STORAGE_KEY = "vks-registered-accounts-demo-v1";
const NOTIFICATION_READ_STORAGE_KEY = "vks-notification-read-demo-v1";

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
  { id: "u04", name: "Phùng Đức Khương", title: "Phó Trưởng phòng", professionalTitle: "KSV Trung cấp", role: "unit_deputy", unitId: "p1", delegated: true, initials: "PK" },
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
  { id: "u33", name: "Vũ Văn Mạnh", title: "Viện trưởng", professionalTitle: "KSV Trung cấp", role: "unit_head", unitId: "kv9", initials: "VM" }
];

const sampleMonthly = [
  ["u01", null, 90, "A"], ["u02", 89.5, 89.5, "B"], ["u03", 90, 90, "A"], ["u04", 87, 89, "B"],
  ["u05", 87, 87, "B"], ["u06", 89, 89, "B"], ["u07", 90, 90, "A"], ["u08", 90, 90, "A"],
  ["u09", 90, 90, "A"], ["u10", 88, 88, "B"], ["u11", 90, 90, "A"], ["u12", 90, 90, "A"],
  ["u13", 90, 90, "A"], ["u14", 90, 90, "A"], ["u15", 89, 89, "B"], ["u16", 89, 89, "B"],
  ["u17", 89, 89, "B"], ["u18", 89, 89, "B"], ["u19", 84, 82, "B"], ["u21", 89, 89, "B"],
  ["u22", 90, 90, "A"], ["u23", 89, 89, "B"], ["u24", 89, 89, "B"], ["u25", 89, 89, "B"],
  ["u26", 90, 90, "A"], ["u27", 89, 89, "B"], ["u28", 89, 89, "B"], ["u29", 89, 89, "B"],
  ["u30", 89, 89, "B"], ["u31", 89, 89, "B"], ["u32", 89, 89, "B"], ["u33", 90, 90, "A"]
].map(([userId, selfScore, officialScore, classification]) => ({
  userId, period: "2026-06", selfScore, officialScore, classification,
  status: officialScore == null ? "pending" : "approved", note: "", approvedAt: officialScore == null ? null : "2026-07-27T09:00:00"
}));

const sampleRegistrationCodes = [
  { code: "P1-2026-A7K9", unitId: "p1", label: "Phòng 1", expiresAt: "2026-12-31", maxUses: 12, used: 4, active: true },
  { code: "KV1-2026-M4N8", unitId: "kv1", label: "Khu vực 1", expiresAt: "2026-12-31", maxUses: 24, used: 8, active: true },
  { code: "VP-2026-Q2R6", unitId: "vp", label: "Văn phòng", expiresAt: "2026-10-31", maxUses: 20, used: 11, active: true },
  { code: "P7-2026-C8T3", unitId: "p7", label: "Phòng 7", expiresAt: "2026-09-30", maxUses: 10, used: 10, active: false }
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

const query = new URLSearchParams(window.location.search);
const requestedUser = query.get("role");
const requestedView = query.get("view");
const state = {
  currentUserId: users.some(user => user.id === requestedUser) ? requestedUser : "u01",
  currentView: ["dashboard", "journal", "reviews", "monthly", "organization", "administration", "settings"].includes(requestedView) ? requestedView : "dashboard",
  selectedReviewId: null,
  editingJournalId: null,
  selectedMonthlyUserId: null,
  dashboardUnit: "all",
  dashboardPeriod: "2026-08",
  dashboardComparisonMode: "unit",
  dashboardPersonUnit: "all",
  dashboardSummarySort: { key: "count", direction: "desc" },
  monthlyUnit: "all",
  monthlyPeriod: "2026-06",
  journalStatusFilter: "all",
  journalSearch: ""
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

let logs = loadLogs();
let monthlyReviews = loadJson(MONTHLY_STORAGE_KEY, sampleMonthly.concat(generateMonthlyHistory()));
let registrationCodes = loadJson(REGISTRATION_CODE_STORAGE_KEY, sampleRegistrationCodes);
let registeredAccounts = loadJson(REGISTERED_ACCOUNT_STORAGE_KEY, []);
let notificationReadState = loadJson(NOTIFICATION_READ_STORAGE_KEY, {});
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

function currentUser() { return users.find(user => user.id === state.currentUserId); }
function unitById(id) { return units.find(unit => unit.id === id); }
function userById(id) { return users.find(user => user.id === id); }
function isLeader(user = currentUser()) { return ["province_head", "province_deputy", "unit_head", "unit_deputy"].includes(user.role); }
function isAdministrator(user = currentUser()) { return user.role === "administrator"; }
function formatDate(date) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`)); }
function shortDate(date) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T00:00:00`)); }
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

function dashboardLogs(includeAllPeriods = false) {
  const user = currentUser();
  let scoped = logs.filter(log => visibleUnitIds(user).includes(log.unitId));
  if (user.role === "staff") scoped = scoped.filter(log => log.authorId === user.id);
  if (state.dashboardUnit !== "all") scoped = scoped.filter(log => log.unitId === state.dashboardUnit);
  if (!includeAllPeriods && state.dashboardPeriod === "2026-08") scoped = scoped.filter(log => log.date.startsWith("2026-08"));
  if (!includeAllPeriods && state.dashboardPeriod === "2026-Q3") scoped = scoped.filter(log => log.date >= "2026-07-01" && log.date <= "2026-09-30");
  return scoped;
}

function canReviewLog(log, reviewer = currentUser()) {
  const author = userById(log.authorId);
  if (!author || reviewer.id === author.id) return false;
  if (reviewer.role === "province_head") {
    return author.role === "province_deputy" || author.role === "unit_head" || author.unitId === "province";
  }
  if (reviewer.role === "province_deputy") {
    return author.role === "unit_head" && (reviewer.assignedUnits || []).includes(author.unitId);
  }
  if (reviewer.role === "unit_head") return author.unitId === reviewer.unitId && author.role !== "unit_head";
  if (reviewer.role === "unit_deputy" && reviewer.delegated) return author.unitId === reviewer.unitId && author.role === "staff";
  return false;
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
  document.getElementById("openRegister").addEventListener("click", openRegisterModal);
  document.querySelectorAll("[data-close-register]").forEach(button => button.addEventListener("click", closeRegisterModal));
  document.getElementById("registerModal").addEventListener("click", event => {
    if (event.target.id === "registerModal") closeRegisterModal();
  });
  document.getElementById("registerForm").addEventListener("submit", submitRegistration);
  document.querySelectorAll("[data-demo-code]").forEach(button => button.addEventListener("click", () => {
    document.getElementById("registerForm").elements.registrationCode.value = button.dataset.demoCode;
  }));
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
  const input = document.getElementById("loginPassword");
  const button = document.getElementById("toggleLoginPassword");
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
  const admin = isAdministrator() || currentUser().role === "province_head";
  setVisible(document.querySelector(".admin-nav"), admin);
  if (!admin && state.currentView === "administration") state.currentView = "dashboard";
  // Co cau to chuc gio bao gom gan vai tro/don vi + khoa/mo tai khoan, chi
  // danh cho Vien truong tinh va QTV (giong pham vi ".admin-nav").
  setVisible(document.querySelector(".org-nav"), admin);
  if (!admin && state.currentView === "organization") state.currentView = "dashboard";
  // QTV khong ghi cong viec, khong can Nhat ky/Cham diem thang.
  const adminOnly = isAdministrator();
  setVisible(document.querySelector(".journal-nav"), !adminOnly);
  setVisible(document.querySelector(".monthly-nav"), !adminOnly);
  if (adminOnly && (state.currentView === "journal" || state.currentView === "monthly")) state.currentView = "dashboard";
}

function updateChrome(title, eyebrow) {
  const user = currentUser();
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageEyebrow").textContent = eyebrow;
  document.getElementById("sidebarUserName").textContent = user.name;
  document.getElementById("sidebarUserTitle").textContent = user.title || "";
  document.getElementById("pendingNavCount").textContent = reviewQueue().length;
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
  const renderers = { dashboard: renderDashboard, journal: renderJournal, reviews: renderReviews, monthly: renderMonthly, organization: renderOrganization, administration: renderAdministration, settings: renderSettings };
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
  const title = user.role === "province_head" ? "Tổng quan toàn tỉnh" : user.role === "province_deputy" ? "Các đơn vị được phân công" : user.role === "administrator" ? "Tổng quan dữ liệu demo" : user.role === "staff" ? "Kết quả công tác của tôi" : `Tổng quan ${unitById(user.unitId).short}`;
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
  document.getElementById("dashboardPeriodFilter").addEventListener("change", event => { state.dashboardPeriod = event.target.value; renderDashboard(); });
  const filter = document.getElementById("dashboardUnitFilter");
  if (filter) filter.addEventListener("change", event => { state.dashboardUnit = event.target.value; renderDashboard(); });
  const comparisonModeSelect = document.getElementById("comparisonMode");
  if (comparisonModeSelect) comparisonModeSelect.addEventListener("change", event => { state.dashboardComparisonMode = event.target.value; renderDashboard(); });
  const comparisonPersonUnit = document.getElementById("comparisonPersonUnit");
  if (comparisonPersonUnit) comparisonPersonUnit.addEventListener("change", event => { state.dashboardPersonUnit = event.target.value; renderDashboard(); });
  document.querySelectorAll("[data-summary-sort]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.summarySort;
    state.dashboardSummarySort = {
      key,
      direction: state.dashboardSummarySort.key === key && state.dashboardSummarySort.direction === "desc" ? "asc" : "desc"
    };
    renderDashboard();
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
  return users.filter(user => user.unitId === unitId).map(user => {
    const subset = items.filter(item => item.authorId === user.id);
    return aggregateRow(user.id, user.name, subset, 1, user.title);
  }).filter(row => row.count > 0);
}

function aggregateVisibleUsers(items, unitId = null) {
  const visibleUnits = visibleUnitIds();
  return users.filter(user => user.role !== "administrator" && visibleUnits.includes(user.unitId) && (!unitId || user.unitId === unitId)).map(user => {
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
  return `<div class="table-sort-help">Chọn tên cột để sắp xếp · nhấn lần nữa để đổi chiều</div><div class="table-wrap"><table><thead><tr><th>${isUnit ? "Đơn vị" : "Cán bộ"}</th>${sortableHeader("Kết quả", "count")}${sortableHeader("Tổng phức tạp", "complexityTotal")}${sortableHeader("Phức tạp BQ", "complexityAvg")}${sortableHeader("Chất lượng", "quality")}${sortableHeader("Tỷ lệ ≥ 8", "highQualityRate")}</tr></thead><tbody>${sortedRows.map(row => `<tr><td>${isUnit ? `<strong>${row.label}</strong><br><span class="metric-context">${row.people} người</span>` : `<div class="person-cell"><span class="mini-avatar">${userById(row.id).initials}</span><div><strong>${row.label}</strong><span>${row.sublabel}</span></div></div>`}</td><td class="numeric">${row.count}</td><td class="numeric">${row.complexityTotal}</td><td class="numeric">${row.complexityAvg.toFixed(1)}</td><td class="numeric"><span class="score-pill ${scoreClass(row.quality)}">${row.quality.toFixed(1)}</span></td><td class="numeric">${(row.highQuality / row.count * 100).toFixed(0)}%</td></tr>`).join("")}</tbody></table></div>`;
}

function renderJournal() {
  const user = currentUser();
  const mine = logs.filter(log => log.authorId === user.id).sort((a,b) => Number(b.status === "revision") - Number(a.status === "revision") || b.date.localeCompare(a.date));
  const pendingCount = mine.filter(item => item.status === "pending").length;
  const revisionCount = mine.filter(item => item.status === "revision").length;
  const filtered = mine.filter(item => {
    if (state.journalStatusFilter !== "all" && item.status !== state.journalStatusFilter) return false;
    if (state.journalSearch) {
      const q = state.journalSearch.toLowerCase();
      const hay = `${item.title} ${item.result}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  updateChrome("Nhật ký của tôi", "KẾT QUẢ CÔNG TÁC HẰNG NGÀY");
  document.getElementById("appView").innerHTML = `
    <div class="journal-header"><div><h2>${user.name}</h2><p>${user.title} · ${unitById(user.unitId).short}</p></div><button class="button button-primary" id="newJournal">+ Ghi nhật ký mới</button></div>
    <div class="metric-grid">
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
    <div class="journal-list">${filtered.length ? filtered.map(journalCard).join("") : `<div class="empty-state"><strong>Không có nhật ký phù hợp</strong>Thử đổi bộ lọc hoặc ghi nhật ký mới.</div>`}</div>`;
  document.getElementById("newJournal").addEventListener("click", () => openJournalModal());
  document.querySelectorAll("[data-edit-journal]").forEach(button => button.addEventListener("click", () => openJournalModal(button.dataset.editJournal)));
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

function journalCard(log) {
  const canEdit = log.status === "revision" && log.authorId === currentUser().id;
  const revisionFeedback = log.status === "revision" ? `<div class="revision-feedback"><strong>Lãnh đạo yêu cầu bổ sung</strong><span>${log.comment || "Cần chỉnh sửa, làm rõ kết quả công tác."}</span></div>` : "";
  const resubmission = log.revisionCount ? `<span class="meta-tag">Đã trình lại ${log.revisionCount} lần</span>` : "";
  return `<article class="journal-card ${log.status === "revision" ? "is-revision" : ""}"><div class="journal-date"><strong>${shortDate(log.date)}</strong>${log.date.slice(0,4)}</div><div class="journal-body"><h3>${log.title}</h3><p>${log.result}</p>${revisionFeedback}<div class="journal-meta"><span class="meta-tag">${log.category}</span><span class="meta-tag">${log.workRole}</span><span class="meta-tag">${log.duration}</span>${resubmission}<span class="status-pill ${statusClass(log.status)}">${statusLabel(log.status)}</span></div></div><div class="journal-side"><div class="journal-scores"><div class="score-box"><span>Phức tạp</span><strong>${log.complexity ?? "—"}</strong></div><div class="score-box"><span>Chất lượng</span><strong>${log.quality ?? "—"}</strong></div></div>${canEdit ? `<button type="button" class="button button-primary button-small" data-edit-journal="${log.id}">Sửa và trình lại</button>` : ""}</div></article>`;
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
      <section><div class="review-queue">${queue.length ? queue.map(log => {
        const author = userById(log.authorId);
        return `<button class="queue-item ${log.id === state.selectedReviewId ? "is-selected" : ""}" data-review-id="${log.id}"><strong>${author.name}</strong>${log.revisionCount ? `<span class="resubmission-badge">Trình lại lần ${log.revisionCount}</span>` : ""}<p>${log.title}</p><span class="queue-meta"><span>${unitById(log.unitId).short}</span><span>${shortDate(log.date)}</span></span></button>`;
      }).join("") : `<div class="panel empty-state"><strong>Đã xử lý hết</strong>Không còn nhật ký chờ đánh giá.</div>`}</div></section>
      <section class="panel review-detail">${selected ? reviewDetail(selected) : `<div class="empty-state"><strong>Không có nhật ký cần xử lý</strong>Hãy quay lại khi có nhật ký mới.</div>`}</section>
    </div>`;
  document.querySelectorAll("[data-review-id]").forEach(button => button.addEventListener("click", () => { state.selectedReviewId = button.dataset.reviewId; renderReviews(); }));
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
  const complexity = log.complexity || 6;
  const quality = log.quality || 8;
  const lastRevision = log.reviewHistory?.at(-1);
  const revisionContext = lastRevision ? `<div class="resubmission-context"><strong>Báo cáo đã được chỉnh sửa và trình lại lần ${log.revisionCount || log.reviewHistory.length}</strong><span>Yêu cầu trước: ${lastRevision.comment}</span></div>` : "";
  return `<div class="panel-header"><div><span class="eyebrow">${log.id} · ${formatDate(log.date)}</span><h2>${log.title}</h2><p>${author.name} · ${author.title} · ${unitById(log.unitId).short}</p></div></div>
    ${revisionContext}<div class="detail-section"><h3>Kết quả báo cáo</h3><p>${log.result}</p><div class="detail-grid"><div class="detail-item"><span>Lĩnh vực</span><strong>${log.category}</strong></div><div class="detail-item"><span>Vai trò</span><strong>${log.workRole}</strong></div><div class="detail-item"><span>Thời gian</span><strong>${log.duration}</strong></div><div class="detail-item"><span>Minh chứng</span><strong>${log.evidence || "Không có"}</strong></div></div></div>
    <div class="detail-section"><div class="rating-grid">
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
  Object.assign(log, { complexity, quality, comment, status, reviewerId: currentUser().id, reviewedAt: new Date().toISOString() });
  saveLogs();
  state.selectedReviewId = null;
  state.editingJournalId = null;
  showToast(status === "approved" ? "Đã xác nhận và chấm điểm nhật ký." : "Đã gửi yêu cầu bổ sung.");
  renderReviews();
}

function monthlyScope() {
  const user = currentUser();
  let scopedUsers = users.filter(person => person.role !== "administrator");
  if (user.role === "staff") scopedUsers = scopedUsers.filter(person => person.id === user.id);
  if (user.role === "unit_head" || user.role === "unit_deputy") scopedUsers = scopedUsers.filter(person => person.unitId === user.unitId);
  if (user.role === "province_deputy") scopedUsers = scopedUsers.filter(person => person.role === "unit_head" && (user.assignedUnits || []).includes(person.unitId));
  if (state.monthlyUnit !== "all") scopedUsers = scopedUsers.filter(person => person.unitId === state.monthlyUnit);
  return monthlyReviews.filter(review => review.period === state.monthlyPeriod && scopedUsers.some(person => person.id === review.userId));
}

function canApproveMonthly(person, reviewer = currentUser()) {
  if (!person || person.id === reviewer.id) return false;
  if (reviewer.role === "province_head") return person.role === "province_deputy" || person.role === "unit_head";
  if (reviewer.role === "province_deputy") return person.role === "unit_head" && (reviewer.assignedUnits || []).includes(person.unitId);
  if (reviewer.role === "unit_head") return person.unitId === reviewer.unitId && person.role !== "unit_head";
  if (reviewer.role === "unit_deputy" && reviewer.delegated) return person.unitId === reviewer.unitId && person.role === "staff";
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
      ${unitFilter}<div class="spacer"></div><button class="button button-secondary" id="exportMonthly">Xuất bảng CSV</button>
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
        ${monthlyTable(rows)}
      </section>
      <section class="panel monthly-detail">${selected ? monthlyDetail(selected) : `<div class="empty-state"><strong>Không có hồ sơ</strong>Chưa có dữ liệu phù hợp với phạm vi này.</div>`}</section>
    </div>`;

  document.querySelectorAll("[data-monthly-user]").forEach(button => button.addEventListener("click", () => { state.selectedMonthlyUserId = button.dataset.monthlyUser; renderMonthly(); }));
  const filter = document.getElementById("monthlyUnitFilter");
  if (filter) filter.addEventListener("change", event => { state.monthlyUnit = event.target.value; state.selectedMonthlyUserId = null; renderMonthly(); });
  document.getElementById("monthlyPeriodFilter").addEventListener("change", event => { state.monthlyPeriod = event.target.value; state.selectedMonthlyUserId = null; renderMonthly(); });
  document.getElementById("exportMonthly").addEventListener("click", () => exportMonthlyCsv(rows));
  const saveButton = document.getElementById("saveMonthlyReview");
  if (saveButton && selected) saveButton.addEventListener("click", () => saveMonthlyReview(selected));
  const selfButton = document.getElementById("saveSelfScore");
  if (selfButton && selected) selfButton.addEventListener("click", () => saveSelfScore(selected));
}

function monthlyTable(rows) {
  if (!rows.length) return `<div class="empty-state"><strong>Không có dữ liệu</strong>Hãy chọn phạm vi khác.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Chức vụ, chức danh</th><th>Đơn vị</th><th class="numeric">Tự chấm</th><th class="numeric">Chính thức</th><th class="numeric">Xếp loại</th><th></th></tr></thead><tbody>${rows.map(row => {
    const person = userById(row.userId);
    const selected = row.userId === state.selectedMonthlyUserId;
    return `<tr class="${selected ? "is-selected-row" : ""}"><td><div class="person-cell"><span class="mini-avatar">${person.initials}</span><div><strong>${person.name}</strong><span>${person.professionalTitle || ""}</span></div></div></td><td>${person.title}</td><td>${unitById(person.unitId).short}</td><td class="numeric">${row.selfScore ?? "—"}</td><td class="numeric"><strong>${row.officialScore ?? "—"}</strong></td><td class="numeric"><span class="grade-badge grade-${(row.classification || "pending").toLowerCase()}">${row.classification || "Chờ"}</span></td><td class="numeric"><button class="button button-secondary button-small" data-monthly-user="${person.id}">Xem căn cứ</button></td></tr>`;
  }).join("")}</tbody></table></div>`;
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
    ${mayApprove ? `<div class="detail-section"><div class="form-grid compact-form"><label class="field"><span>Điểm chính thức</span><input id="officialScore" type="number" min="0" max="100" step="0.25" value="${row.officialScore ?? row.selfScore ?? 0}"></label><label class="field"><span>Xếp loại</span><select id="classification"><option ${row.classification === "A" ? "selected" : ""}>A</option><option ${row.classification === "B" ? "selected" : ""}>B</option><option ${row.classification === "C" ? "selected" : ""}>C</option></select></label><label class="field field-wide"><span>Nhận xét/giải trình điều chỉnh</span><textarea id="monthlyNote" rows="2">${row.note || ""}</textarea></label></div><div class="review-actions"><button class="button button-primary" id="saveMonthlyReview">Duyệt và lưu</button></div></div>` : ""}
    ${isSelf ? `<div class="detail-section"><label class="field"><span>Điểm tự chấm của cá nhân</span><input id="selfScore" type="number" min="0" max="100" step="0.25" value="${row.selfScore ?? 0}"></label><div class="review-actions"><button class="button button-primary" id="saveSelfScore">Lưu điểm tự chấm</button></div></div>` : ""}
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

function exportMonthlyCsv(rows) {
  const escape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["Họ và tên", "Chức vụ", "Chức danh", "Đơn vị", "Điểm tự chấm", "Điểm chính thức", "Xếp loại"];
  const body = rows.map(row => { const person = userById(row.userId); return [person.name, person.title, person.professionalTitle, unitById(person.unitId).short, row.selfScore, row.officialScore, row.classification]; });
  const csv = "\ufeff" + [header, ...body].map(line => line.map(escape).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `tong-hop-cham-diem-${state.monthlyPeriod}-demo.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Đã xuất bảng tổng hợp CSV.");
}

const ROLE_LABELS = { province_head: "Viện trưởng tỉnh", province_deputy: "Phó Viện trưởng tỉnh", unit_head: "Trưởng phòng/Viện trưởng KV", unit_deputy: "Phó phòng/Phó Viện trưởng KV", staff: "Cán bộ/Kiểm sát viên", administrator: "Quản trị viên" };
const ROLE_OPTIONS = ["staff", "unit_deputy", "unit_head", "province_deputy", "province_head", "administrator"];

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
    <section class="panel panel-wide"><div class="panel-header"><div><h2>Gán vai trò và đơn vị</h2><p>Chỉ định chức vụ và đơn vị cho từng tài khoản. Viện trưởng/Phó Viện trưởng tỉnh chọn "Lãnh đạo Viện tỉnh" làm đơn vị. Với vai trò Phó Viện trưởng tỉnh, tick chọn thêm các đơn vị được phân công phụ trách.</p></div></div>${assignRoleTable(assignablePeople)}</section>
    <section class="panel panel-wide"><div class="panel-header"><div><h2>Quy tắc người chấm</h2><p>Không cho phép người dùng tự chấm nhật ký của mình</p></div></div><div class="org-role-list">
      <div class="org-role-row"><strong>Cán bộ, công chức</strong><p>Người đứng đầu đơn vị trực tiếp đánh giá; cấp phó chỉ chấm khi có ủy quyền.</p></div>
      <div class="org-role-row"><strong>Phó lãnh đạo đơn vị</strong><p>Viện trưởng khu vực hoặc Trưởng phòng đánh giá.</p></div>
      <div class="org-role-row"><strong>Người đứng đầu đơn vị</strong><p>Lãnh đạo tỉnh được phân công phụ trách đơn vị đánh giá.</p></div>
      <div class="org-role-row"><strong>Phó Viện trưởng tỉnh</strong><p>Viện trưởng tỉnh đánh giá.</p></div>
    </div></section></div>`;
  document.querySelectorAll("[data-save-role]").forEach(button => button.addEventListener("click", () => saveAccountRole(button.dataset.saveRole)));
  document.querySelectorAll("[data-toggle-active]").forEach(button => button.addEventListener("click", () => toggleAccountActive(button.dataset.toggleActive)));
  bindRoleSelectToggle();
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
    return `<tr><td><strong>${person.name}</strong></td><td><span class="status-pill ${active ? "status-approved" : "status-pending"}">${active ? "Đang hoạt động" : "Đã khoá"}</span></td><td>${roleSel}</td><td>${unitSel}</td><td>${checklist}</td><td class="numeric"><button class="button button-primary button-small" data-save-role="${person.id}">Lưu</button> ${lockBtn}</td></tr>`;
  }).join("")}</tbody></table></div>`;
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

function renderAdministration() {
  if (!(isAdministrator() || currentUser().role === "province_head")) { state.currentView = "dashboard"; renderDashboard(); return; }
  const activeUsers = users.filter(user => user.role !== "administrator");
  const heads = activeUsers.filter(user => user.role === "unit_head");
  const delegated = activeUsers.filter(user => user.delegated);
  const pendingAccounts = registeredAccounts.filter(account => account.accountStatus === "pending");
  const movableUsers = activeUsers.filter(user => !["province_head", "province_deputy", "unit_head"].includes(user.role));
  updateChrome("Quản trị nhân sự và phân quyền", "CẤU HÌNH CÓ THỜI GIAN HIỆU LỰC");
  document.getElementById("appView").innerHTML = `
    <div class="demo-notice"><strong>Mô phỏng quản trị</strong><span>Mọi thay đổi chỉ lưu trong trình duyệt này. Nhật ký cũ giữ nguyên đơn vị tại thời điểm phát sinh; quyền mới áp dụng từ thời điểm có hiệu lực.</span></div>
    <div class="metric-grid">
      ${metricCard("Nhân sự và tài khoản", activeUsers.length, `${pendingAccounts.length} tài khoản chờ xác nhận`, "")}
      ${metricCard("Đơn vị trực thuộc", units.length - 1, "Phòng chuyên trách và VKSND khu vực", "blue")}
      ${metricCard("Người đứng đầu", heads.length, "Đang có hiệu lực", "green")}
      ${metricCard("Ủy quyền đang hiệu lực", delegated.length, "Có thể thu hồi tức thời", "gold")}
    </div>
    <div class="admin-grid">
      <section class="panel"><div class="panel-header"><div><h2>Điều chuyển nhân sự</h2><p>Không sửa lịch sử; kết thúc phân công cũ và tạo phân công mới</p></div></div>
        <div class="form-grid compact-form">
          <label class="field field-wide"><span>Nhân sự</span><select id="adminPerson">${movableUsers.map(person => `<option value="${person.id}">${person.name} · ${person.title} · ${unitById(person.unitId).short}</option>`).join("")}</select></label>
          <label class="field"><span>Đơn vị mới</span><select id="adminTargetUnit">${units.filter(unit => unit.id !== "province").map(unit => `<option value="${unit.id}">${unit.short}</option>`).join("")}</select></label>
          <label class="field"><span>Ngày hiệu lực</span><input id="adminEffectiveDate" type="date" value="2026-09-01"></label>
        </div><div class="review-actions"><button class="button button-primary" id="applyTransfer">Mô phỏng điều chuyển</button></div>
      </section>
      <section class="panel"><div class="panel-header"><div><h2>Ủy quyền có thời hạn</h2><p>Cấp phó chỉ chấm trong phạm vi và thời hạn được giao</p></div></div>
        <div class="delegation-card"><div><strong>${userById("u04").name}</strong><span>${userById("u04").title} · ${unitById(userById("u04").unitId).short}</span></div><span class="status-pill ${userById("u04").delegated ? "status-approved" : "status-pending"}">${userById("u04").delegated ? "Đang hiệu lực" : "Đã thu hồi"}</span></div>
        <div class="detail-grid"><div class="detail-item"><span>Phạm vi</span><strong>Đánh giá nhật ký cán bộ trong đơn vị</strong></div><div class="detail-item"><span>Thời hạn demo</span><strong>01/08–31/08/2026</strong></div></div>
        <div class="review-actions"><button class="button ${userById("u04").delegated ? "button-danger" : "button-primary"}" id="toggleDelegation">${userById("u04").delegated ? "Thu hồi ủy quyền" : "Cấp lại ủy quyền"}</button></div>
      </section>
      <section class="panel panel-wide"><div class="panel-header"><div><h2>Mã đăng ký theo đơn vị</h2><p>Mã chỉ xác định đơn vị và quyền cán bộ mặc định; không cấp quyền lãnh đạo hoặc quản trị</p></div></div>
        <div class="code-generator"><label class="filter-field"><span>Đơn vị cấp mã</span><select id="codeUnit">${units.filter(unit => unit.id !== "province").map(unit => `<option value="${unit.id}">${unit.short}</option>`).join("")}</select></label><label class="filter-field"><span>Số lượt tối đa</span><input id="codeMaxUses" type="number" min="1" max="100" value="20"></label><label class="filter-field"><span>Ngày hết hạn</span><input id="codeExpiry" type="date" value="2026-12-31"></label><button class="button button-primary" id="generateCode">Tạo mã đơn vị</button></div>
        ${registrationCodeTable()}
      </section>
      <section class="panel panel-wide"><div class="panel-header"><div><h2>Tài khoản chờ xác nhận</h2><p>Đơn vị đã được xác định từ mã; quản trị chỉ đối chiếu danh sách nhân sự và kích hoạt</p></div></div>${pendingAccountTable(pendingAccounts)}</section>
      <section class="panel panel-wide"><div class="panel-header"><div><h2>Người đứng đầu các đơn vị</h2><p>Quyền đánh giá được suy ra từ chức vụ và khoảng thời gian hiệu lực</p></div></div>${headTable(heads)}</section>
      <section class="panel panel-wide"><div class="panel-header"><div><h2>Nhật ký thay đổi</h2><p>Không xóa lịch sử thay đổi nhân sự và phân quyền</p></div></div><div class="audit-list">${auditEvents.slice().reverse().map(event => `<div class="audit-row"><span class="audit-time">${new Date(event.at).toLocaleString("vi-VN")}</span><div><strong>${event.action}</strong><p>${event.detail}</p></div><span>${event.actor}</span></div>`).join("")}</div></section>
    </div>`;
  document.getElementById("applyTransfer").addEventListener("click", applyPersonnelTransfer);
  document.getElementById("toggleDelegation").addEventListener("click", toggleDelegation);
  document.getElementById("generateCode").addEventListener("click", generateRegistrationCode);
  document.querySelectorAll("[data-toggle-code]").forEach(button => button.addEventListener("click", () => toggleRegistrationCode(button.dataset.toggleCode)));
  document.querySelectorAll("[data-approve-account]").forEach(button => button.addEventListener("click", () => approveRegisteredAccount(button.dataset.approveAccount)));
}

function registrationCodeTable() {
  return `<div class="table-wrap code-table"><table><thead><tr><th>Đơn vị</th><th>Mã đăng ký</th><th class="numeric">Đã dùng</th><th>Hết hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>${registrationCodes.map(item => `<tr><td><strong>${unitById(item.unitId).short}</strong></td><td><code>${item.code}</code></td><td class="numeric">${item.used}/${item.maxUses}</td><td>${formatDate(item.expiresAt)}</td><td><span class="status-pill ${item.active ? "status-approved" : "status-revision"}">${item.active ? "Đang cấp" : "Đã khóa"}</span></td><td class="numeric"><button class="button button-secondary button-small" data-toggle-code="${item.code}">${item.active ? "Khóa mã" : "Mở lại"}</button></td></tr>`).join("")}</tbody></table></div>`;
}

function pendingAccountTable(accounts) {
  if (!accounts.length) return `<div class="empty-state compact-empty"><strong>Không có tài khoản chờ xử lý</strong>Tài khoản đăng ký hợp lệ sẽ xuất hiện tại đây.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Người đăng ký</th><th>Email</th><th>Đơn vị từ mã</th><th>Mã sử dụng</th><th></th></tr></thead><tbody>${accounts.map(account => `<tr><td><strong>${account.name}</strong></td><td>${account.email}</td><td>${unitById(account.unitId).short}</td><td><code>${account.registrationCode}</code></td><td class="numeric"><button class="button button-primary button-small" data-approve-account="${account.id}">Xác nhận tài khoản</button></td></tr>`).join("")}</tbody></table></div>`;
}

function generateRegistrationCode() {
  const unitId = document.getElementById("codeUnit").value;
  const maxUses = Number(document.getElementById("codeMaxUses").value);
  const expiresAt = document.getElementById("codeExpiry").value;
  if (!unitId || !expiresAt || !Number.isInteger(maxUses) || maxUses < 1) return showToast("Thông tin tạo mã chưa hợp lệ.");
  const prefix = unitById(unitId).short.replaceAll(" ", "").replaceAll("Phòng", "P").replaceAll("Khuvực", "KV").toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = `${prefix}-2026-${suffix}`;
  registrationCodes.push({ code, unitId, label: unitById(unitId).short, expiresAt, maxUses, used: 0, active: true });
  localStorage.setItem(REGISTRATION_CODE_STORAGE_KEY, JSON.stringify(registrationCodes));
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: "Tạo mã đăng ký đơn vị", detail: `${unitById(unitId).short} · ${maxUses} lượt · hết hạn ${formatDate(expiresAt)}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast(`Đã tạo mã ${code}.`);
  renderAdministration();
}

function toggleRegistrationCode(codeValue) {
  const item = registrationCodes.find(code => code.code === codeValue);
  if (!item) return;
  item.active = !item.active;
  localStorage.setItem(REGISTRATION_CODE_STORAGE_KEY, JSON.stringify(registrationCodes));
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: item.active ? "Mở lại mã đăng ký" : "Khóa mã đăng ký", detail: `${item.code} · ${unitById(item.unitId).short}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast(item.active ? "Đã mở lại mã đăng ký." : "Đã khóa mã đăng ký.");
  renderAdministration();
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

function headTable(heads) {
  return `<div class="table-wrap"><table><thead><tr><th>Đơn vị</th><th>Người đứng đầu</th><th>Chức vụ</th><th>Hiệu lực</th><th>Quyền chính</th></tr></thead><tbody>${heads.sort((a, b) => unitById(a.unitId).short.localeCompare(unitById(b.unitId).short, "vi")).map(person => `<tr><td><strong>${unitById(person.unitId).short}</strong></td><td>${person.name}</td><td>${person.title}</td><td><span class="status-pill status-approved">Đang hiệu lực</span></td><td>Đánh giá đơn vị; duyệt tháng</td></tr>`).join("")}</tbody></table></div>`;
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

function toggleDelegation() {
  const deputy = userById("u04");
  deputy.delegated = !deputy.delegated;
  savePersonnelState();
  auditEvents.push({ at: new Date().toISOString(), actor: currentUser().name, action: deputy.delegated ? "Cấp lại ủy quyền" : "Thu hồi ủy quyền", detail: `${deputy.name} · ${unitById(deputy.unitId).short}` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  showToast(deputy.delegated ? "Đã cấp lại ủy quyền trong demo." : "Đã thu hồi ủy quyền trong demo.");
  updateNav();
  renderAdministration();
}

function orgUnitCard(unit) {
  const head = users.find(user => user.unitId === unit.id && user.role === "unit_head");
  const memberCount = users.filter(user => user.unitId === unit.id).length;
  return `<div class="org-unit"><div><strong>${unit.short}</strong><span>${head ? head.name : "Chưa phân công người đứng đầu"}</span></div><span class="score-pill score-mid">${memberCount} người</span></div>`;
}

function openRegisterModal() {
  const form = document.getElementById("registerForm");
  form.reset();
  document.getElementById("registerModal").hidden = false;
  form.elements.fullName.focus();
}

function closeRegisterModal() { document.getElementById("registerModal").hidden = true; }

function submitRegistration(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const codeValue = String(data.get("registrationCode") || "").trim().toUpperCase();
  const code = registrationCodes.find(item => item.code === codeValue);
  const password = String(data.get("password") || "");
  const confirmPassword = String(data.get("confirmPassword") || "");
  const email = String(data.get("email") || "").trim().toLowerCase();
  if (!code) return showToast("Mã đăng ký không tồn tại.");
  if (!code.active || code.used >= code.maxUses) return showToast("Mã đăng ký đã hết lượt sử dụng hoặc bị khóa.");
  if (new Date(`${code.expiresAt}T23:59:59`) < new Date()) return showToast("Mã đăng ký đã hết hạn.");
  if (password !== confirmPassword) return showToast("Mật khẩu nhập lại chưa khớp.");
  if (users.some(user => user.email === email)) return showToast("Email này đã được đăng ký.");
  const fullName = String(data.get("fullName") || "").trim();
  const initials = fullName.split(/\s+/).slice(-2).map(part => part[0]).join("").toUpperCase();
  const account = {
    id: `reg-${Date.now()}`, name: fullName, email, title: "Cán bộ đăng ký", professionalTitle: "Chờ cập nhật",
    role: "staff", unitId: code.unitId, initials, accountStatus: "pending", registeredAt: new Date().toISOString(), registrationCode: code.code
  };
  users.push(account);
  registeredAccounts.push(account);
  code.used += 1;
  if (code.used >= code.maxUses) code.active = false;
  localStorage.setItem(REGISTERED_ACCOUNT_STORAGE_KEY, JSON.stringify(registeredAccounts));
  localStorage.setItem(REGISTRATION_CODE_STORAGE_KEY, JSON.stringify(registrationCodes));
  auditEvents.push({ at: new Date().toISOString(), actor: fullName, action: "Đăng ký tài khoản bằng mã đơn vị", detail: `${email} · ${unitById(code.unitId).short} · trạng thái chờ xác nhận` });
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditEvents));
  closeRegisterModal();
  showToast(`Đã đăng ký đúng ${unitById(code.unitId).short}; tài khoản đang chờ xác nhận.`);
  renderNotifications();
  if (state.currentView === "administration") renderAdministration();
}

function openJournalModal(logId = null) {
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
  } else {
    form.elements.workDate.value = "2026-08-22";
  }
  document.getElementById("journalModal").hidden = false;
  (canEdit ? form.elements.title : form.elements.category).focus();
}
function closeJournalModal() {
  state.editingJournalId = null;
  document.getElementById("journalModal").hidden = true;
}

function submitJournal(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const user = currentUser();
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
      status: "pending", complexity: null, quality: null, reviewerId: null, comment: "", reviewedAt: null,
      updatedAt: now, resubmittedAt: now, revisionCount: reviewHistory.length, reviewHistory
    });
    saveLogs();
    closeJournalModal();
    showToast("Đã chỉnh sửa và trình lại lãnh đạo chấm điểm.");
    renderJournal();
    return;
  }
  const nextId = `NK${String(logs.length + 1).padStart(3, "0")}`;
  logs.push({
    id: nextId, authorId: user.id, unitId: user.unitId, date: data.get("workDate"), category: data.get("category"),
    title: data.get("title"), result: data.get("result"), workRole: data.get("workRole"), duration: data.get("duration"), evidence: data.get("evidence"),
    status: "pending", complexity: null, quality: null, reviewerId: null, comment: "", createdAt: new Date().toISOString(), reviewedAt: null
  });
  saveLogs();
  closeJournalModal();
  showToast("Đã gửi nhật ký đến người đứng đầu đơn vị.");
  renderJournal();
}

function resetDemo() {
  logs = structuredClone(sampleLogs);
  monthlyReviews = structuredClone(sampleMonthly.concat(generateMonthlyHistory()));
  users.splice(0, users.length, ...users.filter(user => !user.id.startsWith("reg-")));
  registeredAccounts = [];
  registrationCodes = structuredClone(sampleRegistrationCodes);
  defaultPersonnelState.forEach(item => {
    const user = userById(item.id);
    if (user) Object.assign(user, structuredClone(item));
  });
  auditEvents = [
    { at: "2026-08-20T08:15:00", actor: "Quản trị hệ thống", action: "Cập nhật danh mục nhân sự tháng 8", detail: "Đồng bộ đơn vị, chức vụ và trạng thái hiệu lực" },
    { at: "2026-08-18T14:30:00", actor: "Phạm Hải Anh", action: "Phân công lãnh đạo phụ trách", detail: "Phạm vi Phòng 1, Phòng 7 và Khu vực 1" }
  ];
  saveLogs();
  localStorage.setItem(MONTHLY_STORAGE_KEY, JSON.stringify(monthlyReviews));
  localStorage.setItem(REGISTERED_ACCOUNT_STORAGE_KEY, JSON.stringify(registeredAccounts));
  localStorage.setItem(REGISTRATION_CODE_STORAGE_KEY, JSON.stringify(registrationCodes));
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
  state.journalStatusFilter = "all";
  state.journalSearch = "";
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
