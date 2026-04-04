import logging
import json
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

TOKEN = "8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI"
BALANCE_FILE = "balances.json"

def load_balances():
    if os.path.exists(BALANCE_FILE):
        with open(BALANCE_FILE, "r") as f: return json.load(f)
    return {}

def get_bal(uid): return load_balances().get(str(uid), 0.0)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    bal = get_bal(uid)
    # የ Web App URL ከባላንስ ጋር
    url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance={bal}"
    
    kb = [[KeyboardButton("🕹 Play Now", web_app=WebAppInfo(url=url))],
          [KeyboardButton("💰 Balance"), KeyboardButton("👨‍💻 Support")]]
    
    await update.message.reply_text(
        f"እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\nባላንስ: {bal} ETB",
        reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True)
    )

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling()

if __name__ == '__main__':
    main()
