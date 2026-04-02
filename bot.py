import logging
import random
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

TOKEN = "8684712579:AAE9JK0cdSK-cVeycf7xAd_KSrUUqmN5HWI"

# --- 1. START ሲባል ስልክ ብቻ መጠየቅ ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # የድሮ ሜኑዎች ካሉ እንዲጠፉ እና ስልክ ቁጥር መጠየቂያው እንዲመጣ
    contact_button = KeyboardButton("📲 ስልክ ቁጥርዎን ያጋሩ (Share Contact)", request_contact=True)
    
    # resize_keyboard=True ቁልፉ ትንሽና ምቹ እንዲሆን ያደርጋል
    reply_markup = ReplyKeyboardMarkup(
        [[contact_button]], 
        resize_keyboard=True, 
        one_time_keyboard=True
    )
    
    await update.message.reply_text(
        "እንኳን ወደ አርዲ ቢንጎ በሰላም መጡ! 🙏\n\nለመመዝገብ እና መጫወት ለመጀመር እባክዎ ከታች ያለውን ሰማያዊ ቁልፍ ተጭነው 'Share Contact' ያድርጉ።",
        reply_markup=reply_markup
    )

# --- 2. ስልኩ ሲመጣ ብቻ ሜኑውን ማምጣት ---
async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # ስልኩን መቀበል
    contact = update.message.contact
    phone_number = contact.phone_number
    
    # ስልኩ ሲመጣ ያንን ትልቅ የ "Share Contact" ቁልፍ ማጥፋት
    remove_keyboard = ReplyKeyboardRemove()
    
    # ID መፍጠር
    user_id = random.randint(10000, 99999)
    play_url = f"https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?id={user_id}"
    
    # ዝርዝር ሜኑ (Inline Buttons)
    keyboard = [
        [InlineKeyboardButton("🕹 Play Now", url=play_url)],
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
    
    # መጀመሪያ ስልኩን ስለላኩ እናመሰግናለን ማለት
    await update.message.reply_text(f"✅ ምዝገባዎ ተጠናቋል!\n📞 ስልክ፦ {phone_number}\n🆔 መለያ፦ {user_id}", reply_markup=remove_keyboard)
    
    # ከዚያ ሜኑውን መላክ
    await update.message.reply_text("አሁን ከታች ያሉትን አማራጮች ተጠቅመው መጫወት ይችላሉ፦", reply_markup=reply_markup)

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    # ይህ መስመር ስልክ ቁጥር ብቻ ሲላክ እንዲሰራ ያደርገዋል
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    
    print("ቦቱ ዝግጁ ነው...")
    app.run_polling()

if __name__ == '__main__':
    main()
