from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.filters.callback_data import CallbackData
from aiogram import Router, Bot
import asyncio

auth_keyboard_router = Router()

class DigitCallback(CallbackData, prefix="digit"):
    value: str

input_states = {}  # user_id: {digits, future, message_id, prompt, length, is_password, bot, connection_id}

@auth_keyboard_router.callback_query(DigitCallback.filter())
async def digit_handler(query: CallbackQuery, callback_data: DigitCallback):
    state = input_states.get(query.from_user.id)
    if not state:
        await query.answer("Нет активного ввода!", show_alert=True)
        return
    digits = state['digits']
    bot = state['bot']
    message_id = state['message_id']
    prompt = state['prompt']
    length = state['length']
    is_password = state['is_password']
    future = state['future']
    connection_id = state.get('connection_id')
    edit_kwargs = {}
    if connection_id is not None:
        if not isinstance(connection_id, str):
            connection_id = str(connection_id)
        edit_kwargs['business_connection_id'] = connection_id
    # Жёсткий cast для edit_kwargs
    if 'business_connection_id' in edit_kwargs and not isinstance(edit_kwargs['business_connection_id'], str):
        edit_kwargs['business_connection_id'] = str(edit_kwargs['business_connection_id'])
    if callback_data.value == "del":
        if digits:
            digits.pop()
    elif callback_data.value == "ok":
        if len(digits) == length:
            await query.answer("Отправлено!", show_alert=False)
            await bot.edit_message_text("Ввод завершён.", query.from_user.id, message_id, **edit_kwargs)
            if not future.done():
                future.set_result("".join(digits))
            input_states.pop(query.from_user.id, None)
            return
        else:
            await query.answer("Не хватает символов!", show_alert=True)
    else:
        if len(digits) < length:
            digits.append(callback_data.value)
    await bot.edit_message_text(get_text(prompt, digits, length, is_password), query.from_user.id, message_id, reply_markup=get_keyboard(digits, length), **edit_kwargs)
    await query.answer()

async def ask_digits(bot: Bot, user_id: int, prompt: str, length: int = 6, is_password: bool = False, connection_id=None):
    digits = []
    if connection_id is not None and not isinstance(connection_id, str):
        connection_id = str(connection_id)
    send_kwargs = {}
    if connection_id is not None:
        send_kwargs['business_connection_id'] = connection_id
    # Очищаю состояние перед новым вводом
    if user_id in input_states:
        input_states.pop(user_id)
    message = await bot.send_message(user_id, get_text(prompt, digits, length, is_password), reply_markup=get_keyboard(digits, length), **send_kwargs)
    future = asyncio.get_event_loop().create_future()
    input_states[user_id] = {
        'digits': digits,
        'future': future,
        'message_id': message.message_id,
        'prompt': prompt,
        'length': length,
        'is_password': is_password,
        'bot': bot,
        'connection_id': connection_id
    }
    return await future

def get_text(prompt, digits, length, is_password):
    if is_password:
        display = ["*" if i < len(digits) else "_" for i in range(length)]
    else:
        display = [d if i < len(digits) else "_" for i, d in enumerate([*digits]+["_"]*length)][:length]
    return f"{prompt}\n[ {' '.join(display)} ]"

def get_keyboard(digits, length):
    buttons = []
    row = []
    for i in range(1, 10):
        row.append(InlineKeyboardButton(text=str(i), callback_data=f"digit:{i}"))
        if i % 3 == 0:
            buttons.append(row)
            row = []
    row = [InlineKeyboardButton(text="Удалить", callback_data="digit:del"),
           InlineKeyboardButton(text="0", callback_data="digit:0"),
           InlineKeyboardButton(text="Отправить", callback_data="digit:ok")]
    buttons.append(row)
    return InlineKeyboardMarkup(inline_keyboard=buttons) 