// --- iOS Style WizzyBotTG Frontend ---
let currentUser = null;
const API_URL = 'https://functions.yandexcloud.net/d4ebcfj6jrf3aopicn2c';

// Userbot status polling
let statusPollingInterval = null;
let currentUserbotStatus = null;
let lastUserbotStatus = null;
let isStatusLoading = false;

// Theme toggle
function setTheme(light) {
    if (light) {
        document.body.classList.add('light');
        document.getElementById('themeIcon').textContent = '☀️';
    } else {
        document.body.classList.remove('light');
        document.getElementById('themeIcon').textContent = '🌙';
    }
    localStorage.setItem('theme', light ? 'light' : 'dark');
}
document.getElementById('themeToggle').onclick = () => {
    setTheme(!document.body.classList.contains('light'));
};
if (localStorage.getItem('theme') === 'light') setTheme(true);

// Sidebar logic
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuToggle = document.getElementById('menuToggle');
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
}
function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
}
menuToggle.onclick = openSidebar;
sidebarOverlay.onclick = closeSidebar;

// Section switching
window.showSection = function(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    if (section === 'dashboard') document.getElementById('dashboardSection').classList.add('active');
    if (section === 'console') document.getElementById('consoleSection').classList.add('active');
    if (section === 'tglogin') document.getElementById('tgloginSection').classList.add('active');
    if (section === 'users') document.getElementById('usersSection').classList.add('active');
    closeSidebar();
    
    // Активное меню
    document.querySelectorAll('.sidebar .menu-item').forEach(item => item.classList.remove('active'));
    if (section === 'dashboard') document.querySelector('.sidebar .menu-item:nth-child(1)').classList.add('active');
    if (section === 'console') document.querySelector('.sidebar .menu-item:nth-child(2)').classList.add('active');
    if (section === 'tglogin') document.querySelector('.sidebar .menu-item:nth-child(3)').classList.add('active');
    if (section === 'users') document.querySelector('.sidebar .menu-item:nth-child(4)').classList.add('active');
    
    // Если открыли секцию входа в Telegram, обновляем статус
    if (section === 'tglogin') {
        updateUserbotStatus();
    }
    // Если открыли dashboard, обновляем статус userbot
    if (section === 'dashboard') {
        updateDashboardUserbotStatus();
    }
};

// --- AUTH ---
const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const userAvatar = document.getElementById('userAvatar');

loginForm.onsubmit = async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Пример: только один пользователь (можно расширить)
    if (username === 'wizzy' && password === 'Wizzy100&') {
        currentUser = { username: 'wizzy', role: 'Создатель', avatar: 'W' };
        loginPage.style.display = 'none';
        dashboard.style.display = 'block';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'block';
        userName.textContent = username;
        userRole.textContent = currentUser.role;
        userAvatar.textContent = currentUser.avatar;
        setTimeout(() => { successMessage.style.display = 'none'; }, 1500);
        localStorage.setItem('userbot_logged_in', '1');
        loadUsers();
        startStatusPolling();
        updateDashboardUserbotStatus();
    } else {
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
};

window.logout = function() {
    dashboard.style.display = 'none';
    loginPage.style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    localStorage.removeItem('userbot_logged_in');
    stopStatusPolling();
};

