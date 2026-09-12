// QLCV Production - Ket noi Supabase that, khong co du lieu demo
var U=null,V='dashboard',LOGS=[],UNITS=[],CATS=[],EDITING_ID=null,PROVINCE_UNIT_ID=null,REVIEW_QUEUE=[],SELECTED_REVIEW_ID=null,REVIEW_QUEUE_COLLAPSED=false,JOURNAL_SOURCE_NOTE_ID=null;
function $(i){return document.getElementById(i)}
// .sidebar va .nav-item co san "display:flex" trong styles.css, manh hon
// thuoc tinh "hidden" mac dinh cua trinh duyet - phai ep display truc tiep
// thi an/hien moi thuc su co tac dung.
function setVisible(el,visible){if(el)el.style.display=visible?'':'none'}
// "URL" bi bien "var URL=window.VITE_SUPABASE_URL" ben duoi ghi de len tan
// goc (window.URL), phai luu lai tham chieu goc truoc khi bi ghi de de con
// dung URL.createObjectURL/revokeObjectURL cho tinh nang xuat file.
var NativeURL=window.URL;
var URL=window.VITE_SUPABASE_URL;
var KEY=window.VITE_SUPABASE_ANON_KEY;
var API=URL+'/rest/v1/';var AUTH=URL+'/auth/v1/';var FUNCTIONS=URL+'/functions/v1/';
// "Ghi nho dang nhap": phien luu o localStorage (con sau khi dong trinh
// duyet) neu nguoi dung tich chon, hoac sessionStorage (mat khi dong tab/
// trinh duyet, giu nguyen khi F5) neu khong tich - dung chung 1 key 'st' o
// CA HAI noi, chi 1 noi co gia tri that tai 1 thoi diem. activeStorage()
// tra ve noi dang thuc su giu phien, uu tien localStorage.
function activeStorage(){
  if(localStorage.getItem('st'))return localStorage;
  if(sessionStorage.getItem('st'))return sessionStorage;
  return localStorage;
}
function tkn(){try{return JSON.parse(activeStorage().getItem('st')).t}catch(e){return''}}
function authHeaders(extra){var h={'apikey':KEY,'Authorization':'Bearer '+tkn()};if(extra)for(var k in extra)h[k]=extra[k];return h}

// Luu phien dang nhap kem thoi diem het han THAT (tu Supabase tra ve), tru
// bot 30 giay cho an toan, thay vi doan cung 1 gio nhu truoc.
// "remember" chi truyen khi dang nhap that (tu form) - khi lam moi ngam
// (refreshSession) khong truyen, de tu dong giu nguyen noi dang luu.
function saveSession(accessToken,refreshToken,expiresIn,remember){
  var expiresAt=Date.now()+(Number(expiresIn)||3600)*1000-30000;
  var payload=JSON.stringify({t:accessToken,r:refreshToken,e:expiresAt});
  var target=remember===undefined?activeStorage():(remember?localStorage:sessionStorage);
  target.setItem('st',payload);
  (target===localStorage?sessionStorage:localStorage).removeItem('st');
}
window.QLCV_saveSession=saveSession;

// Tu lam moi phien bang refresh_token khi access_token sap het han, de trang
// mo lau khong bi loi ngam (tuong tu nhu vua gap: thao tac bao thanh cong
// nhung khong co gi thay doi vi phien da het han ma khong ai biet).
async function refreshSession(){
  try{
    var st=activeStorage().getItem('st');if(!st)return false;
    var sj=JSON.parse(st);if(!sj.r)return false;
    var r=await fetch(AUTH+'token?grant_type=refresh_token',{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:sj.r})});
    var d=await r.json();
    if(!r.ok||!d.access_token)return false;
    saveSession(d.access_token,d.refresh_token,d.expires_in);
    return true;
  }catch(e){return false}
}

async function refreshSessionIfNearExpiry(){
  var st=activeStorage().getItem('st');if(!st)return;
  try{
    var sj=JSON.parse(st);
    if(sj.e&&sj.e-Date.now()<5*60*1000)await refreshSession();
  }catch(e){}
}
function scheduleSessionRefresh(){
  setInterval(refreshSessionIfNearExpiry,4*60*1000);
}
scheduleSessionRefresh();
// setInterval o tren co the bi trinh duyet "tam dung" khi tab chay nen/may
// tinh ngu (khong chay dung chu ky 4 phut) - neu nguoi dung mo lai tab sau
// mot thoi gian dai, access token co the da het han ma chua kip lam moi,
// dan toi thao tac dau tien bao loi "HTTP 401" du dang nhap. Chu dong kiem
// tra + lam moi ngay khi tab/cua so duoc active tro lai de tranh truong
// hop nay.
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible')refreshSessionIfNearExpiry();
});
window.addEventListener('focus',refreshSessionIfNearExpiry);
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

// Tu dong dan cao cac o textarea (Ket qua/San pham, Mo ta, Nhan xet...) theo
// dung do dai noi dung go vao - tranh phai cuon len xuong trong 1 o nho.
// Bo qua ".sticky-note-text" (ghi chu dang the note, chu dong lap day dung
// 100% chieu cao khung the co san - tu dong dan cao se pha vo bo cuc do).
// CSS di kem (.field textarea) da dat max-height + overflow-y:auto, nen
// truong hop dan 1 doan cuc dai van co thanh cuon rieng trong o, khong lam
// vo bo cuc trang.
function autoGrowTextarea(el){
  if(!el||el.tagName!=='TEXTAREA'||el.classList.contains('sticky-note-text'))return;
  el.style.height='auto';
  el.style.height=el.scrollHeight+'px';
}

var WORK_ROLE_LABEL={chu_tri:'Chủ trì',phoi_hop:'Phối hợp'};
var DURATION_LABEL={duoi_2_gio:'Dưới 2 giờ','2_4_gio':'2–4 giờ',tren_4_gio:'4 giờ - 1 ngày',nhieu_ngay:'Nhiều ngày'};
var STATUS_LABEL={pending:'Chờ đánh giá',approved:'Đã xác nhận',revision:'Cần bổ sung'};
var STATUS_CLASS={pending:'status-pending',approved:'status-approved',revision:'status-revision'};

// ============================================
// NHAT KY "PHAT TRIEN TINH NANG & SUA LOI" - danh cho nguoi dung khong
// ranh ky thuat, xem muc 6.x trong PROJECT_STRUCTURE.md truoc khi sua.
// QUY UOC: moi khi shipping 1 thay doi nguoi dung THAY DUOC tren giao
// dien (tinh nang moi, sua loi, cai tien) - them 1 dong MOI LEN DAU mang
// nay, viet bang tieng Viet thuong, khong dung tu ky thuat/ten bien/ten
// migration. type: 'feature' (🆕 Tinh nang moi) | 'fix' (🐛 Sua loi) |
// 'improve' (⚙️ Cai tien). Khong can sua gi khac - rc() ben duoi tu doc
// mang nay.
// ============================================
var CHANGELOG=[
  {date:'2026-09-12',type:'feature',text:'Thêm mục "Thùng rác" (menu bên trái): nhật ký bị xoá (tự xoá hoặc lãnh đạo xoá) nay chuyển vào thùng rác thay vì mất hẳn ngay - có thể khôi phục lại hoặc xoá vĩnh viễn khi chắc chắn không cần nữa, tránh mất dữ liệu thật khi bấm nhầm nút Xoá.'},
  {date:'2026-09-12',type:'improve',text:'Thêm phím tắt Esc để đóng nhanh các bảng/hộp thoại nổi (form ghi nhật ký, giao việc, ghi chú, duyệt điểm...) thay vì phải bấm nút Đóng/Huỷ.'},
  {date:'2026-09-12',type:'fix',text:'Sửa lỗi phiên đăng nhập bị coi là hết hạn (báo lỗi HTTP 401) khi để trang mở lâu ở tab nền hoặc máy tính vào chế độ ngủ - nay tự kiểm tra và làm mới phiên ngay khi quay lại tab thay vì chỉ chờ theo chu kỳ, tránh gặp lỗi khi vừa mở lại máy.'},
  {date:'2026-09-12',type:'feature',text:'Thêm mục tra cứu đầu việc theo Bảng danh mục KPI dùng chung của VKSND tối cao ngay trong form ghi nhật ký - chọn 1 việc sẽ tự điền "Lĩnh vực công tác" và gợi ý sẵn "Độ phức tạp" (vẫn tự sửa được); có nút "Không tìm thấy việc phù hợp? Dùng Công tác khác" khi không có việc nào khớp.'},
  {date:'2026-09-12',type:'improve',text:'Đổi danh mục "Lĩnh vực công tác" sang đúng 14 nhóm lĩnh vực của VKSND tối cao (đã lọc bỏ phần chỉ áp dụng ở cấp Tối cao, không có ở tỉnh/khu vực) cộng thêm "Công tác khác" - khoá cứng ô này (không cho chọn tay tuỳ ý), chỉ điền được qua mục tra cứu đầu việc hoặc "Công tác khác", tránh chọn sai/thiếu nhất quán lĩnh vực.'},
  {date:'2026-09-12',type:'improve',text:'Gợi ý mức điểm dưới ô "Tự đánh giá độ phức tạp" nay rút gọn thành "Theo gợi ý danh mục KPI Tối cao" khi vừa áp dụng gợi ý từ mục tra cứu đầu việc (đỡ lặp lại thông tin đã có sẵn ở nút phía trên); nếu tự gõ sửa lại điểm hoặc chọn "Công tác khác" (không có gợi ý), phần giải thích chi tiết theo từng mức vẫn hiện đầy đủ như trước.'},
  {date:'2026-09-12',type:'fix',text:'Nút "Giao việc và ghi nhật ký"/"Xác nhận, đồng thời ghi nhật ký của tôi" (tự mở sẵn form nhật ký) trước đây điền sẵn lĩnh vực "Quản lý, chỉ đạo điều hành" - do danh mục này đã đổi tên thành "Tổ chức cán bộ" nên nay điền sẵn "Công tác khác" cho đúng ý nghĩa, tránh để trống lĩnh vực.'},
  {date:'2026-09-11',type:'improve',text:'Sửa chú thích khung "Tài liệu hướng dẫn sử dụng" (mục Phát triển tính năng & sửa lỗi) cho rõ nghĩa hơn: "Hướng dẫn chi tiết cách sử dụng phần mềm, chi tiết cho từng vị trí công tác".'},
  {date:'2026-09-11',type:'feature',text:'Mục Phát triển tính năng & sửa lỗi: thêm khung "Tài liệu hướng dẫn sử dụng" cho phép tải ngay file hướng dẫn sử dụng QLCV (.docx) tại trang, nằm cạnh khung Liên hệ bộ phận kỹ thuật.'},
  {date:'2026-09-11',type:'improve',text:'Rút gọn nhãn nút "Giao việc và công việc được giao" thành "Giao việc & CV được giao" cho gọn màn hình; đồng thời bỏ gạch chân dòng "Độc lập - Tự do - Hạnh phúc" trong file Excel/PDF xuất báo cáo cho đúng thể thức văn bản hành chính (chỉ in đậm, không gạch chân).'},
  {date:'2026-09-10',type:'feature',text:'Đổi tên phần mềm thành "Bộ công cụ đánh giá kết quả thực hiện công việc (KPI)" (hiển thị ở trang đăng nhập và góc trên-trái); đổi khẩu hiệu thành "Ghi nhận từng kết quả công tác · Đánh giá đúng thẩm quyền · Điều hành bằng số liệu".'},
  {date:'2026-09-10',type:'feature',text:'Mục Phát triển tính năng & sửa lỗi: thêm khung "Liên hệ bộ phận kỹ thuật" (họ tên, năm sinh, số điện thoại) ở nửa màn hình bên phải đang để trống.'},
  {date:'2026-09-10',type:'fix',text:'Cập nhật lại danh mục lĩnh vực công tác trong bản demo cho khớp đúng với bản chạy thật (bản demo trước đó còn thiếu "Kiểm sát tạm giữ, tạm giam"/"Công tác đảng đoàn thể"/"Công tác khác" và còn giữ tên cũ "Khiếu nại, tố cáo" thay vì "Giải quyết đơn thư").'},
  {date:'2026-09-10',type:'improve',text:'Các ô nhập nội dung dài (Kết quả, Mô tả/yêu cầu, Nhận xét, Lý do nghỉ phép, Tên công việc...) nay cho phép bấm Enter để xuống dòng, tách đoạn cho thoáng; nội dung nhiều dòng cũng hiển thị lại đúng như lúc gõ (giữ nguyên chỗ xuống dòng).'},
  {date:'2026-09-10',type:'improve',text:'Màn "Duyệt và chấm điểm" nay chỉ hiển thị nhật ký nộp thẳng cho mình - bỏ hẳn khu "Đang chờ người khác xử lý" (nhật ký KSV nộp đích danh cho một cấp phó). Áp dụng cho mọi cấp trưởng.'},
  {date:'2026-09-10',type:'fix',text:'Sửa số ở nhãn thông báo cạnh menu cho đúng: (1) số nhật ký chờ duyệt ở "Duyệt và chấm điểm" nay chỉ đếm nhật ký nộp thẳng cho mình; (2) số ở "Giao việc" nay là số VIỆC đang mở cần theo dõi (việc đã giao chưa hoàn thành + việc được giao chưa làm xong), đếm theo việc (1 việc giao cho nhiều người tính 1), bỏ qua người đã rút khỏi việc - khớp đúng với số việc hiển thị trên màn hình.'},
  {date:'2026-09-10',type:'feature',text:'(Tạm thời) Mở tính năng "Sửa điểm đã chấm": lãnh đạo tự sửa lại điểm chính mình đã chấm cho cán bộ/KSV, chỉ với nhật ký trong tháng hiện tại - phục vụ đợt điều chỉnh theo cơ cấu chấm điểm mới. Nút nằm trong Nhật ký công tác của đơn vị.'},
  {date:'2026-09-10',type:'improve',text:'Thêm tag "Tự chấm: Phức tạp X · Chất lượng Y" ngay trên mỗi thẻ nhật ký (cạnh các tag lĩnh vực, vai trò, thời lượng...) - dễ đối chiếu với điểm chính thức lãnh đạo đã chấm mà không cần mở chi tiết.'},
  {date:'2026-09-10',type:'feature',text:'Thêm nút "Trả để chấm điểm lại" (cạnh "Điều chỉnh điểm" trong Nhật ký công tác của đơn vị) - lãnh đạo từ Trưởng phòng/Viện trưởng khu vực trở lên (kể cả Phó Viện trưởng tỉnh với Trưởng phòng) trả 1 nhật ký đã duyệt về đúng người đã chấm trước đó để chấm lại, kèm lời nhắn bắt buộc - dùng cho trường hợp bấm nhầm "Xác nhận kết quả" trong khi ý định là "Yêu cầu bổ sung".'},
  {date:'2026-09-10',type:'improve',text:'Đổi tên nút "Yêu cầu bổ sung" thành "Trả lại và yêu cầu bổ sung" cho rõ nghĩa hơn.'},
  {date:'2026-09-10',type:'feature',text:'Thêm nút "Xác nhận, đồng thời ghi nhật ký của tôi" ở màn Duyệt & chấm điểm - hoạt động như "Giao việc và ghi nhật ký": xác nhận/chấm điểm xong, tự mở sẵn form ghi nhật ký cá nhân ghi nhận việc đã bỏ thời gian duyệt/đánh giá công tác này, chỉ cần bổ sung rồi tự gửi như bình thường.'},
  {date:'2026-09-09',type:'feature',text:'Thêm tính năng "Ủy quyền xem/xuất báo cáo tổng hợp tháng": Viện trưởng có thể ủy quyền cho 1 người (vào mục Quản trị) xem và xuất báo cáo "Chấm điểm tháng" phạm vi toàn tỉnh như Viện trưởng - không cấp quyền duyệt/sửa điểm, vô thời hạn cho đến khi bị thu hồi.'},
  {date:'2026-09-09',type:'fix',text:'Sửa lỗi chuông thông báo không đồng bộ trạng thái "đã đọc" giữa điện thoại và máy tính (trước đây chỉ lưu trên từng máy/trình duyệt) - nay lưu lên hệ thống, đăng nhập ở đâu cũng thấy đúng tin nào đã xem, tin nào chưa.'},
  {date:'2026-09-09',type:'improve',text:'Bỏ yêu cầu bắt buộc nhận xét khi lãnh đạo chấm điểm chất lượng từ 9 trở lên (chỉ còn bắt buộc khi dưới 5 hoặc khi yêu cầu bổ sung) - cho phù hợp quy tắc chấm điểm mới, không còn coi mức 9-10 là thành tích đặc biệt cần giải trình.'},
  {date:'2026-09-09',type:'improve',text:'Điều chỉnh gợi ý thang điểm chất lượng: mức 7-8 đổi thành "Hoàn thành yêu cầu nhưng còn thiếu sót", mức 9-10 đổi thành "Kết quả đúng - đủ - kịp thời - rõ ràng" (không yêu cầu phải có sáng kiến/thành tích đặc biệt mới đạt điểm cao); bổ sung ghi chú nhắc dùng mục điểm cộng/trừ đột xuất khi chọn điểm 10 hoặc điểm 1.'},
  {date:'2026-09-09',type:'fix',text:'Sửa lỗi ô "Nộp cho lãnh đạo" vẫn hiện ra ở form ghi nhật ký của Viện trưởng tỉnh dù đã ẩn (nguyên nhân: 1 quy tắc CSS chung của khung nhập liệu vô tình mạnh hơn thao tác ẩn bằng JavaScript, đã bổ sung override còn thiếu).'},
  {date:'2026-09-09',type:'fix',text:'Chấm điểm tháng: sửa lỗi trang trống ("không có dữ liệu") khi ô lọc "Đơn vị" (chỉ dành cho Viện trưởng tỉnh/Quản trị) bị lưu lại từ tài khoản khác dùng chung trình duyệt, vô tình lọc mất luôn đơn vị của Trưởng/Phó phòng đang đăng nhập.'},
  {date:'2026-09-09',type:'improve',text:'Chấm điểm tháng: khi mở trang lần đầu, panel chi tiết bên phải nay mặc định hiện đúng hồ sơ của chính người đang đăng nhập (trước đây hiện ngẫu nhiên 1 người đầu danh sách).'},
  {date:'2026-09-09',type:'improve',text:'Nhật ký của Viện trưởng tỉnh nay tự lưu ngay (dùng điểm tự chấm làm điểm chính thức), không còn ô "Nộp cho lãnh đạo" vì không có ai ở trên để trình/chấm điểm.'},
  {date:'2026-09-09',type:'improve',text:'Đổi "Viện KSND tỉnh Bắc Ninh" thành "VKSND tỉnh Bắc Ninh" ở tên hệ thống trên góc trên và cuối thanh điều hướng.'},
  {date:'2026-09-09',type:'improve',text:'Nhật ký công tác của đơn vị: bổ sung chức vụ, chức danh, năm sinh ở 2 chế độ xem "Theo thời gian" và "Theo ngày" (trước đây chỉ có ở "Theo người").'},
  {date:'2026-09-08',type:'feature',text:'Danh sách người (Nhật ký công tác đơn vị, Chấm điểm tháng, Cơ cấu & phân quyền, Giao việc) nay hiện thêm chức vụ, chức danh và năm sinh của từng người - lãnh đạo nắm sơ bộ thông tin ngay không cần tra cứu riêng.'},
  {date:'2026-09-07',type:'feature',text:'Giao việc: "Sửa việc đã giao" nay sửa được TOÀN BỘ thông tin, kể cả đổi người chủ trì/phối hợp (trước đây chỉ sửa được tên việc/mô tả/hạn). Nếu người bị đổi/rút khỏi việc đã lỡ nộp nhật ký báo cáo rồi, nhật ký và dữ liệu đó vẫn được giữ nguyên trên tài khoản của họ, chỉ không còn thuộc danh sách đang hoạt động của việc đó nữa (có ghi chú "Đã rút khỏi việc này" để lãnh đạo biết). Chuông thông báo nay báo đầy đủ khi được giao việc mới, bị rút khỏi việc, hoặc việc được cập nhật nội dung.'},
  {date:'2026-09-07',type:'improve',text:'Giao việc: tách danh sách "Công việc đã giao" thành 2 khu riêng - "Đang thực hiện" và "Đã hoàn thành", mỗi khu có ô tìm kiếm riêng - tránh danh sách dài, khó tìm.'},
  {date:'2026-09-07',type:'feature',text:'Giao việc: bố cục lại màn hình - danh sách "Công việc đã giao" hiện ngay đầu trang bên trái (không phải cuộn qua form dài như trước), form giao việc gom vào 2 nút "+ Giao việc mới" ở góc trên. Thêm nút "+ Giao việc và ghi nhật ký" - giao việc xong tự mở sẵn 1 nhật ký cá nhân ghi nhận đã giao việc gì cho ai (vẫn xem lại/sửa và tự bấm Gửi như nhật ký thường, không tự động gửi).'},
  {date:'2026-09-07',type:'improve',text:'Ô chọn ngày (ghi nhật ký, nghỉ phép, ghi chú, giao việc, ủy quyền, tra cứu theo ngày...) gộp lại thành 1 ô gõ tay "dd/mm/yyyy" kèm nút lịch bấm chọn cho người không quen gõ tay - gọn hơn, vẫn luôn đúng thứ tự ngày/tháng/năm. Ô giờ hạn cũng gộp lại thành 1 ô "hh:mm".'},
  {date:'2026-09-07',type:'fix',text:'Nhật ký công tác của đơn vị (và Nhật ký của tôi): mỗi nhật ký nay ghi rõ nộp cho ai, nộp lúc mấy giờ ngày nào. Nhật ký bị trả về "Cần bổ sung" nay cũng ghi rõ lãnh đạo nào đã yêu cầu, không chỉ hiện nội dung yêu cầu chung chung.'},
  {date:'2026-09-07',type:'improve',text:'Tổng quan: đổi cột "Tổng độ phức tạp" trong bảng "Kết quả theo đơn vị/cán bộ" thành "Tỷ lệ đã chấm điểm" (số nhật ký đã được lãnh đạo chấm điểm / tổng số nhật ký đã nộp trong kỳ) - hữu ích hơn để theo dõi tiến độ chấm điểm.'},
  {date:'2026-09-07',type:'fix',text:'Ô chọn ngày (ghi nhật ký, nghỉ phép, ghi chú, ủy quyền, tra cứu theo ngày...) nay luôn hiển thị đúng thứ tự Ngày/Tháng/Năm quen thuộc, không còn phụ thuộc vào việc trình duyệt hiển thị kiểu ngày/tháng/năm hay tháng/ngày/năm (kiểu Mỹ).'},
  {date:'2026-09-07',type:'improve',text:'Điểm cộng/trừ đột xuất: Phó phòng/Phó Viện trưởng khu vực nay xem được điều chỉnh của cả đơn vị (trước đây chỉ xem được của chính mình nếu chưa được ủy quyền chấm điểm thay).'},
  {date:'2026-09-07',type:'improve',text:'Cơ cấu & phân quyền: sau khi bấm "Lưu" vai trò/đơn vị, màn hình không còn đóng hết các nhóm đang mở và nhảy về đầu trang nữa (trước đây gây cảm giác như trang bị tải lại).'},
  {date:'2026-09-07',type:'feature',text:'Giao việc: người giao việc nay có thể "Sửa" (tên việc, mô tả, hạn gợi ý) hoặc "Xóa" việc đã giao, áp dụng cho tất cả người cùng nhận (chủ trì và phối hợp). Nhật ký đã báo cáo (nếu có) không bị xóa theo, chỉ gỡ liên kết.'},
  {date:'2026-09-07',type:'improve',text:'Giao việc/Ghi chú công việc: đổi ô chọn giờ hạn (hạn gợi ý, đặt hạn, giờ hạn chót) sang đúng khung 24 giờ (00-23 giờ), không còn phụ thuộc vào việc trình duyệt hiển thị kiểu sáng/chiều (AM/PM) hay không.'},
  {date:'2026-09-07',type:'fix',text:'Sửa lỗi không sửa được nhật ký đang "Chờ đánh giá" (chưa ai chấm điểm) - trước đây chỉ sửa được nhật ký bị trả lại "Cần bổ sung", muốn sửa nhật ký còn đang chờ duyệt phải xoá rồi ghi lại từ đầu. Nay bấm "Sửa" là chỉnh sửa được luôn.'},
  {date:'2026-09-07',type:'improve',text:'Giao việc: khu "Đã hoàn thành" nay mặc định thu gọn (chỉ hiện dòng tóm tắt số việc), bấm vào mới mở ra xem danh sách - đỡ chiếm chỗ màn hình.'},
  {date:'2026-09-07',type:'feature',text:'Giao việc: thêm nút "Ghi nhật ký cho việc này" ngay trên thẻ việc đã giao (cạnh "Sửa"/"Xóa") - dùng khi lãnh đạo lỡ quên ghi nhật ký lúc giao việc, bấm vào là mở sẵn form nhật ký điền trước nội dung, chỉ cần xem lại và gửi.'},
  {date:'2026-09-07',type:'improve',text:'Thanh điều hướng bên trái: rút ngắn khoảng cách thừa giữa thẻ tên người đăng nhập và nút "Tổng quan", bằng đúng khoảng cách giữa các nút khác cho gọn gàng.'},
  {date:'2026-09-07',type:'improve',text:'Các ô nhập nội dung dài (Kết quả/sản phẩm đầu ra, Mô tả, Nhận xét của lãnh đạo, Lý do...) nay tự động giãn cao theo đúng lượng chữ đã gõ, không còn phải cuộn lên xuống trong 1 ô nhỏ.'},
  {date:'2026-09-07',type:'improve',text:'Giao việc: ô "Tên công việc" nay tự xuống dòng và giãn cao khi hết bề ngang, không còn bị cố định trong 1 dòng phải cuộn ngang mới đọc hết.'},
  {date:'2026-09-08',type:'feature',text:'Chuông thông báo: rà soát và bổ sung 8 trường hợp thay đổi trước đây không báo cho người liên quan - xoá hẳn 1 việc đã giao, xoá điểm cộng/trừ đột xuất, đổi vai trò/đơn vị tài khoản, đổi phạm vi đơn vị phụ trách, khoá/mở khoá tài khoản, lãnh đạo xác nhận đơn nghỉ phép, cấp dưới tự chấm điểm tháng (báo cho người duyệt), cấp dưới tự đặt hạn hoàn thành việc được giao (báo cho người giao việc).'},
  {date:'2026-09-08',type:'improve',text:'Đổi tên lĩnh vực công tác "Kế toán" thành "Kế toán, đầu tư xây dựng cơ bản" cho đúng phạm vi công việc thực tế.'},
  {date:'2026-09-08',type:'fix',text:'Xuất báo cáo/nhật ký tháng: Phó Viện trưởng tỉnh đang trong thời gian được uỷ quyền thay mặt toàn tỉnh (nhưng không có đơn vị phân công cố định) nay xuất được toàn tỉnh, trước đây bị trả về rỗng.'},
  {date:'2026-09-08',type:'feature',text:'Thêm nút "Xuất nhật ký tháng" - liệt kê từng nhật ký thực tế đã ghi trong kỳ (ngày, lĩnh vực, nội dung, kết quả, điểm), nhóm theo từng người, khác với "Xuất báo cáo tháng" (chỉ có bảng tổng hợp điểm). Phạm vi đúng theo cấp: Viện trưởng - toàn tỉnh, Phó Viện trưởng - các đơn vị phụ trách, Trưởng/Phó phòng - cả đơn vị, cán bộ/KSV thường - nhật ký của chính mình (nút "Xuất báo cáo tháng" trên tài khoản cá nhân nay đổi thành "Xuất nhật ký tháng").'},
  {date:'2026-09-08',type:'fix',text:'Sửa lỗi bấm "Xuất Excel"/"Xuất PDF" (báo cáo/nhật ký tháng) không tải được file - do xung đột tên biến nội bộ khiến trình duyệt không tạo được file để tải.'},
  {date:'2026-09-08',type:'fix',text:'Chuông thông báo: sắp xếp lại đúng thứ tự mới nhất lên đầu (trước đây các loại thông báo bị gộp theo nhóm cố định, có lúc tin cũ lại hiện trên tin mới hơn).'},
  {date:'2026-09-06',type:'feature',text:'Thêm mục riêng "Điểm cộng/trừ đột xuất" (khen thưởng/kỷ luật phát hiện sau khi tháng đã chấm xong) - có thống kê tổng lượt/tổng điểm riêng, ghi thành từng dòng, không bao giờ mất, luôn áp dụng cho tháng hiện tại (không sửa lại điểm tháng đã chốt), người bị/được áp dụng xem được lý do. Có link nhảy nhanh từ "Chấm điểm tháng" sang.'},
  {date:'2026-09-06',type:'feature',text:'Nhật ký công tác của đơn vị: thêm cách xem "Theo ngày" - chọn 1 ngày cụ thể là thấy ngay ai đã nộp việc, ai đang nghỉ phép, ai chưa nộp trong ngày đó, giúp lãnh đạo đôn đốc kịp thời.'},
  {date:'2026-09-06',type:'fix',text:'Sửa lỗi Trưởng phòng/Viện trưởng khu vực có thể duyệt nhầm nhật ký mà KSV đã nộp đích danh cho 1 Phó - nay tách riêng thành 2 khu "Nộp cho tôi" và "Đang chờ người khác xử lý" trong màn Duyệt & chấm điểm.'},
  {date:'2026-09-06',type:'feature',text:'Ghi chú công việc: thêm nút "Ghi nhật ký cho việc này" - có thể dự thảo trước công việc trong ghi chú, đến khi hoàn thành chỉ cần bấm nút là tự điền sẵn nội dung sang form ghi nhật ký.'},
  {date:'2026-09-06',type:'feature',text:'Ghi chú công việc: có thể đặt giờ hạn chót và chọn thời điểm muốn được nhắc trước, chuông thông báo sẽ tự nhắc khi sắp đến hạn hoặc đã quá hạn.'},
  {date:'2026-09-06',type:'improve',text:'Giao việc: làm lại ô chọn "người phối hợp" - chia theo nhóm (Lãnh đạo dưới quyền/Cán bộ, KSV/Người lao động), có thể mở rộng/thu gọn, người đã chọn hiện thành thẻ nhỏ dễ theo dõi, vẫn tìm kiếm và tích chọn như cũ.'},
  {date:'2026-09-06',type:'feature',text:'Thêm lĩnh vực "Kế toán" vào danh sách lĩnh vực công tác khi ghi nhật ký.'},
  {date:'2026-09-06',type:'fix',text:'Nhận xét của lãnh đạo khi duyệt/chấm điểm nay hiển thị đầy đủ kèm theo nhật ký (trước đây bị ẩn mất trong nhiều trường hợp).'},
  {date:'2026-09-05',type:'fix',text:'Sửa lỗi Viện trưởng tỉnh có thể ủy quyền nhầm cho người không đúng cấp - nay chỉ ủy quyền được cho Phó Viện trưởng tỉnh.'},
  {date:'2026-09-05',type:'feature',text:'Khi tự chấm điểm lúc ghi nhật ký, hệ thống hiện luôn gợi ý mức điểm tương ứng (trước đây chỉ hiện khi lãnh đạo duyệt).'},
  {date:'2026-09-05',type:'improve',text:'Sắp xếp lại thứ tự các mục trong form ghi nhật ký cho hợp lý, dễ điền hơn.'},
  {date:'2026-09-05',type:'feature',text:'Thêm cách ghi "Nghỉ phép" và "Công việc nhiều ngày": chỉ cần ghi 1 lần cho cả khoảng ngày, hệ thống tự động tạo nhật ký cho từng ngày.'},
  {date:'2026-09-04',type:'feature',text:'Phân quyền giao việc và nhận việc rõ ràng hơn theo từng vai trò.'},
  {date:'2026-09-03',type:'feature',text:'Bổ sung, cập nhật lại danh mục lĩnh vực công tác và thêm thống kê theo lĩnh vực công tác.'},
  {date:'2026-09-03',type:'improve',text:'Sửa lại cách "Nộp cho lãnh đạo": Trưởng phòng/Viện trưởng khu vực nộp lên cấp tỉnh, Phó Viện trưởng tỉnh tự động nộp cho Viện trưởng.'},
  {date:'2026-08-31',type:'fix',text:'Tăng cường bảo mật tài khoản: khắc phục một số lỗi có thể bị lợi dụng để xem/thao tác sai quyền hạn; yêu cầu mật khẩu mới phải đủ mạnh hơn (tối thiểu 8 ký tự, có cả chữ và số).'},
  {date:'2026-08-30',type:'fix',text:'Sửa lỗi lãnh đạo cấp trên không điều chỉnh được điểm cấp dưới đã chấm; thêm hiển thị lịch sử chấm điểm.'},
  {date:'2026-08-29',type:'feature',text:'Đổi cách ủy quyền sang "nộp nhật ký đích danh cho lãnh đạo cụ thể"; cho phép ủy quyền thay mặt 100%; thêm giao việc cho nhiều người cùng lúc với hạn hoàn thành chính xác đến giờ/phút.'}
];

function catName(id){var c=CATS.find(function(x){return x.id===id});return c?c.name:'—'}

// Dong "so bo thong tin" 1 nguoi (chuc vu + chuc danh + nam sinh) - dung
// chung o moi noi lanh dao xem danh sach nguoi (Nhat ky cong tac don vi,
// Cham diem thang, Co cau & phan quyen, Giao viec) de nam bat nhanh, khong
// phai tra cuu rieng (yeu cau nguoi dung, 2026-09-08). Rong neu khong co gi.
function personBioLine(p){
  var parts=[];
  if(p.title)parts.push(p.title);
  if(p.professional_title)parts.push(p.professional_title);
  if(p.birth_year)parts.push('Sinh '+p.birth_year);
  return parts.join(' · ');
}
function isLeaveCategory(id){var c=CATS.find(function(x){return x.id===id});return !!(c&&c.is_leave)}
function shortDate(d){try{return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit'}).format(new Date(d+'T00:00:00'))}catch(e){return d||''}}
// Ngay day du "dd/mm/yyyy" tu chuoi "YYYY-MM-DD" (kieu DATE cua Postgres),
// ghep truc tiep tu chuoi - khong qua Date/locale - de tranh moi rui ro
// lech mui gio hoac dao thu tu.
function fullDate(d){if(!d)return '';var p=String(d).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d}
// Dinh dang co dinh "dd/mm/yyyy, hh:mm", tu ghep chuoi (khong dung
// toLocaleString mac dinh) de khong bao gio bi dao nguoc theo locale trinh
// duyet cua nguoi xem.
function shortDateTime(iso){
  try{
    var d=new Date(iso);
    if(isNaN(d.getTime()))return '';
    var p2=function(n){return String(n).padStart(2,'0')};
    return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+', '+p2(d.getHours())+':'+p2(d.getMinutes());
  }catch(e){return ''}
}
// Thoi gian "nop" thuc te cua 1 nhat ky: neu da tung tra lai (revision_count>0)
// thi tinh theo lan sua/trinh lai gan nhat (updated_at, tu dong cap nhat boi
// trigger DB), con lai la lan tao dau tien (created_at).
function submittedAtOf(l){return (l.revision_count?l.updated_at:l.created_at)||l.created_at||l.updated_at}
// Ghep chuoi "YYYY-MM"/"YYYY-MM-DD" truc tiep tu cac thanh phan gio dia
// phuong (y, m 0-index nhu Date, d 1-index) - KHONG di qua
// "new Date(y,m,d).toISOString()", vi cach do quy doi ve UTC va o mui gio
// UTC+7 (Viet Nam), nua dem ngay 1 dia phuong = 17h ngay cuoi thang truoc
// trong UTC, gay lech lui 1 thang/1 ngay. Da phat hien loi nay o nhieu noi
// dung chung mau "new Date(y,m,d).toISOString().slice(...)" (recentPeriods,
// bieu do xu huong, pham vi ngay cham diem thang...).
function ymStr(y,m){var mm=((m%12)+12)%12,yy=y+Math.floor(m/12);return yy+'-'+String(mm+1).padStart(2,'0')}
function ymdStr(y,m,d){return ymStr(y,m)+'-'+String(d).padStart(2,'0')}
function todayStr(){var d=new Date();return ymdStr(d.getFullYear(),d.getMonth(),d.getDate())}

// Thang xep loai chinh thuc, ap dung cho toan bo nguoi dung: 90-100=A,
// 80-89=B, 70-79=C, tu 69 tro xuong=D.
function classificationFromScore(score){
  var v=Number(score);
  if(!isFinite(v))return null;
  if(v>=90)return 'A';
  if(v>=80)return 'B';
  if(v>=70)return 'C';
  return 'D';
}

// Duoc goi boi supabase-auth.js ngay sau khi dang nhap thanh cong,
// hoac boi buoc kiem tra phien lam viec khi tai lai trang.
async function initU(t,uid,em){
  var profile=null;
  try{
    var pr0=await fetch(API+'profiles?id=eq.'+uid,{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    var pp0=await pr0.json();
    profile=pp0[0]||null;
  }catch(e){}

  if(profile&&profile.is_active===false){
    U={id:uid,n:profile.full_name||em,tl:'',rl:'staff',uid:profile.unit_id,in:'…',token:t,inactive:true};
    $('loginScreen').hidden=true;$('appShell').hidden=false;document.body.classList.remove('login-active');
    showInactiveScreen();
    return;
  }

  try{
    var p=profile||{};
    U={id:uid,n:p.full_name||em,tl:p.title||'',rl:p.role||'staff',uid:p.unit_id,in:p.initials||'U',token:t};
    var ur=await fetch(API+'units?select=id,code,name,short_name,type',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    UNITS=await ur.json();
    var province=UNITS.find(function(u){return u.type==='province'});
    PROVINCE_UNIT_ID=province?province.id:null;
    var cr=await fetch(API+'work_categories?select=id,name,is_leave&is_active=eq.true&order=sort_order',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    CATS=await cr.json();
    populateCategorySelect();
    var aur=await fetch(API+'unit_assignments?user_id=eq.'+uid+'&select=unit_id',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    var au=aur.ok?await aur.json():[];
    U.assignedUnits=(au||[]).map(function(x){return x.unit_id});
    // Uy quyen gio la "thay mat 100% toan don vi" (khong con danh sach
    // nguoi cu the) - chi can biet co dang active hay khong.
    var nowIso=new Date().toISOString();
    var delr=await fetch(API+'delegations?delegate_id=eq.'+uid+'&status=eq.active&starts_at=lte.'+nowIso+'&ends_at=gte.'+nowIso+'&select=id&limit=1',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    var del=delr.ok?await delr.json():[];
    U.hasFullDelegation=Array.isArray(del)&&del.length>0;
    // Uy quyen xem/xuat bao cao tong hop thang (migration 00077) - KHAC
    // uy quyen tren, vo thoi han (khong co ends_at) nen chi can kiem tra
    // status='active'.
    var mrdr=await fetch(API+'monthly_report_delegations?delegate_id=eq.'+uid+'&status=eq.active&select=id&limit=1',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    var mrd=mrdr.ok?await mrdr.json():[];
    U.hasMonthlyReportDelegation=Array.isArray(mrd)&&mrd.length>0;
  }catch(e){}
  $('loginScreen').hidden=true;$('appShell').hidden=false;document.body.classList.remove('login-active');
  ub();V='dashboard';render();showToast('Đăng nhập thành công!');
  refreshPendingBadge();
  refreshTaskOverdueBadge();
  renderNotificationsUI();
  startNotificationPolling();
}

// Tu lam moi chuong thong bao dinh ky khi dang mo app - truoc day chi cap
// nhat luc dang nhap/doi man hinh, de tab mo ca buoi thi viec moi giao/qua
// han khong tu hien cho toi khi tai lai trang.
var NOTIFICATION_POLL_INTERVAL=null;
function startNotificationPolling(){
  stopNotificationPolling();
  NOTIFICATION_POLL_INTERVAL=setInterval(function(){
    if(!U||U.inactive)return;
    renderNotificationsUI();
    refreshPendingBadge();
    refreshTaskOverdueBadge();
  },120000);
}
function stopNotificationPolling(){
  if(NOTIFICATION_POLL_INTERVAL){clearInterval(NOTIFICATION_POLL_INTERVAL);NOTIFICATION_POLL_INTERVAL=null}
}

function showInactiveScreen(){
  setVisible($('sidebar'),false);
  var nc=$('notificationCenter');if(nc)nc.hidden=true;
  var mm=$('mobileMenu');if(mm)mm.hidden=true;
  $('pageEyebrow').textContent='TÀI KHOẢN';$('pageTitle').textContent='Tài khoản đã bị khóa';
  $('appView').innerHTML='<div class="empty-state" style="margin-top:40px"><strong>Tài khoản của bạn hiện không hoạt động</strong><span>Vui lòng liên hệ Quản trị viên hệ thống để được kiểm tra và mở lại tài khoản.</span></div>';
}

// Chan cung o phia trinh duyet cho tai khoan da bi khoa - lop phong
// thu 2, ngoai viec RLS o database da chan ghi du lieu that.
function requireActive(){
  if(U&&U.inactive){showToast('Tài khoản đang bị khóa, chưa thể thao tác.');return false}
  return true;
}

function isLeader(){return U&&['province_head','province_deputy','unit_head','unit_deputy'].indexOf(U.rl)>=0}
function isAdminOrProvinceHead(){return U&&(U.rl==='administrator'||U.rl==='province_head')}
function canAssignTasks(){return isLeader()}
function canReceiveTasks(){return U&&U.rl!=='administrator'&&U.rl!=='province_head'}
function taskViewLabel(){
  if(U&&U.rl==='province_head')return 'Giao việc';
  return isLeader()?'Giao việc & CV được giao':'Công việc được giao';
}

// Danh mục đầu việc tham khảo theo Bảng danh mục KPI dùng chung VKSNDTC (đã hợp nhất góp ý,
// lọc còn các đầu việc áp dụng được cho VKS cấp Tỉnh). Nguồn: KPI_toi_cao/Bang_quy_doi_Do_phuc_tap.xlsx
// categoryId la UUID THAT cua work_categories tren Supabase (xem migration 2026-09-12 doi ten
// danh muc linh vuc cong tac sang dung 14 nhom cua Toi cao + 'Cong tac khac').
// Chi dung de GOI Y khi nhap nhat ky - khong bat buoc, nguoi dung luon sua duoc.
var KPI_TASK_CATALOG=[
{ma:"I-001",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn giải quyết Tin báo",sanPham:"Giải quyết xong 01 tin báo",donVi:"",muc:"Mức 1",diem:50,doPhucTap:2,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-002",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn giải quyết Tin báo",sanPham:"Giải quyết xong 01 tin báo",donVi:"",muc:"Mức 2",diem:100,doPhucTap:4,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-003",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn giải quyết Tin báo",sanPham:"Giải quyết xong 01 tin báo",donVi:"",muc:"Mức 3",diem:150,doPhucTap:6,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-004",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn giải quyết Tin báo",sanPham:"Giải quyết xong 01 tin báo",donVi:"",muc:"Mức 4",diem:200,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-005",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn giải quyết Tin báo",sanPham:"Giải quyết xong 01 tin báo",donVi:"",muc:"Mức 5",diem:300,doPhucTap:10,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-006",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Khởi tố, Điều tra, Truy tố, Xét xử sơ thẩm",sanPham:"XXST xong 01 vụ án",donVi:"",muc:"Mức 1",diem:100,doPhucTap:2,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-007",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Khởi tố, Điều tra, Truy tố, Xét xử sơ thẩm",sanPham:"XXST xong 01 vụ án",donVi:"",muc:"Mức 2",diem:200,doPhucTap:4,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-008",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Khởi tố, Điều tra, Truy tố, Xét xử sơ thẩm",sanPham:"XXST xong 01 vụ án",donVi:"",muc:"Mức 3",diem:300,doPhucTap:6,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-009",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Khởi tố, Điều tra, Truy tố, Xét xử sơ thẩm",sanPham:"XXST xong 01 vụ án",donVi:"",muc:"Mức 4",diem:500,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-010",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Khởi tố, Điều tra, Truy tố, Xét xử sơ thẩm",sanPham:"XXST xong 01 vụ án",donVi:"",muc:"Mức 5",diem:1000,doPhucTap:10,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-011",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Xét xử phúc thẩm",sanPham:"XXPT xong 01 vụ án",donVi:"",muc:"Mức 1",diem:50,doPhucTap:2,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-012",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Xét xử phúc thẩm",sanPham:"XXPT xong 01 vụ án",donVi:"",muc:"Mức 2",diem:100,doPhucTap:4,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-013",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Xét xử phúc thẩm",sanPham:"XXPT xong 01 vụ án",donVi:"",muc:"Mức 3",diem:150,doPhucTap:6,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-014",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Xét xử phúc thẩm",sanPham:"XXPT xong 01 vụ án",donVi:"",muc:"Mức 4",diem:200,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-015",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn Xét xử phúc thẩm",sanPham:"XXPT xong 01 vụ án",donVi:"",muc:"Mức 5",diem:300,doPhucTap:10,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-016",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn GĐT/Tái thẩm",sanPham:"XX GĐT xong 01 vụ án",donVi:"",muc:"Mức 1",diem:100,doPhucTap:2,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-017",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn GĐT/Tái thẩm",sanPham:"XX GĐT xong 01 vụ án",donVi:"",muc:"Mức 2",diem:200,doPhucTap:4,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-018",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn GĐT/Tái thẩm",sanPham:"XX GĐT xong 01 vụ án",donVi:"",muc:"Mức 3",diem:300,doPhucTap:6,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-019",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn GĐT/Tái thẩm",sanPham:"XX GĐT xong 01 vụ án",donVi:"",muc:"Mức 4",diem:500,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-020",linhVuc:"I. Hình sự",nhom:"",ten:"Giai đoạn GĐT/Tái thẩm",sanPham:"XX GĐT xong 01 vụ án",donVi:"",muc:"Mức 5",diem:1000,doPhucTap:10,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-021",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Kiểm sát bản án, quyết định của TA cấp sơ thẩm",sanPham:"Phiếu kiểm sát bản án",donVi:"01 phiếu",muc:"Tối cao 20đ · Tỉnh 10đ",diem:10,doPhucTap:2,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-022",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Kiểm sát bản án, quyết định của TA cấp phúc thẩm",sanPham:"Phiếu kiểm sát bản án",donVi:"01 phiếu",muc:"Tối cao 20đ · Tỉnh 10đ",diem:10,doPhucTap:2,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-023",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Kiểm sát bản án, quyết định của TA cấp giám đốc thẩm, tái thẩm",sanPham:"Phiếu kiểm sát bản án",donVi:"01 phiếu",muc:"Tối cao 30đ · Tỉnh 18đ",diem:18,doPhucTap:3,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-024",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Theo dõi, báo cáo đường lối xử lý các vụ án dư luận xã hội, cơ quan Trung ương quan tâm",sanPham:"Báo cáo đề xuất Lãnh đạo Viện",donVi:"01 báo cáo",muc:"Tối cao 300đ · Tỉnh 180đ",diem:180,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-025",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Ban hành Kháng nghị qua việc kiểm sát bản án",sanPham:"Kháng nghị",donVi:"01 kháng nghị",muc:"Tối cao 500đ · Tỉnh 300đ · Khu vực 150đ",diem:300,doPhucTap:9,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-026",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Ban hành Kiến nghị qua việc kiểm sát bản án",sanPham:"Kiến nghị",donVi:"01 kiến nghị",muc:"Tối cao 300đ · Tỉnh 180đ · Khu vực 90đ",diem:180,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-027",linhVuc:"I. Hình sự",nhom:"Công tác kiểm sát bản án hình sự",ten:"Ban hành Thông báo rút kinh nghiệm qua việc kiểm sát bản án",sanPham:"Thông báo rút kinh nghiệm",donVi:"01 Thông báo",muc:"Tối cao 200đ · Tỉnh 120đ · Khu vực 60đ",diem:120,doPhucTap:7,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-032",linhVuc:"I. Hình sự",nhom:"Giải quyết yêu cầu bồi thường trong TTHS",ten:"Thẩm định hồ sơ, đề xuất cấp kinh phí bồi thường thiệt hại (TTHS)",sanPham:"Báo cáo thẩm định + hồ sơ đề nghị cấp kinh phí",donVi:"01 hồ sơ",muc:"Tối cao 300đ · Tỉnh 210đ",diem:210,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-033",linhVuc:"I. Hình sự",nhom:"Giải quyết yêu cầu bồi thường trong TTHS",ten:"Thẩm định yêu cầu bồi thường trong tố tụng hình sự",sanPham:"Báo cáo thẩm định",donVi:"01 hồ sơ",muc:"Tối cao 350đ · Tỉnh 245đ",diem:245,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-034",linhVuc:"I. Hình sự",nhom:"Giải quyết yêu cầu bồi thường trong TTHS",ten:"Lập dự toán kinh phí chi trả việc bồi thường",sanPham:"Tổng hợp dự toán kinh phí",donVi:"01 dự toán",muc:"Tối cao 150đ · Tỉnh 100đ",diem:100,doPhucTap:7,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-035",linhVuc:"I. Hình sự",nhom:"Giải quyết yêu cầu bồi thường trong TTHS",ten:"Xây dựng báo cáo chuyên đề nghiệp vụ về bồi thường, Tòa án tuyên không phạm tội",sanPham:"Báo cáo chuyên đề",donVi:"01 báo cáo",muc:"Tối cao 100đ · Tỉnh 70đ",diem:70,doPhucTap:6,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-036",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Giải quyết đơn đề nghị GĐT, TT của công dân/cơ quan/tổ chức, đơn đề nghị của VKS cấp dưới (thủ tục rút gọn)",sanPham:"Báo cáo + Thông báo trả lời đơn",donVi:"01 đơn",muc:"Tối cao 200đ · Tỉnh 120đ",diem:120,doPhucTap:7,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-037",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Giải quyết đơn đề nghị GĐT, TT của công dân/cơ quan/tổ chức, đơn đề nghị của VKS cấp dưới (thông thường)",sanPham:"CV rút hồ sơ + Báo cáo + Thông báo trả lời đơn",donVi:"01 đơn",muc:"Tối cao 300đ · Tỉnh 200đ",diem:200,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-038",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Giải quyết đơn đề nghị GĐT, TT của cơ quan Trung ương, đại biểu Quốc hội (đơn ưu tiên)",sanPham:"Thông báo trả lời đơn",donVi:"01 đơn",muc:"Tối cao 350đ · Tỉnh 250đ",diem:250,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-039",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Giải quyết đơn KNTC phức tạp, phải thành lập Đoàn/Tổ xác minh",sanPham:"QĐ thành lập Tổ xác minh + CV yêu cầu phối hợp + Thông báo trả lời",donVi:"01 đơn",muc:"Tối cao 400đ · Tỉnh 300đ",diem:300,doPhucTap:9,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-040",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Ban hành Kiến nghị qua công tác giải quyết đơn",sanPham:"Kiến nghị",donVi:"01 kiến nghị",muc:"Tối cao 300đ · Tỉnh 180đ",diem:180,doPhucTap:8,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-041",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Ban hành Kháng nghị qua công tác giải quyết đơn",sanPham:"Quyết định kháng nghị",donVi:"01 kháng nghị",muc:"Tối cao 500đ · Tỉnh 400đ",diem:400,doPhucTap:9,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-042",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Ban hành Thông báo rút kinh nghiệm nghiệp vụ (giải quyết đơn GĐT/TT)",sanPham:"Thông báo rút kinh nghiệm",donVi:"01 Thông báo",muc:"Tối cao 200đ · Tỉnh 120đ",diem:120,doPhucTap:7,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-043",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Trả lời thỉnh thị / chỉ đạo về nghiệp vụ xét xử hình sự",sanPham:"Văn bản trả lời thỉnh thị / chỉ đạo",donVi:"01 văn bản",muc:"Tối cao 250đ · Tỉnh 150đ",diem:150,doPhucTap:7,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"I-044",linhVuc:"I. Hình sự",nhom:"Giải quyết đơn đề nghị kháng nghị GĐT, TT",ten:"Trao đổi nghiệp vụ / hướng dẫn, giải đáp khó khăn, vướng mắc về nghiệp vụ xét xử hình sự",sanPham:"Văn bản trao đổi / giải đáp",donVi:"01 văn bản",muc:"Tối cao 200đ · Tỉnh 120đ",diem:120,doPhucTap:7,categoryId:"1f3281eb-d587-46ad-aca1-71171080e429"},
{ma:"II-001",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết vụ, việc ở giai đoạn sơ thẩm",sanPham:"Giải quyết xong 01 vụ/ việc ở giai đoạn sơ thẩm",donVi:"",muc:"Mức 1",diem:50,doPhucTap:2,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-002",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết vụ, việc ở giai đoạn sơ thẩm",sanPham:"Giải quyết xong 01 vụ/ việc ở giai đoạn sơ thẩm",donVi:"",muc:"Mức 2",diem:100,doPhucTap:4,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-003",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết vụ, việc ở giai đoạn sơ thẩm",sanPham:"Giải quyết xong 01 vụ/ việc ở giai đoạn sơ thẩm",donVi:"",muc:"Mức 3",diem:150,doPhucTap:6,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-004",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết vụ, việc ở giai đoạn sơ thẩm",sanPham:"Giải quyết xong 01 vụ/ việc ở giai đoạn sơ thẩm",donVi:"",muc:"Mức 4",diem:200,doPhucTap:8,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-005",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết vụ, việc ở giai đoạn sơ thẩm",sanPham:"Giải quyết xong 01 vụ/ việc ở giai đoạn sơ thẩm",donVi:"",muc:"Mức 5",diem:300,doPhucTap:10,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-006",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Phúc thẩm",sanPham:"XXPT xong 01 vụ/ việc",donVi:"",muc:"Mức 1",diem:100,doPhucTap:2,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-007",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Phúc thẩm",sanPham:"XXPT xong 01 vụ/ việc",donVi:"",muc:"Mức 2",diem:200,doPhucTap:4,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-008",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Phúc thẩm",sanPham:"XXPT xong 01 vụ/ việc",donVi:"",muc:"Mức 3",diem:300,doPhucTap:6,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-009",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Phúc thẩm",sanPham:"XXPT xong 01 vụ/ việc",donVi:"",muc:"Mức 4",diem:400,doPhucTap:8,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-010",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Phúc thẩm",sanPham:"XXPT xong 01 vụ/ việc",donVi:"",muc:"Mức 5",diem:500,doPhucTap:10,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-011",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Giám đốc thẩm/ Tái thẩm",sanPham:"XXGĐT/TT xong 01 vụ/ việc",donVi:"",muc:"Mức 1",diem:150,doPhucTap:2,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-012",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Giám đốc thẩm/ Tái thẩm",sanPham:"XXGĐT/TT xong 01 vụ/ việc",donVi:"",muc:"Mức 2",diem:300,doPhucTap:4,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-013",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Giám đốc thẩm/ Tái thẩm",sanPham:"XXGĐT/TT xong 01 vụ/ việc",donVi:"",muc:"Mức 3",diem:400,doPhucTap:6,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-014",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Giám đốc thẩm/ Tái thẩm",sanPham:"XXGĐT/TT xong 01 vụ/ việc",donVi:"",muc:"Mức 4",diem:500,doPhucTap:8,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-015",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Xét xử Giám đốc thẩm/ Tái thẩm",sanPham:"XXGĐT/TT xong 01 vụ/ việc",donVi:"",muc:"Mức 5",diem:1000,doPhucTap:10,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-016",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết đơn đề nghị GĐT/TT (lĩnh vực dân sự)",sanPham:"Xong 01 vụ việc GĐT/TT",donVi:"",muc:"Mức 4 (theo góp ý, thiếu Mức 1&3)",diem:400,doPhucTap:8,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"II-017",linhVuc:"II. Dân sự, HNGĐ, Hành chính, KDTM, LĐ",nhom:"",ten:"Giải quyết đơn đề nghị GĐT/TT (lĩnh vực dân sự)",sanPham:"Xong 01 vụ việc GĐT/TT",donVi:"",muc:"Mức 5 (theo góp ý, thiếu Mức 1&3)",diem:1000,doPhucTap:10,categoryId:"1ed66990-a6a7-4a08-bc4d-3d70ebff9bc0"},
{ma:"III-001",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn 1: Tiếp nhận, xử lý thông tin; Thụ lý; Xác minh, thu thập chứng cứ; Yêu cầu khắc phục; Thông báo/Kiến nghị",sanPham:"Giải quyết xong 01 vụ việc",donVi:"",muc:"Mức 1",diem:100,doPhucTap:2,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-002",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn 1: Tiếp nhận, xử lý thông tin; Thụ lý; Xác minh, thu thập chứng cứ; Yêu cầu khắc phục; Thông báo/Kiến nghị",sanPham:"Giải quyết xong 01 vụ việc",donVi:"",muc:"Mức 2",diem:150,doPhucTap:4,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-003",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn 1: Tiếp nhận, xử lý thông tin; Thụ lý; Xác minh, thu thập chứng cứ; Yêu cầu khắc phục; Thông báo/Kiến nghị",sanPham:"Giải quyết xong 01 vụ việc",donVi:"",muc:"Mức 3",diem:200,doPhucTap:6,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-004",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn 1: Tiếp nhận, xử lý thông tin; Thụ lý; Xác minh, thu thập chứng cứ; Yêu cầu khắc phục; Thông báo/Kiến nghị",sanPham:"Giải quyết xong 01 vụ việc",donVi:"",muc:"Mức 4",diem:300,doPhucTap:8,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-005",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn 1: Tiếp nhận, xử lý thông tin; Thụ lý; Xác minh, thu thập chứng cứ; Yêu cầu khắc phục; Thông báo/Kiến nghị",sanPham:"Giải quyết xong 01 vụ việc",donVi:"",muc:"Mức 5",diem:500,doPhucTap:10,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-006",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Khởi kiện, Xét xử Sơ thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 1",diem:80,doPhucTap:2,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-007",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Khởi kiện, Xét xử Sơ thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 2",diem:120,doPhucTap:4,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-008",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Khởi kiện, Xét xử Sơ thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 3",diem:160,doPhucTap:6,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-009",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Khởi kiện, Xét xử Sơ thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 4",diem:250,doPhucTap:8,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-010",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Khởi kiện, Xét xử Sơ thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 5",diem:300,doPhucTap:10,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-011",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Xét xử Phúc thẩm / Giám đốc thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 1",diem:100,doPhucTap:2,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-012",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Xét xử Phúc thẩm / Giám đốc thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 2",diem:150,doPhucTap:4,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-013",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Xét xử Phúc thẩm / Giám đốc thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 3",diem:200,doPhucTap:6,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-014",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Xét xử Phúc thẩm / Giám đốc thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 4",diem:300,doPhucTap:8,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"III-015",linhVuc:"III. Khởi kiện bảo vệ nhóm dễ bị tổn thương / lợi ích công",nhom:"",ten:"Giai đoạn Xét xử Phúc thẩm / Giám đốc thẩm",sanPham:"Giải quyết xong 01 vụ án",donVi:"",muc:"Mức 5",diem:500,doPhucTap:10,categoryId:"a0d38966-0d45-4c16-8cf3-9db92697932b"},
{ma:"IV-001",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Trực tiếp kiểm sát (định kỳ / đột xuất) cơ sở giam giữ, cơ quan THAHS",sanPham:"Quyết định, Kế hoạch & Kết luận trực tiếp kiểm sát chính thức",donVi:"01 Cuộc kiểm sát",muc:"Theo cấp Tỉnh (60%)",diem:360,doPhucTap:9,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-002",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Trực tiếp kiểm sát hằng tuần tại cơ sở giam giữ (nhà tạm giữ, trại tạm giam)",sanPham:"Biên bản kiểm sát hằng tuần & Báo cáo kết quả kiểm sát",donVi:"01 Lượt/Tuần",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-003",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Kiểm tra nghiệp vụ kiểm sát giam giữ, THAHS theo kế hoạch công tác năm",sanPham:"Kế hoạch, Quyết định & Kết luận kiểm tra nghiệp vụ",donVi:"01 Cuộc kiểm tra",muc:"Theo cấp Tỉnh (60%)",diem:270,doPhucTap:8,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-004",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Kiểm tra nghiệp vụ do Lãnh đạo Viện / Đoàn liên ngành Trung ương chủ trì",sanPham:"Báo cáo tổng hợp, Biên bản & Kết luận kiểm tra liên ngành",donVi:"01 Cuộc kiểm tra",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-005",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Ban hành Kháng nghị, Kiến nghị trong kiểm sát tạm giữ, tạm giam, THAHS",sanPham:"Quyết định Kháng nghị / Quyết định Kiến nghị chính thức",donVi:"01 Quyết định",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-006",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Ban hành Quyết định Trả tự do cho người bị giam giữ trái pháp luật",sanPham:"Quyết định trả tự do & Biên bản kiểm sát thi hành",donVi:"01 Quyết định",muc:"Theo cấp Tỉnh (60%)",diem:180,doPhucTap:8,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-007",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Giải quyết đơn thư Khiếu nại, Tố cáo & kiểm sát giải quyết KNTC giam giữ",sanPham:"Quyết định giải quyết / Văn bản trả lời đơn thư công dân",donVi:"01 Hồ sơ đơn",muc:"Theo cấp Tỉnh (60%)",diem:210,doPhucTap:8,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-008",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Trả lời văn bản thỉnh thị địa phương / Công văn chỉ đạo nghiệp vụ",sanPham:"Công văn trả lời thỉnh thị / Công văn chỉ đạo nghiệp vụ",donVi:"01 Văn bản",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-009",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Phối hợp kiểm tra, giám sát liên ngành với các cơ quan Trung ương / Địa phương",sanPham:"Kế hoạch phối hợp & Kết luận kiểm tra, giám sát liên ngành",donVi:"01 Đợt phối hợp",muc:"Theo cấp Tỉnh (60%)",diem:300,doPhucTap:9,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-010",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Thực hiện nhiệm vụ Giúp việc Hội đồng đặc xá (thẩm định, thẩm tra hồ sơ)",sanPham:"Tờ trình, Báo cáo tổng hợp & Phiếu thẩm định/thẩm tra hồ sơ",donVi:"01 Đợt đặc xá",muc:"Theo cấp Tỉnh (60%)",diem:360,doPhucTap:9,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-011",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Yêu cầu tự kiểm tra và thông báo kết quả kiểm sát tạm giữ, tạm giam",sanPham:"Văn bản yêu cầu tự kiểm tra & Thông báo kết quả",donVi:"01 Văn bản",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-012",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Ban hành Thông báo rút kinh nghiệm nghiệp vụ kiểm sát THAHS",sanPham:"Thông báo rút kinh nghiệm chuyên môn được Lãnh đạo duyệt",donVi:"01 Thông báo",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-013",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Công văn trao đổi nghiệp vụ, giải đáp khó khăn, vướng mắc chuyên môn",sanPham:"Công văn trao đổi / giải đáp vướng mắc nghiệp vụ",donVi:"01 Công văn",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"IV-014",linhVuc:"IV. Kiểm sát giam giữ, THAHS",nhom:"",ten:"Quản lý, tổng hợp số liệu chuyên đề giam giữ, thi hành án hình sự",sanPham:"Bảng tổng hợp theo dõi & Báo cáo số liệu chuyên đề định kỳ",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"688c7ccf-1818-4915-bf6d-fdcf8d66d87e"},
{ma:"V-001",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Trực tiếp kiểm sát (định kỳ / đột xuất) cơ quan THADS, UBND, cơ quan liên quan",sanPham:"Quyết định, Kế hoạch & Kết luận trực tiếp kiểm sát chính thức",donVi:"01 Cuộc kiểm sát",muc:"Theo cấp Tỉnh (60%)",diem:360,doPhucTap:9,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-002",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Kiểm tra nghiệp vụ kiểm sát THADS, THAHC đối với các đơn vị cấp dưới",sanPham:"Kế hoạch, Quyết định & Kết luận kiểm tra nghiệp vụ được phê duyệt",donVi:"01 Cuộc kiểm tra",muc:"Theo cấp Tỉnh (60%)",diem:270,doPhucTap:8,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-003",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Ban hành Kháng nghị, Kiến nghị trong kiểm sát THADS, THAHC",sanPham:"Quyết định Kháng nghị / Văn bản Kiến nghị chính thức ban hành",donVi:"01 Quyết định/Văn bản",muc:"Theo cấp Tỉnh (60%)",diem:180,doPhucTap:8,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-004",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Giải quyết khiếu nại, tố cáo & kiểm sát giải quyết KNTC trong THADS, THAHC",sanPham:"Quyết định giải quyết / Quyết định thụ lý / Văn bản trả lời đơn thư",donVi:"01 Hồ sơ đơn",muc:"Theo cấp Tỉnh (60%)",diem:210,doPhucTap:8,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-005",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Trả lời văn bản thỉnh thị địa phương / Công văn chỉ đạo nghiệp vụ",sanPham:"Công văn trả lời thỉnh thị / Công văn chỉ đạo nghiệp vụ chính thức",donVi:"01 Văn bản",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-006",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Phúc tra việc thực hiện Kết luận kiểm sát / Kiến nghị về THADS, THAHC",sanPham:"Quyết định, Kế hoạch & Thông báo kết quả phúc tra",donVi:"01 Cuộc phúc tra",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-007",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Ban hành Thông báo rút kinh nghiệm nghiệp vụ kiểm sát THADS, THAHC",sanPham:"Thông báo rút kinh nghiệm chuyên môn được Lãnh đạo duyệt ban hành",donVi:"01 Thông báo",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-008",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Công văn trao đổi nghiệp vụ, giải đáp khó khăn, vướng mắc trong và ngoài ngành",sanPham:"Công văn trao đổi / giải đáp vướng mắc nghiệp vụ chính thức",donVi:"01 Công văn",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"V-009",linhVuc:"V. Kiểm sát THADS, THAHC",nhom:"",ten:"Quản lý, tổng hợp số liệu chuyên đề, lĩnh vực kiểm sát THADS, THAHC",sanPham:"Bảng tổng hợp theo dõi & Báo cáo số liệu chuyên đề định kỳ",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"0b471e43-5926-478a-8219-e3049726881b"},
{ma:"VI-001",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"1 TẾP CÔNG DÂN, PHÂN LOẠI VÀ XỬ LÝ ĐƠN KNTC",ten:"tiếp công dân thường kỳ / đột xuất",sanPham:"Biên bản tiếp công dân + Sổ tiếp công dân + Phiếu đề xuất xử lý",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:6,doPhucTap:1,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-002",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"1 TẾP CÔNG DÂN, PHÂN LOẠI VÀ XỬ LÝ ĐƠN KNTC",ten:"Phân loại, xử lý đơn không thuộc thẩm quyền / Đơn trùng",sanPham:"Văn bản chuyển đơn / Phiếu hướng dẫn / Thông báo xếp đơn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:3,doPhucTap:1,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-003",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"2 GIẢI QUYẾT ĐƠN KHÁNG CÁO, KHIẾU NẠI, TỐ CÁO THUỘC THẨM QUYỀN",ten:"Giải quyết đơn KNTC thông thường (Hp = 1.0 - 2.0)",sanPham:"Quyết định giải quyết khiếu nại / Kết luận nội dung tố cáo",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-004",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"2 GIẢI QUYẾT ĐƠN KHÁNG CÁO, KHIẾU NẠI, TỐ CÁO THUỘC THẨM QUYỀN",ten:"Giải quyết đơn KNTC phức tạp, phải thành lập Đoàn/Tổ xác minh (Hp = 3.0 - 5.0)",sanPham:"Quyết định thành lập Tổ xác minh + Báo cáo kết quả + Quyết định giải quyết / Kết luận tố cáo",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:130,doPhucTap:7,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-005",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"2 GIẢI QUYẾT ĐƠN KHÁNG CÁO, KHIẾU NẠI, TỐ CÁO THUỘC THẨM QUYỀN",ten:"Kiểm tra lại Quyết định giải quyết khiếu nại đã có hiệu lực pháp luật / Rút hồ sơ kiểm sát",sanPham:"Báo cáo kết quả kiểm tra + Quyết định giải quyết / Văn bản trả lời / Quyết định đình chỉ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:110,doPhucTap:7,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-006",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"3 KIỂM SAT VIỆC GIẢI QUYẾT KNTC TRONG HOẠT ĐỘNG TƯ PHÁP",ten:"Trực tiếp kiểm sát (TTKS) việc giải quyết đơn KNTC tại Cơ quan điều tra, Tòa án, THA",sanPham:"Quyết định, Kế hoạch TTKS + Biên bản làm việc + Kết luận trực tiếp kiểm sát",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:300,doPhucTap:9,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-007",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"3 KIỂM SAT VIỆC GIẢI QUYẾT KNTC TRONG HOẠT ĐỘNG TƯ PHÁP",ten:"Phúc tra việc thực hiện Kết luận TTKS / Kiến nghị",sanPham:"Quyết định, Kế hoạch phúc tra + Báo cáo kết quả phúc tra",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-008",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"3 KIỂM SAT VIỆC GIẢI QUYẾT KNTC TRONG HOẠT ĐỘNG TƯ PHÁP",ten:"Ban hành Kháng nghị / Kiến nghị tổng hợp vi phạm trong giải quyết KNTC",sanPham:"Quyết định Kháng nghị / Văn bản Kiến nghị tổng hợp",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-009",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"3 KIỂM SAT VIỆC GIẢI QUYẾT KNTC TRONG HOẠT ĐỘNG TƯ PHÁP",ten:"Ban hành Kiến nghị vi phạm cụ thể / Thông báo rút kinh nghiệm",sanPham:"Văn bản Kiến nghị vụ việc / Thông báo rút kinh nghiệm nghiệp vụ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-010",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"4 THỂ CHẾ, CHỈ ĐẠO NGHIỆP VỤ VÀ THỈNH THỊ",ten:"Trả lời thỉnh thị, hướng dẫn nghiệp vụ giải quyết đơn cho VKS cấp dưới",sanPham:"Văn bản trả lời thỉnh thị / Công văn hướng dẫn nghiệp vụ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-011",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"4 THỂ CHẾ, CHỈ ĐẠO NGHIỆP VỤ VÀ THỈNH THỊ",ten:"Xây dựng Báo cáo chuyên đề rút kinh nghiệm / Đề án nâng cao chất lượng giải quyết đơn",sanPham:"Báo cáo chuyên đề / Đề án được nghiệm thu",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-012",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"4 THỂ CHẾ, CHỈ ĐẠO NGHIỆP VỤ VÀ THỈNH THỊ",ten:"Tổng hợp, xây dựng Báo cáo công tác giải quyết đơn KNTC định kỳ (tháng/quý/năm)",sanPham:"Báo cáo công tác KNTC hoàn chỉnh + Phụ lục số liệu chuẩn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-013",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"4. Thể chế, chỉ đạo nghiệp vụ và thỉnh thị",ten:"Báo cáo Ủy ban dân nguyện và Giám sát về kết quả giải quyết đơn KNTC trong hoạt động của ngành KSND",sanPham:"Báo cáo",donVi:"",muc:"Tối cao 250đ · Tỉnh 150đ · Khu vực 80đ",diem:150,doPhucTap:7,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VI-014",linhVuc:"VI. Giải quyết khiếu nại, tố cáo tư pháp",nhom:"4. Thể chế, chỉ đạo nghiệp vụ và thỉnh thị",ten:"Báo cáo chuyên đề công tác tiếp công dân, kiểm sát và giải quyết KNTC trong hoạt động tư pháp",sanPham:"Báo cáo",donVi:"",muc:"Tối cao 250đ · Tỉnh 150đ · Khu vực 80đ",diem:150,doPhucTap:7,categoryId:"1a3ee19b-1704-47f8-9224-2252c50c77e5"},
{ma:"VII-001",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Xây dựng Chỉ thị công tác Ngành / Kế hoạch công tác trọng tâm năm",sanPham:"Chỉ thị / Kế hoạch công tác chính thức ban hành kèm Phụ lục phân công",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-002",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Báo cáo của Viện trưởng VKSND tối cao trình Quốc hội / UBTVQH",sanPham:"Báo cáo công tác chính thức trình Quốc hội kèm Báo cáo tóm tắt & Phụ lục",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:180,doPhucTap:8,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-003",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Báo cáo Sơ kết 6 tháng / Tổng kết công tác năm của Ngành / Đơn vị",sanPham:"Báo cáo Sơ kết / Tổng kết chính thức được Lãnh đạo Viện phê duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-004",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Báo cáo định kỳ (Tuần / Tháng / Quý / 9 tháng) công tác Kiểm sát",sanPham:"Báo cáo định kỳ ban hành đúng thời hạn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-005",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Báo cáo Nội chính, Phòng chống tội phạm, PCTN & Cải cách tư pháp",sanPham:"Báo cáo chuyên đề Nội chính / PCTP / CCTP ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-006",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Bản tin rà soát thông tin báo chí, dư luận xã hội & Báo cáo xử lý vụ việc nổi cộm",sanPham:"Bản tin tổng hợp báo chí / Báo cáo kết quả xử lý vụ việc nổi cộm",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-007",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Hồ sơ Phục vụ Kỳ họp Quốc hội, UBTVQH, Chủ tịch nước & Phiên họp Ủy ban Kiểm sát",sanPham:"Bộ Tài liệu, kịch bản, bộ câu hỏi - trả lời phục vụ Lãnh đạo Viện",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-008",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Theo dõi, đôn đốc Thông báo kết luận, ý kiến chỉ đạo của Lãnh đạo Viện",sanPham:"Báo cáo tổng hợp tiến độ & Bảng theo dõi đôn đốc nhiệm vụ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-009",linhVuc:"VII. Công tác Văn phòng",nhom:"1 THAM MƯU TỔNG HỢP, BÁO CÁO",ten:"Xây dựng văn bản góp ý, trao đổi",sanPham:"Công văn góp ý, trao đổi",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-010",linhVuc:"VII. Công tác Văn phòng",nhom:"2 QUẢN TRỊ, CƠ SỞ VẬT CHẤT, DỰ ÁN ĐẦU TƯ VÀ BẢO TRÌ TRỤ SỞ",ten:"Hồ sơ Mua sắm tài sản tập trung, may trang phục Ngành & Cấp phát vật tư",sanPham:"Hồ sơ lựa chọn nhà thầu + Biên bản bàn giao, cấp phát tài sản",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-011",linhVuc:"VII. Công tác Văn phòng",nhom:"2 QUẢN TRỊ, CƠ SỞ VẬT CHẤT, DỰ ÁN ĐẦU TƯ VÀ BẢO TRÌ TRỤ SỞ",ten:"Hồ sơ Quản lý dự án đầu tư xây dựng, sửa chữa, cải tạo lớn trụ sở",sanPham:"Hồ sơ dự án + Báo cáo tiến độ & Biên bản nghiệm thu công trình",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-012",linhVuc:"VII. Công tác Văn phòng",nhom:"2 QUẢN TRỊ, CƠ SỞ VẬT CHẤT, DỰ ÁN ĐẦU TƯ VÀ BẢO TRÌ TRỤ SỞ",ten:"Vận hành hệ thống kỹ thuật cơ điện và Bảo trì trụ sở",sanPham:"Nhật ký vận hành kỹ thuật + Biên bản nghiệm thu bảo trì định kỳ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-013",linhVuc:"VII. Công tác Văn phòng",nhom:"2 QUẢN TRỊ, CƠ SỞ VẬT CHẤT, DỰ ÁN ĐẦU TƯ VÀ BẢO TRÌ TRỤ SỞ",ten:"Tổ chức Vệ sinh môi trường, chăm sóc cây xanh, phòng chống dịch bệnh",sanPham:"Biên bản nghiệm thu dịch vụ vệ sinh / Hồ sơ phòng chống dịch",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-014",linhVuc:"VII. Công tác Văn phòng",nhom:"3 HỘI NGHỊ, GIAO BAN, LỄ TÂN, PHỤC VỤ ĐOÀN CÔNG TÁC VÀ BẾP ĂN TẬP THỂ",ten:"Kế hoạch, Kịch bản, Phân công hậu cần tổ chức Hội nghị toàn Ngành / Hội thảo",sanPham:"Kế hoạch tổ chức + Kịch bản điều hành + Bộ tài liệu Hội nghị",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-015",linhVuc:"VII. Công tác Văn phòng",nhom:"3 HỘI NGHỊ, GIAO BAN, LỄ TÂN, PHỤC VỤ ĐOÀN CÔNG TÁC VÀ BẾP ĂN TẬP THỂ",ten:"Lễ tân, Đón tiếp, Bố trí ăn, nghỉ, đi lại cho Đoàn công tác TW / Quốc tế / Địa phương",sanPham:"Phương án đón tiếp + Lịch trình & Hồ sơ thanh quyết toán đoàn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-016",linhVuc:"VII. Công tác Văn phòng",nhom:"3 HỘI NGHỊ, GIAO BAN, LỄ TÂN, PHỤC VỤ ĐOÀN CÔNG TÁC VÀ BẾP ĂN TẬP THỂ",ten:"Quản lý Bếp ăn tập thể cơ quan & Kiểm soát an toàn vệ sinh thực phẩm",sanPham:"Sổ kiểm thực 3 bước / Lưu mẫu thực phẩm & Suất ăn hoàn thành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-017",linhVuc:"VII. Công tác Văn phòng",nhom:"4 CÔNG TÁC QUẢN LÝ ĐỘI XE VÀ VẬN TẢI CƠ QUAN",ten:"Điều xe, cấp Lệnh điều xe & Quản lý lịch trình, nhiên liệu xe ô tô cơ quan",sanPham:"Lệnh điều xe ban hành + Bảng tổng hợp nhiên liệu, lịch trình xe",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-018",linhVuc:"VII. Công tác Văn phòng",nhom:"4 CÔNG TÁC QUẢN LÝ ĐỘI XE VÀ VẬN TẢI CƠ QUAN",ten:"Lái xe phục vụ Lãnh đạo Viện, Lãnh đạo Văn phòng & các Đoàn công tác",sanPham:"Chuyến xe an toàn + Nhật trình xe có xác nhận của Trưởng đoàn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:10,doPhucTap:2,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-019",linhVuc:"VII. Công tác Văn phòng",nhom:"4 CÔNG TÁC QUẢN LÝ ĐỘI XE VÀ VẬN TẢI CƠ QUAN",ten:"Bảo dưỡng, sửa chữa, đăng kiểm & Quản lý hồ sơ bảo hiểm xe ô tô",sanPham:"Hồ sơ bảo dưỡng, sửa chữa + Biên bản nghiệm thu & Sổ bảo hiểm",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-020",linhVuc:"VII. Công tác Văn phòng",nhom:"5 CÔNG TÁC TÀI VỤ, KẾ TOÁN, NGÂN SÁCH VÀ KIỂM SOÁT CHI",ten:"Lập, bảo vệ và phân bổ Dự toán ngân sách nhà nước hàng năm / Dự toán nhiệm vụ",sanPham:"Bộ Hồ sơ dự toán ngân sách trình cấp có thẩm quyền phê duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:100,doPhucTap:7,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-021",linhVuc:"VII. Công tác Văn phòng",nhom:"5 CÔNG TÁC TÀI VỤ, KẾ TOÁN, NGÂN SÁCH VÀ KIỂM SOÁT CHI",ten:"Thực hiện nghiệp vụ Thu, Chi, Thanh toán qua Kho bạc / Ngân hàng & Bảng lương",sanPham:"Chứng từ thanh toán hoàn chỉnh + Bảng lương / Bảo hiểm được duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-022",linhVuc:"VII. Công tác Văn phòng",nhom:"5 CÔNG TÁC TÀI VỤ, KẾ TOÁN, NGÂN SÁCH VÀ KIỂM SOÁT CHI",ten:"Hồ sơ Quyết toán kinh phí hoạt động, Dự án đầu tư, Đề tài KH & Báo cáo tài chính",sanPham:"Báo cáo tài chính / Hồ sơ quyết toán được cơ quan thẩm định phê duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-023",linhVuc:"VII. Công tác Văn phòng",nhom:"5 CÔNG TÁC TÀI VỤ, KẾ TOÁN, NGÂN SÁCH VÀ KIỂM SOÁT CHI",ten:"Quản lý Kho, Quỹ tiền mặt, Kiểm kê tài sản & Thực hiện Công khai tài chính",sanPham:"Sổ quỹ / Biên bản kiểm kê quỹ, kho & Báo cáo công khai tài chính",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-024",linhVuc:"VII. Công tác Văn phòng",nhom:"6 VĂN THƯ, LƯU TRỮ, BẢO VỆ BÍ MẬT NHÀ NƯỚC, THƯ VIỆN & PHÒNG TRUYỀN THỐNG",ten:"Tiếp nhận, xử lý Văn bản đến; Đăng ký, phát hành Văn bản đi & Quản lý con dấu",sanPham:"Văn bản được cập nhật phầm mềm, đóng dấu & phát hành đúng quy định",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-025",linhVuc:"VII. Công tác Văn phòng",nhom:"6 VĂN THƯ, LƯU TRỮ, BẢO VỆ BÍ MẬT NHÀ NƯỚC, THƯ VIỆN & PHÒNG TRUYỀN THỐNG",ten:"Thu thập, Phân loại, Chỉnh lý, Bảo quản & Cung cấp sao lục tài liệu Lưu trữ",sanPham:"Danh mục tài liệu chỉnh lý + Sổ theo dõi khai thác, sao lục tài liệu",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-026",linhVuc:"VII. Công tác Văn phòng",nhom:"6 VĂN THƯ, LƯU TRỮ, BẢO VỆ BÍ MẬT NHÀ NƯỚC, THƯ VIỆN & PHÒNG TRUYỀN THỐNG",ten:"Triển khai Số hóa hồ sơ, tài liệu lưu trữ & Cập nhật Cơ sở dữ liệu số",sanPham:"Tập dữ liệu hồ sơ số hóa hoàn chỉnh + Biên bản nghiệm thu",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-027",linhVuc:"VII. Công tác Văn phòng",nhom:"6 VĂN THƯ, LƯU TRỮ, BẢO VỆ BÍ MẬT NHÀ NƯỚC, THƯ VIỆN & PHÒNG TRUYỀN THỐNG",ten:"Soạn thảo, sao chụp, quản lý tài liệu mật & Báo cáo Bảo vệ bí mật nhà nước",sanPham:"Sổ quản lý tài liệu mật + Báo cáo công tác bảo vệ BMNN định kỳ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-028",linhVuc:"VII. Công tác Văn phòng",nhom:"6 VĂN THƯ, LƯU TRỮ, BẢO VỆ BÍ MẬT NHÀ NƯỚC, THƯ VIỆN & PHÒNG TRUYỀN THỐNG",ten:"Quản lý Thư viện ngành KSND & Phục vụ Phòng Truyền thống cơ quan",sanPham:"Sổ theo dõi sách báo / Nhật ký đón tiếp khách tham quan Phòng Truyền thống",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-029",linhVuc:"VII. Công tác Văn phòng",nhom:"7 CÔNG TÁC THI ĐUA, KHEN THƯỞNG VÀ SÁNG KIẾN",ten:"Xây dựng Thể chế TĐKT / Kế hoạch phát động & Tổng kết phong trào thi đua",sanPham:"Quy chế TĐKT / Kế hoạch phát động & Báo cáo tổng kết thi đua ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-030",linhVuc:"VII. Công tác Văn phòng",nhom:"7 CÔNG TÁC THI ĐUA, KHEN THƯỞNG VÀ SÁNG KIẾN",ten:"Thẩm định hồ sơ Khen thưởng cấp Nhà nước / Khen thưởng Cụm, Khối, Chuyên đề",sanPham:"Báo cáo thẩm định + Tờ trình & Danh sách đề nghị khen thưởng",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-031",linhVuc:"VII. Công tác Văn phòng",nhom:"7 CÔNG TÁC THI ĐUA, KHEN THƯỞNG VÀ SÁNG KIẾN",ten:"Thẩm định hồ sơ Sáng kiến & Chuẩn bị phiên họp Hội đồng Thi đua, Hội đồng Sáng kiến",sanPham:"Báo cáo thẩm định sáng kiến + Biên bản họp & Quyết định công nhận",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-032",linhVuc:"VII. Công tác Văn phòng",nhom:"7 CÔNG TÁC THI ĐUA, KHEN THƯỞNG VÀ SÁNG KIẾN",ten:"Quản lý, Cấp phát hiện vật khen thưởng; Tổ chức Lễ trao tặng, vinh danh",sanPham:"Sổ cấp phát + Kịch bản & Hồ sơ tổ chức Lễ công bố trao tặng hoàn thành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-036",linhVuc:"VII. Công tác Văn phòng",nhom:"9 BẢO VỆ, AN NINH TRẬT TỰ, PCCC, Y TẾ CƠ QUAN VÀ TRỰC NGHIỆP VỤ",ten:"Thường trực bảo vệ, kiểm soát an toàn trụ sở 24/7 & Quản lý Camera an ninh",sanPham:"Sổ trực ca bảo vệ + Báo cáo tình hình an ninh trật tự trụ sở",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-037",linhVuc:"VII. Công tác Văn phòng",nhom:"9 BẢO VỆ, AN NINH TRẬT TỰ, PCCC, Y TẾ CƠ QUAN VÀ TRỰC NGHIỆP VỤ",ten:"Lập lịch và Tổ chức thực hiện quy định về Trực nghiệp vụ cơ quan VKSND",sanPham:"Lịch trực nghiệp vụ ban hành + Sổ trực nghiệp vụ cập nhật đầy đủ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-038",linhVuc:"VII. Công tác Văn phòng",nhom:"9 BẢO VỆ, AN NINH TRẬT TỰ, PCCC, Y TẾ CƠ QUAN VÀ TRỰC NGHIỆP VỤ",ten:"Xây dựng Phương án PCCC, kiểm tra thiết bị & Tổ chức huấn luyện, diễn tập PCCC",sanPham:"Phương án PCCC được duyệt + Biên bản kiểm tra & Hồ sơ diễn tập",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-039",linhVuc:"VII. Công tác Văn phòng",nhom:"9 BẢO VỆ, AN NINH TRẬT TỰ, PCCC, Y TẾ CƠ QUAN VÀ TRỰC NGHIỆP VỤ",ten:"Khám bệnh, sơ cấp cứu ban đầu, quản lý Tủ thuốc & Chăm sóc sức khỏe cán bộ",sanPham:"Sổ khám bệnh y tế + Dự trù, sổ cấp phát thuốc & Báo cáo phòng dịch",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-040",linhVuc:"VII. Công tác Văn phòng",nhom:"10 QUẢN TRỊ TRANG TIN/PHẦN MỀM KẾ TOÁN",ten:"Viết, biên tập, phê duyệt & Đăng tải Tin, Bài, Ảnh, Video trên Cổng thông tin/Trang tin điện tử",sanPham:"Tin / Bài / Video được duyệt đăng chính thức trên Cổng thông tin/Trang tin",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:10,doPhucTap:2,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VII-041",linhVuc:"VII. Công tác Văn phòng",nhom:"10 QUẢN TRỊ TRANG TIN/PHẦN MỀM KẾ TOÁN",ten:"Quản trị phần mềm eTask, phần mềm Quản lý công việc / Kế toán & Tổng đài",sanPham:"Dữ liệu phần mềm cập nhật chính xác + Báo cáo vận hành hệ thống",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"5199a282-cae6-4cb9-9a2e-64b71c3f56fd"},
{ma:"VIII-003",linhVuc:"VIII. Xây dựng thể chế",nhom:"1 CHỦ TRÌ XÂY DỰNG VĂN BẢN QPPL VÀ QUY CHẾ NGHIỆP VỤ (ĐƠN VỊ CHỦ TRÌ - 100%)",ten:"Chủ trì xây dựng Chỉ thị, Quy chế, Quy định, Quy trình nghiệp vụ",sanPham:"Quy chế/Quy định chính thức ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:200,doPhucTap:8,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-005",linhVuc:"VIII. Xây dựng thể chế",nhom:"2.1 Góp ý dự thảo Luật, Bộ luật, Nghị quyết Quốc hội do cơ quan khác chủ trì",ten:"Công văn góp ý phản biện chuyên sâu",sanPham:"",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:100,doPhucTap:7,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-006",linhVuc:"VIII. Xây dựng thể chế",nhom:"2.1 Góp ý dự thảo Luật, Bộ luật, Nghị quyết Quốc hội do cơ quan khác chủ trì",ten:"Công văn góp ý/nhất trí",sanPham:"",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-007",linhVuc:"VIII. Xây dựng thể chế",nhom:"2.2 Góp ý dự thảo Nghị định, Thông tư, TTLT do Bộ/Ngành khác chủ trì",ten:"Công văn góp ý chi tiết",sanPham:"",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-008",linhVuc:"VIII. Xây dựng thể chế",nhom:"2.2 Góp ý dự thảo Nghị định, Thông tư, TTLT do Bộ/Ngành khác chủ trì",ten:"Công văn góp ý",sanPham:"",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-009",linhVuc:"VIII. Xây dựng thể chế",nhom:"2.3 Góp ý dự thảo Quy chế, Quy định, Hướng dẫn nội bộ do đơn vị khác chủ trì",ten:"Công văn góp ý chuyên sâu",sanPham:"",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-010",linhVuc:"VIII. Xây dựng thể chế",nhom:"2.3 Góp ý dự thảo Quy chế, Quy định, Hướng dẫn nội bộ do đơn vị khác chủ trì",ten:"Công văn góp ý",sanPham:"",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-012",linhVuc:"VIII. Xây dựng thể chế",nhom:"3 THẨM ĐỊNH, RÀ SOÁT, HỆ THỐNG HÓA, GIẢI ĐÁP VƯỚNG MẮC THỂ CHẾ",ten:"Rà soát, Hệ thống hóa văn bản QPPL định kỳ / chuyên đề",sanPham:"Báo cáo kết quả rà soát + Hồ sơ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"VIII-013",linhVuc:"VIII. Xây dựng thể chế",nhom:"3 THẨM ĐỊNH, RÀ SOÁT, HỆ THỐNG HÓA, GIẢI ĐÁP VƯỚNG MẮC THỂ CHẾ",ten:"Văn bản Trả lời / Giải đáp vướng mắc thể chế, nghiệp vụ phức tạp",sanPham:"Công văn hướng dẫn/giải đáp vướng mắc chính thức",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"c2c550af-a42b-41b8-be61-6b4cba5dbfc4"},
{ma:"IX-001",linhVuc:"IX. Tổ chức cán bộ",nhom:"1 CÔNG TÁC XÂY DỰNG THỂ CHẾ, BỘ MÁY VÀ BIÊN CHẾ",ten:"Xây dựng Quy chế, Quy định về công tác TCCB",sanPham:"Văn bản Quy chế/Quy định TCCB chính thức ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-002",linhVuc:"IX. Tổ chức cán bộ",nhom:"1 CÔNG TÁC XÂY DỰNG THỂ CHẾ, BỘ MÁY VÀ BIÊN CHẾ",ten:"Đề án kiện toàn tổ chức bộ máy, thành lập/sáp nhập/giải thể đơn vị, phân bổ biên chế",sanPham:"Nghị quyết / Quyết định phê duyệt Đề án kiện toàn bộ máy & Bảng phân bổ biên chế",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-003",linhVuc:"IX. Tổ chức cán bộ",nhom:"2 CÔNG TÁC QUY HOẠCH, BỔ NHIỆM, ĐIỀU ĐỘNG VÀ QUẢN LÝ CÁN BỘ",ten:"Hồ sơ Quy hoạch cán bộ lãnh đạo, quản lý",sanPham:"Quyết định phê duyệt danh sách quy hoạch cán bộ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:110,doPhucTap:7,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-004",linhVuc:"IX. Tổ chức cán bộ",nhom:"2 CÔNG TÁC QUY HOẠCH, BỔ NHIỆM, ĐIỀU ĐỘNG VÀ QUẢN LÝ CÁN BỘ",ten:"Hồ sơ Bổ nhiệm mới / Bổ nhiệm lại chức vụ Lãnh đạo, Quản lý",sanPham:"Quyết định bổ nhiệm / bổ nhiệm lại chức vụ chính thức",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-005",linhVuc:"IX. Tổ chức cán bộ",nhom:"2 CÔNG TÁC QUY HOẠCH, BỔ NHIỆM, ĐIỀU ĐỘNG VÀ QUẢN LÝ CÁN BỘ",ten:"Quyết định Điều động, Luân chuyển, Biệt phái cán bộ",sanPham:"Quyết định điều động / luân chuyển / biệt phái hoàn chỉnh",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-007",linhVuc:"IX. Tổ chức cán bộ",nhom:"3 TUYỂN DỤNG CÔNG CHỨC VÀ THI TUYỂN CHỨC DANH TƯ PHÁP",ten:"Tổ chức Kỳ thi tuyển dụng công chức / Kỳ thi tuyển Chức danh tư pháp",sanPham:"Hồ sơ Kỳ thi hoàn thành + Quyết định phê duyệt kết quả trúng tuyển",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:360,doPhucTap:9,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-008",linhVuc:"IX. Tổ chức cán bộ",nhom:"3 TUYỂN DỤNG CÔNG CHỨC VÀ THI TUYỂN CHỨC DANH TƯ PHÁP",ten:"Quyết định Tuyển dụng công chức cá biệt (sau thẩm định)",sanPham:"Quyết định tuyển dụng công chức chính thức ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-009",linhVuc:"IX. Tổ chức cán bộ",nhom:"4 CÔNG TÁC QUẢN LÝ ĐÀO TẠO, BỒI DƯỠNG (BỔ SUNG ĐẦY ĐỦ)",ten:"Xây dựng Kế hoạch công tác đào tạo, bồi dưỡng CCVC hàng năm / giai đoạn",sanPham:"Kế hoạch Đào tạo, bồi dưỡng được cấp có thẩm quyền phê duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-010",linhVuc:"IX. Tổ chức cán bộ",nhom:"4 CÔNG TÁC QUẢN LÝ ĐÀO TẠO, BỒI DƯỠNG (BỔ SUNG ĐẦY ĐỦ)",ten:"Tổ chức/Quản lý Lớp đào tạo, bồi dưỡng ngắn hạn chuyên môn nghiệp vụ / bồi dưỡng VKS Lào",sanPham:"Lớp bồi dưỡng hoàn thành + Báo cáo kết quả/Chứng chỉ lớp học",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-011",linhVuc:"IX. Tổ chức cán bộ",nhom:"4 CÔNG TÁC QUẢN LÝ ĐÀO TẠO, BỒI DƯỠNG (BỔ SUNG ĐẦY ĐỦ)",ten:"Thẩm định, ban hành Quyết định cử cán bộ đi học Đào tạo Sau đại học / Cao cấp, Trung cấp LLCT",sanPham:"Quyết định cử cán bộ đi học chính thức ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-012",linhVuc:"IX. Tổ chức cán bộ",nhom:"4 CÔNG TÁC QUẢN LÝ ĐÀO TẠO, BỒI DƯỠNG (BỔ SUNG ĐẦY ĐỦ)",ten:"Phê duyệt Chương trình, Tài liệu đào tạo bồi dưỡng / Kế hoạch tuyển sinh Trường ĐHKS",sanPham:"Văn bản phê duyệt Chương trình/Tài liệu/Tuyển sinh",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-013",linhVuc:"IX. Tổ chức cán bộ",nhom:"5 CÔNG TÁC CHÍNH SÁCH, TIỀN LƯƠNG VÀ HƯU TRÍ",ten:"Quyết định Nâng lương thường xuyên / Nâng lương trước hạn / Phụ cấp thâm niên",sanPham:"Quyết định nâng lương / nâng phụ cấp thâm niên ban hành (theo đợt rà soát trong năm)",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-014",linhVuc:"IX. Tổ chức cán bộ",nhom:"5 CÔNG TÁC CHÍNH SÁCH, TIỀN LƯƠNG VÀ HƯU TRÍ",ten:"Quyết định Nghỉ hưu / Thôi việc / Giải quyết chính sách, tinh giản biên chế (NĐ 154)",sanPham:"Quyết định nghỉ hưu / thôi việc / hưởng chế độ chính thức ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-015",linhVuc:"IX. Tổ chức cán bộ",nhom:"5 CÔNG TÁC CHÍNH SÁCH, TIỀN LƯƠNG VÀ HƯU TRÍ",ten:"Tổ chức Gặp mặt công chức nghỉ hưu / Thăm hỏi, tặng quà cán bộ hưu trí định kỳ",sanPham:"Đợt gặp mặt/thăm hỏi hoàn thành + Báo cáo kết quả",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-016",linhVuc:"IX. Tổ chức cán bộ",nhom:"6 CÔNG TÁC QUẢN LÝ ĐOÀN CÔNG TÁC / CÁ NHÂN ĐI NƯỚC NGOÀI",ten:"Tham mưu Triển khai Chương trình Đào tạo / Đoàn công tác bồi dưỡng tại Nước ngoài",sanPham:"Đoàn công tác hoàn thành + Báo cáo kết quả chuyến đi",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-017",linhVuc:"IX. Tổ chức cán bộ",nhom:"6 CÔNG TÁC QUẢN LÝ ĐOÀN CÔNG TÁC / CÁ NHÂN ĐI NƯỚC NGOÀI",ten:"Thẩm định, ban hành Quyết định cho phép Cán bộ, Công chức đi nước ngoài về việc riêng",sanPham:"Quyết định / Văn bản cho phép cá nhân đi nước ngoài",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-018",linhVuc:"IX. Tổ chức cán bộ",nhom:"7 BẢO VỆ CHÍNH TRỊ NỘI BỘ, ĐÁNH GIÁ CÁN BỘ, KỶ LUẬT VÀ KÊ KHAI TÀI SẢN",ten:"Thẩm định tiêu chuẩn chính trị / Lịch sử chính trị phục vụ công tác cán bộ",sanPham:"Báo cáo thẩm định tiêu chuẩn chính trị cán bộ",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-019",linhVuc:"IX. Tổ chức cán bộ",nhom:"7 BẢO VỆ CHÍNH TRỊ NỘI BỘ, ĐÁNH GIÁ CÁN BỘ, KỶ LUẬT VÀ KÊ KHAI TÀI SẢN",ten:"Hồ sơ Tổng hợp đánh giá, xếp loại chất lượng công chức toàn đơn vị/Ngành",sanPham:"Tờ trình + Bảng tổng hợp xếp loại chất lượng công chức được phê duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-020",linhVuc:"IX. Tổ chức cán bộ",nhom:"7 BẢO VỆ CHÍNH TRỊ NỘI BỘ, ĐÁNH GIÁ CÁN BỘ, KỶ LUẬT VÀ KÊ KHAI TÀI SẢN",ten:"Thẩm định Kê khai tài sản, thu nhập / Tham gia Đoàn xác minh tài sản, thu nhập cán bộ",sanPham:"Báo cáo thẩm định / Kết luận xác minh tài sản thu nhập",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"IX-021",linhVuc:"IX. Tổ chức cán bộ",nhom:"7 BẢO VỆ CHÍNH TRỊ NỘI BỘ, ĐÁNH GIÁ CÁN BỘ, KỶ LUẬT VÀ KÊ KHAI TÀI SẢN",ten:"Hồ sơ Xử lý kỷ luật cán bộ / Giải quyết đơn thư khiếu nại, tố cáo TCCB",sanPham:"Quyết định xử lý kỷ luật / Quyết định giải quyết khiếu nại TCCB",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"9bb674af-6f4d-446d-b639-f2b5284634b4"},
{ma:"X-001",linhVuc:"X. Thanh tra",nhom:"1 CÔNG TÁC NGHIỆP VỤ THƯỜNG XUYÊN, THEO DÕI NỔI CỘM VÀ TIẾP CÔNG DÂN",ten:"Theo dõi sau thanh tra, kiểm tra & Đôn đốc thực hiện Kết luận thanh tra của VKS các cấp",sanPham:"Báo cáo kết quả theo dõi sau thanh tra + Công văn đôn đốc & TB rút kinh nghiệm",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-002",linhVuc:"X. Thanh tra",nhom:"1 CÔNG TÁC NGHIỆP VỤ THƯỜNG XUYÊN, THEO DÕI NỔI CỘM VÀ TIẾP CÔNG DÂN",ten:"Theo dõi địa bàn, nắm tình hình vi phạm & Trả lời thỉnh thị nghiệp vụ thanh tra",sanPham:"Bảng theo dõi địa bàn + Báo cáo nắm tình hình & Công văn hướng dẫn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-003",linhVuc:"X. Thanh tra",nhom:"1 CÔNG TÁC NGHIỆP VỤ THƯỜNG XUYÊN, THEO DÕI NỔI CỘM VÀ TIẾP CÔNG DÂN",ten:"Tham mưu giúp việc Ban Chỉ đạo thực hiện Dân chủ ở cơ sở ngành KSND",sanPham:"Chương trình / Kế hoạch kiểm tra dân chủ + Báo cáo kết quả thực hiện",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-004",linhVuc:"X. Thanh tra",nhom:"1 CÔNG TÁC NGHIỆP VỤ THƯỜNG XUYÊN, THEO DÕI NỔI CỘM VÀ TIẾP CÔNG DÂN",ten:"Kiểm tra kỷ luật nội vụ, Chấp hành kỷ luật lao động & Văn hóa công vụ",sanPham:"Biên bản kiểm tra kỷ luật nội vụ + Thông báo rút kinh nghiệm ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-005",linhVuc:"X. Thanh tra",nhom:"1 CÔNG TÁC NGHIỆP VỤ THƯỜNG XUYÊN, THEO DÕI NỔI CỘM VÀ TIẾP CÔNG DÂN",ten:"Tiếp nhận, Phân loại, Xử lý đơn khiếu nại, tố cáo ngoài hoạt động tư pháp",sanPham:"Sổ theo dõi đơn + Báo cáo đề xuất xử lý đơn & Công văn chuyển đơn",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-006",linhVuc:"X. Thanh tra",nhom:"1 CÔNG TÁC NGHIỆP VỤ THƯỜNG XUYÊN, THEO DÕI NỔI CỘM VÀ TIẾP CÔNG DÂN",ten:"Công tác Tiếp công dân & Xử lý phản ánh, kiến nghị trực tiếp tại Trụ sở tiếp công dân",sanPham:"Biên bản tiếp công dân + Báo cáo đề xuất xử lý & Công văn thông báo",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-007",linhVuc:"X. Thanh tra",nhom:"2 CÔNG TÁC NGHIỆP VỤ CHUYÊN SÂU: THANH TRA, KIỂM TRA, GIẢI QUYẾT KNTC & PCTN",ten:"Tiến hành Cuộc Kiểm tra nghiệp vụ / Kiểm tra chuyên đề",sanPham:"Quyết định + Kế hoạch + Báo cáo Đoàn kiểm tra & Kết luận kiểm tra ban hành",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-008",linhVuc:"X. Thanh tra",nhom:"2 CÔNG TÁC NGHIỆP VỤ CHUYÊN SÂU: THANH TRA, KIỂM TRA, GIẢI QUYẾT KNTC & PCTN",ten:"Tiến hành Cuộc Thanh tra hành chính / Thanh tra nghiệp vụ",sanPham:"Quyết định + Kế hoạch + Nhật ký + Báo cáo Đoàn thanh tra & Kết luận thanh tra",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:100,doPhucTap:7,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-009",linhVuc:"X. Thanh tra",nhom:"2 CÔNG TÁC NGHIỆP VỤ CHUYÊN SÂU: THANH TRA, KIỂM TRA, GIẢI QUYẾT KNTC & PCTN",ten:"Xác minh điều kiện thụ lý đơn khiếu nại, tố cáo",sanPham:"Báo cáo đề xuất xác minh + Báo cáo kết quả & Thông báo/Quyết định xử lý",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-010",linhVuc:"X. Thanh tra",nhom:"2 CÔNG TÁC NGHIỆP VỤ CHUYÊN SÂU: THANH TRA, KIỂM TRA, GIẢI QUYẾT KNTC & PCTN",ten:"Giải quyết đơn Khiếu nại, Tố cáo thuộc thẩm quyền Thanh tra",sanPham:"Quyết định thụ lý + Kế hoạch + Báo cáo giải quyết & Kết luận/Quyết định GQ KNTC",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"X-011",linhVuc:"X. Thanh tra",nhom:"2 CÔNG TÁC NGHIỆP VỤ CHUYÊN SÂU: THANH TRA, KIỂM TRA, GIẢI QUYẾT KNTC & PCTN",ten:"Công tác Phòng, chống tham nhũng, lãng phí, tiêu cực & Xác minh tài sản, thu nhập (TSTN)",sanPham:"Kế hoạch PCTN + Biên bản bốc thăm TSTN & Báo cáo kết quả xác minh TSTN",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"a7635bd2-0931-4298-9e15-9bd783c303a6"},
{ma:"XI-001",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Xây dựng Định hướng nghiên cứu KH&CN, Báo cáo KH&CN & Dự toán kinh phí hàng năm",sanPham:"Quyết định ban hành Định hướng + Báo cáo KH&CN & Dự toán kinh phí",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-002",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Quản lý, tiếp nhận, tuyển chọn, giao nhiệm vụ, kiểm tra tiến độ & Nghiệm thu nhiệm vụ KH",sanPham:"Hồ sơ tuyển chọn / Quyết định giao nhiệm vụ / Hồ sơ nghiệm thu nhiệm vụ KH",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-003",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Chủ nhiệm / Phó Chủ nhiệm / Thư ký khoa học Đề tài, Đề án cấp Bộ, cấp Ngành",sanPham:"Đề tài / Đề án nghiên cứu khoa học được nghiệm thu chính thức",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-004",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Nghiên cứu Đề tài, Đề án cấp Cơ sở / Viết chuyên đề nhánh thuộc Đề tài cấp Bộ",sanPham:"Đề cương thuyết minh chi tiết + Chuyên đề nghiên cứu hoàn chỉnh",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-005",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Công bố Bài báo khoa học quốc tế / Bài báo Tạp chí trong nước / Tham luận hội thảo khoa học",sanPham:"Bài báo khoa học công bố / Tham luận khoa học đăng tải chính thức",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-006",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Chủ biên / Biên soạn Sách chuyên khảo, tham khảo, chương sách nghiệp vụ kiểm sát",sanPham:"Cuốn sách / Chương sách chuyên khảo được nghiệm thu và xuất bản",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-007",linhVuc:"XI. Nghiên cứu khoa học",nhom:"1 QUẢN LÝ VÀ THỰC HIỆN NHIỆM VỤ KHOA HỌC, ĐỀ TÀI, ĐỀ ÁN",ten:"Dịch tài liệu, hiệu đính tài liệu khoa học tiếng nước ngoài phục vụ nghiên cứu",sanPham:"Bộ Tài liệu dịch / Hiệu đính hoàn chỉnh được phê duyệt",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-008",linhVuc:"XI. Nghiên cứu khoa học",nhom:"2 NGHIÊN CỨU TỘI PHẠM HỌC VÀ TỔ CHỨC HỘI THẢO, TỌA ĐÀM KHOA HỌC",ten:"Xây dựng Chương trình, Kế hoạch & Báo cáo nghiên cứu tình hình tội phạm, nguyên nhân, dự báo TPH",sanPham:"Báo cáo nghiên cứu Tội phạm học & Dự báo tình hình tội phạm",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-009",linhVuc:"XI. Nghiên cứu khoa học",nhom:"2 NGHIÊN CỨU TỘI PHẠM HỌC VÀ TỔ CHỨC HỘI THẢO, TỌA ĐÀM KHOA HỌC",ten:"Khảo sát, điều tra xã hội học, xây dựng CSDL Tội phạm học & Đề xuất kiến nghị phòng ngừa",sanPham:"Bộ dữ liệu khảo sát CSDL Tội phạm học & Báo cáo kiến nghị phòng ngừa",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:15,doPhucTap:3,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-010",linhVuc:"XI. Nghiên cứu khoa học",nhom:"2 NGHIÊN CỨU TỘI PHẠM HỌC VÀ TỔ CHỨC HỘI THẢO, TỌA ĐÀM KHOA HỌC",ten:"Tổ chức Hội thảo, Tọa đàm khoa học cấp Quốc gia / cấp Ngành / cấp Cơ sở",sanPham:"Kế hoạch + Đề dẫn + Chương trình & Biên bản / Kỷ yếu Hội thảo",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XI-011",linhVuc:"XI. Nghiên cứu khoa học",nhom:"2 NGHIÊN CỨU TỘI PHẠM HỌC VÀ TỔ CHỨC HỘI THẢO, TỌA ĐÀM KHOA HỌC",ten:"Chủ trì / Thư ký / Mời, điều phối chuyên gia tham gia Hội thảo, Tọa đàm khoa học",sanPham:"Báo cáo kết quả Hội thảo + Biên bản & Danh sách chuyên gia",donVi:"",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"1266afd3-16e4-4249-8df8-6c0434989be8"},
{ma:"XIV-001",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"1. Quản trị Hạ tầng Kỹ thuật, Mạng & Điện toán Đám mây (Cloud)",ten:"Vận hành, quản trị hạ tầng mạng LAN/WAN, hệ thống máy chủ và môi trường ảo hóa định kỳ",sanPham:"Hạ tầng mạng và máy chủ vận hành liên tục, an toàn; xử lý sự cố đạt cam kết SLA",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-002",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"1. Quản trị Hạ tầng Kỹ thuật, Mạng & Điện toán Đám mây (Cloud)",ten:"Chuẩn bị kỹ thuật, đường truyền và đảm bảo kết nối Truyền hình trực tuyến phục vụ hội nghị",sanPham:"Mạng truyền hình trực tuyến kết nối thông suốt, không phát sinh sự cố kỹ thuật",donVi:"01 Hội nghị / Sự kiện",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-003",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"1. Quản trị Hạ tầng Kỹ thuật, Mạng & Điện toán Đám mây (Cloud)",ten:"Nâng cấp, tối ưu hóa hạ tầng CNTT, Trung tâm dữ liệu (Data Center) và hệ thống lưu trữ",sanPham:"Hạ tầng mới/nâng cấp vận hành ổn định kèm hồ sơ tài liệu hoàn công được duyệt",donVi:"01 Dự án / Đợt nâng cấp",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-004",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"1. Quản trị Hạ tầng Kỹ thuật, Mạng & Điện toán Đám mây (Cloud)",ten:"Chủ trì thiết kế kiến trúc và triển khai Hạ tầng Điện toán đám mây (Cloud) dùng chung ngành Kiểm sát",sanPham:"Nền tảng Cloud ngành KSND vận hành ổn định; tích hợp và di chuyển ứng dụng thành công",donVi:"Trọn gói 01 Dự án",muc:"Theo cấp Tỉnh (60%)",diem:150,doPhucTap:7,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-005",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"2. Phát triển Phần mềm, Nền tảng số & Ứng dụng Trí tuệ Nhân tạo (AI)",ten:"Phân tích yêu cầu nghiệp vụ (BA), lập đặc tả kỹ thuật và prototype phần mềm/nền tảng số",sanPham:"Tài liệu đặc tả yêu cầu nghiệp vụ & bản mẫu Prototype được nghiệm thu",donVi:"01 Phần mềm / Nền tảng",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-006",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"2. Phát triển Phần mềm, Nền tảng số & Ứng dụng Trí tuệ Nhân tạo (AI)",ten:"Phát triển, lập trình module, tích hợp API và kiểm thử chức năng/hiệu năng phần mềm (QA/QC)",sanPham:"Module/tính năng phần mềm vượt qua kiểm thử; API tích hợp thành công",donVi:"01 Module / Nền tảng",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-007",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"2. Phát triển Phần mềm, Nền tảng số & Ứng dụng Trí tuệ Nhân tạo (AI)",ten:"Thẩm định hồ sơ kỹ thuật, kiểm thử an toàn bảo mật và nghiệm thu bàn giao sản phẩm CNTT",sanPham:"Báo cáo thẩm định kỹ thuật chính xác & Biên bản nghiệm thu bàn giao được ký duyệt",donVi:"01 Bộ hồ sơ nghiệm thu",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-008",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"2. Phát triển Phần mềm, Nền tảng số & Ứng dụng Trí tuệ Nhân tạo (AI)",ten:"Tham mưu, nghiên cứu thử nghiệm và triển khai ứng dụng Trợ lý ảo/AI/ML phục vụ nghiệp vụ",sanPham:"Công cụ/Trợ lý AI vận hành thực tế; quy trình, hướng dẫn và báo cáo kết quả được duyệt",donVi:"01 Ứng dụng AI",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-009",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"2. Phát triển Phần mềm, Nền tảng số & Ứng dụng Trí tuệ Nhân tạo (AI)",ten:"Chủ trì triển khai Nền tảng số / Phần mềm quản lý chuyên ngành trọng điểm toàn quốc",sanPham:"Hệ thống/Nền tảng số triển khai thành công toàn ngành, vận hành ổn định",donVi:"01 Nền tảng toàn ngành",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-010",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"3. Bảo đảm An toàn, An ninh mạng (ATTT/ANM) & Ứng cứu Sự cố",ten:"Giám sát, phân tích nhật ký (Log) và xử lý cảnh báo an toàn thông tin (SOC/SIEM/ELK)",sanPham:"Nhật ký giám sát đầy đủ; nguy cơ, sự cố an ninh mạng được phát hiện và xử lý kịp thời",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-011",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"3. Bảo đảm An toàn, An ninh mạng (ATTT/ANM) & Ứng cứu Sự cố",ten:"Rà soát, đánh giá lỗ hổng bảo mật (Pentest) và khắc phục sự cố, vá điểm yếu ATTT",sanPham:"Báo cáo kiểm thử ATTT + 100% lỗ hổng nguy hiểm được vá và nghiệm thu an toàn",donVi:"01 Đợt đánh giá",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-012",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"3. Bảo đảm An toàn, An ninh mạng (ATTT/ANM) & Ứng cứu Sự cố",ten:"Lập hồ sơ xác định cấp độ an toàn thông tin cho các hệ thống thông tin chuyên ngành",sanPham:"Hồ sơ đề xuất cấp độ ATTT được cấp có thẩm quyền thẩm định và phê duyệt",donVi:"01 Hệ thống thông tin",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-013",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"3. Bảo đảm An toàn, An ninh mạng (ATTT/ANM) & Ứng cứu Sự cố",ten:"Xây dựng phương án ứng cứu sự cố và chủ trì tổ chức diễn tập An ninh mạng",sanPham:"Kế hoạch, kịch bản & Biên bản tổng kết diễn tập ANM toàn ngành được phê duyệt",donVi:"01 Kỳ diễn tập",muc:"Theo cấp Tỉnh (60%)",diem:100,doPhucTap:7,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-014",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"4. Công tác Cơ yếu, Bảo mật Thông tin & Chữ ký số Chuyên dùng",ten:"Mã hóa, giải mã, vận hành hệ thống truyền nhận điện mật và Fax mật định kỳ",sanPham:"Điện mật/Fax mật chuyển nhận đúng thời gian, đúng quy định bảo mật; nhật ký đầy đủ",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-015",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"4. Công tác Cơ yếu, Bảo mật Thông tin & Chữ ký số Chuyên dùng",ten:"Rà soát, tiếp nhận hồ sơ, cấp mới, gia hạn và thu hồi Chứng thư chữ ký số công vụ",sanPham:"Danh sách chứng thư số được cập nhật; hồ sơ xử lý đúng quy định Ban Cơ yếu Chính phủ",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-016",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"4. Công tác Cơ yếu, Bảo mật Thông tin & Chữ ký số Chuyên dùng",ten:"Vận hành, kiểm kê và bảo quản thiết bị cơ yếu chuyên dụng (DC-02, USB Token)",sanPham:"Thiết bị cơ yếu vận hành an toàn; tài sản mật mã kiểm kê, quản lý đúng quy định",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-017",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"4. Công tác Cơ yếu, Bảo mật Thông tin & Chữ ký số Chuyên dùng",ten:"Triển khai giải pháp/thiết bị cơ yếu quy mô diện rộng hoặc nâng cấp mạng liên lạc mật",sanPham:"Hệ thống cơ yếu được lắp đặt, cấu hình thành công; biên bản nghiệm thu kỹ thuật đầy đủ",donVi:"01 Dự án / Đợt triển khai",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-018",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"5. Quản trị Dữ liệu Tư pháp, Thống kê & Cổng Thông tin Điện tử",ten:"Xây dựng Khung quản trị dữ liệu, chuẩn hóa CSDL tư pháp tập trung và chia sẻ API",sanPham:"Khung quản trị dữ liệu được ban hành; CSDL được chuẩn hóa, tích hợp API chia sẻ",donVi:"01 CSDL / Khung quản trị",muc:"Theo cấp Tỉnh (60%)",diem:90,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-019",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"5. Quản trị Dữ liệu Tư pháp, Thống kê & Cổng Thông tin Điện tử",ten:"Quản trị vận hành Cổng thông tin điện tử, Trang thành phần và xuất bản Dữ liệu mở",sanPham:"Cổng TTĐT hoạt động ổn định, thông tin/dữ liệu mở công bố đầy đủ, đúng quy định",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-020",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"5. Quản trị Dữ liệu Tư pháp, Thống kê & Cổng Thông tin Điện tử",ten:"Tổng hợp, kiểm tra, đối chiếu và xây dựng Báo cáo Thống kê tư pháp (tháng/quý/năm)",sanPham:"Báo cáo thống kê hoàn chỉnh kèm biểu số liệu đối chiếu chuẩn xác, nộp đúng hạn",donVi:"01 Báo cáo thống kê",muc:"Theo cấp Tỉnh (60%)",diem:40,doPhucTap:5,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-021",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"5. Quản trị Dữ liệu Tư pháp, Thống kê & Cổng Thông tin Điện tử",ten:"Xây dựng Báo cáo phân tích chuyên sâu dữ liệu án, dự báo tình hình tội phạm bằng dữ liệu số",sanPham:"Báo cáo phân tích dữ liệu có biểu đồ trực quan và khuyến nghị chính sách trình Lãnh đạo Viện",donVi:"01 Báo cáo phân tích",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-022",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"6. Xây dựng Thể chế, Chiến lược, Kiến trúc Số & Định mức kinh tế - kỹ thuật",ten:"Xây dựng Quy chế, Hướng dẫn kỹ thuật, Định mức kinh tế - kỹ thuật CNTT/CĐS/ANM",sanPham:"Văn bản Quy chế / Hướng dẫn / Định mức KT-KT được ban hành áp dụng toàn Ngành",donVi:"01 Văn bản ban hành",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-023",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"6. Xây dựng Thể chế, Chiến lược, Kiến trúc Số & Định mức kinh tế - kỹ thuật",ten:"Chủ trì xây dựng Kiến trúc Tổng thể Hệ thống thông tin và Chiến lược Chuyển đổi số 5 năm",sanPham:"Hồ sơ Kiến trúc số & Chiến lược Chuyển đổi số được Viện trưởng VKSNDTC phê duyệt",donVi:"01 Đề án / Chiến lược",muc:"Theo cấp Tỉnh (60%)",diem:120,doPhucTap:7,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-024",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"6. Xây dựng Thể chế, Chiến lược, Kiến trúc Số & Định mức kinh tế - kỹ thuật",ten:"Xây dựng Khung năng lực số và Bộ tiêu chuẩn kỹ thuật chuyên ngành Kiểm sát",sanPham:"Bộ tiêu chuẩn kỹ thuật/Khung năng lực số được ban hành chính thức",donVi:"01 Bộ tiêu chuẩn",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-025",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"7. Đánh giá Mức độ CĐS (DTI), Đào tạo Kỹ năng Số & Kiểm tra Chuyên ngành",ten:"Chủ trì xây dựng, khảo sát và công bố Bảng xếp hạng Chỉ số Chuyển đổi số (DTI-KSND)",sanPham:"Bộ chỉ số & Báo cáo kết quả đánh giá xếp hạng DTI toàn Ngành được phê duyệt",donVi:"01 Kỳ đánh giá năm",muc:"Theo cấp Tỉnh (60%)",diem:70,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-026",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"7. Đánh giá Mức độ CĐS (DTI), Đào tạo Kỹ năng Số & Kiểm tra Chuyên ngành",ten:"Biên soạn giáo trình, tài liệu và tổ chức lớp tập huấn kỹ năng CĐS/ATTT/Phần mềm",sanPham:"Lớp tập huấn hoàn thành; bộ tài liệu bài giảng & Báo cáo kết quả đào tạo đầy đủ",donVi:"01 Khóa / Lớp tập huấn",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XIV-027",linhVuc:"XIV. Công nghệ thông tin & Chuyển đổi số",nhom:"7. Đánh giá Mức độ CĐS (DTI), Đào tạo Kỹ năng Số & Kiểm tra Chuyên ngành",ten:"Chủ trì đoàn kiểm tra, giám sát chuyên đề về CNTT, CĐS, ATTT và Cơ yếu tại địa phương",sanPham:"Kế hoạch, Biên bản kiểm tra & Thông báo kết luận kiểm tra được ban hành",donVi:"01 Cuộc kiểm tra",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"9b9c4dda-f7d3-4ade-8b3e-0f765780a125"},
{ma:"XV-001",linhVuc:"XV. Tài chính - Kế toán, Quản lý tài sản",nhom:"1 KẾ TOÁN NỘI BỘ, THU CHI, GIAO DỊCH KHO BẠC & BÁO CÁO TÀI CHÍNH ĐƠN VỊ",ten:"Theo dõi, hạch toán, quản lý sử dụng dự toán kinh phí; giao dịch & đối chiếu số liệu với Kho bạc Nhà nước, Ngân hàng",sanPham:"Sổ kế toán, chứng từ giao dịch & Bảng đối chiếu KBNN/Ngân hàng được xác nhận",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:25,doPhucTap:4,categoryId:"1150328e-5d06-46b1-8e41-db99075fb196"},
{ma:"XV-002",linhVuc:"XV. Tài chính - Kế toán, Quản lý tài sản",nhom:"1 KẾ TOÁN NỘI BỘ, THU CHI, GIAO DỊCH KHO BẠC & BÁO CÁO TÀI CHÍNH ĐƠN VỊ",ten:"Lập Báo cáo tài chính, Báo cáo quyết toán ngân sách và Báo cáo quản trị nội bộ định kỳ/đột xuất của đơn vị",sanPham:"Bộ Báo cáo tài chính & Báo cáo quyết toán được duyệt, nộp đúng hạn",donVi:"01 Bộ báo cáo",muc:"Theo cấp Tỉnh (60%)",diem:50,doPhucTap:5,categoryId:"1150328e-5d06-46b1-8e41-db99075fb196"},
{ma:"XV-003",linhVuc:"XV. Tài chính - Kế toán, Quản lý tài sản",nhom:"1 KẾ TOÁN NỘI BỘ, THU CHI, GIAO DỊCH KHO BẠC & BÁO CÁO TÀI CHÍNH ĐƠN VỊ",ten:"Thực hiện thủ tục thanh quyết toán các gói thầu, hợp đồng mua sắm, sửa chữa và chi phí hoạt động chuyên môn",sanPham:"Bộ hồ sơ thanh quyết toán đầy đủ pháp lý được nghiệm thu, giải ngân thành công",donVi:"01 Bộ hồ sơ",muc:"Theo cấp Tỉnh (60%)",diem:30,doPhucTap:4,categoryId:"1150328e-5d06-46b1-8e41-db99075fb196"},
{ma:"XV-004",linhVuc:"XV. Tài chính - Kế toán, Quản lý tài sản",nhom:"1 KẾ TOÁN NỘI BỘ, THU CHI, GIAO DỊCH KHO BẠC & BÁO CÁO TÀI CHÍNH ĐƠN VỊ",ten:"Quản lý tài chính, kế toán và thu chi Đảng phí nội bộ",sanPham:"Sổ theo dõi, Phiếu thu/chi và Báo cáo tài chính Đảng phí được phê duyệt",donVi:"Trọn gói 01 tháng",muc:"Theo cấp Tỉnh (60%)",diem:20,doPhucTap:4,categoryId:"1150328e-5d06-46b1-8e41-db99075fb196"},
{ma:"XV-006",linhVuc:"XV. Tài chính - Kế toán, Quản lý tài sản",nhom:"2 QUẢN LÝ TÀI SẢN CÔNG, TIÊU CHUẨN ĐỊNH MỨC & XỬ LÝ TÀI SẢN",ten:"Xử lý, giải quyết tài sản công (thanh lý, điều chuyển, bán, thu hồi, duyệt tiêu chuẩn mua sắm)",sanPham:"Tờ trình & Quyết định xử lý/điều chuyển/thanh lý tài sản được phê duyệt",donVi:"01 Hồ sơ xử lý",muc:"Theo cấp Tỉnh (60%)",diem:60,doPhucTap:6,categoryId:"1150328e-5d06-46b1-8e41-db99075fb196"},
{ma:"XVII-001",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Tham mưu nghị quyết đại hội, các nghị quyết, quyết định, chỉ thị, quy định, quy chế, kết luận, chương trình, kế hoạch của Đảng ủy, BTV Đảng ủy về TCCB, đảng viên, BVCTNB",sanPham:"Hồ sơ dự thảo + văn bản được ban hành",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-002",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Xây dựng đề án về tổ chức, cán bộ, công chức, viên chức, đảng viên, BVCTNB thuộc thẩm quyền BTV/Đảng ủy",sanPham:"Đề án, Tờ trình & Quyết định phê duyệt",donVi:"01 hồ sơ",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-003",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Cụ thể hóa và triển khai văn bản của cấp trên, của Đảng ủy/BTV về TCCB, đảng viên, BVCTNB",sanPham:"Văn bản triển khai",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-004",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Thẩm định, thẩm tra đề án, văn bản về TCCB, đảng viên, BVCTNB của cấp ủy/tổ chức đảng/đoàn thể trước khi trình BTV/Đảng ủy",sanPham:"Hồ sơ + Báo cáo/Tờ trình",donVi:"01 hồ sơ",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-005",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Tham mưu thành lập, kiện toàn, sắp xếp tổ chức đảng",sanPham:"Đề án, Tờ trình & Quyết định thành lập/kiện toàn",donVi:"01 hồ sơ",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-006",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Tham mưu kiện toàn cấp ủy, chức danh cấp ủy các cấp",sanPham:"Bộ hồ sơ nhân sự + Quyết định chỉ định/chuẩn y",donVi:"01 trường hợp",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-007",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Tham mưu công tác quy hoạch, bổ nhiệm, điều động cán bộ (diện Đảng quản lý)",sanPham:"Hồ sơ quy hoạch/bổ nhiệm/điều động được duyệt",donVi:"01 đợt/hồ sơ",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-008",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Thẩm tra, tham mưu Kết luận tiêu chuẩn chính trị phục vụ công tác cán bộ",sanPham:"Hồ sơ xác minh + Báo cáo/Kết luận",donVi:"01 trường hợp",muc:"Đảng bộ VKSNDTC 150đ · Đảng bộ trực thuộc 100đ · Chi bộ 50đ",diem:100,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-009",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Thẩm định, làm thủ tục kết nạp đảng viên mới, chuyển chính thức, xóa tên trong danh sách đảng viên và cho ra khỏi Đảng",sanPham:"Hồ sơ đề nghị + Quyết định tương ứng",donVi:"01 hồ sơ",muc:"Đảng bộ VKSNDTC 150đ · Đảng bộ trực thuộc 100đ · Chi bộ 50đ",diem:100,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-010",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Thực hiện thủ tục chuyển sinh hoạt đảng, cấp đổi thẻ đảng viên",sanPham:"Hồ sơ chuyển sinh hoạt / Thẻ đảng viên",donVi:"01 trường hợp",muc:"Đảng bộ VKSNDTC 100đ · Đảng bộ trực thuộc 60đ · Chi bộ 30đ",diem:60,doPhucTap:6,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-011",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Tham mưu kiểm điểm, đánh giá, xếp loại chất lượng Tổ chức đảng & Đảng viên",sanPham:"Bộ hồ sơ kiểm điểm, bảng tổng hợp xếp loại",donVi:"01 kỳ đánh giá",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-012",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Theo dõi, nâng cao chất lượng sinh hoạt Chi bộ (định kỳ & chuyên đề)",sanPham:"Biên bản họp, Nghị quyết chi bộ, báo cáo đánh giá",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 150đ · Đảng bộ trực thuộc 100đ · Chi bộ 50đ",diem:100,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-013",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Tham mưu hướng dẫn & thẩm định nhân sự, văn kiện Đại hội Đảng các cấp",sanPham:"Bộ văn kiện đại hội, đề án nhân sự & Quyết định chuẩn y",donVi:"01 kỳ đại hội",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-014",linhVuc:"XVII. Công tác Đảng",nhom:"1. Tổ chức, Cán bộ & Quản lý Đảng viên",ten:"Hướng dẫn, kiểm tra, giám sát công tác TCCB, đảng viên, BVCTNB, thi hành Điều lệ Đảng đối với cấp ủy/tổ chức đảng/đoàn thể trực thuộc",sanPham:"Hồ sơ cuộc KTGS + Kết luận/Thông báo kết quả",donVi:"01 cuộc KTGS",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-015",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Tham mưu xây dựng Chương trình, Kế hoạch KTGS nhiệm kỳ, hướng dẫn và thẩm định nhân sự UBKT",sanPham:"Quyết định ban hành Chương trình/Kế hoạch KTGS nhiệm kỳ",donVi:"01 kỳ đại hội",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-016",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Tham mưu triển khai nghị quyết, chỉ thị, kết luận, quy định của cấp trên về công tác KTGS",sanPham:"Nghị quyết/Quy chế/Chương trình/Kế hoạch",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-017",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Xây dựng Chương trình, Kế hoạch KTGS hằng năm",sanPham:"Quyết định ban hành Chương trình/Kế hoạch KTGS năm",donVi:"01 chương trình",muc:"Đảng bộ VKSNDTC 200đ · Đảng bộ trực thuộc 150đ · Chi bộ 100đ",diem:150,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-018",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Tham mưu, thực hiện Giám sát thường xuyên tổ chức đảng/đảng viên",sanPham:"Giám sát qua báo cáo, sinh hoạt cấp ủy, nắm tình hình",donVi:"thường xuyên",muc:"Đảng bộ VKSNDTC 200đ · Đảng bộ trực thuộc 150đ · Chi bộ 100đ",diem:150,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-019",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Thực hiện cuộc Kiểm tra/Giám sát chuyên đề đối với Tổ chức đảng & Đảng viên",sanPham:"Hồ sơ cuộc KTGS + Kết luận/Thông báo kết quả",donVi:"01 cuộc KTGS",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-020",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Kiểm tra Tổ chức đảng và Đảng viên khi có dấu hiệu vi phạm",sanPham:"Hồ sơ kiểm tra + Báo cáo & Kết luận xử lý",donVi:"01 cuộc kiểm tra",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-021",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Thực hiện xác minh tài sản, thu nhập đối với cán bộ, đảng viên",sanPham:"Hồ sơ xác minh + Báo cáo kết quả",donVi:"01 đợt/hồ sơ",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-022",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Tham mưu xem xét, thi hành kỷ luật Tổ chức đảng / Đảng viên vi phạm",sanPham:"Hồ sơ xem xét kỷ luật + Quyết định thi hành kỷ luật",donVi:"01 vụ việc",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-023",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Giải quyết Tố cáo, Khiếu nại kỷ luật Đảng thuộc thẩm quyền",sanPham:"Hồ sơ xác minh + Quyết định/Kết luận giải quyết",donVi:"01 vụ việc",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-024",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Kiểm tra công tác Thu, nộp, quản lý & sử dụng Đảng phí",sanPham:"Biên bản kiểm tra + Kết luận kiểm tra tài chính đảng",donVi:"01 cuộc kiểm tra",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-025",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Tiếp nhận, phân loại và giải quyết đơn thư (thuộc thẩm quyền UBKT)",sanPham:"Hồ sơ đơn + Văn bản giải quyết/trả lời",donVi:"01 vụ việc",muc:"Đảng bộ VKSNDTC 250đ · Đảng bộ trực thuộc 150đ · Chi bộ 75đ",diem:150,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-026",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Hướng dẫn nghiệp vụ / thẩm định nhân sự UBKT bổ sung",sanPham:"Văn bản hướng dẫn / Quyết định",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 200đ · Đảng bộ trực thuộc 150đ · Chi bộ 100đ",diem:150,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-027",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Tham mưu triển khai Chuyển đổi số; ứng dụng theo dõi quy định/chỉ thị/kết luận của Đảng; phần mềm thống kê ngành Kiểm tra",sanPham:"Kế hoạch CĐS + số hóa hồ sơ + cập nhật báo cáo thống kê",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-028",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Xây dựng Báo cáo chuyên đề (công tác KTGS)",sanPham:"Báo cáo ban hành đúng thời hạn",donVi:"01 báo cáo",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-029",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Báo cáo định kỳ (Tuần/Tháng/Quý/9 tháng/1 năm) về công tác kiểm tra, giám sát",sanPham:"Báo cáo định kỳ ban hành đúng thời hạn",donVi:"01 báo cáo",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-030",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Chuẩn bị các Hội nghị về công tác kiểm tra, giám sát",sanPham:"Chuẩn bị các điều kiện đảm bảo cho Hội nghị",donVi:"01 hội nghị",muc:"Đảng bộ VKSNDTC 150đ · Đảng bộ trực thuộc 100đ · Chi bộ 50đ",diem:100,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-031",linhVuc:"XVII. Công tác Đảng",nhom:"2. Kiểm tra, Giám sát & Kỷ luật Đảng",ten:"Công tác Văn thư, Lưu trữ, Bảo mật tài liệu Đảng & Quản lý con dấu (khối KTGS)",sanPham:"Sổ văn bản đi/đến, hồ sơ lưu trữ, nhật ký con dấu",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 150đ · Đảng bộ trực thuộc 100đ · Chi bộ 50đ",diem:100,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-032",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Tham mưu nghiên cứu, đề xuất dự thảo các đề án, nghị quyết, quyết định, chỉ thị, quy định, quy chế, kết luận trong lĩnh vực Tuyên giáo",sanPham:"Hồ sơ dự thảo + văn bản được ban hành",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-033",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Cụ thể hóa các chủ trương của Đảng về bảo vệ nền tảng tư tưởng của Đảng, đấu tranh phản bác quan điểm sai trái, thù địch trong Đảng bộ",sanPham:"Văn bản triển khai",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-034",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Chủ trì tham mưu với Ban Chỉ đạo 35 Đảng bộ phối hợp chỉ đạo các lực lượng tham gia bảo vệ nền tảng tư tưởng của Đảng",sanPham:"Văn bản triển khai",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 200đ · Đảng bộ trực thuộc 120đ · Chi bộ 60đ",diem:120,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-035",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Hướng dẫn, kiểm tra, giám sát công tác tuyên giáo",sanPham:"Hồ sơ cuộc KTGS + Kết luận/Thông báo kết quả",donVi:"01 cuộc KTGS",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-036",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Tham mưu tổ chức Học tập, quán triệt Nghị quyết, Chỉ thị của Đảng",sanPham:"Kế hoạch tổ chức + Báo cáo kết quả đợt học tập",donVi:"01 đợt học tập",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-037",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Triển khai Học tập & làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh",sanPham:"Kế hoạch chuyên đề năm + Báo cáo sơ/tổng kết",donVi:"01 đợt/năm",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-038",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Tham mưu đấu tranh, phản bác thông tin, quan điểm sai trái, thù địch",sanPham:"Bài viết đấu tranh / Báo cáo phương án xử lý",donVi:"01 tác phẩm/phương án",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-039",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Tham mưu thực hiện Dân chủ ở cơ sở & Công tác Dân vận trong Đảng bộ",sanPham:"Kế hoạch dân vận / Biên bản đối thoại / Báo cáo",donVi:"01 đợt/năm",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-040",linhVuc:"XVII. Công tác Đảng",nhom:"3. Tuyên giáo",ten:"Theo dõi, tổng hợp, phân tích tình hình tư tưởng & dư luận xã hội",sanPham:"Báo cáo tổng hợp tình hình tư tưởng định kỳ",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-041",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Nghiên cứu, tham mưu ban hành Nghị quyết, Chỉ thị, Kế hoạch, Chương trình hành động (Văn phòng Đảng ủy)",sanPham:"Hồ sơ dự thảo + văn bản được ban hành",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-042",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Tổng hợp tình hình thực hiện các nghị quyết, quyết định, chỉ thị, quy định, quy chế của cấp ủy cấp trên và Đảng ủy; hoạt động của cấp ủy, tổ chức đảng, đoàn thể",sanPham:"Báo cáo Ban Thường vụ",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-043",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Báo cáo sơ kết/tổng kết/chuyên đề công tác đảng (6 tháng, 1 năm)",sanPham:"Báo cáo sơ kết/tổng kết/chuyên đề hoàn chỉnh kèm phụ lục",donVi:"01 báo cáo",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-044",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Báo cáo định kỳ (Tuần/Tháng) — Văn phòng Đảng ủy",sanPham:"Báo cáo định kỳ ban hành đúng thời hạn",donVi:"01 báo cáo",muc:"Đảng bộ VKSNDTC 100đ · Đảng bộ trực thuộc 60đ · Chi bộ 30đ",diem:60,doPhucTap:6,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-045",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Báo cáo phục vụ họp thường kỳ Ban Thường vụ, Ban Chấp hành Đảng bộ",sanPham:"Báo cáo định kỳ ban hành đúng thời hạn",donVi:"01 báo cáo",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-046",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Chủ trì, phối hợp tham mưu, giúp Đảng ủy/BTV lãnh đạo, chỉ đạo công tác tư pháp, phòng chống tham nhũng, lãng phí, tiêu cực",sanPham:"Văn bản lãnh đạo, chỉ đạo",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-047",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Tiếp nhận và xử lý đơn, thư gửi đến Đảng ủy; theo dõi, đôn đốc giải quyết; phối hợp tiếp công dân",sanPham:"Quyết định giải quyết/Văn bản trả lời đơn thư",donVi:"01 hồ sơ đơn",muc:"Đảng bộ VKSNDTC 350đ · Đảng bộ trực thuộc 210đ · Chi bộ 100đ",diem:210,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-048",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Hướng dẫn, kiểm tra, giám sát công tác văn phòng, tài chính, nghiệp vụ văn thư, lưu trữ, thu nộp đảng phí",sanPham:"Hồ sơ cuộc KTGS + Kết luận/Thông báo kết quả",donVi:"01 cuộc KTGS",muc:"Đảng bộ VKSNDTC 400đ · Đảng bộ trực thuộc 250đ · Chi bộ 120đ",diem:250,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-049",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Thẩm định, thẩm tra Đề án, văn bản của các cơ quan, tổ chức trước khi trình Đảng ủy, Ban Thường vụ",sanPham:"Hồ sơ thẩm định/Văn bản ban hành",donVi:"01 bộ hồ sơ",muc:"Đảng bộ VKSNDTC 500đ · Đảng bộ trực thuộc 300đ · Chi bộ 150đ",diem:300,doPhucTap:9,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-050",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Lập dự toán & Quyết toán kinh phí hoạt động công tác Đảng",sanPham:"Hồ sơ dự toán / Báo cáo quyết toán được phê duyệt",donVi:"01 bộ hồ sơ",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-051",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Quản lý, thu nộp & trích nộp Đảng phí; báo cáo công tác tài chính",sanPham:"Sổ sách theo dõi, phiếu thu/chi & Bảng tổng hợp/Báo cáo tài chính",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 200đ · Đảng bộ trực thuộc 150đ · Chi bộ 100đ",diem:150,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-052",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Tham mưu triển khai Chuyển đổi số & Ứng dụng Sổ tay đảng viên điện tử",sanPham:"Kế hoạch CĐS / Dữ liệu đảng viên cập nhật trên hệ thống số",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 300đ · Đảng bộ trực thuộc 200đ · Chi bộ 100đ",diem:200,doPhucTap:8,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-053",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Công tác Văn thư, Lưu trữ, Bảo mật tài liệu Đảng & Quản lý con dấu",sanPham:"Sổ văn bản đi/đến, hồ sơ lưu trữ, nhật ký con dấu",donVi:"trọn gói 01 tháng",muc:"Đảng bộ VKSNDTC 150đ · Đảng bộ trực thuộc 100đ · Chi bộ 50đ",diem:100,doPhucTap:7,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
{ma:"XVII-054",linhVuc:"XVII. Công tác Đảng",nhom:"4. Văn phòng, Tài chính Đảng",ten:"Tiếp nhận, phát hành và quản lý các tài liệu, văn bản đến và đi (Văn phòng Đảng ủy)",sanPham:"Phiếu trình xử lý văn bản / phát hành văn bản",donVi:"01 văn bản",muc:"Đảng bộ VKSNDTC 100đ · Đảng bộ trực thuộc 60đ · Chi bộ 30đ",diem:60,doPhucTap:6,categoryId:"6ea2518a-17cd-4bcd-8b22-9d33355dc8a8"},
];
var KPI_CATALOG_OTHER_CATEGORY_ID="b1da5f91-0976-46bb-834a-672645d9e665";

function populateCategorySelect(){
  // "categorySelect" gio la 1 input hidden (khoa cung qua tra cuu danh muc KPI - xem
  // renderKpiCatalogList/applyKpiCatalogItem/applyOtherCategory), khong con la <select> nen
  // ham nay khong con viec gi de lam - giu lai ham (khong xoa cac noi goi ram()/oj() dang goi
  // no) nhung thoat som, tranh dong innerHTML vo ich vao 1 input.
  var sel=$('categorySelect');if(!sel||sel.tagName!=='SELECT')return;
  var current=sel.value;
  sel.innerHTML='<option value="">Chọn lĩnh vực</option>'+CATS.filter(function(c){return !c.is_leave}).map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('');
  if(current)sel.value=current;
}

// O "Linh vuc cong tac" khoa cung - chi duoc set qua applyKpiCatalogItem/applyOtherCategory/
// sao chep nhat ky cu, khong con cho chon tay tuy y. Ham nay chi lo phan HIEN THI.
function syncJournalCategoryDisplay(){
  var value=$('journalForm').elements.category.value;
  var box=$('journalCategoryDisplay');if(!box)return;
  box.textContent=value?catName(value):'Chưa xác định — tra cứu đầu việc ở trên để tự động điền';
  box.classList.toggle('is-empty',!value);
}

var KPI_CATALOG_DEFAULT_LABEL='📋 Tra cứu đầu việc theo danh mục KPI Tối cao';

// Hien thi THUONG TRUC dau viec da chon ngay tren nut bam (thay vi chi bao qua 1 lan roi mat) -
// de nguoi dung con thay dang tham khao viec nao trong luc dien tiep cac o khac cua form.
function setKpiCatalogPickedLabel(item){
  var btn=$('toggleKpiCatalog');if(!btn)return;
  if(!item){
    btn.innerHTML=KPI_CATALOG_DEFAULT_LABEL;
    btn.classList.remove('is-picked');
    delete btn.dataset.pickedMa;
    return;
  }
  var detail=item.doPhucTap!=null?('Độ phức tạp gợi ý '+item.doPhucTap+'/10 · bấm để đổi'):'không có trong danh mục · bấm để đổi';
  btn.innerHTML='📋 Đầu việc tham khảo: <strong>'+esc(item.ten)+'</strong> <span class="kpi-catalog-change">('+detail+')</span>';
  btn.classList.add('is-picked');
  if(item.ma)btn.dataset.pickedMa=item.ma;else delete btn.dataset.pickedMa;
}

// Dung khi khong tim thay dau viec nao phu hop trong danh muc - van khoa cung Linh vuc cong tac
// ve "Cong tac khac", nhung KHONG dien san Do phuc tap (khong co goi y that de dien).
function applyOtherCategory(){
  var form=$('journalForm');
  form.elements.category.value=KPI_CATALOG_OTHER_CATEGORY_ID;
  syncJournalCategoryDisplay();
  kpiComplexityFromCatalog=false; // khong co goi y that - tra ve loi giai thich day du khi tu cham
  updateSelfScoreGuide('Complexity',form.elements.selfComplexity.value);
  $('kpiCatalogPanel').hidden=true;
  setKpiCatalogPickedLabel({ma:null,ten:'Công tác khác',doPhucTap:null});
  showToast('Đã chọn "Công tác khác" — tự chấm Độ phức tạp và Chất lượng như bình thường.');
}

function renderKpiCatalogList(query){
  var q=(query||'').trim().normalize('NFC').toLowerCase();
  var matches=!q?[]:KPI_TASK_CATALOG.filter(function(item){
    return (item.ten+' '+item.sanPham+' '+item.nhom).normalize('NFC').toLowerCase().indexOf(q)>=0;
  }).slice(0,30);
  var list=$('kpiCatalogList');
  if(!q){
    list.innerHTML='<div class="empty-state compact-empty"><strong>Gõ từ khoá để tìm đầu việc, ví dụ "kiểm sát tạm giữ", "giải quyết đơn", "báo cáo định kỳ"...</strong></div>';
  }else if(!matches.length){
    list.innerHTML='<div class="empty-state compact-empty"><strong>Không tìm thấy việc phù hợp trong danh mục — cứ chọn Lĩnh vực công tác và tự chấm điểm như bình thường.</strong></div>';
  }else{
    list.innerHTML=matches.map(function(item){
      return '<button type="button" class="copy-journal-item" data-kpi-catalog="'+item.ma+'"><strong>'+esc(item.ten)+'</strong><span>'+esc(item.linhVuc)+(item.nhom?' · '+esc(item.nhom):'')+' · Độ phức tạp gợi ý '+item.doPhucTap+'/10</span></button>';
    }).join('');
  }
  list.querySelectorAll('[data-kpi-catalog]').forEach(function(b){b.addEventListener('click',function(){applyKpiCatalogItem(b.dataset.kpiCatalog)})});
}

function applyKpiCatalogItem(ma){
  var item=KPI_TASK_CATALOG.find(function(row){return row.ma===ma});
  if(!item)return;
  var form=$('journalForm');
  form.elements.category.value=item.categoryId;
  syncJournalCategoryDisplay();
  form.elements.selfComplexity.value=item.doPhucTap;
  kpiComplexityFromCatalog=true;
  updateSelfScoreGuide('Complexity',item.doPhucTap);
  $('kpiCatalogPanel').hidden=true;
  setKpiCatalogPickedLabel(item);
  showToast('Đã điền gợi ý theo "'+item.ten+'" (Độ phức tạp '+item.doPhucTap+'/10) — vẫn có thể sửa lại trước khi gửi.');
}

function ub(){
  if(!U)return;
  // Neu truoc do tung o man hinh "tai khoan bi khoa" (showInactiveScreen da an
  // sidebar/chuong thong bao/nut menu), phai hien lai day du khi tai khoan
  // da duoc kich hoat va dang nhap binh thuong.
  setVisible($('sidebar'),true);
  var nc0=$('notificationCenter');if(nc0)nc0.hidden=false;
  var mm0=$('mobileMenu');if(mm0)mm0.hidden=false;

  var un0=$('sidebarUserName');if(un0)un0.textContent=U.n;
  var ut0=$('sidebarUserTitle');if(ut0)ut0.textContent=U.tl||ROLE_LABELS[U.rl]||'';

  setVisible(document.querySelector('.review-nav'),isLeader());
  setVisible(document.querySelector('.unit-journal-nav'),isLeader());
  // Truong phong/Chanh van phong (unit_head) cung can vao duoc de tu uy
  // quyen cho pho cua minh, nhung chi thay muc "Uy quyen co thoi han"
  // (xem ra()) - khong thay cac muc quan tri toan phan.
  setVisible(document.querySelector('.admin-nav'),isAdminOrProvinceHead()||U.rl==='unit_head');
  // Co cau to chuc chi danh cho Vien truong tinh va quan tri vien.
  setVisible(document.querySelector('.org-nav'),isAdminOrProvinceHead());
  // Quan tri vien khong ghi cong viec, khong can Nhat ky/Cham diem thang.
  var isAdminOnly=(U.rl==='administrator');
  setVisible(document.querySelector('.journal-nav'),!isAdminOnly);
  setVisible(document.querySelector('.monthly-nav'),!isAdminOnly);
  setVisible(document.querySelector('.score-adj-nav'),!isAdminOnly);
  setVisible(document.querySelector('.tasks-nav'),!isAdminOnly);
  var taskNavLabel=document.querySelector('.task-nav-label');
  if(taskNavLabel)taskNavLabel.textContent=taskViewLabel();

  if(!isLeader()&&V==='reviews')V='dashboard';
  if(!isLeader()&&V==='unitJournal')V='dashboard';
  if(!(isAdminOrProvinceHead()||U.rl==='unit_head')&&V==='administration')V='dashboard';
  if(!isAdminOrProvinceHead()&&V==='organization')V='dashboard';
  if(isAdminOnly&&(V==='journal'||V==='monthly'||V==='tasks'))V='dashboard';
}

function render(){
  if(U&&U.inactive){showInactiveScreen();return}
  if(V==='dashboard')rd();
  else if(V==='journal')rj();
  else if(V==='notes')rn();
  else if(V==='tasks')rt();
  else if(V==='reviews')rr();
  else if(V==='unitJournal')ruj();
  else if(V==='scoreAdjustments')rsa();
  else if(V==='monthly')rm();
  else if(V==='organization')ro();
  else if(V==='administration')ra();
  else if(V==='changelog')rc();
  else if(V==='trash')rtb();
  else if(V==='settings')rs();
  else rp();
}

// Man hinh chua xay dung (quan tri: tao/duyet tai khoan that - de sau theo yeu cau)
function rp(){
  $('pageEyebrow').textContent='ĐANG PHÁT TRIỂN';$('pageTitle').textContent='Chưa hoàn thiện';
  $('appView').innerHTML='<div class="empty-state"><strong>Tính năng đang được xây dựng</strong><span>Phần này sẽ sớm được nối với dữ liệu thật.</span></div>';
}

// Nho bo loc lan truoc (ky bao cao, don vi dang xem...) giua cac lan dung,
// khong phai chon lai tu dau moi lan vao. Chi la tien loi giao dien, KHONG
// anh huong pham vi du lieu duoc phep xem (van do role/RLS quyet dinh).
var FILTER_PREFS_KEY='qlcv_filter_prefs';
function loadFilterPrefs(){try{return JSON.parse(localStorage.getItem(FILTER_PREFS_KEY))||{}}catch(e){return {}}}
function saveFilterPrefs(patch){
  var prefs=loadFilterPrefs();
  for(var k in patch)prefs[k]=patch[k];
  try{localStorage.setItem(FILTER_PREFS_KEY,JSON.stringify(prefs))}catch(e){}
}
var FILTER_PREFS=loadFilterPrefs();

// ============================================
// DASHBOARD - tong hop that, thay cho du lieu demo
// ============================================
var DASHBOARD_PERIOD=FILTER_PREFS.dashboardPeriod||'month',DASHBOARD_UNIT_FILTER=FILTER_PREFS.dashboardUnit||'all',DASHBOARD_COMPARISON_MODE=FILTER_PREFS.dashboardComparisonMode||'unit',DASHBOARD_PERSON_UNIT=FILTER_PREFS.dashboardPersonUnit||'all';
var DASHBOARD_SORT={key:'quality',direction:'desc'};
var DASHBOARD_LOGS=[],DASHBOARD_PEOPLE=[];

function average(values){return values.length?values.reduce(function(a,b){return a+b},0)/values.length:0}
function weightedQualitySnake(items){
  var reviewed=items.filter(function(i){return Number.isFinite(i.complexity_score)&&Number.isFinite(i.quality_score)});
  var weight=reviewed.reduce(function(s,i){return s+i.complexity_score},0);
  return weight?reviewed.reduce(function(s,i){return s+i.complexity_score*i.quality_score},0)/weight:0;
}
function unitById(id){return UNITS.find(function(u){return u.id===id})}
function scoreClassOf(score){return score>=8?'score-high':score>=6?'score-mid':'score-low'}
function compactMetric(label,value,context,tone){return '<div class="compact-metric '+(tone||'')+'"><span>'+esc(label)+'</span><strong>'+value+'</strong><small>'+esc(context)+'</small></div>'}

function inSelectedPeriod(dateStr){
  if(DASHBOARD_PERIOD==='all')return true;
  var now=new Date();
  if(DASHBOARD_PERIOD==='month')return dateStr.indexOf(now.toISOString().slice(0,7))===0;
  if(DASHBOARD_PERIOD==='quarter'){
    var q=Math.floor(now.getMonth()/3);
    var start=new Date(now.getFullYear(),q*3,1);
    var end=new Date(now.getFullYear(),q*3+3,1);
    var d=new Date(dateStr+'T00:00:00');
    return d>=start&&d<end;
  }
  return true;
}

function dashboardLogsFiltered(includeAllPeriods){
  var scoped=DASHBOARD_LOGS;
  if(U.rl==='staff'||U.rl==='support_staff')scoped=scoped.filter(function(l){return l.author_id===U.id});
  if(DASHBOARD_UNIT_FILTER!=='all')scoped=scoped.filter(function(l){return l.unit_id===DASHBOARD_UNIT_FILTER});
  if(!includeAllPeriods)scoped=scoped.filter(function(l){return inSelectedPeriod(l.log_date)});
  return scoped;
}

function dashboardAvailableUnits(){
  if(U.rl==='province_head'||U.rl==='administrator')return UNITS.filter(function(u){return u.type!=='province'});
  // Pho Vien truong dang duoc uy quyen thay mat toan tinh (U.hasFullDelegation)
  // thi xem toan bo giong Vien truong, khong chi rieng don vi phan cong co
  // dinh (yeu cau nguoi dung, 2026-09-08).
  if(U.rl==='province_deputy')return U.hasFullDelegation?UNITS.filter(function(u){return u.type!=='province'}):UNITS.filter(function(u){return (U.assignedUnits||[]).indexOf(u.id)>=0});
  return UNITS.filter(function(u){return u.id===U.uid});
}

async function fetchDashboardLogs(){
  var now=new Date();
  var start=ymdStr(now.getFullYear(),now.getMonth()-5,1);
  // is_clone=eq.false: loai cac dong tu sinh cua "cong viec nhieu ngay"
  // (migration 00057/00058) khoi moi thong ke Tong quan, tranh 1 viec keo
  // dai N ngay bi tinh nang N lan. Nhat ky nghi phep cung loai luon (khong
  // phai "cong viec") - loc client-side qua isLeaveCategory() vi CATS da
  // co san tu luc dang nhap.
  var r=await fetch(API+'work_logs?log_date=gte.'+start+'&is_clone=eq.false&deleted_at=is.null&select=author_id,unit_id,log_date,category_id,status,complexity_score,quality_score&order=log_date.desc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  var rows=await r.json();
  return rows.filter(function(l){return !isLeaveCategory(l.category_id)});
}

async function fetchDashboardScopeProfiles(){
  var sel='id,full_name,title,professional_title,birth_year,role,unit_id,initials';
  if(U.rl==='staff'||U.rl==='support_staff')return [{id:U.id,full_name:U.n,title:U.tl,professional_title:'',role:U.rl,unit_id:U.uid,initials:U.in}];
  if(U.rl==='unit_head'||U.rl==='unit_deputy'){
    var r=await fetch(API+'profiles?unit_id=eq.'+U.uid+'&role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return filterVisibleInUnitScope(await r.json());
  }
  if(U.rl==='province_deputy'&&!U.hasFullDelegation){
    var ids=(U.assignedUnits||[]);
    if(!ids.length)return [];
    var r2=await fetch(API+'profiles?unit_id=in.('+ids.join(',')+')&role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!r2.ok)throw new Error('HTTP '+r2.status);
    return await r2.json();
  }
  // province_head, hoac province_deputy dang trong thoi gian duoc uy quyen
  // thay mat 100% toan tinh (U.hasFullDelegation) - xem toan bo, giong het
  // pham vi Vien truong tinh (yeu cau nguoi dung, 2026-09-08: truoc day Pho
  // Vien truong khong co don vi phan cong co dinh nhung dang duoc uy quyen
  // van bi tra ve rong, khong xuat duoc gi).
  var r3=await fetch(API+'profiles?role=neq.administrator&select='+sel,{headers:authHeaders()});
  if(!r3.ok)throw new Error('HTTP '+r3.status);
  return await r3.json();
}

// totalCount (so nhat ky da NOP trong ky, moi trang thai) dung de tinh
// "Ty le da cham diem" = count(da duyet)/totalCount - khac "Ty le >= 8"
// (chi xet trong so da duyet). Neu khong truyen totalCount (vd bieu do so
// sanh khong can cot nay), mac dinh lay = count (ty le 100%), tranh chia 0.
function aggregateRowSnake(id,label,items,peopleCount,sublabel,totalCount){
  var total=totalCount||items.length;
  return {
    id:id,label:label,sublabel:sublabel||'',people:peopleCount,count:items.length,
    complexityAvg:average(items.map(function(i){return i.complexity_score}).filter(function(v){return Number.isFinite(v)})),
    quality:weightedQualitySnake(items),
    highQuality:items.filter(function(i){return i.quality_score>=8}).length,
    reviewedRate:total?(items.length/total*100):0
  };
}

// scope (khong bat buoc): TOAN BO nhat ky da nop trong ky (moi trang thai
// pending/approved/revision) - dung lam mau so tinh "Ty le da cham diem".
// approved luon la tap con cua scope (da loc san o rd()).
function aggregateByUnit(approved,people,scope){
  return dashboardAvailableUnits().map(function(u){
    var subset=approved.filter(function(l){return l.unit_id===u.id});
    var peopleCount=people.filter(function(p){return p.unit_id===u.id}).length;
    var totalCount=scope?scope.filter(function(l){return l.unit_id===u.id}).length:undefined;
    return aggregateRowSnake(u.id,u.short_name||u.code,subset,peopleCount,null,totalCount);
  }).filter(function(row){return row.count>0});
}

function aggregateByUser(approved,people,unitId,scope){
  return people.filter(function(p){return p.unit_id===unitId}).map(function(p){
    var subset=approved.filter(function(l){return l.author_id===p.id});
    var totalCount=scope?scope.filter(function(l){return l.author_id===p.id}).length:undefined;
    return aggregateRowSnake(p.id,p.full_name,subset,1,p.title,totalCount);
  }).filter(function(row){return row.count>0});
}

function aggregateVisibleUsers(approved,people,unitId,scope){
  return people.filter(function(p){return p.role!=='administrator'&&(!unitId||p.unit_id===unitId)}).map(function(p){
    var subset=approved.filter(function(l){return l.author_id===p.id});
    var totalCount=scope?scope.filter(function(l){return l.author_id===p.id}).length:undefined;
    return aggregateRowSnake(p.id,p.full_name,subset,1,(p.title||'')+' · '+unitShort(p.unit_id),totalCount);
  }).filter(function(row){return row.count>0});
}

function qualityGaugeHtml(quality,scope,approved){
  var score=Number.isFinite(quality)?quality:0;
  var angle=Math.max(0,Math.min(10,score))*18;
  var message=score>=8?'Chất lượng đang ở mức tốt':score>=6.5?'Chất lượng ở mức khá':'Có chỉ số cần theo dõi';
  var pendingCount=scope.filter(function(l){return l.status==='pending'}).length;
  var revisionCount=scope.filter(function(l){return l.status==='revision'}).length;
  var outstanding=approved.filter(function(l){return l.complexity_score>=7&&l.quality_score>=8}).length;
  return '<div class="gauge-wrap"><div class="gauge-visual"><div class="mini-gauge" aria-label="Chất lượng '+score.toFixed(1)+' trên 10"><div class="gauge-dial"></div><span class="gauge-needle" style="transform:rotate('+angle+'deg)"></span><i></i><small class="gauge-min">0</small><small class="gauge-mid">5</small><small class="gauge-max">10</small></div><div class="gauge-reading"><strong>'+(score?score.toFixed(1):'—')+'</strong><span>/10</span></div><span>Điểm chất lượng tổng hợp</span></div><div class="gauge-copy"><span class="eyebrow">NHẬN ĐỊNH NHANH</span><strong>'+message+'</strong><p>'+pendingCount+' chờ xử lý · '+revisionCount+' cần bổ sung · '+outstanding+' nổi bật</p></div></div>';
}

function trendChartHtml(sourceLogs){
  var now=new Date();
  var periods=[],monthLabels=[];
  for(var i=5;i>=0;i--){
    var d=new Date(now.getFullYear(),now.getMonth()-i,1);
    periods.push(ymStr(now.getFullYear(),now.getMonth()-i));
    monthLabels.push('T'+(d.getMonth()+1));
  }
  var qualityValues=periods.map(function(p){return weightedQualitySnake(sourceLogs.filter(function(l){return l.log_date.indexOf(p)===0}))});
  var complexityValues=periods.map(function(p){return average(sourceLogs.filter(function(l){return l.log_date.indexOf(p)===0}).map(function(l){return l.complexity_score}).filter(function(v){return Number.isFinite(v)}))});
  var width=620,height=170,left=42,right=18,top=16,bottom=32;
  function xPos(index){return left+index/(qualityValues.length-1)*(width-left-right)}
  function yPos(value){return top+(10-(value||5))/5*(height-top-bottom)}
  var qualityPoints=qualityValues.map(function(v,idx){return xPos(idx)+','+yPos(v)}).join(' ');
  var complexityPoints=complexityValues.map(function(v,idx){return xPos(idx)+','+yPos(v)}).join(' ');
  var horizontalGrid=[6,7,8,9,10].map(function(v){return '<line class="grid-line" x1="'+left+'" x2="'+(width-right)+'" y1="'+yPos(v)+'" y2="'+yPos(v)+'"/><text class="tick-label" x="'+(left-9)+'" y="'+(yPos(v)+4)+'" text-anchor="end">'+v+'</text>'}).join('');
  var plotWidth=width-left-right,plotHeight=height-top-bottom;
  var squareColumns=Math.max(1,Math.round(plotWidth/(plotHeight/5)));
  var squareGrid='';
  for(var c=0;c<=squareColumns;c++){var gx=left+c/squareColumns*plotWidth;squareGrid+='<line class="grid-line square-grid" x1="'+gx+'" x2="'+gx+'" y1="'+top+'" y2="'+(height-bottom)+'"/>'}
  var monthGrid=qualityValues.map(function(v,idx){return '<line class="grid-line month-grid" x1="'+xPos(idx)+'" x2="'+xPos(idx)+'" y1="'+top+'" y2="'+(height-bottom)+'"/>'}).join('');
  function delta(values){return values.length>1?values[values.length-1]-values[values.length-2]:0}
  function deltaChip(label,values,tone){
    var change=delta(values);
    var direction=change>0.04?'↑':change<-0.04?'↓':'→';
    var cls=change>0.04?'up':change<-0.04?'down':'flat';
    return '<span class="trend-delta '+cls+' '+tone+'"><i></i>'+label+' <strong>'+values[values.length-1].toFixed(1)+'</strong> '+direction+' '+Math.abs(change).toFixed(1)+'</span>';
  }
  var points=qualityValues.map(function(v,idx){
    return '<g><circle class="trend-point quality" cx="'+xPos(idx)+'" cy="'+yPos(v)+'" r="3"><title>'+monthLabels[idx]+' · Chất lượng '+v.toFixed(1)+'</title></circle><circle class="trend-point complexity" cx="'+xPos(idx)+'" cy="'+yPos(complexityValues[idx])+'" r="3"><title>'+monthLabels[idx]+' · Phức tạp '+complexityValues[idx].toFixed(1)+'</title></circle><text class="tick-label" x="'+xPos(idx)+'" y="'+(height-10)+'" text-anchor="middle">'+monthLabels[idx]+'</text></g>';
  }).join('');
  return '<div class="trend-summary">'+deltaChip('Chất lượng',qualityValues,'quality')+deltaChip('Phức tạp',complexityValues,'complexity')+'</div><svg class="trend-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Xu hướng chất lượng và độ phức tạp trong 6 tháng"><rect class="trend-plot" x="'+left+'" y="'+top+'" width="'+plotWidth+'" height="'+plotHeight+'"/>'+squareGrid+horizontalGrid+monthGrid+'<polyline class="trend-line quality" points="'+qualityPoints+'"/><polyline class="trend-line complexity" points="'+complexityPoints+'"/>'+points+'</svg><div class="chart-legend trend-legend"><span><i class="legend-line quality"></i>Chất lượng</span><span><i class="legend-line complexity"></i>Phức tạp bình quân</span><span>↑ tăng · ↓ giảm so với tháng trước</span></div>';
}

function reviewStatusChartHtml(items){
  var approvedCount=items.filter(function(i){return i.status==='approved'}).length;
  var revisionCount=items.filter(function(i){return i.status==='revision'}).length;
  var pendingCount=items.filter(function(i){return i.status==='pending'}).length;
  var total=Math.max(1,items.length);
  var a=approvedCount/total*100;
  var b=(approvedCount+revisionCount)/total*100;
  var revisionRate=revisionCount/total*100;
  var pendingRate=pendingCount/total*100;
  return '<div class="compact-pie-layout"><div class="compact-pie review-pie" style="--p1:'+a+'%;--p2:'+b+'%"><div><strong>'+Math.round(a)+'%</strong><span>đã xác nhận</span></div></div><div class="compact-pie-legend"><div><i class="legend-swatch swatch-green"></i><span>Đã xác nhận</span><strong>'+Math.round(a)+'% <small>('+approvedCount+')</small></strong></div><div><i class="legend-swatch swatch-red"></i><span>Cần bổ sung</span><strong>'+Math.round(revisionRate)+'% <small>('+revisionCount+')</small></strong></div><div><i class="legend-swatch swatch-gold"></i><span>Chờ đánh giá</span><strong>'+Math.round(pendingRate)+'% <small>('+pendingCount+')</small></strong></div></div></div>';
}

function qualityDistributionHtml(items){
  var bands=[
    {label:'Rất tốt (9–10)',count:items.filter(function(i){return i.quality_score>=9}).length},
    {label:'Tốt (7–8)',count:items.filter(function(i){return i.quality_score>=7&&i.quality_score<9}).length},
    {label:'Đạt (5–6)',count:items.filter(function(i){return i.quality_score>=5&&i.quality_score<7}).length},
    {label:'Cần bổ sung (1–4)',count:items.filter(function(i){return i.quality_score&&i.quality_score<5}).length}
  ];
  var total=Math.max(1,bands.reduce(function(s,b){return s+b.count},0));
  var rates=bands.map(function(b){return b.count/total*100});
  var p1=rates[0],p2=p1+rates[1],p3=p2+rates[2];
  return '<div class="compact-pie-layout"><div class="compact-pie quality-pie" style="--p1:'+p1+'%;--p2:'+p2+'%;--p3:'+p3+'%"><div><strong>'+total+'</strong><span>kết quả</span></div></div><div class="compact-pie-legend">'+bands.map(function(band,index){
    var swatch=index===0?'swatch-green':index===1?'swatch-blue':index===2?'swatch-gold':'swatch-red';
    return '<div><i class="legend-swatch '+swatch+'"></i><span>'+band.label+'</span><strong>'+Math.round(rates[index])+'% <small>('+band.count+')</small></strong></div>';
  }).join('')+'</div></div>';
}

function workCategoryStatsHtml(items){
  if(!items.length)return '<div class="empty-state"><strong>Chưa có dữ liệu</strong><span>Không có nhật ký thuộc kỳ và phạm vi đã chọn.</span></div>';
  var total=items.length;
  var categoryIds=[];
  items.forEach(function(item){if(categoryIds.indexOf(item.category_id)<0)categoryIds.push(item.category_id)});
  var rows=categoryIds.map(function(categoryId){
    var categoryLogs=items.filter(function(item){return item.category_id===categoryId});
    var approved=categoryLogs.filter(function(item){return item.status==='approved'});
    return {
      name:catName(categoryId),
      count:categoryLogs.length,
      approved:approved.length,
      share:categoryLogs.length/total*100,
      complexity:average(approved.map(function(item){return item.complexity_score}).filter(function(value){return Number.isFinite(value)})),
      quality:weightedQualitySnake(approved)
    };
  }).sort(function(a,b){return (b.count-a.count)||a.name.localeCompare(b.name,'vi')});
  return '<div class="table-wrap category-stats-table"><table><thead><tr><th>Lĩnh vực công tác</th><th>Tỷ trọng</th><th class="numeric">Nhật ký</th><th class="numeric">Đã xác nhận</th><th class="numeric">Phức tạp BQ</th><th class="numeric">Chất lượng BQ</th></tr></thead><tbody>'+rows.map(function(row){
    return '<tr><td><strong>'+esc(row.name)+'</strong></td><td><div class="category-share"><div class="bar-track"><div class="bar-fill blue" style="width:'+row.share+'%"></div></div><span>'+row.share.toFixed(0)+'%</span></div></td><td class="numeric"><strong>'+row.count+'</strong></td><td class="numeric">'+row.approved+'</td><td class="numeric">'+(row.approved?row.complexity.toFixed(1):'—')+'</td><td class="numeric">'+(row.approved?'<span class="score-pill '+scoreClassOf(row.quality)+'">'+row.quality.toFixed(1)+'</span>':'—')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

function groupedUnitComparisonChartHtml(rows){
  var definitions=[{type:'department',title:'Phòng thuộc VKSND tỉnh',tone:'department'},{type:'regional',title:'VKSND khu vực',tone:'regional'}];
  var groups=definitions.map(function(def){
    var groupRows=rows.filter(function(row){var u=unitById(row.id);return u&&u.type===def.type}).sort(function(a,b){return (b.quality-a.quality)||(b.complexityAvg-a.complexityAvg)});
    return {title:def.title,tone:def.tone,rows:groupRows};
  }).filter(function(g){return g.rows.length});
  function renderRow(row){
    var displayQuality=Number(row.quality.toFixed(1));
    var tone=displayQuality>=8?'green':displayQuality>=6.5?'blue':'gold';
    return '<div class="unit-compare-row" aria-label="'+esc(row.label)+': chất lượng '+displayQuality.toFixed(1)+', phức tạp '+row.complexityAvg.toFixed(1)+', '+row.count+' kết quả"><div class="unit-compare-label"><strong>'+esc(row.label)+'</strong><span>'+row.count+' kết quả</span></div><div class="unit-compare-bar"><div class="bar-track"><div class="bar-fill '+tone+'" style="width:'+(row.quality*10)+'%"></div></div></div><strong class="unit-quality">'+displayQuality.toFixed(1)+'</strong><span class="unit-complexity">PT '+row.complexityAvg.toFixed(1)+'</span></div>';
  }
  return '<div class="unit-comparison-grid '+(groups.length===1?'is-single':'')+'" role="group" aria-label="So sánh chất lượng giữa các đơn vị">'+groups.map(function(g){
    return '<section class="unit-comparison-group '+g.tone+'"><div class="unit-group-header"><div><span class="unit-group-stripe"></span><h3>'+g.title+'</h3></div><strong>'+g.rows.length+' đơn vị</strong></div><div class="unit-column-labels"><span>Đơn vị</span><span>Chất lượng</span><span>Điểm</span><span>Phức tạp</span></div><div class="unit-compare-list">'+g.rows.map(renderRow).join('')+'</div></section>';
  }).join('')+'</div><div class="chart-legend"><span><i class="legend-swatch swatch-green"></i>Chất lượng từ 8</span><span><i class="legend-swatch swatch-blue"></i>Từ 6,5 đến dưới 8</span><span><i class="legend-swatch swatch-gold"></i>Dưới 6,5</span><span>PT = độ phức tạp bình quân</span></div>';
}

function comparisonBarChartHtml(rows,limit){
  if(!rows.length)return '<div class="empty-state"><strong>Chưa có dữ liệu được xác nhận</strong><span>Hãy chọn phạm vi khác hoặc duyệt thêm nhật ký.</span></div>';
  var isUnitComparison=rows.every(function(row){return !!unitById(row.id)});
  if(isUnitComparison)return groupedUnitComparisonChartHtml(rows);
  var sorted=rows.slice().sort(function(a,b){return (b.quality-a.quality)||(b.complexityAvg-a.complexityAvg)});
  var visibleRows=limit===Infinity?sorted:sorted.slice(0,limit);
  return '<div class="comparison-chart"><div class="comparison-head"><span>Đối tượng</span><span>Chất lượng</span><span>Phức tạp</span></div>'+visibleRows.map(function(row){
    var tone=row.quality>=8?'green':row.quality>=6.5?'blue':'gold';
    return '<div class="comparison-row"><div class="comparison-label"><strong>'+esc(row.label)+'</strong><span>'+(row.sublabel?esc(row.sublabel)+' · ':'')+row.count+' kết quả'+(row.people>1?' · '+row.people+' người':'')+'</span></div><div class="comparison-score"><div class="bar-track"><div class="bar-fill '+tone+'" style="width:'+(row.quality*10)+'%"></div></div><strong>'+row.quality.toFixed(1)+'</strong></div><span class="complexity-chip">'+row.complexityAvg.toFixed(1)+'</span></div>';
  }).join('')+'</div>'+(sorted.length>visibleRows.length?'<p class="comparison-limit-note">Đang hiển thị '+limit+' cá nhân có chất lượng cao nhất trong phạm vi đã chọn. Chọn một đơn vị để xem danh sách tập trung hơn.</p>':'')+'<div class="chart-legend"><span><i class="legend-swatch swatch-green"></i>Chất lượng từ 8</span><span><i class="legend-swatch swatch-blue"></i>Từ 6,5 đến dưới 8</span><span><i class="legend-swatch swatch-gold"></i>Dưới 6,5</span></div>';
}

function summaryTableHtml(rows,isUnit,people){
  if(!rows.length)return '<div class="empty-state"><strong>Chưa có dữ liệu</strong><span>Không có kết quả phù hợp với phạm vi đã chọn.</span></div>';
  var key=DASHBOARD_SORT.key,direction=DASHBOARD_SORT.direction;
  function valueOf(row){return key==='highQualityRate'?(row.highQuality/row.count):row[key]}
  var sortedRows=rows.slice().sort(function(a,b){
    var diff=valueOf(a)-valueOf(b);
    return (direction==='asc'?diff:-diff)||a.label.localeCompare(b.label,'vi');
  });
  function sortableHeader(label,sortKey){
    var active=key===sortKey;
    var symbol=active?(direction==='asc'?'↑':'↓'):'↕';
    var ariaSort=active?(direction==='asc'?'ascending':'descending'):'none';
    var hint=active?('Đang sắp xếp '+(direction==='asc'?'tăng dần':'giảm dần')):'Nhấn để sắp xếp giảm dần';
    return '<th class="numeric sortable-column" aria-sort="'+ariaSort+'"><button type="button" class="sort-button '+(active?'is-active':'')+'" data-summary-sort="'+sortKey+'" title="'+hint+'"><span>'+label+'</span><span class="sort-indicator" aria-hidden="true">'+symbol+'</span></button></th>';
  }
  function personById(id){return people.find(function(p){return p.id===id})}
  var clickable=isLeader();
  return '<div class="table-sort-help">Chọn tên cột để sắp xếp · nhấn lần nữa để đổi chiều'+(clickable?' · Nhấn 1 dòng để xem nhật ký công tác':'')+'</div><div class="table-wrap"><table><thead><tr><th>'+(isUnit?'Đơn vị':'Cán bộ')+'</th>'+sortableHeader('Kết quả','count')+sortableHeader('Tỷ lệ đã chấm điểm','reviewedRate')+sortableHeader('Phức tạp BQ','complexityAvg')+sortableHeader('Chất lượng','quality')+sortableHeader('Tỷ lệ ≥ 8','highQualityRate')+'</tr></thead><tbody>'+sortedRows.map(function(row){
    var firstCell;
    if(isUnit){firstCell='<strong>'+esc(row.label)+'</strong><br><span class="metric-context">'+row.people+' người</span>'}
    else{var p=personById(row.id);firstCell='<div class="person-cell"><span class="mini-avatar">'+esc(p&&p.initials?p.initials:'')+'</span><div><strong>'+esc(row.label)+'</strong><span>'+esc(row.sublabel)+'</span></div></div>'}
    var rowAttr=clickable?(isUnit?' class="summary-row-clickable" data-summary-unit="'+esc(row.id)+'"':' class="summary-row-clickable" data-summary-person="'+esc(row.id)+'"'):'';
    return '<tr'+rowAttr+'><td>'+firstCell+'</td><td class="numeric">'+row.count+'</td><td class="numeric">'+row.reviewedRate.toFixed(0)+'%</td><td class="numeric">'+row.complexityAvg.toFixed(1)+'</td><td class="numeric"><span class="score-pill '+scoreClassOf(row.quality)+'">'+row.quality.toFixed(1)+'</span></td><td class="numeric">'+(row.highQuality/row.count*100).toFixed(0)+'%</td></tr>';
  }).join('')+'</tbody></table></div>';
}

async function rd(){
  var provinceScope=['province_head','province_deputy','administrator'].indexOf(U.rl)>=0;
  var titleMap={province_head:'Tổng quan toàn tỉnh',province_deputy:'Các đơn vị được phân công',administrator:'Tổng quan hệ thống',staff:'Kết quả công tác của tôi',support_staff:'Kết quả công tác của tôi'};
  $('pageEyebrow').textContent='BÁO CÁO ĐIỀU HÀNH';
  $('pageTitle').textContent=titleMap[U.rl]||('Tổng quan '+unitShort(U.uid));
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';

  var people;
  try{
    DASHBOARD_LOGS=await fetchDashboardLogs();
    people=await fetchDashboardScopeProfiles();
  }catch(e){$('appView').innerHTML='<div class="empty-state"><strong>Không tải được dữ liệu</strong><span>'+esc(e.message)+'</span></div>';return}
  DASHBOARD_PEOPLE=people;

  var scope=dashboardLogsFiltered(false);
  var reviewed=scope.filter(function(l){return l.status==='approved'||l.status==='revision'});
  var approved=scope.filter(function(l){return l.status==='approved'});
  var trendScope=dashboardLogsFiltered(true).filter(function(l){return l.status==='approved'});
  var complexityAvg=average(approved.map(function(l){return l.complexity_score}).filter(function(v){return Number.isFinite(v)}));
  var quality=weightedQualitySnake(approved);
  var reviewRate=scope.length?reviewed.length/scope.length*100:0;

  var availableUnits=dashboardAvailableUnits();
  var unitFilterHtml=provinceScope?('<label class="filter-field"><span>Đơn vị</span><select id="dashboardUnitFilter"><option value="all">Tất cả đơn vị</option>'+availableUnits.map(function(u){return '<option value="'+u.id+'" '+(DASHBOARD_UNIT_FILTER===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select></label>'):'';

  var grouping=provinceScope?aggregateByUnit(approved,people,scope):aggregateByUser(approved,people,U.uid,scope);
  var comparisonMode=provinceScope?DASHBOARD_COMPARISON_MODE:'person';
  var personUnitId=DASHBOARD_PERSON_UNIT==='all'?null:DASHBOARD_PERSON_UNIT;
  var personalGrouping=aggregateVisibleUsers(approved,people,personUnitId,scope);
  var comparisonGrouping=comparisonMode==='person'?personalGrouping:grouping;
  var tableTitle=provinceScope?'Kết quả theo đơn vị':'Kết quả theo cán bộ';

  var h='<div class="toolbar dashboard-toolbar">'
    +'<label class="filter-field"><span>Kỳ báo cáo</span><select id="dashboardPeriodFilter">'
    +'<option value="month" '+(DASHBOARD_PERIOD==='month'?'selected':'')+'>'+esc(periodLabel(ymStr(new Date().getFullYear(),new Date().getMonth())))+'</option>'
    +'<option value="quarter" '+(DASHBOARD_PERIOD==='quarter'?'selected':'')+'>Quý này</option>'
    +'<option value="all" '+(DASHBOARD_PERIOD==='all'?'selected':'')+'>6 tháng gần nhất</option>'
    +'</select></label>'+unitFilterHtml+'<div class="spacer"></div></div>';

  h+='<div class="dashboard-summary-bento"><section class="dashboard-kpi-cluster" aria-label="Các chỉ số chính">'
    +compactMetric('Tổng công việc',approved.length,scope.filter(function(l){return l.status==='pending'}).length+' chờ chấm','')
    +compactMetric('Độ phức tạp',complexityAvg?complexityAvg.toFixed(1):'—','Thang 10','gold')
    +compactMetric('Chất lượng',quality?quality.toFixed(1):'—','Thang 10','green')
    +compactMetric('Đã đánh giá',reviewRate.toFixed(0)+'%',reviewed.length+'/'+scope.length,'blue')
    +'</section><section class="insight-strip dashboard-insight">'+qualityGaugeHtml(quality,scope,approved)+'</section></div>';

  h+='<div class="dashboard-grid dashboard-bento">'
    +'<section class="panel bento-tile bento-trend"><div class="panel-header"><div><h2>Xu hướng chất lượng và phức tạp 6 tháng</h2><p>Hai đường dùng chung thang điểm 1–10 · đường mảnh thể hiện chiều biến động</p></div><span class="chart-unit">Điểm</span></div>'+trendChartHtml(trendScope)+'</section>'
    +'<div class="bento-side-stack"><section class="panel bento-tile bento-distribution"><div class="panel-header"><div><h2>Phân bố chất lượng</h2><p>Nhật ký đã được đánh giá</p></div></div>'+qualityDistributionHtml(approved)+'</section>'
    +'<section class="panel bento-tile bento-progress"><div class="panel-header"><div><h2>Tiến độ đánh giá</h2><p>Tình trạng xử lý nhật ký</p></div><span class="chart-unit">'+scope.length+' nhật ký</span></div>'+reviewStatusChartHtml(scope)+'</section></div>'
    +'<section class="panel panel-wide bento-tile bento-category"><div class="panel-header"><div><h2>Phân bổ theo lĩnh vực công tác</h2><p>Khối lượng, tỷ trọng và kết quả đánh giá theo nhóm lĩnh vực trong kỳ</p></div><span class="chart-unit">'+scope.length+' nhật ký</span></div>'+workCategoryStatsHtml(scope)+'</section>'
    +'<section class="panel bento-tile bento-comparison"><div class="panel-header"><div><h2>So sánh chất lượng '+(comparisonMode==='unit'?'theo đơn vị':'theo cá nhân')+'</h2><p>'+(comparisonMode==='unit'?'Hai nhóm đơn vị trên cùng thang điểm':'Xếp theo chất lượng; luôn đọc cùng điểm phức tạp và số kết quả')+'</p></div><div class="comparison-controls">'
    +(provinceScope?('<select id="comparisonMode" aria-label="Chọn cách so sánh"><option value="unit" '+(comparisonMode==='unit'?'selected':'')+'>Theo đơn vị</option><option value="person" '+(comparisonMode==='person'?'selected':'')+'>Theo cá nhân</option></select>'):'')
    +(provinceScope&&comparisonMode==='person'?('<select id="comparisonPersonUnit" aria-label="Lọc đơn vị khi so sánh cá nhân"><option value="all">Tất cả đơn vị</option>'+availableUnits.map(function(u){return '<option value="'+u.id+'" '+(DASHBOARD_PERSON_UNIT===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select>'):'')
    +'</div></div>'+comparisonBarChartHtml(comparisonGrouping,comparisonMode==='person'?12:Infinity)+'</section>'
    +'<section class="panel panel-wide bento-tile bento-summary"><div class="panel-header"><div><h2>'+tableTitle+'</h2><p>Khối lượng, độ phức tạp và chất lượng trong kỳ</p></div></div><div id="summaryTableSlot">'+summaryTableHtml(grouping,provinceScope,people)+'</div></section>'
    +'</div>';

  $('appView').innerHTML=h;

  var periodSel=$('dashboardPeriodFilter');if(periodSel)periodSel.addEventListener('change',function(e){DASHBOARD_PERIOD=e.target.value;saveFilterPrefs({dashboardPeriod:DASHBOARD_PERIOD});rd()});
  var unitSel=$('dashboardUnitFilter');if(unitSel)unitSel.addEventListener('change',function(e){DASHBOARD_UNIT_FILTER=e.target.value;saveFilterPrefs({dashboardUnit:DASHBOARD_UNIT_FILTER});rd()});
  var cmpSel=$('comparisonMode');if(cmpSel)cmpSel.addEventListener('change',function(e){DASHBOARD_COMPARISON_MODE=e.target.value;saveFilterPrefs({dashboardComparisonMode:DASHBOARD_COMPARISON_MODE});rd()});
  var cmpPersonSel=$('comparisonPersonUnit');if(cmpPersonSel)cmpPersonSel.addEventListener('change',function(e){DASHBOARD_PERSON_UNIT=e.target.value;saveFilterPrefs({dashboardPersonUnit:DASHBOARD_PERSON_UNIT});rd()});

  // Doi sap xep chi la doi thu tu hien 1 mang da co san trong bo nho
  // (khong doi du lieu) - dung ve rieng lai bang, KHONG goi lai rd() (se
  // tai lai toan bo dashboard tu mang, xoa trang man hinh khong can thiet).
  function bindSummaryTableEvents(){
    document.querySelectorAll('[data-summary-sort]').forEach(function(b){b.addEventListener('click',function(){
      var key=b.dataset.summarySort;
      DASHBOARD_SORT={key:key,direction:(DASHBOARD_SORT.key===key&&DASHBOARD_SORT.direction==='desc')?'asc':'desc'};
      var slot=$('summaryTableSlot');
      if(slot)slot.innerHTML=summaryTableHtml(grouping,provinceScope,people);
      bindSummaryTableEvents();
    })});
    document.querySelectorAll('[data-summary-unit]').forEach(function(tr){tr.addEventListener('click',function(e){
      if(e.target.closest('[data-summary-sort]'))return;
      UJ_UNIT_FILTER=tr.dataset.summaryUnit;UJ_SELECTED_PERSON_ID=null;UJ_MODE='person';
      setView('unitJournal');render();
    })});
    document.querySelectorAll('[data-summary-person]').forEach(function(tr){tr.addEventListener('click',function(e){
      if(e.target.closest('[data-summary-sort]'))return;
      UJ_SELECTED_PERSON_ID=tr.dataset.summaryPerson;UJ_MODE='person';
      setView('unitJournal');render();
    })});
  }
  bindSummaryTableEvents();
}

var JOURNAL_STATUS_FILTER='all',JOURNAL_SEARCH='';

async function rj(){
  $('pageEyebrow').textContent='NHẬT KÝ';$('pageTitle').textContent='Nhật ký công tác';
  if(U.rl==='administrator'){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  try{
    var r=await fetch(API+'work_logs?author_id=eq.'+U.id+'&deleted_at=is.null&order=log_date.desc,created_at.desc&select=*,submitted_to:submitted_to_id(full_name),reviewer:reviewer_id(full_name)',{headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    LOGS=await r.json();
    // De biet nhat ky nao TUNG bi lanh dao cap tren dieu chinh diem sau khi
    // da duyet (khong chi lan cham dau) - dem so dong work_log_reviews,
    // giong het cach fetchUnitJournalLogs() lam cho man hinh cua lanh dao,
    // de chinh chu nhan (can bo/KSV) cung xem duoc ai vua sua + vi sao.
    var approvedIds=LOGS.filter(function(l){return l.status==='approved'}).map(function(l){return l.id});
    if(approvedIds.length){
      try{
        var rr=await fetch(API+'work_log_reviews?log_id=in.('+approvedIds.join(',')+')&select=log_id',{headers:authHeaders()});
        var reviewRows=rr.ok?await rr.json():[];
        var counts={};
        reviewRows.forEach(function(row){counts[row.log_id]=(counts[row.log_id]||0)+1});
        LOGS.forEach(function(l){l._reviewCount=counts[l.id]||0});
      }catch(e){}
    }
  }catch(e){
    $('appView').innerHTML='<div class="empty-state"><strong>Không tải được nhật ký</strong><span>'+esc(e.message)+'</span></div>';
    return;
  }
  renderJournalList();
}

function renderJournalList(){
  var pendingCount=LOGS.filter(function(l){return l.status==='pending'}).length;
  var revisionCount=LOGS.filter(function(l){return l.status==='revision'}).length;
  var filtered=LOGS.filter(function(l){
    if(JOURNAL_STATUS_FILTER!=='all'&&l.status!==JOURNAL_STATUS_FILTER)return false;
    if(JOURNAL_SEARCH){
      var q=JOURNAL_SEARCH.normalize('NFC').toLowerCase();
      var hay=((l.title||'')+' '+(l.result||'')).normalize('NFC').toLowerCase();
      if(hay.indexOf(q)<0)return false;
    }
    return true;
  });
  var noJournalToday=!LOGS.some(function(l){return l.log_date===todayStr()});
  var h=noJournalToday?'<div class="demo-notice journal-reminder-notice"><strong>Nhắc nhở</strong><span>Hôm nay bạn chưa ghi nhật ký công tác. Hãy ghi lại kết quả trong ngày để không bỏ sót khi chấm điểm cuối tháng.</span></div>':'';
  h+='<div class="journal-header"><div><h2>'+esc(U.n)+'</h2><p>'+esc(U.tl||'')+'</p></div><div class="journal-header-actions"><button class="button button-secondary" id="nl">+ Ghi nghỉ phép</button><button class="button button-primary" id="nj">+ Ghi nhật ký mới</button></div></div>';
  h+='<div class="metric-grid journal-stats-row">'
    +metricCard('Nhật ký đã gửi',LOGS.length,'Tổng số đã ghi','')
    +metricCard('Đã xác nhận',LOGS.filter(function(l){return l.status==='approved'}).length,'Kết quả được công nhận','green')
    +metricCard('Cần xử lý',pendingCount+revisionCount,pendingCount+' chờ đánh giá · '+revisionCount+' cần bổ sung','gold')
    +'</div>';
  h+='<div class="toolbar"><label class="filter-field"><span>Trạng thái</span><select id="journalStatusFilter">'
    +'<option value="all" '+(JOURNAL_STATUS_FILTER==='all'?'selected':'')+'>Tất cả</option>'
    +'<option value="pending" '+(JOURNAL_STATUS_FILTER==='pending'?'selected':'')+'>Chờ đánh giá</option>'
    +'<option value="approved" '+(JOURNAL_STATUS_FILTER==='approved'?'selected':'')+'>Đã xác nhận</option>'
    +'<option value="revision" '+(JOURNAL_STATUS_FILTER==='revision'?'selected':'')+'>Cần bổ sung</option>'
    +'</select></label><label class="field"><span>Tìm theo nội dung</span><input type="text" id="journalSearchInput" value="'+esc(JOURNAL_SEARCH)+'" placeholder="Nhập từ khoá..."></label></div>';
  h+='<div class="journal-list">'+(filtered.length?filtered.map(function(l){return journalCardHtml(l)}).join(''):'<div class="empty-state"><strong>Không có nhật ký phù hợp</strong><span>Thử đổi bộ lọc hoặc ghi nhật ký mới.</span></div>')+'</div>';
  $('appView').innerHTML=h;
  $('nj').onclick=function(){oj()};
  $('nl').onclick=function(){ol()};
  document.querySelectorAll('[data-edit-journal]').forEach(function(b){b.addEventListener('click',function(){oj(b.dataset.editJournal)})});
  document.querySelectorAll('[data-delete-log]').forEach(function(b){b.addEventListener('click',function(){handleDeleteLogClick(b)})});
  $('journalStatusFilter').addEventListener('change',function(e){JOURNAL_STATUS_FILTER=e.target.value;renderJournalList()});
  var searchInput=$('journalSearchInput');
  searchInput.addEventListener('input',function(e){
    JOURNAL_SEARCH=e.target.value;
    var focusPos=searchInput.selectionStart;
    renderJournalList();
    var newInput=$('journalSearchInput');
    newInput.focus();
    newInput.setSelectionRange(focusPos,focusPos);
  });
}

function metricCard(label,value,context,tone){return '<article class="metric-card '+(tone||'')+'"><span class="metric-label">'+esc(label)+'</span><div class="metric-value">'+value+'</div><span class="metric-context">'+esc(context)+'</span></article>'}

function journalCardHtml(log,opts){
  opts=opts||{};
  // Sua duoc ca khi "Cho danh gia" (chua ai cham) lan "Can bo sung" (bi
  // tra lai) - khop dung pham vi RLS UPDATE da cho phep san o server
  // (work_logs_update_own: status IN ('pending','revision')), truoc day
  // client chi cho sua khi "Can bo sung", nguoi dung muon sua 1 nhat ky
  // con dang cho duyet phai xoa roi ghi lai tu dau - khong can thiet.
  var canEdit=(log.status==='revision'||log.status==='pending')&&!opts.readOnly;
  // Tu xoa: chi chinh tac gia, chi khi con "cho duyet"/"can bo sung" (da
  // duyet roi coi la du lieu chinh thuc, phai qua lanh dao). Lanh dao xoa
  // ho cap duoi (opts.canDelete, tinh o ujDateGroupHtml theo dung pham vi
  // can_review_log) thi khong gioi han trang thai.
  var canDeleteSelf=!opts.readOnly&&(log.status==='pending'||log.status==='revision');
  var canDelete=opts.canDelete||canDeleteSelf;
  // Ten lanh dao da/dang xu ly (neu co) lay tu opts (ruj - tra cuu qua
  // UJ_PEOPLE) hoac tu log.reviewer (join san o fetchUnitJournalLogs/rj) -
  // dung 1 nguon cho ca "Nhat ky cua toi" lan "Nhat ky cong tac cua don
  // vi". Tinh TRUOC revisionFeedback/leaderComment vi ca 2 deu can dung.
  var reviewerName=opts.reviewerName||(log.reviewer&&log.reviewer.full_name)||'';
  // Ghi ro AI da yeu cau bo sung (truoc day chi hien noi dung, khong biet
  // lanh dao nao) - dung chung 1 nguon reviewerName voi "Nhan xet cua lanh
  // dao" ben duoi, vi reviewer_id van duoc giu lai tren dong "revision"
  // (xem reject_work_log, migration 00031).
  var revisionFeedback=log.status==='revision'?('<div class="revision-feedback"><strong>Lãnh đạo yêu cầu bổ sung'+(reviewerName?(' · '+esc(reviewerName)):'')+'</strong><span>'+esc(log.review_comment||'Cần chỉnh sửa, làm rõ kết quả công tác.')+'</span></div>'):'';
  var resubmission=log.revision_count?'<span class="meta-tag">Đã trình lại '+log.revision_count+' lần</span>':'';
  var isOverridden=log.status==='approved'&&(log._reviewCount||0)>=2;
  var overriddenTag=isOverridden?'<span class="meta-tag meta-tag-warning">Điểm đã được lãnh đạo cấp trên điều chỉnh</span>':'';
  // Nhan xet cua lanh dao (neu co) hien luon kem nhat ky da xac nhan + cham
  // diem - khong chi rieng khi bi dieu chinh lai (truoc day chi hien trong
  // truong hop do).
  var leaderComment=(log.status==='approved'&&(log.review_comment||'').trim())?'<div class="leader-comment"><strong>Nhận xét của lãnh đạo'+(reviewerName?(' · '+esc(reviewerName)):'')+'</strong><span>'+esc(log.review_comment)+'</span></div>':'';
  var authorTag=opts.authorName?(opts.authorId?'<button type="button" class="meta-tag journal-author-tag" data-uj-jump-person="'+esc(opts.authorId)+'">'+esc(opts.authorName)+'</button>':'<span class="meta-tag journal-author-tag">'+esc(opts.authorName)+'</span>'):'';
  var submittedToName=opts.submittedToName||(log.submitted_to&&log.submitted_to.full_name)||null;
  // Kem theo THOI DIEM nop (gio:phut that, dung submittedAtOf() - tinh
  // theo lan trinh lai gan nhat neu co, giong het cach da lam o khu "Dang
  // cho nguoi khac xu ly" cua man Duyet & cham diem) de lanh dao biet
  // nop luc nao, khong chi nop cho ai.
  var submittedToTag=submittedToName?('<span class="meta-tag">Nộp cho: '+esc(submittedToName)+' · '+esc(shortDateTime(submittedAtOf(log)))+'</span>'):'';
  var cloneTag=log.is_clone?'<span class="meta-tag">Tự động ghi nhận (công việc nhiều ngày)</span>':'';
  // Diem tu cham - hien ngay tren dong tag de de doi chieu voi diem chinh
  // thuc (o khoi "journal-scores" ben phai) ma khong can mo chi tiet (yeu
  // cau nguoi dung, 2026-09-10).
  var selfScoreTag=(log.self_complexity_score!=null&&log.self_quality_score!=null)?('<span class="meta-tag">Tự chấm: Phức tạp '+log.self_complexity_score+' · Chất lượng '+log.self_quality_score+'</span>'):'';
  return '<article class="journal-card '+(log.status==='revision'?'is-revision':'')+'">'
    +'<div class="journal-date"><strong>'+shortDate(log.log_date)+'</strong>'+(log.log_date||'').slice(0,4)+'</div>'
    +'<div class="journal-body"><h3>'+esc(log.title)+'</h3><p>'+esc(log.result)+'</p>'+revisionFeedback+leaderComment
    +'<div class="journal-meta">'+authorTag+'<span class="meta-tag">'+esc(catName(log.category_id))+'</span><span class="meta-tag">'+esc(WORK_ROLE_LABEL[log.work_role]||log.work_role)+'</span><span class="meta-tag">'+esc(DURATION_LABEL[log.duration]||log.duration)+'</span>'+selfScoreTag+submittedToTag+cloneTag+resubmission+overriddenTag+'<span class="status-pill '+(STATUS_CLASS[log.status]||'')+'">'+(STATUS_LABEL[log.status]||log.status)+'</span></div></div>'
    +'<div class="journal-side"><div class="journal-scores"><div class="score-box"><span>Phức tạp</span><strong>'+(log.complexity_score==null?'—':log.complexity_score)+'</strong></div><div class="score-box"><span>Chất lượng</span><strong>'+(log.quality_score==null?'—':log.quality_score)+'</strong></div></div>'
    +(canEdit?'<button type="button" class="button button-primary button-small" data-edit-journal="'+log.id+'">'+(log.status==='revision'?'Sửa và trình lại':'Sửa')+'</button>':'')
    +(opts.canOverride?'<button type="button" class="button button-secondary button-small" data-override-score="'+log.id+'">Điều chỉnh điểm</button><button type="button" class="button button-secondary button-small" data-return-rescoring="'+log.id+'">Trả để chấm điểm lại</button>':'')
    +(opts.canReviseOwn?'<button type="button" class="button button-secondary button-small" data-revise-own-score="'+log.id+'">Sửa điểm đã chấm</button>':'')
    +(canDelete?'<button type="button" class="button button-danger button-small" data-delete-log="'+log.id+'" data-delete-self="'+(canDeleteSelf&&!opts.canDelete?'1':'0')+'">Xoá</button>':'')+'</div></article>';
}

async function oj(logId,presetTaskId,presetNoteId,presetContent){
  if(!requireActive())return;
  var form=$('journalForm');form.reset();
  JOURNAL_SOURCE_NOTE_ID=null;
  var log=logId?LOGS.find(function(l){return l.id===logId}):null;
  // Sua duoc ca khi con "Cho danh gia" (chua ai cham) lan "Can bo sung"
  // (bi tra lai) - xem chu thich o journalCardHtml. isRevision rieng vi
  // chi trang thai nay moi thuc su co "yeu cau cua lanh dao" de hien.
  var canEdit=Boolean(log&&(log.status==='revision'||log.status==='pending'));
  var isRevision=Boolean(log&&log.status==='revision');
  EDITING_ID=canEdit?log.id:null;
  $('journalModalTitle').textContent=isRevision?'Chỉnh sửa và trình lại kết quả':(canEdit?'Chỉnh sửa nhật ký':'Ghi nhận kết quả công việc');
  $('journalSubmitButton').textContent=isRevision?'Lưu và trình lại':(canEdit?'Lưu thay đổi':'Gửi nhật ký');
  var notice=$('journalRevisionNotice');
  notice.hidden=!isRevision;
  // Ghi ro AI (lanh dao nao) da yeu cau bo sung, khong chi hien noi dung -
  // dung log.reviewer da join san o fetch LOGS (rj()).
  var revisionReviewerName=(isRevision&&log.reviewer&&log.reviewer.full_name)||'';
  $('journalRevisionTitle').textContent='Yêu cầu của lãnh đạo'+(revisionReviewerName?(' · '+revisionReviewerName):'');
  $('journalRevisionComment').textContent=isRevision?(log.review_comment||''):'';
  populateCategorySelect();
  if(canEdit){
    $('journalWorkDateField').innerHTML=dateOnlyFieldHtml('journalWorkDate',log.log_date);
    form.elements.category.value=log.category_id;
    form.elements.title.value=log.title;
    form.elements.result.value=log.result;
    form.elements.workRole.value=log.work_role;
    form.elements.duration.value=log.duration;
    form.elements.evidence.value=log.evidence||'';
    form.elements.selfComplexity.value=log.self_complexity_score||'';
    form.elements.selfQuality.value=log.self_quality_score||'';
    $('journalRangeStartDateField').innerHTML=dateOnlyFieldHtml('journalRangeStartDate',log.range_start_date||null);
  }else{
    $('journalWorkDateField').innerHTML=dateOnlyFieldHtml('journalWorkDate',todayStr());
    $('journalRangeStartDateField').innerHTML=dateOnlyFieldHtml('journalRangeStartDate',null);
    // Mo tu 1 ghi chu ca nhan ("Ghi nhat ky cho viec nay") - dien san Noi
    // dung/Ket qua tu tieu de/noi dung ghi chu, cac muc con lai de trong
    // nhu ghi nhat ky moi binh thuong. Tim trong NOTES_CACHE (da tai san
    // co san khi dang o man "Ghi chu cong viec"), khong fetch lai.
    if(presetNoteId){
      var srcNote=(NOTES_CACHE||[]).find(function(n){return n.id===presetNoteId});
      if(srcNote){
        form.elements.title.value=srcNote.title||'';
        form.elements.result.value=srcNote.content||'';
        JOURNAL_SOURCE_NOTE_ID=presetNoteId;
      }
    }
    // Mo tu "Giao viec va ghi nhat ky" - dien san linh vuc/tieu de/ket qua
    // the hien vua giao viec gi cho ai, van phai tu xem lai/sua truoc khi
    // gui (khong khoa, khong tu dong gui).
    if(presetContent){
      if(presetContent.categoryId)form.elements.category.value=presetContent.categoryId;
      if(presetContent.title)form.elements.title.value=presetContent.title;
      if(presetContent.result)form.elements.result.value=presetContent.result;
    }
    // Khoi phuc nhap dang go do (neu co) - chi khi tao MOI thuc su (khong
    // phai dang gan san 1 viec duoc giao, 1 ghi chu, hay 1 lan giao viec,
    // tranh de nham noi dung cu).
    if(!presetTaskId&&!presetNoteId&&!presetContent){
      var draft=loadJournalDraft();
      if(draft){
        if(draft.category)form.elements.category.value=draft.category;
        form.elements.title.value=draft.title||'';
        form.elements.result.value=draft.result||'';
        if(draft.workRole)form.elements.workRole.value=draft.workRole;
        if(draft.duration)form.elements.duration.value=draft.duration;
        form.elements.evidence.value=draft.evidence||'';
        if(draft.selfComplexity)form.elements.selfComplexity.value=draft.selfComplexity;
        if(draft.selfQuality)form.elements.selfQuality.value=draft.selfQuality;
        if(draft.workDate)$('journalWorkDateField').innerHTML=dateOnlyFieldHtml('journalWorkDate',draft.workDate);
        if(draft.rangeStartDate)$('journalRangeStartDateField').innerHTML=dateOnlyFieldHtml('journalRangeStartDate',draft.rangeStartDate);
        showToast('Đã khôi phục nội dung nháp trước đó.');
      }
    }
  }
  syncJournalCategoryDisplay();
  // Neu da co san Linh vuc cong tac (dang sua nhat ky cu, hoac tu preset/nhap nhap con luu) thi
  // hien lai tren nut - khong dua ve nhan mac dinh (se lam mat thong tin da khoa).
  (function(){
    var currentCategoryId=form.elements.category.value;
    setKpiCatalogPickedLabel(currentCategoryId?{ma:null,ten:catName(currentCategoryId),doPhucTap:null}:null);
  })();
  kpiComplexityFromCatalog=false; // moi mo modal (sua nhat ky cu/tao moi) - luon bat dau bang loi giai thich day du
  setVisible($('copyJournalBlock'),!canEdit);
  $('copyJournalPanel').hidden=true;
  $('copyJournalSearch').value='';
  renderCopyJournalList('');
  $('kpiCatalogPanel').hidden=true;
  $('kpiCatalogSearch').value='';
  renderKpiCatalogList('');
  await refreshJournalSubmitToOptions(canEdit?log:null);
  await refreshJournalTaskOptions(canEdit?log:null,presetTaskId);
  toggleJournalRangeField();
  checkJournalDateWarning();
  updateSelfScoreGuide('Complexity',form.elements.selfComplexity.value);
  updateSelfScoreGuide('Quality',form.elements.selfQuality.value);
  $('journalModal').hidden=false;document.body.style.overflow='hidden';
  (canEdit?form.elements.title:$('toggleKpiCatalog')).focus();
  if(!canEdit)bindJournalDraftAutosave();
}
function cj(){$('journalModal').hidden=true;document.body.style.overflow='';EDITING_ID=null;JOURNAL_SOURCE_NOTE_ID=null}

// Tu luu nhap noi dung dang go trong form tao nhat ky MOI (khong ap dung
// khi dang sua/trinh lai, vi du lieu do da la that) - phong khi lo tat
// tab/mat mang giua chung, khong mat trang noi dung da go.
var JOURNAL_DRAFT_KEY='qlcv_journal_draft';
function loadJournalDraft(){try{return JSON.parse(localStorage.getItem(JOURNAL_DRAFT_KEY))}catch(e){return null}}
function clearJournalDraft(){localStorage.removeItem(JOURNAL_DRAFT_KEY)}
function saveJournalDraft(){
  if(EDITING_ID)return;
  var f=$('journalForm');if(!f)return;
  var draft={
    workDate:readDateOnly('journalWorkDate',null)||'',category:f.elements.category.value,title:f.elements.title.value,
    result:f.elements.result.value,workRole:f.elements.workRole.value,duration:f.elements.duration.value,
    evidence:f.elements.evidence.value,selfComplexity:f.elements.selfComplexity.value,selfQuality:f.elements.selfQuality.value,
    rangeStartDate:readDateOnly('journalRangeStartDate',null)||''
  };
  if(!draft.title&&!draft.result){clearJournalDraft();return}
  try{localStorage.setItem(JOURNAL_DRAFT_KEY,JSON.stringify(draft))}catch(e){}
}
var JOURNAL_DRAFT_BOUND=false;
function bindJournalDraftAutosave(){
  if(JOURNAL_DRAFT_BOUND)return;
  JOURNAL_DRAFT_BOUND=true;
  $('journalForm').addEventListener('input',saveJournalDraft);
}

// Gan nhat ky voi 1 viec duoc giao (khong bat buoc) - chi cho chon khi
// TAO MOI, giong "Sao chep nhat ky cu". Danh sach chi liet ke viec dang
// "cho thuc hien" cua CHINH minh. Khi chon 1 viec, tu dong "nop" nhat ky
// cho DUNG nguoi da giao viec do (task.assigner_id) va khoa o "Nop cho
// lanh dao" lai - xem applyTaskLinkToSubmitTo().
var JOURNAL_PENDING_TASKS=[];
async function refreshJournalTaskOptions(editingLog,presetTaskId){
  var field=$('journalTaskField'),select=$('journalTaskSelect');
  if(!field||!select)return;
  if(editingLog){field.hidden=true;return}
  var pendingTasks=[];
  try{
    var r=await fetch(API+'task_assignments?assignee_id=eq.'+U.id+'&status=eq.pending&select=id,title,assigner_id',{headers:authHeaders()});
    pendingTasks=r.ok?await r.json():[];
  }catch(e){}
  JOURNAL_PENDING_TASKS=pendingTasks;
  field.hidden=pendingTasks.length===0;
  select.innerHTML='<option value="">— Không gắn với việc được giao —</option>'+pendingTasks.map(function(t){return '<option value="'+t.id+'">'+esc(t.title)+'</option>'}).join('');
  if(presetTaskId&&pendingTasks.some(function(t){return t.id===presetTaskId})){
    select.value=presetTaskId;
    var task=pendingTasks.find(function(t){return t.id===presetTaskId});
    if(task)$('journalForm').elements.title.value=task.title;
  }
  applyTaskLinkToSubmitTo();
}

// Dong bo o "Nop cho lanh dao" theo lua chon o "Gan voi viec duoc giao"
// hien tai - goi lai moi khi mo form HOAC nguoi dung tu doi lua chon o
// select viec (xem binding trong DOMContentLoaded).
function applyTaskLinkToSubmitTo(){
  var taskSelect=$('journalTaskSelect'),submitToSelect=$('journalSubmitToSelect');
  if(!taskSelect||!submitToSelect)return;
  var task=taskSelect.value?JOURNAL_PENDING_TASKS.find(function(t){return t.id===taskSelect.value}):null;
  if(task){
    submitToSelect.value=task.assigner_id;
    submitToSelect.disabled=true;
  }else{
    // Khoa lai neu chi co dung 1 lua chon hop le (vi du Pho Vien truong
    // tinh chi co dung 1 Vien truong tinh de nop) - khong de tuong nham
    // co the doi duoc trong khi thuc ra chi co 1 gia tri.
    submitToSelect.disabled=submitToSelect.options.length<=1;
  }
}

// Liet ke lanh dao truc tiep cua don vi minh (Truong phong + toan bo Pho
// phong) - cho phep cán bo/KSV tu chon nop nhat ky cho dung nguoi da
// giao viec do, thay vi gan co dinh 1 nguoi duoc uy quyen (xem canReviewLog()).
async function directLeadersFor(unitId,excludeId){
  try{
    var r=await fetch(API+'profiles?unit_id=eq.'+unitId+'&role=in.(unit_head,unit_deputy)&is_active=eq.true&select=id,full_name,role&order=full_name',{headers:authHeaders()});
    var list=r.ok?await r.json():[];
    return list.filter(function(p){return p.id!==excludeId});
  }catch(e){return []}
}

// Lanh dao cap tinh (Pho Vien truong tinh + Vien truong tinh) - Truong
// phong/Vien truong khu vuc KHONG cung unit_id voi cap tinh nen phai
// dung danh sach nay de nop len, thay vi directLeadersFor (chi tim trong
// cung don vi, se rong doi voi don vi khong co Pho phong).
async function provinceLeadersFor(excludeId){
  try{
    var r=await fetch(API+'profiles?role=in.(province_deputy,province_head)&is_active=eq.true&select=id,full_name,role&order=role,full_name',{headers:authHeaders()});
    var list=r.ok?await r.json():[];
    return list.filter(function(p){return p.id!==excludeId});
  }catch(e){return []}
}

// Dung chung cho ca form "Ghi nhat ky" (#journalSubmitToSelect) va form
// "Ghi nghi phep" (#leaveSubmitToSelect) - cung 1 quy tac chon lanh dao de
// nop, chi khac o phan tu <select> dich va gia tri co san (neu dang sua).
async function refreshSubmitToOptions(selectId,presetId){
  var select=$(selectId);
  if(!select)return;
  var leaders,fixedSingle=false;
  if(U.rl==='unit_head'){
    // Truong phong/Vien truong khu vuc/Chanh Van phong: nop len dung
    // Pho Vien truong tinh phu trach don vi minh, hoac thang len Vien
    // truong tinh - khong nop cho Pho phong cua chinh don vi minh.
    leaders=await provinceLeadersFor(U.id);
  }else if(U.rl==='province_deputy'){
    // Pho Vien truong tinh: chi co dung 1 Vien truong tinh, khong can
    // chon - tu dong gan san, khoa lai (giong kieu gan voi viec duoc giao).
    leaders=(await provinceLeadersFor(U.id)).filter(function(p){return p.role==='province_head'});
    fixedSingle=leaders.length===1;
  }else{
    leaders=await directLeadersFor(U.uid,U.id);
  }
  select.innerHTML=leaders.map(function(l){return '<option value="'+l.id+'">'+esc(l.full_name)+' · '+(ROLE_LABELS[l.role]||l.role)+'</option>'}).join('');
  // Bat buoc chon chi khi thuc su co lanh dao de chon (tranh khoa cung
  // nguoi dung khi don vi chua co Pho phong/Pho vien truong).
  select.required=leaders.length>0;
  select.disabled=fixedSingle;
  if(presetId)select.value=presetId;
  else if(fixedSingle)select.value=leaders[0].id;
}
// Vien truong tinh KHONG co ai o tren de nop/cham diem - nhat ky cua ho
// chi de tu luu lai (van co diem tu danh gia, xem sj()) - an han truong
// "Nop cho lanh dao" thay vi de trong khong dung vao dau (yeu cau nguoi
// dung, 2026-09-09).
async function refreshJournalSubmitToOptions(editingLog){
  var field=$('journalSubmitToField');
  var isProvinceHead=(U.rl==='province_head');
  if(field)field.hidden=isProvinceHead;
  if(isProvinceHead){
    var sel=$('journalSubmitToSelect');
    if(sel){sel.required=false;sel.innerHTML=''}
    return;
  }
  return refreshSubmitToOptions('journalSubmitToSelect',editingLog&&editingLog.submitted_to_id);
}

// Cho phep nhap lui ngay (khong khoa qua khu), chi canh bao nhe khi chon
// ngay qua xa - khong chan gui.
// Danh sach ngay (chuoi "YYYY-MM-DD") tu startStr den endStr, BAO GOM ca 2
// dau, DA BO thu Bay/Chu nhat - dung chung cho xem truoc o form ghi nhat
// ky VA cho luc thuc su nhan ban phia server (create_work_log_clones(),
// migration 00058) - phai giu dung 1 cach tinh de khop nhau.
function weekdayDatesBetween(startStr,endStr){
  var out=[];
  if(!startStr||!endStr)return out;
  var cur=new Date(startStr+'T00:00:00'),end=new Date(endStr+'T00:00:00');
  if(cur>end)return out;
  while(cur<=end){
    var day=cur.getDay(); // 0=CN,6=T7
    if(day!==0&&day!==6)out.push(ymdStr(cur.getFullYear(),cur.getMonth(),cur.getDate()));
    cur.setDate(cur.getDate()+1);
  }
  return out;
}

function toggleJournalRangeField(){
  var field=$('journalRangeStartField'),select=$('journalForm').elements.duration;
  if(!field||!select)return;
  var isMultiDay=select.value==='nhieu_ngay';
  field.hidden=!isMultiDay;
  if(!isMultiDay){$('journalRangeStartDateField').innerHTML=dateOnlyFieldHtml('journalRangeStartDate',null);$('journalRangePreview').textContent=''}
  else updateJournalRangePreview();
}

function updateJournalRangePreview(){
  var preview=$('journalRangePreview');if(!preview)return;
  var startStr=readDateOnly('journalRangeStartDate',null)||'',endStr=readDateOnly('journalWorkDate',null)||'';
  if(!startStr||!endStr){preview.textContent='Chọn đủ "Bắt đầu từ ngày" và "Ngày thực hiện" để xem trước.';return}
  var days=weekdayDatesBetween(startStr,endStr);
  if(!days.length){preview.textContent='Khoảng ngày không hợp lệ (ngày bắt đầu phải trước hoặc bằng ngày thực hiện).';return}
  preview.textContent='Sẽ ghi nhận cho '+days.length+' ngày (đã bỏ thứ Bảy/Chủ nhật): '+days.map(function(d){return shortDate(d)}).join(', ');
}

// Goi y muc diem (dung chung du lieu/cach phan muc voi man hinh duyet cua
// lanh dao - scoringGuide()) ngay tai o "Tu danh gia" khi ghi nhat ky, de
// KSV tu cham co can cu tham khao, khong chi lanh dao moi thay goi y nay.
// true khi gia tri Do phuc tap dang hien la GOI Y vua ap dung tu danh muc KPI Toi cao (chua bi
// nguoi dung tu sua lai) - luc do khong nhac lai loi giai thich chung chung nua vi thong tin da
// nam san o nut "Dau viec tham khao..." ben tren; nguoi dung tu go lai gia tri (input that, khong
// phai gan .value bang JS) se tu dong tat co nay va tro ve loi giai thich day du nhu cu.
var kpiComplexityFromCatalog=false;

function updateSelfScoreGuide(kind,value){
  var guideEl=$('self'+kind+'Guide');
  if(!guideEl)return;
  var titleEl=$('self'+kind+'GuideTitle'),textEl=$('self'+kind+'GuideText');
  if(!value){
    guideEl.removeAttribute('data-band');
    titleEl.textContent='—';
    textEl.textContent='Nhập điểm để xem gợi ý mức độ tương ứng.';
    return;
  }
  if(kind==='Complexity'&&kpiComplexityFromCatalog){
    titleEl.textContent='Mức '+value+' · Theo gợi ý danh mục KPI Tối cao';
    textEl.textContent='Đã lấy từ đầu việc tham khảo đã chọn ở trên — có thể tự sửa lại nếu thấy chưa sát thực tế.';
    guideEl.dataset.band=Number(value)<=4?'low':Number(value)<=8?'standard':'high';
    return;
  }
  var type=kind==='Complexity'?'complexity':'quality';
  var guide=scoringGuide(type,value);
  titleEl.textContent='Mức '+value+' · '+guide.title;
  textEl.textContent=guide.text+scoringGuideNote(type,value);
  guideEl.dataset.band=Number(value)<=4?'low':Number(value)<=8?'standard':'high';
}

function checkJournalDateWarning(){
  var warning=$('journalDateWarning');
  var value=readDateOnly('journalWorkDate',null)||'';
  if(!value){warning.hidden=true;return}
  var today=new Date();
  var todayStr=ymdStr(today.getFullYear(),today.getMonth(),today.getDate());
  var diffDays=Math.round((new Date(todayStr+'T00:00:00')-new Date(value+'T00:00:00'))/86400000);
  if(diffDays>14){
    warning.textContent='Bạn đang ghi nhật ký cho một ngày khá xa ('+diffDays+' ngày trước) — hãy đảm bảo đúng thực tế công việc.';
    warning.hidden=false;
  }else{
    warning.hidden=true;
  }
}

// Tim va sao chep nhat ky cu: chi hien trong form tao MOI (khong phai
// sua/trinh lai), liet ke nhat ky cua chinh nguoi dung (LOGS da la cua
// chinh U tu rj()), moi nhat truoc, loc song theo tu khoa.
function renderCopyJournalList(query){
  var q=(query||'').trim().normalize('NFC').toLowerCase();
  var mine=LOGS.filter(function(l){return !q||((l.title||'')+' '+(l.result||'')).normalize('NFC').toLowerCase().indexOf(q)>=0})
    .slice().sort(function(a,b){return (b.log_date||'').localeCompare(a.log_date||'')});
  var list=$('copyJournalList');
  list.innerHTML=mine.length?mine.slice(0,30).map(function(l){
    return '<button type="button" class="copy-journal-item" data-copy-journal="'+l.id+'"><strong>'+esc(l.title)+'</strong><span>'+shortDate(l.log_date)+' · '+esc(catName(l.category_id))+'</span></button>';
  }).join(''):'<div class="empty-state compact-empty"><strong>Không tìm thấy nhật ký phù hợp</strong></div>';
  list.querySelectorAll('[data-copy-journal]').forEach(function(b){b.addEventListener('click',function(){applyCopyJournal(b.dataset.copyJournal)})});
}

function applyCopyJournal(logId){
  var log=LOGS.find(function(l){return l.id===logId});
  if(!log)return;
  var form=$('journalForm');
  populateCategorySelect();
  form.elements.category.value=log.category_id;
  syncJournalCategoryDisplay();
  setKpiCatalogPickedLabel(log.category_id?{ma:null,ten:catName(log.category_id),doPhucTap:null}:null);
  form.elements.title.value=log.title;
  form.elements.result.value=log.result;
  form.elements.workRole.value=log.work_role;
  form.elements.duration.value=log.duration;
  form.elements.evidence.value=log.evidence||'';
  $('copyJournalPanel').hidden=true;
  showToast('Đã sao chép nội dung từ nhật ký cũ — kiểm tra lại trước khi gửi.');
}

async function sj(e){
  e.preventDefault();
  if(!requireActive())return;
  var form=e.currentTarget;
  var f=new FormData(form);
  // Doc truc tiep tu DOM (khong qua FormData) vi o nay co the bi disable
  // khi khoa theo viec duoc giao - truong "disabled" bi FormData bo qua.
  var submittedToId=form.elements.submittedToId.value||null;
  var workDate=readDateOnly('journalWorkDate','ngày thực hiện');
  if(workDate===undefined)return; // da chon 1 phan, readDateOnly da bao loi
  if(!workDate){showToast('Vui lòng chọn ngày thực hiện.');return}
  var isMultiDay=f.get('duration')==='nhieu_ngay';
  var rangeStartDate=null;
  if(isMultiDay){
    rangeStartDate=readDateOnly('journalRangeStartDate','bắt đầu từ ngày');
    if(rangeStartDate===undefined)return;
    if(!rangeStartDate){showToast('Vui lòng chọn "Bắt đầu từ ngày" cho công việc nhiều ngày.');return}
    if(rangeStartDate>workDate){showToast('"Bắt đầu từ ngày" phải trước hoặc bằng "Ngày thực hiện".');return}
  }
  var payload={
    log_date:workDate,
    category_id:f.get('category'),
    title:(f.get('title')||'').trim(),
    result:(f.get('result')||'').trim(),
    work_role:f.get('workRole'),
    duration:f.get('duration'),
    evidence:(f.get('evidence')||'').trim()||null,
    self_complexity_score:Number(f.get('selfComplexity')),
    self_quality_score:Number(f.get('selfQuality')),
    range_start_date:rangeStartDate
  };
  // Vien truong tinh khong co ai o tren de nop/cham diem - tu ghi nhan
  // luon (khong nam "Cho danh gia" mai mai vi khong ai duyet duoc), dung
  // diem tu danh gia lam diem chinh thuc luon (yeu cau nguoi dung,
  // 2026-09-09).
  var isProvinceHead=(U.rl==='province_head');
  if(isProvinceHead){
    payload.complexity_score=payload.self_complexity_score;
    payload.quality_score=payload.self_quality_score;
    payload.reviewed_at=new Date().toISOString();
  }
  if(!payload.category_id){showToast('Vui lòng chọn lĩnh vực công tác');return}
  var btn=$('journalSubmitButton');btn.disabled=true;
  try{
    if(EDITING_ID){
      var existing=LOGS.find(function(l){return l.id===EDITING_ID});
      // Chi coi la "trinh lai" (tang revision_count, xoa vet lan cham
      // truoc) khi nhat ky THUC SU dang o trang thai "Can bo sung" - sua 1
      // nhat ky con "Cho danh gia" (chua ai cham) chi la sua binh thuong,
      // khong phai trinh lai sau khi bi tra ve.
      var wasRevision=existing&&existing.status==='revision';
      // Vien truong tinh: nhat ky cu (tao truoc khi co tinh nang nay) neu
      // con "Cho danh gia" ma duoc sua lai thi cung tu duyet luon, khong de
      // "pending" mai mai (khong ai duyet duoc).
      payload.status=isProvinceHead?'approved':'pending';
      payload.submitted_to_id=isProvinceHead?null:(submittedToId||(existing?existing.submitted_to_id:null));
      if(wasRevision&&!isProvinceHead){
        payload.reviewer_id=null;payload.reviewed_at=null;payload.review_comment=null;
        payload.revision_count=(existing?existing.revision_count:0)+1;
      }
      var r=await fetch(API+'work_logs?id=eq.'+EDITING_ID,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(payload)});
      if(!r.ok)throw new Error('HTTP '+r.status);
      // Trinh lai nhat ky gan voi 1 viec duoc giao: dua task ve "reported"
      // (truoc do bi tra lai da dua ve "pending" trong reject_work_log).
      if(existing&&existing.task_assignment_id){
        try{await fetch(API+'rpc/link_task_to_log',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_task_id:existing.task_assignment_id,p_log_id:EDITING_ID})})}catch(e){}
      }
      showToast(wasRevision?'Đã chỉnh sửa và trình lại lãnh đạo chấm điểm.':'Đã lưu thay đổi nhật ký.');
    }else{
      payload.author_id=U.id;payload.unit_id=U.uid;
      payload.status=isProvinceHead?'approved':'pending';
      payload.submitted_to_id=isProvinceHead?null:submittedToId;
      var taskId=f.get('taskAssignmentId')||null;
      var r2=await fetch(API+'work_logs',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':taskId?'return=representation':'return=minimal'}),body:JSON.stringify(payload)});
      if(!r2.ok)throw new Error('HTTP '+r2.status);
      if(taskId){
        var created=(await r2.json())[0];
        if(created){
          try{await fetch(API+'rpc/link_task_to_log',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_task_id:taskId,p_log_id:created.id})})}catch(e){}
        }
      }
      clearJournalDraft();
      // Ghi tu 1 ghi chu ca nhan ("Ghi nhat ky cho viec nay") - gui thanh
      // cong thi coi nhu viec da xong, tu danh dau ghi chu goc "Da xong"
      // (best-effort, khong chan/lam hong luong gui nhat ky neu loi).
      if(JOURNAL_SOURCE_NOTE_ID){
        try{
          await fetch(API+'personal_notes?id=eq.'+JOURNAL_SOURCE_NOTE_ID,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({is_done:true})});
          var cachedNote=(NOTES_CACHE||[]).find(function(n){return n.id===JOURNAL_SOURCE_NOTE_ID});
          if(cachedNote)cachedNote.is_done=true;
        }catch(e){}
      }
      showToast(isProvinceHead?'Đã ghi nhật ký (tự lưu, không cần chấm điểm).':'Đã gửi nhật ký.');
    }
    cj();
    rj();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

// ============================================
// NGHI PHEP - ghi 1 lan cho ca khoang ngay, khong cham diem. Tao dung 1
// dong "goc" (category = danh muc "Nghi phep", is_leave=true), lanh dao
// bam "Xac nhan da biet" (acknowledge_leave_log, migration 00059) roi he
// thong tu sinh cac dong con lai (create_work_log_clones, migration
// 00058) - giong het co che "cong viec nhieu ngay" o tren, chi khac
// khong co diem va dung RPC xac nhan rieng thay vi duyet+cham diem.
// ============================================
function updateLeaveRangePreview(){
  var preview=$('leaveRangePreview');if(!preview)return;
  var startStr=readDateOnly('leaveStartDate',null)||'',endStr=readDateOnly('leaveEndDate',null)||'';
  if(!startStr||!endStr){preview.textContent='Chọn đủ "Từ ngày" và "Đến ngày" để xem trước.';return}
  if(startStr>endStr){preview.textContent='"Từ ngày" phải trước hoặc bằng "Đến ngày".';return}
  var days=weekdayDatesBetween(startStr,endStr);
  if(!days.length){preview.textContent='Khoảng ngày không hợp lệ.';return}
  preview.textContent='Sẽ ghi nhận nghỉ phép cho '+days.length+' ngày (đã bỏ thứ Bảy/Chủ nhật): '+days.map(function(d){return shortDate(d)}).join(', ');
}

async function ol(){
  if(!requireActive())return;
  var form=$('leaveForm');form.reset();
  $('leaveStartDateField').innerHTML=dateOnlyFieldHtml('leaveStartDate',null);
  $('leaveEndDateField').innerHTML=dateOnlyFieldHtml('leaveEndDate',null);
  $('leaveRangePreview').textContent='';
  await refreshSubmitToOptions('leaveSubmitToSelect',null);
  $('leaveModal').hidden=false;document.body.style.overflow='hidden';
  $('leaveStartDate').focus();
}
function cl(){$('leaveModal').hidden=true;document.body.style.overflow=''}

async function sl(e){
  e.preventDefault();
  if(!requireActive())return;
  var form=e.currentTarget;
  var f=new FormData(form);
  var submittedToId=form.elements.submittedToId.value||null;
  var startStr=readDateOnly('leaveStartDate','từ ngày');
  if(startStr===undefined)return;
  var endStr=readDateOnly('leaveEndDate','đến ngày');
  if(endStr===undefined)return;
  if(!startStr||!endStr){showToast('Vui lòng chọn đủ "Từ ngày" và "Đến ngày".');return}
  if(startStr>endStr){showToast('"Từ ngày" phải trước hoặc bằng "Đến ngày".');return}
  var diffDays=Math.round((new Date(endStr+'T00:00:00')-new Date(startStr+'T00:00:00'))/86400000);
  if(diffDays>60){showToast('Khoảng nghỉ phép quá dài (tối đa 60 ngày cho 1 lần ghi).');return}
  var leaveCategory=CATS.find(function(c){return c.is_leave});
  if(!leaveCategory){showToast('Chưa cấu hình danh mục Nghỉ phép, liên hệ quản trị viên.');return}
  var reason=(f.get('leaveReason')||'').trim();
  var payload={
    author_id:U.id,unit_id:U.uid,status:'pending',
    submitted_to_id:submittedToId,
    category_id:leaveCategory.id,
    log_date:endStr,
    range_start_date:startStr,
    title:'Nghỉ phép',
    result:reason||'Nghỉ phép, không có kết quả công việc trong khoảng thời gian này.',
    work_role:'chu_tri',
    duration:'nhieu_ngay'
  };
  var btn=$('leaveSubmitButton');btn.disabled=true;
  try{
    var r=await fetch(API+'work_logs',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('HTTP '+r.status);
    showToast('Đã gửi nghỉ phép, chờ lãnh đạo xác nhận.');
    cl();
    rj();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

function unitShort(id){var u=UNITS.find(function(x){return x.id===id});return u?(u.short_name||u.code):'—'}

// ============================================
// GIAO VIEC - lanh dao giao viec cho cap duoi trong pham vi canManagePerson
// (bat ky Pho phong nao cung giao viec duoc cho bat ky ai trong don vi,
// khop thuc te "1 nguoi duoc nhieu lanh dao cung giao viec"). Ho tro giao
// CUNG LUC cho nhieu nguoi (1 chu tri + N phoi hop, dung chung 1
// task_group_id de gom hien thi phia nguoi giao - moi nguoi van la 1 dong
// rieng, tu theo doi tien do/han rieng). Han goi y/han hoan thanh chinh
// xac den gio:phut. Bao cao ket qua = 1 nhat ky binh thuong, gan qua
// select "Gan voi viec duoc giao" trong form tao nhat ky (oj/sj/
// refreshJournalTaskOptions o tren); duyet/tra lai tu dong bo trang thai
// task (server-side, trong approve_work_log/reject_work_log).
// ============================================
var TASK_STATUS_LABELS={pending:'Chờ thực hiện',reported:'Đã báo cáo, chờ duyệt',done:'Hoàn thành'};
var TASK_STATUS_TONES={pending:'status-pending',reported:'status-info',done:'status-approved'};
var TASK_WORK_ROLE_LABELS={chu_tri:'Chủ trì',phoi_hop:'Phối hợp'};
var TASKS_BY_ME=[],TASKS_TO_ME=[],TASK_CANDIDATES=[],TASK_GROUP_MEMBERS=[];
var TASK_SEARCH_ACTIVE='',TASK_SEARCH_DONE='';
// Khu "Da hoan thanh" mac dinh thu gon (bam moi mo) - tranh danh sach dai
// lam tran man hinh (yeu cau nguoi dung, 2026-09-07). Nho trang thai qua
// lan render lai (rt()) de khong tu dong dong lai khi lanh dao dang xem.
var TASK_DONE_EXPANDED=false;

// Dinh dang co dinh "dd/mm/yyyy hh:mm" (giong shortDateTime nhung khong co
// dau phay, dung cho han giao viec).
function formatDateTime(iso){
  if(!iso)return '';
  var d=new Date(iso);
  if(isNaN(d.getTime()))return '';
  var p2=function(n){return String(n).padStart(2,'0')};
  return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+' '+p2(d.getHours())+':'+p2(d.getMinutes());
}

function taskDueDate(t){return t.actual_due_date||t.suggested_due_date||null}
// So sanh timestamp DAY DU (gio:phut), dung thoi gian THUC TE - han giao
// viec gio la mot moc thoi gian that (TIMESTAMPTZ), khong con la 1 "ngay".
function isTaskOverdue(t){var due=taskDueDate(t);return t.status!=='done'&&!!due&&new Date(due)<new Date()}

// Gom cac dong "Viec toi da giao" theo task_group_id thanh 1 nhom - 1 lan
// giao cho nhieu nguoi hien thanh 1 the duy nhat.
function taskGroupsAssignedByMe(){
  var seen={},groups=[];
  TASKS_BY_ME.forEach(function(t){
    if(seen[t.task_group_id])return;
    seen[t.task_group_id]=true;
    groups.push(TASKS_BY_ME.filter(function(x){return x.task_group_id===t.task_group_id}));
  });
  return groups;
}

// 1 nhom coi la "Da hoan thanh" khi TAT CA nguoi dang con hoat dong
// (removed_at rong - khong tinh nguoi da rut khoi viec) deu co status
// "done". Dung de tach danh sach "Dang thuc hien" / "Da hoan thanh" o
// man Giao viec, tranh danh sach dai lam kho tra cuu (yeu cau nguoi
// dung, 2026-09-07).
function taskGroupIsDone(rows){
  var active=rows.filter(function(r){return !r.removed_at});
  if(!active.length)return false;
  return active.every(function(r){return r.status==='done'});
}

// Tim theo ten viec HOAC ten bat ky nguoi nao trong nhom (ke ca nguoi da
// rut khoi viec, de van tim lai duoc viec cu ho tung tham gia).
function taskGroupMatchesSearch(rows,q){
  if(!q)return true;
  var nq=q.normalize('NFC').toLowerCase();
  var lead=rows.find(function(r){return r.work_role==='chu_tri'})||rows[0];
  if((lead.title||'').normalize('NFC').toLowerCase().indexOf(nq)>=0)return true;
  return rows.some(function(r){return ((r.assignee&&r.assignee.full_name)||'').normalize('NFC').toLowerCase().indexOf(nq)>=0});
}

function taskGroupListHtml(groups,q,emptyText){
  var filtered=groups.filter(function(g){return taskGroupMatchesSearch(g,q)});
  if(!filtered.length)return '<div class="empty-state compact-empty"><strong>'+esc(emptyText)+'</strong></div>';
  return filtered.map(taskGroupCardHtml).join('');
}

function bindTaskGroupCardActions(root){
  root.querySelectorAll('[data-edit-task-group]').forEach(function(b){b.addEventListener('click',function(){openEditTaskModal(b.dataset.editTaskGroup)})});
  root.querySelectorAll('[data-delete-task-group]').forEach(function(b){b.addEventListener('click',function(){deleteTaskGroup(b.dataset.deleteTaskGroup)})});
  root.querySelectorAll('[data-report-task-group]').forEach(function(b){b.addEventListener('click',function(){reportTaskGroupLog(b.dataset.reportTaskGroup)})});
}

// Lanh dao lo ghi nhat ky khi giao viec (khong bam "Giao viec va ghi nhat
// ky" luc do) - nut nay o the "Cong viec da giao" cho ghi bo sung bat cu
// luc nao, dung lai dung noi dung/kieu chu nhu nhanh "withLog" trong
// submitTaskAssignment (yeu cau nguoi dung, 2026-09-07). Chi dien san form,
// van phai tu xem lai/cham diem va bam Gui nhu nhat ky binh thuong.
function reportTaskGroupLog(groupId){
  var rows=TASKS_BY_ME.filter(function(r){return r.task_group_id===groupId});
  if(!rows.length)return;
  var activeRows=rows.filter(function(r){return !r.removed_at});
  var lead=activeRows.find(function(r){return r.work_role==='chu_tri'})||activeRows[0]||rows[0];
  var leadName=(lead.assignee&&lead.assignee.full_name)||'';
  var supportNames=activeRows.filter(function(r){return r!==lead&&r.work_role==='phoi_hop'}).map(function(r){return r.assignee&&r.assignee.full_name}).filter(Boolean);
  var mgmtCat=CATS.find(function(c){return c.name==='Công tác khác'});
  var resultText='Đã giao việc "'+lead.title+'" cho '+leadName+' (chủ trì)'+(supportNames.length?(', phối hợp: '+supportNames.join(', ')):'')+'.'+(lead.description?(' Yêu cầu: '+lead.description):'');
  oj(null,null,null,{categoryId:mgmtCat?mgmtCat.id:'',title:'Giao việc: '+lead.title,result:resultText});
}

// O tim rieng cho tung khu (Dang thuc hien / Da hoan thanh) - chi ve lai
// DUNG khu do (khong dong lai toan bo trang), giong cach cac o tim khac
// trong app da lam (vd ujSearchInput).
function bindTaskSearchInputs(){
  var activeInput=$('taskSearchActiveInput');
  if(activeInput)activeInput.addEventListener('input',function(e){
    TASK_SEARCH_ACTIVE=e.target.value;
    var caret=activeInput.selectionStart;
    var slot=$('taskListActive');
    slot.innerHTML=taskGroupListHtml(taskGroupsAssignedByMe().filter(function(g){return !taskGroupIsDone(g)}),TASK_SEARCH_ACTIVE,'Chưa có việc nào đang thực hiện');
    bindTaskGroupCardActions(slot);
    var ni=$('taskSearchActiveInput');if(ni){ni.focus();ni.setSelectionRange(caret,caret)}
  });
  var doneInput=$('taskSearchDoneInput');
  if(doneInput)doneInput.addEventListener('input',function(e){
    TASK_SEARCH_DONE=e.target.value;
    var caret=doneInput.selectionStart;
    var slot=$('taskListDone');
    slot.innerHTML=taskGroupListHtml(taskGroupsAssignedByMe().filter(taskGroupIsDone),TASK_SEARCH_DONE,'Chưa có việc nào hoàn thành');
    bindTaskGroupCardActions(slot);
    var ni=$('taskSearchDoneInput');if(ni){ni.focus();ni.setSelectionRange(caret,caret)}
  });
}

async function rt(){
  var canAssign=canAssignTasks(),canReceive=canReceiveTasks();
  $('pageEyebrow').textContent=canAssign?(canReceive?'PHÂN CÔNG VÀ THEO DÕI TIẾN ĐỘ':'PHÂN CÔNG CÔNG VIỆC'):'CÔNG VIỆC ĐƯỢC GIAO';
  $('pageTitle').textContent=taskViewLabel();
  if(U.rl==='administrator'){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  TASK_CANDIDATES=[];TASKS_BY_ME=[];TASKS_TO_ME=[];TASK_GROUP_MEMBERS=[];
  try{
    if(canAssign){
      var pr=await fetch(API+'profiles?is_active=eq.true&select=id,full_name,title,professional_title,birth_year,role,unit_id&order=full_name',{headers:authHeaders()});
      var people=pr.ok?await pr.json():[];
      // Pham vi duoc phep giao viec = dung pham vi quan ly nguoi (khong con
      // gioi han theo danh sach uy quyen cu) - moi Pho phong deu giao viec
      // duoc cho bat ky ai trong don vi, dung thuc te "1 nguoi duoc nhieu
      // lanh dao cung giao viec".
      TASK_CANDIDATES=people.filter(function(p){return canManagePerson(p)});
      var byMeR=await fetch(API+'task_assignments?assigner_id=eq.'+U.id+'&order=created_at.desc&select=*,assignee:assignee_id(full_name)',{headers:authHeaders()});
      TASKS_BY_ME=byMeR.ok?await byMeR.json():[];
    }
    if(canReceive){
      var toMeR=await fetch(API+'task_assignments?assignee_id=eq.'+U.id+'&order=created_at.desc&select=*,assigner:assigner_id(full_name)',{headers:authHeaders()});
      TASKS_TO_ME=toMeR.ok?await toMeR.json():[];
      // "Cung thuc hien" - ten nhung nguoi khac trong CUNG 1 lan giao (cung
      // task_group_id) - can fetch rieng vi TASKS_TO_ME chi loc theo
      // assignee_id=chinh minh (RLS cho xem them nho migration 00044).
      var groupIds=Array.from(new Set(TASKS_TO_ME.map(function(t){return t.task_group_id}))).filter(Boolean);
      if(groupIds.length){
        var gmR=await fetch(API+'task_assignments?task_group_id=in.('+groupIds.join(',')+')&select=id,task_group_id,assignee_id,work_role,assignee:assignee_id(full_name)',{headers:authHeaders()});
        TASK_GROUP_MEMBERS=gmR.ok?await gmR.json():[];
      }
    }
  }catch(e){
    $('appView').innerHTML='<div class="empty-state"><strong>Không tải được dữ liệu</strong><span>'+esc(e.message)+'</span></div>';
    return;
  }
  var groupsByMe=taskGroupsAssignedByMe();
  // Tach "Cong viec da giao" thanh 2 khu rieng - "Dang thuc hien" va "Da
  // hoan thanh" - moi khu co o tim rieng, tranh danh sach dai lam tran
  // man hinh, kho tra cuu (yeu cau nguoi dung, 2026-09-07).
  var groupsInProgress=groupsByMe.filter(function(g){return !taskGroupIsDone(g)});
  var groupsDoneList=groupsByMe.filter(taskGroupIsDone);
  // Bo cuc 2 cot ngang hang: trai la "Cong viec da giao" (2 khu Dang thuc
  // hien/Da hoan thanh xep chong, khong con ke ca form giao viec dai ben
  // trong nua - truoc day phai cuon qua het form moi thay duoc danh
  // sach), phai la "Cong viec duoc giao" (giu nguyen). Form giao viec gom
  // vao modal rieng (assignTaskModal), mo tu 1 nut "+ Giao viec moi" o
  // dau khu "Dang thuc hien" - modal do co san 2 nut "Giao viec"/"Giao
  // viec va ghi nhat ky" (xem taskAssignFormHtml), khong tach thanh 2 nut
  // mo modal.
  var h='<div class="admin-grid '+(canAssign&&canReceive?'':'is-single')+'">';
  if(canAssign){
    var assignActions=TASK_CANDIDATES.length?('<div class="panel-header-actions">'
      +'<button type="button" class="button button-primary button-small" id="openAssignTaskBtn">+ Giao việc mới</button>'
      +'</div>'):'';
    h+='<div>'
      +'<section class="panel task-panel-stacked"><div class="panel-header"><div><h2>Công việc đã giao - đang thực hiện</h2><p>'+groupsInProgress.length+' việc</p></div>'+assignActions+'</div>'
      +(TASK_CANDIDATES.length?'':'<p class="metric-context">Bạn chưa có cán bộ/đơn vị nào thuộc phạm vi được phép giao việc.</p>')
      +(groupsByMe.length?'<label class="field field-wide task-search-field"><span>Tìm theo tên việc hoặc người thực hiện</span><input type="text" id="taskSearchActiveInput" value="'+esc(TASK_SEARCH_ACTIVE)+'" placeholder="Nhập từ khoá..."></label>':'')
      +'<div class="task-list" id="taskListActive">'+taskGroupListHtml(groupsInProgress,TASK_SEARCH_ACTIVE,'Chưa có việc nào đang thực hiện')+'</div></section>'
      +'<section class="panel"><div class="panel-header"><div><h2>Đã hoàn thành</h2><p>'+groupsDoneList.length+' việc</p></div></div>'
      +'<details class="unit-group task-done-collapse" id="taskDoneCollapse"'+(TASK_DONE_EXPANDED?' open':'')+'>'
      +'<summary><strong>Xem danh sách đã hoàn thành</strong><span>'+groupsDoneList.length+' việc</span></summary>'
      +'<div class="task-done-collapse-body">'
      +(groupsDoneList.length?'<label class="field field-wide task-search-field"><span>Tìm theo tên việc hoặc người thực hiện</span><input type="text" id="taskSearchDoneInput" value="'+esc(TASK_SEARCH_DONE)+'" placeholder="Nhập từ khoá..."></label>':'')
      +'<div class="task-list" id="taskListDone">'+taskGroupListHtml(groupsDoneList,TASK_SEARCH_DONE,'Chưa có việc nào hoàn thành')+'</div>'
      +'</div></details></section>'
      +'</div>';
  }
  if(canReceive)h+='<section class="panel"><div class="panel-header"><div><h2>Công việc được giao</h2><p>'+TASKS_TO_ME.length+' việc</p></div></div>'
    +'<div class="task-list">'+(TASKS_TO_ME.length?TASKS_TO_ME.map(function(t){return taskCardHtml(t,'assignee')}).join(''):'<div class="empty-state compact-empty"><strong>Chưa có việc được giao</strong></div>')+'</div></section>';
  h+='</div>';
  $('appView').innerHTML=h;
  // Nhan so tren "Giao viec" = so VIEC dang mo can theo doi: viec da giao
  // dang thuc hien (khop dung so o khu "Cong viec da giao - dang thuc
  // hien") + viec duoc giao minh chua lam xong. Dem theo VIEC (task_group),
  // bo qua nguoi da rut khoi viec (yeu cau nguoi dung 2026-09-10).
  var attentionGroups={};
  groupsInProgress.forEach(function(rows){var r=rows[0];if(r)attentionGroups[r.task_group_id||r.id]=true});
  TASKS_TO_ME.forEach(function(t){if(!t.removed_at&&t.status!=='done')attentionGroups[t.task_group_id||t.id]=true});
  updateTaskOverdueBadge(Object.keys(attentionGroups).length);
  document.querySelectorAll('[data-set-due-form]').forEach(function(form){form.addEventListener('submit',submitTaskDueDate)});
  document.querySelectorAll('[data-report-task]').forEach(function(b){b.addEventListener('click',function(){oj(null,b.dataset.reportTask)})});
  bindTaskGroupCardActions(document);
  bindTaskSearchInputs();
  var doneCollapseEl=$('taskDoneCollapse');
  if(doneCollapseEl)doneCollapseEl.addEventListener('toggle',function(){TASK_DONE_EXPANDED=doneCollapseEl.open});
  var openAssignBtn=$('openAssignTaskBtn');if(openAssignBtn)openAssignBtn.addEventListener('click',openAssignTaskModal);
}

// Modal "Giao viec moi" - truoc day form nay nam co dinh, dai, ben tren
// danh sach "Viec da giao" trong CUNG 1 cot, phai cuon qua het form moi
// thay duoc danh sach - nay gom vao modal rieng, mo tu nut o dau khung.
function openAssignTaskModal(){
  $('assignTaskModalTitle').textContent='Giao việc mới';
  $('assignTaskModalBody').innerHTML=taskAssignFormHtml();
  var form=$('taskAssignForm');
  if(form){form.addEventListener('submit',submitTaskAssignment);bindTaskAssignExtras()}
  $('assignTaskModal').hidden=false;document.body.style.overflow='hidden';
}
function closeAssignTaskModal(){$('assignTaskModal').hidden=true;document.body.style.overflow=''}

// Chon NGAY bang 1 o chu duy nhat "dd/mm/yyyy" (go tay, tu nhay dau "/"-
// xem binding input o DOMContentLoaded) KEM nut lich bam chon cho nguoi
// khong quen go tay - thay cho input[type=date] cua trinh duyet (hien thi
// sai thu tu tuy ngon ngu trinh duyet, xem lich su cu) va cho 3 o rieng
// Ngay/Thang/Nam (gon hon nhung nguoi dung phan anh la roi mat, muon gop
// lai thanh 1 o "nhu truoc"). Ca 2 cach nhap (go tay/bam lich) deu luon
// ra dung dd/mm/yyyy, khong phu thuoc trinh duyet.
function isoToDmy(iso){
  var m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?(m[3]+'/'+m[2]+'/'+m[1]):'';
}
// idPrefix chinh la id cua o (khong con hau to Day/Month/Year nhu truoc).
function dateOnlyFieldHtml(idPrefix,isoDate){
  var displayVal=isoDate?isoToDmy(isoDate):'';
  return '<span class="date-field-wrap">'
    +'<input type="text" class="date-field-input" id="'+idPrefix+'" inputmode="numeric" autocomplete="off" placeholder="dd/mm/yyyy" maxlength="10" value="'+esc(displayVal)+'">'
    +'<button type="button" class="date-field-cal-btn" data-date-field-toggle="'+idPrefix+'" tabindex="-1" aria-label="Chọn ngày trên lịch">📅</button>'
    +'</span>';
}
// Doc lai o thanh chuoi "yyyy-mm-dd" - null neu de trong, tra ve undefined
// (khac null) neu go sai dinh dang/ngay khong co that (vd 31/02). Chi bao
// showToast khi co fieldLabel (bo trong o nhung noi doc "tham" nhu tu luu
// nhap dang go).
function readDateOnly(idPrefix,fieldLabel){
  var el=$(idPrefix);
  if(!el)return null;
  var v=(el.value||'').trim();
  if(!v)return null;
  var m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  var d=m?Number(m[1]):0,mo=m?Number(m[2]):0,y=m?Number(m[3]):0;
  var valid=m&&d>=1&&d<=31&&mo>=1&&mo<=12;
  if(valid){var dt=new Date(y,mo-1,d);valid=dt.getFullYear()===y&&dt.getMonth()===mo-1&&dt.getDate()===d}
  if(!valid){
    if(fieldLabel)showToast('Ngày không hợp lệ cho '+fieldLabel+' - nhập theo dạng dd/mm/yyyy.');
    return undefined;
  }
  return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
// Doc lai 1 o "hh:mm" - null neu de trong, undefined neu sai dinh dang/gio
// khong hop le (>23 hoac phut>59).
function readTimeField(idPrefix,fieldLabel){
  var el=$(idPrefix);
  if(!el)return null;
  var v=(el.value||'').trim();
  if(!v)return null;
  var m=v.match(/^(\d{1,2}):(\d{2})$/);
  var h=m?Number(m[1]):-1,mi=m?Number(m[2]):-1;
  if(!m||h>23||mi>59){
    if(fieldLabel)showToast('Giờ không hợp lệ cho '+fieldLabel+' - nhập theo dạng hh:mm.');
    return undefined;
  }
  return {h:h,m:mi};
}
// idPrefix+"Date" va idPrefix+"Time" la id cua 2 o (Ngay/Gio-phut, moi o
// la 1 khoi go tay gon nhu truoc); isoValue (neu co) dung gio DIA PHUONG
// de dien san (khong dung toISOString() la UTC, se lech gio hien thi).
function dueDateTimeFieldHtml(idPrefix,isoValue){
  var dateVal=null,timeVal='';
  if(isoValue){
    var d=new Date(isoValue);
    if(!isNaN(d.getTime())){
      var p2=function(n){return String(n).padStart(2,'0')};
      dateVal=d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
      timeVal=p2(d.getHours())+':'+p2(d.getMinutes());
    }
  }
  return '<div class="due-datetime-picker">'
    +dateOnlyFieldHtml(idPrefix+'Date',dateVal)
    +'<span class="due-datetime-sep">lúc</span>'
    +'<input type="text" class="time-field-input" id="'+idPrefix+'Time" inputmode="numeric" autocomplete="off" placeholder="hh:mm" maxlength="5" value="'+esc(timeVal)+'">'
    +'</div>';
}
// Doc lai ca 2 o thanh 1 chuoi ISO (gio dia phuong) - tra ve null neu
// chua nhap ngay; bao showToast va tra ve undefined (khac null) neu nhap
// sai dinh dang o ngay hoac gio, de noi goi kiem tra duoc ca 2 truong hop.
function readDueDateTime(idPrefix,fieldLabel){
  var dateStr=readDateOnly(idPrefix+'Date',fieldLabel);
  if(dateStr===undefined)return undefined; // readDateOnly da bao loi
  if(!dateStr)return null;
  var time=readTimeField(idPrefix+'Time',fieldLabel);
  if(time===undefined)return undefined;
  if(!time){
    if(fieldLabel)showToast('Vui lòng nhập giờ cho '+fieldLabel+'.');
    return undefined;
  }
  var parts=dateStr.split('-').map(Number);
  var d=new Date(parts[0],parts[1]-1,parts[2],time.h,time.m,0);
  return d.toISOString();
}

// ============================================
// LICH BAM CHON (calendar popup) cho o ngay o tren - danh cho nguoi
// khong quen go tay. Tu dung (khong dung thu vien ngoai), gan vao DOM
// ngay canh o dang mo, dong khi bam ra ngoai/Escape/chon xong 1 ngay.
// ============================================
var DATE_FIELD_CAL_STATE=null; // {id, y, m(0-11)} - null = dang dong
function toggleDateFieldCalendar(id){
  if(DATE_FIELD_CAL_STATE&&DATE_FIELD_CAL_STATE.id===id){closeDateFieldCalendar();return}
  closeDateFieldCalendar();
  var input=$(id);
  if(!input)return;
  var current=readDateOnly(id,null);
  var base=current?new Date(current+'T00:00:00'):new Date();
  DATE_FIELD_CAL_STATE={id:id,y:base.getFullYear(),m:base.getMonth()};
  renderDateFieldCalendar();
}
function closeDateFieldCalendar(){
  var popup=document.getElementById('dateFieldCalendarPopup');
  if(popup)popup.remove();
  DATE_FIELD_CAL_STATE=null;
}
function renderDateFieldCalendar(){
  var st=DATE_FIELD_CAL_STATE;if(!st)return;
  var input=$(st.id);if(!input){closeDateFieldCalendar();return}
  var wrap=input.closest('.date-field-wrap');if(!wrap){closeDateFieldCalendar();return}
  var old=document.getElementById('dateFieldCalendarPopup');if(old)old.remove();
  var popup=document.createElement('div');
  popup.id='dateFieldCalendarPopup';
  popup.className='date-field-popup';
  popup.innerHTML=calendarGridHtml(st.y,st.m,readDateOnly(st.id,null));
  wrap.appendChild(popup);
}
function calendarGridHtml(y,m,selectedIso){
  var first=new Date(y,m,1);
  var offset=(first.getDay()+6)%7; // Tu Thu Hai (T2) dau tuan
  var daysInMonth=new Date(y,m+1,0).getDate();
  var todayIso=todayStr();
  var cells='';
  for(var i=0;i<offset;i++)cells+='<span class="cal-cell cal-empty"></span>';
  for(var d=1;d<=daysInMonth;d++){
    var iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var cls='cal-cell';
    if(iso===todayIso)cls+=' is-today';
    if(iso===selectedIso)cls+=' is-selected';
    cells+='<button type="button" class="'+cls+'" data-cal-day="'+iso+'">'+d+'</button>';
  }
  return '<div class="cal-header"><button type="button" class="cal-nav" data-cal-prev aria-label="Tháng trước">‹</button><strong>Tháng '+(m+1)+'/'+y+'</strong><button type="button" class="cal-nav" data-cal-next aria-label="Tháng sau">›</button></div>'
    +'<div class="cal-weekdays"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>'
    +'<div class="cal-grid">'+cells+'</div>';
}

// Chia danh sach "nguoi phoi hop" theo nhom vai tro - trong da so truong
// hop chi can chon 1 lanh dao chu tri + nhieu KSV phoi hop, gom nhom giup
// don vi dong nguoi (30-70 nguoi) de tim hon la 1 danh sach dai dang. Ca
// 3 nhom mac dinh THU GON - chi mo khi lanh dao chu dong bam vao (truoc
// day nhom "Can bo, KSV" mo san, nguoi dung phan anh la roi mat bo cuc).
var TASK_SUPPORT_GROUP_DEFS=[
  {label:'Lãnh đạo dưới quyền',roles:['unit_deputy','unit_head','province_deputy'],openByDefault:false},
  {label:'Cán bộ, Kiểm sát viên',roles:['staff'],openByDefault:false},
  {label:'Người lao động',roles:['support_staff'],openByDefault:false}
];
// presetSupportIds (khong bat buoc): danh sach id dang duoc chon san (khi
// sua 1 viec da giao) - nhom nao co nguoi duoc chon san thi TU MO ra,
// khong can bam moi thay.
function taskSupportPickerHtml(presetSupportIds){
  presetSupportIds=presetSupportIds||[];
  var covered={};
  TASK_SUPPORT_GROUP_DEFS.forEach(function(def){def.roles.forEach(function(r){covered[r]=true})});
  var groups=TASK_SUPPORT_GROUP_DEFS.map(function(def){return {def:def,people:TASK_CANDIDATES.filter(function(p){return def.roles.indexOf(p.role)>=0})}});
  // Vai tro la nao khong khop nhom nao (khong nen xay ra thuc te, de phong
  // xa) - gom vao nhom dau tien thay vi lam mat nguoi khoi danh sach chon.
  var uncovered=TASK_CANDIDATES.filter(function(p){return !covered[p.role]});
  if(uncovered.length)groups[0].people=groups[0].people.concat(uncovered);
  var groupsHtml=groups.filter(function(g){return g.people.length}).map(function(g){
    var hasPreset=g.people.some(function(p){return presetSupportIds.indexOf(p.id)>=0});
    var items=g.people.map(function(p){
      var checked=presetSupportIds.indexOf(p.id)>=0?' checked':'';
      var bio=personBioLine(p);return '<label data-name="'+esc((p.full_name||'').toLowerCase())+'" data-person-name="'+esc(p.full_name||'')+'"><input type="checkbox" name="supportIds" value="'+p.id+'"'+checked+'> '+esc(p.full_name)+' · '+esc(unitShort(p.unit_id))+(bio?' · '+esc(bio):'')+'</label>';
    }).join('');
    return '<details class="support-group" '+((g.def.openByDefault||hasPreset)?'open':'')+'><summary>'+esc(g.def.label)+' ('+g.people.length+')</summary><div class="unit-checklist unit-checklist-lg">'+items+'</div></details>';
  }).join('');
  return '<div class="support-picker" id="taskSupportPicker">'
    +'<div class="support-picker-chips" id="taskSupportChips"><span class="support-picker-chips-empty">Chưa chọn ai</span></div>'
    +(TASK_CANDIDATES.length>6?'<input type="text" id="taskSupportSearch" placeholder="Tìm theo tên...">':'')
    +'<div id="taskSupportChecklist">'+groupsHtml+'</div>'
    +'</div>';
}

// opts (khong bat buoc): {isEdit, leadId, supportIds, title, description,
// suggestedDueDate} - dung chung 1 form cho ca "Giao viec moi" va "Sua
// viec da giao" (truoc day Sua chi sua duoc noi dung, khong doi duoc
// nguoi - nay dung chung form nay, dien san du lieu hien co, xem migration
// 00070).
function taskAssignFormHtml(opts){
  opts=opts||{};
  var options=TASK_CANDIDATES.map(function(p){var bio=personBioLine(p);return '<option value="'+p.id+'"'+(p.id===opts.leadId?' selected':'')+'>'+esc(p.full_name)+' · '+esc(unitShort(p.unit_id))+(bio?' · '+esc(bio):'')+'</option>'}).join('');
  var actionsHtml=opts.isEdit
    ?'<button type="submit" class="button button-primary">Lưu thay đổi</button>'
    :'<button type="submit" class="button button-primary">Giao việc</button><button type="submit" class="button button-secondary" data-with-log="1">Giao việc và ghi nhật ký</button>';
  // Bo "compact-form" (dung khi form nam trong 1 panel da co san padding
  // rieng) - form nay gio nam truc tiep trong modal, can padding cua
  // chinh ".form-grid" de khong bi sat le.
  return '<form class="form-grid" id="taskAssignForm">'
    +'<label class="field field-wide"><span>Người chủ trì</span><select name="leadId" required>'+options+'</select></label>'
    +'<div class="field field-wide"><span>Người phối hợp (không bắt buộc)</span>'+taskSupportPickerHtml(opts.supportIds)+'</div>'
    +'<label class="field field-wide"><span>Tên công việc</span><textarea name="title" required maxlength="200" rows="1" class="title-grow-input">'+esc(opts.title||'')+'</textarea></label>'
    +'<label class="field field-wide"><span>Mô tả / yêu cầu</span><textarea name="description" rows="5" placeholder="Có thể ghi chi tiết yêu cầu, phạm vi công việc...">'+esc(opts.description||'')+'</textarea></label>'
    +'<div class="field field-wide"><span>Hạn gợi ý (không bắt buộc)</span>'+dueDateTimeFieldHtml('taskSuggestedDue',opts.suggestedDueDate||null)+'</div>'
    +'<div class="review-actions field-wide">'+actionsHtml+'</div>'
    +'</form>';
}

// Tim theo ten (khong dau khong phan biet, giong renderCopyJournalList),
// tu mo het cac nhom dang thu gon khi co tu khoa tim (tranh an mat ket
// qua nam trong nhom dong) + ve lai khu "Da chon" dang the (chip) moi khi
// tich/bo tich - can thiet tu khi don vi co toi 30-70 nguoi (truoc day
// chi vai nguoi, khung 5 dong don gian la du dung).
function bindTaskAssignExtras(){
  var search=$('taskSupportSearch');
  var checklist=$('taskSupportChecklist');
  if(!checklist)return;
  function renderChips(){
    var chipsEl=$('taskSupportChips');
    if(!chipsEl)return;
    var checked=Array.from(checklist.querySelectorAll('input[type="checkbox"]:checked'));
    if(!checked.length){chipsEl.innerHTML='<span class="support-picker-chips-empty">Chưa chọn ai</span>';return}
    chipsEl.innerHTML=checked.map(function(cb){
      var label=cb.closest('label');
      var name=label?(label.dataset.personName||''):'';
      return '<span class="support-chip">'+esc(name)+'<button type="button" class="support-chip-remove" data-unselect-support="'+esc(cb.value)+'" aria-label="Bỏ chọn '+esc(name)+'">×</button></span>';
    }).join('');
    chipsEl.querySelectorAll('[data-unselect-support]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var cb=checklist.querySelector('input[value="'+btn.dataset.unselectSupport+'"]');
        if(cb){cb.checked=false;renderChips()}
      });
    });
  }
  checklist.addEventListener('change',renderChips);
  renderChips();
  if(search){
    search.addEventListener('input',function(){
      var q=search.value.trim().normalize('NFC').toLowerCase();
      checklist.querySelectorAll('label').forEach(function(label){
        label.style.display=(!q||(label.dataset.name||'').indexOf(q)>=0)?'':'none';
      });
      if(q)checklist.querySelectorAll('details.support-group').forEach(function(d){d.open=true});
    });
  }
}

async function submitTaskAssignment(e){
  e.preventDefault();
  if(!requireActive())return;
  if(!canAssignTasks()){showToast('Tài khoản này chỉ được nhận công việc.');return}
  var form=e.currentTarget;
  // e.submitter: nut THAT SU duoc bam (form co 2 nut submit - "Giao viec"
  // va "Giao viec va ghi nhat ky", xem taskAssignFormHtml) - chuan
  // SubmitEvent.submitter, cac trinh duyet hien dai deu ho tro.
  var withLog=Boolean(e.submitter&&e.submitter.dataset.withLog==='1');
  var f=new FormData(form);
  var leadId=f.get('leadId');
  var title=(f.get('title')||'').trim();
  if(!leadId){showToast('Vui lòng chọn người chủ trì.');return}
  if(!title){showToast('Vui lòng nhập tên công việc.');return}
  var supportIds=Array.from(form.querySelectorAll('input[name="supportIds"]:checked')).map(function(cb){return cb.value}).filter(function(id){return id!==leadId});
  var suggestedDueDate=readDueDateTime('taskSuggestedDue','hạn gợi ý');
  if(suggestedDueDate===undefined)return; // da chon ngay nhung thieu gio/phut, readDueDateTime da bao loi
  var description=(f.get('description')||'').trim();
  var submitBtns=form.querySelectorAll('button[type="submit"]');submitBtns.forEach(function(b){b.disabled=true});
  try{
    var r=await fetch(API+'rpc/create_task_assignment',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_lead_assignee_id:leadId,p_support_assignee_ids:supportIds,p_title:title,p_description:description||null,p_suggested_due_date:suggestedDueDate})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));submitBtns.forEach(function(b){b.disabled=false});return}
    showToast('Đã giao việc cho '+(1+supportIds.length)+' người.');
    closeAssignTaskModal();
    rt();
    // "Giao viec va ghi nhat ky": mo san form Ghi nhat ky moi, dien san
    // noi dung the hien vua giao viec gi cho ai - de Lanh dao co 1 nhat
    // ky ca nhan ghi nhan cong tac dieu hanh, van phai tu xem lai/cham
    // diem va bam Gui nhu nhat ky binh thuong (khong tu dong gui).
    if(withLog){
      var leadPerson=TASK_CANDIDATES.find(function(p){return p.id===leadId});
      var leadName=leadPerson?leadPerson.full_name:'';
      var supportNames=supportIds.map(function(id){var p=TASK_CANDIDATES.find(function(x){return x.id===id});return p?p.full_name:null}).filter(Boolean);
      var mgmtCat=CATS.find(function(c){return c.name==='Công tác khác'});
      var resultText='Đã giao việc "'+title+'" cho '+leadName+' (chủ trì)'+(supportNames.length?(', phối hợp: '+supportNames.join(', ')):'')+'.'+(description?(' Yêu cầu: '+description):'');
      await oj(null,null,null,{categoryId:mgmtCat?mgmtCat.id:'',title:'Giao việc: '+title,result:resultText});
    }
  }catch(err){showToast('Lỗi: '+err.message);submitBtns.forEach(function(b){b.disabled=false})}
}

// Sua 1 nhom viec da giao - CHI tac gia giao viec (assigner) moi lam
// duoc, dung RPC update_task_assignment (migration 00070). Nay sua duoc
// CA nguoi chu tri/phoi hop (truoc day - migration 00067 - chi sua duoc
// noi dung), dung CHUNG modal voi "Giao viec moi" (taskAssignFormHtml)
// de day du truong nhu nhau, dien san du lieu hien co. Nguoi da nop bao
// cao ma bi rut khoi viec KHONG bi mat du lieu - xem chu thich chi tiet
// o migration 00070.
function openEditTaskModal(groupId){
  var rows=TASKS_BY_ME.filter(function(t){return t.task_group_id===groupId});
  if(!rows.length)return;
  var activeRows=rows.filter(function(r){return !r.removed_at});
  var lead=activeRows.find(function(r){return r.work_role==='chu_tri'})||activeRows[0]||rows[0];
  var supportIds=activeRows.filter(function(r){return r!==lead}).map(function(r){return r.assignee_id});
  $('assignTaskModalTitle').textContent='Sửa việc đã giao';
  $('assignTaskModalBody').innerHTML=taskAssignFormHtml({isEdit:true,leadId:lead.assignee_id,supportIds:supportIds,title:lead.title,description:lead.description,suggestedDueDate:lead.suggested_due_date});
  var form=$('taskAssignForm');
  if(form){form.addEventListener('submit',function(e){submitEditTaskGroupForm(e,groupId)});bindTaskAssignExtras()}
  $('assignTaskModal').hidden=false;document.body.style.overflow='hidden';
}

async function submitEditTaskGroupForm(e,groupId){
  e.preventDefault();
  var form=e.currentTarget;
  var f=new FormData(form);
  var leadId=f.get('leadId');
  var title=(f.get('title')||'').trim();
  if(!leadId){showToast('Vui lòng chọn người chủ trì.');return}
  if(!title){showToast('Vui lòng nhập tên công việc.');return}
  var supportIds=Array.from(form.querySelectorAll('input[name="supportIds"]:checked')).map(function(cb){return cb.value}).filter(function(id){return id!==leadId});
  var suggestedDueDate=readDueDateTime('taskSuggestedDue','hạn gợi ý');
  if(suggestedDueDate===undefined)return;
  var description=(f.get('description')||'').trim();
  var submitBtns=form.querySelectorAll('button[type="submit"]');submitBtns.forEach(function(b){b.disabled=true});
  try{
    var r=await fetch(API+'rpc/update_task_assignment',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_task_group_id:groupId,p_title:title,p_description:description||null,p_suggested_due_date:suggestedDueDate,p_lead_assignee_id:leadId,p_support_assignee_ids:supportIds})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));submitBtns.forEach(function(b){b.disabled=false});return}
    closeAssignTaskModal();
    showToast('Đã lưu thay đổi việc giao.');
    rt();
  }catch(err){showToast('Lỗi: '+err.message);submitBtns.forEach(function(b){b.disabled=false})}
}

async function deleteTaskGroup(groupId){
  if(!confirm('Xóa việc giao này cho tất cả người liên quan? Nhật ký đã báo cáo (nếu có) sẽ không bị xóa, chỉ gỡ liên kết với việc này. Không thể khôi phục lại.'))return;
  try{
    var r=await fetch(API+'rpc/delete_task_assignment',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_task_group_id:groupId})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));return}
    showToast('Đã xóa việc giao.');
    rt();
  }catch(err){showToast('Lỗi: '+err.message)}
}

// The gop 1 nhom giao viec (phia nguoi giao) - liet ke ro chu tri/phoi
// hop kem trang thai rieng cua tung nguoi. Nguoi da bi rut khoi viec
// (removed_at, xem migration 00070) van hien trong the (mo nhat, kem
// "Da rut khoi viec nay") de Lanh dao biet ho tung tham gia, nhung tach
// rieng khoi danh sach dang hoat dong.
function taskGroupCardHtml(rows){
  var activeRows=rows.filter(function(r){return !r.removed_at});
  var removedRows=rows.filter(function(r){return r.removed_at});
  var lead=activeRows.find(function(r){return r.work_role==='chu_tri'})||activeRows[0]||rows[0];
  var others=activeRows.filter(function(r){return r!==lead});
  var overdueAny=activeRows.some(isTaskOverdue);
  function memberRow(row){
    var name=row.assignee&&row.assignee.full_name;
    return '<div class="task-member-row"><span>'+esc(name||'—')+'</span><span class="meta-tag">'+TASK_WORK_ROLE_LABELS[row.work_role]+'</span><span class="status-pill '+TASK_STATUS_TONES[row.status]+'">'+TASK_STATUS_LABELS[row.status]+'</span></div>';
  }
  function removedRow(row){
    var name=row.assignee&&row.assignee.full_name;
    return '<div class="task-member-row task-member-removed"><span>'+esc(name||'—')+'</span><span class="meta-tag">'+TASK_WORK_ROLE_LABELS[row.work_role]+'</span><span class="meta-tag meta-tag-muted">Đã rút khỏi việc này</span></div>';
  }
  return '<article class="task-card '+(overdueAny?'is-overdue':'')+'">'
    +'<div class="task-card-header"><strong>'+esc(lead.title)+'</strong>'+(overdueAny?'<span class="meta-tag meta-tag-warning">Có người quá hạn</span>':'')+'</div>'
    +(lead.description?('<p>'+esc(lead.description)+'</p>'):'')
    +'<div class="task-card-meta">'+(lead.suggested_due_date?('<span>Hạn gợi ý: '+formatDateTime(lead.suggested_due_date)+'</span>'):'')+'</div>'
    +'<div class="task-member-list">'+memberRow(lead)+others.map(memberRow).join('')+removedRows.map(removedRow).join('')+'</div>'
    +'<div class="task-card-actions"><button type="button" class="button button-secondary button-small" data-edit-task-group="'+lead.task_group_id+'">Sửa</button>'
    +'<button type="button" class="button button-secondary button-small" data-report-task-group="'+lead.task_group_id+'">Ghi nhật ký cho việc này</button>'
    +'<button type="button" class="button button-danger button-small" data-delete-task-group="'+lead.task_group_id+'">Xóa</button></div>'
    +'</article>';
}

function taskCardHtml(task,perspective){
  var counterpart=perspective==='assigner'?(task.assignee&&task.assignee.full_name):(task.assigner&&task.assigner.full_name);
  var counterpartLabel=perspective==='assigner'?'Giao cho':'Người giao';
  var overdue=isTaskOverdue(task);
  var roleTag=perspective==='assignee'?('<span class="meta-tag">'+(TASK_WORK_ROLE_LABELS[task.work_role]||'Chủ trì')+'</span>'):'';
  var coAssignees=perspective==='assignee'
    ?TASK_GROUP_MEMBERS.filter(function(m){return m.task_group_id===task.task_group_id&&m.id!==task.id})
    :[];
  // Da bi rut khoi viec (migration 00070) - khong con thao tac gi them
  // duoc nua (khong dat han/ghi nhat ky moi), nhung van giu nguyen the
  // hien thi + du lieu cu (nhat ky da nop, neu co) tren tai khoan cua ho.
  var isRemoved=Boolean(task.removed_at);
  var removedTag=isRemoved?'<span class="meta-tag meta-tag-muted">Đã được rút khỏi việc này</span>':'';
  var dueSetter=(perspective==='assignee'&&task.status!=='done'&&!isRemoved)
    ?('<form class="task-due-form" data-set-due-form="'+task.id+'"><span class="field-label">Hạn hoàn thành</span>'+dueDateTimeFieldHtml('taskActualDue_'+task.id,task.actual_due_date)+'<button type="submit" class="button button-secondary button-small">Đặt hạn</button></form>')
    :'';
  var reportButton=(perspective==='assignee'&&task.status==='pending'&&!isRemoved)
    ?('<button type="button" class="button button-primary button-small" data-report-task="'+task.id+'">Ghi nhật ký cho việc này</button>')
    :'';
  return '<article class="task-card '+(overdue?'is-overdue':'')+(isRemoved?' task-member-removed':'')+'">'
    +'<div class="task-card-header"><strong>'+esc(task.title)+'</strong><span class="status-pill '+TASK_STATUS_TONES[task.status]+'">'+TASK_STATUS_LABELS[task.status]+'</span></div>'
    +(task.description?('<p>'+esc(task.description)+'</p>'):'')
    +'<div class="task-card-meta"><span>'+counterpartLabel+': <strong>'+esc(counterpart||'—')+'</strong></span>'
    +roleTag
    +(task.suggested_due_date?('<span>Hạn gợi ý: '+formatDateTime(task.suggested_due_date)+'</span>'):'')
    +(task.actual_due_date?('<span>Hạn đã đặt: '+formatDateTime(task.actual_due_date)+'</span>'):'')
    +(overdue?'<span class="meta-tag meta-tag-warning">Quá hạn</span>':'')
    +removedTag
    +(coAssignees.length?('<span>Cùng thực hiện: '+esc(coAssignees.map(function(m){return m.assignee&&m.assignee.full_name}).filter(Boolean).join(', '))+'</span>'):'')
    +'</div>'+dueSetter+reportButton+'</article>';
}


async function submitTaskDueDate(e){
  e.preventDefault();
  if(!requireActive())return;
  var form=e.currentTarget;
  var taskId=form.dataset.setDueForm;
  var value=readDueDateTime('taskActualDue_'+taskId,'hạn hoàn thành');
  if(value===undefined)return; // da chon ngay nhung thieu gio/phut, readDueDateTime da bao loi
  if(!value){showToast('Vui lòng chọn thời điểm hoàn thành.');return}
  try{
    var r=await fetch(API+'rpc/set_task_due_date',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_task_id:taskId,p_due_date:value})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));return}
    showToast('Đã đặt hạn hoàn thành.');
    rt();
  }catch(err){showToast('Lỗi: '+err.message)}
}

// ============================================
// GHI CHU CONG VIEC CA NHAN - lich thang + khung chi tiet, rieng tu tuyet
// doi cho tung nguoi dung (RLS: user_id = auth.uid()), khac han "Nhat ky
// cong tac" la viec DA lam. Khong can RPC vi RLS 1 policy la du (khong co
// phan quyen xem cheo nhu work_logs/monthly_reviews).
// ============================================
var NOTES_MONTH=null,NOTES_SELECTED_DATE=null,NOTES_CACHE=[],STICKY_CACHE=[];

function notesGridDates(monthStr){
  var parts=monthStr.split('-'),year=Number(parts[0]),month=Number(parts[1]);
  var firstOfMonth=new Date(year,month-1,1);
  var startWeekday=(firstOfMonth.getDay()+6)%7;
  var gridStart=new Date(year,month-1,1-startWeekday);
  var dates=[];
  for(var i=0;i<42;i++){
    var d=new Date(gridStart);
    d.setDate(gridStart.getDate()+i);
    dates.push(ymdStr(d.getFullYear(),d.getMonth(),d.getDate()));
  }
  return dates;
}

function shiftMonth(monthStr,delta){
  var parts=monthStr.split('-'),year=Number(parts[0]),month=Number(parts[1]);
  return ymStr(year,month-1+delta);
}

function fullDateLabelVi(dateStr){
  var days=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  var d=new Date(dateStr+'T00:00:00');
  return days[d.getDay()]+', '+fullDate(dateStr);
}

async function fetchPersonalNotes(startDate,endDate){
  var r=await fetch(API+'personal_notes?user_id=eq.'+U.id+'&note_date=gte.'+startDate+'&note_date=lte.'+endDate+'&order=note_date.asc,created_at.asc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return await r.json();
}

async function rn(){
  $('pageEyebrow').textContent='KẾ HOẠCH CÁ NHÂN';$('pageTitle').textContent='Ghi chú công việc';
  if(!NOTES_MONTH)NOTES_MONTH=ymStr(new Date().getFullYear(),new Date().getMonth());
  if(!NOTES_SELECTED_DATE){var t0=new Date();NOTES_SELECTED_DATE=ymdStr(t0.getFullYear(),t0.getMonth(),t0.getDate())}
  var gridDates=notesGridDates(NOTES_MONTH);
  if(gridDates.indexOf(NOTES_SELECTED_DATE)<0)NOTES_SELECTED_DATE=gridDates[0];
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  try{
    var results=await Promise.all([fetchPersonalNotes(gridDates[0],gridDates[gridDates.length-1]),fetchStickyNotes()]);
    NOTES_CACHE=results[0];
    STICKY_CACHE=results[1];
  }catch(e){
    $('appView').innerHTML='<div class="empty-state"><strong>Không tải được ghi chú</strong><span>'+esc(e.message)+'</span></div>';
    return;
  }
  renderNotesView(gridDates);
}

async function fetchStickyNotes(){
  var r=await fetch(API+'sticky_notes?user_id=eq.'+U.id+'&order=created_at.asc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return await r.json();
}

function renderNotesView(gridDates){
  var notesByDate={};
  NOTES_CACHE.forEach(function(note){
    if(!notesByDate[note.note_date])notesByDate[note.note_date]=[];
    notesByDate[note.note_date].push(note);
  });
  var t=new Date();
  var todayStr2=ymdStr(t.getFullYear(),t.getMonth(),t.getDate());
  var h='<div class="journal-header"><div><h2>Ghi chú công việc</h2><p>Kế hoạch cá nhân — chỉ bạn nhìn thấy</p></div><button class="button button-primary" id="newNote">+ Thêm ghi chú</button></div>';
  h+='<div class="toolbar"><div class="month-nav"><button type="button" class="icon-button" id="notesPrevMonth" aria-label="Tháng trước">‹</button><strong>'+esc(periodLabel(NOTES_MONTH))+'</strong><button type="button" class="icon-button" id="notesNextMonth" aria-label="Tháng sau">›</button></div><div class="spacer"></div><button class="button button-secondary" id="notesToday">Hôm nay</button></div>';
  h+='<div class="monthly-layout"><section class="panel monthly-table-panel"><div class="calendar-grid">';
  h+=['T2','T3','T4','T5','T6','T7','CN'].map(function(w){return '<div class="calendar-weekday">'+w+'</div>'}).join('');
  h+=gridDates.map(function(dateStr){return calendarDayCellHtml(dateStr,notesByDate[dateStr]||[],todayStr2)}).join('');
  h+='</div></section>';
  h+='<section class="panel monthly-detail">'+notesDetailHtml(NOTES_SELECTED_DATE,notesByDate[NOTES_SELECTED_DATE]||[],todayStr2)+'</section></div>';
  h+=stickyBoardHtml();
  $('appView').innerHTML=h;
  $('newNote').addEventListener('click',function(){openNoteModal(NOTES_SELECTED_DATE)});
  $('notesPrevMonth').addEventListener('click',function(){NOTES_MONTH=shiftMonth(NOTES_MONTH,-1);rn()});
  $('notesNextMonth').addEventListener('click',function(){NOTES_MONTH=shiftMonth(NOTES_MONTH,1);rn()});
  $('notesToday').addEventListener('click',function(){var t2=new Date();NOTES_MONTH=ymStr(t2.getFullYear(),t2.getMonth());NOTES_SELECTED_DATE=ymdStr(t2.getFullYear(),t2.getMonth(),t2.getDate());rn()});
  document.querySelectorAll('[data-notes-day]').forEach(function(cell){cell.addEventListener('click',function(){NOTES_SELECTED_DATE=cell.dataset.notesDay;renderNotesView(gridDates)})});
  var newForDay=$('newNoteForDay');if(newForDay)newForDay.addEventListener('click',function(){openNoteModal(NOTES_SELECTED_DATE)});
  document.querySelectorAll('[data-edit-note]').forEach(function(b){b.addEventListener('click',function(){openNoteModal(null,b.dataset.editNote)})});
  document.querySelectorAll('[data-delete-note]').forEach(function(b){b.addEventListener('click',function(){deleteNote(b.dataset.deleteNote)})});
  document.querySelectorAll('[data-report-note]').forEach(function(b){b.addEventListener('click',function(){oj(null,null,b.dataset.reportNote)})});
  document.querySelectorAll('[data-toggle-note-done]').forEach(function(cb){cb.addEventListener('change',function(){toggleNoteDone(cb.dataset.toggleNoteDone,cb.checked)})});
  bindStickyBoard(gridDates);
}

// ============================================
// GHI CHU TU DO (khong gan ngay) - "sticky notes", tu xep theo luoi, keo
// goc duoi-phai tung o de doi kich thuoc bang co che resize goc cua trinh
// duyet.
// ============================================
function stickyBoardHtml(){
  return '<section class="panel sticky-board-panel">'
    +'<div class="panel-header"><div><h2>Việc chưa có hạn cụ thể</h2><p>Ghi chú tự do, không gắn ngày — kéo góc dưới-phải để đổi kích thước</p></div><button class="button button-secondary" id="newSticky">+ Thêm ô ghi chú</button></div>'
    +'<div class="sticky-board">'+(STICKY_CACHE.length?STICKY_CACHE.map(stickyNoteHtml).join(''):'<p class="metric-context">Chưa có ghi chú nào.</p>')+'</div>'
    +'</section>';
}

function stickyNoteHtml(note){
  return '<div class="sticky-note" style="width:'+(note.width||220)+'px;height:'+(note.height||160)+'px" data-sticky-id="'+note.id+'">'
    +'<button type="button" class="sticky-note-delete" data-delete-sticky="'+note.id+'" aria-label="Xoá ghi chú">×</button>'
    +'<textarea class="sticky-note-text" data-sticky-text="'+note.id+'" placeholder="Ghi việc chưa có hạn...">'+esc(note.content||'')+'</textarea>'
    +'</div>';
}

function bindStickyBoard(gridDates){
  var newSticky=$('newSticky');
  if(newSticky)newSticky.addEventListener('click',async function(){
    try{
      var r=await fetch(API+'sticky_notes',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),body:JSON.stringify({user_id:U.id,content:'',width:220,height:160})});
      if(!r.ok)throw new Error('HTTP '+r.status);
      var created=await r.json();
      STICKY_CACHE.push(created[0]);
      renderNotesView(gridDates);
    }catch(e){showToast('Lỗi: '+e.message)}
  });
  document.querySelectorAll('[data-delete-sticky]').forEach(function(b){b.addEventListener('click',async function(){
    var id=b.dataset.deleteSticky;
    try{
      var r=await fetch(API+'sticky_notes?id=eq.'+id,{method:'DELETE',headers:authHeaders()});
      if(!r.ok)throw new Error('HTTP '+r.status);
      STICKY_CACHE=STICKY_CACHE.filter(function(n){return n.id!==id});
      renderNotesView(gridDates);
    }catch(e){showToast('Lỗi: '+e.message)}
  })});
  document.querySelectorAll('[data-sticky-text]').forEach(function(textarea){
    var debounceTimer;
    textarea.addEventListener('input',function(){
      clearTimeout(debounceTimer);
      debounceTimer=setTimeout(async function(){
        var id=textarea.dataset.stickyText;
        try{
          await fetch(API+'sticky_notes?id=eq.'+id,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({content:textarea.value})});
          var note=STICKY_CACHE.find(function(n){return n.id===id});
          if(note)note.content=textarea.value;
        }catch(e){}
      },400);
    });
  });
  document.querySelectorAll('.sticky-note').forEach(function(el){
    var debounceTimer;
    var observer=new ResizeObserver(function(entries){
      var entry=entries[0];
      // "* { box-sizing: border-box }" toan cuc -> style.width/height dat khi
      // ve lai la KICH THUOC BORDER-BOX, phai luu dung border-box (khong
      // dung contentRect - loai tru padding, se lam o "co lai" moi lan
      // resize+tai lai trang do padding bi tru lap).
      var box=entry.borderBoxSize&&entry.borderBoxSize[0];
      var width=box?box.inlineSize:el.offsetWidth;
      var height=box?box.blockSize:el.offsetHeight;
      clearTimeout(debounceTimer);
      debounceTimer=setTimeout(async function(){
        var id=el.dataset.stickyId;
        var w=Math.round(width),h=Math.round(height);
        try{
          await fetch(API+'sticky_notes?id=eq.'+id,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({width:w,height:h})});
          var note=STICKY_CACHE.find(function(n){return n.id===id});
          if(note){note.width=w;note.height=h}
        }catch(e){}
      },400);
    });
    observer.observe(el);
  });
}

function calendarDayCellHtml(dateStr,dayNotes,todayStr2){
  var inMonth=dateStr.indexOf(NOTES_MONTH)===0;
  var isToday=dateStr===todayStr2;
  var isSelected=dateStr===NOTES_SELECTED_DATE;
  var dayNumber=Number(dateStr.slice(8,10));
  var visible=dayNotes.slice(0,3);
  var rest=dayNotes.length-visible.length;
  var chips=visible.map(function(note){
    var overdue=note.note_date<todayStr2&&!note.is_done;
    return '<span class="calendar-day-chip '+(note.is_done?'is-done':'')+' '+(overdue?'is-overdue':'')+'">'+esc(note.title)+'</span>';
  }).join('');
  return '<button type="button" class="calendar-day '+(inMonth?'':'is-other-month')+' '+(isToday?'is-today':'')+' '+(isSelected?'is-selected':'')+'" data-notes-day="'+dateStr+'">'
    +'<span class="calendar-day-number">'+dayNumber+'</span>'+chips+(rest>0?'<span class="calendar-day-more">+'+rest+' khác</span>':'')
    +'</button>';
}

function notesDetailHtml(dateStr,dayNotes,todayStr2){
  var sorted=dayNotes.slice().sort(function(a,b){return (a.created_at||'').localeCompare(b.created_at||'')});
  var h='<div class="panel-header"><div><span class="eyebrow">CHI TIẾT NGÀY</span><h2>'+esc(fullDateLabelVi(dateStr))+'</h2></div></div>';
  h+='<div class="note-list">'+(sorted.length?sorted.map(function(note){return noteCardHtml(note,todayStr2)}).join(''):'<div class="empty-state compact-empty"><strong>Chưa có ghi chú</strong><span>Chưa có việc gì được ghi cho ngày này.</span></div>')+'</div>';
  h+='<div class="form-actions" style="padding-top:14px"><button type="button" class="button button-secondary" id="newNoteForDay">+ Thêm ghi chú cho ngày này</button></div>';
  return h;
}

function noteCardHtml(note,todayStr2){
  var overdue=note.note_date<todayStr2&&!note.is_done;
  return '<article class="note-card '+(note.is_done?'is-done':'')+' '+(overdue?'is-overdue':'')+'">'
    +'<label class="note-card-check"><input type="checkbox" data-toggle-note-done="'+note.id+'" '+(note.is_done?'checked':'')+'><span>'+esc(note.title)+'</span></label>'
    +(note.content?'<p>'+esc(note.content)+'</p>':'')
    +'<div class="note-card-actions">'
    +(note.is_done?'':'<button type="button" class="button button-primary button-small" data-report-note="'+note.id+'">Ghi nhật ký cho việc này</button>')
    +'<button type="button" class="button button-secondary button-small" data-edit-note="'+note.id+'">Sửa</button><button type="button" class="button button-danger button-small" data-delete-note="'+note.id+'">Xoá</button></div>'
    +'</article>';
}

function openNoteModal(dateStr,noteId){
  var form=$('noteForm');form.reset();
  var note=noteId?NOTES_CACHE.find(function(n){return n.id===noteId}):null;
  $('noteModalTitle').textContent=note?'Sửa ghi chú công việc':'Thêm ghi chú công việc';
  $('noteSubmitButton').textContent=note?'Lưu thay đổi':'Lưu ghi chú';
  form.dataset.editingNoteId=note?note.id:'';
  $('noteDateField').innerHTML=dateOnlyFieldHtml('noteDate',note?note.note_date:(dateStr||NOTES_SELECTED_DATE));
  form.elements.title.value=note?note.title:'';
  form.elements.content.value=note?(note.content||''):'';
  // Tach "HH:MM:SS" thanh 2 o rieng (Gio/Phut) - xem ly do o
  // dueDateTimeFieldHtml() cua man Giao viec (trinh duyet hien 12h hay
  // 24h tuy ngon ngu trinh duyet, ngoai tam kiem soat cua trang web).
  var dueTimeParts=(note&&note.due_time)?note.due_time.split(':'):['',''];
  form.elements.dueTimeHour.value=dueTimeParts[0]||'';
  form.elements.dueTimeMinute.value=dueTimeParts[1]||'';
  form.elements.remindBeforeMinutes.value=note&&note.remind_before_minutes!=null?String(note.remind_before_minutes):'';
  $('noteModal').hidden=false;
  form.elements.title.focus();
}
function closeNoteModal(){$('noteModal').hidden=true}

async function submitNote(e){
  e.preventDefault();
  var f=new FormData($('noteForm'));
  var editingId=$('noteForm').dataset.editingNoteId;
  var noteDate=readDateOnly('noteDate','ngày');
  if(noteDate===undefined)return;
  var title=(f.get('title')||'').trim();
  var content=(f.get('content')||'').trim();
  var dueTimeHour=f.get('dueTimeHour'),dueTimeMinute=f.get('dueTimeMinute');
  var dueTime=(dueTimeHour&&dueTimeMinute)?(dueTimeHour+':'+dueTimeMinute):null;
  var remindRaw=f.get('remindBeforeMinutes');
  var remindBeforeMinutes=remindRaw?Number(remindRaw):null;
  if(!noteDate||!title)return;
  var btn=$('noteSubmitButton');btn.disabled=true;
  try{
    if(editingId){
      var r=await fetch(API+'personal_notes?id=eq.'+editingId,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({note_date:noteDate,title:title,content:content||null,due_time:dueTime,remind_before_minutes:remindBeforeMinutes})});
      if(!r.ok)throw new Error('HTTP '+r.status);
      showToast('Đã cập nhật ghi chú.');
    }else{
      var r2=await fetch(API+'personal_notes',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({user_id:U.id,note_date:noteDate,title:title,content:content||null,due_time:dueTime,remind_before_minutes:remindBeforeMinutes})});
      if(!r2.ok)throw new Error('HTTP '+r2.status);
      showToast('Đã thêm ghi chú.');
    }
    closeNoteModal();
    NOTES_SELECTED_DATE=noteDate;
    if(noteDate.indexOf(NOTES_MONTH)!==0)NOTES_MONTH=noteDate.slice(0,7);
    rn();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

async function toggleNoteDone(noteId,checked){
  try{
    var r=await fetch(API+'personal_notes?id=eq.'+noteId,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({is_done:checked})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    rn();
  }catch(e){showToast('Lỗi: '+e.message)}
}

async function deleteNote(noteId){
  try{
    var r=await fetch(API+'personal_notes?id=eq.'+noteId,{method:'DELETE',headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    showToast('Đã xoá ghi chú.');
    rn();
  }catch(e){showToast('Lỗi: '+e.message)}
}


// ============================================
// CO CAU TO CHUC - chi xem, khong dong den tai khoan/nhan su that
// ============================================
var ORG_EXPANDED_UNIT_ID=null;
async function ro(){
  $('pageEyebrow').textContent='MÔ HÌNH TỔ CHỨC';$('pageTitle').textContent='Cơ cấu và phân quyền';
  if(!isAdminOrProvinceHead()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var people=[];var assignedByUser={};
  try{
    var r=await fetch(API+'profiles?select=id,full_name,title,professional_title,birth_year,role,unit_id,is_active',{headers:authHeaders()});
    people=r.ok?await r.json():[];
    var ar=await fetch(API+'unit_assignments?select=user_id,unit_id',{headers:authHeaders()});
    var assignments=ar.ok?await ar.json():[];
    assignments.forEach(function(a){(assignedByUser[a.user_id]=assignedByUser[a.user_id]||[]).push(a.unit_id)});
  }catch(e){}
  var departments=UNITS.filter(function(u){return u.type==='department'});
  var regionals=UNITS.filter(function(u){return u.type==='regional'});
  function orgUnitCardHtml(unit){
    var head=people.find(function(p){return p.unit_id===unit.id&&p.role==='unit_head'});
    var members=people.filter(function(p){return p.unit_id===unit.id}).slice().sort(function(a,b){
      return (ROLE_RANK[b.role]||0)-(ROLE_RANK[a.role]||0) || a.full_name.localeCompare(b.full_name);
    });
    var expanded=ORG_EXPANDED_UNIT_ID===unit.id;
    var memberRows=expanded?('<div class="org-unit-members">'+(members.length?members.map(function(m){
      var bio=personBioLine(m);return '<div class="org-member-row"><span>'+esc(m.full_name)+'</span><span class="meta-tag">'+esc(ROLE_LABELS[m.role]||m.role)+'</span>'+(bio?'<span class="meta-tag">'+esc(bio)+'</span>':'')+(m.is_active===false?'<span class="meta-tag meta-tag-warning">Chưa kích hoạt</span>':'')+'</div>';
    }).join(''):'<span class="unit-checklist-empty">Chưa có nhân sự</span>')+'</div>'):'';
    return '<div class="org-unit-wrap"><button type="button" class="org-unit '+(expanded?'is-expanded':'')+'" data-org-unit-toggle="'+unit.id+'"><div><strong>'+esc(unit.short_name||unit.code)+'</strong><span>'+(head?esc(head.full_name):'Chưa xác định người đứng đầu')+'</span></div><span class="score-pill score-mid">'+members.length+' người</span></button>'+memberRows+'</div>';
  }
  // "Mo rong" 1 don vi (xem danh sach nhan su) chi doi ORG_EXPANDED_UNIT_ID -
  // KHONG can goi lai ro() (se xoa trang toan bo trang, tai lai mang tu dau,
  // cam giac giong nhu load lai trang). Ve rieng lai khoi ".org-branches"
  // tu du lieu "people" da co san trong bo nho (dong trong closure nay).
  function redrawOrgBranches(){
    var branches=$('appView').querySelector('.org-branches');
    if(!branches)return;
    branches.innerHTML='<div class="org-column"><h3>Phòng chuyên trách</h3>'+departments.map(orgUnitCardHtml).join('')+'</div><div class="org-column"><h3>VKSND khu vực</h3>'+regionals.map(orgUnitCardHtml).join('')+'</div>';
    bindOrgUnitToggle();
  }
  function bindOrgUnitToggle(){
    document.querySelectorAll('[data-org-unit-toggle]').forEach(function(b){b.addEventListener('click',function(){
      ORG_EXPANDED_UNIT_ID=ORG_EXPANDED_UNIT_ID===b.dataset.orgUnitToggle?null:b.dataset.orgUnitToggle;
      redrawOrgBranches();
    })});
  }
  var h=credentialNoticeHtml()+'<div class="dashboard-grid">'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Cây tổ chức</h2><p>Hai nhóm đơn vị ngang cấp, cùng trực thuộc VKSND tỉnh</p></div></div><div class="org-tree"><div class="org-root"><strong>VKSND tỉnh</strong><span>Viện trưởng · Các Phó Viện trưởng</span></div><div class="org-branches"><div class="org-column"><h3>Phòng chuyên trách</h3>'+departments.map(orgUnitCardHtml).join('')+'</div><div class="org-column"><h3>VKSND khu vực</h3>'+regionals.map(orgUnitCardHtml).join('')+'</div></div></div></section>'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Gán vai trò và đơn vị</h2><p>Chỉ định đúng chức vụ và đơn vị cho từng tài khoản, nhóm theo đơn vị. Tài khoản bị khóa không tự mở lại khi gán; sử dụng nút "Mở lại" khi cần kích hoạt. Viện trưởng/Phó Viện trưởng tỉnh chọn "Lãnh đạo Viện tỉnh" làm đơn vị. Với vai trò Phó Viện trưởng tỉnh, tick chọn thêm các đơn vị được phân công phụ trách.</p></div></div>'+assignRoleGroupedHtml(people,assignedByUser)+'</section>'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Quy tắc người chấm</h2><p>Không cho phép người dùng tự chấm nhật ký của mình</p></div></div><div class="org-role-list">'
    +'<div class="org-role-row"><strong>Cán bộ, công chức</strong><p>Người đứng đầu đơn vị trực tiếp đánh giá; cấp phó chỉ chấm khi có ủy quyền.</p></div>'
    +'<div class="org-role-row"><strong>Phó lãnh đạo đơn vị</strong><p>Viện trưởng khu vực hoặc Trưởng phòng đánh giá.</p></div>'
    +'<div class="org-role-row"><strong>Người đứng đầu đơn vị</strong><p>Lãnh đạo tỉnh được phân công phụ trách đơn vị đánh giá.</p></div>'
    +'<div class="org-role-row"><strong>Phó Viện trưởng tỉnh</strong><p>Viện trưởng tỉnh đánh giá.</p></div>'
    +'</div></section></div>';
  $('appView').innerHTML=h;
  document.querySelectorAll('[data-save-role]').forEach(function(b){b.addEventListener('click',function(){saveAccountRole(b.dataset.saveRole)})});
  document.querySelectorAll('[data-toggle-active]').forEach(function(b){b.addEventListener('click',function(){toggleAccountActive(b.dataset.toggleActive,b.dataset.active==='true')})});
  document.querySelectorAll('[data-reset-password]').forEach(function(b){b.addEventListener('click',function(){resetPasswordFor(b.dataset.resetPassword,b.dataset.personFullName)})});
  bindOrgUnitToggle();
  bindCredentialNoticeDismiss();
  bindRoleSelectToggle();
  bindAssignRoleSearch();
}

var ROLE_LABELS={province_head:'Viện trưởng tỉnh',province_deputy:'Phó Viện trưởng tỉnh',unit_head:'Trưởng phòng/Viện trưởng KV',unit_deputy:'Phó phòng/Phó Viện trưởng KV',staff:'Cán bộ/Kiểm sát viên',support_staff:'Người lao động',administrator:'Quản trị viên'};
var ROLE_OPTIONS=['staff','support_staff','unit_deputy','unit_head','province_deputy','province_head','administrator'];

var LEADERSHIP_UNIT_LABEL='Lãnh đạo Viện tỉnh';

function assignRoleTableHtml(people,assignedByUser){
  if(!people.length)return '<div class="empty-state compact-empty"><strong>Chưa có tài khoản nào</strong></div>';
  var sorted=people.slice().sort(function(a,b){return (a.is_active===b.is_active)?0:(a.is_active?1:-1)});
  // Don vi that (phong/khu vuc) - dung lam danh sach "don vi phu trach".
  var deptUnits=UNITS.filter(function(u){return u.type!=='province'});
  // Vien truong/Pho Vien truong tinh khong thuoc phong/khu vuc nao - them
  // muc rieng tro ve don vi cap tinh (PROVINCE_UNIT_ID) de co the chon lam
  // "Don vi" cua ho, thay vi bat buoc gan nham vao 1 phong/khu vuc.
  var homeUnitOptions=PROVINCE_UNIT_ID?[{id:PROVINCE_UNIT_ID,short_name:LEADERSHIP_UNIT_LABEL}].concat(deptUnits):deptUnits;
  return '<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Trạng thái</th><th>Vai trò</th><th>Đơn vị</th><th>Đơn vị phụ trách (Phó VT tỉnh)</th><th></th></tr></thead><tbody>'+sorted.map(function(p){
    // Chi Quan tri vien moi duoc CHON "Quan tri vien" cho nguoi khac - an
    // lua chon nay voi nguoi xem khac, TRU khi chinh nguoi dang duoc gan
    // da san co vai tro do (giu nguyen hien thi dung, tranh vo tinh ha bac
    // ho khi luu thay doi khac). Phia server (assign_account_role, migration
    // 00053) van chan lai du client co bi qua mat.
    var roleOptionsForRow=ROLE_OPTIONS.filter(function(r){return r!=='administrator'||U.rl==='administrator'||p.role==='administrator'});
    var roleSel='<select data-role-select="'+p.id+'">'+roleOptionsForRow.map(function(r){return '<option value="'+r+'" '+(p.role===r?'selected':'')+'>'+ROLE_LABELS[r]+'</option>'}).join('')+'</select>';
    var unitSel='<select data-unit-select="'+p.id+'">'+homeUnitOptions.map(function(u){return '<option value="'+u.id+'" '+(p.unit_id===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select>';
    var assigned=assignedByUser[p.id]||[];
    var isDeputy=p.role==='province_deputy';
    var checklist='<div class="unit-checklist" data-assigned-checklist="'+p.id+'" style="display:'+(isDeputy?'':'none')+'">'+deptUnits.map(function(u){return '<label><input type="checkbox" value="'+u.id+'" '+(assigned.indexOf(u.id)>=0?'checked':'')+'> '+esc(u.short_name||u.code)+'</label>'}).join('')+'</div>'
      +'<span class="unit-checklist-empty" data-assigned-empty="'+p.id+'" style="display:'+(isDeputy?'none':'')+'">Chỉ áp dụng cho Phó Viện trưởng tỉnh</span>';
    var isSelf=p.id===U.id;
    var lockBtn=isSelf?'':'<button type="button" class="button button-small '+(p.is_active?'button-danger':'button-secondary')+'" data-toggle-active="'+p.id+'" data-active="'+p.is_active+'">'+(p.is_active?'Khoá':'Mở lại')+'</button>';
    var resetPwBtn='<button type="button" class="button button-secondary button-small" data-reset-password="'+p.id+'" data-person-full-name="'+esc(p.full_name)+'">Đặt lại mật khẩu</button>';
    return '<tr data-person-name="'+esc((p.full_name||'').normalize('NFC').toLowerCase())+'"><td><strong>'+esc(p.full_name)+'</strong></td><td><span class="status-pill '+(p.is_active?'status-approved':'status-revision')+'">'+(p.is_active?'Đang hoạt động':'Bị khóa')+'</span></td><td>'+roleSel+'</td><td>'+unitSel+'</td><td>'+checklist+'</td><td class="numeric"><button class="button button-primary button-small" data-save-role="'+p.id+'">Lưu</button> '+resetPwBtn+' '+lockBtn+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

// Nhom bang gan vai tro/don vi theo tung don vi (thu tu: Lanh dao Vien
// tinh, roi Phong, roi Khu vuc - khop thu tu cay to chuc), gap/mo bang
// <details> de tranh hien toan bo so luong nguoi cung luc, kem o tim ten.
// Nguoi thieu vai tro HOAC don vi hop le duoc gom rieng vao 1 nhom canh
// bao dau danh sach thay vi bi rot khoi bang - an toan voi du lieu chua
// hoan chinh (VD tai khoan vua tao/vua doi don vi giua luc dang xem).
function assignRoleGroupedHtml(allPeople,assignedByUser){
  if(!allPeople.length)return '<div class="empty-state compact-empty"><strong>Chưa có tài khoản nào</strong></div>';
  var validUnitIds={};UNITS.forEach(function(u){validUnitIds[u.id]=true});
  var isAssigned=function(p){return p.role&&ROLE_LABELS[p.role]&&p.unit_id&&validUnitIds[p.unit_id]};
  var unassigned=allPeople.filter(function(p){return !isAssigned(p)});
  var assigned=allPeople.filter(isAssigned);
  var groupUnits=[];
  if(PROVINCE_UNIT_ID){
    var provinceUnit=UNITS.find(function(u){return u.id===PROVINCE_UNIT_ID});
    if(provinceUnit)groupUnits.push({id:provinceUnit.id,short_name:LEADERSHIP_UNIT_LABEL});
  }
  groupUnits=groupUnits.concat(UNITS.filter(function(u){return u.type==='department'}));
  groupUnits=groupUnits.concat(UNITS.filter(function(u){return u.type==='regional'}));

  var h='<label class="field" style="max-width:320px;margin-bottom:14px"><span>Tìm theo tên</span><input type="text" id="assignRoleSearch" placeholder="Nhập tên..."></label>';
  if(unassigned.length){
    h+='<details class="unit-group is-unassigned" open data-role-group><summary><strong>Chưa phân loại (thiếu vai trò hoặc đơn vị)</strong><span>'+unassigned.length+' người</span></summary>'+assignRoleTableHtml(unassigned,assignedByUser)+'</details>';
  }
  groupUnits.forEach(function(u){
    var members=assigned.filter(function(p){return p.unit_id===u.id});
    if(!members.length)return;
    h+='<details class="unit-group" data-role-group><summary><strong>'+esc(u.short_name||u.code)+'</strong><span>'+members.length+' người</span></summary>'+assignRoleTableHtml(members,assignedByUser)+'</details>';
  });
  return h;
}

function bindAssignRoleSearch(){
  var input=$('assignRoleSearch');
  if(!input)return;
  input.addEventListener('input',function(){
    var q=input.value.trim().normalize('NFC').toLowerCase();
    document.querySelectorAll('[data-role-group]').forEach(function(group){
      var rows=group.querySelectorAll('[data-person-name]');
      var anyMatch=false;
      rows.forEach(function(row){
        var match=!q||row.dataset.personName.indexOf(q)>=0;
        row.style.display=match?'':'none';
        if(match)anyMatch=true;
      });
      if(q)group.open=anyMatch;
      else if(!group.classList.contains('is-unassigned'))group.open=false;
    });
  });
}

function bindRoleSelectToggle(){
  document.querySelectorAll('[data-role-select]').forEach(function(sel){
    sel.addEventListener('change',function(){
      var id=sel.dataset.roleSelect;
      var isDeputy=sel.value==='province_deputy';
      var list=document.querySelector('[data-assigned-checklist="'+id+'"]');
      var empty=document.querySelector('[data-assigned-empty="'+id+'"]');
      if(list)list.style.display=isDeputy?'':'none';
      if(empty)empty.style.display=isDeputy?'none':'';
    });
  });
}

async function saveAccountRole(id){
  if(!requireActive())return;
  var roleSel=document.querySelector('[data-role-select="'+id+'"]');
  var unitSel=document.querySelector('[data-unit-select="'+id+'"]');
  var checklist=document.querySelector('[data-assigned-checklist="'+id+'"]');
  if(!roleSel||!unitSel)return;
  try{
    var r=await fetch(API+'rpc/assign_account_role',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:id,p_role:roleSel.value,p_unit_id:unitSel.value})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));

    if(roleSel.value==='province_deputy'&&checklist){
      var chosen=Array.from(checklist.querySelectorAll('input:checked')).map(function(cb){return cb.value});
      var r2=await fetch(API+'rpc/set_unit_assignments',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:id,p_unit_ids:chosen})});
      var d2=await r2.json();
      if(!r2.ok||d2.success===false)throw new Error((d2&&d2.error)||('HTTP '+r2.status));
    }

    showToast('Đã cập nhật vai trò và đơn vị.');
    // Giu lai cac nhom <details> dang mo + vi tri cuon man hinh khi ve lai
    // bang - truoc day ro() ve lai TOAN BO trang tu dau, dong het cac nhom
    // va nhay cuon ve dau trang, cam giac nhu trang bi tai lai ("reload").
    var openGroups=Array.from(document.querySelectorAll('[data-role-group]')).filter(function(d){return d.open}).map(function(d){var s=d.querySelector('summary strong');return s?s.textContent:null}).filter(Boolean);
    var scrollY=window.scrollY;
    await ro();
    document.querySelectorAll('[data-role-group]').forEach(function(d){
      var s=d.querySelector('summary strong');
      if(s&&openGroups.indexOf(s.textContent)>=0)d.open=true;
    });
    window.scrollTo(0,scrollY);
    refreshPendingBadge();
  }catch(e){showToast('Lỗi: '+e.message)}
}

async function toggleAccountActive(id,currentlyActive){
  if(!requireActive())return;
  if(currentlyActive&&!confirm('Khoá tài khoản này? Người dùng sẽ không đăng nhập sử dụng được cho tới khi mở lại.'))return;
  try{
    var r=await fetch(API+'rpc/set_account_active',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:id,p_active:!currentlyActive})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast(currentlyActive?'Đã khoá tài khoản.':'Đã mở lại tài khoản.');
    ro();
  }catch(e){showToast('Lỗi: '+e.message)}
}

// Sinh 1 mat khau manh, de doc/de chep tay (khong dung ky tu de nham lan
// nhau nhu 0/O, 1/l) - dung lam goi y ban dau, admin van sua tay duoc truoc
// khi gui di.
function generateStrongPassword(){
  var letters='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  var digits='23456789';
  var symbols='!@#$%*';
  function pick(s){return s.charAt(Math.floor(Math.random()*s.length))}
  var chars=[pick(letters).toUpperCase(),pick(letters).toLowerCase(),pick(digits),pick(symbols)];
  var all=letters+digits+symbols;
  for(var i=0;i<8;i++)chars.push(pick(all));
  return chars.sort(function(){return Math.random()-0.5}).join('');
}

// Thong bao mat khau vua tao/dat lai - hien dang banner CO DINH tren dau
// trang (khong tu bien mat nhu toast 3s) de admin kip chep lai/gui cho
// nguoi dung, chi mat khi admin bam "Da ghi lai, dong".
var ADMIN_CREDENTIAL_NOTICE=null;
function credentialNoticeHtml(){
  if(!ADMIN_CREDENTIAL_NOTICE)return'';
  var n=ADMIN_CREDENTIAL_NOTICE;
  return '<div class="panel panel-wide credential-notice"><div class="credential-notice-body">'
    +'<strong>'+esc(n.title)+'</strong>'
    +'<p>Tài khoản: <code>'+esc(n.email||n.name||'')+'</code></p>'
    +'<p>Mật khẩu: <code class="credential-notice-password">'+esc(n.password)+'</code></p>'
    +'<p class="credential-notice-hint">Hãy chép lại và gửi riêng cho người dùng ngay bây giờ - mật khẩu sẽ không hiển thị lại được nữa sau khi đóng.</p>'
    +'</div><button type="button" class="button button-secondary button-small" id="dismissCredentialNotice">Đã ghi lại, đóng</button></div>';
}
function bindCredentialNoticeDismiss(){
  var b=$('dismissCredentialNotice');
  // Chi go banner + xoa bien nho - KHONG goi lai ro()/ra() (khong co gi
  // thay doi them ke tu lan render gan nhat, goi lai se xoa/tai lai toan
  // bo trang mot cach thua thai, giong nhu load lai trang).
  if(b)b.addEventListener('click',function(){ADMIN_CREDENTIAL_NOTICE=null;var notice=b.closest('.credential-notice');if(notice)notice.remove();});
}

async function resetPasswordFor(id,name){
  if(!requireActive())return;
  var suggested=generateStrongPassword();
  var input=prompt('Đặt mật khẩu mới cho "'+name+'" (tối thiểu 8 ký tự, có cả chữ và số). Có thể sửa lại trước khi xác nhận:',suggested);
  if(input===null)return;
  var newPassword=input.trim();
  if(newPassword.length<8){showToast('Mật khẩu cần tối thiểu 8 ký tự.');return}
  if(!/[A-Za-z]/.test(newPassword)||!/[0-9]/.test(newPassword)){showToast('Mật khẩu cần có cả chữ và số.');return}
  try{
    var r=await fetch(FUNCTIONS+'admin-manage-users',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'set_password',user_id:id,new_password:newPassword})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    ADMIN_CREDENTIAL_NOTICE={title:'Đã đặt lại mật khẩu',name:name,password:newPassword};
    showToast('Đã đặt lại mật khẩu cho '+name+'.');
    ro();
  }catch(e){showToast('Lỗi: '+e.message)}
}

function updatePendingBadge(n){var el=$('pendingNavCount');if(el)el.textContent=n}
async function refreshPendingBadge(){
  if(!isLeader())return;
  // fetchReviewQueue() da loc chi con nhat ky nop thang cho minh.
  try{var q=await fetchReviewQueue();updatePendingBadge(q.length)}catch(e){}
}

function updateTaskOverdueBadge(n){var el=$('taskOverdueNavCount');if(el){el.textContent=n;el.hidden=n===0}}
async function refreshTaskOverdueBadge(){
  if(U.rl==='administrator')return;
  try{
    // Nhan so tren "Giao viec" = so VIEC dang mo can theo doi: viec minh
    // GIAO chua hoan thanh + viec minh DUOC GIAO chua lam xong. Dem theo
    // task_group_id (1 viec = 1 lan du giao cho nhieu nguoi), bo qua nguoi
    // da rut khoi viec (removed_at). Yeu cau nguoi dung 2026-09-10.
    var groups={};
    var r1=await fetch(API+'task_assignments?assignee_id=eq.'+U.id+'&status=neq.done&removed_at=is.null&select=task_group_id',{headers:authHeaders()});
    (r1.ok?await r1.json():[]).forEach(function(t){groups[t.task_group_id||('a-'+Math.random())]=true});
    var r2=await fetch(API+'task_assignments?assigner_id=eq.'+U.id+'&status=neq.done&removed_at=is.null&select=task_group_id',{headers:authHeaders()});
    (r2.ok?await r2.json():[]).forEach(function(t){groups[t.task_group_id||('b-'+Math.random())]=true});
    updateTaskOverdueBadge(Object.keys(groups).length);
  }catch(e){}
}

// Loc theo don vi (unit_id) khong phan biet CAP BAC trong cung 1 don vi -
// vi du Pho phong (unit_deputy) va Truong phong (unit_head) o cung 1
// unit_id, nen 1 truy van chi loc theo unit_id se lam Pho phong "thay"
// duoc Truong phong trong danh sach nguoi/nhat ky cua don vi (loi that:
// cap duoi xem duoc nhat ky cap tren). Dung thang bac de loai nguoi CAO
// HON viewer ra khoi ket qua - khong anh huong cac truong hop dung san
// (vi du Pho VT tinh van thay duoc Truong phong don vi minh phu trach).
var ROLE_RANK={province_head:4,province_deputy:3,unit_head:2,unit_deputy:1,staff:0,support_staff:0};
function isVisibleInUnitScope(personRole){
  if(personRole==='administrator')return false;
  return (ROLE_RANK[personRole]||0)<=(ROLE_RANK[U.rl]||0);
}
function filterVisibleInUnitScope(list){
  return list.filter(function(p){return isVisibleInUnitScope(p.role)});
}

// "Co nam trong chuoi quan ly nguoi nay khong" - dung cho Giao viec va
// lam nen cho canReviewLog/canApproveMonthly. Khac canReviewLog: KHONG
// xet nhat ky cu the nao (khong co khai niem "nop cho ai"), chi xet vai
// tro + don vi - ap dung cho MOI Pho phong trong don vi (khong con gioi
// han theo danh sach uy quyen cu).
function canManagePerson(person){
  if(!person||person.id===U.id)return false;
  var ar=person.role,auid=person.unit_id;
  if(U.rl==='province_head')return ar==='province_deputy'||ar==='unit_head'||auid===PROVINCE_UNIT_ID;
  if(U.rl==='province_deputy')return ar==='unit_head'&&(U.assignedUnits||[]).indexOf(auid)>=0;
  if(U.rl==='unit_head')return auid===U.uid&&ar!=='unit_head';
  if(U.rl==='unit_deputy')return auid===U.uid&&(ar==='staff'||ar==='support_staff');
  return false;
}

// Co duyet duoc DUNG NHAT KY NAY khong - khac canManagePerson o cho: Pho
// phong (unit_deputy) chi duyet duoc nhat ky da duoc "nop cho" dung minh
// (log.submitted_to_id), TRU KHI dang duoc uy quyen thay mat 100% toan
// don vi (U.hasFullDelegation) thi duyet duoc ca don vi nhu Truong phong.
function canReviewLog(log,author){
  if(!author||log.author_id===U.id)return false;
  if(U.rl==='unit_deputy'){
    if(author.unit_id===U.uid&&U.hasFullDelegation)return true;
    // Phai cung don vi voi tac gia (khop dung server, migration 00054) -
    // truoc day thieu dieu kien nay, "nop cho" 1 Pho phong khac don vi
    // van duyet duoc, ne duoc dung cap tren that.
    return author.unit_id===U.uid&&log.submitted_to_id===U.id;
  }
  return canManagePerson(author);
}

async function fetchReviewQueue(){
  if(!isLeader())return [];
  var r=await fetch(API+'work_logs?status=eq.pending&deleted_at=is.null&order=created_at.desc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  var pending=(await r.json()).filter(function(l){return l.author_id!==U.id});
  if(!pending.length)return [];
  var ids=Array.from(new Set(
    pending.map(function(l){return l.author_id})
      .concat(pending.map(function(l){return l.submitted_to_id}).filter(Boolean))
      .concat(pending.map(function(l){return l.rescoring_requested_by}).filter(Boolean))
  )).join(',');
  var pr=await fetch(API+'profiles?id=in.('+ids+')&select=id,full_name,title,role,unit_id',{headers:authHeaders()});
  var people=pr.ok?await pr.json():[];
  var peopleMap={};people.forEach(function(a){peopleMap[a.id]=a});
  // Man Duyet & cham diem CHI hien nhat ky nop THANG cho minh (hoac khong
  // chi dinh ai) - nhat ky KSV nop dich danh cho 1 cap pho khong con hien
  // o day nua cho MOI cap truong (yeu cau nguoi dung 2026-09-10: cap pho
  // van cham diem duoc tren dien thoai nen cap truong khong can xem/cham
  // ho). isQueueItemForOthers dung chung U.id nen dung cho moi vai tro.
  return pending
    .filter(function(l){return canReviewLog(l,peopleMap[l.author_id])})
    .filter(function(l){return !isQueueItemForOthers(l)})
    .map(function(l){
      l._author=peopleMap[l.author_id];
      l._submittedTo=l.submitted_to_id?peopleMap[l.submitted_to_id]:null;
      l._rescoringRequestedBy=l.rescoring_requested_by?peopleMap[l.rescoring_requested_by]:null;
      return l;
    });
}

// Nhat ky KSV da nop DICH DANH cho nguoi khac (khong phai minh) nhung minh
// van co quyen xem/duyet (vi du Truong phong voi nhat ky nop cho 1 Pho) -
// dung de tach rieng khoi hang cho chinh, tranh "gianh" duyet nham phan
// viec dang lam cua nguoi khac. Xem rr().
function isQueueItemForOthers(l){return !!(l.submitted_to_id&&l.submitted_to_id!==U.id)}

// Gom danh sach cho duyet theo tung tac gia (KSV), xep theo lan nop gan
// nhat cua tung nguoi; trong 1 nhom sap theo thoi gian nop moi nhat truoc.
// An toan: neu 1 log khong khop duoc ho so tac gia (VD fetch profiles va
// fetch work_logs lech thoi diem khi vua co nguoi nop/duoc duyet), gom vao
// 1 nhom rieng "khong xac dinh tac gia" thay vi lam vo ca danh sach.
function groupQueueByAuthor(queue){
  var order=[],byId={};
  queue.forEach(function(l){
    var key=l.author_id||'__unknown__';
    if(!byId[key]){byId[key]={author:l._author||null,items:[]};order.push(key)}
    byId[key].items.push(l);
  });
  var groups=order.map(function(key){return byId[key]});
  groups.forEach(function(g){g.items.sort(function(a,b){return (submittedAtOf(b)||'').localeCompare(submittedAtOf(a)||'')})});
  groups.sort(function(a,b){
    var at=a.items[0]?submittedAtOf(a.items[0]):'';
    var bt=b.items[0]?submittedAtOf(b.items[0]):'';
    return (bt||'').localeCompare(at||'');
  });
  return groups;
}

function authorQueueGroupHtml(g){
  var authorName=g.author?esc(g.author.full_name||''):'Không xác định tác giả';
  var authorUnit=g.author?esc(unitShort(g.author.unit_id)):'';
  var items=g.items.map(function(l,idx){
    return '<button class="queue-item '+(l.id===SELECTED_REVIEW_ID?'is-selected':'')+'" data-review-id="'+l.id+'">'
      +'<span class="queue-index">'+(idx+1)+'</span>'
      +'<span class="queue-item-body"><p>'+esc(l.title)+'</p><span class="queue-meta">'+(l.revision_count?'<span class="resubmission-badge">Trình lại lần '+l.revision_count+'</span>':'')+'<span>'+shortDateTime(submittedAtOf(l))+'</span></span></span>'
      +'</button>';
  }).join('');
  return '<div class="queue-group"><div class="queue-group-header"><strong>'+authorName+'</strong>'+(authorUnit?'<span>'+authorUnit+'</span>':'')+'</div>'+items+'</div>';
}

async function rr(){
  $('pageEyebrow').textContent='CHỜ DUYỆT';$('pageTitle').textContent='Duyệt và chấm điểm';
  if(!isLeader()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var queue;
  try{queue=await fetchReviewQueue()}catch(e){$('appView').innerHTML='<div class="empty-state"><strong>Không tải được hàng chờ</strong><span>'+esc(e.message)+'</span></div>';return}
  REVIEW_QUEUE=queue;
  if(!SELECTED_REVIEW_ID||!queue.some(function(l){return l.id===SELECTED_REVIEW_ID})){SELECTED_REVIEW_ID=queue[0]?queue[0].id:null}
  var selected=queue.find(function(l){return l.id===SELECTED_REVIEW_ID});
  // fetchReviewQueue() chi tra ve nhat ky NOP THANG CHO MINH (hoac khong
  // chi dinh ai) - nhat ky KSV nop dich danh cho 1 cap pho khong hien o
  // day (yeu cau nguoi dung 2026-09-10).
  updatePendingBadge(queue.length);
  var h='<div class="toolbar"><div><h2>'+queue.length+' nhật ký chờ đánh giá</h2><p class="metric-context">Chỉ hiển thị nhật ký nộp cho bạn.</p></div></div>';
  h+='<div class="review-layout"><section>';
  h+='<details class="review-queue-details" '+(REVIEW_QUEUE_COLLAPSED?'':'open')+'><summary>Nhật ký chờ chấm điểm ('+queue.length+') <span class="review-queue-hint">(bấm để thu gọn/mở rộng)</span></summary><div class="review-queue">';
  h+=queue.length?groupQueueByAuthor(queue).map(authorQueueGroupHtml).join(''):'<div class="panel empty-state"><strong>Đã xử lý hết</strong><span>Không còn nhật ký nào chờ bạn chấm điểm.</span></div>';
  h+='</div></details>';
  h+='</section><section class="panel review-detail" id="reviewDetailSlot">'+(selected?reviewDetailHtml(selected):'<div class="empty-state"><strong>Không có nhật ký cần xử lý</strong><span>Hãy quay lại khi có nhật ký mới.</span></div>')+'</section></div>';
  $('appView').innerHTML=h;
  bindReviewQueueItemClicks();
  var queueDetails=$('appView').querySelector('.review-queue-details');
  if(queueDetails)queueDetails.addEventListener('toggle',function(){REVIEW_QUEUE_COLLAPSED=!queueDetails.open});
  if(selected)bindReviewActions(selected);
}

// Chon 1 nhat ky KHAC trong hang cho da tai san co trong bo nho
// (REVIEW_QUEUE) - chi doi panel chi tiet ben phai + trang thai chon o
// danh sach, KHONG goi lai rr() (se tai lai toan bo hang cho tu mang, xoa
// trang man hinh, cam giac giong nhu load lai trang).
function bindReviewQueueItemClicks(){
  document.querySelectorAll('[data-review-id]').forEach(function(b){b.addEventListener('click',function(){
    SELECTED_REVIEW_ID=b.dataset.reviewId;
    document.querySelectorAll('[data-review-id]').forEach(function(x){x.classList.toggle('is-selected',x===b)});
    var queueDetails=$('appView').querySelector('.review-queue-details');
    // Tren man hinh hep, chon xong tu thu gon hang cho de do phai cuon
    // qua het danh sach moi toi form cham diem (man hinh rong van hien
    // song song ca 2 ben nen khong can thu gon).
    if(window.innerWidth<=820){REVIEW_QUEUE_COLLAPSED=true;if(queueDetails)queueDetails.open=false}
    var slot=$('reviewDetailSlot');
    var selected=REVIEW_QUEUE.find(function(l){return l.id===SELECTED_REVIEW_ID});
    if(slot)slot.innerHTML=selected?reviewDetailHtml(selected):'<div class="empty-state"><strong>Không có nhật ký cần xử lý</strong><span>Hãy quay lại khi có nhật ký mới.</span></div>';
    if(selected)bindReviewActions(selected);
  })});
}

function reviewDetailHtml(log){
  if(isLeaveCategory(log.category_id))return leaveReviewDetailHtml(log);
  var hasSelfScore=log.self_complexity_score!=null&&log.self_quality_score!=null;
  var complexity=log.complexity_score||log.self_complexity_score||6;
  var quality=log.quality_score||log.self_quality_score||8;
  var resubmission=log.revision_count?'<div class="resubmission-context"><strong>Báo cáo đã được chỉnh sửa và trình lại lần '+log.revision_count+'</strong></div>':'';
  // "Tra de cham diem lai" (migration 00080) - cap tren cua chinh nguoi
  // dang xem (hoac cua nguoi se cham lai) vua tra ve pending. Chi nhat ky
  // nao dung do RPC nay tao ra moi co ca 2: rescoring_requested_by + con
  // review_comment (khac voi pending binh thuong chua ai cham lan nao).
  var rescoringNotice=log.rescoring_requested_by?('<div class="resubmission-context"><strong>Lãnh đạo cấp trên yêu cầu chấm lại'+(log._rescoringRequestedBy?(' · '+esc(log._rescoringRequestedBy.full_name)):'')+'</strong><span>'+esc(log.review_comment||'')+'</span></div>'):'';
  var selfScoreNote=hasSelfScore?'<div class="self-score-note"><span>Cán bộ tự chấm: Độ phức tạp <strong>'+log.self_complexity_score+'</strong> · Chất lượng <strong>'+log.self_quality_score+'</strong></span><button type="button" class="button button-secondary button-small" id="acceptSelfScore">Đồng ý với tự chấm</button></div>':'';
  return '<div class="panel-header"><div><span class="eyebrow">'+shortDate(log.log_date)+'</span><h2>'+esc(log.title)+'</h2><p>'+esc(log._author.full_name||'')+' · '+esc(log._author.title||'')+' · '+esc(unitShort(log.unit_id))+'</p></div></div>'
    +resubmission+rescoringNotice
    +'<div class="detail-section"><h3>Kết quả báo cáo</h3><p>'+esc(log.result)+'</p><div class="detail-grid"><div class="detail-item"><span>Lĩnh vực</span><strong>'+esc(catName(log.category_id))+'</strong></div><div class="detail-item"><span>Vai trò</span><strong>'+esc(WORK_ROLE_LABEL[log.work_role]||log.work_role)+'</strong></div><div class="detail-item"><span>Thời gian</span><strong>'+esc(DURATION_LABEL[log.duration]||log.duration)+'</strong></div><div class="detail-item"><span>Minh chứng</span><strong>'+esc(log.evidence||'Không có')+'</strong></div></div></div>'
    +'<div class="detail-section">'+selfScoreNote+'<div class="rating-grid">'
    +'<div class="rating-control"><div class="rating-head"><div><h3>Độ phức tạp</h3><span class="metric-context">Bản chất và phạm vi công việc</span></div><span class="rating-value" id="complexityValue">'+complexity+'</span></div><input id="complexityRange" type="range" min="1" max="10" value="'+complexity+'" aria-label="Điểm độ phức tạp"><div class="range-labels"><span>Đơn giản</span><span>Đặc biệt phức tạp</span></div>'+scoringGuideMarkup('complexity',complexity)+'</div>'
    +'<div class="rating-control"><div class="rating-head"><div><h3>Chất lượng</h3><span class="metric-context">Đúng, đủ, kịp thời và sử dụng được</span></div><span class="rating-value" id="qualityValue">'+quality+'</span></div><input id="qualityRange" type="range" min="1" max="10" value="'+quality+'" aria-label="Điểm chất lượng"><div class="range-labels"><span>Không đạt</span><span>Rất tốt</span></div>'+scoringGuideMarkup('quality',quality)+'</div>'
    +'</div></div>'
    +'<div class="detail-section"><label class="field"><span>Nhận xét của lãnh đạo</span><textarea id="reviewComment" rows="3" placeholder="Bắt buộc khi điểm chất lượng dưới 5 hoặc khi yêu cầu bổ sung"></textarea></label><div class="review-actions"><button class="button button-danger" id="requestRevision">Trả lại và yêu cầu bổ sung</button><button class="button button-secondary" id="approveLogWithJournal">Xác nhận, đồng thời ghi nhật ký của tôi</button><button class="button button-primary" id="approveLog">Xác nhận kết quả</button></div></div>';
}

var scoringGuides={
  complexity:[
    {max:2,title:'Đơn giản',text:'Công việc lặp lại, quy trình rõ ràng và phạm vi xử lý hẹp.'},
    {max:4,title:'Thông thường',text:'Có xử lý chuyên môn nhưng ít tình huống phát sinh hoặc phối hợp.'},
    {max:6,title:'Khá phức tạp',text:'Nhiều bước xử lý, cần phối hợp hoặc tổng hợp từ nhiều nguồn.'},
    {max:8,title:'Phức tạp',text:'Đòi hỏi chuyên môn sâu, xử lý tình huống khó hoặc có tác động đáng kể.'},
    {max:10,title:'Đặc biệt phức tạp',text:'Tác động lớn, nhiều bên liên quan hoặc cần giải pháp chuyên sâu.'}
  ],
  quality:[
    {max:2,title:'Không đạt',text:'Có sai sót nghiêm trọng, kết quả chưa sử dụng được hoặc phải làm lại.'},
    {max:4,title:'Cần bổ sung',text:'Kết quả chưa đầy đủ và cần chỉnh sửa đáng kể trước khi sử dụng.'},
    {max:6,title:'Đạt yêu cầu',text:'Hoàn thành yêu cầu cơ bản, kết quả có thể sử dụng.'},
    {max:8,title:'Khá',text:'Hoàn thành yêu cầu nhưng còn thiếu sót.'},
    {max:10,title:'Rất tốt',text:'Kết quả đúng - đủ - kịp thời - rõ ràng.'}
  ]
};
// Ghi chu them cho 2 dau muc thang diem chat luong (10 va 1) - nhac nguoi
// cham rang thanh tich noi bat/vi pham nghiem trong da co kenh rieng (diem
// dieu chinh dot xuat - xem score_adjustments/create_score_adjustment), tranh
// hieu nham phai "gong" ca thang 1-10 nay de phan anh nhung truong hop do.
function scoringGuideNote(type,value){
  if(type!=='quality')return '';
  var v=Number(value);
  if(v>=10)return ' (Trường hợp có thành tích nổi bật thì cho vào mục điểm cộng đột xuất)';
  if(v<=1)return ' (Trường hợp có vi phạm nghiêm trọng thì xem xét cho vào mục điểm trừ đột xuất)';
  return '';
}
function scoringGuide(type,value){
  var v=Number(value);
  var list=scoringGuides[type];
  for(var i=0;i<list.length;i++){if(v<=list[i].max)return list[i]}
  return list[list.length-1];
}
function scoringGuideMarkup(type,value){
  var guide=scoringGuide(type,value);
  var band=Number(value)<=4?'low':Number(value)<=8?'standard':'high';
  return '<div class="score-guide" id="'+type+'Guide" data-type="'+type+'" data-band="'+band+'" aria-live="polite"><strong id="'+type+'GuideTitle">Mức '+value+' · '+guide.title+'</strong><span id="'+type+'GuideText">'+guide.text+scoringGuideNote(type,value)+'</span></div>';
}
function updateScoringGuide(type,value){
  var guide=scoringGuide(type,value);
  var guideEl=$(type+'Guide');
  $(type+'Value').textContent=value;
  $(type+'GuideTitle').textContent='Mức '+value+' · '+guide.title;
  $(type+'GuideText').textContent=guide.text+scoringGuideNote(type,value);
  guideEl.dataset.band=Number(value)<=4?'low':Number(value)<=8?'standard':'high';
}

// Nhat ky nghi phep: khong cham diem, chi hien khoang ngay + 1 nut xac
// nhan da biet (acknowledge_leave_log, migration 00059).
function leaveReviewDetailHtml(log){
  var rangeText=log.range_start_date?(shortDate(log.range_start_date)+' – '+shortDate(log.log_date)):shortDate(log.log_date);
  var resubmission=log.revision_count?'<div class="resubmission-context"><strong>Báo cáo đã được chỉnh sửa và trình lại lần '+log.revision_count+'</strong></div>':'';
  return '<div class="panel-header"><div><span class="eyebrow">NGHỈ PHÉP</span><h2>'+esc(log._author.full_name||'')+'</h2><p>'+esc(log._author.title||'')+' · '+esc(unitShort(log.unit_id))+'</p></div></div>'
    +resubmission
    +'<div class="detail-section"><h3>Khoảng thời gian nghỉ phép</h3><p><strong>'+rangeText+'</strong></p>'+(log.result?'<p>'+esc(log.result)+'</p>':'')+'</div>'
    +'<div class="detail-section"><p class="metric-context">Nhật ký nghỉ phép không cần chấm điểm — bấm xác nhận để ghi nhận đã biết thông tin nghỉ phép này.</p><div class="review-actions"><button class="button button-primary" id="acknowledgeLeave">Xác nhận đã biết</button></div></div>';
}
function bindLeaveReviewActions(log){
  $('acknowledgeLeave').addEventListener('click',function(){applyLeaveAcknowledge(log)});
}
async function applyLeaveAcknowledge(log){
  if(!requireActive())return;
  var btn=$('acknowledgeLeave');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/acknowledge_leave_log',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:log.id})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    SELECTED_REVIEW_ID=null;
    showToast('Đã xác nhận nghỉ phép.');
    rr();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

function bindReviewActions(log){
  if(isLeaveCategory(log.category_id)){bindLeaveReviewActions(log);return}
  var complexity=$('complexityRange'),quality=$('qualityRange');
  complexity.addEventListener('input',function(){updateScoringGuide('complexity',complexity.value)});
  quality.addEventListener('input',function(){updateScoringGuide('quality',quality.value)});
  var acceptSelfScore=$('acceptSelfScore');
  if(acceptSelfScore)acceptSelfScore.addEventListener('click',function(){
    complexity.value=log.self_complexity_score;
    quality.value=log.self_quality_score;
    updateScoringGuide('complexity',log.self_complexity_score);
    updateScoringGuide('quality',log.self_quality_score);
  });
  $('approveLog').addEventListener('click',function(){applyReview(log,'approved')});
  $('approveLogWithJournal').addEventListener('click',function(){applyReview(log,'approved',true)});
  $('requestRevision').addEventListener('click',function(){applyReview(log,'revision')});
}

// withJournal: nut "Xac nhan, dong thoi ghi nhat ky cua toi" - hoat dong
// giong het "Giao viec va ghi nhat ky" (submitTaskAssignment) - xac nhan/
// cham diem xong, tu mo san form Ghi nhat ky moi dien san noi dung the
// hien lanh dao vua bo thoi gian duyet/danh gia cong tac nay, van phai tu
// xem lai/cham diem va bam Gui nhu nhat ky binh thuong (khong tu dong gui).
async function applyReview(log,status,withJournal){
  if(!requireActive())return;
  var complexity=Number($('complexityRange').value);
  var quality=Number($('qualityRange').value);
  var comment=$('reviewComment').value.trim();
  if((quality<5||status==='revision')&&!comment){
    showToast('Vui lòng nhập nhận xét cho mức điểm hoặc quyết định này.');
    $('reviewComment').focus();
    return;
  }
  var fn=status==='approved'?'approve_work_log':'reject_work_log';
  var body=status==='approved'
    ?{p_log_id:log.id,p_complexity_score:complexity,p_quality_score:quality,p_comment:comment||null}
    :{p_log_id:log.id,p_comment:comment};
  var btn=$(withJournal?'approveLogWithJournal':(status==='approved'?'approveLog':'requestRevision'));btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/'+fn,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body)});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    SELECTED_REVIEW_ID=null;
    showToast(status==='approved'?'Đã xác nhận và chấm điểm nhật ký.':'Đã gửi yêu cầu bổ sung.');
    rr();
    if(withJournal){
      var mgmtCat=CATS.find(function(c){return c.name==='Công tác khác'});
      var authorName=(log._author&&log._author.full_name)||'cán bộ';
      var resultText='Đã xem xét, đánh giá và chấm điểm công việc "'+log.title+'" của '+authorName+' - độ phức tạp '+complexity+'/10, chất lượng '+quality+'/10.'+(comment?(' Nhận xét: '+comment):'');
      await oj(null,null,null,{categoryId:mgmtCat?mgmtCat.id:'',title:'Duyệt và chấm điểm: '+log.title,result:resultText});
    }
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

// ============================================
// CAP TREN DIEU CHINH DIEM DA CHAM CUA CAP DUOI - mo lai duoc ca nhat ky
// da duyet, dieu kien: nguoi xem hop le de duyet duoc CHINH nguoi da cham
// truoc do (RPC override_work_log_score tu kiem tra lai o server).
// ============================================
var OVERRIDING_LOG_ID=null;

function openOverrideModal(logId){
  if(!requireActive())return;
  var log=UJ_LOGS.find(function(l){return l.id===logId});
  if(!log)return;
  OVERRIDING_LOG_ID=logId;
  var form=$('overrideScoreForm');form.reset();
  form.elements.overrideComplexity.value=log.complexity_score!=null?log.complexity_score:'';
  form.elements.overrideQuality.value=log.quality_score!=null?log.quality_score:'';
  $('overrideScoreModal').hidden=false;
  form.elements.overrideComplexity.focus();
}

function closeOverrideModal(){
  OVERRIDING_LOG_ID=null;
  $('overrideScoreModal').hidden=true;
}

async function submitOverrideScore(e){
  e.preventDefault();
  if(!requireActive())return;
  var f=new FormData($('overrideScoreForm'));
  var complexity=Number(f.get('overrideComplexity'));
  var quality=Number(f.get('overrideQuality'));
  var comment=(f.get('overrideComment')||'').trim();
  var btn=$('overrideScoreForm').querySelector('button[type=submit]');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/override_work_log_score',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:OVERRIDING_LOG_ID,p_complexity_score:complexity,p_quality_score:quality,p_comment:comment})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    closeOverrideModal();
    showToast('Đã điều chỉnh điểm và gửi thông báo.');
    ruj();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

// ============================================
// SUA DIEM DA CHAM (TAM THOI - migration 00081) - lanh dao tu sua diem
// CHINH MINH da cham, chi voi nhat ky trong thang hien tai. Khac
// openOverrideModal o cho: day la nhat ky nguoi dung LA reviewer_id (nut
// "Sua diem da cham" chi hien khi opts.canReviseOwn - xem ujLogCardOpts).
// De go tinh nang: xoa khoi migration list + go nut/dieu kien canReviseOwn
// + go 3 ham nay + modal reviseOwnScoreModal + 3 dong binding.
// ============================================
var REVISING_OWN_LOG_ID=null;

function openReviseOwnScoreModal(logId){
  if(!requireActive())return;
  var log=UJ_LOGS.find(function(l){return l.id===logId});
  if(!log)return;
  REVISING_OWN_LOG_ID=logId;
  var form=$('reviseOwnScoreForm');form.reset();
  form.elements.reviseComplexity.value=log.complexity_score!=null?log.complexity_score:'';
  form.elements.reviseQuality.value=log.quality_score!=null?log.quality_score:'';
  $('reviseOwnScoreModal').hidden=false;
  form.elements.reviseComplexity.focus();
}
function closeReviseOwnScoreModal(){
  REVISING_OWN_LOG_ID=null;
  $('reviseOwnScoreModal').hidden=true;
}
async function submitReviseOwnScore(e){
  e.preventDefault();
  if(!requireActive())return;
  var f=new FormData($('reviseOwnScoreForm'));
  var complexity=Number(f.get('reviseComplexity'));
  var quality=Number(f.get('reviseQuality'));
  var comment=(f.get('reviseComment')||'').trim();
  var btn=$('reviseOwnScoreForm').querySelector('button[type=submit]');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/revise_own_work_log_score',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:REVISING_OWN_LOG_ID,p_complexity_score:complexity,p_quality_score:quality,p_comment:comment||null})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    closeReviseOwnScoreModal();
    showToast('Đã sửa lại điểm.');
    ruj();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

// ============================================
// TRA DE CHAM DIEM LAI - cap tren (tu Truong phong/Vien truong khu vuc
// tro len) tra 1 nhat ky DA DUYET ve dung nguoi da cham truoc do de cham
// lai, kem 1 loi nhan bat buoc (vi du: bam nham "Xac nhan ket qua" trong
// khi y dinh la "Yeu cau bo sung"). Dung CHUNG dieu kien hien nut voi
// "Dieu chinh diem" (opts.canOverride o journalCardHtml) - RPC
// return_work_log_for_rescoring tu kiem tra lai o server (migration 00080).
// ============================================
var RETURNING_RESCORING_LOG_ID=null;

function openReturnRescoringModal(logId){
  if(!requireActive())return;
  RETURNING_RESCORING_LOG_ID=logId;
  $('returnRescoringForm').reset();
  $('returnRescoringModal').hidden=false;
  $('returnRescoringForm').elements.returnRescoringComment.focus();
}
function closeReturnRescoringModal(){
  RETURNING_RESCORING_LOG_ID=null;
  $('returnRescoringModal').hidden=true;
}

async function submitReturnRescoring(e){
  e.preventDefault();
  if(!requireActive())return;
  var comment=($('returnRescoringForm').elements.returnRescoringComment.value||'').trim();
  if(!comment){showToast('Vui lòng nhập lời nhắn cho người chấm lại.');return}
  var btn=$('returnRescoringForm').querySelector('button[type=submit]');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/return_work_log_for_rescoring',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:RETURNING_RESCORING_LOG_ID,p_comment:comment})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    closeReturnRescoringModal();
    showToast('Đã trả lại để chấm điểm lại.');
    ruj();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

// ============================================
// XOA NHAT KY NHAP NHAM/NHAP SAI - tac gia tu xoa duoc khi con "cho duyet"/
// "can bo sung"; lanh dao hop le (dung pham vi can_review_log) xoa duoc
// nhat ky cap duoi o bat ky trang thai nao, nhung bat buoc nhap ly do va
// tac gia duoc thong bao ngay (RPC delete_work_log, migration 00038).
// ============================================
var DELETING_LOG_ID=null;

function handleDeleteLogClick(button){
  if(!requireActive())return;
  var logId=button.dataset.deleteLog;
  var isSelf=button.dataset.deleteSelf==='1';
  if(isSelf){
    if(!confirm('Xoá nhật ký này? Sẽ chuyển vào Thùng rác, vẫn khôi phục lại được nếu cần.'))return;
    submitDeleteWorkLog(logId,null);
  }else{
    openDeleteLogModal(logId);
  }
}

function openDeleteLogModal(logId){
  DELETING_LOG_ID=logId;
  $('deleteLogForm').reset();
  $('deleteLogModal').hidden=false;
  $('deleteLogForm').elements.deleteLogReason.focus();
}
function closeDeleteLogModal(){DELETING_LOG_ID=null;$('deleteLogModal').hidden=true}

async function submitDeleteLogForm(e){
  e.preventDefault();
  var reason=($('deleteLogForm').elements.deleteLogReason.value||'').trim();
  if(!reason){showToast('Vui lòng nhập lý do xoá.');return}
  if(!confirm('Xoá nhật ký này? Tác giả sẽ nhận được thông báo kèm lý do. Sẽ chuyển vào Thùng rác, vẫn khôi phục lại được nếu cần.'))return;
  var logId=DELETING_LOG_ID;
  closeDeleteLogModal();
  await submitDeleteWorkLog(logId,reason);
}

async function submitDeleteWorkLog(logId,reason){
  try{
    var r=await fetch(API+'rpc/delete_work_log',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:logId,p_reason:reason})});
    var d=await r.json();
    if(!r.ok||d.success===false){showToast('Lỗi: '+((d&&d.error)||('HTTP '+r.status)));return}
    showToast('Đã xoá nhật ký.');
    if(V==='journal')rj();
    else if(V==='unitJournal')ruj();
  }catch(err){showToast('Lỗi: '+err.message)}
}

// ============================================
// NHAT KY CONG TAC CUA DON VI - tra cuu lich su day du (khong chi pending)
// cho lanh dao, theo don vi/pham vi da co san. RLS work_logs (unit/province/
// assigned) da cho phep xem toan bo trang thai, chi can mo rong truy van.
// ============================================
var UJ_MODE='person',UJ_UNIT_FILTER='all',UJ_SEARCH='',UJ_SELECTED_PERSON_ID=null,UJ_DAY_SELECTED=todayStr();
var UJ_PERIOD=ymStr(new Date().getFullYear(),new Date().getMonth());
var UJ_PEOPLE=[],UJ_LOGS=[];

async function fetchUnitJournalLogs(period){
  var unitIds=dashboardAvailableUnits().map(function(u){return u.id});
  if(!unitIds.length)return [];
  var parts=period.split('-');
  var start=period+'-01';
  var end=ymdStr(Number(parts[0]),Number(parts[1]),1);
  // submitted_to/reviewer JOIN truc tiep (giong het cach "Nhat ky cua toi"
  // - rj() - da lam) thay vi chi dua vao tim trong UJ_PEOPLE (pham vi chi
  // gom nguoi CUNG don vi voi nguoi xem) - tranh truong hop nop cho 1
  // nguoi ngoai pham vi do (vd Truong phong/Vien truong KV nop thang len
  // cap tinh) khien khong tim thay ten, hien "Nop cho" bi trong.
  var sel='id,author_id,unit_id,title,result,work_role,duration,evidence,category_id,created_at,updated_at,log_date,status,complexity_score,quality_score,self_complexity_score,self_quality_score,revision_count,review_comment,reviewer_id,submitted_to:submitted_to_id(full_name),reviewer:reviewer_id(full_name)';
  var r=await fetch(API+'work_logs?unit_id=in.('+unitIds.join(',')+')&log_date=gte.'+start+'&log_date=lt.'+end+'&deleted_at=is.null&select='+sel+'&order=log_date.desc,created_at.desc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  var logsResult=await r.json();
  var approvedIds=logsResult.filter(function(l){return l.status==='approved'}).map(function(l){return l.id});
  if(approvedIds.length){
    try{
      var rr=await fetch(API+'work_log_reviews?log_id=in.('+approvedIds.join(',')+')&select=log_id',{headers:authHeaders()});
      var reviewRows=rr.ok?await rr.json():[];
      var counts={};
      reviewRows.forEach(function(row){counts[row.log_id]=(counts[row.log_id]||0)+1});
      logsResult.forEach(function(l){l._reviewCount=counts[l.id]||0});
    }catch(e){}
  }
  return logsResult;
}

async function ruj(){
  $('pageEyebrow').textContent='TRA CỨU';$('pageTitle').textContent='Nhật ký công tác của đơn vị';
  if(!isLeader()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  try{
    UJ_PEOPLE=await fetchDashboardScopeProfiles();
    var rawLogs=await fetchUnitJournalLogs(UJ_PERIOD);
    // fetchUnitJournalLogs() chi loc theo don vi, chua loai nguoi CAO HON
    // viewer (vi du Pho phong khong duoc thay nhat ky cua Truong phong) -
    // UJ_PEOPLE da loc dung (filterVisibleInUnitScope), doi chieu lai o day.
    var visibleAuthorIds={};
    UJ_PEOPLE.forEach(function(p){visibleAuthorIds[p.id]=true});
    visibleAuthorIds[U.id]=true;
    UJ_LOGS=rawLogs.filter(function(l){return visibleAuthorIds[l.author_id]});
  }catch(e){
    $('appView').innerHTML='<div class="empty-state"><strong>Không tải được dữ liệu</strong><span>'+esc(e.message)+'</span></div>';
    return;
  }
  ujClampDaySelected();
  renderUnitJournalShell();
}

function ujFilteredPeople(){
  var list=UJ_UNIT_FILTER==='all'?UJ_PEOPLE:UJ_PEOPLE.filter(function(p){return p.unit_id===UJ_UNIT_FILTER});
  if(UJ_SEARCH){
    var q=UJ_SEARCH.normalize('NFC').toLowerCase();
    list=list.filter(function(p){return (p.full_name||'').normalize('NFC').toLowerCase().indexOf(q)>=0});
  }
  return list;
}

function ujFilteredLogs(){
  return UJ_UNIT_FILTER==='all'?UJ_LOGS:UJ_LOGS.filter(function(l){return l.unit_id===UJ_UNIT_FILTER});
}

function ujCountsByAuthor(logs){
  var map={};
  logs.forEach(function(l){
    var k=l.author_id;
    if(!map[k])map[k]={count:0,last:null};
    map[k].count++;
    if(!map[k].last||l.log_date>map[k].last)map[k].last=l.log_date;
  });
  return map;
}

// Nhom theo ngay (log_date), moi ngay sap xep theo gio nop moi nhat truoc.
// An toan: log thieu log_date van duoc gom vao 1 nhom rieng, khong bi rot.
function groupLogsByDate(logsList){
  var order=[],byDate={};
  logsList.forEach(function(l){
    var key=l.log_date||'__unknown__';
    if(!byDate[key]){byDate[key]={date:l.log_date||null,items:[]};order.push(key)}
    byDate[key].items.push(l);
  });
  var groups=order.map(function(k){return byDate[k]});
  groups.forEach(function(g){g.items.sort(function(a,b){return (b.created_at||'').localeCompare(a.created_at||'')})});
  groups.sort(function(a,b){return (b.date||'').localeCompare(a.date||'')});
  return groups;
}

function ujAuthorName(id){
  var p=UJ_PEOPLE.find(function(x){return x.id===id});
  if(!p)return 'Không xác định';
  var bio=personBioLine(p);
  return bio?p.full_name+' · '+bio:p.full_name;
}

// Khoang ngay hop le cua UJ_PERIOD ("YYYY-MM") - dung de gioi han o chon
// ngay cua tab "Theo ngay" (khong cho chon ngoai thang dang xem, vi
// UJ_LOGS chi tai du lieu cho dung 1 thang).
function ujPeriodStart(){return UJ_PERIOD+'-01'}
function ujPeriodEnd(){
  var parts=UJ_PERIOD.split('-'),y=Number(parts[0]),m=Number(parts[1]);
  return ymdStr(y,m-1,new Date(y,m,0).getDate());
}
// Giu UJ_DAY_SELECTED luon nam trong ky dang xem - goi lai moi khi doi Ky
// (trong ruj()). Uu tien mac dinh la HOM NAY neu roi dung vao ky dang
// xem (truong hop hay gap nhat - xem lich hien tai), khong thi ve ngay
// cuoi cung cua ky (thuong la ngay gan nhat co du lieu khi xem ky cu).
function ujClampDaySelected(){
  var start=ujPeriodStart(),end=ujPeriodEnd(),today=todayStr();
  if(UJ_DAY_SELECTED&&UJ_DAY_SELECTED>=start&&UJ_DAY_SELECTED<=end)return;
  UJ_DAY_SELECTED=(today>=start&&today<=end)?today:end;
}

function renderUnitJournalShell(){
  var availableUnits=dashboardAvailableUnits();
  var unitFilterHtml=availableUnits.length>1?'<label class="filter-field"><span>Đơn vị</span><select id="ujUnitFilter">'
    +'<option value="all">Tất cả đơn vị</option>'+availableUnits.map(function(u){return '<option value="'+u.id+'" '+(UJ_UNIT_FILTER===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')
    +'</select></label>':'';
  var periodFilterHtml='<label class="filter-field"><span>Kỳ</span><select id="ujPeriodFilter">'
    +recentPeriods().map(function(p){return '<option value="'+p+'" '+(UJ_PERIOD===p?'selected':'')+'>'+esc(periodLabel(p))+'</option>'}).join('')
    +'</select></label>';
  var searchHtml=(UJ_MODE==='person'&&!UJ_SELECTED_PERSON_ID)?'<label class="field"><span>Tìm theo tên</span><input type="text" id="ujSearchInput" value="'+esc(UJ_SEARCH)+'" placeholder="Nhập tên..."></label>':'';
  var dayFilterHtml=(UJ_MODE==='day')?'<label class="filter-field"><span>Ngày</span>'+dateOnlyFieldHtml('ujDayFilter',UJ_DAY_SELECTED)+'</label>':'';
  var h='<div class="toolbar uj-toolbar">'
    +'<div class="uj-mode-toggle">'
    +'<button type="button" class="uj-mode-btn '+(UJ_MODE==='person'?'is-active':'')+'" data-uj-mode="person">Theo người</button>'
    +'<button type="button" class="uj-mode-btn '+(UJ_MODE==='timeline'?'is-active':'')+'" data-uj-mode="timeline">Theo thời gian</button>'
    +'<button type="button" class="uj-mode-btn '+(UJ_MODE==='day'?'is-active':'')+'" data-uj-mode="day">Theo ngày</button>'
    +'</div>'+unitFilterHtml+periodFilterHtml+searchHtml+dayFilterHtml+'</div>';
  h+='<div id="ujContent"></div>';
  $('appView').innerHTML=h;
  renderUnitJournalContent();
  document.querySelectorAll('[data-uj-mode]').forEach(function(b){b.addEventListener('click',function(){UJ_MODE=b.dataset.ujMode;if(UJ_MODE==='day')ujClampDaySelected();renderUnitJournalShell()})});
  var unitSel=$('ujUnitFilter');if(unitSel)unitSel.addEventListener('change',function(e){UJ_UNIT_FILTER=e.target.value;UJ_SELECTED_PERSON_ID=null;renderUnitJournalShell()});
  $('ujPeriodFilter').addEventListener('change',function(e){UJ_PERIOD=e.target.value;ruj()});
  var searchInput=$('ujSearchInput');
  if(searchInput)searchInput.addEventListener('input',function(e){
    UJ_SEARCH=e.target.value;
    var caret=searchInput.selectionStart;
    renderUnitJournalContent();
    var ni=$('ujSearchInput');if(ni){ni.focus();ni.setSelectionRange(caret,caret)}
  });
  // O ngay go tay (xem dateOnlyFieldHtml) thay cho input[type=date] - doi
  // gia tri xong thi tu ep lai trong khoang ky dang xem (truoc day dung
  // thuoc tinh min/max cua input goc).
  var ujDayEl=$('ujDayFilter');
  if(ujDayEl)ujDayEl.addEventListener('change',function(){
    var v=readDateOnly('ujDayFilter',null);
    if(!v)return; // chua nhap ngay hop le
    var start=ujPeriodStart(),end=ujPeriodEnd();
    if(v<start)v=start;else if(v>end)v=end;
    UJ_DAY_SELECTED=v;
    renderUnitJournalContent();
  });
}

function renderUnitJournalContent(){
  var html;
  if(UJ_MODE==='timeline')html=renderUjTimelineHtml();
  else if(UJ_MODE==='day')html=renderUjDayHtml();
  else if(UJ_SELECTED_PERSON_ID)html=renderUjPersonDetailHtml(UJ_SELECTED_PERSON_ID);
  else html=renderUjPersonListHtml();
  $('ujContent').innerHTML=html;
  document.querySelectorAll('[data-uj-person]').forEach(function(b){b.addEventListener('click',function(){UJ_SELECTED_PERSON_ID=b.dataset.ujPerson;renderUnitJournalContent()})});
  var back=$('ujBackToList');if(back)back.addEventListener('click',function(){UJ_SELECTED_PERSON_ID=null;renderUnitJournalContent()});
  document.querySelectorAll('[data-uj-jump-person]').forEach(function(b){b.addEventListener('click',function(){UJ_MODE='person';UJ_SELECTED_PERSON_ID=b.dataset.ujJumpPerson;renderUnitJournalShell()})});
  document.querySelectorAll('[data-override-score]').forEach(function(b){b.addEventListener('click',function(){openOverrideModal(b.dataset.overrideScore)})});
  document.querySelectorAll('[data-return-rescoring]').forEach(function(b){b.addEventListener('click',function(){openReturnRescoringModal(b.dataset.returnRescoring)})});
  document.querySelectorAll('[data-revise-own-score]').forEach(function(b){b.addEventListener('click',function(){openReviseOwnScoreModal(b.dataset.reviseOwnScore)})});
  document.querySelectorAll('[data-delete-log]').forEach(function(b){b.addEventListener('click',function(){handleDeleteLogClick(b)})});
}

// Tach rieng "Nguoi lao dong" (support_staff) khoi "Can bo/KSV" - truoc
// day 1 danh sach phang lam kho quet mat khi 1 don vi co toi 30-70 nguoi
// (lai xe, bao ve, phuc vu... xen lan voi KSV/lanh dao).
function ujPersonCardHtml(p,counts){
  var c=counts[p.id]||{count:0,last:null};
  var bio=personBioLine(p);
  return '<button type="button" class="uj-person-card" data-uj-person="'+p.id+'">'
    +'<div class="uj-person-info"><strong>'+esc(p.full_name)+'</strong><span>'+(bio?esc(bio)+' · ':'')+esc(unitShort(p.unit_id))+'</span></div>'
    +'<div class="uj-person-stats"><span class="score-pill '+(c.count?'score-mid':'')+'">'+c.count+' nhật ký</span><span class="uj-last-date">'+(c.last?('Gần nhất: '+fullDate(c.last)):'Chưa nộp trong kỳ')+'</span></div>'
    +'</button>';
}

function renderUjPersonListHtml(){
  var people=ujFilteredPeople();
  if(!people.length)return '<div class="empty-state"><strong>Không có ai trong phạm vi này</strong></div>';
  var counts=ujCountsByAuthor(ujFilteredLogs());
  var staffGroup=people.filter(function(p){return p.role!=='support_staff'});
  var supportGroup=people.filter(function(p){return p.role==='support_staff'});
  var h='';
  if(staffGroup.length)h+='<div class="uj-group-heading">Cán bộ, công chức, Kiểm sát viên ('+staffGroup.length+')</div><div class="uj-person-list">'+staffGroup.map(function(p){return ujPersonCardHtml(p,counts)}).join('')+'</div>';
  if(supportGroup.length)h+='<div class="uj-group-heading">Người lao động ('+supportGroup.length+')</div><div class="uj-person-list">'+supportGroup.map(function(p){return ujPersonCardHtml(p,counts)}).join('')+'</div>';
  return h;
}

function renderUjPersonDetailHtml(personId){
  var person=UJ_PEOPLE.find(function(p){return p.id===personId});
  var personLogs=UJ_LOGS.filter(function(l){return l.author_id===personId});
  var groups=groupLogsByDate(personLogs);
  var h='<div class="uj-back"><button type="button" class="button button-secondary button-small" id="ujBackToList">← Quay lại danh sách</button></div>';
  var personBio=person?personBioLine(person):'';
  h+='<div class="panel-header"><div><h2>'+esc(person?person.full_name:'Không xác định')+'</h2><p>'+(personBio?esc(personBio)+' · ':'')+esc(person?unitShort(person.unit_id):'')+'</p></div></div>';
  h+=groups.length?groups.map(function(g){return ujDateGroupHtml(g)}).join(''):'<div class="empty-state"><strong>Không có nhật ký trong kỳ này</strong></div>';
  return h;
}

function renderUjTimelineHtml(){
  var groups=groupLogsByDate(ujFilteredLogs());
  if(!groups.length)return '<div class="empty-state"><strong>Không có nhật ký trong kỳ này</strong></div>';
  return groups.map(function(g){return ujDateGroupHtml(g,true)}).join('');
}

// Tinh san opts hien thi + quyen thao tac cho 1 nhat ky trong pham vi
// "Nhat ky cong tac cua don vi" - dung chung cho ujDateGroupHtml (xem
// theo thoi gian) VA renderUjDayHtml (xem theo ngay, muc "Theo ngay").
function ujLogCardOpts(l,showAuthor){
  var opts={readOnly:true};
  if(showAuthor){opts.authorName=ujAuthorName(l.author_id);opts.authorId=l.author_id}
  // Ten "Nop cho"/"Nguoi cham" lay truc tiep tu log.submitted_to/
  // log.reviewer (JOIN san o fetchUnitJournalLogs) trong journalCardHtml,
  // khong can tim trong UJ_PEOPLE nua (pham vi UJ_PEOPLE chi gom nguoi
  // CUNG don vi, se bo sot khi nop cho nguoi ngoai pham vi do). O day chi
  // con dung UJ_PEOPLE de tinh QUYEN "Dieu chinh diem" (can biet vai
  // tro/don vi cua nguoi da cham, khong the lay tu JOIN chi co full_name).
  if(l.status==='approved'&&l.reviewer_id&&l.reviewer_id!==U.id&&!isLeaveCategory(l.category_id)){
    var curReviewer=UJ_PEOPLE.find(function(p){return p.id===l.reviewer_id});
    if(curReviewer)opts.canOverride=canManagePerson(curReviewer);
  }
  // TAM THOI (migration 00081): lanh dao tu sua diem CHINH MINH da cham,
  // chi voi nhat ky trong THANG HIEN TAI (do co cau cham diem thay doi).
  if(l.status==='approved'&&l.reviewer_id===U.id&&!isLeaveCategory(l.category_id)&&(l.log_date||'').slice(0,7)===todayStr().slice(0,7)){
    opts.canReviseOwn=true;
  }
  var author=UJ_PEOPLE.find(function(p){return p.id===l.author_id});
  if(author)opts.canDelete=canReviewLog(l,author);
  return opts;
}

function ujDateGroupHtml(g,showAuthor){
  var items=g.items.map(function(l,idx){
    return '<div class="uj-numbered-item"><span class="queue-index">'+(idx+1)+'</span>'+journalCardHtml(l,ujLogCardOpts(l,showAuthor))+'</div>';
  }).join('');
  return '<div class="uj-date-group"><div class="uj-date-group-header"><strong>'+esc(fullDate(g.date)||'Không xác định ngày')+'</strong><span>'+g.items.length+' việc</span></div><div class="uj-date-items">'+items+'</div></div>';
}

// ============================================
// "THEO NGAY" - xem nhanh 1 ngay cu the: ai da nop viec, ai dang nghi
// phep, ai chua nop - de lanh dao don doc kip thoi (thay vi phai cuon het
// "Theo thoi gian" ca thang moi tim duoc dung ngay can xem, va truoc day
// khong co cach nao biet duoc AI CHUA nop - chi thay duoc ai DA nop).
// Khong can fetch them gi - UJ_LOGS/UJ_PEOPLE da co san ca thang, chi loc
// lai theo dung ngay dang chon.
// ============================================
function ujDaySubmittedCardHtml(entry){
  var p=entry.person,logs=entry.logs;
  var itemsHtml=logs.map(function(l){return journalCardHtml(l,ujLogCardOpts(l,false))}).join('');
  var bio1=personBioLine(p);return '<details class="uj-day-card"><summary><span class="uj-day-card-name">'+esc(p.full_name)+'</span><span class="uj-day-card-meta">'+(bio1?esc(bio1)+' · ':'')+esc(unitShort(p.unit_id))+'</span><span class="meta-tag">'+logs.length+' nhật ký</span></summary><div class="uj-day-card-logs">'+itemsHtml+'</div></details>';
}
function ujDayLeaveCardHtml(entry){
  var p=entry.person;
  var bio2=personBioLine(p);return '<div class="uj-day-card is-static"><span class="uj-day-card-name">'+esc(p.full_name)+'</span><span class="uj-day-card-meta">'+(bio2?esc(bio2)+' · ':'')+esc(unitShort(p.unit_id))+'</span></div>';
}
function ujDayMissingCardHtml(p){
  var bio3=personBioLine(p);return '<button type="button" class="uj-day-card is-missing" data-uj-jump-person="'+p.id+'"><span class="uj-day-card-name">'+esc(p.full_name)+'</span><span class="uj-day-card-meta">'+(bio3?esc(bio3)+' · ':'')+esc(unitShort(p.unit_id))+'</span></button>';
}

function renderUjDayHtml(){
  var dateStr=UJ_DAY_SELECTED;
  var people=ujFilteredPeople();
  if(!dateStr||!people.length)return '<div class="empty-state"><strong>Không có ai trong phạm vi này</strong></div>';
  var logsOfDay=ujFilteredLogs().filter(function(l){return l.log_date===dateStr});
  var byAuthor={};
  logsOfDay.forEach(function(l){(byAuthor[l.author_id]=byAuthor[l.author_id]||[]).push(l)});
  // 1 nguoi co the vua co viec vua co nghi phep cung 1 ngay (hiem nhung
  // khong loai tru) - uu tien xep vao "da nop" neu co it nhat 1 viec
  // thuc su, chi xep "nghi phep" khi CHI co dong nghi phep.
  var submitted=[],onLeave=[],missing=[];
  people.forEach(function(p){
    var logs=byAuthor[p.id]||[];
    var workLogs=logs.filter(function(l){return !isLeaveCategory(l.category_id)});
    if(workLogs.length){submitted.push({person:p,logs:workLogs});return}
    var leaveLogs=logs.filter(function(l){return isLeaveCategory(l.category_id)});
    if(leaveLogs.length){onLeave.push({person:p,logs:leaveLogs});return}
    missing.push(p);
  });
  var weekday=new Date(dateStr+'T00:00:00').getDay();
  var weekendNote=(weekday===0||weekday===6)?'<p class="metric-context uj-day-weekend-note">Hôm '+(weekday===0?'nay là Chủ nhật':'nay là Thứ Bảy')+' — bình thường sẽ không có ai ghi nhật ký, danh sách "Chưa nộp" dưới đây không hẳn cần đôn đốc.</p>':'';
  var h='<div class="uj-day-header"><h2>'+esc(fullDateLabelVi(dateStr))+'</h2><div class="uj-day-stats">'
    +'<span class="uj-day-stat tone-submitted">'+submitted.length+'/'+people.length+' đã nộp việc</span>'
    +(onLeave.length?'<span class="uj-day-stat tone-leave">'+onLeave.length+' nghỉ phép</span>':'')
    +'<span class="uj-day-stat tone-missing">'+missing.length+' chưa nộp</span>'
    +'</div></div>'+weekendNote;
  h+='<div class="uj-day-section"><h3>Đã nộp việc hôm nay ('+submitted.length+')</h3>'
    +(submitted.length?'<div class="uj-day-list">'+submitted.map(ujDaySubmittedCardHtml).join('')+'</div>':'<div class="empty-state compact-empty"><strong>Chưa ai nộp việc</strong></div>')
    +'</div>';
  if(onLeave.length){
    h+='<div class="uj-day-section"><h3>Nghỉ phép hôm nay ('+onLeave.length+')</h3><div class="uj-day-list">'+onLeave.map(ujDayLeaveCardHtml).join('')+'</div></div>';
  }
  h+='<div class="uj-day-section"><h3>Chưa nộp ('+missing.length+')</h3>'
    +(missing.length?'<div class="uj-day-list">'+missing.map(ujDayMissingCardHtml).join('')+'</div>':'<div class="empty-state compact-empty"><strong>Mọi người đã nộp đủ</strong></div>')
    +'</div>';
  return h;
}

// ============================================
// DANH GIA THANG - thang diem 0-100 kem xep loai A/B/C theo quy dinh nganh
// ============================================
var CURRENT_PERIOD=ymStr(new Date().getFullYear(),new Date().getMonth());
var MONTHLY_ROWS=[],SELECTED_MONTHLY_ID=null,MONTHLY_UNIT_FILTER=FILTER_PREFS.monthlyUnit||'all',MONTHLY_SEARCH='';

function periodLabel(p){var parts=p.split('-');return 'Tháng '+parts[1]+'/'+parts[0]}
function recentPeriods(){
  var now=new Date(),periods=[];
  for(var i=0;i<6;i++){
    periods.push(ymStr(now.getFullYear(),now.getMonth()-i));
  }
  return periods;
}

function canApproveMonthly(person){
  if(!person||person.id===U.id)return false;
  if(person.role==='administrator')return false;
  if(U.rl==='province_head')return person.role==='province_deputy'||person.role==='unit_head';
  if(U.rl==='province_deputy')return person.role==='unit_head'&&(U.assignedUnits||[]).indexOf(person.unit_id)>=0;
  if(U.rl==='unit_head')return person.unit_id===U.uid&&person.role!=='unit_head';
  if(U.rl==='unit_deputy')return U.hasFullDelegation&&person.unit_id===U.uid&&person.role!=='unit_head';
  return false;
}

async function fetchMonthlyScopeProfiles(){
  var sel='id,full_name,title,professional_title,birth_year,role,unit_id,initials';
  // Uy quyen xem/xuat bao cao tong hop thang (migration 00077) - kiem tra
  // TRUOC MOI nhanh vai tro khac: dung y "them 1 quyen xem toan tinh", giu
  // nguyen vai tro goc o moi man hinh khac (khong doi U.rl) nhung rieng
  // man hinh nay (va man xuat bao cao dung chung ham nay) luon xem duoc
  // toan tinh nhu Vien truong, bat ke vai tro goc la gi.
  if(U.hasMonthlyReportDelegation){
    var rD=await fetch(API+'profiles?role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!rD.ok)throw new Error('HTTP '+rD.status);
    return await rD.json();
  }
  if(U.rl==='staff'||U.rl==='support_staff'){
    return [{id:U.id,full_name:U.n,title:U.tl,professional_title:'',role:U.rl,unit_id:U.uid,initials:U.in}];
  }
  if(U.rl==='unit_head'||U.rl==='unit_deputy'){
    var r=await fetch(API+'profiles?unit_id=eq.'+U.uid+'&role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return filterVisibleInUnitScope(await r.json());
  }
  if(U.rl==='province_deputy'&&!U.hasFullDelegation){
    var ids=(U.assignedUnits||[]);
    if(!ids.length)return [];
    var r2=await fetch(API+'profiles?unit_id=in.('+ids.join(',')+')&role=eq.unit_head&select='+sel,{headers:authHeaders()});
    if(!r2.ok)throw new Error('HTTP '+r2.status);
    return await r2.json();
  }
  // Xem giai thich o fetchDashboardScopeProfiles - Pho Vien truong dang
  // duoc uy quyen thay mat toan tinh thi xem toan bo giong Vien truong.
  var r3=await fetch(API+'profiles?role=neq.administrator&select='+sel,{headers:authHeaders()});
  if(!r3.ok)throw new Error('HTTP '+r3.status);
  return await r3.json();
}

async function monthlyEvidence(userId){
  var start=CURRENT_PERIOD+'-01';
  var parts=CURRENT_PERIOD.split('-');
  // parts[1] la thang 1-index (VD "08"); ymdStr nhan thang 0-index nen
  // Number(parts[1]) (khong -1) chinh la thang KE TIEP theo 0-index.
  var end=ymdStr(Number(parts[0]),Number(parts[1]),1);
  var items=[];
  try{
    // is_clone=eq.false: loai cac dong tu sinh cua "cong viec nhieu ngay"
    // (xem migration 00057/00058) - khong de 1 viec keo dai nhieu ngay bi
    // tinh nang len nhieu lan chi vi duoc nhan ban ra tung ngay.
    var r=await fetch(API+'work_logs?author_id=eq.'+userId+'&log_date=gte.'+start+'&log_date=lt.'+end+'&is_clone=eq.false&deleted_at=is.null&select=status,category_id,complexity_score,quality_score',{headers:authHeaders()});
    items=r.ok?await r.json():[];
  }catch(e){}
  // Nhat ky nghi phep khong tinh vao khoi luong/ty le xu ly cong viec.
  items=items.filter(function(l){return !isLeaveCategory(l.category_id)});
  var approved=items.filter(function(l){return l.status==='approved'});
  var reviewed=items.filter(function(l){return l.status==='approved'||l.status==='revision'});
  // Ca do phuc tap lan chat luong deu tinh BINH QUAN (khong cong don) -
  // dung cho moi so luong nhat ky trong thang, tranh hieu nham "lam nhieu
  // viec hon" thanh "diem cao hon" chi vi so luong.
  var avgComplexity=approved.length?approved.reduce(function(s,l){return s+(l.complexity_score||0)},0)/approved.length:0;
  var avgQuality=approved.length?approved.reduce(function(s,l){return s+(l.quality_score||0)},0)/approved.length:0;
  return {
    total:items.length,
    approved:approved.length,
    complexity:avgComplexity,
    quality:avgQuality,
    reviewRate:items.length?reviewed.length/items.length*100:0
  };
}

// Diem cong/tru dot xuat (khen thuong/ky luat phat hien sau khi thang da
// cham xong) - luon thuoc dung 1 nguoi + 1 ky, khong bao gio bi ghi de
// (moi lan dieu chinh la 1 dong moi) - xem migration 00066.
async function fetchScoreAdjustmentsFor(userId,period){
  try{
    var r=await fetch(API+'score_adjustments?user_id=eq.'+userId+'&period=eq.'+period+'&select=id,delta,reason,created_at,created_by:created_by(full_name)&order=created_at.desc',{headers:authHeaders()});
    return r.ok?await r.json():[];
  }catch(e){return []}
}

async function rm(){
  $('pageEyebrow').textContent='ĐÁNH GIÁ THÁNG';$('pageTitle').textContent='Chấm điểm và xếp loại tháng';
  if(U.rl==='administrator'){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var people;
  try{people=await fetchMonthlyScopeProfiles()}catch(e){$('appView').innerHTML='<div class="empty-state"><strong>Lỗi tải danh sách</strong><span>'+esc(e.message)+'</span></div>';return}
  // O loc "Don vi" CHI hien voi Vien truong tinh/Quan tri (xem isProvinceScope
  // ben duoi) - nhung gia tri MONTHLY_UNIT_FILTER lai luu chung 1 cho o
  // localStorage cho MOI tai khoan dung CUNG trinh duyet. Neu truoc do 1
  // tai khoan Vien truong tinh da loc theo 1 don vi CU THE, gia tri do se
  // "dinh lai" va bi ap dung nham cho ca Truong phong/Pho phong dang nhap
  // sau (du ho khong he thay o loc nay) - loc mat luon ca don vi cua chinh
  // ho, ra trang trong hoan toan. Chi ap dung o loc khi ROLE THUC SU co
  // quyen dung no (yeu cau nguoi dung, 2026-09-09).
  var isProvinceScope=(U.rl==='province_head'||U.rl==='administrator'||U.hasMonthlyReportDelegation);
  if(isProvinceScope&&MONTHLY_UNIT_FILTER!=='all')people=people.filter(function(p){return p.unit_id===MONTHLY_UNIT_FILTER});

  var ids=people.map(function(p){return p.id});
  var reviews=[];
  if(ids.length){
    try{
      var rr2=await fetch(API+'monthly_reviews?period=eq.'+CURRENT_PERIOD+'&user_id=in.('+ids.join(',')+')',{headers:authHeaders()});
      reviews=rr2.ok?await rr2.json():[];
    }catch(e){}
  }
  var rows=people.map(function(p){return {person:p,review:reviews.find(function(rv){return rv.user_id===p.id})||null}});
  MONTHLY_ROWS=rows;

  var approved=rows.filter(function(x){return x.review&&x.review.status==='approved'});
  var counts={A:0,B:0,C:0};
  approved.forEach(function(x){if(counts[x.review.classification]!=null)counts[x.review.classification]++});
  var deltas=approved.filter(function(x){return x.review.self_score!=null&&x.review.official_score!=null}).map(function(x){return Math.abs(x.review.official_score-x.review.self_score)});
  var avgDelta=deltas.length?deltas.reduce(function(a,b){return a+b},0)/deltas.length:0;

  var unitFilterHtml='';
  if(isProvinceScope){
    unitFilterHtml='<label class="filter-field"><span>Đơn vị</span><select id="monthlyUnitFilter"><option value="all">Tất cả đơn vị</option>'
      +UNITS.filter(function(u){return u.type!=='province'}).map(function(u){return '<option value="'+u.id+'" '+(MONTHLY_UNIT_FILTER===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')
      +'</select></label>';
  }

  // Lan dau mo trang (chua chon ai) - uu tien mac dinh chon DUNG chinh
  // minh (neu nam trong pham vi dang xem) thay vi nguoi DAU TIEN server
  // tra ve (thu tu khong on dinh, khong lien quan gi den nguoi dang dang
  // nhap) - truoc day lanh dao mo trang len de thay ho so cua 1 nguoi
  // ngau nhien (thuong 0 nhat ky) thay vi cua chinh minh, tuong nham la
  // loi "khong hien nhat ky cua ban than" (yeu cau nguoi dung, 2026-09-09).
  if(!SELECTED_MONTHLY_ID||!rows.some(function(x){return x.person.id===SELECTED_MONTHLY_ID})){
    var selfRow=rows.find(function(x){return x.person.id===U.id});
    SELECTED_MONTHLY_ID=selfRow?selfRow.person.id:(rows[0]?rows[0].person.id:null);
  }
  var selected=rows.find(function(x){return x.person.id===SELECTED_MONTHLY_ID});
  var evidence=selected?await monthlyEvidence(selected.person.id):null;
  var adjustments=selected?await fetchScoreAdjustmentsFor(selected.person.id,CURRENT_PERIOD):[];

  var h='<div class="toolbar"><label class="filter-field"><span>Kỳ đánh giá</span><select id="monthlyPeriodSelect">'
    +recentPeriods().map(function(p){return '<option value="'+p+'" '+(p===CURRENT_PERIOD?'selected':'')+'>'+esc(periodLabel(p))+'</option>'}).join('')
    +'</select></label>'+unitFilterHtml+'<label class="field"><span>Tìm theo tên</span><input type="text" id="monthlySearchInput" value="'+esc(MONTHLY_SEARCH)+'" placeholder="Nhập tên..."></label><div class="spacer"></div><button class="button button-secondary" id="exportMonthly">'+((U.rl==='staff'||U.rl==='support_staff')&&!U.hasMonthlyReportDelegation?'Xuất nhật ký tháng':'Xuất báo cáo tháng')+'</button></div>';
  h+='<div class="metric-grid">'
    +metricCard('Hồ sơ trong phạm vi',rows.length,approved.length+' hồ sơ đã duyệt','')
    +metricCard('Xếp loại A',counts.A,counts.B+' xếp loại B','green')
    +metricCard('Chênh lệch bình quân',avgDelta.toFixed(1),'Điểm tự chấm ↔ điểm chính thức','gold')
    +metricCard('Chờ hoàn thành',rows.length-approved.length,'Tự chấm hoặc chờ duyệt','blue')
    +'</div>';
  h+='<div class="monthly-layout"><section class="panel monthly-table-panel"><div class="panel-header"><div><h2>Danh sách đánh giá tháng</h2><p>'+esc(periodLabel(CURRENT_PERIOD))+'</p></div></div><div id="monthlyTableSlot">'+monthlyTableHtml(monthlyFilteredRows(rows))+'</div></section>';
  h+='<section class="panel monthly-detail" id="monthlyDetailSlot">'+(selected?monthlyDetailHtml(selected,evidence,adjustments):'<div class="empty-state"><strong>Không có hồ sơ</strong><span>Chưa có dữ liệu phù hợp với phạm vi này.</span></div>')+'</section></div>';
  $('appView').innerHTML=h;

  bindMonthlyTableRowClicks();
  var filterEl=$('monthlyUnitFilter');
  if(filterEl)filterEl.addEventListener('change',function(e){MONTHLY_UNIT_FILTER=e.target.value;saveFilterPrefs({monthlyUnit:MONTHLY_UNIT_FILTER});SELECTED_MONTHLY_ID=null;rm()});
  $('monthlyPeriodSelect').addEventListener('change',function(e){CURRENT_PERIOD=e.target.value;SELECTED_MONTHLY_ID=null;rm()});
  var searchInput=$('monthlySearchInput');
  searchInput.addEventListener('input',function(e){
    MONTHLY_SEARCH=e.target.value;
    var focusPos=searchInput.selectionStart;
    renderMonthlyTableOnly();
    var newInput=$('monthlySearchInput');
    newInput.focus();
    newInput.setSelectionRange(focusPos,focusPos);
  });
  $('exportMonthly').addEventListener('click',openExportModal);
  if(selected)bindMonthlyDetailActions(selected);
}

function bindMonthlyDetailActions(selected){
  var saveBtn=$('saveMonthlyReview');if(saveBtn)saveBtn.addEventListener('click',function(){saveMonthlyApprove(selected)});
  var officialScoreInput=$('officialScore'),classificationSelect=$('classification');
  if(officialScoreInput&&classificationSelect)officialScoreInput.addEventListener('input',function(){
    var suggestion=classificationFromScore(officialScoreInput.value);
    if(suggestion)classificationSelect.value=suggestion;
  });
  var selfBtn=$('saveSelfScore');if(selfBtn)selfBtn.addEventListener('click',function(){saveMonthlySelfScore()});
  var headSelfBtn=$('saveHeadSelfEvaluation');if(headSelfBtn)headSelfBtn.addEventListener('click',saveHeadSelfEvaluation);
  var headSelfScoreInput=$('headSelfScore'),headSelfClassificationSelect=$('headSelfClassification');
  if(headSelfScoreInput&&headSelfClassificationSelect)headSelfScoreInput.addEventListener('input',function(){
    var suggestion=classificationFromScore(headSelfScoreInput.value);
    if(suggestion)headSelfClassificationSelect.value=suggestion;
  });
  var jumpBtn=$('appView').querySelector('[data-jump-score-adjustments]');
  if(jumpBtn)jumpBtn.addEventListener('click',function(){SA_JUMP_PERSON_ID=jumpBtn.dataset.jumpScoreAdjustments;setView('scoreAdjustments');render()});
}

async function submitScoreAdjustment(){
  if(!requireActive())return;
  var userSelect=$('scoreAdjustmentUser'),typeSelect=$('scoreAdjustmentType'),deltaInput=$('scoreAdjustmentDelta'),reasonInput=$('scoreAdjustmentReason');
  var userId=userSelect?userSelect.value:'';
  var type=typeSelect?typeSelect.value:'';
  var amount=Number(deltaInput.value);
  var reason=(reasonInput.value||'').trim();
  if(!userId){showToast('Vui lòng chọn người cần điều chỉnh.');return}
  if(type!=='plus'&&type!=='minus'){showToast('Vui lòng chọn loại điều chỉnh: điểm cộng hoặc điểm trừ.');return}
  if(!isFinite(amount)||amount<=0){showToast('Vui lòng nhập số điểm lớn hơn 0.');deltaInput.focus();return}
  if(!reason){showToast('Vui lòng nhập lý do/căn cứ.');reasonInput.focus();return}
  var delta=type==='minus'?-amount:amount;
  var btn=$('saveScoreAdjustment');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/create_score_adjustment',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:userId,p_delta:delta,p_reason:reason})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast('Đã lưu điều chỉnh điểm.');
    typeSelect.value='';deltaInput.value='';reasonInput.value='';
    rsa();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

async function deleteScoreAdjustment(id){
  if(!confirm('Xoá điều chỉnh điểm này?'))return;
  try{
    var r=await fetch(API+'rpc/delete_score_adjustment',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_id:id})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast('Đã xoá điều chỉnh.');
    rsa();
  }catch(e){showToast('Lỗi: '+e.message)}
}

// ============================================
// "DIEM CONG/TRU DOT XUAT" - tab RIENG (tach khoi "Cham diem thang" theo
// yeu cau nguoi dung - tinh nang nay du lon, co thong ke rieng, nhet vao
// 1 nguoi dang xem o "Cham diem thang" bi roi). Dung lai dung RPC/bang da
// co (migration 00065/00066, xem create_score_adjustment/
// delete_score_adjustment o tren) - chi khac cach hien thi: liet ke toan
// bo pham vi quan ly + thong ke tong hop, thay vi gan cung vao 1 ho so.
// ============================================
var SA_PERIOD=ymStr(new Date().getFullYear(),new Date().getMonth());
var SA_SEARCH='';
var SA_SCOPE_PEOPLE=[];
var SA_ROWS=[];
var SA_JUMP_PERSON_ID=null;

async function rsa(){
  $('pageEyebrow').textContent='ĐỘT XUẤT';$('pageTitle').textContent='Điểm cộng/trừ đột xuất';
  if(U.rl==='administrator'){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var scopePeople=[];
  try{scopePeople=await fetchMonthlyScopeProfiles()}catch(e){}
  // Chi giu dung nhung nguoi THAT SU dieu chinh duoc (khop dung dieu kien
  // RPC se kiem tra o server) - tranh cho chon 1 nguoi roi bam luu moi bao
  // loi, vi fetchMonthlyScopeProfiles() tra ve rong hon (vd Vien truong
  // tinh thay ca danh sach de hien bang "Cham diem thang" nhung chi duoc
  // dieu chinh dung Pho Vien truong tinh/Truong phong).
  SA_SCOPE_PEOPLE=scopePeople.filter(function(p){return p.id!==U.id&&canApproveMonthly(p)});
  var rows=[];
  try{
    // RLS tu gioi han dung pham vi (chinh minh, HOAC nguoi minh co quyen
    // duyet xep loai thang, HOAC - rieng Pho phong - ca don vi minh de XEM
    // du chua duoc uy quyen, xem migration 00068) - khong can loc them o
    // client.
    var r=await fetch(API+'score_adjustments?period=eq.'+SA_PERIOD+'&select=id,user_id,delta,reason,created_at,person:user_id(full_name,title,unit_id),created_by:created_by(full_name)&order=created_at.desc',{headers:authHeaders()});
    rows=r.ok?await r.json():[];
  }catch(e){}
  SA_ROWS=rows;
  renderSaShell();
}

function saFilteredRows(){
  if(!SA_SEARCH)return SA_ROWS;
  var q=SA_SEARCH.normalize('NFC').toLowerCase();
  return SA_ROWS.filter(function(a){return ((a.person&&a.person.full_name)||'').normalize('NFC').toLowerCase().indexOf(q)>=0});
}

function saListHtml(){
  var canManage=SA_SCOPE_PEOPLE.length>0;
  var rows=saFilteredRows();
  return rows.length?'<div class="score-adjustment-list">'+rows.map(function(a){return scoreAdjustmentRowHtml(a,canManage,true)}).join(''):'<div class="empty-state compact-empty"><strong>Chưa có điều chỉnh nào</strong><span>Trong phạm vi và kỳ đang xem chưa có điều chỉnh điểm đột xuất nào.</span></div>';
}

function renderSaShell(){
  var canManage=SA_SCOPE_PEOPLE.length>0;
  var plusSum=SA_ROWS.filter(function(a){return Number(a.delta)>0}).reduce(function(s,a){return s+Number(a.delta)},0);
  var minusSum=SA_ROWS.filter(function(a){return Number(a.delta)<0}).reduce(function(s,a){return s+Number(a.delta)},0);
  var peopleCount=Array.from(new Set(SA_ROWS.map(function(a){return a.user_id}))).length;
  var jumpSelected=SA_JUMP_PERSON_ID&&SA_SCOPE_PEOPLE.some(function(p){return p.id===SA_JUMP_PERSON_ID})?SA_JUMP_PERSON_ID:'';
  SA_JUMP_PERSON_ID=null;
  // O tim theo ten: hien bat ky khi nao thay DU LIEU CUA NHIEU NGUOI (vd
  // Pho phong xem duoc ca don vi tu migration 00068 nhung khong tu THEM
  // duoc dieu chinh cho ai) - khong con gan voi rieng quyen "quan ly"
  // (canManage) nua, tranh an mat o tim can thiet o nhung tai khoan chi
  // xem.
  var canSearch=canManage||peopleCount>1;

  var h='<div class="toolbar"><label class="filter-field"><span>Kỳ</span><select id="saPeriodSelect">'
    +recentPeriods().map(function(p){return '<option value="'+p+'" '+(p===SA_PERIOD?'selected':'')+'>'+esc(periodLabel(p))+'</option>'}).join('')
    +'</select></label>'
    +(canSearch?'<label class="field"><span>Tìm theo tên</span><input type="text" id="saSearchInput" value="'+esc(SA_SEARCH)+'" placeholder="Nhập tên..."></label>':'')
    +'</div>';

  h+='<div class="metric-grid">'
    +metricCard('Tổng lượt điều chỉnh',SA_ROWS.length,periodLabel(SA_PERIOD),'')
    +metricCard('Tổng điểm đã cộng','+'+plusSum,'Trong kỳ đang xem','green')
    +metricCard('Tổng điểm đã trừ',minusSum,'Trong kỳ đang xem','gold')
    +metricCard('Số người liên quan',peopleCount,'Trong kỳ đang xem','blue')
    +'</div>';

  if(canManage){
    h+='<section class="panel" style="padding:18px;margin-bottom:16px"><h3 style="margin:0 0 12px">+ Thêm điều chỉnh đột xuất</h3>'
      +'<p class="metric-context" style="margin:0 0 12px">Luôn áp dụng cho tháng hiện tại ('+esc(periodLabel(ymStr(new Date().getFullYear(),new Date().getMonth())))+') tại thời điểm lưu - không sửa lại điểm các kỳ đã chốt trước đó, kể cả khi đang xem kỳ khác ở trên. Nếu liên quan đến việc ở tháng khác, ghi rõ trong lý do.</p>'
      +'<div class="form-grid compact-form">'
      +'<label class="field field-wide"><span>Người cần điều chỉnh</span><select id="scoreAdjustmentUser"><option value="">Chọn người...</option>'+SA_SCOPE_PEOPLE.map(function(p){return '<option value="'+p.id+'" '+(p.id===jumpSelected?'selected':'')+'>'+esc(p.full_name)+' · '+esc(unitShort(p.unit_id))+'</option>'}).join('')+'</select></label>'
      +'<label class="field"><span>Loại điều chỉnh</span><select id="scoreAdjustmentType"><option value="">Chọn loại...</option><option value="plus">Điểm cộng (khen thưởng)</option><option value="minus">Điểm trừ (kỷ luật)</option></select></label>'
      +'<label class="field"><span>Số điểm</span><input id="scoreAdjustmentDelta" type="number" min="0" step="0.5" placeholder="Ví dụ: 5"></label>'
      +'<label class="field field-wide"><span>Lý do / căn cứ</span><textarea id="scoreAdjustmentReason" rows="2" placeholder="Ví dụ: Hồ sơ vụ án ABC bị trả vì thiếu chứng cứ, phát hiện ngày .../.../..."></textarea></label>'
      +'</div><div class="review-actions"><button type="button" class="button button-primary" id="saveScoreAdjustment">Lưu điều chỉnh</button></div></section>';
  }

  h+='<section class="panel" style="padding:18px"><h3 style="margin:0 0 12px">Danh sách điều chỉnh — '+esc(periodLabel(SA_PERIOD))+'</h3><div id="saListSlot">'+saListHtml()+'</div></section>';

  $('appView').innerHTML=h;
  $('saPeriodSelect').addEventListener('change',function(e){SA_PERIOD=e.target.value;rsa()});
  var saveBtn=$('saveScoreAdjustment');if(saveBtn)saveBtn.addEventListener('click',submitScoreAdjustment);
  bindSaListActions();
  var searchInput=$('saSearchInput');
  if(searchInput)searchInput.addEventListener('input',function(e){
    SA_SEARCH=e.target.value;
    var caret=searchInput.selectionStart;
    $('saListSlot').innerHTML=saListHtml();
    bindSaListActions();
    var ni=$('saSearchInput');if(ni){ni.focus();ni.setSelectionRange(caret,caret)}
  });
}

function bindSaListActions(){
  document.querySelectorAll('[data-delete-adjustment]').forEach(function(b){b.addEventListener('click',function(){deleteScoreAdjustment(b.dataset.deleteAdjustment)})});
}

// Loc theo ten (khong doi MONTHLY_ROWS goc) - can thiet tu khi 1 don vi
// co toi 30-70 nguoi thay vi vai nguoi nhu truoc, cuon tim thu cong rat
// lau. Chi loc RIENG bang danh sach, khong dong lai metric-grid/chi tiet
// ben phai (dung y nghia "tim de chon nhanh 1 dong", khong phai bo loc
// pham vi).
function monthlyFilteredRows(rows){
  if(!MONTHLY_SEARCH)return rows;
  var q=MONTHLY_SEARCH.normalize('NFC').toLowerCase();
  return rows.filter(function(x){return (x.person.full_name||'').normalize('NFC').toLowerCase().indexOf(q)>=0});
}

function bindMonthlyTableRowClicks(){
  document.querySelectorAll('[data-monthly-user]').forEach(function(b){b.addEventListener('click',function(){
    SELECTED_MONTHLY_ID=b.dataset.monthlyUser;
    document.querySelectorAll('#monthlyTableSlot tr').forEach(function(tr){tr.classList.toggle('is-selected-row',tr.contains(b))});
    redrawMonthlyDetail();
  })});
}

// Chon 1 nguoi KHAC trong bang (da tai san co trong MONTHLY_ROWS) - chi
// doi panel "Xem can cu" ben phai, KHONG dong lai toan bo trang/bang/bo
// loc nhu rm() (van can goi mang RIENG cho "can cu" cua dung nguoi vua
// chon vi day la du lieu chi tiet, chua tai san cho tat ca moi nguoi).
async function redrawMonthlyDetail(){
  var slot=$('monthlyDetailSlot');
  if(!slot)return;
  var selected=MONTHLY_ROWS.find(function(x){return x.person.id===SELECTED_MONTHLY_ID});
  if(!selected){slot.innerHTML='<div class="empty-state"><strong>Không có hồ sơ</strong><span>Chưa có dữ liệu phù hợp với phạm vi này.</span></div>';return}
  slot.innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var evidence,adjustments;
  try{
    var results=await Promise.all([monthlyEvidence(selected.person.id),fetchScoreAdjustmentsFor(selected.person.id,CURRENT_PERIOD)]);
    evidence=results[0];adjustments=results[1];
  }catch(e){slot.innerHTML='<div class="empty-state"><strong>Không tải được dữ liệu</strong><span>'+esc(e.message)+'</span></div>';return}
  if(SELECTED_MONTHLY_ID!==selected.person.id)return; // da chon nguoi khac trong luc cho
  slot.innerHTML=monthlyDetailHtml(selected,evidence,adjustments);
  bindMonthlyDetailActions(selected);
}

// Ve lai RIENG bang danh sach (khong goi lai rm() - tranh fetch mang lai
// tren moi lan go phim tim kiem, vi rm() la async fetch toan bo trang).
function renderMonthlyTableOnly(){
  var slot=$('monthlyTableSlot');
  if(!slot)return;
  slot.innerHTML=monthlyTableHtml(monthlyFilteredRows(MONTHLY_ROWS));
  bindMonthlyTableRowClicks();
}

function monthlyRowHtml(x){
  var p=x.person,rv=x.review;
  return '<tr class="'+(p.id===SELECTED_MONTHLY_ID?'is-selected-row':'')+'"><td><div class="person-cell"><span class="mini-avatar">'+esc(p.initials||'')+'</span><div><strong>'+esc(p.full_name)+'</strong><span>'+esc(p.professional_title||'')+(p.birth_year?(' · Sinh '+p.birth_year):'')+'</span></div></div></td><td>'+esc(p.title||'')+'</td><td>'+esc(unitShort(p.unit_id))+'</td><td class="numeric">'+(rv&&rv.self_score!=null?rv.self_score:'—')+'</td><td class="numeric"><strong>'+(rv&&rv.official_score!=null?rv.official_score:'—')+'</strong></td><td class="numeric"><span class="grade-badge grade-'+((rv&&rv.classification)||'pending').toLowerCase()+'">'+((rv&&rv.classification)||'Chờ')+'</span></td><td class="numeric"><button class="button button-secondary button-small" data-monthly-user="'+p.id+'">Xem căn cứ</button></td></tr>';
}

// Tach rieng "Nguoi lao dong" (support_staff) khoi "Can bo/KSV" bang 1
// dong tieu de gom nhom (colspan) - cung ly do voi renderUjPersonListHtml.
function monthlyTableHtml(rows){
  if(!rows.length)return '<div class="empty-state"><strong>Không có dữ liệu</strong><span>Hãy chọn phạm vi khác.</span></div>';
  var staffRows=rows.filter(function(x){return x.person.role!=='support_staff'});
  var supportRows=rows.filter(function(x){return x.person.role==='support_staff'});
  var body='';
  if(staffRows.length)body+='<tr class="table-group-row"><td colspan="7">Cán bộ, công chức, Kiểm sát viên ('+staffRows.length+')</td></tr>'+staffRows.map(monthlyRowHtml).join('');
  if(supportRows.length)body+='<tr class="table-group-row"><td colspan="7">Người lao động ('+supportRows.length+')</td></tr>'+supportRows.map(monthlyRowHtml).join('');
  return '<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Chức vụ, chức danh</th><th>Đơn vị</th><th class="numeric">Tự chấm</th><th class="numeric">Chính thức</th><th class="numeric">Xếp loại</th><th></th></tr></thead><tbody>'
    +body
    +'</tbody></table></div>';
}

// Diem cong/tru dot xuat: 1 dong = 1 lan dieu chinh, khong bao gio ghi de
// (xem migration 00066). canDelete = dung tham quyen duyet xep loai thang
// cua CHINH NGUOI bi/duoc ap dung (khong phai nguoi tao dong nay).
// showPerson=true (dung o tab rieng liet ke NHIEU nguoi) hien them ten
// nguoi bi/duoc ap dung ngay tren dau dong.
function scoreAdjustmentRowHtml(a,canDelete,showPerson){
  var deltaNum=Number(a.delta);
  var sign=deltaNum>0?'+':'';
  var tone=deltaNum>0?'is-positive':'is-negative';
  var who=(a.created_by&&a.created_by.full_name)||'—';
  var personName=(showPerson&&a.person)?a.person.full_name:null;
  return '<div class="score-adjustment-item '+tone+'">'
    +'<div class="score-adjustment-main">'
    +(personName?'<span class="score-adjustment-person">'+esc(personName)+'</span>':'')
    +'<strong>'+sign+deltaNum+' điểm</strong><span>'+esc(a.reason)+'</span></div>'
    +'<div class="score-adjustment-meta"><span>'+esc(who)+' · '+shortDateTime(a.created_at)+'</span>'
    +(canDelete?'<button type="button" class="button button-danger button-small" data-delete-adjustment="'+a.id+'">Xoá</button>':'')
    +'</div></div>';
}

function monthlyDetailHtml(x,evidence,adjustments){
  adjustments=adjustments||[];
  var person=x.person,row=x.review||{};
  var mayApprove=canApproveMonthly(person);
  var isSelf=person.id===U.id;
  var cls=(row.classification||'pending').toLowerCase();
  var adjSum=adjustments.reduce(function(s,a){return s+Number(a.delta)},0);
  // Goi y diem chinh thuc: neu CHUA tung duyet ky nay thi cong them dieu
  // chinh dot xuat vao diem tu cham lam diem khoi diem; neu DA duyet roi
  // thi giu nguyen dung diem da co (tranh cong don 2 lan neu lanh dao mo
  // lai sua) - lanh dao van sua tay duoc binh thuong.
  var suggestedScore=row.official_score!=null?row.official_score:Math.max(0,Math.min(100,(row.self_score!=null?row.self_score:0)+adjSum));
  // Chi hien 1 dong tom tat + link nhay sang tab rieng "Diem cong/tru dot
  // xuat" (rsa()) - man hinh quan ly day du (them moi/xoa/liet ke) da
  // tach het ra do, khong con nhet vao day nua (theo yeu cau nguoi dung -
  // tinh nang nay du lon, co thong ke rieng, de o day bi roi).
  var adjustmentsSectionHtml=adjustments.length?(
    '<button type="button" class="score-adjustment-banner '+(adjSum>0?'is-positive':'is-negative')+'" data-jump-score-adjustments="'+person.id+'">'
    +'<span>Có '+adjustments.length+' điều chỉnh đột xuất trong tháng này ('+(adjSum>0?'+':'')+adjSum+' điểm)</span><span class="score-adjustment-banner-link">Xem chi tiết →</span>'
    +'</button>'
  ):'';
  var bio=personBioLine(person);return '<div class="panel-header"><div><span class="eyebrow">HỒ SƠ ĐÁNH GIÁ THÁNG</span><h2>'+esc(person.full_name)+'</h2><p>'+(bio?esc(bio)+' · ':'')+esc(unitShort(person.unit_id))+'</p></div><span class="grade-seal grade-'+cls+'">'+(row.classification||'…')+'</span></div>'
    +'<div class="evidence-grid"><div><span>Nhật ký</span><strong>'+evidence.total+'</strong></div><div><span>Được công nhận</span><strong>'+evidence.approved+'</strong></div><div><span>Độ phức tạp bình quân</span><strong>'+(evidence.complexity?evidence.complexity.toFixed(1):'—')+'</strong></div><div><span>Chất lượng bình quân</span><strong>'+(evidence.quality?evidence.quality.toFixed(1):'—')+'</strong></div></div>'
    +'<div class="detail-section"><h3>Căn cứ hỗ trợ quyết định</h3><p class="metric-context">Dữ liệu nhật ký chỉ là căn cứ tham khảo; người có thẩm quyền vẫn quyết định điểm chính thức và xếp loại theo quy định.</p><div class="progress-line"><span>Tỷ lệ nhật ký đã xử lý</span><strong>'+evidence.reviewRate.toFixed(0)+'%</strong><div class="bar-track"><div class="bar-fill green" style="width:'+evidence.reviewRate+'%"></div></div></div></div>'
    +'<div class="detail-section"><div class="detail-grid"><div class="detail-item"><span>Điểm tự chấm</span><strong>'+(row.self_score!=null?row.self_score:'Chưa có')+'</strong></div><div class="detail-item"><span>Điểm được duyệt</span><strong>'+(row.official_score!=null?row.official_score:'Chưa duyệt')+'</strong></div></div></div>'
    +(row.note?('<div class="override-feedback"><strong>Giải trình khi chấm điểm chính thức</strong><span>'+esc(row.note)+'</span></div>'):'')
    +adjustmentsSectionHtml
    +(mayApprove?('<div class="detail-section"><div class="form-grid compact-form"><label class="field"><span>Điểm chính thức</span><input id="officialScore" type="number" min="0" max="100" step="0.25" value="'+suggestedScore+'"></label><label class="field"><span>Xếp loại</span><select id="classification"><option '+(row.classification==='A'?'selected':'')+'>A</option><option '+(row.classification==='B'?'selected':'')+'>B</option><option '+(row.classification==='C'?'selected':'')+'>C</option><option '+(row.classification==='D'?'selected':'')+'>D</option></select></label><label class="field field-wide"><span>Nhận xét/giải trình điều chỉnh</span><textarea id="monthlyNote" rows="2">'+esc(row.note||'')+'</textarea></label></div><div class="review-actions"><button class="button button-primary" id="saveMonthlyReview">Duyệt và lưu</button></div></div>'):'')
    +(isSelf&&person.role==='province_head'?('<div class="detail-section"><p class="metric-context">Viện trưởng tỉnh không có cấp trên trong hệ thống nên tự chấm điểm và tự xếp loại; không có điểm duyệt chính thức.</p><div class="form-grid compact-form"><label class="field"><span>Điểm tự chấm</span><input id="headSelfScore" type="number" min="0" max="100" step="0.25" value="'+(row.self_score!=null?row.self_score:0)+'"></label><label class="field"><span>Xếp loại</span><select id="headSelfClassification"><option '+(row.classification==='A'?'selected':'')+'>A</option><option '+(row.classification==='B'?'selected':'')+'>B</option><option '+(row.classification==='C'?'selected':'')+'>C</option><option '+(row.classification==='D'?'selected':'')+'>D</option></select></label></div><div class="review-actions"><button class="button button-primary" id="saveHeadSelfEvaluation">Lưu điểm và xếp loại</button></div></div>'):'')
    +(isSelf&&person.role!=='province_head'?('<div class="detail-section"><label class="field"><span>Điểm tự chấm của cá nhân</span><input id="selfScore" type="number" min="0" max="100" step="0.25" value="'+(row.self_score!=null?row.self_score:0)+'"></label><div class="review-actions"><button class="button button-primary" id="saveSelfScore">Lưu điểm tự chấm</button></div></div>'):'')
    +(!mayApprove&&!isSelf?'<div class="permission-note">Vai trò hiện tại chỉ được xem hồ sơ này; không có quyền thay đổi kết quả.</div>':'');
}

async function saveHeadSelfEvaluation(){
  if(!requireActive())return;
  var val=Number($('headSelfScore').value);
  var classification=$('headSelfClassification').value;
  if(!isFinite(val)||val<0||val>100){showToast('Điểm tự chấm phải nằm trong khoảng 0–100.');return}
  var btn=$('saveHeadSelfEvaluation');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/save_province_head_self_evaluation',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_period:CURRENT_PERIOD,p_score:val,p_classification:classification})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast('Đã lưu điểm tự chấm và tự xếp loại.');
    rm();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

async function saveMonthlySelfScore(){
  if(!requireActive())return;
  var val=Number($('selfScore').value);
  if(!isFinite(val)||val<0||val>100){showToast('Điểm tự chấm phải nằm trong khoảng 0–100.');return}
  var btn=$('saveSelfScore');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/save_monthly_self_score',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_period:CURRENT_PERIOD,p_score:val})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast('Đã lưu điểm tự chấm và gửi người có thẩm quyền.');
    rm();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

async function saveMonthlyApprove(x){
  if(!requireActive())return;
  var score=Number($('officialScore').value);
  var classification=$('classification').value;
  var note=$('monthlyNote').value.trim();
  if(!isFinite(score)||score<0||score>100){showToast('Điểm chính thức phải nằm trong khoảng 0–100.');return}
  var selfScore=x.review&&x.review.self_score;
  if(selfScore!=null&&Math.abs(score-selfScore)>=2&&!note){showToast('Vui lòng nhập giải trình khi điều chỉnh từ 2 điểm trở lên.');return}
  var btn=$('saveMonthlyReview');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/approve_monthly_review',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:x.person.id,p_period:CURRENT_PERIOD,p_score:score,p_classification:classification,p_note:note||null})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast('Đã lưu điểm chính thức và xếp loại.');
    rm();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

// ============================================
// XUAT BAO CAO THANG - hop thoai chon ky, canh bao thieu du lieu, xuat
// Excel (chinh sua duoc) hoac PDF (de in, tranh sua du lieu).
// ============================================
var EXPORT_SCOPE_CACHE=null;

async function monthlyExportScope(period){
  var people=await fetchMonthlyScopeProfiles();
  var ids=people.map(function(p){return p.id});
  var reviews=[];
  if(ids.length){
    try{
      var r=await fetch(API+'monthly_reviews?period=eq.'+period+'&user_id=in.('+ids.join(',')+')',{headers:authHeaders()});
      reviews=r.ok?await r.json():[];
    }catch(e){}
  }
  return people.map(function(p){return {person:p,review:reviews.find(function(rv){return rv.user_id===p.id})||null}});
}

async function getExportScope(period){
  if(EXPORT_SCOPE_CACHE&&EXPORT_SCOPE_CACHE.period===period)return EXPORT_SCOPE_CACHE.scope;
  var scope=await monthlyExportScope(period);
  EXPORT_SCOPE_CACHE={period:period,scope:scope};
  return scope;
}

function monthlyExportSections(scope){
  var groupA=scope.filter(function(x){return ['province_head','province_deputy','unit_head'].indexOf(x.person.role)>=0})
    .sort(function(a,b){return (a.person.full_name||'').localeCompare(b.person.full_name||'','vi')});
  var groupB=scope.filter(function(x){return ['unit_deputy','staff'].indexOf(x.person.role)>=0})
    .sort(function(a,b){return unitShort(a.person.unit_id).localeCompare(unitShort(b.person.unit_id),'vi')||(a.person.full_name||'').localeCompare(b.person.full_name||'','vi')});
  var groupC=scope.filter(function(x){return x.person.role==='support_staff'})
    .sort(function(a,b){return unitShort(a.person.unit_id).localeCompare(unitShort(b.person.unit_id),'vi')||(a.person.full_name||'').localeCompare(b.person.full_name||'','vi')});
  return [
    {title:'I. VIỆN TRƯỞNG VIỆN KSND TỈNH BẮC NINH ĐÁNH GIÁ, CHẤM ĐIỂM, XẾP LOẠI',items:groupA},
    {title:'II. THỦ TRƯỞNG ĐƠN VỊ CƠ SỞ ĐÁNH GIÁ, CHẤM ĐIỂM, XẾP LOẠI CÁN BỘ, CÔNG CHỨC',items:groupB},
    // STT rieng cho nhom Nguoi lao dong, dung mau goc (khac 2 nhom tren chay STT lien tuc)
    {title:'III. THỦ TRƯỞNG ĐƠN VỊ CƠ SỞ ĐÁNH GIÁ, CHẤM ĐIỂM, XẾP LOẠI NGƯỜI LAO ĐỘNG',items:groupC,resetStt:true}
  ];
}

// Diem duyet chinh thuc cua Vien truong tinh khong tinh la "thieu" - theo
// thiet ke, ho tu cham va tu xep loai, khong ai duyet chinh thuc cho ho.
function monthlyExportCompleteness(scope){
  var missingSelf=0,missingOfficial=0,missingClassification=0,officialApplicable=0,byUnit={};
  scope.forEach(function(x){
    var person=x.person,review=x.review,missing=[];
    if(!review||review.self_score==null){missing.push('chưa tự chấm điểm');missingSelf++}
    if(person.role!=='province_head'){
      officialApplicable++;
      if(!review||review.official_score==null){missing.push('chưa có điểm duyệt chính thức');missingOfficial++}
    }
    if(!review||review.classification==null){missing.push('chưa xếp loại');missingClassification++}
    if(missing.length){
      if(!byUnit[person.unit_id])byUnit[person.unit_id]=[];
      byUnit[person.unit_id].push({person:person,missing:missing});
    }
  });
  return {total:scope.length,missingSelf:missingSelf,missingOfficial:missingOfficial,missingClassification:missingClassification,officialApplicable:officialApplicable,byUnit:byUnit};
}

// Nhan vien/KSV thuong khong co ai "duoi quyen" de tong hop bang diem, nen
// chi hien khu "Nhat ky chi tiet" (xuat nhat ky cua chinh ho trong ky) -
// khu "Bao cao tong hop diem" chi hien cho lanh dao (yeu cau nguoi dung,
// 2026-09-08).
async function openExportModal(){
  var isIndividual=(U.rl==='staff'||U.rl==='support_staff')&&!U.hasMonthlyReportDelegation;
  $('exportModalTitle').textContent=isIndividual?'Xuất nhật ký tháng':'Xuất báo cáo chấm điểm tháng';
  $('exportScoreSection').hidden=isIndividual;
  var select=$('exportPeriodSelect');
  select.innerHTML=recentPeriods().map(function(p){return '<option value="'+p+'" '+(p===CURRENT_PERIOD?'selected':'')+'>'+esc(periodLabel(p))+'</option>'}).join('');
  $('exportModal').hidden=false;
  if(!isIndividual)await renderExportSummary(select.value);
}

function closeExportModal(){$('exportModal').hidden=true}

async function renderExportSummary(period){
  $('exportSummary').innerHTML='<div class="demo-notice export-summary-notice"><strong>Đang kiểm tra dữ liệu…</strong></div>';
  $('exportIncompleteGroups').innerHTML='';
  var scope;
  try{scope=await getExportScope(period)}catch(e){$('exportSummary').innerHTML='<div class="empty-state"><strong>Lỗi tải dữ liệu</strong><span>'+esc(e.message)+'</span></div>';return}
  var stats=monthlyExportCompleteness(scope);
  $('exportSummary').innerHTML='<div class="demo-notice export-summary-notice"><strong>Kiểm tra trước khi xuất</strong><span>'+(stats.total-stats.missingSelf)+'/'+stats.total+' đã tự chấm điểm · '+(stats.officialApplicable-stats.missingOfficial)+'/'+stats.officialApplicable+' đã có điểm duyệt chính thức · '+(stats.total-stats.missingClassification)+'/'+stats.total+' đã xếp loại. Người còn thiếu sẽ để trống ô tương ứng khi xuất, không chờ.</span></div>';
  var unitIds=Object.keys(stats.byUnit).sort(function(a,b){return unitShort(a).localeCompare(unitShort(b),'vi')});
  $('exportIncompleteGroups').innerHTML=unitIds.length?unitIds.map(function(unitId){
    var items=stats.byUnit[unitId];
    return '<details class="unit-group"><summary><strong>'+esc(unitShort(unitId))+'</strong><span>'+items.length+' người còn thiếu</span></summary><div class="export-missing-list">'+items.map(function(item){return '<div class="export-missing-row"><strong>'+esc(item.person.full_name)+'</strong><span>'+esc(item.missing.join(', '))+'</span></div>'}).join('')+'</div></details>';
  }).join(''):'<div class="empty-state compact-empty"><strong>Đã đầy đủ dữ liệu</strong><span>Tất cả nhân sự trong phạm vi đã tự chấm điểm, được duyệt điểm chính thức và xếp loại.</span></div>';
}

async function fetchProvinceHeadName(){
  try{
    var r=await fetch(API+'profiles?role=eq.province_head&select=full_name&limit=1',{headers:authHeaders()});
    var d=r.ok?await r.json():[];
    return d[0]?d[0].full_name:'';
  }catch(e){return ''}
}

var EXCEL_BORDER={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};

async function exportMonthlyExcel(period){
  var scope,headName;
  try{
    scope=await getExportScope(period);
    headName=await fetchProvinceHeadName();
  }catch(e){showToast('Lỗi: '+e.message);return}
  var sections=monthlyExportSections(scope);
  var workbook=new ExcelJS.Workbook();
  var sheet=workbook.addWorksheet('Tổng hợp',{pageSetup:{orientation:'landscape',fitToPage:true}});
  sheet.columns=[{width:6},{width:26},{width:20},{width:18},{width:24},{width:12},{width:10},{width:10}];

  var r=1;
  sheet.mergeCells('A'+r+':D'+r);
  sheet.getCell('A'+r).value='VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO';
  sheet.getCell('A'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value='CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  sheet.getCell('E'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.getCell('E'+r).alignment={horizontal:'center'};
  r++;
  sheet.mergeCells('A'+r+':D'+r);
  sheet.getCell('A'+r).value='VIỆN KIỂM SÁT NHÂN DÂN TỈNH BẮC NINH';
  sheet.getCell('A'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value='Độc lập - Tự do - Hạnh phúc';
  sheet.getCell('E'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.getCell('E'+r).alignment={horizontal:'center'};
  r+=2;
  sheet.mergeCells('A'+r+':H'+r);
  sheet.getCell('A'+r).value='THÔNG BÁO';
  sheet.getCell('A'+r).font={bold:true,size:14,name:'Times New Roman'};
  sheet.getCell('A'+r).alignment={horizontal:'center'};
  r++;
  sheet.mergeCells('A'+r+':H'+r);
  sheet.getCell('A'+r).value='Tổng hợp kết quả đánh giá, chấm điểm, xếp loại công chức và người lao động';
  sheet.getCell('A'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.getCell('A'+r).alignment={horizontal:'center'};
  r++;
  var periodParts=period.split('-'),exportYear=periodParts[0],exportMonth=periodParts[1];
  sheet.mergeCells('A'+r+':H'+r);
  sheet.getCell('A'+r).value='tháng '+Number(exportMonth)+' năm '+exportYear;
  sheet.getCell('A'+r).font={italic:true,name:'Times New Roman',size:12};
  sheet.getCell('A'+r).alignment={horizontal:'center'};
  r+=2;

  var headerRow1=r,headerRow2=r+1;
  sheet.mergeCells('A'+headerRow1+':A'+headerRow2); sheet.getCell('A'+headerRow1).value='Số TT';
  sheet.mergeCells('B'+headerRow1+':B'+headerRow2); sheet.getCell('B'+headerRow1).value='Họ và tên';
  sheet.mergeCells('C'+headerRow1+':D'+headerRow1); sheet.getCell('C'+headerRow1).value='Chức vụ, chức danh';
  sheet.getCell('C'+headerRow2).value='Chức vụ';
  sheet.getCell('D'+headerRow2).value='Chức danh';
  sheet.mergeCells('E'+headerRow1+':E'+headerRow2); sheet.getCell('E'+headerRow1).value='Đơn vị công tác';
  sheet.mergeCells('F'+headerRow1+':F'+headerRow2); sheet.getCell('F'+headerRow1).value='Điểm tự chấm';
  sheet.mergeCells('G'+headerRow1+':H'+headerRow1); sheet.getCell('G'+headerRow1).value='Điểm được duyệt chính thức';
  sheet.getCell('G'+headerRow2).value='Điểm';
  sheet.getCell('H'+headerRow2).value='Xếp loại';
  ['A','B','C','D','E','F','G','H'].forEach(function(col){[headerRow1,headerRow2].forEach(function(row){
    var cell=sheet.getCell(col+row);
    cell.font={bold:true,name:'Times New Roman',size:11};
    cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};
    cell.border=EXCEL_BORDER;
  })});
  r=headerRow2+1;

  var stt=1;
  sections.forEach(function(section){
    if(!section.items.length)return;
    if(section.resetStt)stt=1;
    sheet.mergeCells('A'+r+':H'+r);
    var titleCell=sheet.getCell('A'+r);
    titleCell.value=section.title;
    titleCell.font={bold:true,name:'Times New Roman',size:11};
    r++;
    section.items.forEach(function(x){
      var person=x.person,review=x.review;
      sheet.getCell('A'+r).value=stt++;
      sheet.getCell('B'+r).value=person.full_name;
      sheet.getCell('C'+r).value=person.title||'';
      sheet.getCell('D'+r).value=person.professional_title||'';
      sheet.getCell('E'+r).value=unitShort(person.unit_id);
      sheet.getCell('F'+r).value=(review&&review.self_score!=null)?review.self_score:'';
      sheet.getCell('G'+r).value=person.role==='province_head'?'':((review&&review.official_score!=null)?review.official_score:'');
      sheet.getCell('H'+r).value=(review&&review.classification)?review.classification:'';
      ['A','B','C','D','E','F','G','H'].forEach(function(col){
        var cell=sheet.getCell(col+r);
        cell.border=EXCEL_BORDER;
        cell.font={name:'Times New Roman',size:11};
        if(['A','F','G','H'].indexOf(col)>=0)cell.alignment={horizontal:'center'};
      });
      r++;
    });
  });

  r++;
  var today=new Date();
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value='Bắc Ninh, ngày '+today.getDate()+' tháng '+(today.getMonth()+1)+' năm '+today.getFullYear();
  sheet.getCell('E'+r).font={italic:true,name:'Times New Roman',size:11};
  sheet.getCell('E'+r).alignment={horizontal:'center'};
  r++;
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value='VIỆN TRƯỞNG';
  sheet.getCell('E'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.getCell('E'+r).alignment={horizontal:'center'};
  r+=3;
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value=headName||'';
  sheet.getCell('E'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.getCell('E'+r).alignment={horizontal:'center'};

  var buffer=await workbook.xlsx.writeBuffer();
  var link=document.createElement('a');
  link.href=NativeURL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  link.download='tong-hop-cham-diem-'+period+'.xlsx';
  link.click();
  NativeURL.revokeObjectURL(link.href);
  showToast('Đã xuất file Excel.');
}

var PDF_EXPORT_CSS=''
  +'.pdf-export-root { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #111; background: #fff; padding: 14mm; box-sizing: border-box; }'
  +'.pdf-export-root .letterhead { display: flex; justify-content: space-between; margin-bottom: 16px; }'
  +'.pdf-export-root .letterhead div { text-align: center; }'
  +'.pdf-export-root .letterhead strong { display: block; }'
  +'.pdf-export-root h1 { text-align: center; font-size: 15pt; margin: 4px 0; }'
  +'.pdf-export-root .subtitle { text-align: center; font-weight: bold; margin: 2px 0; }'
  +'.pdf-export-root .period { text-align: center; font-style: italic; margin: 2px 0 16px; }'
  +'.pdf-export-root table { width: 100%; border-collapse: collapse; }'
  +'.pdf-export-root th, .pdf-export-root td { border: 1px solid #333; padding: 4px 6px; font-size: 10.5pt; }'
  +'.pdf-export-root th { text-align: center; font-weight: bold; }'
  +'.pdf-export-root td.c { text-align: center; }'
  +'.pdf-export-root tr { break-inside: avoid; page-break-inside: avoid; }'
  +'.pdf-export-root .section-row td { font-weight: bold; text-align: left; background: #f3f3f3; }'
  +'.pdf-export-root .person-row td { font-weight: bold; font-style: italic; text-align: left; background: #fafafa; }'
  +'.pdf-export-root .signature { margin-top: 26px; width: 100%; }'
  +'.pdf-export-root .signature td { border: none; text-align: center; }'
  +'.pdf-export-root .sig-title { font-weight: bold; }'
  +'.pdf-export-root .sig-date { font-style: italic; }';

function monthlyReportBodyHtml(period,scope,headName){
  var sections=monthlyExportSections(scope);
  var periodParts=period.split('-'),reportYear=periodParts[0],reportMonth=periodParts[1];
  var today=new Date();
  var stt=0;
  var rowsHtml=sections.map(function(section){
    if(!section.items.length)return '';
    if(section.resetStt)stt=0;
    var body=section.items.map(function(x){
      var person=x.person,review=x.review;
      stt++;
      return '<tr><td class="c">'+stt+'</td><td>'+esc(person.full_name)+'</td><td>'+esc(person.title||'')+'</td><td>'+esc(person.professional_title||'')+'</td><td>'+esc(unitShort(person.unit_id))+'</td><td class="c">'+((review&&review.self_score!=null)?review.self_score:'')+'</td><td class="c">'+(person.role==='province_head'?'':((review&&review.official_score!=null)?review.official_score:''))+'</td><td class="c">'+((review&&review.classification)?review.classification:'')+'</td></tr>';
    }).join('');
    return '<tr class="section-row"><td colspan="8">'+esc(section.title)+'</td></tr>'+body;
  }).join('');
  return ''
    +'<div class="letterhead">'
    +'<div><strong>VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO</strong><span>VIỆN KIỂM SÁT NHÂN DÂN TỈNH BẮC NINH</span></div>'
    +'<div><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><span>Độc lập - Tự do - Hạnh phúc</span></div>'
    +'</div>'
    +'<h1>THÔNG BÁO</h1>'
    +'<div class="subtitle">Tổng hợp kết quả đánh giá, chấm điểm, xếp loại công chức và người lao động</div>'
    +'<div class="period">tháng '+Number(reportMonth)+' năm '+reportYear+'</div>'
    +'<table>'
    +'<thead><tr><th rowspan="2">Số TT</th><th rowspan="2">Họ và tên</th><th colspan="2">Chức vụ, chức danh</th><th rowspan="2">Đơn vị công tác</th><th rowspan="2">Điểm tự chấm</th><th colspan="2">Điểm được duyệt chính thức</th></tr>'
    +'<tr><th>Chức vụ</th><th>Chức danh</th><th>Điểm</th><th>Xếp loại</th></tr></thead>'
    +'<tbody>'+rowsHtml+'</tbody>'
    +'</table>'
    +'<table class="signature"><tr><td style="width:50%"></td><td style="width:50%"><span class="sig-date">Bắc Ninh, ngày '+today.getDate()+' tháng '+(today.getMonth()+1)+' năm '+today.getFullYear()+'</span><br><span class="sig-title">VIỆN TRƯỞNG</span><br><br><br><br><strong>'+esc(headName||'')+'</strong></td></tr></table>';
}

// Xuat PDF that (tai xuong 1 lan bam), khong qua hop thoai in cua trinh
// duyet - dung html2canvas+jsPDF (qua html2pdf.js) de "chup" chinh xac phan
// da render bang CSS Times New Roman cua trinh duyet (chu tieng Viet luon
// dung, khong can nhung font rieng cho jsPDF).
// Dung truc tiep html2canvas+jsPDF (khong qua html2pdf.js) vi ham
// toContainer() cua html2pdf.js bien phan tu muc tieu thanh con cua 1 wrapper
// position:absolute rieng cua no - phan tu muc tieu van con "position" inline
// nen bi dua ra khoi luong binh thuong va khong dong gop chieu cao cho
// wrapper do, khien html2canvas do duoc chieu cao = 0 va xuat ra PDF trang.
async function exportMonthlyPdf(period){
  if(typeof html2canvas==='undefined'||typeof window.jspdf==='undefined'){showToast('Chưa tải được thư viện xuất PDF, thử lại sau.');return}
  var scope,headName;
  try{
    scope=await getExportScope(period);
    headName=await fetchProvinceHeadName();
  }catch(e){showToast('Lỗi: '+e.message);return}
  var styleEl=$('pdfExportStyle');
  if(!styleEl){
    styleEl=document.createElement('style');
    styleEl.id='pdfExportStyle';
    styleEl.textContent=PDF_EXPORT_CSS;
    document.head.appendChild(styleEl);
  }
  var container=document.createElement('div');
  container.className='pdf-export-root';
  container.style.position='fixed';
  container.style.left='0';
  container.style.top='0';
  container.style.zIndex='-1';
  container.style.width='1600px';
  container.innerHTML=monthlyReportBodyHtml(period,scope,headName);
  document.body.appendChild(container);
  // Xem giai thich chi tiet o exportMonthlyLogPdf - html2canvas/jsPDF dung
  // "window.URL" ben trong, tam thoi tra ve dung doi tuong URL that trong
  // luc xuat roi khoi phuc lai ngay sau do.
  var savedWindowUrl=window.URL;
  window.URL=NativeURL;
  try{
    var canvas=await html2canvas(container,{scale:2,useCORS:true});
    var imgData=canvas.toDataURL('image/jpeg',0.98);
    var pdf=new window.jspdf.jsPDF({unit:'mm',format:'a3',orientation:'landscape'});
    var pageWidth=pdf.internal.pageSize.getWidth();
    var pageHeight=pdf.internal.pageSize.getHeight();
    var imgWidthMm=pageWidth;
    var imgHeightMm=canvas.height*imgWidthMm/canvas.width;
    var heightLeft=imgHeightMm;
    var position=0;
    pdf.addImage(imgData,'JPEG',0,position,imgWidthMm,imgHeightMm);
    heightLeft-=pageHeight;
    while(heightLeft>0){
      position=heightLeft-imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData,'JPEG',0,position,imgWidthMm,imgHeightMm);
      heightLeft-=pageHeight;
    }
    pdf.save('tong-hop-cham-diem-'+period+'.pdf');
    showToast('Đã xuất file PDF.');
  }catch(e){
    console.error('exportMonthlyPdf',e);
    showToast('Lỗi khi xuất PDF: '+e.message);
  }finally{
    window.URL=savedWindowUrl;
    container.remove();
  }
}

// ============================================
// XUAT NHAT KY CHI TIET THANG - khac voi "Xuat bao cao thang" (bang tong
// hop diem, dung khuon mau chinh thuc co san o tren), day la liet ke TUNG
// dong nhat ky thuc te da ghi trong ky, nhom theo tung nguoi - dung khi
// can xem lai chi tiet noi dung cong viec, khong chi con so tong hop
// (yeu cau nguoi dung, 2026-09-08). Pham vi nguoi dung DUNG LAI
// fetchDashboardScopeProfiles() (da tinh dung ca truong hop Pho Vien
// truong dang duoc uy quyen thay mat toan tinh).
async function fetchMonthlyLogsScope(period){
  var people=await fetchDashboardScopeProfiles();
  if(!people.length)return [];
  var ids=people.map(function(p){return p.id});
  var start=period+'-01';
  var parts=period.split('-');
  // Number(parts[1]) khong -1: parts[1] la thang 1-index (vd "08"), ymdStr
  // nhan thang 0-index nen chinh la thang KE TIEP theo 0-index (giong cach
  // dung trong monthlyEvidence()).
  var end=ymdStr(Number(parts[0]),Number(parts[1]),1);
  var r=await fetch(API+'work_logs?author_id=in.('+ids.join(',')+')&log_date=gte.'+start+'&log_date=lt.'+end+'&deleted_at=is.null&select=id,author_id,log_date,category_id,title,result,complexity_score,quality_score,status&order=log_date.asc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  var logs=await r.json();
  return people.map(function(p){return {person:p,logs:logs.filter(function(l){return l.author_id===p.id})}});
}

// Nhom theo don vi (sap xep ten don vi) roi theo nguoi (sap xep ten) trong
// tung don vi - dung cho ca Excel lan PDF.
function monthlyLogExportGroups(peopleWithLogs){
  var byUnit={};
  peopleWithLogs.forEach(function(x){
    var uid=x.person.unit_id;
    if(!byUnit[uid])byUnit[uid]=[];
    byUnit[uid].push(x);
  });
  return Object.keys(byUnit).map(function(uid){
    return {unitId:uid,unitName:unitShort(uid),items:byUnit[uid].sort(function(a,b){return (a.person.full_name||'').localeCompare(b.person.full_name||'','vi')})};
  }).sort(function(a,b){return a.unitName.localeCompare(b.unitName,'vi')});
}

async function exportMonthlyLogExcel(period){
  // Boc TOAN BO than ham trong try/catch (truoc day chi boc phan fetch
  // scope) - loi xay ra trong luc dung ExcelJS truoc do bi rot ra ngoai,
  // thanh 1 promise rejection khong ai bat, khong hien thong bao gi ("khong
  // phan hoi") - loi nguoi dung bao cao 2026-09-08, sua boc het + log ra
  // console de con chan doan neu tai phat sinh.
  if(typeof ExcelJS==='undefined'){showToast('Chưa tải được thư viện xuất Excel, thử lại sau.');return}
  try{
  var scope=await fetchMonthlyLogsScope(period);
  var groups=monthlyLogExportGroups(scope);
  var workbook=new ExcelJS.Workbook();
  var sheet=workbook.addWorksheet('Nhật ký',{pageSetup:{orientation:'landscape',fitToPage:true}});
  sheet.columns=[{width:5},{width:12},{width:22},{width:34},{width:34},{width:10},{width:10},{width:14}];
  var r=1;
  sheet.mergeCells('A'+r+':H'+r);
  sheet.getCell('A'+r).value='NHẬT KÝ CÔNG TÁC CHI TIẾT THÁNG '+Number(period.split('-')[1])+'/'+period.split('-')[0];
  sheet.getCell('A'+r).font={bold:true,size:13,name:'Times New Roman'};
  sheet.getCell('A'+r).alignment={horizontal:'center'};
  r+=2;
  groups.forEach(function(g){
    sheet.mergeCells('A'+r+':H'+r);
    sheet.getCell('A'+r).value=g.unitName;
    sheet.getCell('A'+r).font={bold:true,name:'Times New Roman',size:12};
    sheet.getCell('A'+r).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEFEFEF'}};
    r++;
    g.items.forEach(function(x){
      sheet.mergeCells('A'+r+':H'+r);
      sheet.getCell('A'+r).value=x.person.full_name+(x.person.title?(' - '+x.person.title):'')+' ('+x.logs.length+' nhật ký)';
      sheet.getCell('A'+r).font={bold:true,italic:true,name:'Times New Roman',size:11};
      r++;
      var headRow=sheet.getRow(r);
      headRow.values=['STT','Ngày','Lĩnh vực','Nội dung công việc','Kết quả','Độ phức tạp','Chất lượng','Trạng thái'];
      headRow.eachCell(function(cell){cell.font={bold:true,name:'Times New Roman',size:10.5};cell.border=EXCEL_BORDER;cell.alignment={horizontal:'center',vertical:'middle',wrapText:true}});
      r++;
      if(!x.logs.length){
        sheet.mergeCells('A'+r+':H'+r);
        sheet.getCell('A'+r).value='Chưa ghi nhật ký nào trong tháng này.';
        sheet.getCell('A'+r).font={italic:true,name:'Times New Roman',size:10.5,color:{argb:'FF888888'}};
        r++;
      }else{
        x.logs.forEach(function(l,idx){
          var row=sheet.getRow(r);
          row.values=[idx+1,fullDate(l.log_date),catName(l.category_id),l.title||'',l.result||'',l.complexity_score!=null?l.complexity_score:'',l.quality_score!=null?l.quality_score:'',STATUS_LABEL[l.status]||l.status];
          row.eachCell(function(cell){cell.font={name:'Times New Roman',size:10.5};cell.border=EXCEL_BORDER;cell.alignment={vertical:'top',wrapText:true}});
          row.getCell(1).alignment={horizontal:'center',vertical:'top'};
          row.getCell(2).alignment={horizontal:'center',vertical:'top'};
          row.getCell(6).alignment={horizontal:'center',vertical:'top'};
          row.getCell(7).alignment={horizontal:'center',vertical:'top'};
          row.getCell(8).alignment={horizontal:'center',vertical:'top'};
          r++;
        });
      }
      r++;
    });
  });
  var buffer=await workbook.xlsx.writeBuffer();
  var blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  // NativeURL (KHONG PHAI "URL") - "URL" la bien toan cuc da bi ghi de
  // thanh chuoi API Supabase (xem dong 11-12 dau file), goi URL.createObjectURL
  // se nem loi vi chuoi khong co ham nay. Day chinh la nguyen nhan bao cao
  // "bam Xuat Excel khong phan hoi" (loi bi rot ra ngoai, khong ai bat).
  var url=NativeURL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='nhat-ky-chi-tiet-'+period+'.xlsx';document.body.appendChild(a);a.click();a.remove();
  NativeURL.revokeObjectURL(url);
  showToast('Đã xuất file Excel.');
  }catch(e){
    console.error('exportMonthlyLogExcel',e);
    showToast('Lỗi khi xuất Excel: '+e.message);
  }
}

function monthlyLogReportBodyHtml(period,groups){
  var periodParts=period.split('-'),reportYear=periodParts[0],reportMonth=periodParts[1];
  var bodyHtml=groups.map(function(g){
    var unitHeader='<tr class="section-row"><td colspan="8">'+esc(g.unitName)+'</td></tr>';
    var peopleHtml=g.items.map(function(x){
      var personHeader='<tr class="person-row"><td colspan="8">'+esc(x.person.full_name)+(x.person.title?(' - '+esc(x.person.title)):'')+' ('+x.logs.length+' nhật ký)</td></tr>';
      var rowsHtml=x.logs.length?x.logs.map(function(l,idx){
        return '<tr><td class="c">'+(idx+1)+'</td><td class="c">'+esc(fullDate(l.log_date))+'</td><td>'+esc(catName(l.category_id))+'</td><td>'+esc(l.title||'')+'</td><td>'+esc(l.result||'')+'</td><td class="c">'+(l.complexity_score!=null?l.complexity_score:'')+'</td><td class="c">'+(l.quality_score!=null?l.quality_score:'')+'</td><td class="c">'+esc(STATUS_LABEL[l.status]||l.status)+'</td></tr>';
      }).join(''):'<tr><td colspan="8" style="font-style:italic;color:#888">Chưa ghi nhật ký nào trong tháng này.</td></tr>';
      return personHeader+rowsHtml;
    }).join('');
    return unitHeader+peopleHtml;
  }).join('');
  return ''
    +'<div class="letterhead">'
    +'<div><strong>VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO</strong><span>VIỆN KIỂM SÁT NHÂN DÂN TỈNH BẮC NINH</span></div>'
    +'<div><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><span>Độc lập - Tự do - Hạnh phúc</span></div>'
    +'</div>'
    +'<h1>NHẬT KÝ CÔNG TÁC CHI TIẾT</h1>'
    +'<div class="period">tháng '+Number(reportMonth)+' năm '+reportYear+'</div>'
    +'<table>'
    +'<thead><tr><th>Số TT</th><th>Ngày</th><th>Lĩnh vực công tác</th><th>Nội dung công việc</th><th>Kết quả/sản phẩm</th><th>Độ phức tạp</th><th>Chất lượng</th><th>Trạng thái</th></tr></thead>'
    +'<tbody>'+bodyHtml+'</tbody>'
    +'</table>';
}

async function exportMonthlyLogPdf(period){
  if(typeof html2canvas==='undefined'||typeof window.jspdf==='undefined'){showToast('Chưa tải được thư viện xuất PDF, thử lại sau.');return}
  var scope;
  try{scope=await fetchMonthlyLogsScope(period)}catch(e){showToast('Lỗi: '+e.message);return}
  var groups=monthlyLogExportGroups(scope);
  var styleEl=$('pdfExportStyle');
  if(!styleEl){
    styleEl=document.createElement('style');
    styleEl.id='pdfExportStyle';
    styleEl.textContent=PDF_EXPORT_CSS;
    document.head.appendChild(styleEl);
  }
  var container=document.createElement('div');
  container.className='pdf-export-root';
  container.style.position='fixed';
  container.style.left='0';
  container.style.top='0';
  container.style.zIndex='-1';
  container.style.width='1600px';
  container.innerHTML=monthlyLogReportBodyHtml(period,groups);
  document.body.appendChild(container);
  // html2canvas/jsPDF tu dung "URL.createObjectURL" o ben trong (qua bien
  // toan cuc "window.URL") de tao/tai file - nhung "URL" cua trang nay da
  // bi ghi de thanh chuoi API Supabase (xem dong 11-12 dau file, bien
  // NativeURL luu lai ban goc). Tam thoi tra "window.URL" ve dung doi
  // tuong that trong luc xuat, roi khoi phuc lai ngay sau do (khong anh
  // huong phan con lai cua app dang dung "URL" lam chuoi API).
  var savedWindowUrl=window.URL;
  window.URL=NativeURL;
  try{
    var canvas=await html2canvas(container,{scale:2,useCORS:true});
    var imgData=canvas.toDataURL('image/jpeg',0.98);
    var pdf=new window.jspdf.jsPDF({unit:'mm',format:'a3',orientation:'landscape'});
    var pageWidth=pdf.internal.pageSize.getWidth();
    var pageHeight=pdf.internal.pageSize.getHeight();
    var imgWidthMm=pageWidth;
    var imgHeightMm=canvas.height*imgWidthMm/canvas.width;
    var heightLeft=imgHeightMm;
    var position=0;
    pdf.addImage(imgData,'JPEG',0,position,imgWidthMm,imgHeightMm);
    heightLeft-=pageHeight;
    while(heightLeft>0){
      position=heightLeft-imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData,'JPEG',0,position,imgWidthMm,imgHeightMm);
      heightLeft-=pageHeight;
    }
    pdf.save('nhat-ky-chi-tiet-'+period+'.pdf');
    showToast('Đã xuất file PDF.');
  }catch(e){
    console.error('exportMonthlyLogPdf',e);
    showToast('Lỗi khi xuất PDF: '+e.message);
  }finally{
    window.URL=savedWindowUrl;
    container.remove();
  }
}

// ============================================
// TRUNG TAM THONG BAO
// ============================================
// Truoc day trang thai "da doc" chi luu localStorage tren tung may/trinh
// duyet - dang nhap tren dien thoai roi mo lai tren may tinh van thay
// "chua doc" (va nguoc lai). Tu 2026-09-09 chuyen sang luu server (bang
// notification_reads, migration 00075) de dong bo that qua nhieu thiet bi.
// SESSION_READ_ID_CACHE chi la lop "lac quan" tam thoi trong phien lam
// viec hien tai (vd vua bam vao 1 thong bao thi phai thay ngay la "da doc"
// tren man hinh, khong the doi round-trip len server xong moi cap nhat UI
// duoc) - nguon du lieu that van la server, doc lai moi lan renderNotificationsUI().
var SESSION_READ_ID_CACHE={};
async function fetchReadNotificationIds(){
  try{
    var r=await fetch(API+'notification_reads?user_id=eq.'+U.id+'&select=notification_key',{headers:authHeaders()});
    var rows=r.ok?await r.json():[];
    return rows.map(function(x){return x.notification_key});
  }catch(e){return []}
}
async function markNotificationRead(id){
  if(SESSION_READ_ID_CACHE[id])return;
  SESSION_READ_ID_CACHE[id]=true;
  try{
    await fetch(API+'notification_reads?on_conflict=user_id,notification_key',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates'}),body:JSON.stringify({user_id:U.id,notification_key:id})});
  }catch(e){}
}

async function fetchNotifications(){
  var list=[];
  try{
    var r=await fetch(API+'work_logs?author_id=eq.'+U.id+'&status=eq.revision&deleted_at=is.null&select=id,title,log_date,review_comment,reviewer_id,reviewed_at',{headers:authHeaders()});
    var mine=r.ok?await r.json():[];
    if(mine.length){
      var reviewerIds=Array.from(new Set(mine.map(function(l){return l.reviewer_id}).filter(Boolean)));
      var reviewers={};
      if(reviewerIds.length){
        var pr=await fetch(API+'profiles?id=in.('+reviewerIds.join(',')+')&select=id,full_name',{headers:authHeaders()});
        (pr.ok?await pr.json():[]).forEach(function(p){reviewers[p.id]=p});
      }
      mine.forEach(function(l){
        var reviewerName=(reviewers[l.reviewer_id]&&reviewers[l.reviewer_id].full_name)||'Lãnh đạo';
        list.push({id:'revision-'+l.id+'-'+(l.reviewed_at||'pending'),tone:'revision',title:'Nhật ký cần bổ sung',message:reviewerName+': '+(l.review_comment||'Yêu cầu chỉnh sửa, làm rõ kết quả.'),time:shortDate(l.log_date),view:'journal',logId:l.id,_t:new Date(l.reviewed_at||l.log_date).getTime()});
      });
    }
  }catch(e){}
  // Thong bao "su kien" thuc su (bang notifications, dung that lan dau -
  // truoc day chi suy ra ad-hoc). Dat TRUOC hang cho duyet (co the rat dai)
  // de khong bi ".slice(0, 20)" ben duoi cat mat.
  try{
    var nr=await fetch(API+'notifications?user_id=eq.'+U.id+'&order=created_at.desc&limit=20',{headers:authHeaders()});
    (nr.ok?await nr.json():[]).forEach(function(n){
      var tone=(n.type==='score_override_escalation'||n.type==='monthly_score_deviation_notice'||n.type==='task_unassigned'||n.type==='task_deleted'||n.type==='score_adjustment_removed'||n.type==='account_active_changed')?'escalation':(n.type==='score_overridden_by_senior'||n.type==='score_overridden_reviewer_notice'||n.type==='account_role_changed'||n.type==='account_scope_changed')?'revision':(n.type==='task_assigned'||n.type==='monthly_self_score_submitted'||n.type==='task_due_date_set')?'pending':'account';
      // score_overridden_by_senior/work_log_deleted_by_leader = gui cho TAC
      // GIA (co the la nhan vien thuong, khong vao duoc "Nhat ky cong tac
      // cua don vi"/"Quan tri" - cac trang chi lanh dao) -> ve "Nhat ky cua
      // toi". score_overridden_reviewer_notice/delegation_granted/
      // delegation_revoked = gui cho 1 lanh dao (nguoi da cham truoc, hoac
      // Pho phong duoc/bi (thu) uy quyen - unit_deputy VAN vao duoc
      // unitJournal du khong vao duoc "Quan tri") -> ve unitJournal.
      // monthly_score_deviation_notice = gui cho cap tren cua nguoi vua
      // cham lech diem -> ve thang "Cham diem thang" de xem lai ho so.
      // score_adjustment_added = gui cho CHINH nguoi bi/duoc cong/tru diem
      // dot xuat (migration 00066) -> cung ve "Cham diem thang" de xem chi
      // tiet + ly do. task_assigned/task_unassigned/task_updated (migration
      // 00070) = gui cho nguoi lien quan khi giao viec/doi nguoi/sua noi
      // dung 1 viec da giao -> ve man "Giao viec" de xem lai.
      // task_deleted/task_due_date_set (migration 00072) = tuong tu, ve
      // "Giao viec". score_adjustment_removed = ve "Cham diem thang" nhu
      // score_adjustment_added. account_role_changed/account_scope_changed/
      // account_active_changed = ve "Cai dat" de xem lai thong tin tai
      // khoan hien tai cua chinh minh. leave_acknowledged = ve "Nhat ky cua
      // toi" de xem lai don nghi phep vua duoc xac nhan.
      // monthly_self_score_submitted = gui cho nguoi duyet -> ve "Cham diem
      // thang" de duyet luon. monthly_report_delegation_granted/_revoked
      // (migration 00077) = gui cho nguoi duoc/thoi khong con duoc uy quyen
      // xem/xuat bao cao tong hop thang toan tinh -> ve "Cham diem thang".
      var view=n.type==='score_overridden_by_senior'?'journal'
        :n.type==='work_log_deleted_by_leader'?'journal'
        :n.type==='leave_acknowledged'?'journal'
        :n.type==='delegation_granted'?'unitJournal'
        :n.type==='delegation_revoked'?'unitJournal'
        :n.type==='score_overridden_reviewer_notice'?'unitJournal'
        :n.type==='monthly_score_deviation_notice'?'monthly'
        :n.type==='score_adjustment_added'?'monthly'
        :n.type==='score_adjustment_removed'?'monthly'
        :n.type==='monthly_self_score_submitted'?'monthly'
        :n.type==='monthly_report_delegation_granted'?'monthly'
        :n.type==='monthly_report_delegation_revoked'?'monthly'
        :(n.type==='task_assigned'||n.type==='task_unassigned'||n.type==='task_updated'||n.type==='task_deleted'||n.type==='task_due_date_set')?'tasks'
        :(n.type==='account_role_changed'||n.type==='account_scope_changed'||n.type==='account_active_changed')?'settings'
        :'unitJournal';
      list.push({id:'db-'+n.id,tone:tone,title:n.title,message:n.body||'',time:shortDate((n.created_at||'').slice(0,10)),view:view,_t:new Date(n.created_at).getTime()});
    });
  }catch(e){}
  // Nhac qua han giao viec: ad-hoc nhu cac loai khac (khong dung bang
  // notifications) - hien cho CA nguoi giao va nguoi nhan. Han gio la
  // TIMESTAMPTZ day du (gio:phut) - PHAI dung formatDateTime() va so sanh
  // Date that, KHONG dung shortDate()/todayStr() (chi danh cho chuoi ngay
  // "YYYY-MM-DD" don thuan, se nem RangeError: Invalid time value neu
  // truyen 1 timestamp day du vao).
  try{
    var nowT=new Date();
    var tar=await fetch(API+'task_assignments?assignee_id=eq.'+U.id+'&status=neq.done&removed_at=is.null&select=id,title,suggested_due_date,actual_due_date',{headers:authHeaders()});
    (tar.ok?await tar.json():[]).forEach(function(t){
      var due=t.actual_due_date||t.suggested_due_date;
      if(due&&new Date(due)<nowT)list.push({id:'task-overdue-assignee-'+t.id,tone:'escalation',title:'Việc được giao đã quá hạn',message:t.title+' — hạn '+formatDateTime(due),time:formatDateTime(due),view:'tasks',_t:new Date(due).getTime()});
    });
  }catch(e){}
  try{
    var nowT2=new Date();
    // 1 viec giao cho nhieu nguoi = nhieu dong cung task_group_id - chi
    // bao 1 lan cho ca viec (truoc day bao lap lai theo tung nguoi nhan),
    // bo qua nguoi da rut khoi viec (yeu cau nguoi dung 2026-09-10).
    var tbr=await fetch(API+'task_assignments?assigner_id=eq.'+U.id+'&status=neq.done&removed_at=is.null&select=id,task_group_id,title,suggested_due_date,actual_due_date',{headers:authHeaders()});
    var seenOverdueGroup={};
    (tbr.ok?await tbr.json():[]).forEach(function(t){
      var due=t.actual_due_date||t.suggested_due_date;
      if(!due||new Date(due)>=nowT2)return;
      var gk=t.task_group_id||t.id;
      if(seenOverdueGroup[gk])return;
      seenOverdueGroup[gk]=true;
      list.push({id:'task-overdue-assigner-'+gk,tone:'escalation',title:'Việc đã giao quá hạn chưa hoàn thành',message:t.title+' — hạn '+formatDateTime(due),time:formatDateTime(due),view:'tasks',_t:new Date(due).getTime()});
    });
  }catch(e){}
  // Nhac han ghi chu cong viec (chi ap dung cho ghi chu da chon "Nhac toi
  // truoc" - remind_before_minutes khac null la "cong tac"). due_time
  // khong bat buoc, bo trong coi nhu han la cuoi ngay 23:59. Dung gio dia
  // phuong (khong qua chuoi UTC) khi ghep ngay+gio de tranh dung lai loi
  // lech mui gio da tung gap va sua o weekdayDatesBetween().
  try{
    var nowN=new Date();
    var nr2=await fetch(API+'personal_notes?user_id=eq.'+U.id+'&is_done=eq.false&remind_before_minutes=not.is.null&select=id,title,note_date,due_time,remind_before_minutes',{headers:authHeaders()});
    (nr2.ok?await nr2.json():[]).forEach(function(note){
      var dateParts=(note.note_date||'').split('-').map(Number);
      if(dateParts.length!==3)return;
      var timeParts=(note.due_time||'23:59').split(':').map(Number);
      var dueMoment=new Date(dateParts[0],dateParts[1]-1,dateParts[2],timeParts[0]||0,timeParts[1]||0,0);
      var remindMoment=new Date(dueMoment.getTime()-note.remind_before_minutes*60000);
      var p2=function(n){return String(n).padStart(2,'0')};
      var dueLabel=p2(dueMoment.getDate())+'/'+p2(dueMoment.getMonth()+1)+'/'+dueMoment.getFullYear()+' '+p2(dueMoment.getHours())+':'+p2(dueMoment.getMinutes());
      if(nowN>=dueMoment){
        list.push({id:'note-overdue-'+note.id,tone:'escalation',title:'Ghi chú đã quá hạn',message:note.title+' — hạn '+dueLabel,time:dueLabel,view:'notes',_t:dueMoment.getTime()});
      }else if(nowN>=remindMoment){
        list.push({id:'note-reminder-'+note.id,tone:'reminder',title:'Ghi chú sắp đến hạn',message:note.title+' — hạn '+dueLabel,time:dueLabel,view:'notes',_t:remindMoment.getTime()});
      }
    });
  }catch(e){}
  if(isLeader()){
    try{
      var queue=await fetchReviewQueue();
      queue.forEach(function(l){
        list.push({id:'review-'+l.id+'-'+(l.created_at||l.log_date),tone:l.revision_count?'resubmitted':'pending',title:l.revision_count?('Nhật ký trình lại lần '+l.revision_count):'Nhật ký chờ chấm điểm',message:((l._author&&l._author.full_name)||'Cán bộ')+': '+l.title,time:shortDate(l.log_date),view:'reviews',logId:l.id,_t:new Date(l.created_at||l.log_date).getTime()});
      });
    }catch(e){}
  }
  // Sap xep MOI NHAT len tren dau, gop chung tat ca cac loai (truoc day
  // moi loai duoc noi vao "list" theo 1 thu tu uu tien co dinh - vd hang
  // cho duyet luon nam duoi cung - khong phan anh dung thoi gian thuc te,
  // khien tin that su moi bi chim xuong duoi tin cu hon nhung thuoc nhom
  // uu tien cao hon. Loi nguoi dung bao cao 2026-09-08.
  list.sort(function(a,b){return (b._t||0)-(a._t||0)});
  return list.slice(0,20);
}

async function renderNotificationsUI(){
  var notifications,readIds;
  try{
    var results=await Promise.all([fetchNotifications(),fetchReadNotificationIds()]);
    notifications=results[0];readIds=results[1];
  }catch(e){notifications=[];readIds=[]}
  // Gop them cache lac quan trong phien hien tai (xem ghi chu o
  // SESSION_READ_ID_CACHE phia tren) de tin vua bam vao doi ngay UI, khong
  // can cho round-trip len server.
  readIds=readIds.concat(Object.keys(SESSION_READ_ID_CACHE));
  var unread=notifications.filter(function(n){return readIds.indexOf(n.id)<0});
  var badge=$('notificationBadge');
  badge.hidden=unread.length===0;
  badge.textContent=unread.length>99?'99+':String(unread.length);
  $('notificationToggle').setAttribute('aria-label',unread.length?('Mở thông báo, '+unread.length+' tin chưa đọc'):'Mở thông báo, không có tin chưa đọc');
  $('notificationSummary').textContent=unread.length?(unread.length+' tin chưa đọc'):'Không có tin mới';
  $('markAllNotificationsRead').hidden=unread.length===0;
  $('notificationList').innerHTML=notifications.length?notifications.map(function(item){
    return '<button type="button" class="notification-item '+(readIds.indexOf(item.id)>=0?'is-read':'is-unread')+'" data-notification-id="'+item.id+'" data-notification-view="'+item.view+'" '+(item.logId?('data-notification-log="'+item.logId+'"'):'')+'><span class="notification-dot '+item.tone+'" aria-hidden="true"></span><span class="notification-copy"><strong>'+esc(item.title)+'</strong><span>'+esc(item.message)+'</span><small>'+esc(item.time)+'</small></span></button>';
  }).join(''):'<div class="notification-empty"><strong>Không có thông báo</strong><span>Các nội dung mới cần xử lý sẽ xuất hiện tại đây.</span></div>';
  document.querySelectorAll('[data-notification-id]').forEach(function(b){b.addEventListener('click',function(){openNotificationItem(b)})});
}

function markAllNotificationsRead(){
  fetchNotifications().then(function(list){
    if(!list.length){renderNotificationsUI();return}
    list.forEach(function(n){SESSION_READ_ID_CACHE[n.id]=true});
    renderNotificationsUI();
    var rows=list.map(function(n){return {user_id:U.id,notification_key:n.id}});
    fetch(API+'notification_reads?on_conflict=user_id,notification_key',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'resolution=ignore-duplicates'}),body:JSON.stringify(rows)}).catch(function(){});
  });
}

function closeNotificationPanel(){
  var panel=$('notificationPanel');
  panel.hidden=true;
  $('notificationToggle').setAttribute('aria-expanded','false');
}

function setView(view){
  V=view;
  document.querySelectorAll('[data-view]').forEach(function(n){n.classList.toggle('is-active',n.dataset.view===view)});
}

async function openNotificationItem(button){
  markNotificationRead(button.dataset.notificationId);
  closeNotificationPanel();
  var view=button.dataset.notificationView;
  var logId=button.dataset.notificationLog||null;
  if(view==='reviews')SELECTED_REVIEW_ID=logId;
  setView(view);
  if(view==='journal'){
    await rj();
    if(logId)oj(logId);
  }else{
    render();
  }
  renderNotificationsUI();
}

// ============================================
// QUAN TRI - tao/cap tai khoan truc tiep + uy quyen thay mat 100% toan
// don vi. KHONG con co che tu dang ky/ma dang ky theo don vi nua.
// ============================================
var ADMIN_DELEGATION_PEOPLE=[],ADMIN_DELEGATIONS=[];
var ADMIN_MRD_PEOPLE=[],ADMIN_MRD_DELEGATIONS=[];

// Quan tri toan phan (tao tai khoan, audit log) chi danh cho Quan tri
// vien/Vien truong tinh. Rieng "Uy quyen co thoi han" con
// mo them cho Truong phong/Chanh van phong (unit_head) de HO TU uy
// quyen cho pho cua chinh minh - dung RPC grant_delegation/
// revoke_delegation da cho phep tu migration 00030, truoc day chi
// thieu loi vao tu giao dien.
async function ra(){
  var fullAccess=isAdminOrProvinceHead();
  $('pageEyebrow').textContent=fullAccess?'QUẢN TRỊ':'ỦY QUYỀN';
  $('pageTitle').textContent=fullAccess?'Quản trị tài khoản':'Ủy quyền có thời hạn';
  if(!(fullAccess||U.rl==='unit_head')){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var auditLogs=[],people=[],delegationRows=[];
  try{
    if(fullAccess){
      if(U.rl==='administrator'){
        var alr=await fetch(API+'audit_logs?select=id,action,entity_type,entity_id,created_at,actor:actor_id(full_name)&order=created_at.desc&limit=50',{headers:authHeaders()});
        auditLogs=alr.ok?await alr.json():[];
      }
    }
    // unit_head: chi thay va chon duoc pho CUA DUNG DON VI MINH (khop dung
    // pham vi RPC grant_delegation - migration 00061). province_deputy them
    // vao de province_head chon duoc DUNG cap pho truc tiep cua minh (khong
    // con duoc chon unit_deputy nao nua, xem migration 00061).
    var peopleUrl=API+'profiles?role=in.(unit_deputy,province_deputy,staff,support_staff)&select=id,full_name,role,unit_id&order=full_name'+(fullAccess?'':'&unit_id=eq.'+U.uid);
    var ppr=await fetch(peopleUrl,{headers:authHeaders()});
    people=ppr.ok?await ppr.json():[];
    var delUrl=API+'delegations?select=id,delegator_id,delegate_id,unit_id,starts_at,ends_at,status&order=created_at.desc'+(fullAccess?'':'&unit_id=eq.'+U.uid);
    var dr=await fetch(delUrl,{headers:authHeaders()});
    delegationRows=dr.ok?await dr.json():[];
  }catch(e){}
  ADMIN_DELEGATION_PEOPLE=people;ADMIN_DELEGATIONS=delegationRows;

  var mrdPeople=[],mrdRows=[];
  if(U.rl==='province_head'){
    try{
      // Bat ky ai (tru Quan tri vien) deu chon duoc lam nguoi duoc uy quyen
      // xem/xuat bao cao tong hop thang - khac uy quyen "thay mat 100%" o
      // tren (chi gioi han Pho Vien truong tinh).
      var mrpUrl=API+'profiles?role=neq.administrator&is_active=eq.true&select=id,full_name,role,unit_id&order=full_name';
      var mrpr=await fetch(mrpUrl,{headers:authHeaders()});
      mrdPeople=mrpr.ok?await mrpr.json():[];
      var mrdUrl=API+'monthly_report_delegations?select=id,delegator_id,delegate_id,status,granted_at&order=granted_at.desc';
      var mrdr=await fetch(mrdUrl,{headers:authHeaders()});
      mrdRows=mrdr.ok?await mrdr.json():[];
    }catch(e){}
  }
  ADMIN_MRD_PEOPLE=mrdPeople;ADMIN_MRD_DELEGATIONS=mrdRows;

  var activeDelegationsCount=delegationRows.filter(isDelegationActiveRow).length;
  var h=credentialNoticeHtml();
  h+=fullAccess?('<div class="metric-grid">'
    +metricCard('Ủy quyền đang hiệu lực',activeDelegationsCount,'Có thể thu hồi tức thời','blue')
    +'</div>'):'';
  h+='<div class="admin-grid">';
  if(fullAccess){
    h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Tạo tài khoản mới</h2><p>Tạo trực tiếp trên giao diện, không cần vào Supabase viết SQL</p></div></div>'+createUserFormHtml()+'</section>';
  }
  h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Ủy quyền có thời hạn</h2><p>'+(U.rl==='province_head'?'Ủy quyền cho Phó Viện trưởng tỉnh thay mặt chấm điểm toàn tỉnh':'Ủy quyền cho 1 Phó phòng/Phó Viện trưởng KV thay mặt chấm điểm toàn bộ đơn vị'+(fullAccess?'':' (đơn vị của bạn)'))+', trong một khoảng thời gian</p></div></div>'
    +delegationGrantFormHtml(people,delegationRows)+delegationsTableHtml(delegationRows,people)+'</section>';
  if(U.rl==='province_head'){
    h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Ủy quyền xem/xuất báo cáo tổng hợp tháng</h2><p>Cho 1 người xem và xuất "Chấm điểm tháng" phạm vi toàn tỉnh như Viện trưởng - không cấp quyền duyệt/sửa điểm ai. Vô thời hạn, chỉ hết hiệu lực khi bị thu hồi</p></div></div>'
      +monthlyReportDelegationFormHtml(mrdPeople,mrdRows)+monthlyReportDelegationsTableHtml(mrdRows,mrdPeople)+'</section>';
  }
  if(fullAccess&&U.rl==='administrator'){
    h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Nhật ký kiểm toán</h2><p>50 thay đổi gần nhất đối với điểm số, trạng thái, quyền hạn và nhân sự</p></div></div>'+auditLogTableHtml(auditLogs)+'</section>';
  }
  h+='</div>';
  $('appView').innerHTML=h;

  if(fullAccess)bindCreateUserForm();
  bindCredentialNoticeDismiss();
  bindDelegationForm();
  document.querySelectorAll('[data-revoke-delegation]').forEach(function(b){b.addEventListener('click',function(){revokeDelegation(b.dataset.revokeDelegation)})});
  bindMonthlyReportDelegationForm();
  document.querySelectorAll('[data-revoke-monthly-report-delegation]').forEach(function(b){b.addEventListener('click',function(){revokeMonthlyReportDelegation(b.dataset.revokeMonthlyReportDelegation)})});
}

// ============================================
// TAO TAI KHOAN MOI - goi Edge Function admin-manage-users (action:
// create_user). Chi Quan tri vien/Vien truong tinh (fullAccess) thay panel
// nay. Mat khau: admin tu go hoac bam "Tao ngau nhien" de dien san 1 chuoi
// manh, luon hien ro (khong an) de con chep lai gui cho nguoi dung - domain
// hien la @vks-test.local, khong gui duoc email nen KHONG dung luong quen
// mat khau qua email.
function createUserFormHtml(){
  var deptUnits=UNITS.filter(function(u){return u.type!=='province'});
  var homeUnitOptions=PROVINCE_UNIT_ID?[{id:PROVINCE_UNIT_ID,short_name:LEADERSHIP_UNIT_LABEL}].concat(deptUnits):deptUnits;
  var roleOptions=ROLE_OPTIONS.filter(function(r){return r!=='administrator'||U.rl==='administrator'});
  var unitOptionsHtml=homeUnitOptions.map(function(u){return '<option value="'+u.id+'">'+esc(u.short_name||u.code)+'</option>'}).join('');
  var roleOptionsHtml=roleOptions.map(function(r){return '<option value="'+r+'">'+ROLE_LABELS[r]+'</option>'}).join('');
  return '<div class="form-grid compact-form">'
    +'<label class="field"><span>Họ và tên</span><input type="text" id="newUserFullName" placeholder="Nguyễn Văn A"></label>'
    +'<label class="field"><span>Email đăng nhập</span><input type="email" id="newUserEmail" placeholder="ten.dang.nhap@vks-test.local"></label>'
    +'<label class="field"><span>Vai trò</span><select id="newUserRole">'+roleOptionsHtml+'</select></label>'
    +'<label class="field"><span>Đơn vị</span><select id="newUserUnit">'+unitOptionsHtml+'</select></label>'
    +'<label class="field"><span>Chức vụ (không bắt buộc)</span><input type="text" id="newUserTitle" placeholder="VD: Kiểm sát viên trung cấp"></label>'
    +'<label class="field field-wide"><span>Mật khẩu ban đầu</span><div class="password-field-row"><input type="text" id="newUserPassword" placeholder="Tối thiểu 8 ký tự, có cả chữ và số"><button type="button" class="button button-secondary button-small" id="genUserPassword">Tạo ngẫu nhiên</button></div><small class="field-hint">Tối thiểu 8 ký tự, phải có cả chữ và số.</small></label>'
    +'</div><div class="review-actions"><button class="button button-primary" id="createUserBtn">Tạo tài khoản</button></div>';
}

function bindCreateUserForm(){
  var genBtn=$('genUserPassword');
  if(genBtn)genBtn.addEventListener('click',function(){$('newUserPassword').value=generateStrongPassword()});
  var createBtn=$('createUserBtn');
  if(createBtn)createBtn.addEventListener('click',submitCreateUser);
}

async function submitCreateUser(){
  if(!requireActive())return;
  var fullName=$('newUserFullName').value.trim();
  var email=$('newUserEmail').value.trim().toLowerCase();
  var role=$('newUserRole').value;
  var unitId=$('newUserUnit').value;
  var title=$('newUserTitle').value.trim();
  var password=$('newUserPassword').value.trim();
  if(!fullName||!email||!password){showToast('Vui lòng nhập đủ họ tên, email, mật khẩu.');return}
  if(password.length<8){showToast('Mật khẩu cần tối thiểu 8 ký tự.');return}
  if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){showToast('Mật khẩu cần có cả chữ và số.');return}
  var btn=$('createUserBtn');btn.disabled=true;
  try{
    var r=await fetch(FUNCTIONS+'admin-manage-users',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'create_user',email:email,password:password,full_name:fullName,role:role,unit_id:unitId,title:title||null})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    ADMIN_CREDENTIAL_NOTICE={title:'Đã tạo tài khoản mới',email:email,password:password};
    showToast('Đã tạo tài khoản cho '+fullName+'.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

// ============================================
// UY QUYEN CO THOI HAN - chi dinh dung ai duoc Pho phong/Pho VT KV
// cham thay, trong khoang thoi gian nao (dung RPC grant_delegation/
// revoke_delegation tu migration 00030)
// ============================================
function isDelegationActiveRow(d){
  var now=new Date();
  return d.status==='active' && new Date(d.starts_at)<=now && now<=new Date(d.ends_at);
}

// Vien truong tinh (province_head) CHI duoc uy quyen cho DUNG cap pho
// truc tiep cua minh - Pho Vien truong tinh (province_deputy), khong con
// duoc chon Pho phong/Pho VT khu vuc nao ca (sua loi that o migration
// 00061 - truoc day province_head lai chi chon duoc unit_deputy, gan sai
// cap). Truong phong/Chanh van phong (unit_head) van chi thay va chon
// duoc pho CUA DUNG DON VI MINH nhu cu. Quan tri vien khong uy quyen duoc
// (RPC luon tu choi), nen an han ca form thay vi hien 1 form luon that bai.
function delegationGrantFormHtml(people,delegations){
  var deputies,deputyLabel,scopeNote;
  if(U.rl==='province_head'){
    deputies=people.filter(function(p){return p.role==='province_deputy'});
    deputyLabel='Phó Viện trưởng tỉnh được ủy quyền';
    scopeNote='Trong thời gian này, Phó Viện trưởng tỉnh được chọn sẽ thay mặt chấm điểm và duyệt nhật ký cho <strong>toàn tỉnh</strong>, như Viện trưởng.';
  }else if(U.rl==='unit_head'){
    deputies=people.filter(function(p){return p.role==='unit_deputy' && p.unit_id===U.uid});
    deputyLabel='Phó phòng/Phó Viện trưởng KV được ủy quyền';
    scopeNote='Trong thời gian này, Phó phòng được chọn sẽ thay mặt chấm điểm và duyệt nhật ký cho <strong>toàn bộ đơn vị</strong>, như Trưởng phòng.';
  }else{
    return '<div class="empty-state compact-empty"><strong>Vai trò này không cấp ủy quyền được</strong><span>Chỉ Viện trưởng tỉnh (cho Phó Viện trưởng tỉnh) hoặc Trưởng phòng/Viện trưởng khu vực (cho Phó của đúng đơn vị mình) mới cấp được ủy quyền.</span></div>';
  }
  if(delegations.some(function(d){return d.delegator_id===U.id && isDelegationActiveRow(d)})){
    return '<div class="empty-state compact-empty"><strong>Bạn đang có 1 ủy quyền còn hiệu lực</strong><span>Thu hồi ủy quyền hiện tại ở bảng bên dưới trước khi cấp ủy quyền mới.</span></div>';
  }
  var options=deputies.map(function(d){return '<option value="'+d.id+'">'+esc(d.full_name)+' · '+esc(unitShort(d.unit_id))+'</option>'}).join('');
  return '<div class="form-grid compact-form">'
    +'<label class="field field-wide"><span>'+deputyLabel+'</span><select id="delegationDeputy">'+options+'</select></label>'
    +'<div class="field"><span>Từ ngày</span>'+dateOnlyFieldHtml('delegationStart',todayStr())+'</div>'
    +'<div class="field"><span>Đến ngày</span>'+dateOnlyFieldHtml('delegationEnd',null)+'</div>'
    +'<p class="metric-context field-wide">'+scopeNote+'</p>'
    +'</div><div class="review-actions"><button class="button button-primary" id="grantDelegation">Cấp ủy quyền</button></div>';
}

function delegationsTableHtml(delegations,people){
  if(!delegations.length)return '<div class="empty-state compact-empty"><strong>Chưa có ủy quyền nào</strong></div>';
  function personById(id){return people.find(function(p){return p.id===id})}
  return '<div class="table-wrap"><table><thead><tr><th>Người được ủy quyền</th><th>Đơn vị</th><th>Phạm vi</th><th>Thời hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+delegations.map(function(d){
    var deputy=personById(d.delegate_id);
    var active=isDelegationActiveRow(d);
    var statusLabel=d.status==='revoked'?'Đã thu hồi':active?'Đang hiệu lực':'Hết hạn';
    var statusTone=d.status==='revoked'?'status-revision':active?'status-approved':'status-pending';
    var scope=d.unit_id===PROVINCE_UNIT_ID?'Toàn tỉnh':'Toàn bộ đơn vị';
    return '<tr><td><strong>'+(deputy?esc(deputy.full_name):'—')+'</strong></td><td>'+esc(unitShort(d.unit_id))+'</td><td>'+scope+'</td><td>'+new Date(d.starts_at).toLocaleDateString('vi-VN')+'–'+new Date(d.ends_at).toLocaleDateString('vi-VN')+'</td><td><span class="status-pill '+statusTone+'">'+statusLabel+'</span></td><td class="numeric">'+(d.status==='active'?'<button class="button button-danger button-small" data-revoke-delegation="'+d.id+'">Thu hồi</button>':'')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

function bindDelegationForm(){
  var grantButton=$('grantDelegation');
  if(!grantButton)return;
  grantButton.addEventListener('click',grantDelegationClick);
}

async function grantDelegationClick(){
  if(!requireActive())return;
  var deputyId=$('delegationDeputy').value;
  var startsAt=readDateOnly('delegationStart','ngày bắt đầu ủy quyền');
  if(startsAt===undefined)return;
  var endsAt=readDateOnly('delegationEnd','ngày kết thúc ủy quyền');
  if(endsAt===undefined)return;
  if(!deputyId||!startsAt||!endsAt){showToast('Vui lòng chọn đầy đủ Phó phòng và khoảng thời gian.');return}
  if(endsAt<startsAt){showToast('Ngày kết thúc phải sau ngày bắt đầu.');return}
  var btn=$('grantDelegation');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/grant_delegation',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_delegate_id:deputyId,p_starts_at:new Date(startsAt).toISOString(),p_ends_at:new Date(endsAt).toISOString()})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));btn.disabled=false;return}
    showToast('Đã cấp ủy quyền.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

async function revokeDelegation(id){
  if(!requireActive())return;
  if(!confirm('Thu hồi ủy quyền này?'))return;
  try{
    var r=await fetch(API+'rpc/revoke_delegation',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_delegation_id:id})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));return}
    showToast('Đã thu hồi ủy quyền.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message)}
}

// ============================================
// UY QUYEN XEM/XUAT BAO CAO TONG HOP THANG - KHAC "uy quyen co thoi han"
// o tren: khong gan 1 don vi cu the, VO THOI HAN (khong ends_at), CHI cap
// 1 quyen duy nhat (xem/xuat "Cham diem thang" pham vi toan tinh nhu Vien
// truong) - khong doi vai tro/quyen duyet-sua diem o bat ky man hinh nao
// khac (migration 00077, yeu cau nguoi dung 2026-09-09 - Phong 15 tham
// muu nhan su can trich xuat bieu tong hop thang).
function monthlyReportDelegationFormHtml(people,delegations){
  var candidates=people.filter(function(p){return p.id!==U.id});
  var options=candidates.map(function(p){return '<option value="'+p.id+'">'+esc(p.full_name)+' · '+esc(ROLE_LABELS[p.role]||p.role)+' · '+esc(unitShort(p.unit_id))+'</option>'}).join('');
  return '<div class="form-grid compact-form">'
    +'<label class="field field-wide"><span>Người được ủy quyền</span><select id="monthlyReportDelegatePerson">'+options+'</select></label>'
    +'<p class="metric-context field-wide">Người được chọn sẽ xem và xuất được báo cáo tổng hợp chấm điểm tháng của <strong>toàn tỉnh</strong> (kể cả Viện trưởng, Phó Viện trưởng) - giống hệt phạm vi xem của Viện trưởng, nhưng <strong>không</strong> có quyền duyệt/sửa điểm của ai. Các quyền khác của họ (giao việc, duyệt nhật ký đơn vị mình...) giữ nguyên như cũ. Có hiệu lực ngay, không có ngày hết hạn - chỉ mất hiệu lực khi bị thu hồi ở bảng bên dưới.</p>'
    +'</div><div class="review-actions"><button class="button button-primary" id="grantMonthlyReportDelegation">Cấp ủy quyền</button></div>';
}

function monthlyReportDelegationsTableHtml(delegations,people){
  if(!delegations.length)return '<div class="empty-state compact-empty"><strong>Chưa cấp ủy quyền nào</strong></div>';
  function personById(id){return people.find(function(p){return p.id===id})}
  return '<div class="table-wrap"><table><thead><tr><th>Người được ủy quyền</th><th>Đơn vị</th><th>Cấp lúc</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+delegations.map(function(d){
    var person=personById(d.delegate_id);
    var active=d.status==='active';
    return '<tr><td><strong>'+(person?esc(person.full_name):'—')+'</strong></td><td>'+(person?esc(unitShort(person.unit_id)):'—')+'</td><td>'+new Date(d.granted_at).toLocaleDateString('vi-VN')+'</td><td><span class="status-pill '+(active?'status-approved':'status-revision')+'">'+(active?'Đang hiệu lực':'Đã thu hồi')+'</span></td><td class="numeric">'+(active?'<button class="button button-danger button-small" data-revoke-monthly-report-delegation="'+d.id+'">Thu hồi</button>':'')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

function bindMonthlyReportDelegationForm(){
  var btn=$('grantMonthlyReportDelegation');
  if(!btn)return;
  btn.addEventListener('click',grantMonthlyReportDelegationClick);
}

async function grantMonthlyReportDelegationClick(){
  if(!requireActive())return;
  var select=$('monthlyReportDelegatePerson');
  var personId=select?select.value:'';
  if(!personId){showToast('Vui lòng chọn người được ủy quyền.');return}
  var btn=$('grantMonthlyReportDelegation');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/grant_monthly_report_delegation',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_delegate_id:personId})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));btn.disabled=false;return}
    showToast('Đã cấp ủy quyền xem/xuất báo cáo tổng hợp tháng.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

async function revokeMonthlyReportDelegation(id){
  if(!requireActive())return;
  if(!confirm('Thu hồi ủy quyền xem/xuất báo cáo tổng hợp tháng này?'))return;
  try{
    var r=await fetch(API+'rpc/revoke_monthly_report_delegation',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_id:id})});
    var data=await r.json();
    if(!r.ok||data.success===false){showToast('Lỗi: '+(data.error||'HTTP '+r.status));return}
    showToast('Đã thu hồi ủy quyền.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message)}
}

var AUDIT_ACTION_LABELS={INSERT:'Tạo mới',UPDATE:'Cập nhật',DELETE:'Xoá'};
var AUDIT_ENTITY_LABELS={work_logs:'Nhật ký công việc',profiles:'Hồ sơ tài khoản',delegations:'Ủy quyền',monthly_reviews:'Đánh giá tháng',monthly_report_delegations:'Ủy quyền xem/xuất báo cáo tháng'};

function auditLogTableHtml(logs){
  if(!logs.length)return '<div class="empty-state compact-empty"><strong>Chưa có thay đổi nào được ghi nhận</strong></div>';
  return '<div class="table-wrap"><table><thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th></tr></thead><tbody>'+logs.map(function(l){
    var actor=(l.actor&&l.actor.full_name)?l.actor.full_name:'Hệ thống';
    return '<tr><td>'+new Date(l.created_at).toLocaleString('vi-VN')+'</td><td><strong>'+esc(actor)+'</strong></td><td>'+(AUDIT_ACTION_LABELS[l.action]||esc(l.action))+'</td><td>'+(AUDIT_ENTITY_LABELS[l.entity_type]||esc(l.entity_type))+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

// Dung chung cho moi o mat khau co nut an/hien (dang nhap, doi mat khau...).
function togglePasswordField(inputId,buttonId){
  var input=$(inputId),button=$(buttonId);
  if(!input||!button)return;
  var showing=input.type==='text';
  input.type=showing?'password':'text';
  button.textContent=showing?'Hiện':'Ẩn';
  button.setAttribute('aria-label',showing?'Hiện mật khẩu':'Ẩn mật khẩu');
}

// ============================================
// PHAT TRIEN TINH NANG & SUA LOI - nhat ky cap nhat phan mem viet cho
// nguoi khong ranh ky thuat, doc du lieu tinh tu mang CHANGELOG o dau
// file. Xem huong dan them dong moi ngay tren mang do.
// ============================================
function changelogTagHtml(type){
  var meta={
    feature:{cls:'tag-feature',label:'🆕 Tính năng mới'},
    fix:{cls:'tag-fix',label:'🐛 Sửa lỗi'},
    improve:{cls:'tag-improve',label:'⚙️ Cải tiến'}
  }[type]||{cls:'tag-improve',label:'⚙️ Cải tiến'};
  return '<span class="changelog-tag '+meta.cls+'">'+meta.label+'</span>';
}
function rc(){
  $('pageEyebrow').textContent='CẬP NHẬT PHẦN MỀM';$('pageTitle').textContent='Phát triển tính năng & sửa lỗi';
  var main='<p class="metric-context" style="margin:0 0 16px;max-width:640px">Nơi ghi lại vắn tắt những gì phần mềm vừa thêm mới hoặc vừa sửa, theo thời gian gần nhất lên đầu - để mọi người biết phần mềm đang thay đổi những gì.</p>';
  if(!CHANGELOG.length){
    main+='<div class="empty-state"><strong>Chưa có cập nhật nào được ghi lại</strong></div>';
  }else{
    var sorted=CHANGELOG.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0});
    var groups=[];
    sorted.forEach(function(item){
      var g=groups.length?groups[groups.length-1]:null;
      if(!g||g.date!==item.date){g={date:item.date,items:[]};groups.push(g)}
      g.items.push(item);
    });
    main+='<div class="changelog-list">'+groups.map(function(g){
      return '<div class="changelog-group"><div class="changelog-date">'+esc(fullDate(g.date))+'</div>'
        +'<div class="changelog-items">'+g.items.map(function(item){
          return '<div class="changelog-item">'+changelogTagHtml(item.type)+'<span>'+esc(item.text)+'</span></div>';
        }).join('')+'</div></div>';
    }).join('')+'</div>';
  }
  var contact='<aside class="changelog-sidebar">'
    +'<div class="changelog-contact">'
    +'<div class="changelog-contact-title">Tài liệu hướng dẫn sử dụng</div>'
    +'<p class="changelog-download-desc">Hướng dẫn chi tiết cách sử dụng phần mềm, chi tiết cho từng vị trí công tác.</p>'
    +'<a href="../demo/assets/Tai_lieu_huong_dan_su_dung_QLCV.docx" download="Tai_lieu_huong_dan_su_dung_QLCV.docx" class="button button-primary changelog-download-btn">⬇️ Tải file hướng dẫn (.docx)</a>'
    +'</div>'
    +'<div class="changelog-contact">'
    +'<div class="changelog-contact-title">Liên hệ bộ phận kỹ thuật</div>'
    +'<div class="changelog-contact-name">Đồng chí Nguyễn Khắc Tú <span>(sinh năm 1993)</span></div>'
    +'<div class="changelog-contact-phone">Số điện thoại: <a href="tel:0919785993">0919785993</a></div>'
    +'</div>'
    +'</aside>';
  $('appView').innerHTML='<div class="changelog-page"><div class="changelog-main">'+main+'</div>'+contact+'</div>';
}

// ============================================
// THUNG RAC - nhat ky bi xoa (chinh minh hoac lanh dao xoa) nay chuyen vao day thay vi mat han
// ngay, xem duoc + khoi phuc duoc hoac xoa vinh vien tu day (yeu cau nguoi dung 2026-09-12).
// ============================================
async function rtb(){
  $('pageEyebrow').textContent='THÙNG RÁC';$('pageTitle').textContent='Nhật ký đã xoá';
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var items=[];
  try{
    var r=await fetch(API+'rpc/list_trash_work_logs',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({})});
    items=await r.json();
    if(!r.ok)throw new Error((items&&items.message)||('HTTP '+r.status));
  }catch(err){
    $('appView').innerHTML='<div class="empty-state"><strong>Không tải được thùng rác</strong><span>'+esc(err.message)+'</span></div>';
    return;
  }
  var intro='<p class="metric-context" style="margin:0 0 16px;max-width:640px">Nhật ký đã xoá (do chính bạn hoặc do lãnh đạo quản lý bạn xoá) nằm ở đây - có thể khôi phục lại hoặc xoá vĩnh viễn nếu chắc chắn không cần nữa.</p>';
  if(!items.length){
    $('appView').innerHTML=intro+'<div class="empty-state"><strong>Thùng rác trống</strong></div>';
    return;
  }
  var list=items.map(function(it){
    return '<article class="journal-card">'
      +'<div class="journal-date"><strong>'+shortDate(it.log_date)+'</strong>'+(it.log_date||'').slice(0,4)+'</div>'
      +'<div class="journal-body"><h3>'+esc(it.title)+'</h3><p>'+esc(it.result||'')+'</p>'
      +'<div class="journal-meta"><span class="meta-tag">'+esc(it.author_name||'—')+'</span><span class="meta-tag">'+esc(catName(it.category_id))+'</span>'
      +'<span class="meta-tag">Đã xoá bởi '+esc(it.deleted_by_name||'—')+' · '+esc(shortDateTime(it.deleted_at))+'</span>'
      +(it.delete_reason?'<span class="meta-tag">Lý do: '+esc(it.delete_reason)+'</span>':'')+'</div></div>'
      +'<div class="journal-side">'
      +'<button type="button" class="button button-primary button-small" data-restore-log="'+it.id+'">Khôi phục</button>'
      +'<button type="button" class="button button-danger button-small" data-purge-log="'+it.id+'">Xoá vĩnh viễn</button>'
      +'</div></article>';
  }).join('');
  $('appView').innerHTML=intro+'<div class="journal-list">'+list+'</div>';
  document.querySelectorAll('[data-restore-log]').forEach(function(b){b.addEventListener('click',function(){restoreWorkLog(b.dataset.restoreLog)})});
  document.querySelectorAll('[data-purge-log]').forEach(function(b){b.addEventListener('click',function(){purgeWorkLogFromTrash(b.dataset.purgeLog)})});
}

async function restoreWorkLog(logId){
  if(!confirm('Khôi phục nhật ký này về danh sách bình thường?'))return;
  try{
    var r=await fetch(API+'rpc/restore_work_log',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:logId})});
    var d=await r.json();
    if(!r.ok||d.success===false){showToast('Lỗi: '+((d&&d.error)||('HTTP '+r.status)));return}
    showToast('Đã khôi phục nhật ký.');
    rtb();
  }catch(err){showToast('Lỗi: '+err.message)}
}

async function purgeWorkLogFromTrash(logId){
  if(!confirm('Xoá VĨNH VIỄN nhật ký này? Không thể khôi phục lại sau khi xoá.'))return;
  try{
    var r=await fetch(API+'rpc/purge_work_log',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_log_id:logId})});
    var d=await r.json();
    if(!r.ok||d.success===false){showToast('Lỗi: '+((d&&d.error)||('HTTP '+r.status)));return}
    showToast('Đã xoá vĩnh viễn.');
    rtb();
  }catch(err){showToast('Lỗi: '+err.message)}
}

// ============================================
// CAI DAT TAI KHOAN - trang that (khong con la hop thoai), doi ten/mat khau/dang xuat
// ============================================
function rs(){
  $('pageEyebrow').textContent='TÀI KHOẢN';$('pageTitle').textContent='Cài đặt tài khoản';
  var h='<div class="panel" style="padding:18px;margin-bottom:14px;max-width:520px">'
    +'<h3 style="margin:0 0 12px">Họ và tên</h3>'
    +'<form id="accountNameForm" class="form-grid">'
    +'<label class="field field-wide"><span>Họ và tên hiển thị</span><input name="fullName" id="accountFullName" value="'+esc(U.n)+'" required></label>'
    +'<div class="form-actions field-wide"><button type="submit" class="button button-primary">Lưu tên</button></div>'
    +'</form></div>';
  h+='<div class="panel" style="padding:18px;margin-bottom:14px;max-width:520px">'
    +'<h3 style="margin:0 0 12px">Đổi mật khẩu</h3>'
    +'<form id="accountPasswordForm" class="form-grid">'
    +'<label class="field field-wide"><span>Mật khẩu mới</span><div class="password-field"><input id="newPasswordInput" name="newPassword" type="password" minlength="8" required autocomplete="new-password" placeholder="Tối thiểu 8 ký tự, có cả chữ và số"><button type="button" id="toggleNewPassword" aria-label="Hiện mật khẩu">Hiện</button></div><small class="field-hint">Tối thiểu 8 ký tự, phải có cả chữ và số.</small></label>'
    +'<label class="field field-wide"><span>Nhập lại mật khẩu mới</span><div class="password-field"><input id="confirmNewPasswordInput" name="confirmNewPassword" type="password" minlength="8" required autocomplete="new-password"><button type="button" id="toggleConfirmNewPassword" aria-label="Hiện mật khẩu">Hiện</button></div></label>'
    +'<div class="form-actions field-wide"><button type="submit" class="button button-primary">Đổi mật khẩu</button></div>'
    +'</form></div>';
  h+='<div class="panel" style="padding:18px;max-width:520px">'
    +'<div class="form-actions field-wide" style="justify-content:flex-start;gap:10px;flex-wrap:wrap">'
    +'<button type="button" class="button button-danger" id="accountLogout">Đăng xuất</button>'
    +'<button type="button" class="button button-secondary" id="accountLogoutEverywhere">Đăng xuất khỏi mọi thiết bị</button>'
    +'</div>'
    +'<p style="margin:10px 0 0;color:var(--muted);font-size:12px">Hủy tất cả phiên đăng nhập đang mở ở mọi máy/trình duyệt (kể cả máy đã "Ghi nhớ đăng nhập"), chỉ đăng nhập lại được từ đầu.</p>'
    +'</div>';
  $('appView').innerHTML=h;
  $('accountNameForm').addEventListener('submit',submitAccountName);
  $('accountPasswordForm').addEventListener('submit',submitAccountPassword);
  $('toggleNewPassword').addEventListener('click',function(){togglePasswordField('newPasswordInput','toggleNewPassword')});
  $('toggleConfirmNewPassword').addEventListener('click',function(){togglePasswordField('confirmNewPasswordInput','toggleConfirmNewPassword')});
  $('accountLogout').onclick=x;
  $('accountLogoutEverywhere').onclick=logoutEverywhere;
}

// Huy TOAN BO refresh token cua tai khoan nay (moi thiet bi/trinh duyet
// dang con dang nhap), khong chi phien hien tai - dung API logout co san
// cua Supabase Auth voi scope=global.
async function logoutEverywhere(){
  if(!confirm('Đăng xuất khỏi TẤT CẢ thiết bị đang đăng nhập tài khoản này?'))return;
  try{
    await fetch(AUTH+'logout?scope=global',{method:'POST',headers:authHeaders()});
  }catch(e){}
  showToast('Đã đăng xuất khỏi mọi thiết bị.');
  x();
}

async function submitAccountName(e){
  e.preventDefault();
  var name=$('accountFullName').value.trim();
  if(!name){showToast('Họ tên không được để trống.');return}
  try{
    var r=await fetch(API+'rpc/update_own_name',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_full_name:name})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    U.n=name;
    var un0=$('sidebarUserName');if(un0)un0.textContent=name;
    showToast('Đã lưu tên hiển thị.');
  }catch(err){showToast('Lỗi: '+err.message)}
}

async function submitAccountPassword(e){
  e.preventDefault();
  var f=new FormData($('accountPasswordForm'));
  var pw=f.get('newPassword')||'',confirm=f.get('confirmNewPassword')||'';
  if(pw.length<8){showToast('Mật khẩu mới cần tối thiểu 8 ký tự.');return}
  if(!/[A-Za-z]/.test(pw)||!/[0-9]/.test(pw)){showToast('Mật khẩu mới cần có cả chữ và số.');return}
  if(pw!==confirm){showToast('Mật khẩu nhập lại chưa khớp.');return}
  try{
    var r=await fetch(AUTH+'user',{method:'PUT',headers:{'apikey':KEY,'Authorization':'Bearer '+tkn(),'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    var d=await r.json();
    if(!r.ok)throw new Error(d.error_description||d.msg||d.error||'Đổi mật khẩu thất bại');
    $('accountPasswordForm').reset();
    showToast('Đã đổi mật khẩu thành công.');
  }catch(err){showToast('Lỗi: '+err.message)}
}

function showToast(m){var t=$('toast');if(t){t.textContent=m;t.classList.add('is-visible');setTimeout(function(){t.classList.remove('is-visible')},3000)}}
function x(){closeNotificationPanel();cj();stopNotificationPolling();localStorage.removeItem('st');sessionStorage.removeItem('st');SESSION_READ_ID_CACHE={};U=null;$('appShell').hidden=true;$('loginScreen').hidden=false;document.body.classList.add('login-active')}

// Cho supabase-auth.js goi vao sau khi dang nhap/khoi phuc phien, khong can qua su kien rieng
window.QLCV_afterLogin=initU;
window.QLCV_logout=x;

document.addEventListener('DOMContentLoaded',function(){
  var navButtons=document.querySelectorAll('[data-view]');
  navButtons.forEach(function(b){
    b.addEventListener('click',function(){
      if(this.dataset.view==='logout'){x();return}
      setView(this.dataset.view);render();
      $('sidebar').classList.remove('is-open');
    })
  });
  $('mobileMenu').onclick=function(){$('sidebar').classList.toggle('is-open')};
  document.querySelectorAll('[data-close-modal]').forEach(function(b){b.addEventListener('click',cj)});
  $('journalModal').addEventListener('click',function(e){if(e.target.id==='journalModal')cj()});
  $('journalForm').addEventListener('submit',sj);
  // journalWorkDateField/journalRangeStartDateField duoc DUNG LAI (innerHTML)
  // moi lan mo modal/doi "Thoi gian thuc hien" - gan su kien theo kieu uy
  // quyen (delegation) tren chinh journalForm (khong doi) thay vi tren tung
  // o <select> (se mat tac dung sau moi lan dung lai).
  $('journalForm').addEventListener('change',function(e){
    var id=e.target.id;
    if(id==='journalWorkDate'){checkJournalDateWarning();updateJournalRangePreview()}
    else if(id==='journalRangeStartDate'){updateJournalRangePreview()}
  });
  $('journalForm').elements.duration.addEventListener('change',toggleJournalRangeField);
  $('journalForm').elements.selfComplexity.addEventListener('input',function(e){
    kpiComplexityFromCatalog=false; // nguoi dung tu go lai - tro ve loi giai thich day du
    updateSelfScoreGuide('Complexity',e.target.value);
  });
  $('journalForm').elements.selfQuality.addEventListener('input',function(e){updateSelfScoreGuide('Quality',e.target.value)});
  $('journalTaskSelect').addEventListener('change',applyTaskLinkToSubmitTo);
  document.querySelectorAll('[data-close-leave-modal]').forEach(function(b){b.addEventListener('click',cl)});
  $('leaveModal').addEventListener('click',function(e){if(e.target.id==='leaveModal')cl()});
  $('leaveForm').addEventListener('submit',sl);
  // leaveStartDateField/leaveEndDateField duoc dung lai (innerHTML) moi lan
  // mo modal - gan su kien theo kieu uy quyen tren leaveForm (khong doi),
  // giong journalForm o tren.
  $('leaveForm').addEventListener('change',function(e){
    var id=e.target.id;
    if(id.indexOf('leaveStartDate')===0||id.indexOf('leaveEndDate')===0)updateLeaveRangePreview();
  });
  $('toggleCopyJournal').addEventListener('click',function(){
    var panel=$('copyJournalPanel');
    panel.hidden=!panel.hidden;
    if(!panel.hidden)$('copyJournalSearch').focus();
  });
  $('copyJournalSearch').addEventListener('input',function(e){renderCopyJournalList(e.target.value)});
  $('toggleKpiCatalog').addEventListener('click',function(){
    var panel=$('kpiCatalogPanel');
    panel.hidden=!panel.hidden;
    if(!panel.hidden)$('kpiCatalogSearch').focus();
  });
  $('kpiCatalogSearch').addEventListener('input',function(e){renderKpiCatalogList(e.target.value)});
  $('kpiCatalogUseOther').addEventListener('click',applyOtherCategory);
  document.querySelectorAll('[data-close-export]').forEach(function(b){b.addEventListener('click',closeExportModal)});
  $('exportModal').addEventListener('click',function(e){if(e.target.id==='exportModal')closeExportModal()});
  $('exportPeriodSelect').addEventListener('change',function(e){if(!$('exportScoreSection').hidden)renderExportSummary(e.target.value)});
  $('exportExcelButton').addEventListener('click',function(){exportMonthlyExcel($('exportPeriodSelect').value)});
  $('exportPdfButton').addEventListener('click',function(){exportMonthlyPdf($('exportPeriodSelect').value)});
  $('exportLogExcelButton').addEventListener('click',function(){exportMonthlyLogExcel($('exportPeriodSelect').value)});
  $('exportLogPdfButton').addEventListener('click',function(){exportMonthlyLogPdf($('exportPeriodSelect').value)});
  document.querySelectorAll('[data-close-note]').forEach(function(b){b.addEventListener('click',closeNoteModal)});
  $('noteModal').addEventListener('click',function(e){if(e.target.id==='noteModal')closeNoteModal()});
  $('noteForm').addEventListener('submit',submitNote);
  document.querySelectorAll('[data-close-override]').forEach(function(b){b.addEventListener('click',closeOverrideModal)});
  $('overrideScoreModal').addEventListener('click',function(e){if(e.target.id==='overrideScoreModal')closeOverrideModal()});
  $('overrideScoreForm').addEventListener('submit',submitOverrideScore);
  document.querySelectorAll('[data-close-revise-own]').forEach(function(b){b.addEventListener('click',closeReviseOwnScoreModal)});
  $('reviseOwnScoreModal').addEventListener('click',function(e){if(e.target.id==='reviseOwnScoreModal')closeReviseOwnScoreModal()});
  $('reviseOwnScoreForm').addEventListener('submit',submitReviseOwnScore);
  document.querySelectorAll('[data-close-return-rescoring]').forEach(function(b){b.addEventListener('click',closeReturnRescoringModal)});
  $('returnRescoringModal').addEventListener('click',function(e){if(e.target.id==='returnRescoringModal')closeReturnRescoringModal()});
  $('returnRescoringForm').addEventListener('submit',submitReturnRescoring);
  document.querySelectorAll('[data-close-delete-log]').forEach(function(b){b.addEventListener('click',closeDeleteLogModal)});
  $('deleteLogModal').addEventListener('click',function(e){if(e.target.id==='deleteLogModal')closeDeleteLogModal()});
  $('deleteLogForm').addEventListener('submit',submitDeleteLogForm);
  document.querySelectorAll('[data-close-assign-task]').forEach(function(b){b.addEventListener('click',closeAssignTaskModal)});
  $('assignTaskModal').addEventListener('click',function(e){if(e.target.id==='assignTaskModal')closeAssignTaskModal()});
  $('notificationToggle').addEventListener('click',function(){
    var panel=$('notificationPanel');
    panel.hidden=!panel.hidden;
    $('notificationToggle').setAttribute('aria-expanded',String(!panel.hidden));
  });
  $('markAllNotificationsRead').addEventListener('click',markAllNotificationsRead);
  document.addEventListener('click',function(e){
    var center=$('notificationCenter');
    if(center&&!center.contains(e.target))closeNotificationPanel();
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')closeNotificationPanel();
  });
  $('toggleLoginPassword') && $('toggleLoginPassword').addEventListener('click',function(){togglePasswordField('loginPassword','toggleLoginPassword')});

  // O ngay/gio dang go tay (.date-field-input/.time-field-input) - cac o
  // nay duoc DUNG LAI (innerHTML) nhieu lan trong nhieu form khac nhau nen
  // gan su kien theo kieu uy quyen (delegation) tren document, khong tren
  // tung o rieng (se mat tac dung sau moi lan dung lai).
  document.addEventListener('input',function(e){
    var el=e.target;
    if(el.tagName==='TEXTAREA')autoGrowTextarea(el);
    if(!el.classList)return;
    if(el.classList.contains('date-field-input')){
      var digits=el.value.replace(/\D/g,'').slice(0,8);
      var out=digits;
      if(digits.length>4)out=digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
      else if(digits.length>2)out=digits.slice(0,2)+'/'+digits.slice(2);
      el.value=out;
    }else if(el.classList.contains('time-field-input')){
      var digits2=el.value.replace(/\D/g,'').slice(0,4);
      var out2=digits2.length>2?digits2.slice(0,2)+':'+digits2.slice(2):digits2;
      el.value=out2;
    }
  });
  // Cac form/modal duoc dung lai (innerHTML) o rat nhieu noi khac nhau trong
  // app - thay vi phai goi autoGrowTextarea() thu cong o tung noi, dung 1
  // MutationObserver theo doi CA TRANG, tu dong dan cao BAT KY textarea nao
  // vua duoc chen vao DOM (ke ca da co san noi dung dien truoc, vi du sua
  // lai 1 nhat ky/ghi chu cu - luc do khong co su kien 'input' nao ban ra).
  new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node.nodeType!==1)return;
        if(node.tagName==='TEXTAREA')autoGrowTextarea(node);
        if(node.querySelectorAll)node.querySelectorAll('textarea').forEach(autoGrowTextarea);
      });
    });
  }).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',function(e){
    var toggleBtn=e.target.closest('[data-date-field-toggle]');
    if(toggleBtn){e.preventDefault();toggleDateFieldCalendar(toggleBtn.dataset.dateFieldToggle);return}
    if(!DATE_FIELD_CAL_STATE)return;
    var prevBtn=e.target.closest('[data-cal-prev]');
    var nextBtn=e.target.closest('[data-cal-next]');
    var dayBtn=e.target.closest('[data-cal-day]');
    if(prevBtn){DATE_FIELD_CAL_STATE.m--;if(DATE_FIELD_CAL_STATE.m<0){DATE_FIELD_CAL_STATE.m=11;DATE_FIELD_CAL_STATE.y--}renderDateFieldCalendar();return}
    if(nextBtn){DATE_FIELD_CAL_STATE.m++;if(DATE_FIELD_CAL_STATE.m>11){DATE_FIELD_CAL_STATE.m=0;DATE_FIELD_CAL_STATE.y++}renderDateFieldCalendar();return}
    if(dayBtn){
      var input=$(DATE_FIELD_CAL_STATE.id);
      if(input){input.value=isoToDmy(dayBtn.dataset.calDay);input.dispatchEvent(new Event('change',{bubbles:true}))}
      closeDateFieldCalendar();
      return;
    }
    var popupEl=document.getElementById('dateFieldCalendarPopup');
    var wrapEl=popupEl?popupEl.closest('.date-field-wrap'):null;
    if(!(wrapEl&&wrapEl.contains(e.target)))closeDateFieldCalendar();
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&DATE_FIELD_CAL_STATE)closeDateFieldCalendar();
  });
  // Phim tat Esc: dong hop thoai (bang noi) dang mo - tim ".modal-backdrop" dau tien dang hien
  // (khong "hidden"), roi bam ho nut dong co san cua no (data-close-...) de tai su dung dung
  // logic don dep trang thai da co (EDITING_ID=null, v.v.), khong tu y an DOM truc tiep.
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    var openModal=Array.prototype.find.call(document.querySelectorAll('.modal-backdrop'),function(m){return !m.hidden});
    if(!openModal)return;
    var closeBtn=openModal.querySelector('[data-close-modal],[data-close-leave-modal],[data-close-note],[data-close-assign-task],[data-close-override],[data-close-revise-own],[data-close-return-rescoring],[data-close-export],[data-close-delete-log]');
    if(closeBtn)closeBtn.click();
  });

  // Khoi phuc phien dang nhap neu con hieu luc (khong bat nguoi dung dang nhap lai khi tai trang)
  (async function(){
    var st=activeStorage().getItem('st');if(!st)return;
    try{
      var sj2=JSON.parse(st);
      if(sj2.e<Date.now()){
        var refreshed=await refreshSession();
        if(!refreshed){localStorage.removeItem('st');sessionStorage.removeItem('st');return}
        sj2=JSON.parse(activeStorage().getItem('st'));
      }
      var r=await fetch(URL+'/auth/v1/user',{headers:{'apikey':KEY,'Authorization':'Bearer '+sj2.t}});
      var d=await r.json();
      if(d&&d.id)initU(sj2.t,d.id,d.email);
    }catch(e){}
  })();
});
