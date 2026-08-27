// QLCV Production - Ket noi Supabase that, khong co du lieu demo
var U=null,V='dashboard',LOGS=[],UNITS=[],CATS=[],EDITING_ID=null,PROVINCE_UNIT_ID=null,REVIEW_QUEUE=[],SELECTED_REVIEW_ID=null;
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
var API=URL+'/rest/v1/';var AUTH=URL+'/auth/v1/';
function tkn(){try{return JSON.parse(localStorage.getItem('st')).t}catch(e){return''}}
function authHeaders(extra){var h={'apikey':KEY,'Authorization':'Bearer '+tkn()};if(extra)for(var k in extra)h[k]=extra[k];return h}

// Luu phien dang nhap kem thoi diem het han THAT (tu Supabase tra ve), tru
// bot 30 giay cho an toan, thay vi doan cung 1 gio nhu truoc.
function saveSession(accessToken,refreshToken,expiresIn){
  var expiresAt=Date.now()+(Number(expiresIn)||3600)*1000-30000;
  localStorage.setItem('st',JSON.stringify({t:accessToken,r:refreshToken,e:expiresAt}));
}
window.QLCV_saveSession=saveSession;

// Tu lam moi phien bang refresh_token khi access_token sap het han, de trang
// mo lau khong bi loi ngam (tuong tu nhu vua gap: thao tac bao thanh cong
// nhung khong co gi thay doi vi phien da het han ma khong ai biet).
async function refreshSession(){
  try{
    var st=localStorage.getItem('st');if(!st)return false;
    var sj=JSON.parse(st);if(!sj.r)return false;
    var r=await fetch(AUTH+'token?grant_type=refresh_token',{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:sj.r})});
    var d=await r.json();
    if(!r.ok||!d.access_token)return false;
    saveSession(d.access_token,d.refresh_token,d.expires_in);
    return true;
  }catch(e){return false}
}

function scheduleSessionRefresh(){
  setInterval(async function(){
    var st=localStorage.getItem('st');if(!st)return;
    try{
      var sj=JSON.parse(st);
      if(sj.e&&sj.e-Date.now()<5*60*1000)await refreshSession();
    }catch(e){}
  },4*60*1000);
}
scheduleSessionRefresh();
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

var WORK_ROLE_LABEL={chu_tri:'Chủ trì',phoi_hop:'Phối hợp'};
var DURATION_LABEL={duoi_2_gio:'Dưới 2 giờ','2_4_gio':'2–4 giờ',tren_4_gio:'Trên 4 giờ',nhieu_ngay:'Nhiều ngày'};
var STATUS_LABEL={pending:'Chờ đánh giá',approved:'Đã xác nhận',revision:'Cần bổ sung'};
var STATUS_CLASS={pending:'status-pending',approved:'status-approved',revision:'status-revision'};

