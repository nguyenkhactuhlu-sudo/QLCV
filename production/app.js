// QLCV Production - Ket noi Supabase that, khong co du lieu demo
var U=null,V='dashboard',LOGS=[],UNITS=[],CATS=[],EDITING_ID=null,PROVINCE_UNIT_ID=null,REVIEW_QUEUE=[],SELECTED_REVIEW_ID=null;
function $(i){return document.getElementById(i)}
// .sidebar va .nav-item co san "display:flex" trong styles.css, manh hon
// thuoc tinh "hidden" mac dinh cua trinh duyet - phai ep display truc tiep
// thi an/hien moi thuc su co tac dung.
function setVisible(el,visible){if(el)el.style.display=visible?'':'none'}
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
  $('avatarInitials').textContent='?';$('sessionUserName').textContent=U.n;$('sessionUserRole').textContent='Đang chờ xác nhận';
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

  // Dung 1 anh dai dien chung (logo nganh) thay vi chu cai dau - khong xay
  // tinh nang tai anh len rieng cho tung nguoi.
  $('avatarInitials').innerHTML='<img src="../demo/assets/logo-kiem-sat.png" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  $('sessionUserName').textContent=U.n;
  var un='';if(UNITS.length&&U.uid){var uu=UNITS.find(function(x){return x.id===U.uid});if(uu)un=uu.short_name||uu.code;}
  $('sessionUserRole').textContent=(U.tl||'')+' . '+(un||'');
  setVisible(document.querySelector('.review-nav'),isLeader());
  setVisible(document.querySelector('.admin-nav'),isAdminOrProvinceHead());
  // Co cau to chuc chi danh cho Vien truong tinh va quan tri vien.
  setVisible(document.querySelector('.org-nav'),isAdminOrProvinceHead());
  // Quan tri vien khong ghi cong viec, khong can Nhat ky/Cham diem thang.
  var isAdminOnly=(U.rl==='administrator');
  setVisible(document.querySelector('.journal-nav'),!isAdminOnly);
  setVisible(document.querySelector('.monthly-nav'),!isAdminOnly);

  if(!isLeader()&&V==='reviews')V='dashboard';
  if(!isAdminOrProvinceHead()&&V==='administration')V='dashboard';
  if(!isAdminOrProvinceHead()&&V==='organization')V='dashboard';
  if(isAdminOnly&&(V==='journal'||V==='monthly'))V='dashboard';
}

function render(){
  if(U&&U.pending){showPendingScreen();return}
  if(V==='dashboard')rd();
  else if(V==='journal')rj();
  else if(V==='reviews')rr();
  else if(V==='monthly')rm();
  else if(V==='organization')ro();
  else if(V==='administration')ra();
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
  if(U.rl==='staff')scoped=scoped.filter(function(l){return l.author_id===U.id});
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
  var start=new Date(now.getFullYear(),now.getMonth()-5,1).toISOString().slice(0,10);
  var r=await fetch(API+'work_logs?log_date=gte.'+start+'&select=author_id,unit_id,log_date,status,complexity_score,quality_score&order=log_date.desc',{headers:authHeaders()});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return await r.json();
}

async function fetchDashboardScopeProfiles(){
  var sel='id,full_name,title,professional_title,role,unit_id,initials';
  if(U.rl==='staff')return [{id:U.id,full_name:U.n,title:U.tl,professional_title:'',role:U.rl,unit_id:U.uid,initials:U.in}];
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
    periods.push(d.toISOString().slice(0,7));
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
  return '<div class="table-sort-help">Chọn tên cột để sắp xếp · nhấn lần nữa để đổi chiều</div><div class="table-wrap"><table><thead><tr><th>'+(isUnit?'Đơn vị':'Cán bộ')+'</th>'+sortableHeader('Kết quả','count')+sortableHeader('Tổng phức tạp','complexityTotal')+sortableHeader('Phức tạp BQ','complexityAvg')+sortableHeader('Chất lượng','quality')+sortableHeader('Tỷ lệ ≥ 8','highQualityRate')+'</tr></thead><tbody>'+sortedRows.map(function(row){
    var firstCell;
    if(isUnit){firstCell='<strong>'+esc(row.label)+'</strong><br><span class="metric-context">'+row.people+' người</span>'}
    else{var p=personById(row.id);firstCell='<div class="person-cell"><span class="mini-avatar">'+esc(p&&p.initials?p.initials:'')+'</span><div><strong>'+esc(row.label)+'</strong><span>'+esc(row.sublabel)+'</span></div></div>'}
    return '<tr><td>'+firstCell+'</td><td class="numeric">'+row.count+'</td><td class="numeric">'+row.complexityTotal+'</td><td class="numeric">'+row.complexityAvg.toFixed(1)+'</td><td class="numeric"><span class="score-pill '+scoreClassOf(row.quality)+'">'+row.quality.toFixed(1)+'</span></td><td class="numeric">'+(row.highQuality/row.count*100).toFixed(0)+'%</td></tr>';
  }).join('')+'</tbody></table></div>';
}

