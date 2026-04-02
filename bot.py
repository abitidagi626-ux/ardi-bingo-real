import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ያንተ ቦት ቶከን
TOKEN = "8684712579:AAE9JK0cdSK-cVeycf7xAd_KSrUUqmN5HWI"

# 1. /start ሲባል የግድ ስልክ ቁጥር እንዲጠይቅ (Contact Share)
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ትልቁ ሰማያዊ ቁልፍ
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    
    # ቁልፉ የግድ እንዲመጣ የሚያደርግ (Persistent Keyboard)
    reply_markup = ReplyKeyboardMarkup(
        [[contact_button]], 
        resize_keyboard=True, 
        one_time_keyboard=False # ተጠቃሚው እስኪልከው ድረስ አይጥፋ
    )
    
    await update.message.reply_text(
        "እንኳን ወደ አርዲ ቢንጎ (Ardi Bingo) በሰላም መጡ! 🎰\n\nለመጫወት መጀመሪያ እባክዎ ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# 2. ስልኩ ሲላክ በስሙ "Ardi Bingo" ብሎ በ ID እንዲመዘግብ
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    user_id = user.id # የቴሌግራም ID (እንደ Player ID ያገለግላል)
    
    # ያንተ የጌም ሊንክ ከ ID ጋር
    game_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    # ሁሉንም 10 ቁልፎች የያዘ ሜኑ
    keyboard = [
        [InlineKeyboardButton("🎮 Play Now", url=game_url)],
        [
            InlineKeyboardButton("💰 Check Balance", url="https://abitidagi626-ux.github.io/ardi-bingo-real/balance.html"),
            InlineKeyboardButton("🏦 Make a Deposit", url="https://abitidagi626-ux.github.io/ardi-bingo-real/deposit.html")
        ],
        [
            InlineKeyboardButton("Support 📞", url="https://t.me/ArdiSupport"),
            InlineKeyboardButton("📕 Instructions", url="https://abitidagi626-ux.github.io/ardi-bingo-real/rules.html")
        ],
        [
            InlineKeyboardButton("✉️ Invite", callback_data="invite"),
            InlineKeyboardButton("Win Patterns", callback_data="patterns")
        ],
        [
            InlineKeyboardButton("👤 Profile", callback_data="profile"),
            InlineKeyboardButton("🏆 Leaderboard", callback_data="leaderboard")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # ስሙን "Ardi Bingo" በማድረግ ምዝገባውን ማረጋገጥ
    await update.message.reply_text(
        f"✅ እንኳን ደህና መጡ ወደ Ardi Bingo!\n\n👤 ተጫዋች፦ Ardi Bingo\n🆔 መለያ ቁጥር (ID)፦ {user_id}\n\nአሁን መጫወት ይችላሉ፦",
        reply_markup=reply_markup
    )
    
    # የ "Share Contact" ቁልፍን ማጥፊያ
    await update.message.reply_text("መልካም ዕድል! 🎰", reply_markup=ReplyKeyboardRemove())

def main():
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    
    print("Ardi Bingo ቦት ስራ ጀምሯል...")
    app.run_polling()

if __name__ == '__main__':
    main()
