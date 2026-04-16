require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 

bot.start((ctx) => {
    const welcomeText = `እንኳን ወደ Ardi Bingo በሰላም መጡ!\n\nተወዳጅ የቢንጎ ጨዋታ በቤትዎ ሆነው ይጫወቱ።\n\nለመቀጠል እባክዎ ከታች ያለውን "📲 ስልክ ቁጥርዎን ያጋሩ" የሚለውን ይጫኑ።`;
    ctx.reply(welcomeText, 
        Markup.keyboard([[Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]]).oneTime().resize()
    );
});

bot.on('contact', (ctx) => {
    ctx.reply(`✅ በትክክል ተመዝግበዋል!`, Markup.removeKeyboard());
    setTimeout(() => {
        ctx.reply(`🕹 Welcome To Ardi Bingo!`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp('🎮 Play Now', 'https://abitidagi626-ux.github.io/ardi-bingo-real/')], 
                [Markup.button.callback('💰 Balance', 'bal'), Markup.button.callback('💵 Deposit', 'dep')],
                [Markup.button.callback('📞 Support', 'sup')]
            ])
        );
    }, 1000);
});

// ከ WebApp የሚመጣ መረጃ መቀበያ
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${ctx.from.first_name}\n` +
                             `🆔 ID: \`${ctx.from.id}\`\n` +
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank}\n` +
                             `📝 መረጃ: \n${data.transaction}`;

            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ", `app_${ctx.from.id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ", `can_${ctx.from.id}`)
                ]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown', ...adminKeyboard });
            ctx.reply("✅ የዲፖዚት ጥያቄዎ ለAdmin ተልኳል::");
        }
    } catch (e) {
        console.error(e);
    }
});

bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = ctx.match[2];
    await ctx.answerCbQuery("ጸድቋል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል**`);
    bot.telegram.sendMessage(userId, `🎉 የ ${amount} ብር ዲፖዚት ተረጋግጧል።`).catch(e => console.log(e));
});

bot.action(/can_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCbQuery("ተሰርዟል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ተሰርዟል**`);
    bot.telegram.sendMessage(userId, `⚠️ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።`).catch(e => console.log(e));
});

bot.launch();
