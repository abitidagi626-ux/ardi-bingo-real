import sqlite3
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, CallbackQueryHandler

TOKEN = '8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI'

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect('bingo_users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (user_id INTEGER PRIMARY KEY, first_name TEXT, balance REAL DEFAULT 0.0)''')
    conn.commit()
    conn.close()

# --- START COMMAND ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    conn = sqlite3.connect('bingo_users.db')
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (user_id, first_name) VALUES (?, ?)", (user.id, user.first_name))
    conn.commit()
    conn.close()

    # ያንተ ቋሚ Web App ሊንክ
    web_app_url = "https://dagibingo-0979.loca.lt/index.html" 
    
    keyboard = [
        [InlineKeyboardButton(text="🎮 Play Now", web_app=WebAppInfo(url=web_app_url))],
        [
            InlineKeyboardButton(text="💰 Check Balance", callback_data='balance'),
            InlineKeyboardButton(text="🏦 Make a Deposit", callback_data='deposit_bot')
        ],
        [
            InlineKeyboardButton(text="📞 Support", callback_data='support'),
            InlineKeyboardButton(text="📕 Instructions", callback_data='instructions')
        ],
        [
            InlineKeyboardButton(text="📩 Invite", callback_data='invite'),
            InlineKeyboardButton(text="🏆 Leaderboard", callback_data='leaderboard')
        ],
        [InlineKeyboardButton(text="👤 Change Username", callback_data='settings')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    welcome_text = (
        f"<b>🎉 Welcome To Dagi Bingo, {user.first_name}! 🎉</b>\n\n"
        "🕹 Every Square Counts – Grab Your Cartela, Join the Game, and Let the Fun Begin!"
    )
    await update.message.reply_html(welcome_text, reply_markup=reply_markup)

# --- BUTTON HANDLERS ---
async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    
    if query.data == 'balance':
        conn = sqlite3.connect('bingo_users.db')
        c = conn.cursor()
        c.execute("SELECT balance FROM users WHERE user_id=?", (user_id,))
        bal = c.fetchone()[0]
        conn.close()
        await query.message.reply_text(f"📊 Your Current Balance: {bal} ETB")
    
    elif query.data == 'instructions':
        instr = (
            "📕 <b>How to Play:</b>\n\n"
            "1. Click 'Play Now' to open the game app.\n"
            "2. Deposit money using CBE or Telebirr.\n"
            "3. Once the game starts, numbers will be called.\n"
            "4. Match the numbers on your cartela to win!"
        )
        await query.message.reply_html(instr)

    elif query.data == 'invite':
        link = f"https://t.me/ArdiiiBingoBot?start={user_id}"
        await query.message.reply_text(f"📩 Invite friends and earn a bonus!\n\nYour Referral Link:\n{link}")

    elif query.data == 'deposit_bot':
        await query.message.reply_text("🏦 ብር ለማስገባት 'Play Now' የሚለውን ተጭነው 'Deposit Money' የሚለውን ይምረጡ።")

if __name__ == '__main__':
    init_db()
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_handler))
    print("ቦቱ ከቋሚ ሊንክ ጋር እየሠራ ነው...")
    app.run_polling()
