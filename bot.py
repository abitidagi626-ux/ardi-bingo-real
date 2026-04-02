import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# ያንተ ቦት ቶከን
TOKEN = "8684712579:AAE9JK0cdSK-cVeycf7xAd_KSrUUqmN5HWI"

# 1. ቦቱ ሲጀምር ስልክ ቁጥር መጠየቂያ
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    
    await update.message.reply_text(
        "🎉 እንኳን ወደ አርዲ ቢንጎ በሰላም መጡ! 🎉\n\nለመመዝገብ እና መጫወት ለመጀመር እባክዎ ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# 2. ስልኩ ሲላክ የሚመጣው ሙሉ ሜኑ
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    game_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    # በምስሉ ላይ ያየናቸው ሁሉንም ቁልፎች እዚህ አሉ
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
            InlineKeyboardButton("👤 Change Username", callback_data="username"),
            InlineKeyboardButton("🏆 Leaderboard", callback_data="leaderboard")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🕹 Every Square Counts – Grab Your Cartela, Join the Game, and Let the Fun Begin!",
        reply_markup=reply_markup
    )
    # ትልቁን ቁልፍ ማጥፊያ
    await update.message.reply_text("መልካም ዕድል! 🎰", reply_markup=ReplyKeyboardRemove())

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    
    print("ቦቱ በ VS Code ስራ ጀምሯል...")
    app.run_polling()

if __name__ == '__main__':
    main()
