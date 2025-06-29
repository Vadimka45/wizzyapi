import { isAuth, getUser, logout } from './auth.js';

const routes = {
  '/login': '/pages/login.html',
  '/': '/pages/dashboard.html',
  '/profile': '/pages/profile.html',
  '/banned': '/pages/banned.html',
  '/users': '/pages/users.html',
  '/actions': '/pages/actions.html'
};

async function load(path){
  const file = routes[path.startsWith('/profile')?'/profile':path] || routes['/'];
  const html = await fetch(file).then(r=>r.text());
  document.getElementById('app').innerHTML = html;
  if(path.startsWith('/profile')){
    import('./pages/profile.js');
  }else if(path==='/login'){
    import('./pages/login.js');
  }else if(path==='/users'){
    import('./pages/users.js');
  }else if(path==='/actions'){
    import('./pages/actions.js');
  }else{
    import('./pages/dashboard.js');
  }
  renderSidebar();
  renderTopbar();
}

function navigate(path){
  if(path!==location.pathname) history.pushState({}, '', path);
  guard();
}

function guard(){
  const authed = isAuth();
  const p = location.pathname;
  const u = getUser();
  if(!authed && p!=='/login') return navigate('/login');
  if(authed && p==='/login') return navigate('/');
  if(authed && u && u.banned) return navigate('/banned');
  load(p);
}

window.addEventListener('popstate', guard);
window.addEventListener('DOMContentLoaded', ()=>{
  document.body.addEventListener('click',e=>{
    const a=e.target.closest('a[data-link]');
    if(a){e.preventDefault();navigate(a.getAttribute('href'));}}
  );
  guard();
});

function renderSidebar(){
  let u = getUser();
  const side = document.querySelector('.sidebar') || document.createElement('nav');
  side.className = 'sidebar';
  side.innerHTML = `
    <a href="/profile" data-link title="Профиль">${u ? (u.avatar || '👤') : '👤'}</a>
    <a href="/" data-link title="Главная">🏠</a>
    ${(u && (u.role==='admin'||u.role==='owner')) ? `<a href="/users" data-link title="Пользователи">👥</a><a href="/actions" data-link title="Действия">📜</a>` : ''}
  `;
  if(!side.parentNode) document.body.appendChild(side);
}

function renderTopbar(){
  let u = getUser();
  let top = document.querySelector('.topbar');
  if(!top){
    top = document.createElement('div');
    top.className = 'topbar';
    document.body.appendChild(top);
  }
  top.innerHTML = u ? `
    <div class="topbar-right">
      <span class="profile-mini" id="profileMini">${u.avatar || '👤'}</span>
      <span class="profile-name">${u.name || u.username}</span>
      <span class="profile-role role-badge ${u.role}">${u.role}</span>
      <button class="btn" id="themeBtn" title="Сменить тему">🌓</button>
      <button class="btn" id="logoutBtn" title="Выйти">🚪</button>
    </div>
  ` : '';
  if(u){
    document.getElementById('logoutBtn').onclick = ()=>{logout();navigate('/login');};
    document.getElementById('themeBtn').onclick = toggleTheme;
    document.getElementById('profileMini').onclick = ()=>navigate('/profile');
  }
}

function toggleTheme(){
  const dark = document.body.classList.toggle('theme-dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

// Автоустановка темы
if(localStorage.getItem('theme')==='dark') document.body.classList.add('theme-dark'); 