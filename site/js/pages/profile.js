import { api } from '../api.js';
import { getUser, logout } from '../auth.js';
import { toast } from '../ui/toast.js';

const u = getUser();
const params = new URLSearchParams(location.search);
let id = params.get('id');
const isAdmin = u.role === 'admin' || u.role === 'owner';
if (!id || (!isAdmin && id != u.id)) id = u.id;

const pName = document.getElementById('pName');
const pRole = document.getElementById('pRole');
const pId = document.getElementById('pId');
const pStatus = document.getElementById('pStatus');
const avatar = document.getElementById('profileAvatar');
const btnLogout = document.getElementById('btnLogout');
const btnEdit = document.getElementById('btnEdit');
const tabActions = document.getElementById('tabActions');
const tabSessions = document.getElementById('tabSessions');
const tabContent = document.getElementById('tabContent');
const modal = document.getElementById('profileModal');

const roleIcons = {
  user: '👤',
  helper: '🛡️',
  admin: '🛑',
  owner: '👑'
};
const roleNames = {
  user: 'User',
  helper: 'Helper',
  admin: 'Admin',
  owner: 'Owner'
};

async function loadProfile() {
  try {
    const res = await api.request('/profile/me', { method: 'GET', body: { username: u.username } });
    const user = res.user;
    pName.textContent = user.name || user.username;
    pRole.textContent = roleIcons[user.role] || '';
    pRole.className = 'role-badge ' + user.role;
    pId.textContent = user.id;
    pStatus.textContent = user.status === 'online' ? '🟢 В сети' : '🔴 Не в сети';
    avatar.textContent = user.avatar || roleIcons[user.role] || '👤';
    if (isAdmin) btnEdit.style.display = '';
    else btnEdit.style.display = 'none';
  } catch (e) {
    toast.error('Ошибка загрузки профиля');
  }
}

btnLogout.onclick = () => { logout(); location.href = '/login'; };
btnEdit.onclick = () => openEditModal();

tabActions.onclick = (e) => { selectTab('actions'); };
tabSessions.onclick = (e) => { selectTab('sessions'); };

function selectTab(tab) {
  document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
  if (tab === 'actions') {
    tabActions.classList.add('active');
    loadActions();
  } else {
    tabSessions.classList.add('active');
    loadSessions();
  }
}

async function loadActions() {
  tabContent.innerHTML = '<div>Загрузка...</div>';
  try {
    const res = await api.request('/admin/actions', { method: 'GET', body: { admin: u.username, limit: 20 } });
    if (!res.actions || !res.actions.length) {
      tabContent.innerHTML = '<div>Нет действий</div>';
      return;
    }
    tabContent.innerHTML = `<table class="users-table"><thead><tr><th>ID</th><th>Action</th><th>Details</th><th>Time</th></tr></thead><tbody>${res.actions.map(a => `<tr><td>${a.id}</td><td>${a.action}</td><td>${a.details}</td><td>${a.created_at}</td></tr>`).join('')}</tbody></table>`;
  } catch (e) {
    tabContent.innerHTML = '<div>Ошибка загрузки действий</div>';
  }
}

async function loadSessions() {
  tabContent.innerHTML = '<div>Загрузка...</div>';
  // Здесь будет логика загрузки сессий (заглушка)
  setTimeout(() => {
    tabContent.innerHTML = `<table class="users-table"><thead><tr><th>Статус</th><th>Устройство</th><th>Локация</th><th>Активность</th><th>Действие</th></tr></thead><tbody>
      <tr><td><span style="color:#10b981">Текущая</span></td><td>Компьютер - Opera</td><td>Швеция, Стокгольм</td><td>2025-06-29 08:31:01</td><td><button class="btn hover-gradient">Завершить</button></td></tr>
      <tr><td><span style="color:#10b981">Текущая</span></td><td>Компьютер - Opera</td><td>Россия, Смоленск</td><td>2025-06-28 23:19:48</td><td><button class="btn hover-gradient">Завершить</button></td></tr>
    </tbody></table>`;
  }, 800);
}

function openEditModal() {
  modal.style.display = 'flex';
  modal.innerHTML = `<div class="modal-box"><h3>Редактировать пользователя</h3>
    <label>Имя: <input id="editName" value="${pName.textContent}" /></label>
    <label>Роль: <select id="editRole">
      <option value="user">User</option>
      <option value="helper">Helper</option>
      <option value="admin">Admin</option>
      <option value="owner">Owner</option>
    </select></label>
    <button class="btn hover-gradient" id="saveEdit">Сохранить</button>
    <button class="btn" id="closeEdit">Отмена</button>
  </div>`;
  document.getElementById('closeEdit').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('saveEdit').onclick = async () => {
    // Здесь будет логика сохранения через API
    toast.success('Изменения сохранены (заглушка)');
    modal.style.display = 'none';
    loadProfile();
  };
}

// Закрытие модального окна по клику вне
modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

// Инициализация
loadProfile();
selectTab('actions'); 