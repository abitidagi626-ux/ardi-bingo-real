const { Telegraf, Markup } = require('telegraf');

// የሰጠኸኝ Token እና Admin ID
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540;

// ቦቱ ሲጀመር
bot.start((ctx) => {
    ctx.reply('እንኳን ወደ አርዲ ቢንጎ (Ardi Bingo) ቦት በሰላም መጡ! ብር ለማስገባት በWebApp በኩል ትዕዛዝ ይላኩ።');
});

/**
 * 1. ከ payment.html (WebApp) የሚላክ ዳታ መቀበያ
 */
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());

        // የዲፖዚት ጥያቄ ከሆነ
        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${data.user_name}\n` +
                             `🆔 ID: \`${data.user_id}\`\n` +
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank}\n` +
                             `📝 መረጃ: \n_${data.transaction}_`;

            // ለአድሚን (ለአንተ) የሚላክ Approve/Reject በተን
            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ (Approve)", `approve_${data.user_id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ (Reject)", `reject_${data.user_id}`)
                ]
            ]);

            // መረጃውን ለአንተ ይልካል
            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            // ለተጫዋቹ የተላከ መሆኑን የሚገልጽ መልዕክት
            ctx.reply("እናመሰግናለን! የዲፖዚት ጥያቄዎ ለAdmin ተልኳል:: ሲረጋገጥ እናሳውቆታለን::");
        }
    } catch (e) {
        console.error("Error parsing WebApp data:", e);
        ctx.reply("የመረጃ ስህተት ተከስቷል:: እባክዎ በድጋሚ ይሞክሩ::");
    }
});

/**
 * 2. አንተ (Admin) Approve ወይም Reject ስትጫን
 */
bot.on('callback_query', async (ctx) => {
    const cbData = ctx.callbackQuery.data;
    const [action, playerId, amount] = cbData.split('_');

    if (action === 'approve') {
        // --- እዚህ ጋር የዳታቤዝ logic መጨመር ትችላለህ ---
        // ለምሳሌ፡ await User.incrementBalance(playerId, amount);

        await ctx.answerCbQuery(`ለተጫዋች ${playerId} ${amount} ብር ጸድቋል`);
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል (Approved)**`);

        // ለተጫዋቹ መልዕክት መላክ
        try {
            await bot.telegram.sendMessage(playerId, `🎉 የ ${amount} ብር ዲፖዚት ጥያቄዎ ተረጋግጦ ባላንስዎ ላይ ተጨምሯል:: መልካም ጨዋታ!`);
        } catch (err) {
            console.log("ተጫዋቹ ቦቱን ስላቆመው መልዕክት መላክ አልተቻለም");
        }

    } else if (action === 'reject') {
        await ctx.answerCbQuery("ጥያቄው ተሰርዟል");
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል (Rejected)**`);

        // ለተጫዋቹ መልዕክት መላክ
        try {
            await bot.telegram.sendMessage(playerId, `❌ ይቅርታ፣ የዲፖዚት ጥያቄዎ በAdmin ውድቅ ተደርጓል:: እባክዎ መረጃውን አረጋግጠው በድጋሚ ይሞክሩ::`);
        } catch (err) {
            console.log("ተጫዋቹ ቦቱን ስላቆመው መልዕክት መላክ አልተቻለም");
        }
    }
});

// ቦቱን ማስነሳት
bot.launch().then(() => {
    console.log("Ardi Bingo Bot is now online...");
});

// ስህተቶች ሲኖሩ ቦቱ እንዳይቆም
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
