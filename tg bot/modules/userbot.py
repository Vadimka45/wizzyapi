import requests

API_URL = 'https://functions.yandexcloud.net/d4ecn5lsohh0pqh88b8d'

def call_api(path, method='GET', data=None):
    try:
        payload = {'path': path, 'httpMethod': method}
        if data:
            payload['body'] = data
        resp = requests.post(API_URL, json=payload, timeout=5)
        return resp.json()
    except Exception as e:
        print(f"API error: {e}")
        return None

def userbot_status():
    return call_api('/userbot/status', 'GET')

def userbot_login(phone):
    return call_api('/userbot/start_login', 'POST', {'phone': phone})

def userbot_submit_code(code):
    return call_api('/userbot/submit_code', 'POST', {'code': code})

def userbot_submit_password(password):
    return call_api('/userbot/submit_password', 'POST', {'password': password})

def userbot_logout():
    return call_api('/userbot/logout', 'POST')

def userbot_send_command(command):
    return call_api('/userbot/console', 'POST', {'command': command})

def userbot_set_status(status, last_updated=None):
    if not status:
        print("Ошибка: статус не передан в userbot_set_status")
        return None
    data = {'status': status}
    if last_updated is not None:
        data['last_updated'] = last_updated
    return call_api('/userbot/set_status', 'POST', data)

def update_userbot_status(status, last_updated):
    """
    Обновляет статус userbot, отправляя статус и время последнего обновления на cloud function.
    """
    return userbot_set_status(status, last_updated)

# Можно добавить другие функции для users, roles, etc через API 