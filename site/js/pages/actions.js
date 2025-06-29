import { api } from '../api.js';
import { getUser } from '../auth.js';
import { toast } from '../ui/toast.js';

const me = getUser();
if (!me || !['admin', 'owner'].includes(me.role)) location.href = '/';

const tbody = document.querySelector('#actTable tbody');

async function load() {
  try {
    const res = await api.request('/admin/actions', { method: 'GET', body: { admin: me.username, limit: 100 } });
    tbody.innerHTML = '';
    res.actions.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.id}</td><td>${a.user_id}</td><td>${a.action}</td><td>${a.details}</td><td>${a.created_at}</td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    toast.error(e.message);
  }
}

load(); 