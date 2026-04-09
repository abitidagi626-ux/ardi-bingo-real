require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// የቦት Token
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');

// ለሙከራ Admin ID (የራስህን የቴሌግራም ID እዚህ መተካት ትችላለህ)
const ADMIN_ID = 561234567; 

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

// --- አዲስ የተጨመረ የዲፖዚት ማረጋገጫ ሎጂክ ---

// Admin 'Approve' ሲጫን
bot.action(/approve_(\d+)_(\d+)/, (ctx) => {
    const userId = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);

    // ባላንስን በ LocalStorage (ወይም ዳታቤዝ) ላይ መጨመር
    // ማሳሰቢያ፡ በሰርቨር ሳይድ ዳታቤዝ መጠቀም ይመከራል። ለጊዜው በሎጂክ ደረጃ፡
    let currentBalance = parseFloat(localStorage.getItem(`balance_${userId}`)) || 0;
    localStorage.setItem(`balance_${userId}`, (currentBalance + amount).toFixed(2));

    ctx.answerCbQuery("ተቀባይነት አግኝቷል!");
    ctx.editMessageText(`✅ የ ${amount} ብር ክፍያ ለተጠቃሚ ID: ${userId} ጸድቋል!`);
    
    // ለተጫዋቹ መልዕክት መላክ
    bot.telegram.sendMessage(userId, `🎉 እንኳን ደስ አለዎት! የ ${amount} ብር ዲፖዚት ጥያቄዎ ጸድቆ ሂሳብዎ ላይ ተጨምሯል።`);
});

// Admin 'Cancel' ሲጫን
bot.action(/cancel_(\d+)/, (ctx) => {
    const userId = ctx.match[1];
    ctx.answerCbQuery("ተሰርዟል!");
    ctx.editMessageText(`❌ የዲፖዚት ጥያቄው ውድቅ ተደርጓል።`);
    
    bot.telegram.sendMessage(userId, `⚠️ ይቅርታ፣ የዲፖዚት ጥያቄዎ በአስተዳዳሪው ተሰርዟል። እባክዎ መረጃውን በትክክል መላክዎን ያረጋግጡ።`);
});

bot.launch().then(() => {
    console.log("Ardi Bingo Bot አሁን ካንተ GitHub ሊንክ ጋር ተገናኝቷል!");
});
