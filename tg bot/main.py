import asyncio
from aiogram import Bot, Dispatcher, types, F
from config import BOT_TOKEN
import requests
import datetime

API_URL = 'https://functions.yandexcloud.net/d4ebcfj6jrf3aopicn2c'
OWNER_ID = 7665103659
bot = None

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

def send_userbot_status(status, message=None, phone=None, session_alive=False):
    data = {
        'status': status,
        'message': message or '',
        'session_alive': session_alive,
        'phone': phone,
        'last_updated': datetime.datetime.now().isoformat()
    }
    print(f"DEBUG: Data для /userbot/set_status: {data}")
    if not data or 'status' not in data or not data['status']:
        print("Ошибка: не передан статус в data для /userbot/set_status")
    else:
        try:
            resp = call_api('/userbot/set_status', 'POST', data)
            print(f"[API] send_userbot_status: {resp}")
        except Exception as e:
            print(f"Failed to send userbot status: {e}")

async def start_aiogram():
    global bot
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    bot.dispatcher = dp

    @dp.message(F.from_user.id == OWNER_ID)
    async def owner_handler(message: types.Message):
        if message.text == '/status':
            status = call_api('/userbot/status', 'GET')
            if status:
                status_map = {
                    'disconnected': 'Userbot отключен',
                    'awaiting_phone': 'Ожидание номера телефона',
                    'awaiting_code': 'Ожидание кода',
                    'awaiting_password': 'Ожидание пароля',
                    'authorized': 'Userbot авторизован',
                    'connecting': 'Userbot подключается',
                    'error': 'Ошибка userbot',
                }
                text = status_map.get(status.get('status'), status.get('message', 'Неизвестный статус'))
                await message.answer(f"{text}")
            else:
                await message.answer("Ошибка получения статуса userbot")
        elif message.text == '/help':
            await message.answer("/status — статус userbot\n/help — помощь\n\nВход в userbot теперь только через сайт!")
        else:
            await message.answer("Неизвестная команда. Используй /help")

    print("Бот запущен! Только мониторинг статуса userbot через /status.")
    send_userbot_status('awaiting_phone', 'Ожидание номера телефона для входа', phone=None, session_alive=False)
    await bot.delete_webhook(drop_pending_updates=True)
    try:
        await dp.start_polling(bot)
    finally:
        send_userbot_status('disconnected', 'Userbot отключен', phone=None, session_alive=False)

async def main():
    await start_aiogram()

if __name__ == '__main__':
    asyncio.run(main())