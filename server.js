require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// የቦት Token እና Admin ID
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 

bot.start((ctx) => {
    ctx.reply(`እንኳን ወደ Ardi Bingo በሰላም መጡ!`, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]
        ]).oneTime().resize()
    );
});

bot.on('contact', (ctx) => {
    ctx.reply(`✅ በትክክል ተመዝግበዋል!`, Markup.removeKeyboard());
    setTimeout(() => {
        ctx.reply(`🕹 Welcome To Ardi Bingo!`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp('🎮 Play Now', 'https://abitidagi626-ux.github.io/ardi-bingo-real/')], 
                [Markup.button.callback('💵 Make a Deposit', 'dep')]
            ])
        );
    }, 1000);
});

// --- ከዌብ አፕ የሚመጣ መረጃ መቀበያ (Confirm ሲጫኑ የሚመጣ) ---
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        console.log("አዲስ የዲፖዚት መረጃ ደርሷል:", data);

        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${data.user_name}\n` +
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

            // ለAdmin መረጃውን መላክ
            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            // ለተጫዋቹ ማረጋገጫ መስጠት
            ctx.reply("እናመሰግናለን! የዲፖዚት ጥያቄዎ ለAdmin ተልኳል። ኦፕሬተሮቻችን ሲያረጋግጡ መልዕክት ይደርስዎታል።");
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
        ctx.reply("መረጃውን በማስተናገድ ላይ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።");
    }
});

// --- የአድሚን ውሳኔ (Approve/Cancel) ---
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አይፈቀድልዎትም!");
    
    const userId = ctx.match[1];
    const amount = ctx.match[2];
    
    try {
        await ctx.answerCbQuery("ክፍያው ጸድቋል!");
        
        // የአድሚኑን ሜሴጅ Update ማድረግ
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ተረጋግጦ ባላንስ ላይ ተጨምሯል**`, { parse_mode: 'Markdown' });
        
        // ለተጫዋቹ መልዕክት መላክ
        await bot.telegram.sendMessage(userId, `🎉 ደስ የሚል ዜና! የ ${amount} ብር ዲፖዚት ጥያቄዎ ጸድቆ ባላንስዎ ላይ ተጨምሯል። አሁኑኑ መጫወት ይችላሉ! 🎰`);
    } catch (error) {
        console.error("Approval Error:", error);
    }
});

bot.action(/can_(\d+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("አይፈቀድልዎትም!");
    
    const userId = ctx.match[1];
    
    try {
        await ctx.answerCbQuery("ጥያቄው ተሰርዟል!");
        
        // የአድሚኑን ሜሴጅ Update ማድረግ
        await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል**`, { parse_mode: 'Markdown' });
        
        // ለተጫዋቹ መልዕክት መላክ
        await bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ በAdmin ውድቅ ተደርጓል። እባክዎ መረጃውን አረጋግጠው እንደገና ይሞክሩ ወይም በ @ArdiBingoSupport ያግኙን።`);
    } catch (error) {
        console.error("Cancel Error:", error);
    }
});

bot.launch();
console.log("Ardi Bingo Bot is Online!");
