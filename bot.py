import logging
import random
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# --- CONFIGURATION ---
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI" # @BotFather ላይ አዲስ ቶከን ቀይረህ እዚህ ጋር ተካው
ADMIN_ID = 1046142540
BALANCE_FILE = "balances.json"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- BALANCE FUNCTIONS ---
def load_balances():
    if os.path.exists(BALANCE_FILE):
        with open(BALANCE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_balance(user_id, amount):
    balances = load_balances()
    user_id = str(user_id)
    balances[user_id] = balances.get(user_id, 0) + float(amount)
    with open(BALANCE_FILE, "w") as f:
        json.dump(balances, f)

# --- HANDLERS ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text("እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እባክዎ ስልክ ቁጥርዎን ያጋሩ።", reply_markup=reply_markup)

async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url="https://abitidagi626-ux.github.io/ardi-bingo-real/index.html#stake-page"))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url="https://abitidagi626-ux.github.io/ardi-bingo-real/index.html#deposit-methods"))],
        [KeyboardButton("👥 Invite"), KeyboardButton("ℹ️ Instruction")],
        [KeyboardButton("🏆 Win Pattern"), KeyboardButton("✍️ Change Username")],
        [KeyboardButton("👨‍💻 Support")]
    ]
    await update.message.reply_text(f"✅ ምዝገባዎ ተጠናቋል!\n👤 ስም: {user.first_name}\n🆔 ID: {user.id}", reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True))

# ይህ ክፍል ነው Approve/Cancel ቁልፎችን አድሚን ጋር የሚልከው
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    
    # መጠንን ከዳታው መለየት
    amount = "".join(filter(str.isdigit, data_raw)) or "0"
    
    # የ Inline ቁልፎች (አድሚን ጋር የሚታዩ)
    keyboard = [[
        InlineKeyboardButton("✅ Approve", callback_data=f"app_{user.id}_{amount}"),
        InlineKeyboardButton("❌ Cancel", callback_data=f"rej_{user.id}")
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    admin_msg = f"🔔 *አዲስ የዲፖዚት ጥያቄ*\n\n👤 ተጠቃሚ: {user.first_name}\n🆔 ID: `{user.id}`\n💰 መጠን: {amount} ETB\n📝 መረጃ: {data_raw}"
    
    await context.bot.send_message(chat_id=ADMIN_ID, text=admin_msg, reply_markup=reply_markup, parse_mode="Markdown")
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። እባክዎ እስኪረጋገጥ ይጠብቁ።")

# ቁልፎቹ ሲጫኑ የሚሰራው ክፍል
async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data.split("_")
    action, user_id = data[0], data[1]
    
    if action == "app":
        amount = data[2]
        save_balance(user_id, amount) # ባላንስ ላይ መጨመር
        await context.bot.send_message(chat_id=user_id, text=f"🎉 የ {amount} ETB ዲፖዚት ጥያቄዎ በአድሚን ጸድቋል።")
        await query.edit_message_text(text=f"{query.message.text}\n\n✅ ጸድቋል (Approved)")
    else:
        await context.bot.send_message(chat_id=user_id, text="❌ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።")
        await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Cancelled)")

async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user_id = update.message.from_user.id
    if text == "💰 Check Balance":
        balances = load_balances()
        balance = balances.get(str(user_id), 0.0)
        await update.message.reply_text(f"💵 የአሁኑ ባላንስዎ፡ {balance:.2f} ETB")
    elif text == "ℹ️ Instruction":
        await update.message.reply_text("📖 የጨዋታው ህግጋት...\n(ሙሉውን መመሪያ እዚህ ጋር ይቀጥሉ)")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(CallbackQueryHandler(admin_callback)) # ለቁልፎቹ አስፈላጊ ነው
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_messages))
    print("🚀 Bot is running...")
    app.run_polling()

if __name__ == '__main__':
    main()
