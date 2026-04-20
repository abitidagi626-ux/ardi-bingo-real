require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// ቦት ቶከን (የቀድሞውን ተጠቅሜያለሁ)
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 

// 1. ቦት ሲጀምር
bot.start((ctx) => {
    ctx.reply(`እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰`, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ (Register)')]
        ]).oneTime().resize()
    );
});

// 2. ስልክ ቁጥር ሲላክ (ወሳኝ ማሻሻያ - እዚህ ጋር Inline ሳይሆን Keyboard እንጠቀማለን)
bot.on('contact', (ctx) => {
    const balance = 0.0; // እዚህ ጋር ከ Database ማምጣት ትችላለህ
    const webAppUrl = `https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance=${balance}`;

    ctx.reply(`✅ በትክክል ተመዝግበዋል! ለመጫወት ወይም ዲፖዚት ለማድረግ ከታች ያለውን በተን ይጠቀሙ።`, 
        Markup.keyboard([
            [Markup.button.webApp('🎮 Play / Deposit', webAppUrl)], // ይህ በተን ዳታ መቀበል ይችላል
            ['💰 Check Balance', '👨‍💻 Support']
        ]).resize()
    );
});

// 3. ከዌብ አፕ የሚመጣ የዲፖዚት መረጃ መቀበያ (Confirm ሲጫኑ የሚመጣ)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        console.log("አዲስ የዲፖዚት መረጃ ደርሷል:", data);

        const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                         `👤 ተጫዋች: ${data.user_name || ctx.from.first_name}\n` +
                         `🆔 ID: \`${ctx.from.id}\`\n` +
                         `💰 መጠን: ${data.amount} ETB\n` +
                         `🏦 ባንክ: ${data.bank}\n` +
                         `📝 መረጃ: ${data.transaction}`;

        const adminKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback("✅ አጽድቅ", `app_${ctx.from.id}_${data.amount}`),
                Markup.button.callback("❌ ሰርዝ", `can_${ctx.from.id}`)
            ]
        ]);

        // ለአድሚን መላክ
        await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
            parse_mode: 'Markdown', 
            ...adminKeyboard 
        });

        // ለተጫዋቹ ማረጋገጫ
        await ctx.reply("✅ እናመሰግናለን! የዲፖዚት መረጃዎ ለአድሚን ተልኳል። ሲረጋገጥ መልዕክት ይደርስዎታል።");

    } catch (e) {
        console.error("WebAppData JSON Error:", e);
        ctx.reply("መረጃውን በማስተናገድ ላይ ስህተት ተፈጥሯል። እባክዎ ዌብ አፑ ላይ ትክክለኛ መረጃ መሙላትዎን ያረጋግጡ።");
    }
});

// 4. አድሚን ሲያጸድቅ (Approve)
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አይፈቀድልዎትም!");
    
    const userId = ctx.match[1];
    const amount = ctx.match[2];
    
    try {
        await ctx.answerCbQuery("ክፍያው ጸድቋል!");
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል**`, { parse_mode: 'Markdown' });
        
        await bot.telegram.sendMessage(userId, `🎉 ደስ የሚል ዜና! የ ${amount} ብር ዲፖዚት ጥያቄዎ ጸድቋል። አሁኑኑ መጫወት ይችላሉ! 🎰`);
    } catch (error) {
        console.error("Approval Error:", error);
    }
});

// 5. አድሚን ሲሰርዝ (Cancel)
bot.action(/can_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አይፈቀድልዎትም!");
    
    const userId = ctx.match[1];
    
    try {
        await ctx.answerCbQuery("ጥያቄው ተሰርዟል!");
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል**`, { parse_mode: 'Markdown' });
        
        await bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል። እባክዎ መረጃውን አረጋግጠው እንደገና ይሞክሩ።`);
    } catch (error) {
        console.error("Cancel Error:", error);
    }
});

// 6. ሌሎች ሜሴጆች
bot.hears('💰 Check Balance', (ctx) => ctx.reply("የአሁኑ ባላንስዎ 0.00 ETB ነው።"));
bot.hears('👨‍💻 Support', (ctx) => ctx.reply("ለእርዳታ @Yordi_Bingo_Admin ያነጋግሩ።"));

bot.launch();
console.log("🚀 Ardi Bingo Server is Online!");
