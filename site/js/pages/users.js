import { api } from '../api.js';
import { getUser } from '../auth.js';
import { toast } from '../ui/toast.js';

const me = getUser();
if (!me || !['admin', 'owner'].includes(me.role)) location.href = '/';

const tbody = document.querySelector('#usersTable tbody');
const search = document.getElementById('userSearch');
const modal = document.getElementById('modal');

const roleIcons = {
  user: '👤',
  helper: '🛡️',
  admin: '🛑',
  owner: '👑'
};

function row(u) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${u.id}</td><td>${u.name || u.username}</td><td><span class="role-badge ${u.role}">${roleIcons[u.role] || ''}</span></td><td>${u.status === 'online' ? '🟢' : '🔴'}</td><td>${u.banned ? '✔' : '-'}</td><td><button class="btn hover-gradient" data-id="${u.id}">⋯</button></td>`;
  return tr;
}

let allUsers = [];

async function load() {
  try {
    const res = await api.request('/admin/users', { method: 'GET', body: { admin: me.username } });
    allUsers = res.users;
    renderUsers(allUsers);
  } catch (e) {
    toast.error('Ошибка загрузки пользователей');
  }
}

function renderUsers(users) {
  tbody.innerHTML = '';
  users.forEach(u => tbody.appendChild(row(u)));
}

search.oninput = () => {
  const q = search.value.toLowerCase();
  renderUsers(allUsers.filter(u => (u.username && u.username.toLowerCase().includes(q)) || (u.name && u.name.toLowerCase().includes(q)) || (u.id + '').includes(q)));
};

tbody.onclick = e => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;
  openModal(id);
};

function openModal(id) {
  const user = allUsers.find(u => u.id == id);
  if (!user) return;
  modal.style.display = 'flex';
  modal.innerHTML = `<div class="modal-box"><h3>Управление #${user.id}</h3>
    <div>Имя: <b>${user.name || user.username}</b></div>
    <div>Роль: <span class="role-badge ${user.role}">${roleIcons[user.role] || ''}</span></div>
    <div>Статус: ${user.status === 'online' ? '🟢' : '🔴'}</div>
    <div>Бан: ${user.banned ? '✔' : '-'}</div>
    <button class="btn hover-gradient" id="banBtn">${user.banned ? 'Разбанить' : 'Забанить'}</button>
    <button class="btn hover-gradient" id="editBtn">Изменить</button>
    <button class="btn" id="closeBtn">Закрыть</button>
  </div>`;
  document.getElementById('closeBtn').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('banBtn').onclick = async () => {
    try {
      await api.request('/admin/user/ban', { method: 'POST', body: { admin: me.username, id: Number(id) } });
      toast.success('Статус бана изменён');
      modal.style.display = 'none';
      load();
    } catch (e) {
      toast.error('Ошибка бана');
    }
  };
  document.getElementById('editBtn').onclick = () => openEditModal(user);
}

function openEditModal(user) {
  modal.innerHTML = `<div class="modal-box"><h3>Редактировать пользователя</h3>
    <label>Имя: <input id="editName" value="${user.name || ''}" /></label>
    <label>Роль: <select id="editRole">
      <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
      <option value="helper" ${user.role === 'helper' ? 'selected' : ''}>Helper</option>
      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
      <option value="owner" ${user.role === 'owner' ? 'selected' : ''}>Owner</option>
    </select></label>
    <button class="btn hover-gradient" id="saveEdit">Сохранить</button>
    <button class="btn" id="closeEdit">Отмена</button>
  </div>`;
  document.getElementById('closeEdit').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('saveEdit').onclick = async () => {
    try {
      await api.request('/admin/user/update', { method: 'POST', body: { admin: me.username, id: user.id, name: document.getElementById('editName').value, role: document.getElementById('editRole').value } });
      toast.success('Изменения сохранены');
      modal.style.display = 'none';
      load();
    } catch (e) {
      toast.error('Ошибка сохранения');
    }
  };
}

modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

load(); 