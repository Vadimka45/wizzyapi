from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router()

@router.message(Command('info'))
async def info_cmd(message: Message, authorized_users: set):
    if message.from_user.id not in authorized_users:
        await message.answer("<b>Сначала авторизуйтесь через /start.</b>", parse_mode="HTML")
        return
    await message.answer(f"<b>Ваш Telegram ID:</b> <code>{message.from_user.id}</code>", parse_mode="HTML") 