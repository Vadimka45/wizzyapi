from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from config import LOGIN_PASSWORD

router = Router()

@router.message(Command('start'))
async def start_cmd(message: Message, authorized_users: set):
    if message.from_user.id in authorized_users:
        await message.answer("<b>Вы уже авторизованы!</b>\nИспользуйте <code>/info</code> для получения ID.", parse_mode="HTML")
        return
    
    username = message.from_user.username or message.from_user.first_name or "пользователь"
    text = (
        f"👋 Привет, <i>{username}</i>!\n\n"
        f"❌ Ты неавторизованный пользователь.\n\n"
        f"🗝️ Отправь мне <b>секретный пароль</b>, чтобы начать работу."
    )
    await message.answer(text, parse_mode="HTML")

@router.message()
async def handle_password(message: Message, authorized_users: set, save_func: callable):
    if message.from_user.id in authorized_users:
        return

    if message.text == LOGIN_PASSWORD:
        authorized_users.add(message.from_user.id)
        save_func()
        await message.answer("<b>✅ Успешная авторизация!</b>\nТеперь доступны команды бота.", parse_mode="HTML")
    else:
        await message.answer("<b>❌ Неверный пароль! Попробуй ещё раз.</b>", parse_mode="HTML") 