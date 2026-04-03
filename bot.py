import logging
import random
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# --- CONFIGURATION ---
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"
ADMIN_ID = 1046142540
BASE_URL = "https://abitidagi626-ux.github.io/ardi-bingo-real/index.html"
STAKE_PAGE_URL = f"{BASE_URL}#stake-page"
DEPOSIT_PAGE_URL = f"{BASE_URL}#deposit-methods"
BALANCE_FILE = "balances.json"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- BALANCE MANAGEMENT ---
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

def get_user_balance(user_id):
    balances = load_balances()
    return balances.get(str(user_id), 0.0)

# --- HANDLERS ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እና ሙሉ አገልግሎቱን ለማግኘት እባክዎ ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    user_random_id = random.randint(10000, 99999)
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url=STAKE_PAGE_URL))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url=DEPOSIT_PAGE_URL))],
        [KeyboardButton("👥 Invite"), KeyboardButton("ℹ️ Instruction")],
        [KeyboardButton("🏆 Win Pattern"), KeyboardButton("✍️ Change Username")],
        [KeyboardButton("👨‍💻 Support")]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    await update.message.reply_text(
        f"✅ ምዝገባዎ ተጠናቋል!\n👤 ስም: {user.first_name}\n🆔 የእርስዎ መለያ ID: {user_random_id}\n\nምን ማድረግ ይፈልጋሉ? ከታች ካሉት አማራጮች ይምረጡ።",
        reply_markup=reply_markup
    )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    
    # ዳታውን ለይቶ ማውጣት (WebApp ላይ Amount እንደሚላክ በማሰብ)
    # ለምሳሌ ዳታው "200" ከሆነ
    amount = "".join(filter(str.isdigit, data_raw)) or "0"
    
    keyboard = [[InlineKeyboardButton("✅ Approve", callback_data=f"app_{user.id}_{amount}"),
                 InlineKeyboardButton("❌ Cancel", callback_data=f"rej_{user.id}")]]
    
    admin_msg = f"🔔 *አዲስ የዲፖዚት ጥያቄ*\n\n👤 ተጠቃሚ: {user.first_name}\n🆔 ID: `{user.id}`\n💰 መጠን: {amount} ETB\n📝 መረጃ: {data_raw}"
    
    await context.bot.send_message(chat_id=ADMIN_ID, text=admin_msg, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። እባክዎ እስኪረጋገጥ ይጠብቁ።")

async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data.split("_")
    action = data[0]
    user_id = data[1]
    
    if action == "app":
        amount = data[2]
        save_balance(user_id, amount)
        await context.bot.send_message(chat_id=user_id, text=f"🎉 እንኳን ደስ አለዎት! የ {amount} ETB ዲፖዚት ጥያቄዎ በአድሚን ጸድቋል። ባላንስዎ ላይ ተጨምሯል።")
        await query.edit_message_text(text=f"{query.message.text}\n\n✅ ጸድቋል (Approved)")
    else:
        await context.bot.send_message(chat_id=user_id, text="❌ ይቅርታ፣ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል። እባክዎ መረጃውን በድጋሚ በትክክል ይላኩ።")
        await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Cancelled)")

async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user_id = update.message.from_user.id

    if text == "💰 Check Balance":
        balance = get_user_balance(user_id)
        await update.message.reply_text(f"💵 የአሁኑ ባላንስዎ፡ {balance:.2f} ETB")

    elif text == "👥 Invite":
        invite_link = f"https://t.me/{(await context.bot.get_me()).username}?start={user_id}"
        await update.message.reply_text(f"ጓደኞችዎን ይጋብዙና ቦነስ ያግኙ!🎁\n\nየእርስዎ መጋበዣ ሊንክ፡\n{invite_link}")

    elif text == "ℹ️ Instruction":
        instruction_text = (
            "📖 የጨዋታው ህግጋት፡\n1. ለመጫወት ወደቦቱ ሲገቡ register የሚለውን በመንካት ስልክ ቁጥሮትን ያጋሩ\n\n"
            "2. menu ውስጥ በመግባት deposit fund የሚለውን በመንካት በሚፈልጉት የባንክ አካውንት ገንዘብ ገቢ ያድርጉ\n\n"
            "3. menu ውስጥ በመግባት start play የሚለውን በመንካት መወራረድ የሚፈልጉበትን የብር መጠን ይምረጡ።\n\n"
            "1. ወደጨዋታው ሲገቡ ከሚመጣሎት 100 የመጫወቻ ቁጥሮች መርጠው accept የሚለውን በመንካት ይቀጥሉ\n\n"
            "2. ጨዋታው ለመጀመር የተሰጠው ጊዜ ሲያልቅ ቁጥሮች መውጣት ይጀምራል\n\n"
            "3. የሚወጡት ቁጥሮች የመረጡት ካርቴላ ላይ መኖሩን እያረጋገጡ ያቅልሙ\n\n"
            "4. ያቀለሙት አንድ መስመር ወይንም አራት ጠርዝ ላይ ሲመጣ ቢንጎ በማለት ማሸነፍ ይችላሉ\n"
            "— አንድ መስመር ማለት፡ አንድ ወደጎን ወይንም ወደታች ወይንም ዲያጎናል ሲዘጉ\n"
            "— አራት ጠርዝ ላይ ሲመጣሎት\n\n"
            "5. እነዚህ ማሸነፊያ ቁጥሮች ሳይመጣሎት bingo የሚለውን ከነኩ ከጨዋታው ይባረራሉ\n\n"
            "⚠️ ማሳሰቢያ፡\n1. የጨዋታ ማስጀመሪያ ሰከንድ (countdown) ሲያልቅ ያሉት ተጫዋች ብዛት ከ2 በታች ከሆነ ያ ጨዋታ አይጀምርም\n"
            "2. ጨዋታ ከጀመረ በኋላ ካርቴላ መምረጫ ቦርዱ ይጸዳል\n3. እርሶ በዘጉበት ቁጥር ሌላ ተጫዋች ዘግቶ ቀድሞ bingo ካለ አሸናፊነትዎን ያጣሉ"
        )
        await update.message.reply_text(instruction_text)

    elif text == "🏆 Win Pattern":
        await update.message.reply_text("🏆 የማሸነፊያ መንገዶች (Patterns):\n- አግድም (Horizontal)\n- ቁልቁል (Vertical)\n- አያያዝ (Diagonal)\n- አራቱም ማዕዘን (4 Corners)")

    elif text == "✍️ Change Username":
        await update.message.reply_text("ስምዎን ለመቀየር በዌብ አፑ Profile ሴቲንግ ውስጥ መቀየር ይችላሉ።")

    elif text == "👨‍💻 Support":
        await update.message.reply_text("የቴክኒክ ችግር ካጋጠመዎት አድሚኑን ያነጋግሩ፡ @ardibingobot")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(CallbackQueryHandler(admin_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_messages))
    print("🚀 Ardi Bingo Bot with Balance System is running...")
    app.run_polling()

if __name__ == '__main__':
    main()
