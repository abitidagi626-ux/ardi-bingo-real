require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 8684712579; 

bot.start((ctx) => {
    const welcomeText = `እንኳን ወደ Ardi Bingo በሰላም መጡ!\n\nተወዳጅ የቢንጎ ጨዋታ በቤትዎ ሆነው ይጫወቱ። በየ 90 ሰከንዱ በሚደረጉ ጨዋታዎች እድልዎን ይሞክሩና በሽዎች የሚቆጠሩ ብሮችን ያሸንፉ።\n\nለመቀጠል እባክዎ ከታች ያለውን "📲 ስልክ ቁጥርዎን ያጋሩ" የሚለውን ይጫኑ።`;
    
    ctx.reply(welcomeText, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]
        ]).oneTime().resize()
    );
});

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

// --- 3. የዲፖዚት መረጃ መቀበያ ---
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data); // .data() ሳይሆን .data ነው ብዙ ጊዜ

        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${data.user_name}\n` +
                             `🆔 ID: \`${ctx.from.id}\`\n` + // ID ከራሱ ከቴሌግራም ቢወሰድ ይሻላል
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank}\n` +
                             `📝 መረጃ: ${data.transaction}`;

            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ", `app_${ctx.from.id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ", `can_${ctx.from.id}`)
                ]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            ctx.reply("እናመሰግናለን! የዲፖዚት ጥያቄዎ ለAdmin ተልኳል::");
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
        ctx.reply("ስህተት ተከስቷል፣ እባክዎ ደግመው ይሞክሩ።");
    }
});

// --- 4. የአድሚን ውሳኔ ---
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አንተ አድሚን አይደለህም!");

    const userId = ctx.match[1];
    const amount = ctx.match[2];

    // እዚህ ጋር በዳታቤዝ ባላንስ የመጨመር ኮድ መግባት አለበት (ለምሳሌ፡ await User.findByIdAndUpdate...)
    
    await ctx.answerCbQuery("ክፍያው ጸድቋል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል**\nየተጨመረ: ${amount} ETB`, { parse_mode: 'Markdown' });
    
    try {
        await bot.telegram.sendMessage(userId, `🎉 እንኳን ደስ አለዎት! የ ${amount} ብር ዲፖዚት ጥያቄዎ ተረጋግጦ ሂሳብዎ ላይ ተጨምሯል።`);
    } catch (err) {
        console.log("ተጫዋቹ ቦቱን አቁሞታል።");
    }
});

bot.action(/can_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አንተ አድሚን አይደለህም!");
    
    const userId = ctx.match[1];
    await ctx.answerCbQuery("ውድቅ ተደርጓል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ተሰርዟል**`, { parse_mode: 'Markdown' });
    
    try {
        await bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ በአስተዳዳሪው ውድቅ ተደርጓል።`);
    } catch (err) {
        console.log("ተጫዋቹ ቦቱን አቁሞታል።");
    }
});

bot.launch();
console.log("Bot is running...");
