import logging
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ቦት ቶከን (ትክክለኛ መሆኑን አረጋግጥ)
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"

# ሎጊንግ (ስህተት ካለ እንዲያሳየን)
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ስልክ ቁጥር መጠየቂያ ቁልፍ
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup(
        [[contact_button]], 
        resize_keyboard=True, 
        one_time_keyboard=True
    )
    
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እባክዎ ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    # ያንተ የጌም ሊንክ (Github Pages)
    game_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    keyboard = [
        [InlineKeyboardButton("🕹 አሁን መጫወት ይጀምሩ (Play Now)", url=game_url)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"✅ በትክክል ተመዝግበዋል!\n🆔 የእርስዎ ID: {user_id}\n\nለመጫወት ከታች ያለውን ቁልፍ ይጫኑ።",
        reply_markup=reply_markup
    )
    # የቆየውን ኪቦርድ ማጥፊያ
    await update.message.reply_text("መልካም ዕድል! 🎰", reply_markup=ReplyKeyboardRemove())

def main():
    # ቦቱን ማስነሳት
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    
    print("🚀 Ardi Bingo ቦት ስራ ጀምሯል...")
    app.run_polling()

if __name__ == '__main__':
    main()
