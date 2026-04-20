require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// ቦት ቶከን (ከ image_939ffd.png የተወሰደ)
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');

// አድሚን ID (የእራስህን ID እዚህ አስገባ ወይም በ .env ፋይል ውስጥ አስቀምጥ)
const ADMIN_ID = 1046142540; 

// ለጊዜው ባላንስን በሜሞሪ ለመያዝ (ቦቱ ሲጠፋ ይጠፋል - ለቋሚ መረጃ Database ያስፈልጋል)
let userBalances = {};

// ቦቱ ሲጀመር (Start)
bot.start((ctx) => {
    ctx.reply(`እንኳን ወደ Ardi Bingo በሰላም መጡ! 🎰\n\nለመጀመር ስልክ ቁጥርዎን ያጋሩ።`, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]
        ]).oneTime().resize()
    );
});

// ስልክ ቁጥር ሲላክ
bot.on('contact', (ctx) => {
    const userId = ctx.from.id;
    // ተቀማጭ ባላንስ ከሌለው 200 በነጻ እንዲጀምር (እንደ ምሳሌ)
    if (!userBalances[userId]) userBalances[userId] = 200.00;

    const balance = userBalances[userId];
    // ዌብ አፕ URL (ከ github የተወሰደ)
    const webAppUrl = `https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance=${balance}`;

    ctx.reply(`✅ በትክክል ተመዝግበዋል!\n💵 የአሁኑ ባላንስዎ: ${balance} ETB`, 
        Markup.keyboard([
            [Markup.button.webApp('🕹 Play / Deposit', webAppUrl)],
            ['💰 Check Balance', '👨‍💻 Support']
        ]).resize()
    );
});

// ዋናው ክፍል፦ ከዌብ አፕ (payment.html) የሚመጣ ዳታ መቀበያ
// በ image_fb236c.png ላይ የታየውን TypeError ለመፍታት የተስተካከለ
bot.on('web_app_data', async (ctx) => {
    try {
        // በቅርብ version telegraf ላይ ዳታ የሚገኘው በዚህ መንገድ ነው
        const rawData = ctx.message.web_app_data.data;
        console.log("ከዌብ አፕ የመጣ ዳታ:", rawData);
        
        const data = JSON.parse(rawData);

        if (data.type === 'deposit_request') {
            const amount = data.amount;
            const bank = data.bank;
            const transaction = data.transaction;
            const userName = data.user_name;

            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${userName}\n` +
                             `💰 መጠን: ${amount} ETB\n` +
                             `🏦 ባንክ: ${bank}\n` +
                             `📝 SMS: ${transaction}\n` +
                             `🆔 User ID: \`${ctx.from.id}\``;

            const adminKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback("✅ አጽድቅ", `app_${ctx.from.id}_${amount}`)],
                [Markup.button.callback("❌ ሰርዝ", `can_${ctx.from.id}`)]
            ]);

            // ለአድሚን መረጃውን መላክ
            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });

            await ctx.reply("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። ሲረጋገጥ መልዕክት ይደርስዎታል።");
        }
    } catch (e) {
        console.error("የዳታ አያያዝ ስህተት (TypeError Fix):", e.message);
        await ctx.reply("መረጃውን በማስተናገድ ላይ ስህተት ተፈጥሯል። እባክዎ በድጋሚ ይሞክሩ።");
    }
});

// አድሚኑ "አጽድቅ" ሲጫን
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);
    
    // ባላንስ መጨመር
    userBalances[userId] = (userBalances[userId] || 0) + amount;
    
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል (ባላንስ ተጨምሯል)**`);
    
    // ለተጫዋቹ ማሳወቅ
    await bot.telegram.sendMessage(userId, `🎉 የ ${amount} ብር ዲፖዚትዎ ጸድቋል።\n💵 አዲስ ባላንስ: ${userBalances[userId]} ETB`);
});

// አድሚኑ "ሰርዝ" ሲጫን
bot.action(/can_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል**`);
    await bot.telegram.sendMessage(userId, `⚠️ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል። እባክዎ ትክክለኛ መረጃ መላክዎን ያረጋግጡ።`);
});

// ባላንስ ለማየት
bot.hears('💰 Check Balance', (ctx) => {
    const bal = userBalances[ctx.from.id] || 0;
    ctx.reply(`💵 የአሁኑ ባላንስዎ: ${bal.toFixed(2)} ETB`);
});

// ስህተት ቢፈጠር ቦቱ እንዳይቆም
bot.catch((err, ctx) => {
    console.log(`ይቅርታ፣ በ ${ctx.updateType} ላይ ስህተት ተፈጥሯል:`, err);
});

bot.launch();
console.log("🚀 Ardi Bingo Server is Online and Syncing with App.js!");
