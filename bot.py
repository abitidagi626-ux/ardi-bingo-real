async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data_raw = update.message.web_app_data.data
    user = update.effective_user
    amount = "".join(filter(str.isdigit, data_raw)) or "0"

    # አድሚኑ ጋር የሚመጡ ቁልፎች
    keyboard = [
        [
            InlineKeyboardButton("✅ Approve", callback_data=f"app_{user.id}_{amount}"),
            InlineKeyboardButton("❌ Cancel", callback_data=f"rej_{user.id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # ለአድሚኑ መላክ (ቁልፎቹ እዚህ ጋር ተያይዘዋል)
    await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=f"🔔 አዲስ የዲፖዚት ጥያቄ!\n👤 ተጠቃሚ: {user.first_name}\n💰 መጠን: {amount} ETB\n🆔 ID: {user.id}",
        reply_markup=reply_markup
    )
    await update.message.reply_text("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል።")
