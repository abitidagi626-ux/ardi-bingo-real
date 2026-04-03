import logging
import random
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ⚠️ ቦት ቶከንህን እዚህ ተካ
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"

# ሎጊንግ
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# የዌብሳይት ሊንኮች
BASE_URL = "https://abitidagi626-ux.github.io/ardi-bingo-real/index.html"

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
    
    # 🕹 Play Now እና 💵 Deposit በቀጥታ Web App እንዲከፍቱ ተደርገዋል
    keyboard = [
        [KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url=f"{BASE_URL}#stake-page"))],
        [KeyboardButton("💰 Check Balance"), KeyboardButton("💵 Deposit", web_app=WebAppInfo(url=f"{BASE_URL}#deposit-methods"))],
        [KeyboardButton("👥 Invite"), KeyboardButton("ℹ️ Instruction")],
        [KeyboardButton("🏆 Win Pattern"), KeyboardButton("✍️ Change Username")],
        [KeyboardButton("👨‍💻 Support")]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

    await update.message.reply_text(
        f"✅ ምዝገባዎ ተጠናቋል!\n👤 ስም: {user.first_name}\n🆔 የእርስዎ መለያ ID: {user_random_id}\n\nምን ማድረግ ይፈልጋሉ? ከታች ካሉት አማራጮች ይምረጡ።",
        reply_markup=reply_markup
    )

# 3. ለቀሩት የጽሁፍ ቁልፎች ምላሽ መስጫ
async def handle_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    user_id = update.message.from_user.id

    if text == "💰 Check Balance":
        await update.message.reply_text("💵 የአሁኑ ባላንስዎ፡ 0.00 ETB")

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
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_messages))
    
    print("🚀 Ardi Bingo Bot is running with WebApp features...")
    app.run_polling()

if __name__ == '__main__':
    main()
