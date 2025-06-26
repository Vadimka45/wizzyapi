from aiogram import Router, F, Bot
from aiogram.types import Message, BusinessMessagesDeleted

router = Router()

@router.business_message()
async def log_all_messages(message: Message):
    user = message.from_user
    content = message.text or '[не текст]'
    print(f"📝 {user.full_name} ({user.id}): {content}")

@router.business_message(F.photo | F.video | F.voice | F.video_note)
async def handle_view_once(message: Message):
    if getattr(message, 'has_media_spoiler', False):
        data = message.bot.dispatcher.workflow_data
        cache = data['message_cache']
        connection_id = data['business_connections'].get(str(message.from_user.id))
        cache[f"view_once_{message.message_id}"] = message

        try:
            owner = data['owner_id']
            if message.photo:
                await message.bot.send_photo(owner, message.photo[-1].file_id, caption=f"🔒 Фото от {message.from_user.full_name}")
            elif message.video:
                await message.bot.send_video(owner, message.video.file_id, caption=f"🔒 Видео от {message.from_user.full_name}")
            elif message.voice:
                await message.bot.send_voice(owner, message.voice.file_id, caption=f"🔒 ГС от {message.from_user.full_name}")
            elif message.video_note:
                await message.bot.send_video_note(owner, message.video_note.file_id)
            print("✅ Медиа отправлено владельцу")
        except Exception as e:
            print(f"❌ Ошибка пересылки медиа: {e}")
            
@router.deleted_business_messages()
async def deleted_handler(event: BusinessMessagesDeleted):
    print(f"🗑️ Удалены сообщения: {event.message_ids} в чате {event.chat.id}")
