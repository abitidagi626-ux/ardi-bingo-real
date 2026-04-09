// የቴሌግራም WebApp ማቀናበሪያ
const tg = window.Telegram.WebApp;
tg.expand(); // WebApp ስክሪኑን ሙሉ እንዲሞላ

// --- 1. የዲፖዚት ፎርም መረጃን ለAdmin ማጽደቂያ መላክ (ከክፍያ ገጽ የሚመጣ) ---

function submitRequest() {
    // በ payment.html ላይ ያሉትን የ Input ID-ዎች በመጠቀም መረጃ መሰብሰብ
    // ማሳሰቢያ፡ በ HTML ገጽህ ላይ ያሉት ID-ዎች 'amount' እና 'transaction' መሆናቸውን አረጋግጥ
    const amountInput = document.getElementById('amount') || document.getElementById('sent-amount');
    const transactionInput = document.getElementById('transaction') || document.getElementById('transaction-msg');
    const bankDisplay = document.getElementById('bank-name') || document.getElementById('selected-bank-name');

    const amount = amountInput ? amountInput.value : null;
    const transaction = transactionInput ? transactionInput.value : null;
    const bank = bankDisplay ? bankDisplay.innerText : "Unknown Bank";
    const user = tg.initDataUnsafe.user;

    // መረጃ መሞላቱን ማረጋገጫ
    if (!amount || !transaction) {
        tg.showAlert("እባክዎ መረጃውን በትክክል ይሙሉ።");
        return;
    }

    // ለአድሚን የሚላክ መረጃ
    const paymentData = {
        type: 'deposit_request',
        user_id: user ? user.id : 'Unknown',
        user_name: user ? `${user.first_name} ${user.last_name || ''}` : 'Guest',
        amount: amount,
        bank: bank,
        transaction: transaction,
        timestamp: new Date().getTime()
    };

    // መረጃውን ወደ ሰርቨር (Telegram Bot) መላክ
    tg.sendData(JSON.stringify(paymentData));

    // ማረጋገጫ መልዕክት ማሳየት
    tg.showAlert("እናመሰግናለን! ጥያቄዎ ለAdmin ተልኳል።", () => {
        tg.close(); // WebApp መዝጊያ
    });
}

// --- 2. የባላንስ አስተዳደር ሎጂክ (Logic) ---

// በAdmin ሲጸድቅ Balance ላይ መደመር (Deposit Approve)
function approveDeposit(userId, amount) {
    let currentBalance = getUserBalance(userId);
    let newBalance = currentBalance + parseFloat(amount);
    updateUserBalance(userId, newBalance);
    console.log(`Deposit Approved! New Balance: ${newBalance} ETB`);
}

// ጨዋታ ሲቀላቀሉ ከBalance ላይ መቀነስ (Stake Deduction)
function deductStake(userId, stakeAmount) {
    let currentBalance = getUserBalance(userId);
    if (currentBalance >= stakeAmount) {
        let newBalance = currentBalance - stakeAmount;
        updateUserBalance(userId, newBalance);
        console.log(`Stake deducted: ${stakeAmount}. New Balance: ${newBalance}`);
        return true; // ክፍያው ተሳክቷል
    } else {
        tg.showAlert("በቂ ሂሳብ የሎትም! እባክዎ መጀመሪያ ተቀማጭ ያድርጉ።");
        return false; // ክፍያው አልተሳካም
    }
}

// ሲያሸንፉ Balance ላይ መደመር (Winning Credit)
function addWinnings(userId, winAmount) {
    let currentBalance = getUserBalance(userId);
    let newBalance = currentBalance + parseFloat(winAmount);
    updateUserBalance(userId, newBalance);
    console.log(`Winner! ${winAmount} ETB added. Total: ${newBalance}`);
}

// ገንዘብ ለማውጣት ሲጠይቁ መቀነስ (Withdrawal Request)
function requestWithdrawal(userId, amount) {
    let currentBalance = getUserBalance(userId);
    if (currentBalance >= amount) {
        let newBalance = currentBalance - amount;
        updateUserBalance(userId, newBalance);
        // ለAdmin የክፍያ ጥያቄ እዚህ ጋር ይላካል
        console.log(`Withdrawal request for ${amount} ETB processed.`);
        return true;
    } else {
        tg.showAlert("ሊያወጡ የፈለጉት የብር መጠን ከሂሳብዎ ይበልጣል!");
        return false;
    }
}

// --- 3. መረጃን ከዳታቤዝ ለማንበብ እና ለማስተካከል (Helper functions) ---

function getUserBalance(userId) {
    // ለጊዜው ከLocalStorage መረጃውን ያነባል
    return parseFloat(localStorage.getItem(`balance_${userId}`)) || 0.00;
}

function updateUserBalance(userId, newAmount) {
    // መረጃውን በLocalStorage ውስጥ ያስቀምጣል
    localStorage.setItem(`balance_${userId}`, newAmount.toFixed(2));
    
    // በገጹ ላይ 'balance-display' የሚል ID ያለው ቦታ ካለ ወዲያውኑ እንዲቀየር ያደርጋል
    const display = document.getElementById('balance-display');
    if(display) {
        display.innerText = `ETB ${newAmount.toFixed(2)}`;
    }
}

// ገጹ ሲከፈት የቆየውን ባላንስ ለማሳየት (ካስፈለገ)
window.onload = function() {
    const user = tg.initDataUnsafe.user;
    if (user) {
        const bal = getUserBalance(user.id);
        updateUserBalance(user.id, bal);
    }
};
