import logging
import random
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# 1. ያንተን Token እዚህ ጋር አስገባ
TOKEN = "8684712579:AAE9JK0cdSK-cVeycf7xAd_KSrUUqmN5HWI"

# --- ደረጃ 1: START ሲባል ስልክ ቁጥር መጠየቅ ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ስልክ ቁጥር እንዲያጋሩ የሚጠይቅ ትልቅ ቁልፍ
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    
    reply_markup = ReplyKeyboardMarkup(
        [[contact_button]], 
        resize_keyboard=True, 
        one_time_keyboard=True
    )
    
    await update.message.reply_text(
        "እንኳን ወደ አርዲ ቢንጎ በሰላም መጡ! ለመመዝገብ እባክዎ ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ።",
        reply_markup=reply_markup
    )

# --- ደረጃ 2: ስልኩ ሲላክ ID ሰጥቶ ዝርዝሩን ማምጣት ---
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    phone_number = contact.phone_number
    
    # የዘፈቀደ 5 ዲጂት ID መፍጠር
    user_id = random.randint(10000, 99999)
    
    # የ GitHub ሊንክህ
    play_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    # ልክ እንደ Cartela Bingo ቁልፎቹን መደርደር
    keyboard = [
        [InlineKeyboardButton("🕹 Play Now", url=play_url)], # ትልቁ ቁልፍ
        [
            InlineKeyboardButton("💰 Check Balance", callback_data="bal"),
            InlineKeyboardButton("🏦 Make a Deposit", url="https://abitidagi626-ux.github.io/ardi-bingo-real/deposit.html")
        ],
        [
            InlineKeyboardButton("📞 Support", url="https://t.me/your_support_link"),
            InlineKeyboardButton("📖 Instructions", callback_data="rules")
        ],
        [
            InlineKeyboardButton("📨 Invite", callback_data="invite"),
            InlineKeyboardButton("🏆 Leaderboard", callback_data="lead")
        ]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # ውጤቱን መላክ
    await update.message.reply_text(
        f"✅ በተሳካ ሁኔታ ተመዝግበዋል!\n\n🆔 የእርስዎ ID: {user_id}\n📞 ስልክ: {phone_number}\n\nአሁን ከታች ካሉት አማራጮች አንዱን ይምረጡ፦",
        reply_markup=reply_markup
    )

def main():
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    
    print("ቦቱ ስራ ጀምሯል... (Running)")
    app.run_polling()

if __name__ == '__main__':
    main()
