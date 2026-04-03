import logging
import random
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# ⚠️ ቦት ቶከን (አዲሱን ቶከን መጠቀምህን እርግጠኛ ሁን)
TOKEN = "8684712579:AAE9JK0cdSK-cVeycf7xAd_KSrUUqmN5HWI"
# ⚠️ አድሚን ID (ያንተ ID መሆኑን በ userinfobot አረጋግጥ)
ADMIN_ID = 1046142540
BALANCE_FILE = "balances.json"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- የባላንስ መቆጣጠሪያ (balances.json) ---
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
    try:
        balances[u_id] = balances.get(u_id, 0) + float(amount)
        with open(BALANCE_FILE, "w") as f:
            json.dump(balances, f)
    except Exception as e:
        logging.error(f"Error saving balance: {e}")

# 1. /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እና ሙሉ አገልግሎቱን ለማግኘት እባክዎ ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# 2. ስልክ ቁጥር ሲላክ የሚመጣ ሜኑ
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    user_random_id = random.randint(10000, 99999)
    
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url="https://abitidagi626-ux.github.io/ardi-bingo-real/index.html#stake-page"))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url="https://abitidagi626-ux.github.io/ardi-bingo-real/index.html#deposit-methods"))],
        [KeyboardButton("👥 Invite"), KeyboardButton("ℹ️ Instruction")],
        [KeyboardButton("🏆 Win Pattern"), KeyboardButton("✍️ Change Username")],
        [KeyboardButton("👨‍💻 Support")]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

    await update.message.reply_text(
        f"✅ ምዝገባዎ ተጠናቋል!\n👤 ስም: {user.first_name}\n🆔 የእርስዎ መለያ ID: {user_random_id}\n\nምን ማድረግ ይፈልጋሉ?",
        reply_markup=reply_markup
    )

# 3. WebApp ዳታ ሲልክ (Deposit Verification) - ቁልፎቹ እዚህ ጋር ተስተካክለዋል
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    
    # ከዳታው ውስጥ ቁጥሩን (Amount) መለየት
    amount = "".join(filter(str.isdigit, data_raw)) or "0"

    # አድሚን ላይ የሚመጡ Approve/Cancel ቁልፎች
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

    # ለአድሚኑ መላክ (የ Approve/Cancel ቁልፎች አብረው ይሄዳሉ)
    await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=admin_msg,
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። እባክዎ እስኪረጋገጥ ይጠብቁ።")

# 4. የአድሚን ውሳኔ ማስተናገጃ (Callback Query)
async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data_parts = query.data.split("_")
    action = data_parts[0]
    user_id = data_parts[1]
    
    if action == "app":
        amount = data_parts[2]
        save_balance(user_id, amount)
        try:
            await context.bot.send_message(chat_id=user_id, text=f"🎉 የ {amount} ETB ዲፖዚት ጥያቄዎ በአድሚን ጸድቋል! ባላንስዎ ላይ ተጨምሯል።")
            await query.edit_message_text(text=f"{query.message.text}\n\n✅ ጸድቋል (Approved)")
        except Exception as e:
            logging.error(f"Error notifying user: {e}")
    elif action == "rej":
        try:
            await context.bot.send_message(chat_id=user_id, text="❌ ይቅርታ፣ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።")
            await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Cancelled)")
        except Exception as e:
            logging.error(f"Error notifying user: {e}")

# 5. ለቀሩት የጽሁፍ ቁልፎች ምላሽ
async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user_id = update.message.from_user.id

    if text == "💰 Check Balance":
        balances = load_balances()
        current_balance = balances.get(str(user_id), 0.0)
        await update.message.reply_text(f"💵 የአሁኑ ባላንስዎ፡ {current_balance:.2f} ETB")
    elif text == "👨‍💻 Support":
        await update.message.reply_text("የቴክኒክ ችግር ካጋጠመዎት አድሚኑን ያነጋግሩ፡ @ardibingobot")
    else:
        await update.message.reply_text("እባክዎ ከታች ካሉት አማራጮች አንዱን ይምረጡ።")

# ዋና ፋንክሽን
def main():
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(CallbackQueryHandler(admin_callback)) # ለአድሚን ውሳኔ
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_messages))
    
    print("🚀 Ardi Bingo Bot is running correctly...")
    app.run_polling()

if __name__ == '__main__':
    main()
