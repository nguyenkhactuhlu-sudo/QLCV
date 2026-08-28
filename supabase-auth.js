// supabase-auth.js - Xu ly dang nhap email/mat khau that.
// Form dang nhap da viet dung san trong index.html, khong can doi/thay the
// gi nua (truoc day doi form bang JS sau 1.5s gay nhay man hinh sai luc tai
// trang). Sau khi dang nhap thanh cong se goi window.QLCV_afterLogin (dinh
// nghia trong app.js cua tung ban) de nap ho so va ve giao dien.
(function(){
  if(window.VITE_DEMO_MODE!==false)return;
  var URL=window.VITE_SUPABASE_URL||'';
  var KEY=window.VITE_SUPABASE_ANON_KEY||'';

  window.addEventListener('DOMContentLoaded',function(){
    var f=document.getElementById('demoLoginForm');
    if(f)f.addEventListener('submit',doLogin);
  });

  async function doLogin(e){
    e.preventDefault();
    var em=document.getElementById('loginEmail').value.trim();
    var pw=document.getElementById('loginPassword').value;
    var er=document.getElementById('loginError');var btn=document.getElementById('loginBtn');
    if(!em||!pw){er.textContent='Vui lòng nhập email và mật khẩu';er.style.display='block';return;}
    btn.disabled=true;btn.textContent='Đang...';er.style.display='none';
    try{
      var r=await fetch(URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify({email:em,password:pw})});
      var d=await r.json();if(!r.ok)throw new Error(d.error_description||d.msg||'Sai email hoặc mật khẩu');
      var rememberEl=document.getElementById('rememberLogin');
      var remember=rememberEl?rememberEl.checked:true;
      if(typeof window.QLCV_saveSession==='function')window.QLCV_saveSession(d.access_token,d.refresh_token,d.expires_in,remember);
      else{
        var payload=JSON.stringify({t:d.access_token,r:d.refresh_token,e:Date.now()+(d.expires_in||3600)*1000});
        (remember?localStorage:sessionStorage).setItem('st',payload);
        (remember?sessionStorage:localStorage).removeItem('st');
      }
      btn.disabled=false;btn.textContent='Đăng nhập';
      if(typeof window.QLCV_afterLogin==='function'){
        await window.QLCV_afterLogin(d.access_token,d.user.id,d.user.email);
      }
    }catch(err){er.textContent=err.message;er.style.display='block';btn.disabled=false;btn.textContent='Đăng nhập';}
  }
})();
