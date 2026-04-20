require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// ቦት ቶከን እና አድሚን ID
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 

// ለጊዜው ባላንስ እዚህ ጋር እናስቀምጥ (በኋላ በDatabase መተካት አለበት)
let userBalances = {};

// 1. ቦት ሲጀምር (/start)
bot.start((ctx) => {
    ctx.reply(`እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመጀመር ስልክ ቁጥርዎን ያጋሩ።`, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]
        ]).oneTime().resize()
    );
});

// 2. ስልክ ቁጥር ሲላክ
bot.on('contact', (ctx) => {
    const userId = ctx.from.id;
    // ተጫዋቹ አዲስ ከሆነ 200 ብር ቦነስ እንስጠው
    if (!userBalances[userId]) {
        userBalances[userId] = 200.00;
    }

    const balance = userBalances[userId];
    // ዌብ አፑ ሲከፈት ባላንሱን ይዞ እንዲሄድ በ URL Parameter እንልካለን
    const webAppUrl = `https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance=${balance}`;

    ctx.reply(`✅ በትክክል ተመዝግበዋል!\n💵 የአሁኑ ባላንስዎ: ${balance} ETB`, 
        Markup.keyboard([
            [Markup.button.webApp('🕹 Play / Deposit', webAppUrl)],
            ['💰 Check Balance', '👨‍💻 Support']
        ]).resize()
    );
});

// 3. ከዌብ አፕ የሚመጣ መረጃ መቀበያ (Deposit ወይም Win)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        console.log("የደረሰ መረጃ:", data);

        // ሀ. የዲፖዚት ጥያቄ ከሆነ
        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${ctx.from.first_name}\n` +
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank || 'Telebirr'}\n` +
                             `📝 መረጃ: ${data.transaction || 'N/A'}\n` +
                             `🆔 ID: \`${ctx.from.id}\``;

            const adminKeyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback("✅ አጽድቅ", `app_${ctx.from.id}_${data.amount}`),
                    Markup.button.callback("❌ ሰርዝ", `can_${ctx.from.id}`)
                ]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown', ...adminKeyboard });
            await ctx.reply("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። ሲረጋገጥ መልዕክት ይደርስዎታል።");
        } 
        
        // ለ. ተጫዋቹ አሸንፎ ከሆነ (Win Notification)
        else if (data.type === 'game_win') {
            await bot.telegram.sendMessage(ADMIN_ID, `🎉 ተጫዋች ${ctx.from.first_name} (ID: ${ctx.from.id}) ${data.amount} ብር አሸንፏል!`);
        }

    } catch (e) {
        console.error("WebAppData Error:", e);
        await ctx.reply("መረጃውን በማስተናገድ ላይ ስህተት ተፈጥሯል።");
    }
});

// 4. አድሚን ሲያጸድቅ (Approve)
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አይፈቀድልዎትም!");
    
    const userId = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);
    
    // ባላንሱን ማሳደግ
    if (userBalances[userId] !== undefined) {
        userBalances[userId] += amount;
    } else {
        userBalances[userId] = amount;
    }
    
    await ctx.answerCbQuery("ክፍያው ጸድቋል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል (ባላንስ ታድሷል)**`);
    
    await bot.telegram.sendMessage(userId, `🎉 የ ${amount} ብር ዲፖዚትዎ ጸድቋል። አዲሱ ባላንስዎ: ${userBalances[userId]} ETB!`);
});

// 5. አድሚን ሲሰርዝ (Cancel)
bot.action(/can_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("ጥያቄው ተሰርዟል!");
    const userId = ctx.match[1];
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል**`);
    await bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።`);
});

// 6. የባላንስ ቼክ እና ሰፖርት
bot.hears('💰 Check Balance', (ctx) => {
    const bal = userBalances[ctx.from.id] || 0;
    ctx.reply(`💵 የአሁኑ ባላንስዎ: ${bal.toFixed(2)} ETB`);
});

bot.hears('👨‍💻 Support', (ctx) => {
    ctx.reply("ለማንኛውም እርዳታ አድሚኑን ያነጋግሩ: @Yordi_Bingo_Admin");
});

// ቦቱን ማስጀመር
bot.launch();
console.log("🚀 Ardi Bingo Server is Online and Syncing with App.js!");
