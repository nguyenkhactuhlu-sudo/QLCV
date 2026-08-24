// supabase-auth.js - Login + activate demo UI
(function(){
  if(window.VITE_DEMO_MODE!==false)return;
  console.log('[QLCV] Production');
  var URL=window.VITE_SUPABASE_URL||'https://bmdwpiticfrqhsjolxkl.supabase.co';
  var KEY=window.VITE_SUPABASE_ANON_KEY||'';
  window.addEventListener('DOMContentLoaded',function(){setTimeout(setup,1500);});
  function setup(){
    var h=document.querySelector('.login-card-heading');
    if(h)h.innerHTML='<span class="eyebrow">HE THONG CHINH THUC</span><h2>Dang nhap he thong</h2><p>Nhap email va mat khau.</p>';
    var f=document.getElementById('demoLoginForm');if(!f)return;
    var nf=document.createElement('form');nf.id='demoLoginForm';nf.className='login-form';
    nf.innerHTML='<label class="field"><span>Email</span><input id="loginEmail" type="email" required></label><label class="field"><span>Mat khau</span><input id="loginPassword" type="password" required></label><div id="loginError" style="display:none;color:red;font-size:13px;"></div><button type="submit" id="loginBtn" class="button button-primary login-submit">Dang nhap</button>';
    f.parentNode.replaceChild(nf,f);nf.onsubmit=doLogin;
    var qs=document.querySelector('.quick-account-section');if(qs)qs.style.display='none';
    var rs=document.querySelector('.login-register');if(rs)rs.style.display='none';
    var sp=document.querySelector('.saved-password-note');if(sp)sp.style.display='none';
    var rb=document.getElementById('resetDemo');if(rb)rb.style.display='none';
    var st=localStorage.getItem('st');
    if(st){try{var sj=JSON.parse(st);if(sj.e>Date.now()){restore(sj.t);}else{localStorage.removeItem('st');}}catch(e){}}
  }
  async function restore(t){
    try{
      var r=await fetch(URL+'/auth/v1/user',{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
      var d=await r.json();if(!r.ok||!d.id)return;
      var pr=await fetch(URL+'/rest/v1/profiles?id=eq.'+d.id,{headers:{'apikey':KEY,'Authorization':'Bearer '+t}});
      var pp=await pr.json();if(pp&&pp[0])enter(pp[0],d);
    }catch(e){}
  }
  async function doLogin(e){
    e.preventDefault();
    var em=document.getElementById('loginEmail').value.trim();
    var pw=document.getElementById('loginPassword').value;
    var er=document.getElementById('loginError');var btn=document.getElementById('loginBtn');
    if(!em||!pw){er.textContent='Vui long nhap email va mat khau';er.style.display='block';return;}
    btn.disabled=true;btn.textContent='Dang...';er.style.display='none';
    try{
      var r=await fetch(URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify({email:em,password:pw})});
      var d=await r.json();if(!r.ok)throw new Error(d.error_description||d.msg||'Sai email hoac mat khau');
      localStorage.setItem('st',JSON.stringify({t:d.access_token,r:d.refresh_token,e:Date.now()+3600000}));
      var pr=await fetch(URL+'/rest/v1/profiles?id=eq.'+d.user.id,{headers:{'apikey':KEY,'Authorization':'Bearer '+d.access_token}});
      var pp=await pr.json();if(!pp||!pp[0])throw new Error('Chua co ho so. Lien he admin.');
      btn.disabled=false;btn.textContent='Dang nhap';
      enter(pp[0],d.user);
    }catch(err){er.textContent=err.message;er.style.display='block';btn.disabled=false;btn.textContent='Dang nhap';}
  }
  function enter(profile,user){
    var su={id:profile.id||user.id,name:profile.full_name||user.email,title:profile.title||'',role:profile.role||'staff',unitId:profile.unit_id,initials:profile.initials||'U',email:user.email};
    // Setup demoCredentials so activateDemoUser can find user later
    if(typeof demoCredentials==='undefined')window.demoCredentials={};
    demoCredentials[su.id]={password:'supabase',label:profile.role||'staff'};
    // Also store in window for app.js to reference
    window.__supabaseUser=su;
    setTimeout(function(){
      var ls=document.getElementById('loginScreen');var as=document.getElementById('appShell');
      if(!ls||!as)return;
      ls.hidden=true;as.hidden=false;document.body.classList.remove('login-active');
      var av=document.getElementById('avatarInitials');if(av)av.textContent=su.initials;
      var sn=document.getElementById('sessionUserName');if(sn)sn.textContent=su.name;
      var sr=document.getElementById('sessionUserRole');
      if(sr){var un='';if(typeof unitById==='function'){var uu=unitById(su.unitId);if(uu)un=uu.short||'';}sr.textContent=(su.title||'')+' . '+un;}
      var t=document.getElementById('toast');
      if(t){t.textContent='Dang nhap thanh cong!';t.classList.add('is-visible');setTimeout(function(){t.classList.remove('is-visible')},3000);}
    },400);
  }
})();