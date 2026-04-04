import logging
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# --- ቅንብሮች (Settings) ---
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"
ADMIN_ID = 1046142540  # የአድሚን ID
BALANCE_FILE = "balances.json"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- የባላንስ ፋይል አያያዝ (Data Handling) ---
def load_balances():
    if os.path.exists(BALANCE_FILE):
        try:
            with open(BALANCE_FILE, "r") as f:
                return json.load(f)
        except: return {}
    return {}

def save_balances(balances):
    try:
        with open(BALANCE_FILE, "w") as f:
            json.dump(balances, f, indent=4)
    except Exception as e:
        logging.error(f"Error saving balance: {e}")

def get_user_balance(user_id):
    balances = load_balances()
    return float(balances.get(str(user_id), 0.0))

def update_user_balance(user_id, amount):
    balances = load_balances()
    u_id = str(user_id)
    balances[u_id] = balances.get(u_id, 0) + float(amount)
    save_balances(balances)

# --- 1. /start ትዕዛዝ ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    balance = get_user_balance(user.id)
    
    # Web App URL ከባላንስ ጋር (Wallet እንዲስተካከል)
    web_app_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance={balance}"
    
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url=web_app_url))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url=web_app_url + "#deposit-methods"))],
        [KeyboardButton("👨‍💻 Support")]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    
    await update.message.reply_text(
        f"እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\n👤 ስም: {user.first_name}\n💵 ባላንስ: {balance} ETB\n\nለመጫወት 'Play Now' የሚለውን ይጫኑ።",
        reply_markup=reply_markup
    )

# --- 2. ከ Web App የሚመጣ የዲፖዚት መረጃ መቀበያ ---
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    
    try:
        data = json.loads(data_raw)
        amount = data.get("amount", "0")
        method = data.get("method", "Unknown")
        ref_msg = data.get("message", "No reference")
    except:
        amount = "0"
        method = "Unknown"
        ref_msg = data_raw

    # ለአድሚን የሚላክ ማረጋገጫ (Approve/Cancel)
    keyboard = [
        [
            InlineKeyboardButton("✅ Approve", callback_data=f"app_{user.id}_{amount}"),
            InlineKeyboardButton("❌ Cancel", callback_data=f"rej_{user.id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    admin_text = (
        f"🔔 *አዲስ የዲፖዚት ጥያቄ*\n\n"
        f"👤 ተጠቃሚ: {user.first_name}\n"
        f"🆔 ID: `{user.id}`\n"
        f"🏦 ባንክ: {method}\n"
        f"💰 መጠን: {amount} ETB\n"
        f"📝 መረጃ: {ref_msg}"
    )

    await context.bot.send_message(chat_id=ADMIN_ID, text=admin_text, reply_markup=reply_markup, parse_mode="Markdown")
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። ሲረጋገጥ መልዕክት ይደርስዎታል።")

# --- 3. የአድሚን ውሳኔ (Callback Query) ---
async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data_parts = query.data.split("_")
    action = data_parts[0]
    user_id = data_parts[1]
    
    if action == "app":
        amount = data_parts[2]
        update_user_balance(user_id, amount)
        new_balance = get_user_balance(user_id)
        
        # ለተጠቃሚው ማሳወቅ
        await context.bot.send_message(
            chat_id=user_id, 
            text=f"🎉 የ {amount} ETB ዲፖዚትዎ ጸድቋል!\n💵 የአሁኑ ባላንስዎ: {new_balance} ETB"
        )
        await query.edit_message_text(text=f"{query.message.text}\n\n✅ ተቀባይነት አግኝቷል (Approved)")
        
    elif action == "rej":
        await context.bot.send_message(chat_id=user_id, text="❌ የዲፖዚት ጥያቄዎ በአድሚን ውድቅ ተደርጓል።")
        await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Rejected)")

# --- 4. የጽሁፍ መልዕክቶች (ባላንስ ቼክ) ---
async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user_id = update.effective_user.id
    
    if text == "💰 Check Balance":
        balance = get_user_balance(user_id)
        await update.message.reply_text(f"💵 የአሁኑ ባላንስዎ: {balance} ETB")
    
    elif text == "👨‍💻 Support":
        await update.message.reply_text("ለማንኛውም ጥያቄ አድሚኑን ያነጋግሩ: @ardibingoadmin")

# --- ዋናው መነሻ (Main) ---
def main():
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(CallbackQueryHandler(admin_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_messages))
    
    print("🚀 Ardi Bingo Bot (Accounting Mode) is running...")
    app.run_polling()

if __name__ == '__main__':
    main()
