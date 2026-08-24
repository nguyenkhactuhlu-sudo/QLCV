// QLCV Production - Clean features, no demo data
var U=null,V='d',LOGS=[],UNITS=[];
function $(i){return document.getElementById(i)}
var URL='https://bmdwpiticfrqhsjolxkl.supabase.co';
var KEY='sb_publishable_29o4aITrh7BPX28RFdE31g_qXVjCHGd';
var API=URL+'/rest/v1/';var AUTH=URL+'/auth/v1/';
function tkn(){try{return JSON.parse(localStorage.getItem('st')).t}catch(e){return''}}

document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-view]').forEach(function(b){
    b.addEventListener('click',function(){if(this.dataset.view==='logout'){x();return}V=this.dataset.view;render()})
  });
  $('mobileMenu').onclick=function(){$('sidebar').classList.toggle('is-open')};
  document.querySelectorAll('[data-close-modal]').forEach(function(b){b.addEventListener('click',cj)});
  $('journalModal').addEventListener('click',function(e){if(e.target.id==='journalModal')cj()});
  $('journalForm').addEventListener('submit',sj);
  window.addEventListener('auth-success',async function(e){await initU(e.detail.token,e.detail.userId,e.detail.email)});
  setTimeout(function(){
    var st=localStorage.getItem('st');if(!st)return;
    try{var sj=JSON.parse(st);if(sj.e<Date.now()){localStorage.removeItem('st');return}
    fetch(URL+'/auth/v1/user',{headers:{'apikey':KEY,'Authorization':'Bearer '+sj.t}}).then(function(r){return r.json()}).then(function(d){if(d&&d.id)initU(sj.t,d.id,d.email)}).catch(function(){})}catch(e){}
  },500);
async function initU(t,uid,em){
  try{var pr=await fetch(API+'profiles?id=eq.'+uid,{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});var pp=(await pr.json());var p=pp[0]||{};U={id:uid,n:p.full_name||em,tl:p.title||'',rl:p.role||'staff',uid:p.unit_id,in:p.initials||'U',token:t};
  var ur=await fetch(API+'units?select=id,code,name,short_name',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});UNITS=await ur.json()}catch(e){}
  $('loginScreen').hidden=true;$('appShell').hidden=false;document.body.classList.remove('login-active');
  ub();V='d';render();showToast('Đăng nhập thành công!');
}

function ub(){if(!U)return;$('avatarInitials').textContent=U.in;$('sessionUserName').textContent=U.n;var un='';if(UNITS.length&&U.uid){var uu=UNITS.find(function(x){return x.id===U.uid});if(uu)un=uu.short_name||uu.code;}$('sessionUserRole').textContent=(U.tl||'')+' . '+(un||'')}

function render(){if(V==='d')rd();else if(V==='j')rj();else if(V==='r')rr();else rd()}

async function rd(){
  $('pageEyebrow').textContent='TỔNG QUAN';$('pageTitle').textContent='Bảng điều khiển';
  var h='<div style="padding:10px;background:#e6f4ee;border-radius:10px;margin-bottom:16px;color:#1f7a55"><strong>HỆ THỐNG CHÍNH THỨC</strong></div>';
  try{var r=await fetch(API+'work_logs?order=created_at.desc&limit=50',{headers:{'apikey':KEY,'Authorization':'Bearer '+tkn()}});var logs=r.ok?await r.json():[];LOGS=logs;
  h+='<section class="dashboard-kpi-cluster"><div class="compact-metric"><span>Tổng</span><strong>'+logs.length+'</strong></div></section>';
  if(logs.length){h+='<div class="panel" style="margin-top:16px"><h2>Nhật ký gần đây</h2>';for(var i=0;i<Math.min(logs.length,10);i++){var l=logs[i];h+='<div style="padding:8px 0;border-bottom:1px solid #ccc"><strong>'+(l.title||'')+'</strong> <span style="color:#777;font-size:12px">'+new Date(l.created_at).toLocaleDateString('vi-VN')+'</span></div>'}h+='</div>'}
  else{h+='<div class="empty-state" style="margin-top:30px"><strong>Chưa có dữ liệu</strong><span>Vào Nhật ký để ghi</span></div>'}}catch(e){h+='<div class="empty-state"><strong>Lỗi</strong><span>'+e.message+'</span></div>'}
  $('appView').innerHTML=h;
}

function rj(){$('pageEyebrow').textContent='NHẬT KÝ';$('pageTitle').textContent='Nhật ký công tác';$('appView').innerHTML='<div class="toolbar"><button class="button button-primary" id="nj">+ Thêm nhật ký</button></div><div class="empty-state"><strong>Ghi nhật ký</strong><span>Bấm nút để ghi nhật ký mới</span></div>';$('nj').onclick=oj}
function cj(){$('journalModal').hidden=true;document.body.style.overflow=''}
function oj(){$('journalForm').reset();$('journalModal').hidden=false;document.body.style.overflow='hidden';$('journalForm').querySelector('[name=logDate]').valueAsDate=new Date()}

async function sj(e){e.preventDefault();var f=new FormData($('journalForm'));var log={author_id:U.id,unit_id:U.uid,log_date:f.get('logDate')||new Date().toISOString().split('T')[0],title:f.get('title')||'',result:f.get('result')||'',status:'pending'};try{var r=await fetch(API+'work_logs',{method:'POST',headers:{'apikey':KEY,'Authorization':'Bearer '+tkn(),'Content-Type':'application/json'},body:JSON.stringify(log)});if(!r.ok)throw new Error('HTTP '+r.status);cj();showToast('Đã gửi!');rd()}catch(e){showToast('Lỗi:'+e.message)}}

function rr(){$('pageEyebrow').textContent='CHỜ DUYỆT';$('pageTitle').textContent='Chờ duyệt';$('appView').innerHTML='<div class="empty-state"><strong>Đang phát triển</strong></div>'}
function showToast(m){var t=$('toast');if(t){t.textContent=m;t.classList.add('is-visible');setTimeout(function(){t.classList.remove('is-visible')},3000)}}
function x(){localStorage.removeItem('st');U=null;$('appShell').hidden=true;$('loginScreen').hidden=false;document.body.classList.add('login-active')}
});