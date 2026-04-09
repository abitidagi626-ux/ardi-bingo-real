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

// --- የዲፖዚት መረጃ ከ WebApp መቀበያ ---

bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());

        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${data.user_name}\n` +
                             `🆔 ID: \`${data.user_id}\`\n` +
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank}\n` +
                             `📝 መረጃ: \n_${data.transaction}_`;

            // ለአንተ (ለአድሚን) የሚላክ Approve/Cancel በተን
            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ (Approve)", `approve_${data.user_id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ (Cancel)", `cancel_${data.user_id}`)
                ]
            ]);

            // መረጃውን ለአንተ ይልካል
            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            ctx.reply("እናመሰግናለን! የዲፖዚት ጥያቄዎ ለAdmin ተልኳል:: ሲረጋገጥ እናሳውቆታለን::");
        }
    } catch (e) {
        console.error("Error:", e);
    }
});

// --- የአድሚን ማረጋገጫ (Approve/Cancel) ሎጂክ ---

// Admin 'Approve' ሲጫን
bot.action(/approve_(\d+)_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = ctx.match[2];

    // ማሳሰቢያ፡ እዚህ ጋር የዳታቤዝ logic መጠቀም አለብህ (ለምሳሌ MongoDB ወይም SQL)
    // ለአሁኑ ግን ማረጋገጫ መልዕክት ብቻ ይልካል
    
    await ctx.answerCbQuery("ተቀባይነት አግኝቷል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል (Approved)**`);
    
    // ለተጫዋቹ መልዕክት መላክ
    try {
        await bot.telegram.sendMessage(userId, `🎉 እንኳን ደስ አለዎት! የ ${amount} ብር ዲፖዚት ጥያቄዎ ጸድቆ ሂሳብዎ ላይ ተጨምሯል። መልካም ጨዋታ!`);
    } catch (err) {
        console.log("ተጫዋቹ ቦቱን አቁሞ ሊሆን ይችላል።");
    }
});

// Admin 'Cancel' ሲጫን
bot.action(/cancel_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    
    await ctx.answerCbQuery("ተሰርዟል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል (Cancelled)**`);
    
    // ለተጫዋቹ መልዕክት መላክ
    try {
        await bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ በአስተዳዳሪው ተሰርዟል። እባክዎ መረጃውን በትክክል መላክዎን ያረጋግጡ።`);
    } catch (err) {
        console.log("ተጫዋቹ ቦቱን አቁሞ ሊሆን ይችላል።");
    }
});

bot.launch().then(() => {
    console.log("Ardi Bingo Bot አሁን በመስመር ላይ ነው! Admin ID: 1046142540");                                                             
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
