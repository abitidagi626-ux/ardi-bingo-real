import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ያንተ ቦት ቶከን
TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"

# 1. /start ሲባል ስልክ ቁጥር መጠየቂያ
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ሰማያዊው "Share Contact" ቁልፍ
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup(
        [[contact_button]], 
        resize_keyboard=True, 
        one_time_keyboard=False
    )
    
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እና መጫወት ለመጀመር እባክዎ ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# 2. ስልኩ ሲላክ የሚመጣው ምላሽ እና የጌም ሊንክ
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    # ያንተ የጌም ሊንክ
    game_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    # የጌም መክፈቻ ቁልፍ (Inline Button)
    keyboard = [
        [InlineKeyboardButton("🕹 አሁን መጫወት ይጀምሩ (Play Now)", url=game_url)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # የምዝገባ ማረጋገጫ መልዕክት
    await update.message.reply_text(
        f"✅ በትክክል ተመዝግበዋል!\n🆔 የእርስዎ ID: {user_id}\n\nለመጫወት ከታች ያለውን 'Play Now' የሚለውን ቁልፍ ይጫኑ።",
        reply_markup=reply_markup
    )
    
    # ስልክ ቁጥር መጠየቂያውን ቁልፍ ከስክሪኑ ላይ ማጥፊያ
    await update.message.reply_text("መልካም ዕድል! 🎰", reply_markup=ReplyKeyboardRemove())

def main():
    # ቦቱን ማስነሳት
    app = Application.builder().token(TOKEN).build()
    
    # ትዕዛዞችን ማገናኘት
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    
    print("🚀 Ardi Bingo ቦት በ VS Code ስራ ጀምሯል...")
    app.run_polling()

if __name__ == '__main__':
    main()
