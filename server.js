require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ቦት ቶከን
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');
const ADMIN_ID = 1046142540; 
const DB_FILE = './database.json';

// --- ዳታቤዝ አያያዝ ---
function loadBalances() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({}));
            return {};
        }
        const data = fs.readFileSync(DB_FILE);
        return JSON.parse(data);
    } catch (e) {
        console.error("ዳታቤዝ ማንበብ አልተቻለም:", e);
        return {};
    }
}

function saveBalances(balances) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(balances, null, 4));
    } catch (e) {
        console.error("ዳታቤዝ መጻፍ አልተቻለም:", e);
    }
}

// ቦቱ ሲጀመር
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
    let balances = loadBalances();

    // አዲስ ተጫዋች ከሆነ 200 ብር ስጦታ መስጠት
    if (!balances[userId]) {
        balances[userId] = 200.00;
        saveBalances(balances);
    }

    const balance = balances[userId];
    const webAppUrl = `https://abitidagi626-ux.github.io/ardi-bingo-real/index.html?balance=${balance}`;

    ctx.reply(`✅ በትክክል ተመዝግበዋል!\n💵 የአሁኑ ባላንስዎ: ${balance} ETB`, 
        Markup.keyboard([
            [Markup.button.webApp('🕹 Play / Deposit', webAppUrl)],
            ['💰 Check Balance', '👨‍💻 Support']
        ]).resize()
    );
});

// ከዌብ አፕ የሚመጣ መረጃ መቀበያ (Deposit, Buy Card, Win)
bot.on('web_app_data', async (ctx) => {
    try {
        const rawData = ctx.message.web_app_data.data;
        const data = JSON.parse(rawData);

        // 1. የዲፖዚት ጥያቄ
        if (data.type === 'deposit_request') {
            const adminMsg = `🔔 **አዲስ የዲፖዚት ጥያቄ**\n\n` +
                             `👤 ተጫዋች: ${data.user_name}\n` +
                             `💰 መጠን: ${data.amount} ETB\n` +
                             `🏦 ባንክ: ${data.bank}\n` +
                             `📝 SMS: ${data.transaction}\n` +
                             `🆔 User ID: \`${ctx.from.id}\``;

            const adminKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback("✅ አጽድቅ", `app_${ctx.from.id}_${data.amount}`)],
                [Markup.button.callback("❌ ሰርዝ", `can_${ctx.from.id}`)]
            ]);

            await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { 
                parse_mode: 'Markdown', 
                ...adminKeyboard 
            });
            await ctx.reply("✅ የዲፖዚት መረጃዎ ለአድሚን ተልኳል። ሲረጋገጥ መልዕክት ይደርስዎታል።");
        }

        // 2. ካርድ ሲገዛ ባላንስ መቀነስ
        if (data.type === 'buy_card') {
            let balances = loadBalances();
            const userId = ctx.from.id;
            const price = parseFloat(data.amount);

            if (balances[userId] >= price) {
                balances[userId] -= price;
                saveBalances(balances);
                console.log(`User ${userId} bought card ${data.cardId}. Remaining: ${balances[userId]}`);
            }
        }

        // 3. ተጫዋች ሲያሸንፍ (ለአድሚን ማሳወቅ)
        if (data.type === 'game_win') {
            const winMsg = `🏆 **ቢንጎ! አሸናፊ ተገኝቷል**\n\n` +
                           `👤 ተጫዋች: \`${ctx.from.id}\`\n` +
                           `🎴 ካርቴላ: #${data.cardId}\n` +
                           `💰 የድል መጠን: ${data.amount} ETB\n\n` +
                           `ለማጽደቅ /win_${ctx.from.id}_${data.amount} ብለው ይላኩ።`;
            
            await bot.telegram.sendMessage(ADMIN_ID, winMsg, { parse_mode: 'Markdown' });
        }

    } catch (e) {
        console.error("Data Error:", e.message);
    }
});

// አድሚን ሲያጸድቅ - ባላንስ በቋሚነት እዚህ ጋር ይቆጥባል
bot.action(/app_(\d+)_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);
    let balances = loadBalances();
    
    balances[userId] = (balances[userId] || 0) + amount;
    saveBalances(balances);
    
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ **ሁኔታ: ጸድቋል (ባላንስ ተጨምሯል)**`);
    await bot.telegram.sendMessage(userId, `🎉 የ ${amount} ብር ዲፖዚትዎ ጸድቋል።\n💵 አዲስ ባላንስ: ${balances[userId]} ETB`);
});

// አሸናፊ ሲኖር አድሚኑ የሚጠቀምበት ኮማንድ (ለምሳሌ፡ /win_ID_AMOUNT)
bot.hears(/\/win_(\d+)_([\d.]+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const userId = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);
    let balances = loadBalances();

    balances[userId] = (balances[userId] || 0) + amount;
    saveBalances(balances);

    await ctx.reply(`✅ ለተጫዋች \`${userId}\` ${amount} ብር የድል ክፍያ ተጨምሯል።`, { parse_mode: 'Markdown' });
    await bot.telegram.sendMessage(userId, `🎊 እንኳን ደስ አለዎት! የ ${amount} ብር ሽልማትዎ በባላንስዎ ላይ ተጨምሯል።`);
});

// አድሚን ሲሰርዝ
bot.action(/can_(\d+)/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ **ሁኔታ: ውድቅ ተደርጓል**`);
    await bot.telegram.sendMessage(userId, `⚠️ የዲፖዚት ጥያቄዎ ውድቅ ተደርጓል።`);
});

// ባላንስ ለማየት
bot.hears('💰 Check Balance', (ctx) => {
    const balances = loadBalances();
    const bal = balances[ctx.from.id] || 0;
    ctx.reply(`💵 የአሁኑ ባላንስዎ: ${bal.toFixed(2)} ETB`);
});

// Support
bot.hears('👨‍💻 Support', (ctx) => {
    ctx.reply("ማንኛውም ጥያቄ ካለዎት አድሚኑን @ArdiiiBingoBot ማነጋገር ይችላሉ።");
});

bot.launch();
console.log("🚀 Ardi Bingo Server is Online with Database.json!");
