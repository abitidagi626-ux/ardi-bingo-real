import logging
import random
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# ⚠️ 1. ቦት ቶከን
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"

# ⚠️ 2. አድሚን ID
ADMIN_ID = 1046142540

BALANCE_FILE = "balances.json"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- የባላንስ መቆጣጠሪያ (Save/Load) ---
def load_balances():
    if os.path.exists(BALANCE_FILE):
        try:
            with open(BALANCE_FILE, "r") as f:
                return json.load(f)
        except: return {}
    return {}

def get_user_balance(user_id):
    balances = load_balances()
    return float(balances.get(str(user_id), 0.0))

def save_balance(user_id, amount):
    balances = load_balances()
    u_id = str(user_id)
    try:
        balances[u_id] = balances.get(u_id, 0) + float(amount)
        with open(BALANCE_FILE, "w") as f:
            json.dump(balances, f)
    except Exception as e:
        logging.error(f"Error saving balance: {e}")

# --- 1. /start ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እባክዎ ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# --- 2. ስልክ ቁጥር ሲላክ (ባላንስን ወደ Web App ለመላክ ተስተካክሏል) ---
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    balance = get_user_balance(user.id)
    
    # ባላንሱን በ URL parameters በኩል እናልፋለን
    play_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance={balance}#stake-page"
    dep_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance={balance}#deposit-methods"
    
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url=play_url))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url=dep_url))],
        [KeyboardButton("👨‍💻 Support")]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    await update.message.reply_text(
        f"✅ ምዝገባዎ ተጠናቋል!\n👤 ስም: {user.first_name}\n🆔 ID: {user.id}\n💵 ባላንስ: {balance} ETB",
        reply_markup=reply_markup
    )

# --- 3. የዲፖዚት ጥያቄ መቀበያ ---
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    
    try:
        data = json.loads(data_raw)
        amount = data.get("amount", "0")
        msg = data.get("message", "No message")
        method = data.get("method", "Unknown")
    except:
        amount = "".join(filter(str.isdigit, data_raw)) or "0"
        msg = data_raw
        method = "Unknown"

    keyboard = [[InlineKeyboardButton("✅ Approve", callback_data=f"app_{user.id}_{amount}"),
                 InlineKeyboardButton("❌ Cancel", callback_data=f"rej_{user.id}")]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    admin_msg = (f"🔔 *አዲስ የዲፖዚት ጥያቄ*\n\n👤 ተጠቃሚ: {user.first_name}\n🏦 ባንክ: {method}\n"
                 f"💰 መጠን: {amount} ETB\n📝 መረጃ: {msg}\n🆔 User ID: `{user.id}`")

    await context.bot.send_message(chat_id=ADMIN_ID, text=admin_msg, reply_markup=reply_markup, parse_mode="Markdown")
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። እባክዎ እስኪረጋገጥ ይጠብቁ።")

# --- 4. አድሚኑ ቁልፉን ሲጫን ---
async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data_parts = query.data.split("_")
    action, user_id = data_parts[0], data_parts[1]
    
    if action == "app":
        amount = data_parts[2]
        save_balance(user_id, amount)
        await context.bot.send_message(chat_id=user_id, text=f"🎉 የ {amount} ETB ዲፖዚትዎ በአድሚን ጸድቋል!")
        await query.edit_message_text(text=f"{query.message.text}\n\n✅ ጸድቋል (Approved)")
    elif action == "rej":
        await context.bot.send_message(chat_id=user_id, text="❌ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።")
        await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Cancelled)")

# --- 5. ባላንስ ቼክ ማድረግ ---
async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    if update.message.text == "💰 Check Balance":
        balance = get_user_balance(user_id)
        
        # ባላንስ ቼክ ሲያደርግም የዌብ አፑን ሊንኮች በባላንስ እናድሳለን
        play_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance={balance}#stake-page"
        dep_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance={balance}#deposit-methods"
        
        keyboard = [
            [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url=play_url))],
            [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url=dep_url))],
            [KeyboardButton("👨‍💻 Support")]
        ]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        await update.message.reply_text(f"💵 የአሁኑ ባላንስዎ፡ {balance} ETB", reply_markup=reply_markup)

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(CallbackQueryHandler(admin_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_messages))
    print("🚀 Ardi Bingo Bot is running...")
    app.run_polling()

if __name__ == '__main__':
    main()
