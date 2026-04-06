require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// ያንተ ቦት Token
const bot = new Telegraf('8684712579:AAE9JK0cdSK-cVeycF7xAd_KSrUUqmN5HWI');

// 1. ቦቱ ሲጀመር (Start)
bot.start((ctx) => {
    const welcomeText = `እንኳን ወደ Ardi Bingo በሰላም መጡ!\n\nተወዳጅ የቢንጎ ጨዋታ በቤትዎ ሆነው ይጫወቱ። በየ 90 ሰከንዱ በሚደረጉ ጨዋታዎች እድልዎን ይሞክሩና በሽዎች የሚቆጠሩ ብሮችን ያሸንፉ።\n\nለመቀጠል እባክዎ ከታች ያለውን "📲 ስልክ ቁጥርዎን ያጋሩ" የሚለውን ይጫኑ።`;
    
    ctx.reply(welcomeText, 
        Markup.keyboard([
            [Markup.button.contactRequest('📲 ስልክ ቁጥርዎን ያጋሩ')]
        ]).oneTime().resize()
    );
});

// 2. ስልክ ቁጥር ሲላክ (Contact Handling)
bot.on('contact', (ctx) => {
    const firstName = ctx.from.first_name;
    
    ctx.reply(`✅ በትክክል ተመዝግበዋል ${firstName}!`, Markup.removeKeyboard());

    // ከ1 ሰከንድ በኋላ ዋናውን ሜኑ ያመጣል
    setTimeout(() => {
        ctx.reply(`🕹 Welcome To Ardi Bingo!\n\nEvery Square Counts – Grab Your Cartela, Join the Game, and Let the Fun Begin!`, 
            Markup.inlineKeyboard([
                // ያንተን አዲሱን ሊንክ እዚህ ጋር አስገብቼዋለሁ
                [Markup.button.webApp('🎮 Play Now', 'https://abitidagi626-ux.github.io/ardi-bingo-real/')], 
                [Markup.button.callback('💰 Check Balance', 'bal'), Markup.button.callback('💵 Make a Deposit', 'dep')],
                [Markup.button.callback('📞 Support', 'sup'), Markup.button.callback('📖 Instructions', 'inst')],
                [Markup.button.callback('📩 Invite', 'inv'), Markup.button.callback('🏆 Win Patterns', 'patt')],
                [Markup.button.callback('👤 Change Username', 'user'), Markup.button.callback('🥇 Leaderboard', 'lead')]
            ])
        );
    }, 1000);
});

bot.launch().then(() => {
    console.log("Ardi Bingo Bot አሁን ካንተ GitHub ሊንክ ጋር ተገናኝቷል!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
