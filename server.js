require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// የቦት Token
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');

// የአድሚን ID
const ADMIN_ID = 1046142540; 

// 1. ቦቱ ሲጀመር
bot.start((ctx) => {
    const welcomeText = `እንኳን ወደ Ardi Bingo በሰላም መጡ!\n\nተወዳጅ የቢንጎ ጨዋታ በቤትዎ ሆነው ይጫወቱ። በየ 90 ሰከንዱ በሚደረጉ ጨዋታዎች እድልዎን ይሞክሩና በሽዎች የሚቆጠሩ ብሮችን ያሸንፉ።\n\nለመቀጠል እባክዎ ከታች ያለውን "📲 ስልክ ቁጥርዎን ያጋሩ" የሚለውን ይጫኑ።`;
    
    ctx.reply(welcomeText, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]
        ]).oneTime().resize()
    );
});

// 2. ስልክ ቁጥር ሲላክ
bot.on('contact', (ctx) => {
    const firstName = ctx.from.first_name;
    ctx.reply(`✅ በትክክል ተመዝግበዋል ${firstName}!`, Markup.removeKeyboard());

    setTimeout(() => {
        ctx.reply(`🕹 Welcome To Ardi Bingo!\n\nEvery Square Counts – Grab Your Cartela, Join the Game, and Let the Fun Begin!`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp('🎮 Play Now', 'https://abitidagi626-ux.github.io/ardi-bingo-real/')], 
                [Markup.button.callback('💰 Check Balance', 'bal'), Markup.button.callback('💵 Make a Deposit', 'dep')],
                [Markup.button.callback('📞 Support', 'sup'), Markup.button.callback('📖 Instructions', 'inst')],
                [Markup.button.callback('📩 Invite', 'inv'), Markup.button.callback('🏆 Win Patterns', 'patt')],
                [Markup.button.callback('👤 Change Username', 'user'), Markup.button.callback('🥇 Leaderboard', 'lead')]
            ])
        );
    }, 1000);
});

// 3. ከ WebApp (payment.html) የሚመጣ የዲፖዚት መረጃ መቀበያ
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());

        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${ctx.from.first_name}\n` +
                             `🆔 User ID: \`${ctx.from.id}\`\n` +
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank}\n` +
                             `📝 ትራንዛክሽን: \n_${data.transaction}_`;

            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ (Approve)", `app_${ctx.from.id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ (Cancel)", `can_${ctx.from.id}`)
                ]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            ctx.reply("እናመሰግናለን! የዲፖዚት ጥያቄዎ ለAdmin ተልኳል:: ሲረጋገጥ ባላንስዎ ላይ ይጨመራል።");
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
        ctx.reply("ይቅርታ፣ መረጃውን ማስተላለፍ አልተቻለም።");
    }
});

// 4. የአድሚን ማረጋገጫ (Approve/Cancel) ሎጂክ
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = ctx.match[2];
    await ctx.answerCbQuery("ክፍያው ጸድቋል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል (Approved)**\nየተጨመረ ብር: ${amount} ETB`);
    try {
        await bot.telegram.sendMessage(userId, `🎉 እንኳን ደስ አለዎት! የ ${amount} ብር ዲፖዚት ጥያቄዎ ተረጋግጦ ሂሳብዎ ላይ ተጨምሯል።`);
    } catch (err) { console.log(err); }
});

bot.action(/can_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCbQuery("ውድቅ ተደርጓል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል (Cancelled)**`);
    try {
        await bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ በአስተዳዳሪው ውድቅ ተደርጓል።`);
    } catch (err) { console.log(err); }
});

bot.action('dep', (ctx) => ctx.reply("ብር ለማስገባት 'Play Now' ውስጥ ገብተው 'Deposit' የሚለውን ይጫኑ።"));
bot.action('bal', (ctx) => ctx.reply("የአሁኑ ባላንስዎ በጨዋታው ውስጥ ከላይ ይታይዎታል።"));
bot.action('sup', (ctx) => ctx.reply("ለእገዛ በ @YourAdminUsername ያነጋግሩን።"));

bot.launch().then(() => console.log("Ardi Bingo Bot Online!"));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
