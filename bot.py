import logging
import random
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# ⚠️ ቦት ቶከንህን እዚህ ተካ
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"
# ⚠️ አድሚን ID
ADMIN_ID = 1046142540
BALANCE_FILE = "balances.json"

# ሎጊንግ
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# የዌብሳይት ሊንኮች
BASE_URL = "https://abitidagi626-ux.github.io/ardi-bingo-real/index.html"
STAKE_PAGE_URL = f"{BASE_URL}#stake-page"
DEPOSIT_PAGE_URL = f"{BASE_URL}#deposit-methods"

# --- የባላንስ መቆጣጠሪያ (መረጃው እንዲቀመጥ) ---
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
    # የቆየ ባላንስ ካለ እሱ ላይ ይደምራል
    balances[u_id] = balances.get(u_id, 0) + float(amount)
    with open(BALANCE_FILE, "w") as f:
        json.dump(balances, f)

# 1. /start ሲባል የሚመጣ መጀመሪያ
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እና ሙሉ አገልግሎቱን ለማግኘት እባክዎ ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# 2. ስልክ ሲላክ የሚመጣ ዋና ሜኑ (Main Menu)
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

# 3. WebApp ዳታ ሲልክ (Deposit Verification)
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user

    # ከጽሁፉ ውስጥ የብር መጠኑን ብቻ መለየት
    amount = "".join(filter(str.isdigit, data_raw)) or "0"

    # አድሚን ላይ የሚመጡ የማጽደቂያ ቁልፎች (Inline Buttons)
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

    # ለአድሚኑ ከቁልፎቹ ጋር መላክ
    await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=admin_msg,
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

    # ለተጠቃሚው ማረጋገጫ መስጠት
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። እባክዎ እስኪረጋገጥ ይጠብቁ።")

# 4. የአድሚን ውሳኔ ማስተናገጃ (Approve/Cancel ሲጫን)
async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data_parts = query.data.split("_")
    action = data_parts[0]
    user_id = data_parts[1]
    
    if action == "app":
        amount = data_parts[2]
        save_balance(user_id, amount) # ባላንስ ፋይል ላይ መመዝገብ
        try:
            await context.bot.send_message(chat_id=user_id, text=f"🎉 እንኳን ደስ አለዎት! የ {amount} ETB ዲፖዚት ጥያቄዎ በአድሚን ጸድቋል። ባላንስዎ ላይ ተጨምሯል።")
            await query.edit_message_text(text=f"{query.message.text}\n\n✅ ተቀባይነት አግኝቷል (Approved)")
        except Exception as e:
            logging.error(f"Error in approve: {e}")
    elif action == "rej":
        try:
            await context.bot.send_message(chat_id=user_id, text="❌ ይቅርታ፣ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል። እባክዎ መረጃውን በድጋሚ በትክክል ይላኩ።")
            await query.edit_message_text(text=f"{query.message.text}\n\n❌ ውድቅ ተደርጓል (Cancelled)")
        except Exception as e:
            logging.error(f"Error in reject: {e}")

# 5. ለቀሩት የጽሁፍ ቁልፎች ምላሽ መስጫ
async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user_id = update.message.from_user.id

    if text == "💰 Check Balance":
        balances = load_balances()
        current_balance = balances.get(str(user_id), 0.0)
        await update.message.reply_text(f"💵 የአሁኑ ባላንስዎ፡ {current_balance:.2f} ETB")

    elif text == "👥 Invite":
        invite_link = f"https://t.me/{(await context.bot.get_me()).username}?start={user_id}"
        await update.message.reply_text(f"ጓደኞችዎን ይጋብዙና ቦነስ ያግኙ!🎁\n\nየእርስዎ መጋበዣ ሊንክ፡\n{invite_link}")

    elif text == "ℹ️ Instruction":
        instruction_text = (
            "📖 የጨዋታው ህግጋት፡\n"
            "1. ለመጫወት ወደቦቱ ሲገቡ register የሚለውን በመንካት ስልክ ቁጥሮትን ያጋሩ\n\n"
            "2. menu ውስጥ በመግባት deposit fund የሚለውን በመንካት በሚፈልጉት የባንክ አካውንት ገንዘብ ገቢ ያድርጉ\n\n"
            "3. menu ውስጥ በመግባት start play የሚለውን በመንካት መወራረድ የሚፈልጉበትን የብር መጠን ይምረጡ።\n\n\n"
            "1. ወደጨዋታው ሲገቡ ከሚመጣሎት 100 የመጫወቻ ቁጥሮች መርጠው accept የሚለውን በመንካት ይቀጥሉ\n\n"
            "2. ጨዋታው ለመጀመር የተሰጠው ጊዜ ሲያልቅ ቁጥሮች መውጣት ይጀምራል\n\n"
            "3. የሚወጡት ቁጥሮች የመረጡት ካርቴላ ላይ መኖሩን እያረጋገጡ ያቅልሙ\n\n"
            "4. ያቀለሙት አንድ መስመር ወይንም አራት ጠርዝ ላይ ሲመጣ ቢንጎ በማለት ማሸነፍ ይችላሉ\n"
            "— አንድ መስመር ማለት፡ አንድ ወደጎን ወይንም ወደታች ወይንም ዲያጎናል ሲዘጉ\n"
            "— አራት ጠርዝ ላይ ሲመጣሎት\n\n"
            "5. እነዚህ ማሸነፊያ ቁጥሮች ሳይመጣሎት bingo የሚለውን ከነኩ ከጨዋታው ይባረራሉ\n\n"
            "⚠️ ማሳሰቢያ፡\n"
            "1. የጨዋታ ማስጀመሪያ ሰከንድ (countdown) ሲያልቅ ያሉት ተጫዋች ብዛት ከ2 በታች ከሆነ ያ ጨዋታ አይጀምርም\n"
            "2. ጨዋታ ከጀመረ በኋላ ካርቴላ መምረጫ ቦርዱ ይጸዳል\n"
            "3. እርሶ በዘጉበት ቁጥር ሌላ ተጫዋች ዘግቶ ቀድሞ bingo ካለ አሸናፊነትዎን ያጣሉ"
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
    
    print("🚀 Ardi Bingo Bot is running with Admin Approval Buttons...")
    app.run_polling()

if __name__ == '__main__':
    main()
