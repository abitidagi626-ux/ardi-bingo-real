import logging
import random
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# ⚠️ ቦት ቶከን (አዲሱን ቶከን መጠቀምህን እርግጠኛ ሁን)
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"
# ⚠️ አድሚን ID
ADMIN_ID = 1046142540
BALANCE_FILE = "balances.json"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- የባላንስ መቆጣጠሪያ ---
def load_balances():
    if os.path.exists(BALANCE_FILE):
        try:
            with open(BALANCE_FILE, "r") as f:
                return json.load(f)
        except: return {}
    return {}

def save_balance(user_id, amount):
    balances = load_balances()
    u_id = str(user_id)
    balances[u_id] = balances.get(u_id, 0) + float(amount)
    with open(BALANCE_FILE, "w") as f:
        json.dump(balances, f)

# 1. /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text("እንኳን ወደ Ardi Bingo መጡ! 🎰\n\nለመመዝገብ እባክዎ ስልክ ቁጥርዎን ያጋሩ።", reply_markup=reply_markup)

# 2. handle_contact
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url="https://abitidagi626-ux.github.io/ardi-bingo-real/index.html#stake-page"))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url="https://abitidagi626-ux.github.io/ardi-bingo-real/index.html#deposit-methods"))]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    await update.message.reply_text(f"✅ ምዝገባዎ ተጠናቋል!\n👤 ስም: {user.first_name}", reply_markup=reply_markup)

# 3. WebApp Data Handler - እዚህ ጋር ነው ቁልፎቹን የሚያወጣው
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    amount = "".join(filter(str.isdigit, data_raw)) or "0"

    # አድሚን ላይ የሚመጡ የማጽደቂያ ቁልፎች
    keyboard = [
        [
            InlineKeyboardButton("✅ Approve", callback_data=f"app_{user.id}_{amount}"),
            InlineKeyboardButton("❌ Cancel", callback_data=f"rej_{user.id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    admin_msg = (
        f"🔔 *አዲስ የዲፖዚት ጥያቄ*\n\n"
        f"👤 ተጠቃሚ: {user.first_name}\n"
        f"🆔 ID: `{user.id}`\n"
        f"💰 መጠን: {amount} ETB\n"
        f"📝 መረጃ: {data_raw}"
    )

    # ለአድሚኑ መላክ
    await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=admin_msg,
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል።")

# 4. የአድሚን ውሳኔ ማስተናገጃ
async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data_parts = query.data.split("_")
    action, user_id = data_parts[0], data_parts[1]
    
    if action == "app":
        amount = data_parts[2]
        save_balance(user_id, amount)
        await context.bot.send_message(chat_id=user_id, text=f"🎉 የ {amount} ETB ዲፖዚትዎ ጸድቋል!")
        await query.edit_message_text(text=f"{query.message.text}\n\n✅ ጸድቋል (Approved)")
    elif action == "rej":
        await context.bot.send_message(chat_id=user_id, text="❌ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።")
        await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Cancelled)")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(CallbackQueryHandler(admin_callback))
    
    print("🚀 Ardi Bingo Bot is running...")
    app.run_polling()

if __name__ == '__main__':
    main()
