import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# ያንተ ቦት ቶከን
TOKEN = "8684712579:AAE9JK0cdSK-cVeycf7xAd_KSrUUqmN5HWI"

# 1. /start ሲባል ስልክ ቁጥር መጠየቂያ
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=False)
    
    await update.message.reply_text(
        "እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመመዝገብ እና መጫወት ለመጀመር እባክዎ ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# 2. ስልኩ ሲላክ የሚመጣው ዋና ሜኑ
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    game_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    keyboard = [
        [InlineKeyboardButton("🎮 Play Now", url=game_url)],
        [
            InlineKeyboardButton("💰 Check Balance", callback_data="profile"),
            InlineKeyboardButton("🏦 Make a Deposit", url="https://abitidagi626-ux.github.io/ardi-bingo-real/deposit.html")
        ],
        [
            InlineKeyboardButton("Support 📞", url="https://t.me/ArdiiiBingoBot"),
            InlineKeyboardButton("📕 Instructions", callback_data="instr")
        ],
        [
            InlineKeyboardButton("✉️ Invite", callback_data="invite"),
            InlineKeyboardButton("Win Patterns", callback_data="patterns")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"✅ ተመዝግበዋል!\n🆔 Player ID: {user_id}\n\n🕹 Every Square Counts – Join the Game and Let the Fun Begin!",
        reply_markup=reply_markup
    )
    await update.message.reply_text("መልካም ዕድል! 🎰", reply_markup=ReplyKeyboardRemove())

# 3. ለቁልፎቹ የሚሰጠው ምላሽ (Callback Query)
async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user_id = query.from_user.id
    await query.answer()

    if query.data == "profile":
        # ልክ እንደ Image 1 (በ ID የታጀበ)
        profile_text = f"<code>copy\n\nID:       {user_id}\nBalance:  0.00 ETB\nCoin:     0.00\n</code>"
        await query.message.reply_html(profile_text)

    elif query.data == "patterns":
        # Image 2 (የአሸናፊነት ምስል)
        await query.message.reply_photo(
            photo="https://raw.githubusercontent.com/abitidagi626-ux/ardi-bingo-real/main/image_win.png", # ምስሉን እዚህ ጋር ፑሽ አድርገህ ሊንኩን ቀይረው
            caption="🏆 Win Patterns\n\nእነዚህን መስመሮች በመዝጋት ማሸነፍ ይችላሉ።"
        )

    elif query.data == "instr":
        # የላክኸው ሙሉ መመሪያ
        instr_text = (
            "📝 መመሪያ\n\nእንኳን ወደ Ardi Bingo መጡ!\n\n"
            "1. ለመጫወት register የሚለውን በመንካት ስልክ ቁጥሮትን ያጋሩ\n"
            "2. Menu ውስጥ deposit fund የሚለውን በመንካት ገንዘብ ገቢ ያድርጉ\n"
            "3. Start play የሚለውን በመንካት መወራረድ የሚፈልጉትን የብር መጠን ይምረጡ\n\n"
            "🕹 በጨዋታው ውስጥ፦\n"
            "• 100 ቁጥሮች መርጠው Accept ይበሉ\n"
            "• ሰዓቱ ሲያልቅ ቁጥሮች መውጣት ይጀምራሉ\n"
            "• አንድ መስመር (ወደጎን፣ ወደታች፣ ዲያጎናል) ወይም አራት ጠርዝ ሲሞሉ ቢንጎ ይበሉ\n"
            "⚠️ ማሳሰቢያ፦ ተጫዋች ከ 2 በታች ከሆነ ጨዋታ አይጀምርም።"
        )
        await query.message.reply_text(instr_text)

    elif query.data == "invite":
        # መጋበዣ ሊንክ
        invite_link = f"https://t.me/ArdiiiBingoBot?start={user_id}"
        await query.message.reply_text(f"🎁 የእርስዎ መጋበዣ ሊንክ፦\n\n{invite_link}\n\nይህንን ሊንክ ለጓደኞችዎ በመላክ ቦነስ ያግኙ!")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(CallbackQueryHandler(button_click))
    
    print("Ardi Bingo ቦት በትክክል እየሰራ ነው...")
    app.run_polling()

if __name__ == '__main__':
    main()