function catName(id){var c=CATS.find(function(x){return x.id===id});return c?c.name:'—'}
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
    U={id:uid,n:profile.full_name||em,tl:'',rl:'staff',uid:profile.unit_id,in:'…',token:t,pending:true};
    $('loginScreen').hidden=true;$('appShell').hidden=false;document.body.classList.remove('login-active');
    showPendingScreen();
    return;
  }

  try{
    var p=profile||{};
    U={id:uid,n:p.full_name||em,tl:p.title||'',rl:p.role||'staff',uid:p.unit_id,in:p.initials||'U',token:t};
    var ur=await fetch(API+'units?select=id,code,name,short_name,type',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    UNITS=await ur.json();
    var province=UNITS.find(function(u){return u.type==='province'});
    PROVINCE_UNIT_ID=province?province.id:null;
    var cr=await fetch(API+'work_categories?select=id,name&is_active=eq.true&order=sort_order',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    CATS=await cr.json();
    populateCategorySelect();
    var aur=await fetch(API+'unit_assignments?user_id=eq.'+uid+'&select=unit_id',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    var au=aur.ok?await aur.json():[];
    U.assignedUnits=(au||[]).map(function(x){return x.unit_id});
    var delr=await fetch(API+'delegations?delegate_id=eq.'+uid+'&status=eq.active&select=id&limit=1',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
    var del=delr.ok?await delr.json():[];
    U.delegated=Array.isArray(del)&&del.length>0;
  }catch(e){}
  $('loginScreen').hidden=true;$('appShell').hidden=false;document.body.classList.remove('login-active');
  ub();V='dashboard';render();showToast('Đăng nhập thành công!');
  refreshPendingBadge();
  renderNotificationsUI();
}

function showPendingScreen(){
  setVisible($('sidebar'),false);
  var nc=$('notificationCenter');if(nc)nc.hidden=true;
  var mm=$('mobileMenu');if(mm)mm.hidden=true;
  $('pageEyebrow').textContent='TÀI KHOẢN MỚI';$('pageTitle').textContent='Đang chờ xác nhận';
  $('appView').innerHTML='<div class="empty-state" style="margin-top:40px"><strong>Tài khoản của bạn đang chờ quản trị viên xác nhận</strong><span>Bạn đã đăng ký thành công bằng mã đơn vị. Quản trị viên sẽ đối chiếu thông tin và kích hoạt tài khoản trong thời gian sớm nhất. Vui lòng quay lại sau.</span></div>';
}

// Chan cung o phia trinh duyet cho tai khoan dang cho xac nhan - lop phong
// thu 2, ngoai viec RLS o database da chan ghi du lieu that.
function requireActive(){
  if(U&&U.pending){showToast('Tài khoản đang chờ quản trị viên xác nhận, chưa thể thao tác.');return false}
  return true;
}

function isLeader(){return U&&['province_head','province_deputy','unit_head','unit_deputy'].indexOf(U.rl)>=0}
function isAdminOrProvinceHead(){return U&&(U.rl==='administrator'||U.rl==='province_head')}

function populateCategorySelect(){
  var sel=$('categorySelect');if(!sel)return;
  var current=sel.value;
  sel.innerHTML='<option value="">Chọn lĩnh vực</option>'+CATS.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('');
  if(current)sel.value=current;
}

function ub(){
  if(!U)return;
  // Neu truoc do tung o man hinh "cho xac nhan" (showPendingScreen da an
  // sidebar/chuong thong bao/nut menu), phai hien lai day du khi tai khoan
  // da duoc kich hoat va dang nhap binh thuong.
  setVisible($('sidebar'),true);
  var nc0=$('notificationCenter');if(nc0)nc0.hidden=false;
  var mm0=$('mobileMenu');if(mm0)mm0.hidden=false;

  var un0=$('sidebarUserName');if(un0)un0.textContent=U.n;
  var ut0=$('sidebarUserTitle');if(ut0)ut0.textContent=U.tl||ROLE_LABELS[U.rl]||'';

  setVisible(document.querySelector('.review-nav'),isLeader());
  setVisible(document.querySelector('.unit-journal-nav'),isLeader());
  setVisible(document.querySelector('.admin-nav'),isAdminOrProvinceHead());
  // Co cau to chuc chi danh cho Vien truong tinh va quan tri vien.
  setVisible(document.querySelector('.org-nav'),isAdminOrProvinceHead());
  // Quan tri vien khong ghi cong viec, khong can Nhat ky/Cham diem thang.
  var isAdminOnly=(U.rl==='administrator');
  setVisible(document.querySelector('.journal-nav'),!isAdminOnly);
  setVisible(document.querySelector('.monthly-nav'),!isAdminOnly);

  if(!isLeader()&&V==='reviews')V='dashboard';
  if(!isLeader()&&V==='unitJournal')V='dashboard';
  if(!isAdminOrProvinceHead()&&V==='administration')V='dashboard';
  if(!isAdminOrProvinceHead()&&V==='organization')V='dashboard';
  if(isAdminOnly&&(V==='journal'||V==='monthly'))V='dashboard';
}

function render(){
  if(U&&U.pending){showPendingScreen();return}
  if(V==='dashboard')rd();
  else if(V==='journal')rj();
  else if(V==='notes')rn();
  else if(V==='reviews')rr();
  else if(V==='unitJournal')ruj();
  else if(V==='monthly')rm();
  else if(V==='organization')ro();
  else if(V==='administration')ra();
  else if(V==='settings')rs();
  else rp();
}

// Man hinh chua xay dung (quan tri: tao/duyet tai khoan that - de sau theo yeu cau)
function rp(){
  $('pageEyebrow').textContent='ĐANG PHÁT TRIỂN';$('pageTitle').textContent='Chưa hoàn thiện';
  $('appView').innerHTML='<div class="empty-state"><strong>Tính năng đang được xây dựng</strong><span>Phần này sẽ sớm được nối với dữ liệu thật.</span></div>';
}

// ============================================
// DASHBOARD - tong hop that, thay cho du lieu demo
// ============================================
var DASHBOARD_PERIOD='month',DASHBOARD_UNIT_FILTER='all',DASHBOARD_COMPARISON_MODE='unit',DASHBOARD_PERSON_UNIT='all';
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
  if(U.rl==='province_deputy')return UNITS.filter(function(u){return (U.assignedUnits||[]).indexOf(u.id)>=0});
  return UNITS.filter(function(u){return u.id===U.uid});
}

async function fetchDashboardLogs(){
  var now=new Date();
  var start=ymdStr(now.getFullYear(),now.getMonth()-5,1);
  var r=await fetch(API+'work_logs?log_date=gte.'+start+'&select=author_id,unit_id,log_date,status,complexity_score,quality_score&order=log_date.desc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return await r.json();
}

async function fetchDashboardScopeProfiles(){
  var sel='id,full_name,title,professional_title,role,unit_id,initials';
  if(U.rl==='staff'||U.rl==='support_staff')return [{id:U.id,full_name:U.n,title:U.tl,professional_title:'',role:U.rl,unit_id:U.uid,initials:U.in}];
  if(U.rl==='unit_head'||U.rl==='unit_deputy'){
    var r=await fetch(API+'profiles?unit_id=eq.'+U.uid+'&role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return await r.json();
  }
  if(U.rl==='province_deputy'){
    var ids=(U.assignedUnits||[]);
    if(!ids.length)return [];
    var r2=await fetch(API+'profiles?unit_id=in.('+ids.join(',')+')&role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!r2.ok)throw new Error('HTTP '+r2.status);
    return await r2.json();
  }
  var r3=await fetch(API+'profiles?role=neq.administrator&select='+sel,{headers:authHeaders()});
  if(!r3.ok)throw new Error('HTTP '+r3.status);
  return await r3.json();
}

function aggregateRowSnake(id,label,items,peopleCount,sublabel){
  return {
    id:id,label:label,sublabel:sublabel||'',people:peopleCount,count:items.length,
    complexityTotal:items.reduce(function(s,i){return s+(i.complexity_score||0)},0),
    complexityAvg:average(items.map(function(i){return i.complexity_score}).filter(function(v){return Number.isFinite(v)})),
    quality:weightedQualitySnake(items),
    highQuality:items.filter(function(i){return i.quality_score>=8}).length
  };
}

function aggregateByUnit(approved,people){
  return dashboardAvailableUnits().map(function(u){
    var subset=approved.filter(function(l){return l.unit_id===u.id});
    var peopleCount=people.filter(function(p){return p.unit_id===u.id}).length;
    return aggregateRowSnake(u.id,u.short_name||u.code,subset,peopleCount);
  }).filter(function(row){return row.count>0});
}

function aggregateByUser(approved,people,unitId){
  return people.filter(function(p){return p.unit_id===unitId}).map(function(p){
    var subset=approved.filter(function(l){return l.author_id===p.id});
    return aggregateRowSnake(p.id,p.full_name,subset,1,p.title);
  }).filter(function(row){return row.count>0});
}

function aggregateVisibleUsers(approved,people,unitId){
  return people.filter(function(p){return p.role!=='administrator'&&(!unitId||p.unit_id===unitId)}).map(function(p){
    var subset=approved.filter(function(l){return l.author_id===p.id});
    return aggregateRowSnake(p.id,p.full_name,subset,1,(p.title||'')+' · '+unitShort(p.unit_id));
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
  return '<div class="table-sort-help">Chọn tên cột để sắp xếp · nhấn lần nữa để đổi chiều'+(clickable?' · Nhấn 1 dòng để xem nhật ký công tác':'')+'</div><div class="table-wrap"><table><thead><tr><th>'+(isUnit?'Đơn vị':'Cán bộ')+'</th>'+sortableHeader('Kết quả','count')+sortableHeader('Tổng phức tạp','complexityTotal')+sortableHeader('Phức tạp BQ','complexityAvg')+sortableHeader('Chất lượng','quality')+sortableHeader('Tỷ lệ ≥ 8','highQualityRate')+'</tr></thead><tbody>'+sortedRows.map(function(row){
    var firstCell;
    if(isUnit){firstCell='<strong>'+esc(row.label)+'</strong><br><span class="metric-context">'+row.people+' người</span>'}
    else{var p=personById(row.id);firstCell='<div class="person-cell"><span class="mini-avatar">'+esc(p&&p.initials?p.initials:'')+'</span><div><strong>'+esc(row.label)+'</strong><span>'+esc(row.sublabel)+'</span></div></div>'}
    var rowAttr=clickable?(isUnit?' class="summary-row-clickable" data-summary-unit="'+esc(row.id)+'"':' class="summary-row-clickable" data-summary-person="'+esc(row.id)+'"'):'';
    return '<tr'+rowAttr+'><td>'+firstCell+'</td><td class="numeric">'+row.count+'</td><td class="numeric">'+row.complexityTotal+'</td><td class="numeric">'+row.complexityAvg.toFixed(1)+'</td><td class="numeric"><span class="score-pill '+scoreClassOf(row.quality)+'">'+row.quality.toFixed(1)+'</span></td><td class="numeric">'+(row.highQuality/row.count*100).toFixed(0)+'%</td></tr>';
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

  var grouping=provinceScope?aggregateByUnit(approved,people):aggregateByUser(approved,people,U.uid);
  var comparisonMode=provinceScope?DASHBOARD_COMPARISON_MODE:'person';
  var personUnitId=DASHBOARD_PERSON_UNIT==='all'?null:DASHBOARD_PERSON_UNIT;
  var personalGrouping=aggregateVisibleUsers(approved,people,personUnitId);
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
    +'<section class="panel bento-tile bento-comparison"><div class="panel-header"><div><h2>So sánh chất lượng '+(comparisonMode==='unit'?'theo đơn vị':'theo cá nhân')+'</h2><p>'+(comparisonMode==='unit'?'Hai nhóm đơn vị trên cùng thang điểm':'Xếp theo chất lượng; luôn đọc cùng điểm phức tạp và số kết quả')+'</p></div><div class="comparison-controls">'
    +(provinceScope?('<select id="comparisonMode" aria-label="Chọn cách so sánh"><option value="unit" '+(comparisonMode==='unit'?'selected':'')+'>Theo đơn vị</option><option value="person" '+(comparisonMode==='person'?'selected':'')+'>Theo cá nhân</option></select>'):'')
    +(provinceScope&&comparisonMode==='person'?('<select id="comparisonPersonUnit" aria-label="Lọc đơn vị khi so sánh cá nhân"><option value="all">Tất cả đơn vị</option>'+availableUnits.map(function(u){return '<option value="'+u.id+'" '+(DASHBOARD_PERSON_UNIT===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select>'):'')
    +'</div></div>'+comparisonBarChartHtml(comparisonGrouping,comparisonMode==='person'?12:Infinity)+'</section>'
    +'<section class="panel panel-wide bento-tile bento-summary"><div class="panel-header"><div><h2>'+tableTitle+'</h2><p>Khối lượng, độ phức tạp và chất lượng trong kỳ</p></div></div>'+summaryTableHtml(grouping,provinceScope,people)+'</section>'
    +'</div>';

  $('appView').innerHTML=h;

  var periodSel=$('dashboardPeriodFilter');if(periodSel)periodSel.addEventListener('change',function(e){DASHBOARD_PERIOD=e.target.value;rd()});
  var unitSel=$('dashboardUnitFilter');if(unitSel)unitSel.addEventListener('change',function(e){DASHBOARD_UNIT_FILTER=e.target.value;rd()});
  var cmpSel=$('comparisonMode');if(cmpSel)cmpSel.addEventListener('change',function(e){DASHBOARD_COMPARISON_MODE=e.target.value;rd()});
  var cmpPersonSel=$('comparisonPersonUnit');if(cmpPersonSel)cmpPersonSel.addEventListener('change',function(e){DASHBOARD_PERSON_UNIT=e.target.value;rd()});
  document.querySelectorAll('[data-summary-sort]').forEach(function(b){b.addEventListener('click',function(){
    var key=b.dataset.summarySort;
    DASHBOARD_SORT={key:key,direction:(DASHBOARD_SORT.key===key&&DASHBOARD_SORT.direction==='desc')?'asc':'desc'};
    rd();
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

var JOURNAL_STATUS_FILTER='all',JOURNAL_SEARCH='';

async function rj(){
  $('pageEyebrow').textContent='NHẬT KÝ';$('pageTitle').textContent='Nhật ký công tác';
  if(U.rl==='administrator'){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  try{
    var r=await fetch(API+'work_logs?author_id=eq.'+U.id+'&order=log_date.desc,created_at.desc',{headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    LOGS=await r.json();
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
  h+='<div class="journal-header"><div><h2>'+esc(U.n)+'</h2><p>'+esc(U.tl||'')+'</p></div><button class="button button-primary" id="nj">+ Ghi nhật ký mới</button></div>';
  h+='<div class="metric-grid">'
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
  document.querySelectorAll('[data-edit-journal]').forEach(function(b){b.addEventListener('click',function(){oj(b.dataset.editJournal)})});
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
  var canEdit=log.status==='revision'&&!opts.readOnly;
  var revisionFeedback=log.status==='revision'?'<div class="revision-feedback"><strong>Lãnh đạo yêu cầu bổ sung</strong><span>'+esc(log.review_comment||'Cần chỉnh sửa, làm rõ kết quả công tác.')+'</span></div>':'';
  var resubmission=log.revision_count?'<span class="meta-tag">Đã trình lại '+log.revision_count+' lần</span>':'';
  var overriddenTag=(log._reviewCount||0)>=2?'<span class="meta-tag meta-tag-warning">Điểm đã được lãnh đạo cấp trên điều chỉnh</span>':'';
  var authorTag=opts.authorName?(opts.authorId?'<button type="button" class="meta-tag journal-author-tag" data-uj-jump-person="'+esc(opts.authorId)+'">'+esc(opts.authorName)+'</button>':'<span class="meta-tag journal-author-tag">'+esc(opts.authorName)+'</span>'):'';
  return '<article class="journal-card '+(log.status==='revision'?'is-revision':'')+'">'
    +'<div class="journal-date"><strong>'+shortDate(log.log_date)+'</strong>'+(log.log_date||'').slice(0,4)+'</div>'
    +'<div class="journal-body"><h3>'+esc(log.title)+'</h3><p>'+esc(log.result)+'</p>'+revisionFeedback
    +'<div class="journal-meta">'+authorTag+'<span class="meta-tag">'+esc(catName(log.category_id))+'</span><span class="meta-tag">'+esc(WORK_ROLE_LABEL[log.work_role]||log.work_role)+'</span><span class="meta-tag">'+esc(DURATION_LABEL[log.duration]||log.duration)+'</span>'+resubmission+overriddenTag+'<span class="status-pill '+(STATUS_CLASS[log.status]||'')+'">'+(STATUS_LABEL[log.status]||log.status)+'</span></div></div>'
    +'<div class="journal-side"><div class="journal-scores"><div class="score-box"><span>Phức tạp</span><strong>'+(log.complexity_score==null?'—':log.complexity_score)+'</strong></div><div class="score-box"><span>Chất lượng</span><strong>'+(log.quality_score==null?'—':log.quality_score)+'</strong></div></div>'
    +(canEdit?'<button type="button" class="button button-primary button-small" data-edit-journal="'+log.id+'">Sửa và trình lại</button>':'')
    +(opts.canOverride?'<button type="button" class="button button-secondary button-small" data-override-score="'+log.id+'">Điều chỉnh điểm</button>':'')+'</div></article>';
}

function oj(logId){
  if(!requireActive())return;
  var form=$('journalForm');form.reset();
  var log=logId?LOGS.find(function(l){return l.id===logId}):null;
  var canEdit=Boolean(log&&log.status==='revision');
  EDITING_ID=canEdit?log.id:null;
  $('journalModalTitle').textContent=canEdit?'Chỉnh sửa và trình lại kết quả':'Ghi nhận kết quả công việc';
  $('journalSubmitButton').textContent=canEdit?'Lưu và trình lại':'Gửi nhật ký';
  var notice=$('journalRevisionNotice');
  notice.hidden=!canEdit;
  $('journalRevisionComment').textContent=canEdit?(log.review_comment||''):'';
  populateCategorySelect();
  if(canEdit){
    form.elements.workDate.value=log.log_date;
    form.elements.category.value=log.category_id;
    form.elements.title.value=log.title;
    form.elements.result.value=log.result;
    form.elements.workRole.value=log.work_role;
    form.elements.duration.value=log.duration;
    form.elements.evidence.value=log.evidence||'';
    form.elements.selfComplexity.value=log.self_complexity_score||'';
    form.elements.selfQuality.value=log.self_quality_score||'';
  }else{
    form.elements.workDate.valueAsDate=new Date();
  }
  setVisible($('copyJournalBlock'),!canEdit);
  $('copyJournalPanel').hidden=true;
  $('copyJournalSearch').value='';
  renderCopyJournalList('');
  checkJournalDateWarning();
  $('journalModal').hidden=false;document.body.style.overflow='hidden';
  (canEdit?form.elements.title:form.elements.category).focus();
}
function cj(){$('journalModal').hidden=true;document.body.style.overflow='';EDITING_ID=null}

// Cho phep nhap lui ngay (khong khoa qua khu), chi canh bao nhe khi chon
// ngay qua xa - khong chan gui.
function checkJournalDateWarning(){
  var input=$('journalForm').elements.workDate;
  var warning=$('journalDateWarning');
  var value=input.value;
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
  var f=new FormData($('journalForm'));
  var payload={
    log_date:f.get('workDate'),
    category_id:f.get('category'),
    title:(f.get('title')||'').trim(),
    result:(f.get('result')||'').trim(),
    work_role:f.get('workRole'),
    duration:f.get('duration'),
    evidence:(f.get('evidence')||'').trim()||null,
    self_complexity_score:Number(f.get('selfComplexity')),
    self_quality_score:Number(f.get('selfQuality'))
  };
  if(!payload.category_id){showToast('Vui lòng chọn lĩnh vực công tác');return}
  var btn=$('journalSubmitButton');btn.disabled=true;
  try{
    if(EDITING_ID){
      var existing=LOGS.find(function(l){return l.id===EDITING_ID});
      payload.status='pending';
      payload.reviewer_id=null;payload.reviewed_at=null;payload.review_comment=null;
      payload.revision_count=(existing?existing.revision_count:0)+1;
      var r=await fetch(API+'work_logs?id=eq.'+EDITING_ID,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(payload)});
      if(!r.ok)throw new Error('HTTP '+r.status);
      showToast('Đã chỉnh sửa và trình lại lãnh đạo chấm điểm.');
    }else{
      payload.author_id=U.id;payload.unit_id=U.uid;payload.status='pending';
      var r2=await fetch(API+'work_logs',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(payload)});
      if(!r2.ok)throw new Error('HTTP '+r2.status);
      showToast('Đã gửi nhật ký.');
    }
    cj();
    rj();
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
}

function unitShort(id){var u=UNITS.find(function(x){return x.id===id});return u?(u.short_name||u.code):'—'}
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
    +'<div class="note-card-actions"><button type="button" class="button button-secondary button-small" data-edit-note="'+note.id+'">Sửa</button><button type="button" class="button button-danger button-small" data-delete-note="'+note.id+'">Xoá</button></div>'
    +'</article>';
}

function openNoteModal(dateStr,noteId){
  var form=$('noteForm');form.reset();
  var note=noteId?NOTES_CACHE.find(function(n){return n.id===noteId}):null;
  $('noteModalTitle').textContent=note?'Sửa ghi chú công việc':'Thêm ghi chú công việc';
  $('noteSubmitButton').textContent=note?'Lưu thay đổi':'Lưu ghi chú';
  form.dataset.editingNoteId=note?note.id:'';
  form.elements.noteDate.value=note?note.note_date:(dateStr||NOTES_SELECTED_DATE);
  form.elements.title.value=note?note.title:'';
  form.elements.content.value=note?(note.content||''):'';
  $('noteModal').hidden=false;
  form.elements.title.focus();
}
function closeNoteModal(){$('noteModal').hidden=true}

async function submitNote(e){
  e.preventDefault();
  var f=new FormData($('noteForm'));
  var editingId=$('noteForm').dataset.editingNoteId;
  var noteDate=f.get('noteDate');
  var title=(f.get('title')||'').trim();
  var content=(f.get('content')||'').trim();
  if(!noteDate||!title)return;
  var btn=$('noteSubmitButton');btn.disabled=true;
  try{
    if(editingId){
      var r=await fetch(API+'personal_notes?id=eq.'+editingId,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({note_date:noteDate,title:title,content:content||null})});
      if(!r.ok)throw new Error('HTTP '+r.status);
      showToast('Đã cập nhật ghi chú.');
    }else{
      var r2=await fetch(API+'personal_notes',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({user_id:U.id,note_date:noteDate,title:title,content:content||null})});
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
async function ro(){
  $('pageEyebrow').textContent='MÔ HÌNH TỔ CHỨC';$('pageTitle').textContent='Cơ cấu và phân quyền';
  if(!isAdminOrProvinceHead()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var people=[];var assignedByUser={};
  try{
    var r=await fetch(API+'profiles?select=id,full_name,role,unit_id,is_active',{headers:authHeaders()});
    people=r.ok?await r.json():[];
    var ar=await fetch(API+'unit_assignments?select=user_id,unit_id',{headers:authHeaders()});
    var assignments=ar.ok?await ar.json():[];
    assignments.forEach(function(a){(assignedByUser[a.user_id]=assignedByUser[a.user_id]||[]).push(a.unit_id)});
  }catch(e){}
  var departments=UNITS.filter(function(u){return u.type==='department'});
  var regionals=UNITS.filter(function(u){return u.type==='regional'});
  function orgUnitCardHtml(unit){
    var head=people.find(function(p){return p.unit_id===unit.id&&p.role==='unit_head'});
    var memberCount=people.filter(function(p){return p.unit_id===unit.id}).length;
    return '<div class="org-unit"><div><strong>'+esc(unit.short_name||unit.code)+'</strong><span>'+(head?esc(head.full_name):'Chưa xác định người đứng đầu')+'</span></div><span class="score-pill score-mid">'+memberCount+' người</span></div>';
  }
  var h='<div class="dashboard-grid">'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Cây tổ chức</h2><p>Hai nhóm đơn vị ngang cấp, cùng trực thuộc VKSND tỉnh</p></div></div><div class="org-tree"><div class="org-root"><strong>VKSND tỉnh</strong><span>Viện trưởng · Các Phó Viện trưởng</span></div><div class="org-branches"><div class="org-column"><h3>Phòng chuyên trách</h3>'+departments.map(orgUnitCardHtml).join('')+'</div><div class="org-column"><h3>VKSND khu vực</h3>'+regionals.map(orgUnitCardHtml).join('')+'</div></div></div></section>'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Gán vai trò và đơn vị</h2><p>Chỉ định đúng chức vụ và đơn vị cho từng tài khoản, nhóm theo đơn vị. Tài khoản đang chờ xác nhận sẽ được kích hoạt luôn khi gán. Viện trưởng/Phó Viện trưởng tỉnh chọn "Lãnh đạo Viện tỉnh" làm đơn vị. Với vai trò Phó Viện trưởng tỉnh, tick chọn thêm các đơn vị được phân công phụ trách.</p></div></div>'+assignRoleGroupedHtml(people,assignedByUser)+'</section>'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Quy tắc người chấm</h2><p>Không cho phép người dùng tự chấm nhật ký của mình</p></div></div><div class="org-role-list">'
    +'<div class="org-role-row"><strong>Cán bộ, công chức</strong><p>Người đứng đầu đơn vị trực tiếp đánh giá; cấp phó chỉ chấm khi có ủy quyền.</p></div>'
    +'<div class="org-role-row"><strong>Phó lãnh đạo đơn vị</strong><p>Viện trưởng khu vực hoặc Trưởng phòng đánh giá.</p></div>'
    +'<div class="org-role-row"><strong>Người đứng đầu đơn vị</strong><p>Lãnh đạo tỉnh được phân công phụ trách đơn vị đánh giá.</p></div>'
    +'<div class="org-role-row"><strong>Phó Viện trưởng tỉnh</strong><p>Viện trưởng tỉnh đánh giá.</p></div>'
    +'</div></section></div>';
  $('appView').innerHTML=h;
  document.querySelectorAll('[data-save-role]').forEach(function(b){b.addEventListener('click',function(){saveAccountRole(b.dataset.saveRole)})});
  document.querySelectorAll('[data-toggle-active]').forEach(function(b){b.addEventListener('click',function(){toggleAccountActive(b.dataset.toggleActive,b.dataset.active==='true')})});
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
    var roleSel='<select data-role-select="'+p.id+'">'+ROLE_OPTIONS.map(function(r){return '<option value="'+r+'" '+(p.role===r?'selected':'')+'>'+ROLE_LABELS[r]+'</option>'}).join('')+'</select>';
    var unitSel='<select data-unit-select="'+p.id+'">'+homeUnitOptions.map(function(u){return '<option value="'+u.id+'" '+(p.unit_id===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select>';
    var assigned=assignedByUser[p.id]||[];
    var isDeputy=p.role==='province_deputy';
    var checklist='<div class="unit-checklist" data-assigned-checklist="'+p.id+'" style="display:'+(isDeputy?'':'none')+'">'+deptUnits.map(function(u){return '<label><input type="checkbox" value="'+u.id+'" '+(assigned.indexOf(u.id)>=0?'checked':'')+'> '+esc(u.short_name||u.code)+'</label>'}).join('')+'</div>'
      +'<span class="unit-checklist-empty" data-assigned-empty="'+p.id+'" style="display:'+(isDeputy?'none':'')+'">Chỉ áp dụng cho Phó Viện trưởng tỉnh</span>';
    var isSelf=p.id===U.id;
    var lockBtn=isSelf?'':'<button type="button" class="button button-small '+(p.is_active?'button-danger':'button-secondary')+'" data-toggle-active="'+p.id+'" data-active="'+p.is_active+'">'+(p.is_active?'Khoá':'Mở lại')+'</button>';
    return '<tr data-person-name="'+esc((p.full_name||'').normalize('NFC').toLowerCase())+'"><td><strong>'+esc(p.full_name)+'</strong></td><td><span class="status-pill '+(p.is_active?'status-approved':'status-pending')+'">'+(p.is_active?'Đang hoạt động':'Chờ xác nhận')+'</span></td><td>'+roleSel+'</td><td>'+unitSel+'</td><td>'+checklist+'</td><td class="numeric"><button class="button button-primary button-small" data-save-role="'+p.id+'">Lưu</button> '+lockBtn+'</td></tr>';
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
    ro();
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

function updatePendingBadge(n){var el=$('pendingNavCount');if(el)el.textContent=n}
async function refreshPendingBadge(){
  if(!isLeader())return;
  try{var q=await fetchReviewQueue();updatePendingBadge(q.length)}catch(e){}
}

function canReviewLog(log,author){
  if(!author||log.author_id===U.id)return false;
  var ar=author.role,auid=author.unit_id;
  if(U.rl==='province_head')return ar==='province_deputy'||ar==='unit_head'||auid===PROVINCE_UNIT_ID;
  if(U.rl==='province_deputy')return ar==='unit_head'&&(U.assignedUnits||[]).indexOf(auid)>=0;
  if(U.rl==='unit_head')return auid===U.uid&&ar!=='unit_head';
  if(U.rl==='unit_deputy'&&U.delegated)return auid===U.uid&&(ar==='staff'||ar==='support_staff');
  return false;
}

async function fetchReviewQueue(){
  if(!isLeader())return [];
  var r=await fetch(API+'work_logs?status=eq.pending&order=created_at.desc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  var pending=(await r.json()).filter(function(l){return l.author_id!==U.id});
  if(!pending.length)return [];
  var ids=Array.from(new Set(pending.map(function(l){return l.author_id}))).join(',');
  var pr=await fetch(API+'profiles?id=in.('+ids+')&select=id,full_name,title,role,unit_id',{headers:authHeaders()});
  var authors=pr.ok?await pr.json():[];
  var authorMap={};authors.forEach(function(a){authorMap[a.id]=a});
  return pending.filter(function(l){return canReviewLog(l,authorMap[l.author_id])}).map(function(l){l._author=authorMap[l.author_id];return l});
}

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

async function rr(){
  $('pageEyebrow').textContent='CHỜ DUYỆT';$('pageTitle').textContent='Duyệt và chấm điểm';
  if(!isLeader()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var queue;
  try{queue=await fetchReviewQueue()}catch(e){$('appView').innerHTML='<div class="empty-state"><strong>Không tải được hàng chờ</strong><span>'+esc(e.message)+'</span></div>';return}
  REVIEW_QUEUE=queue;
  updatePendingBadge(queue.length);
  if(!SELECTED_REVIEW_ID||!queue.some(function(l){return l.id===SELECTED_REVIEW_ID})){SELECTED_REVIEW_ID=queue[0]?queue[0].id:null}
  var selected=queue.find(function(l){return l.id===SELECTED_REVIEW_ID});
  var h='<div class="toolbar"><div><h2>'+queue.length+' nhật ký chờ đánh giá</h2><p class="metric-context">Chỉ hiển thị nhật ký thuộc phạm vi được phân công.</p></div></div>';
  h+='<div class="review-layout"><section><div class="review-queue">';
  h+=queue.length?groupQueueByAuthor(queue).map(function(g){
    var authorName=g.author?esc(g.author.full_name||''):'Không xác định tác giả';
    var authorUnit=g.author?esc(unitShort(g.author.unit_id)):'';
    var items=g.items.map(function(l,idx){
      return '<button class="queue-item '+(l.id===SELECTED_REVIEW_ID?'is-selected':'')+'" data-review-id="'+l.id+'">'
        +'<span class="queue-index">'+(idx+1)+'</span>'
        +'<span class="queue-item-body"><p>'+esc(l.title)+'</p><span class="queue-meta">'+(l.revision_count?'<span class="resubmission-badge">Trình lại lần '+l.revision_count+'</span>':'')+'<span>'+shortDateTime(submittedAtOf(l))+'</span></span></span>'
        +'</button>';
    }).join('');
    return '<div class="queue-group"><div class="queue-group-header"><strong>'+authorName+'</strong>'+(authorUnit?'<span>'+authorUnit+'</span>':'')+'</div>'+items+'</div>';
  }).join(''):'<div class="panel empty-state"><strong>Đã xử lý hết</strong><span>Không còn nhật ký chờ đánh giá.</span></div>';
  h+='</div></section><section class="panel review-detail">'+(selected?reviewDetailHtml(selected):'<div class="empty-state"><strong>Không có nhật ký cần xử lý</strong><span>Hãy quay lại khi có nhật ký mới.</span></div>')+'</section></div>';
  $('appView').innerHTML=h;
  document.querySelectorAll('[data-review-id]').forEach(function(b){b.addEventListener('click',function(){SELECTED_REVIEW_ID=b.dataset.reviewId;rr()})});
  if(selected)bindReviewActions(selected);
}

function reviewDetailHtml(log){
  var hasSelfScore=log.self_complexity_score!=null&&log.self_quality_score!=null;
  var complexity=log.complexity_score||log.self_complexity_score||6;
  var quality=log.quality_score||log.self_quality_score||8;
  var resubmission=log.revision_count?'<div class="resubmission-context"><strong>Báo cáo đã được chỉnh sửa và trình lại lần '+log.revision_count+'</strong></div>':'';
  var selfScoreNote=hasSelfScore?'<div class="self-score-note"><span>Cán bộ tự chấm: Độ phức tạp <strong>'+log.self_complexity_score+'</strong> · Chất lượng <strong>'+log.self_quality_score+'</strong></span><button type="button" class="button button-secondary button-small" id="acceptSelfScore">Đồng ý với tự chấm</button></div>':'';
  return '<div class="panel-header"><div><span class="eyebrow">'+shortDate(log.log_date)+'</span><h2>'+esc(log.title)+'</h2><p>'+esc(log._author.full_name||'')+' · '+esc(log._author.title||'')+' · '+esc(unitShort(log.unit_id))+'</p></div></div>'
    +resubmission
    +'<div class="detail-section"><h3>Kết quả báo cáo</h3><p>'+esc(log.result)+'</p><div class="detail-grid"><div class="detail-item"><span>Lĩnh vực</span><strong>'+esc(catName(log.category_id))+'</strong></div><div class="detail-item"><span>Vai trò</span><strong>'+esc(WORK_ROLE_LABEL[log.work_role]||log.work_role)+'</strong></div><div class="detail-item"><span>Thời gian</span><strong>'+esc(DURATION_LABEL[log.duration]||log.duration)+'</strong></div><div class="detail-item"><span>Minh chứng</span><strong>'+esc(log.evidence||'Không có')+'</strong></div></div></div>'
    +'<div class="detail-section">'+selfScoreNote+'<div class="rating-grid">'
    +'<div class="rating-control"><div class="rating-head"><div><h3>Độ phức tạp</h3><span class="metric-context">Bản chất và phạm vi công việc</span></div><span class="rating-value" id="complexityValue">'+complexity+'</span></div><input id="complexityRange" type="range" min="1" max="10" value="'+complexity+'" aria-label="Điểm độ phức tạp"><div class="range-labels"><span>Đơn giản</span><span>Đặc biệt phức tạp</span></div>'+scoringGuideMarkup('complexity',complexity)+'</div>'
    +'<div class="rating-control"><div class="rating-head"><div><h3>Chất lượng</h3><span class="metric-context">Đúng, đủ, kịp thời và sử dụng được</span></div><span class="rating-value" id="qualityValue">'+quality+'</span></div><input id="qualityRange" type="range" min="1" max="10" value="'+quality+'" aria-label="Điểm chất lượng"><div class="range-labels"><span>Không đạt</span><span>Rất tốt</span></div>'+scoringGuideMarkup('quality',quality)+'</div>'
    +'</div></div>'
    +'<div class="detail-section"><label class="field"><span>Nhận xét của lãnh đạo</span><textarea id="reviewComment" rows="3" placeholder="Bắt buộc khi điểm chất lượng dưới 5 hoặc từ 9 trở lên, hoặc khi yêu cầu bổ sung"></textarea></label><div class="review-actions"><button class="button button-danger" id="requestRevision">Yêu cầu bổ sung</button><button class="button button-primary" id="approveLog">Xác nhận kết quả</button></div></div>';
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
    {max:8,title:'Tốt',text:'Kết quả đúng, đầy đủ, kịp thời và trình bày rõ ràng.'},
    {max:10,title:'Rất tốt',text:'Kết quả nổi bật, hiệu quả cao hoặc có sáng kiến mang lại giá trị.'}
  ]
};
function scoringGuide(type,value){
  var v=Number(value);
  var list=scoringGuides[type];
  for(var i=0;i<list.length;i++){if(v<=list[i].max)return list[i]}
  return list[list.length-1];
}
function scoringGuideMarkup(type,value){
  var guide=scoringGuide(type,value);
  var band=Number(value)<=4?'low':Number(value)<=8?'standard':'high';
  return '<div class="score-guide" id="'+type+'Guide" data-type="'+type+'" data-band="'+band+'" aria-live="polite"><strong id="'+type+'GuideTitle">Mức '+value+' · '+guide.title+'</strong><span id="'+type+'GuideText">'+guide.text+'</span></div>';
}
function updateScoringGuide(type,value){
  var guide=scoringGuide(type,value);
  var guideEl=$(type+'Guide');
  $(type+'Value').textContent=value;
  $(type+'GuideTitle').textContent='Mức '+value+' · '+guide.title;
  $(type+'GuideText').textContent=guide.text;
  guideEl.dataset.band=Number(value)<=4?'low':Number(value)<=8?'standard':'high';
}

function bindReviewActions(log){
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
  $('requestRevision').addEventListener('click',function(){applyReview(log,'revision')});
}

async function applyReview(log,status){
  if(!requireActive())return;
  var complexity=Number($('complexityRange').value);
  var quality=Number($('qualityRange').value);
  var comment=$('reviewComment').value.trim();
  if((quality<5||quality>=9||status==='revision')&&!comment){
    showToast('Vui lòng nhập nhận xét cho mức điểm hoặc quyết định này.');
    $('reviewComment').focus();
    return;
  }
  var fn=status==='approved'?'approve_work_log':'reject_work_log';
  var body=status==='approved'
    ?{p_log_id:log.id,p_complexity_score:complexity,p_quality_score:quality,p_comment:comment||null}
    :{p_log_id:log.id,p_comment:comment};
  var btn=$(status==='approved'?'approveLog':'requestRevision');btn.disabled=true;
  try{
    var r=await fetch(API+'rpc/'+fn,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body)});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    SELECTED_REVIEW_ID=null;
    showToast(status==='approved'?'Đã xác nhận và chấm điểm nhật ký.':'Đã gửi yêu cầu bổ sung.');
    rr();
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
  if(!comment){showToast('Vui lòng nhập nhận xét khi điều chỉnh điểm.');return}
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
// NHAT KY CONG TAC CUA DON VI - tra cuu lich su day du (khong chi pending)
// cho lanh dao, theo don vi/pham vi da co san. RLS work_logs (unit/province/
// assigned) da cho phep xem toan bo trang thai, chi can mo rong truy van.
// ============================================
var UJ_MODE='person',UJ_UNIT_FILTER='all',UJ_SEARCH='',UJ_SELECTED_PERSON_ID=null;
var UJ_PERIOD=ymStr(new Date().getFullYear(),new Date().getMonth());
var UJ_PEOPLE=[],UJ_LOGS=[];

async function fetchUnitJournalLogs(period){
  var unitIds=dashboardAvailableUnits().map(function(u){return u.id});
  if(!unitIds.length)return [];
  var parts=period.split('-');
  var start=period+'-01';
  var end=ymdStr(Number(parts[0]),Number(parts[1]),1);
  var sel='id,author_id,unit_id,title,result,work_role,duration,evidence,category_id,created_at,updated_at,log_date,status,complexity_score,quality_score,revision_count,review_comment,reviewer_id';
  var r=await fetch(API+'work_logs?unit_id=in.('+unitIds.join(',')+')&log_date=gte.'+start+'&log_date=lt.'+end+'&select='+sel+'&order=log_date.desc,created_at.desc',{headers:authHeaders()});
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
    UJ_LOGS=await fetchUnitJournalLogs(UJ_PERIOD);
  }catch(e){
    $('appView').innerHTML='<div class="empty-state"><strong>Không tải được dữ liệu</strong><span>'+esc(e.message)+'</span></div>';
    return;
  }
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
  return p?p.full_name:'Không xác định';
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
  var h='<div class="toolbar uj-toolbar">'
    +'<div class="uj-mode-toggle">'
    +'<button type="button" class="uj-mode-btn '+(UJ_MODE==='person'?'is-active':'')+'" data-uj-mode="person">Theo người</button>'
    +'<button type="button" class="uj-mode-btn '+(UJ_MODE==='timeline'?'is-active':'')+'" data-uj-mode="timeline">Theo thời gian</button>'
    +'</div>'+unitFilterHtml+periodFilterHtml+searchHtml+'</div>';
  h+='<div id="ujContent"></div>';
  $('appView').innerHTML=h;
  renderUnitJournalContent();
  document.querySelectorAll('[data-uj-mode]').forEach(function(b){b.addEventListener('click',function(){UJ_MODE=b.dataset.ujMode;renderUnitJournalShell()})});
  var unitSel=$('ujUnitFilter');if(unitSel)unitSel.addEventListener('change',function(e){UJ_UNIT_FILTER=e.target.value;UJ_SELECTED_PERSON_ID=null;renderUnitJournalShell()});
  $('ujPeriodFilter').addEventListener('change',function(e){UJ_PERIOD=e.target.value;ruj()});
  var searchInput=$('ujSearchInput');
  if(searchInput)searchInput.addEventListener('input',function(e){
    UJ_SEARCH=e.target.value;
    var caret=searchInput.selectionStart;
    renderUnitJournalContent();
    var ni=$('ujSearchInput');if(ni){ni.focus();ni.setSelectionRange(caret,caret)}
  });
}

function renderUnitJournalContent(){
  var html;
  if(UJ_MODE==='timeline')html=renderUjTimelineHtml();
  else if(UJ_SELECTED_PERSON_ID)html=renderUjPersonDetailHtml(UJ_SELECTED_PERSON_ID);
  else html=renderUjPersonListHtml();
  $('ujContent').innerHTML=html;
  document.querySelectorAll('[data-uj-person]').forEach(function(b){b.addEventListener('click',function(){UJ_SELECTED_PERSON_ID=b.dataset.ujPerson;renderUnitJournalContent()})});
  var back=$('ujBackToList');if(back)back.addEventListener('click',function(){UJ_SELECTED_PERSON_ID=null;renderUnitJournalContent()});
  document.querySelectorAll('[data-uj-jump-person]').forEach(function(b){b.addEventListener('click',function(){UJ_MODE='person';UJ_SELECTED_PERSON_ID=b.dataset.ujJumpPerson;renderUnitJournalShell()})});
  document.querySelectorAll('[data-override-score]').forEach(function(b){b.addEventListener('click',function(){openOverrideModal(b.dataset.overrideScore)})});
}

function renderUjPersonListHtml(){
  var people=ujFilteredPeople();
  if(!people.length)return '<div class="empty-state"><strong>Không có ai trong phạm vi này</strong></div>';
  var counts=ujCountsByAuthor(ujFilteredLogs());
  return '<div class="uj-person-list">'+people.map(function(p){
    var c=counts[p.id]||{count:0,last:null};
    return '<button type="button" class="uj-person-card" data-uj-person="'+p.id+'">'
      +'<div class="uj-person-info"><strong>'+esc(p.full_name)+'</strong><span>'+esc(p.title||'')+' · '+esc(unitShort(p.unit_id))+'</span></div>'
      +'<div class="uj-person-stats"><span class="score-pill '+(c.count?'score-mid':'')+'">'+c.count+' nhật ký</span><span class="uj-last-date">'+(c.last?('Gần nhất: '+fullDate(c.last)):'Chưa nộp trong kỳ')+'</span></div>'
      +'</button>';
  }).join('')+'</div>';
}

function renderUjPersonDetailHtml(personId){
  var person=UJ_PEOPLE.find(function(p){return p.id===personId});
  var personLogs=UJ_LOGS.filter(function(l){return l.author_id===personId});
  var groups=groupLogsByDate(personLogs);
  var h='<div class="uj-back"><button type="button" class="button button-secondary button-small" id="ujBackToList">← Quay lại danh sách</button></div>';
  h+='<div class="panel-header"><div><h2>'+esc(person?person.full_name:'Không xác định')+'</h2><p>'+esc(person?person.title||'':'')+' · '+esc(person?unitShort(person.unit_id):'')+'</p></div></div>';
  h+=groups.length?groups.map(function(g){return ujDateGroupHtml(g)}).join(''):'<div class="empty-state"><strong>Không có nhật ký trong kỳ này</strong></div>';
  return h;
}

function renderUjTimelineHtml(){
  var groups=groupLogsByDate(ujFilteredLogs());
  if(!groups.length)return '<div class="empty-state"><strong>Không có nhật ký trong kỳ này</strong></div>';
  return groups.map(function(g){return ujDateGroupHtml(g,true)}).join('');
}

function ujDateGroupHtml(g,showAuthor){
  var items=g.items.map(function(l,idx){
    var opts={readOnly:true};
    if(showAuthor){opts.authorName=ujAuthorName(l.author_id);opts.authorId=l.author_id}
    if(l.status==='approved'&&l.reviewer_id&&l.reviewer_id!==U.id){
      var prevReviewer=UJ_PEOPLE.find(function(p){return p.id===l.reviewer_id});
      if(prevReviewer)opts.canOverride=canReviewLog({author_id:l.reviewer_id},prevReviewer);
    }
    return '<div class="uj-numbered-item"><span class="queue-index">'+(idx+1)+'</span>'+journalCardHtml(l,opts)+'</div>';
  }).join('');
  return '<div class="uj-date-group"><div class="uj-date-group-header"><strong>'+esc(fullDate(g.date)||'Không xác định ngày')+'</strong><span>'+g.items.length+' việc</span></div><div class="uj-date-items">'+items+'</div></div>';
}

// ============================================
// DANH GIA THANG - thang diem 0-100 kem xep loai A/B/C theo quy dinh nganh
// ============================================
var CURRENT_PERIOD=ymStr(new Date().getFullYear(),new Date().getMonth());
var MONTHLY_ROWS=[],SELECTED_MONTHLY_ID=null,MONTHLY_UNIT_FILTER='all';

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
  if(U.rl==='unit_deputy'&&U.delegated)return person.unit_id===U.uid&&(person.role==='staff'||person.role==='support_staff');
  return false;
}

async function fetchMonthlyScopeProfiles(){
  var sel='id,full_name,title,professional_title,role,unit_id,initials';
  if(U.rl==='staff'||U.rl==='support_staff'){
    return [{id:U.id,full_name:U.n,title:U.tl,professional_title:'',role:U.rl,unit_id:U.uid,initials:U.in}];
  }
  if(U.rl==='unit_head'||U.rl==='unit_deputy'){
    var r=await fetch(API+'profiles?unit_id=eq.'+U.uid+'&role=neq.administrator&select='+sel,{headers:authHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return await r.json();
  }
  if(U.rl==='province_deputy'){
    var ids=(U.assignedUnits||[]);
    if(!ids.length)return [];
    var r2=await fetch(API+'profiles?unit_id=in.('+ids.join(',')+')&role=eq.unit_head&select='+sel,{headers:authHeaders()});
    if(!r2.ok)throw new Error('HTTP '+r2.status);
    return await r2.json();
  }
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
    var r=await fetch(API+'work_logs?author_id=eq.'+userId+'&log_date=gte.'+start+'&log_date=lt.'+end+'&select=status,complexity_score,quality_score',{headers:authHeaders()});
    items=r.ok?await r.json():[];
  }catch(e){}
  var approved=items.filter(function(l){return l.status==='approved'});
  var reviewed=items.filter(function(l){return l.status==='approved'||l.status==='revision'});
  var totalComplexity=approved.reduce(function(s,l){return s+(l.complexity_score||0)},0);
  var weightedQuality=totalComplexity?approved.reduce(function(s,l){return s+(l.complexity_score||0)*(l.quality_score||0)},0)/totalComplexity:0;
  return {
    total:items.length,
    approved:approved.length,
    complexity:totalComplexity,
    quality:weightedQuality,
    reviewRate:items.length?reviewed.length/items.length*100:0
  };
}

async function rm(){
  $('pageEyebrow').textContent='ĐÁNH GIÁ THÁNG';$('pageTitle').textContent='Chấm điểm và xếp loại tháng';
  if(U.rl==='administrator'){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var people;
  try{people=await fetchMonthlyScopeProfiles()}catch(e){$('appView').innerHTML='<div class="empty-state"><strong>Lỗi tải danh sách</strong><span>'+esc(e.message)+'</span></div>';return}
  if(MONTHLY_UNIT_FILTER!=='all')people=people.filter(function(p){return p.unit_id===MONTHLY_UNIT_FILTER});

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

  var isProvinceScope=(U.rl==='province_head'||U.rl==='administrator');
  var unitFilterHtml='';
  if(isProvinceScope){
    unitFilterHtml='<label class="filter-field"><span>Đơn vị</span><select id="monthlyUnitFilter"><option value="all">Tất cả đơn vị</option>'
      +UNITS.filter(function(u){return u.type!=='province'}).map(function(u){return '<option value="'+u.id+'" '+(MONTHLY_UNIT_FILTER===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')
      +'</select></label>';
  }

  if(!SELECTED_MONTHLY_ID||!rows.some(function(x){return x.person.id===SELECTED_MONTHLY_ID})){SELECTED_MONTHLY_ID=rows[0]?rows[0].person.id:null}
  var selected=rows.find(function(x){return x.person.id===SELECTED_MONTHLY_ID});
  var evidence=selected?await monthlyEvidence(selected.person.id):null;

  var h='<div class="toolbar"><label class="filter-field"><span>Kỳ đánh giá</span><select id="monthlyPeriodSelect">'
    +recentPeriods().map(function(p){return '<option value="'+p+'" '+(p===CURRENT_PERIOD?'selected':'')+'>'+esc(periodLabel(p))+'</option>'}).join('')
    +'</select></label>'+unitFilterHtml+'<div class="spacer"></div><button class="button button-secondary" id="exportMonthly">Xuất báo cáo tháng</button></div>';
  h+='<div class="metric-grid">'
    +metricCard('Hồ sơ trong phạm vi',rows.length,approved.length+' hồ sơ đã duyệt','')
    +metricCard('Xếp loại A',counts.A,counts.B+' xếp loại B','green')
    +metricCard('Chênh lệch bình quân',avgDelta.toFixed(1),'Điểm tự chấm ↔ điểm chính thức','gold')
    +metricCard('Chờ hoàn thành',rows.length-approved.length,'Tự chấm hoặc chờ duyệt','blue')
    +'</div>';
  h+='<div class="monthly-layout"><section class="panel monthly-table-panel"><div class="panel-header"><div><h2>Danh sách đánh giá tháng</h2><p>'+esc(periodLabel(CURRENT_PERIOD))+'</p></div></div>'+monthlyTableHtml(rows)+'</section>';
  h+='<section class="panel monthly-detail">'+(selected?monthlyDetailHtml(selected,evidence):'<div class="empty-state"><strong>Không có hồ sơ</strong><span>Chưa có dữ liệu phù hợp với phạm vi này.</span></div>')+'</section></div>';
  $('appView').innerHTML=h;

  document.querySelectorAll('[data-monthly-user]').forEach(function(b){b.addEventListener('click',function(){SELECTED_MONTHLY_ID=b.dataset.monthlyUser;rm()})});
  var filterEl=$('monthlyUnitFilter');
  if(filterEl)filterEl.addEventListener('change',function(e){MONTHLY_UNIT_FILTER=e.target.value;SELECTED_MONTHLY_ID=null;rm()});
  $('monthlyPeriodSelect').addEventListener('change',function(e){CURRENT_PERIOD=e.target.value;SELECTED_MONTHLY_ID=null;rm()});
  $('exportMonthly').addEventListener('click',openExportModal);
  if(selected){
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
  }
}

function monthlyTableHtml(rows){
  if(!rows.length)return '<div class="empty-state"><strong>Không có dữ liệu</strong><span>Hãy chọn phạm vi khác.</span></div>';
  return '<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Chức vụ, chức danh</th><th>Đơn vị</th><th class="numeric">Tự chấm</th><th class="numeric">Chính thức</th><th class="numeric">Xếp loại</th><th></th></tr></thead><tbody>'
    +rows.map(function(x){
      var p=x.person,rv=x.review;
      return '<tr class="'+(p.id===SELECTED_MONTHLY_ID?'is-selected-row':'')+'"><td><div class="person-cell"><span class="mini-avatar">'+esc(p.initials||'')+'</span><div><strong>'+esc(p.full_name)+'</strong><span>'+esc(p.professional_title||'')+'</span></div></div></td><td>'+esc(p.title||'')+'</td><td>'+esc(unitShort(p.unit_id))+'</td><td class="numeric">'+(rv&&rv.self_score!=null?rv.self_score:'—')+'</td><td class="numeric"><strong>'+(rv&&rv.official_score!=null?rv.official_score:'—')+'</strong></td><td class="numeric"><span class="grade-badge grade-'+((rv&&rv.classification)||'pending').toLowerCase()+'">'+((rv&&rv.classification)||'Chờ')+'</span></td><td class="numeric"><button class="button button-secondary button-small" data-monthly-user="'+p.id+'">Xem căn cứ</button></td></tr>';
    }).join('')
    +'</tbody></table></div>';
}

function monthlyDetailHtml(x,evidence){
  var person=x.person,row=x.review||{};
  var mayApprove=canApproveMonthly(person);
  var isSelf=person.id===U.id;
  var cls=(row.classification||'pending').toLowerCase();
  return '<div class="panel-header"><div><span class="eyebrow">HỒ SƠ ĐÁNH GIÁ THÁNG</span><h2>'+esc(person.full_name)+'</h2><p>'+esc(person.title||'')+' · '+esc(person.professional_title||'')+' · '+esc(unitShort(person.unit_id))+'</p></div><span class="grade-seal grade-'+cls+'">'+(row.classification||'…')+'</span></div>'
    +'<div class="evidence-grid"><div><span>Nhật ký</span><strong>'+evidence.total+'</strong></div><div><span>Được công nhận</span><strong>'+evidence.approved+'</strong></div><div><span>Tổng phức tạp</span><strong>'+evidence.complexity+'</strong></div><div><span>Chất lượng trọng số</span><strong>'+(evidence.quality?evidence.quality.toFixed(1):'—')+'</strong></div></div>'
    +'<div class="detail-section"><h3>Căn cứ hỗ trợ quyết định</h3><p class="metric-context">Dữ liệu nhật ký chỉ là căn cứ tham khảo; người có thẩm quyền vẫn quyết định điểm chính thức và xếp loại theo quy định.</p><div class="progress-line"><span>Tỷ lệ nhật ký đã xử lý</span><strong>'+evidence.reviewRate.toFixed(0)+'%</strong><div class="bar-track"><div class="bar-fill green" style="width:'+evidence.reviewRate+'%"></div></div></div></div>'
    +'<div class="detail-section"><div class="detail-grid"><div class="detail-item"><span>Điểm tự chấm</span><strong>'+(row.self_score!=null?row.self_score:'Chưa có')+'</strong></div><div class="detail-item"><span>Điểm được duyệt</span><strong>'+(row.official_score!=null?row.official_score:'Chưa duyệt')+'</strong></div></div></div>'
    +(mayApprove?('<div class="detail-section"><div class="form-grid compact-form"><label class="field"><span>Điểm chính thức</span><input id="officialScore" type="number" min="0" max="100" step="0.25" value="'+(row.official_score!=null?row.official_score:(row.self_score!=null?row.self_score:0))+'"></label><label class="field"><span>Xếp loại</span><select id="classification"><option '+(row.classification==='A'?'selected':'')+'>A</option><option '+(row.classification==='B'?'selected':'')+'>B</option><option '+(row.classification==='C'?'selected':'')+'>C</option><option '+(row.classification==='D'?'selected':'')+'>D</option></select></label><label class="field field-wide"><span>Nhận xét/giải trình điều chỉnh</span><textarea id="monthlyNote" rows="2">'+esc(row.note||'')+'</textarea></label></div><div class="review-actions"><button class="button button-primary" id="saveMonthlyReview">Duyệt và lưu</button></div></div>'):'')
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

async function openExportModal(){
  var select=$('exportPeriodSelect');
  select.innerHTML=recentPeriods().map(function(p){return '<option value="'+p+'" '+(p===CURRENT_PERIOD?'selected':'')+'>'+esc(periodLabel(p))+'</option>'}).join('');
  $('exportModal').hidden=false;
  await renderExportSummary(select.value);
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
  sheet.getCell('A'+r).font={bold:true,underline:true,name:'Times New Roman',size:12};
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value='CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  sheet.getCell('E'+r).font={bold:true,name:'Times New Roman',size:12};
  sheet.getCell('E'+r).alignment={horizontal:'center'};
  r++;
  sheet.mergeCells('A'+r+':D'+r);
  sheet.getCell('A'+r).value='VIỆN KIỂM SÁT NHÂN DÂN TỈNH BẮC NINH';
  sheet.getCell('A'+r).font={bold:true,underline:true,name:'Times New Roman',size:12};
  sheet.mergeCells('E'+r+':H'+r);
  sheet.getCell('E'+r).value='Độc lập - Tự do - Hạnh phúc';
  sheet.getCell('E'+r).font={bold:true,underline:true,name:'Times New Roman',size:12};
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
  +'.pdf-export-root .letterhead strong { display: block; text-decoration: underline; }'
  +'.pdf-export-root h1 { text-align: center; font-size: 15pt; margin: 4px 0; }'
  +'.pdf-export-root .subtitle { text-align: center; font-weight: bold; margin: 2px 0; }'
  +'.pdf-export-root .period { text-align: center; font-style: italic; margin: 2px 0 16px; }'
  +'.pdf-export-root table { width: 100%; border-collapse: collapse; }'
  +'.pdf-export-root th, .pdf-export-root td { border: 1px solid #333; padding: 4px 6px; font-size: 10.5pt; }'
  +'.pdf-export-root th { text-align: center; font-weight: bold; }'
  +'.pdf-export-root td.c { text-align: center; }'
  +'.pdf-export-root tr { break-inside: avoid; page-break-inside: avoid; }'
  +'.pdf-export-root .section-row td { font-weight: bold; text-align: left; background: #f3f3f3; }'
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
    +'<div><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><span style="text-decoration:underline">Độc lập - Tự do - Hạnh phúc</span></div>'
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
    showToast('Lỗi khi xuất PDF: '+e.message);
  }finally{
    container.remove();
  }
}

// ============================================
// TRUNG TAM THONG BAO
// ============================================
function notifStorageKey(){return 'qlcv-notif-read-'+U.id}
function readNotificationIds(){try{return JSON.parse(localStorage.getItem(notifStorageKey())||'[]')}catch(e){return []}}
function saveNotificationReadIds(ids){localStorage.setItem(notifStorageKey(),JSON.stringify(ids.slice(-100)))}
function markNotificationRead(id){var ids=readNotificationIds();if(ids.indexOf(id)<0){ids.push(id);saveNotificationReadIds(ids)}}

async function fetchNotifications(){
  var list=[];
  try{
    var r=await fetch(API+'work_logs?author_id=eq.'+U.id+'&status=eq.revision&select=id,title,log_date,review_comment,reviewer_id,reviewed_at',{headers:authHeaders()});
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
        list.push({id:'revision-'+l.id+'-'+(l.reviewed_at||'pending'),tone:'revision',title:'Nhật ký cần bổ sung',message:reviewerName+': '+(l.review_comment||'Yêu cầu chỉnh sửa, làm rõ kết quả.'),time:shortDate(l.log_date),view:'journal',logId:l.id});
      });
    }
  }catch(e){}
  // Thong bao "su kien" thuc su (bang notifications, dung that lan dau -
  // truoc day chi suy ra ad-hoc). Dat TRUOC hang cho duyet (co the rat dai)
  // de khong bi ".slice(0, 20)" ben duoi cat mat.
  try{
    var nr=await fetch(API+'notifications?user_id=eq.'+U.id+'&order=created_at.desc&limit=20',{headers:authHeaders()});
    (nr.ok?await nr.json():[]).forEach(function(n){
      var tone=n.type==='score_override_escalation'?'escalation':n.type==='score_overridden_by_senior'?'revision':'account';
      list.push({id:'db-'+n.id,tone:tone,title:n.title,message:n.body||'',time:shortDate((n.created_at||'').slice(0,10)),view:'unitJournal'});
    });
  }catch(e){}
  if(isLeader()){
    try{
      var queue=await fetchReviewQueue();
      queue.forEach(function(l){
        list.push({id:'review-'+l.id+'-'+(l.created_at||l.log_date),tone:l.revision_count?'resubmitted':'pending',title:l.revision_count?('Nhật ký trình lại lần '+l.revision_count):'Nhật ký chờ chấm điểm',message:((l._author&&l._author.full_name)||'Cán bộ')+': '+l.title,time:shortDate(l.log_date),view:'reviews',logId:l.id});
      });
    }catch(e){}
  }
  if(U.rl==='administrator'){
    try{
      var pa=await fetch(API+'profiles?is_active=eq.false&select=id,full_name,unit_id,created_at',{headers:authHeaders()});
      (pa.ok?await pa.json():[]).forEach(function(a){
        list.push({id:'account-'+a.id+'-'+a.created_at,tone:'account',title:'Tài khoản chờ xác nhận',message:(a.full_name||'')+' · '+unitShort(a.unit_id),time:'Mới đăng ký',view:'administration'});
      });
    }catch(e){}
  }
  return list.slice(0,20);
}

async function renderNotificationsUI(){
  var notifications;
  try{notifications=await fetchNotifications()}catch(e){notifications=[]}
  var readIds=readNotificationIds();
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
    saveNotificationReadIds(list.map(function(n){return n.id}));
    renderNotificationsUI();
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
// QUAN TRI - ma dang ky don vi + duyet tai khoan cho xac nhan
// (chua bao gom dieu chuyen nhan su/uy quyen - de sau theo yeu cau)
// ============================================
var ADMIN_CODES=[],ADMIN_PENDING=[];

async function ra(){
  $('pageEyebrow').textContent='QUẢN TRỊ';$('pageTitle').textContent='Quản trị tài khoản và mã đăng ký';
  if(!isAdminOrProvinceHead()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var codes=[],pendingProfiles=[],auditLogs=[];
  try{
    var cr=await fetch(API+'registration_codes?select=*&order=created_at.desc',{headers:authHeaders()});
    codes=cr.ok?await cr.json():[];
    var pr=await fetch(API+'profiles?is_active=eq.false&select=id,full_name,role,unit_id,created_at&order=created_at.desc',{headers:authHeaders()});
    pendingProfiles=pr.ok?await pr.json():[];
    if(U.rl==='administrator'){
      var alr=await fetch(API+'audit_logs?select=id,action,entity_type,entity_id,created_at,actor:actor_id(full_name)&order=created_at.desc&limit=50',{headers:authHeaders()});
      auditLogs=alr.ok?await alr.json():[];
    }
  }catch(e){}
  ADMIN_CODES=codes;ADMIN_PENDING=pendingProfiles;

  var unitOptions=UNITS.filter(function(u){return u.type!=='province'}).map(function(u){return '<option value="'+u.id+'">'+esc(u.short_name||u.code)+'</option>'}).join('');

  var h='<div class="metric-grid">'
    +metricCard('Mã đang cấp',codes.filter(function(c){return c.is_active}).length,codes.length+' mã đã tạo','')
    +metricCard('Tài khoản chờ xác nhận',pendingProfiles.length,'Cần đối chiếu trước khi kích hoạt','gold')
    +'</div>';
  h+='<div class="admin-grid">';
  h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Mã đăng ký theo đơn vị</h2><p>Mã chỉ xác định đơn vị; người đăng ký luôn nhận quyền cán bộ mặc định, không tự chọn quyền lãnh đạo</p></div></div>'
    +'<div class="code-generator"><label class="filter-field"><span>Đơn vị cấp mã</span><select id="codeUnit">'+unitOptions+'</select></label><button class="button button-primary" id="generateCode">Tạo mã đơn vị</button></div>'
    +registrationCodeTableHtml(codes)+'</section>';
  h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Tài khoản chờ xác nhận</h2><p>Đối chiếu đúng người, đúng đơn vị trước khi kích hoạt</p></div></div>'+pendingAccountTableHtml(pendingProfiles)+'</section>';
  if(U.rl==='administrator'){
    h+='<section class="panel panel-wide"><div class="panel-header"><div><h2>Nhật ký kiểm toán</h2><p>50 thay đổi gần nhất đối với điểm số, trạng thái, quyền hạn và nhân sự</p></div></div>'+auditLogTableHtml(auditLogs)+'</section>';
  }
  h+='</div>';
  $('appView').innerHTML=h;

  $('generateCode').addEventListener('click',generateRegistrationCode);
  document.querySelectorAll('[data-toggle-code]').forEach(function(b){b.addEventListener('click',function(){toggleRegistrationCode(b.dataset.toggleCode)})});
  document.querySelectorAll('[data-approve-account]').forEach(function(b){b.addEventListener('click',function(){approvePendingAccount(b.dataset.approveAccount)})});
}

function registrationCodeTableHtml(codes){
  if(!codes.length)return '<div class="empty-state compact-empty"><strong>Chưa có mã nào</strong><span>Tạo mã đầu tiên cho một đơn vị.</span></div>';
  return '<div class="table-wrap code-table"><table><thead><tr><th>Đơn vị</th><th>Mã đăng ký</th><th class="numeric">Đã dùng</th><th>Hết hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+codes.map(function(item){
    return '<tr><td><strong>'+esc(unitShort(item.unit_id))+'</strong></td><td><code>'+esc(item.code)+'</code></td><td class="numeric">'+item.use_count+'</td><td>'+(item.expires_at?new Date(item.expires_at).toLocaleDateString('vi-VN'):'Không giới hạn')+'</td><td><span class="status-pill '+(item.is_active?'status-approved':'status-revision')+'">'+(item.is_active?'Đang cấp':'Đã khóa')+'</span></td><td class="numeric"><button class="button button-secondary button-small" data-toggle-code="'+item.id+'">'+(item.is_active?'Khóa mã':'Mở lại')+'</button></td></tr>';
  }).join('')+'</tbody></table></div>';
}

function pendingAccountTableHtml(accounts){
  if(!accounts.length)return '<div class="empty-state compact-empty"><strong>Không có tài khoản chờ xử lý</strong><span>Tài khoản đăng ký hợp lệ sẽ xuất hiện tại đây.</span></div>';
  return '<div class="table-wrap"><table><thead><tr><th>Người đăng ký</th><th>Đơn vị</th><th>Ngày đăng ký</th><th></th></tr></thead><tbody>'+accounts.map(function(a){
    return '<tr><td><strong>'+esc(a.full_name)+'</strong></td><td>'+esc(unitShort(a.unit_id))+'</td><td>'+new Date(a.created_at).toLocaleDateString('vi-VN')+'</td><td class="numeric"><button class="button button-primary button-small" data-approve-account="'+a.id+'">Xác nhận tài khoản</button></td></tr>';
  }).join('')+'</tbody></table></div>';
}

var AUDIT_ACTION_LABELS={INSERT:'Tạo mới',UPDATE:'Cập nhật',DELETE:'Xoá'};
var AUDIT_ENTITY_LABELS={work_logs:'Nhật ký công việc',profiles:'Hồ sơ tài khoản',delegations:'Ủy quyền',monthly_reviews:'Đánh giá tháng'};

function auditLogTableHtml(logs){
  if(!logs.length)return '<div class="empty-state compact-empty"><strong>Chưa có thay đổi nào được ghi nhận</strong></div>';
  return '<div class="table-wrap"><table><thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th></tr></thead><tbody>'+logs.map(function(l){
    var actor=(l.actor&&l.actor.full_name)?l.actor.full_name:'Hệ thống';
    return '<tr><td>'+new Date(l.created_at).toLocaleString('vi-VN')+'</td><td><strong>'+esc(actor)+'</strong></td><td>'+(AUDIT_ACTION_LABELS[l.action]||esc(l.action))+'</td><td>'+(AUDIT_ENTITY_LABELS[l.entity_type]||esc(l.entity_type))+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

async function generateRegistrationCode(){
  if(!requireActive())return;
  var unitId=$('codeUnit').value;
  if(!unitId){showToast('Vui lòng chọn đơn vị.');return}
  var unit=unitShort(unitId);
  var prefix=unit.replace(/\s+/g,'').toUpperCase().slice(0,8);
  var year=new Date().getFullYear();
  var suffix=Math.random().toString(36).slice(2,6).toUpperCase();
  var code=prefix+'-'+year+'-'+suffix;
  var btn=$('generateCode');btn.disabled=true;
  try{
    var r=await fetch(API+'registration_codes',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({code:code,unit_id:unitId,is_active:true,created_by:U.id})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    showToast('Đã tạo mã '+code+'.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message);btn.disabled=false}
}

async function toggleRegistrationCode(id){
  if(!requireActive())return;
  var item=ADMIN_CODES.find(function(c){return c.id===id});
  if(!item)return;
  try{
    var r=await fetch(API+'registration_codes?id=eq.'+id,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({is_active:!item.is_active})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    showToast(item.is_active?'Đã khóa mã đăng ký.':'Đã mở lại mã đăng ký.');
    ra();
  }catch(e){showToast('Lỗi: '+e.message)}
}

async function approvePendingAccount(id){
  if(!requireActive())return;
  try{
    var r=await fetch(API+'rpc/approve_pending_account',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:id})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    showToast('Đã xác nhận tài khoản.');
    ra();
    refreshPendingBadge();
  }catch(e){showToast('Lỗi: '+e.message)}
}

// ============================================
// DANG KY TAI KHOAN BANG MA DON VI
// ============================================
async function checkRegCode(code){
  try{
    var r=await fetch(API+'rpc/check_registration_code',{method:'POST',headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify({p_code:code})});
    return await r.json();
  }catch(e){return {valid:false}}
}

function openRegisterModal(){
  var form=$('registerForm');form.reset();
  var hint=$('registerCodeHint');if(hint){hint.textContent='';hint.style.color=''}
  $('registerModal').hidden=false;
  form.elements.fullName.focus();
}
function closeRegisterModal(){$('registerModal').hidden=true}

async function submitRegistration(e){
  e.preventDefault();
  var f=new FormData($('registerForm'));
  var fullName=(f.get('fullName')||'').trim();
  var email=(f.get('email')||'').trim().toLowerCase();
  var code=(f.get('registrationCode')||'').trim().toUpperCase();
  var password=f.get('password')||'';
  var confirmPassword=f.get('confirmPassword')||'';
  if(!fullName||!email){showToast('Vui lòng nhập đủ họ tên và email.');return}
  if(password!==confirmPassword){showToast('Mật khẩu nhập lại chưa khớp.');return}
  if(password.length<8){showToast('Mật khẩu cần tối thiểu 8 ký tự.');return}
  var btn=$('registerForm').querySelector('button[type=submit]');btn.disabled=true;
  try{
    var check=await checkRegCode(code);
    if(!check.valid){showToast('Mã đăng ký không hợp lệ hoặc đã hết hạn.');btn.disabled=false;return}
    var r=await fetch(AUTH+'signup',{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:password,data:{full_name:fullName,registration_code:code}})});
    var d=await r.json();
    if(!r.ok)throw new Error(d.error_description||d.msg||d.error||'Đăng ký thất bại');
    closeRegisterModal();
    if(d.access_token){
      saveSession(d.access_token,d.refresh_token,d.expires_in);
      await initU(d.access_token,d.user.id,d.user.email);
    }else{
      showToast('Đăng ký thành công. Vui lòng xác nhận email rồi đăng nhập lại.');
    }
  }catch(err){showToast('Lỗi: '+err.message)}
  btn.disabled=false;
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
    +'<label class="field"><span>Mật khẩu mới</span><input name="newPassword" type="password" minlength="8" required autocomplete="new-password"></label>'
    +'<label class="field"><span>Nhập lại mật khẩu mới</span><input name="confirmNewPassword" type="password" minlength="8" required autocomplete="new-password"></label>'
    +'<div class="form-actions field-wide"><button type="submit" class="button button-primary">Đổi mật khẩu</button></div>'
    +'</form></div>';
  h+='<div class="panel" style="padding:18px;max-width:520px">'
    +'<div class="form-actions field-wide"><button type="button" class="button button-danger" id="accountLogout">Đăng xuất</button></div>'
    +'</div>';
  $('appView').innerHTML=h;
  $('accountNameForm').addEventListener('submit',submitAccountName);
  $('accountPasswordForm').addEventListener('submit',submitAccountPassword);
  $('accountLogout').onclick=x;
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
function x(){closeNotificationPanel();cj();localStorage.removeItem('st');U=null;$('appShell').hidden=true;$('loginScreen').hidden=false;document.body.classList.add('login-active')}

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
  $('journalForm').elements.workDate.addEventListener('change',checkJournalDateWarning);
  $('toggleCopyJournal').addEventListener('click',function(){
    var panel=$('copyJournalPanel');
    panel.hidden=!panel.hidden;
    if(!panel.hidden)$('copyJournalSearch').focus();
  });
  $('copyJournalSearch').addEventListener('input',function(e){renderCopyJournalList(e.target.value)});
  document.querySelectorAll('[data-close-export]').forEach(function(b){b.addEventListener('click',closeExportModal)});
  $('exportModal').addEventListener('click',function(e){if(e.target.id==='exportModal')closeExportModal()});
  $('exportPeriodSelect').addEventListener('change',function(e){renderExportSummary(e.target.value)});
  $('exportExcelButton').addEventListener('click',function(){exportMonthlyExcel($('exportPeriodSelect').value)});
  $('exportPdfButton').addEventListener('click',function(){exportMonthlyPdf($('exportPeriodSelect').value)});
  document.querySelectorAll('[data-close-note]').forEach(function(b){b.addEventListener('click',closeNoteModal)});
  $('noteModal').addEventListener('click',function(e){if(e.target.id==='noteModal')closeNoteModal()});
  $('noteForm').addEventListener('submit',submitNote);
  document.querySelectorAll('[data-close-override]').forEach(function(b){b.addEventListener('click',closeOverrideModal)});
  $('overrideScoreModal').addEventListener('click',function(e){if(e.target.id==='overrideScoreModal')closeOverrideModal()});
  $('overrideScoreForm').addEventListener('submit',submitOverrideScore);
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
  $('openRegister') && ($('openRegister').onclick=openRegisterModal);
  document.querySelectorAll('[data-close-register]').forEach(function(b){b.addEventListener('click',closeRegisterModal)});
  $('registerModal') && $('registerModal').addEventListener('click',function(e){if(e.target.id==='registerModal')closeRegisterModal()});
  $('registerForm') && $('registerForm').addEventListener('submit',submitRegistration);
  $('registrationCodeInput') && $('registrationCodeInput').addEventListener('blur',async function(){
    var hint=$('registerCodeHint');if(!hint)return;
    var code=this.value.trim().toUpperCase();
    if(!code){hint.textContent='';return}
    var check=await checkRegCode(code);
    if(check.valid){hint.textContent='Đơn vị: '+check.unit_name;hint.style.color='#1f7a55'}
    else{hint.textContent='Mã không hợp lệ hoặc đã hết hạn';hint.style.color='#b3261e'}
  });

  // Khoi phuc phien dang nhap neu con hieu luc (khong bat nguoi dung dang nhap lai khi tai trang)
  (async function(){
    var st=localStorage.getItem('st');if(!st)return;
    try{
      var sj2=JSON.parse(st);
      if(sj2.e<Date.now()){
        var refreshed=await refreshSession();
        if(!refreshed){localStorage.removeItem('st');return}
        sj2=JSON.parse(localStorage.getItem('st'));
      }
      var r=await fetch(URL+'/auth/v1/user',{headers:{'apikey':KEY,'Authorization':'Bearer '+sj2.t}});
      var d=await r.json();
      if(d&&d.id)initU(sj2.t,d.id,d.email);
    }catch(e){}
  })();
});