async function rd(){
  var provinceScope=['province_head','province_deputy','administrator'].indexOf(U.rl)>=0;
  var titleMap={province_head:'Tổng quan toàn tỉnh',province_deputy:'Các đơn vị được phân công',administrator:'Tổng quan hệ thống',staff:'Kết quả công tác của tôi'};
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
    +'<option value="month" '+(DASHBOARD_PERIOD==='month'?'selected':'')+'>'+esc(periodLabel(new Date().toISOString().slice(0,7)))+'</option>'
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
      var q=JOURNAL_SEARCH.toLowerCase();
      var hay=((l.title||'')+' '+(l.result||'')).toLowerCase();
      if(hay.indexOf(q)<0)return false;
    }
    return true;
  });
  var h='<div class="journal-header"><div><h2>'+esc(U.n)+'</h2><p>'+esc(U.tl||'')+'</p></div><button class="button button-primary" id="nj">+ Ghi nhật ký mới</button></div>';
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
  h+='<div class="journal-list">'+(filtered.length?filtered.map(journalCardHtml).join(''):'<div class="empty-state"><strong>Không có nhật ký phù hợp</strong><span>Thử đổi bộ lọc hoặc ghi nhật ký mới.</span></div>')+'</div>';
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

function journalCardHtml(log){
  var canEdit=log.status==='revision';
  var revisionFeedback=log.status==='revision'?'<div class="revision-feedback"><strong>Lãnh đạo yêu cầu bổ sung</strong><span>'+esc(log.review_comment||'Cần chỉnh sửa, làm rõ kết quả công tác.')+'</span></div>':'';
  var resubmission=log.revision_count?'<span class="meta-tag">Đã trình lại '+log.revision_count+' lần</span>':'';
  return '<article class="journal-card '+(log.status==='revision'?'is-revision':'')+'">'
    +'<div class="journal-date"><strong>'+shortDate(log.log_date)+'</strong>'+(log.log_date||'').slice(0,4)+'</div>'
    +'<div class="journal-body"><h3>'+esc(log.title)+'</h3><p>'+esc(log.result)+'</p>'+revisionFeedback
    +'<div class="journal-meta"><span class="meta-tag">'+esc(catName(log.category_id))+'</span><span class="meta-tag">'+esc(WORK_ROLE_LABEL[log.work_role]||log.work_role)+'</span><span class="meta-tag">'+esc(DURATION_LABEL[log.duration]||log.duration)+'</span>'+resubmission+'<span class="status-pill '+(STATUS_CLASS[log.status]||'')+'">'+(STATUS_LABEL[log.status]||log.status)+'</span></div></div>'
    +'<div class="journal-side"><div class="journal-scores"><div class="score-box"><span>Phức tạp</span><strong>'+(log.complexity_score==null?'—':log.complexity_score)+'</strong></div><div class="score-box"><span>Chất lượng</span><strong>'+(log.quality_score==null?'—':log.quality_score)+'</strong></div></div>'
    +(canEdit?'<button type="button" class="button button-primary button-small" data-edit-journal="'+log.id+'">Sửa và trình lại</button>':'')+'</div></article>';
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
  }else{
    form.elements.workDate.valueAsDate=new Date();
  }
  $('journalModal').hidden=false;document.body.style.overflow='hidden';
  (canEdit?form.elements.title:form.elements.category).focus();
}
function cj(){$('journalModal').hidden=true;document.body.style.overflow='';EDITING_ID=null}

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
    evidence:(f.get('evidence')||'').trim()||null
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
// CO CAU TO CHUC - chi xem, khong dong den tai khoan/nhan su that
// ============================================
async function ro(){
  $('pageEyebrow').textContent='MÔ HÌNH TỔ CHỨC';$('pageTitle').textContent='Cơ cấu và phân quyền';
  if(!isAdminOrProvinceHead()){V='dashboard';render();return}
  $('appView').innerHTML='<div class="empty-state"><strong>Đang tải...</strong></div>';
  var people=[];var assignedByUser={};
  try{
    var r=await fetch(API+'profiles?select=id,full_name,role,unit_id',{headers:authHeaders()});
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
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Gán vai trò và đơn vị</h2><p>Chỉ định đúng chức vụ và đơn vị cho từng tài khoản. Tài khoản đang chờ xác nhận sẽ được kích hoạt luôn khi gán. Với vai trò Phó Viện trưởng tỉnh, chọn thêm các đơn vị được phân công phụ trách (giữ Ctrl/Cmd để chọn nhiều đơn vị).</p></div></div>'+assignRoleTableHtml(people,assignedByUser)+'</section>'
    +'<section class="panel panel-wide"><div class="panel-header"><div><h2>Quy tắc người chấm</h2><p>Không cho phép người dùng tự chấm nhật ký của mình</p></div></div><div class="org-role-list">'
    +'<div class="org-role-row"><strong>Cán bộ, công chức</strong><p>Người đứng đầu đơn vị trực tiếp đánh giá; cấp phó chỉ chấm khi có ủy quyền.</p></div>'
    +'<div class="org-role-row"><strong>Phó lãnh đạo đơn vị</strong><p>Viện trưởng khu vực hoặc Trưởng phòng đánh giá.</p></div>'
    +'<div class="org-role-row"><strong>Người đứng đầu đơn vị</strong><p>Lãnh đạo tỉnh được phân công phụ trách đơn vị đánh giá.</p></div>'
    +'<div class="org-role-row"><strong>Phó Viện trưởng tỉnh</strong><p>Viện trưởng tỉnh đánh giá.</p></div>'
    +'</div></section></div>';
  $('appView').innerHTML=h;
  document.querySelectorAll('[data-save-role]').forEach(function(b){b.addEventListener('click',function(){saveAccountRole(b.dataset.saveRole)})});
  document.querySelectorAll('[data-toggle-active]').forEach(function(b){b.addEventListener('click',function(){toggleAccountActive(b.dataset.toggleActive,b.dataset.active==='true')})});
}

var ROLE_LABELS={province_head:'Viện trưởng tỉnh',province_deputy:'Phó Viện trưởng tỉnh',unit_head:'Trưởng phòng/Viện trưởng KV',unit_deputy:'Phó phòng/Phó Viện trưởng KV',staff:'Cán bộ/Kiểm sát viên',administrator:'Quản trị viên'};
var ROLE_OPTIONS=['staff','unit_deputy','unit_head','province_deputy','province_head','administrator'];

function assignRoleTableHtml(people,assignedByUser){
  if(!people.length)return '<div class="empty-state compact-empty"><strong>Chưa có tài khoản nào</strong></div>';
  var sorted=people.slice().sort(function(a,b){return (a.is_active===b.is_active)?0:(a.is_active?1:-1)});
  var unitOptions=UNITS.filter(function(u){return u.type!=='province'});
  return '<div class="table-wrap"><table><thead><tr><th>Họ và tên</th><th>Trạng thái</th><th>Vai trò</th><th>Đơn vị</th><th>Đơn vị phụ trách (nếu là Phó VT tỉnh)</th><th></th></tr></thead><tbody>'+sorted.map(function(p){
    var roleSel='<select data-role-select="'+p.id+'">'+ROLE_OPTIONS.map(function(r){return '<option value="'+r+'" '+(p.role===r?'selected':'')+'>'+ROLE_LABELS[r]+'</option>'}).join('')+'</select>';
    var unitSel='<select data-unit-select="'+p.id+'">'+unitOptions.map(function(u){return '<option value="'+u.id+'" '+(p.unit_id===u.id?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select>';
    var assigned=assignedByUser[p.id]||[];
    var assignSel='<select multiple size="3" data-assigned-select="'+p.id+'">'+unitOptions.map(function(u){return '<option value="'+u.id+'" '+(assigned.indexOf(u.id)>=0?'selected':'')+'>'+esc(u.short_name||u.code)+'</option>'}).join('')+'</select>';
    var isSelf=p.id===U.id;
    var lockBtn=isSelf?'':'<button type="button" class="button button-small '+(p.is_active?'button-danger':'button-secondary')+'" data-toggle-active="'+p.id+'" data-active="'+p.is_active+'">'+(p.is_active?'Khoá':'Mở lại')+'</button>';
    return '<tr><td><strong>'+esc(p.full_name)+'</strong></td><td><span class="status-pill '+(p.is_active?'status-approved':'status-pending')+'">'+(p.is_active?'Đang hoạt động':'Chờ xác nhận')+'</span></td><td>'+roleSel+'</td><td>'+unitSel+'</td><td>'+assignSel+'</td><td class="numeric"><button class="button button-primary button-small" data-save-role="'+p.id+'">Lưu</button> '+lockBtn+'</td></tr>';
  }).join('')+'</tbody></table></div>';
}

async function saveAccountRole(id){
  if(!requireActive())return;
  var roleSel=document.querySelector('[data-role-select="'+id+'"]');
  var unitSel=document.querySelector('[data-unit-select="'+id+'"]');
  var assignedSel=document.querySelector('[data-assigned-select="'+id+'"]');
  if(!roleSel||!unitSel)return;
  try{
    var r=await fetch(API+'rpc/assign_account_role',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_user_id:id,p_role:roleSel.value,p_unit_id:unitSel.value})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));

    if(roleSel.value==='province_deputy'&&assignedSel){
      var chosen=Array.from(assignedSel.selectedOptions).map(function(o){return o.value});
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
  if(U.rl==='unit_deputy'&&U.delegated)return auid===U.uid&&ar==='staff';
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
  h+=queue.length?queue.map(function(l){
    return '<button class="queue-item '+(l.id===SELECTED_REVIEW_ID?'is-selected':'')+'" data-review-id="'+l.id+'"><strong>'+esc(l._author.full_name||'')+'</strong>'+(l.revision_count?'<span class="resubmission-badge">Trình lại lần '+l.revision_count+'</span>':'')+'<p>'+esc(l.title)+'</p><span class="queue-meta"><span>'+esc(unitShort(l.unit_id))+'</span><span>'+shortDate(l.log_date)+'</span></span></button>';
  }).join(''):'<div class="panel empty-state"><strong>Đã xử lý hết</strong><span>Không còn nhật ký chờ đánh giá.</span></div>';
  h+='</div></section><section class="panel review-detail">'+(selected?reviewDetailHtml(selected):'<div class="empty-state"><strong>Không có nhật ký cần xử lý</strong><span>Hãy quay lại khi có nhật ký mới.</span></div>')+'</section></div>';
  $('appView').innerHTML=h;
  document.querySelectorAll('[data-review-id]').forEach(function(b){b.addEventListener('click',function(){SELECTED_REVIEW_ID=b.dataset.reviewId;rr()})});
  if(selected)bindReviewActions(selected);
}

function reviewDetailHtml(log){
  var complexity=6,quality=8;
  var resubmission=log.revision_count?'<div class="resubmission-context"><strong>Báo cáo đã được chỉnh sửa và trình lại lần '+log.revision_count+'</strong></div>':'';
  return '<div class="panel-header"><div><span class="eyebrow">'+shortDate(log.log_date)+'</span><h2>'+esc(log.title)+'</h2><p>'+esc(log._author.full_name||'')+' · '+esc(log._author.title||'')+' · '+esc(unitShort(log.unit_id))+'</p></div></div>'
    +resubmission
    +'<div class="detail-section"><h3>Kết quả báo cáo</h3><p>'+esc(log.result)+'</p><div class="detail-grid"><div class="detail-item"><span>Lĩnh vực</span><strong>'+esc(catName(log.category_id))+'</strong></div><div class="detail-item"><span>Vai trò</span><strong>'+esc(WORK_ROLE_LABEL[log.work_role]||log.work_role)+'</strong></div><div class="detail-item"><span>Thời gian</span><strong>'+esc(DURATION_LABEL[log.duration]||log.duration)+'</strong></div><div class="detail-item"><span>Minh chứng</span><strong>'+esc(log.evidence||'Không có')+'</strong></div></div></div>'
    +'<div class="detail-section"><div class="rating-grid">'
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
// DANH GIA THANG - thang diem 0-100 kem xep loai A/B/C theo quy dinh nganh
// ============================================
var CURRENT_PERIOD=new Date().toISOString().slice(0,7);
var MONTHLY_ROWS=[],SELECTED_MONTHLY_ID=null,MONTHLY_UNIT_FILTER='all';

function periodLabel(p){var parts=p.split('-');return 'Tháng '+parts[1]+'/'+parts[0]}
function recentPeriods(){
  var now=new Date(),periods=[];
  for(var i=0;i<6;i++){
    var d=new Date(now.getFullYear(),now.getMonth()-i,1);
    periods.push(d.toISOString().slice(0,7));
  }
  return periods;
}

function canApproveMonthly(person){
  if(!person||person.id===U.id)return false;
  if(person.role==='administrator')return false;
  if(U.rl==='province_head')return person.role==='province_deputy'||person.role==='unit_head';
  if(U.rl==='province_deputy')return person.role==='unit_head'&&(U.assignedUnits||[]).indexOf(person.unit_id)>=0;
  if(U.rl==='unit_head')return person.unit_id===U.uid&&person.role!=='unit_head';
  if(U.rl==='unit_deputy'&&U.delegated)return person.unit_id===U.uid&&person.role==='staff';
  return false;
}

async function fetchMonthlyScopeProfiles(){
  var sel='id,full_name,title,professional_title,role,unit_id,initials';
  if(U.rl==='staff'){
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
  var d=new Date(CURRENT_PERIOD+'-01T00:00:00');
  var next=new Date(d.getFullYear(),d.getMonth()+1,1);
  var end=next.toISOString().slice(0,10);
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
    +'</select></label>'+unitFilterHtml+'<div class="spacer"></div></div>';
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
  if(selected){
    var saveBtn=$('saveMonthlyReview');if(saveBtn)saveBtn.addEventListener('click',function(){saveMonthlyApprove(selected)});
    var selfBtn=$('saveSelfScore');if(selfBtn)selfBtn.addEventListener('click',function(){saveMonthlySelfScore()});
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
    +(mayApprove?('<div class="detail-section"><div class="form-grid compact-form"><label class="field"><span>Điểm chính thức</span><input id="officialScore" type="number" min="0" max="100" step="0.25" value="'+(row.official_score!=null?row.official_score:(row.self_score!=null?row.self_score:0))+'"></label><label class="field"><span>Xếp loại</span><select id="classification"><option '+(row.classification==='A'?'selected':'')+'>A</option><option '+(row.classification==='B'?'selected':'')+'>B</option><option '+(row.classification==='C'?'selected':'')+'>C</option></select></label><label class="field field-wide"><span>Nhận xét/giải trình điều chỉnh</span><textarea id="monthlyNote" rows="2">'+esc(row.note||'')+'</textarea></label></div><div class="review-actions"><button class="button button-primary" id="saveMonthlyReview">Duyệt và lưu</button></div></div>'):'')
    +(isSelf?('<div class="detail-section"><label class="field"><span>Điểm tự chấm của cá nhân</span><input id="selfScore" type="number" min="0" max="100" step="0.25" value="'+(row.self_score!=null?row.self_score:0)+'"></label><div class="review-actions"><button class="button button-primary" id="saveSelfScore">Lưu điểm tự chấm</button></div></div>'):'')
    +(!mayApprove&&!isSelf?'<div class="permission-note">Vai trò hiện tại chỉ được xem hồ sơ này; không có quyền thay đổi kết quả.</div>':'');
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
// CAI DAT TAI KHOAN - doi ten, doi mat khau, dang xuat
// ============================================
function openAccountModal(){
  if(!requireActive())return;
  $('accountFullName').value=U.n;
  $('accountPasswordForm').reset();
  $('accountModal').hidden=false;
}
function closeAccountModal(){$('accountModal').hidden=true}

async function submitAccountName(e){
  e.preventDefault();
  var name=$('accountFullName').value.trim();
  if(!name){showToast('Họ tên không được để trống.');return}
  try{
    var r=await fetch(API+'rpc/update_own_name',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_full_name:name})});
    var d=await r.json();
    if(!r.ok||d.success===false)throw new Error((d&&d.error)||('HTTP '+r.status));
    U.n=name;$('sessionUserName').textContent=name;
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
function x(){closeNotificationPanel();cj();closeAccountModal();localStorage.removeItem('st');U=null;$('appShell').hidden=true;$('loginScreen').hidden=false;document.body.classList.add('login-active')}

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
  $('logoutDemo') && ($('logoutDemo').onclick=x);
  $('avatarButton') && ($('avatarButton').onclick=openAccountModal);
  document.querySelectorAll('[data-close-account]').forEach(function(b){b.addEventListener('click',closeAccountModal)});
  $('accountModal') && $('accountModal').addEventListener('click',function(e){if(e.target.id==='accountModal')closeAccountModal()});
  $('accountNameForm') && $('accountNameForm').addEventListener('submit',submitAccountName);
  $('accountPasswordForm') && $('accountPasswordForm').addEventListener('submit',submitAccountPassword);
  $('accountLogout') && ($('accountLogout').onclick=function(){closeAccountModal();x()});
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
