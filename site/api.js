// ---- Конфигурация и константы (перенесены из бывшего config.js) ----

// Configuration constants
export const CONFIG = {
    API_URL: 'https://functions.yandexcloud.net/d4ebcfj6jrf3aopicn2c',
    POLLING_INTERVAL: 5000,
    MAX_RETRIES: 3,
    TOAST_DURATION: 4000,
};

// Error messages
export const ERROR_MESSAGES = {
    API_CONNECTION: 'Ошибка подключения к API. Проверьте соединение.',
    DB_CONNECTION: 'Ошибка подключения к базе данных.',
    AUTH_FAILED: 'Неверное имя пользователя или пароль.',
    NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
    SERVER_ERROR: 'Внутренняя ошибка сервера.',
    INVALID_RESPONSE: 'Некорректный ответ от сервера.',
    SESSION_EXPIRED: 'Сессия истекла. Пожалуйста, войдите снова.',
};

// API endpoints
export const ENDPOINTS = {
    LOGIN: '/auth/login',
    STATUS: '/userbot/status',
    START_LOGIN: '/userbot/start_login',
    SUBMIT_CODE: '/userbot/submit_code',
    SUBMIT_PASSWORD: '/userbot/submit_password',
    LOGOUT: '/auth/logout',
};

// Status codes mapping
export const STATUS_CODES = {
    DB_ERROR: 'DB_ERROR',
    API_ERROR: 'API_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    SUCCESS: 'SUCCESS',
    NETWORK_ERROR: 'NETWORK_ERROR',
};

// Toast types
export const TOAST_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
};

// --------------------------------------------------------------------

class APIError extends Error {
    constructor(message, type, originalError = null) {
        super(message);
        this.name = 'APIError';
        this.type = type;
        this.originalError = originalError;
    }
}

class APIClient {
    constructor() {
        this.baseURL = CONFIG.API_URL;
        this.retryCount = 0;
    }

    async request(endpoint, options = {}) {
        try {
            console.log(`[API] Sending request to ${endpoint}`, options);
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: JSON.stringify({
                    path: endpoint,
                    httpMethod: options.method || 'GET',
                    body: options.body
                })
            });

            const data = await response.json();
            console.log(`[API] Response from ${endpoint}:`, data);

            if (!response.ok) {
                // Check for specific error types
                if (data.error && data.error.includes('DB')) {
                    throw new APIError(ERROR_MESSAGES.DB_CONNECTION, STATUS_CODES.DB_ERROR);
                }
                if (response.status === 401) {
                    throw new APIError(ERROR_MESSAGES.AUTH_FAILED, STATUS_CODES.AUTH_ERROR);
                }
                if (response.status >= 500) {
                    throw new APIError(ERROR_MESSAGES.SERVER_ERROR, STATUS_CODES.API_ERROR);
                }
                throw new APIError(data.error || ERROR_MESSAGES.INVALID_RESPONSE, STATUS_CODES.API_ERROR);
            }

            return data;
        } catch (error) {
            console.error(`[API] Error in ${endpoint}:`, error);
            
            if (error instanceof APIError) {
                throw error;
            }

            if (error.name === 'TypeError' || error.name === 'NetworkError') {
                throw new APIError(ERROR_MESSAGES.NETWORK_ERROR, STATUS_CODES.NETWORK_ERROR, error);
            }

            throw new APIError(ERROR_MESSAGES.API_CONNECTION, STATUS_CODES.API_ERROR, error);
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request(ENDPOINTS.LOGIN, {
            method: 'POST',
            body: { username, password }
        });
    }

    async getUserStatus() {
        return this.request(ENDPOINTS.STATUS, {
            method: 'GET'
        });
    }

    async startLogin(phone) {
        return this.request(ENDPOINTS.START_LOGIN, {
            method: 'POST',
            body: { phone }
        });
    }

    async submitCode(code) {
        return this.request(ENDPOINTS.SUBMIT_CODE, {
            method: 'POST',
            body: { code }
        });
    }

    async submitPassword(password) {
        return this.request(ENDPOINTS.SUBMIT_PASSWORD, {
            method: 'POST',
            body: { password }
        });
    }

    async logout() {
        return this.request(ENDPOINTS.LOGOUT, {
            method: 'POST'
        });
    }
}

export const api = new APIClient(); 