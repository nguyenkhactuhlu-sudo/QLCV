// supabase-auth.js - Thay man hinh dang nhap demo bang dang nhap email/mat khau that.
// Chi phu trach FORM dang nhap; sau khi dang nhap thanh cong se goi window.QLCV_afterLogin
// (dinh nghia trong app.js cua tung ban) de nap ho so va ve giao dien.
(function(){
  if(window.VITE_DEMO_MODE!==false)return;
  var URL=window.VITE_SUPABASE_URL||'';
  var KEY=window.VITE_SUPABASE_ANON_KEY||'';
  window.addEventListener('DOMContentLoaded',function(){setTimeout(setup,1500);});

  function setup(){
    var h=document.querySelector('.login-card-heading');
    if(h)h.innerHTML='<span class="eyebrow">HỆ THỐNG CHÍNH THỨC</span><h2>Đăng nhập hệ thống</h2><p>Nhập email và mật khẩu.</p>';
    var f=document.getElementById('demoLoginForm');if(!f)return;
    var nf=document.createElement('form');nf.id='demoLoginForm';nf.className='login-form';
    nf.innerHTML='<label class="field"><span>Email</span><input id="loginEmail" type="email" required></label><label class="field"><span>Mật khẩu</span><input id="loginPassword" type="password" required></label><div id="loginError" style="display:none;color:red;font-size:13px;"></div><button type="submit" id="loginBtn" class="button button-primary login-submit">Đăng nhập</button>';
    f.parentNode.replaceChild(nf,f);nf.onsubmit=doLogin;
    var qs=document.querySelector('.quick-account-section');if(qs)qs.style.display='none';
    var sp=document.querySelector('.saved-password-note');if(sp)sp.style.display='none';
  }

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
      if(typeof window.QLCV_saveSession==='function')window.QLCV_saveSession(d.access_token,d.refresh_token,d.expires_in);
      else localStorage.setItem('st',JSON.stringify({t:d.access_token,r:d.refresh_token,e:Date.now()+(d.expires_in||3600)*1000}));
      btn.disabled=false;btn.textContent='Đăng nhập';
      if(typeof window.QLCV_afterLogin==='function'){
        await window.QLCV_afterLogin(d.access_token,d.user.id,d.user.email);
      }
    }catch(err){er.textContent=err.message;er.style.display='block';btn.disabled=false;btn.textContent='Đăng nhập';}
  }
})();
