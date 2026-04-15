require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ቦት ቶከን እና አድሚን ID
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 

// ባላንስን ፋይል ላይ ለማስቀመጥ
const balanceFile = 'balances.json';

function updateBalance(userId, amount) {
    let balances = {};
    if (fs.existsSync(balanceFile)) {
        balances = JSON.parse(fs.readFileSync(balanceFile));
    }
    balances[userId] = (balances[userId] || 0) + parseFloat(amount);
    fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));
    return balances[userId];
}

function getBalance(userId) {
    if (!fs.existsSync(balanceFile)) return 0;
    const balances = JSON.parse(fs.readFileSync(balanceFile));
    return balances[userId] || 0;
}

bot.start((ctx) => {
    ctx.reply(`እንኳን ወደ Ardi Bingo በሰላም መጡ!`, 
        Markup.keyboard([[Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]]).oneTime().resize()
    );
});

bot.on('contact', (ctx) => {
    ctx.reply(`✅ በትክክል ተመዝግበዋል!`, Markup.removeKeyboard());
    setTimeout(() => {
        ctx.reply(`🕹 Welcome To Ardi Bingo!`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp('🎮 Play Now', 'https://abitidagi626-ux.github.io/ardi-bingo-real/')],
                [Markup.button.callback('💰 Check Balance', 'bal'), Markup.button.callback('💵 Make a Deposit', 'dep')]
            ])
        );
    }, 1000);
});

// የዌብ አፕ መረጃ መቀበያ
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n👤 ተጫዋች: ${data.user_name}\n🆔 ID: \`${data.user_id}\`\n💰 መጠን: ${data.amount} ETB\n🏦 ባንክ: ${data.bank}\n📝 Tx: ${data.transaction}`;
            
            const adminKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback("✅ Approve", `app_${data.user_id}_${data.amount}`),
                 Markup.button.callback("❌ Reject", `can_${data.user_id}`)]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown', ...adminKeyboard });
            ctx.reply("ጥያቄዎ ለAdmin ተልኳል! ሲረጋገጥ ባላንስዎ ላይ ይጨመራል።");
        }
    } catch (e) { console.error(e); }
});

// Approve Logic
bot.action(/app_(\d+)_([\d.]+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = ctx.match[2];
    const newTotal = updateBalance(userId, amount);

    await ctx.answerCbQuery("ክፍያው ጸድቋል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ ጸድቋል! አዲስ ባላንስ: ${newTotal}`);
    
    try {
        await bot.telegram.sendMessage(userId, `🎉 የ ${amount} ብር ክፍያዎ ጸድቆ ባላንስዎ ላይ ተጨምሯል!`);
    } catch (e) { console.log("User blocked bot"); }
});

// Reject Logic
bot.action(/can_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCbQuery("ውድቅ ተደርጓል!");
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ ውድቅ ተደርጓል!`);
    try {
        await bot.telegram.sendMessage(userId, `⚠️ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል። እባክዎ በትክክል መላክዎን ያረጋግጡ።`);
    } catch (e) { console.log("User blocked bot"); }
});

bot.action('bal', (ctx) => {
    const bal = getBalance(ctx.from.id);
    ctx.reply(`💰 የአሁኑ ባላንስዎ፡ ${bal} ETB`);
});

bot.action('dep', (ctx) => ctx.reply("ብር ለማስገባት 'Play Now' ውስጥ ገብተው Deposit የሚለውን ይጫኑ።"));

bot.launch();
console.log("Ardi Bingo Bot started!");
