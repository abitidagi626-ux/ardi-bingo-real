require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs'); // ፋይል ለመጻፍ የሚያገለግል node module

const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 

// 1. ቦቱ ሲጀመር
bot.start((ctx) => {
    ctx.reply(`እንኳን ወደ Ardi Bingo በሰላም መጡ!`, 
        Markup.keyboard([[Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]]).oneTime().resize()
    );
});

bot.on('contact', (ctx) => {
    ctx.reply(`🕹 Welcome To Ardi Bingo!`, 
        Markup.inlineKeyboard([
            [Markup.button.webApp('🎮 Play Now', 'https://abitidagi626-ux.github.io/ardi-bingo-real/')]
        ])
    );
});

// 2. ከ WebApp የሚመጣ መረጃ መቀበያ እና VS Code ውስጥ ሴቭ ማድረጊያ
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());

        if (data.type === 'deposit_request') {
            const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' });
            
            // VS Code ውስጥ የሚቀመጠው የመረጃ ቅርጽ
            const logEntry = `
[${time}]
👤 ተጫዋች: ${data.user_name}
🆔 ID: ${data.user_id}
💰 መጠን: ${data.amount} ETB
🏦 ባንክ: ${data.bank}
📝 ትራንዛክሽን: ${data.transaction}
------------------------------------`;

            // 1. VS Code ውስጥ 'deposits.txt' በሚባል ፋይል ውስጥ ያስቀምጠዋል
            fs.appendFileSync('deposits.txt', logEntry);
            
            // 2. በ VS Code Terminal (Output) ላይ እንዲታይ ያደርጋል
            console.log("✅ አዲስ የዲፖዚት መረጃ ተመዝግቧል:", logEntry);

            // 3. ለአድሚን በቴሌግራም መላክ
            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ (Approve)", `app_${data.user_id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ (Cancel)", `can_${data.user_id}`)
                ]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, `🔔 **አዲስ የዲፖዚት ጥያቄ መጥቷል!**\n${logEntry}`, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            ctx.reply("እናመሰግናለን! ጥያቄዎ ለAdmin ተልኳል::");
        }
    } catch (e) {
        console.error("Error Saving Data:", e);
    }
});

// --- አድሚን ሲያጸድቅ ወይም ሲሰርዝ ---
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = ctx.match[2];
    await ctx.answerCbQuery("ክፍያው ጸድቋል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል**`);
    bot.telegram.sendMessage(userId, `🎉 የ ${amount} ብር ዲፖዚትዎ ተረጋግጧል!`);
});

bot.action(/can_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCbQuery("ውድቅ ተደርጓል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል**`);
    bot.telegram.sendMessage(userId, `⚠️ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።`);
});

bot.launch().then(() => console.log("Bot started! Check VS Code for 'deposits.txt' file."));
