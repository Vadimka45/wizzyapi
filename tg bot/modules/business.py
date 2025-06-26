from aiogram import Router, F
from aiogram.types import Message, BusinessConnection
import html
import json

router = Router()

@router.business_connection()
async def handle_connection(connection: BusinessConnection, message: Message):
    data = message.bot.dispatcher.workflow_data
    connections = data['business_connections']
    user_id = connection.user_chat_id

    if connection.is_enabled:
        connections[str(user_id)] = connection.id
        print(f"✅ Бизнес-подключение {user_id} — {connection.id}")
    else:
        connections.pop(str(user_id), None)
        print(f"❌ Бизнес-отключение {user_id}")

    with open('business_connections.json', 'w', encoding='utf-8') as f:
        json.dump(connections, f, indent=2, ensure_ascii=False)

@router.business_message(F.text.startswith('.'))
async def handle_business_commands(message: Message):
    bot = message.bot
    data = bot.dispatcher.workflow_data
    connections = data['business_connections']
    connection_id = connections.get(str(message.from_user.id))
    if not connection_id:
        print(f"⚠️ Нет business_connection_id для пользователя {message.from_user.id}")
        return

    cmd = message.text.strip().lower()
    text = ""

    if cmd == ".help":
        text = (
            "☺️ <b>Команды:</b>\n"
            "<code>.info</code> — Метаданные аккаунта\n"
            "<code>.help</code> — Это сообщение"
        )
    elif cmd == ".info":
        user = message.reply_to_message.from_user if message.reply_to_message else message.from_user
        text = (
            f"<b>👤 ID:</b> <code>{user.id}</code>\n"
            f"<b>✈️ Username:</b> @{user.username or 'none'}\n"
            f"<b>👁 Имя:</b> {html.escape(user.full_name)}"
        )

    if text:
        try:
            print(f"[.info] Попытка редактирования: connection_id={connection_id}, chat_id={message.chat.id}, message_id={message.message_id}")
            await bot.edit_message_text(
                text=text,
                business_connection_id=str(connection_id),
                chat_id=message.chat.id,
                message_id=message.message_id,
                parse_mode="HTML"
            )
        except Exception as e:
            print(f"❌ Ошибка отправки: {e}")
            print(f"[.info] Параметры: connection_id={connection_id}, chat_id={message.chat.id}, message_id={message.message_id}")
            # Отправляем владельцу в ЛС причину ошибки и инфу
            owner_id = data.get('owner_id')
            await bot.send_message(owner_id, f"[.info] Ошибка: {e}\nПараметры: connection_id={connection_id}, chat_id={message.chat.id}, message_id={message.message_id}\nТекст: {text}", parse_mode="HTML")