// --- USERBOT API FUNCTIONS ---
async function callAPI(path, method = 'GET', data = null) {
    try {
        const payload = {
            path: path,
            httpMethod: method
        };
        if (data) payload.body = data;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            // Попробуем получить текст ошибки
            let errorText = await response.text();
            let errorJson;
            try { errorJson = JSON.parse(errorText); } catch { errorJson = null; }
            const msg = errorJson && errorJson.error ? errorJson.error : errorText;
            throw new Error(`HTTP error! status: ${response.status} | ${msg}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        // Показываем ошибку пользователю, если есть функция showMessage
        if (typeof showMessage === 'function') {
            showMessage('error', `Ошибка API: ${error.message || error}`);
        }
        throw error;
    }
}

// --- DASHBOARD USERBOT STATUS ---
async function updateDashboardUserbotStatus() {
    try {
        const status = await callAPI('/userbot/status', 'GET');
        updateDashboardUI(status);
    } catch (error) {
        updateDashboardUI({
            status: 'error',
            message: 'Ошибка подключения к API',
            session_alive: false
        });
    }
}

function updateDashboardUI(status) {
    const statusDot = document.getElementById('statusDot');
    const statusBadge = document.getElementById('statusBadge');
    const statusStats = document.getElementById('statusStats');
    
    statusDot.className = 'status-dot ' + status.status;
    statusBadge.className = 'status-badge ' + status.status;
    
    const statusTexts = {
        'disconnected': 'Отключен',
        'awaiting_phone': 'Ожидание номера',
        'awaiting_code': 'Ожидание кода',
        'awaiting_password': 'Ожидание пароля',
        'authorized': 'Авторизован',
        'connecting': 'Подключение',
        'error': 'Ошибка'
    };
    statusBadge.textContent = statusTexts[status.status] || status.status;
    
    // Статистика
    statusStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Статус</div>
            <div class="stat-value">${statusTexts[status.status] || status.status}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Последнее обновление</div>
            <div class="stat-value">${status.last_updated ? new Date(status.last_updated).toLocaleString() : '-'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Телефон</div>
            <div class="stat-value">${status.phone ? '+7' + status.phone : '-'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Сессия</div>
            <div class="stat-value">${status.session_alive ? 'Активна' : 'Нет'}</div>
        </div>
    `;
}

// --- USERBOT STATUS & LOGIN (TG Вход) ---
function setStatusLoading(loading) {
    const statusDot = document.getElementById('statusDot');
    if (loading) {
        statusDot.classList.add('loading');
    } else {
        statusDot.classList.remove('loading');
    }
}

async function updateUserbotStatus() {
    setStatusLoading(true);
    try {
        const status = await callAPI('/userbot/status', 'GET');
        currentUserbotStatus = status;
        updateUserbotUI(status);
        updateUserbotLoginUI(status);
        // Если статус изменился — лог
        if (!lastUserbotStatus || JSON.stringify(status) !== JSON.stringify(lastUserbotStatus)) {
            console.log('[UserbotStatus] Changed:', status);
        }
        lastUserbotStatus = status;
    } catch (error) {
        updateUserbotUI({
            status: 'error',
            message: 'Ошибка подключения к API',
            session_alive: false
        });
        updateUserbotLoginUI({ status: 'error' });
        console.error('[UserbotStatus] Polling error:', error);
    } finally {
        setStatusLoading(false);
    }
}

function updateUserbotUI(status) {
    const statusDot = document.getElementById('userbotStatusDot');
    const statusBadge = document.getElementById('userbotStatusBadge');
    const statusMessage = document.getElementById('userbotStatusMessage');
    
    // Обновляем индикатор статуса
    statusDot.className = 'status-dot ' + status.status;
    statusBadge.className = 'status-badge ' + status.status;
    statusMessage.textContent = status.message;
    
    // Обновляем текст бейджа
    const statusTexts = {
        'disconnected': 'Отключен',
        'awaiting_phone': 'Ожидание номера',
        'awaiting_code': 'Ожидание кода',
        'awaiting_password': 'Ожидание пароля',
        'authorized': 'Авторизован',
        'connecting': 'Подключение',
        'error': 'Ошибка'
    };
    statusBadge.textContent = statusTexts[status.status] || status.status;
    
    // Обновляем форму в зависимости от статуса
    updateLoginForm(status);
}

function updateLoginForm(status) {
    // Скрываем все группы
    const phoneGroup = document.getElementById('phoneGroupStep');
    const codeGroup = document.getElementById('codeGroupStep');
    const passwordGroup = document.getElementById('passwordGroupStep');
    const loginButtonGroup = document.getElementById('loginButtonGroup');
    const logoutButtonGroup = document.getElementById('logoutButtonGroup');
    if (phoneGroup) phoneGroup.style.display = 'none';
    if (codeGroup) codeGroup.style.display = 'none';
    if (passwordGroup) passwordGroup.style.display = 'none';
    if (loginButtonGroup) loginButtonGroup.style.display = 'none';
    if (logoutButtonGroup) logoutButtonGroup.style.display = 'none';
    
    // Показываем нужную группу в зависимости от статуса
    switch (status.status) {
        case 'disconnected':
        case 'error':
            if (loginButtonGroup) loginButtonGroup.style.display = 'block';
            break;
        case 'awaiting_phone':
            if (phoneGroup) phoneGroup.style.display = 'block';
            break;
        case 'awaiting_code':
            if (codeGroup) codeGroup.style.display = 'block';
            break;
        case 'awaiting_password':
            if (passwordGroup) passwordGroup.style.display = 'block';
            break;
        case 'authorized':
            if (logoutButtonGroup) logoutButtonGroup.style.display = 'block';
            break;
    }
}

// --- TG LOGIN STEPS (UX) ---
function updateUserbotLoginUI(status) {
    // Скрываем все шаги
    document.getElementById('tgLoginStepStart').style.display = 'none';
    document.getElementById('tgLoginForm').style.display = 'none';
    document.getElementById('phoneGroupStep').style.display = 'none';
    document.getElementById('codeGroupStep').style.display = 'none';
    document.getElementById('passwordGroupStep').style.display = 'none';
    // Ошибки/успехи
    document.getElementById('tgStepErrorMessage').style.display = 'none';
    document.getElementById('tgStepSuccessMessage').style.display = 'none';

    if (!status || status.status === 'disconnected' || status.status === 'error') {
        document.getElementById('tgLoginStepStart').style.display = 'block';
    } else if (status.status === 'awaiting_phone') {
        document.getElementById('tgLoginForm').style.display = 'block';
        document.getElementById('phoneGroupStep').style.display = 'block';
    } else if (status.status === 'awaiting_code') {
        document.getElementById('tgLoginForm').style.display = 'block';
        document.getElementById('codeGroupStep').style.display = 'block';
    } else if (status.status === 'awaiting_password') {
        document.getElementById('tgLoginForm').style.display = 'block';
        document.getElementById('passwordGroupStep').style.display = 'block';
    } else if (status.status === 'authorized') {
        // Всё скрываем, userbot авторизован
    }
}

window.showPhoneInputStep = function() {
    updateUserbotLoginUI({ status: 'awaiting_phone' });
};

window.submitPhoneStep = async function() {
    const phone = document.getElementById('tgPhoneStep').value.trim();
    if (!/^\+7\d{10}$/.test(phone)) {
        showStepMessage('error', 'Введите номер в формате +79043645522');
        return;
    }
    try {
        const btn = event.target;
        btn.classList.add('loading');
        btn.disabled = true;
        const resp = await callAPI('/userbot/start_login', 'POST', { phone });
        if (resp.success) {
            showStepMessage('success', resp.message);
            updateUserbotLoginUI({ status: 'awaiting_code' });
        } else {
            showStepMessage('error', resp.error || 'Ошибка отправки кода');
        }
    } catch (e) {
        showStepMessage('error', 'Ошибка подключения к API');
    } finally {
        const btn = event.target;
        btn.classList.remove('loading');
        btn.disabled = false;
    }
};

window.submitCodeStep = async function() {
    const code = document.getElementById('tgCodeStep').value.trim();
    if (!/^\d{4,6}$/.test(code)) {
        showStepMessage('error', 'Введите корректный код');
        return;
    }
    try {
        const btn = event.target;
        btn.classList.add('loading');
        btn.disabled = true;
        const resp = await callAPI('/userbot/submit_code', 'POST', { code });
        if (resp.success) {
            showStepMessage('success', resp.message);
            if (resp.next_step === 'password') {
                updateUserbotLoginUI({ status: 'awaiting_password' });
            } else {
                updateUserbotLoginUI({ status: 'authorized' });
            }
        } else {
            showStepMessage('error', resp.error || 'Ошибка проверки кода');
        }
    } catch (e) {
        showStepMessage('error', 'Ошибка подключения к API');
    } finally {
        const btn = event.target;
        btn.classList.remove('loading');
        btn.disabled = false;
    }
};

window.submitPasswordStep = async function() {
    const password = document.getElementById('tgPasswordStep').value;
    if (!password) {
        showStepMessage('error', 'Введите пароль');
        return;
    }
    try {
        const btn = event.target;
        btn.classList.add('loading');
        btn.disabled = true;
        const resp = await callAPI('/userbot/submit_password', 'POST', { password });
        if (resp.success) {
            showStepMessage('success', resp.message);
            updateUserbotLoginUI({ status: 'authorized' });
        } else {
            showStepMessage('error', resp.error || 'Ошибка проверки пароля');
        }
    } catch (e) {
        showStepMessage('error', 'Ошибка подключения к API');
    } finally {
        const btn = event.target;
        btn.classList.remove('loading');
        btn.disabled = false;
    }
};

function showStepMessage(type, message) {
    const errorEl = document.getElementById('tgStepErrorMessage');
    const successEl = document.getElementById('tgStepSuccessMessage');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    if (type === 'error') {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else if (type === 'success') {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
    setTimeout(() => {
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
    }, 5000);
}

// --- STATUS POLLING ---
function startStatusPolling() {
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
    }
    updateUserbotStatus();
    statusPollingInterval = setInterval(() => {
        updateUserbotStatus();
    }, 5000); // 5 секунд для отзывчивости
}

function stopStatusPolling() {
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        statusPollingInterval = null;
    }
}

// --- PROFILE MODAL ---
window.openProfileModal = function() {
    document.getElementById('profileModal').classList.add('show');
    document.getElementById('profileUsername').value = userName.textContent;
    document.getElementById('profileRole').value = userRole.textContent;
    document.getElementById('profileAvatar').value = userAvatar.textContent;
};

window.closeProfileModal = function() {
    document.getElementById('profileModal').classList.remove('show');
};

document.getElementById('profileForm').onsubmit = function(e) {
    e.preventDefault();
    userName.textContent = document.getElementById('profileUsername').value;
    userAvatar.textContent = document.getElementById('profileAvatar').value;
    closeProfileModal();
};

// --- USERS API ---
// Отключено, так как endpoint /users не реализован на сервере
/*
async function getUsers() {
    try {
        const resp = await callAPI('/users', 'GET');
        if (resp.success && Array.isArray(resp.users)) {
            allUsers = resp.users;
        } else {
            allUsers = [];
        }
    } catch (e) {
        allUsers = [];
    }
    renderUsersList();
}
async function createUser(user) {
    try {
        const resp = await callAPI('/users', 'POST', user);
        if (resp.success) {
            showMessage('success', 'Пользователь создан');
            await getUsers();
        } else {
            showMessage('error', resp.error || 'Ошибка создания');
        }
    } catch (e) {
        showMessage('error', 'Ошибка подключения к API');
    }
}
async function updateUser(idx, user) {
    try {
        const resp = await callAPI(`/users/${allUsers[idx].username}`, 'PUT', user);
        if (resp.success) {
            showMessage('success', 'Пользователь обновлен');
            await getUsers();
        } else {
            showMessage('error', resp.error || 'Ошибка обновления');
        }
    } catch (e) {
        showMessage('error', 'Ошибка подключения к API');
    }
}
async function deleteUser(idx) {
    if (!confirm('Удалить пользователя?')) return;
    try {
        const resp = await callAPI(`/users/${allUsers[idx].username}`, 'DELETE');
        if (resp.success) {
            showMessage('success', 'Пользователь удален');
            await getUsers();
        } else {
            showMessage('error', resp.error || 'Ошибка удаления');
        }
    } catch (e) {
        showMessage('error', 'Ошибка подключения к API');
    }
}
let allUsers = [];
async function loadUsers() {
    await getUsers();
}
function renderUsersList() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    allUsers.forEach((user, idx) => {
        usersList.innerHTML += `
        <div class="user-card">
            <div class="user-info-card">
                <div class="user-avatar-card" style="background: ${user.color};">${user.avatar}</div>
                <div class="user-details">
                    <div class="user-name-card">${user.prefix} <span style="color:${user.color}">${user.username}</span></div>
                    <div class="user-role-card">${user.role}</div>
                </div>
            </div>
            <div class="user-actions">
                <button class="action-btn-small" onclick="editUser(${idx})">Редактировать</button>
                <button class="action-btn-small" onclick="deleteUser(${idx})">Удалить</button>
            </div>
        </div>`;
    });
}
window.editUser = function(idx) { openUserEditModal(idx); };
window.deleteUser = function(idx) { deleteUser(idx); };
window.showCreateUserModal = function() { openUserEditModal(null); };
function openUserEditModal(idx) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    const user = idx !== null ? allUsers[idx] : { username: '', role: '', avatar: '', prefix: '', color: '#238636', status: 'online', password: '' };
    modal.innerHTML = `
    <div class="modal-content ios-glass">
        <div class="modal-header">
            <h3 class="modal-title">${idx !== null ? 'Редактировать пользователя' : 'Создать пользователя'}</h3>
            <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="userEditForm">
            <div class="form-group">
                <label class="form-label">Имя пользователя</label>
                <input type="text" class="form-input" id="editUsername" value="${user.username}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Роль</label>
                <input type="text" class="form-input" id="editRole" value="${user.role}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Аватар (буква/эмодзи)</label>
                <input type="text" class="form-input" id="editAvatar" value="${user.avatar}" maxlength="2">
            </div>
            <div class="form-group">
                <label class="form-label">Префикс</label>
                <input type="text" class="form-input" id="editPrefix" value="${user.prefix}" maxlength="3">
            </div>
            <div class="form-group">
                <label class="form-label">Цвет ника</label>
                <input type="color" class="form-input" id="editColor" value="${user.color}">
            </div>
            <div class="form-group">
                <label class="form-label">Статус</label>
                <select class="form-input" id="editStatus">
                    <option value="online" ${user.status==='online'?'selected':''}>Онлайн</option>
                    <option value="offline" ${user.status==='offline'?'selected':''}>Оффлайн</option>
                    <option value="banned" ${user.status==='banned'?'selected':''}>Забанен</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Пароль</label>
                <input type="text" class="form-input" id="editPassword" value="${user.password}" required>
            </div>
            <button type="submit" class="control-btn primary ios-btn" style="width:100%;">${idx !== null ? 'Сохранить' : 'Создать'}</button>
        </form>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('userEditForm').onsubmit = function(e) {
        e.preventDefault();
        const newUser = {
            username: document.getElementById('editUsername').value,
            role: document.getElementById('editRole').value,
            avatar: document.getElementById('editAvatar').value,
            prefix: document.getElementById('editPrefix').value,
            color: document.getElementById('editColor').value,
            status: document.getElementById('editStatus').value,
            password: document.getElementById('editPassword').value
        };
        if (idx !== null) {
            updateUser(idx, newUser);
        } else {
            createUser(newUser);
        }
        modal.remove();
    };
}
*/
// --- END USERS API ---

// --- CONSOLE ---
async function sendConsoleCommand(cmd) {
    try {
        const resp = await callAPI('/userbot/console', 'POST', { command: cmd });
        if (resp.success) {
            addConsoleLine(resp.output || 'Команда выполнена', 'success');
        } else {
            addConsoleLine(resp.error || 'Ошибка выполнения', 'error');
        }
    } catch (e) {
        addConsoleLine('Ошибка подключения к API', 'error');
    }
}

function handleConsoleInput(e) {
    if (e.key === 'Enter') {
        const input = e.target.value.trim();
        if (input) {
            addConsoleLine(`$ ${input}`, 'info');
            sendConsoleCommand(input);
            e.target.value = '';
        }
    }
}

function addConsoleLine(text, type = 'info') {
    const consoleOutput = document.getElementById('consoleOutput');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// --- BOT STATUS ---
function updateBotStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusBadge = document.getElementById('statusBadge');
    
    statusDot.className = 'status-dot ' + status;
    statusBadge.className = 'status-badge ' + status;
    
    const statusTexts = {
        'online': 'Онлайн',
        'offline': 'Оффлайн',
        'connecting': 'Подключение',
        'error': 'Ошибка',
        'disconnected': 'Отключен',
        'awaiting_phone': 'Ожидание номера',
        'awaiting_code': 'Ожидание кода',
        'awaiting_password': 'Ожидание пароля',
        'authorized': 'Авторизован'
    };
    statusBadge.textContent = statusTexts[status] || status;
}

async function pollBotStatus() {
    try {
        // Получаем статус userbot с API
        const resp = await callAPI('/userbot/status', 'GET');
        if (resp && resp.status) {
            updateBotStatus(resp.status);
        } else {
            updateBotStatus('error');
        }
    } catch (error) {
        console.error('Ошибка получения статуса бота:', error);
        updateBotStatus('error');
    }
}

// --- DASHBOARD USERBOT CONTROLS ---
document.getElementById('restartUserbotBtn').onclick = async function() {
    const btn = this;
    btn.classList.add('loading');
    btn.disabled = true;
    try {
        // Нет отдельного endpoint /userbot/restart, можно реализовать как stop+start, если появится
        // Пока просто обновляем статус
        await callAPI('/userbot/logout', 'POST');
        showMessage('success', 'Userbot остановлен');
        // Здесь можно добавить запуск userbot, если появится endpoint
        // await callAPI('/userbot/start', 'POST');
        // showMessage('success', 'Userbot запущен');
        await updateDashboardUserbotStatus();
    } catch (e) {
        showMessage('error', 'Ошибка подключения к API');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
};
document.getElementById('stopUserbotBtn').onclick = async function() {
    const btn = this;
    btn.classList.add('loading');
    btn.disabled = true;
    try {
        const resp = await callAPI('/userbot/logout', 'POST');
        if (resp.success) {
            showMessage('success', 'Userbot остановлен');
        } else {
            showMessage('error', resp.error || 'Ошибка остановки');
        }
        await updateDashboardUserbotStatus();
    } catch (e) {
        showMessage('error', 'Ошибка подключения к API');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
};

// --- INITIALIZATION ---
if (localStorage.getItem('userbot_logged_in')) {
    currentUser = { username: 'wizzy', role: 'Создатель', avatar: 'W' };
    loginPage.style.display = 'none';
    dashboard.style.display = 'block';
    userName.textContent = currentUser.username;
    userRole.textContent = currentUser.role;
    userAvatar.textContent = currentUser.avatar;
    loadUsers();
    startStatusPolling();
    updateDashboardUserbotStatus();
} 