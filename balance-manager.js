// balance-manager.js

// 1. የገንዘብ ማስገቢያ ጥያቄን ለAdmin ማጽደቂያ መላክ (Deposit Request)
function requestDeposit(userId, amount, transactionId) {
    const depositRequest = {
        userId: userId,
        amount: amount,
        transactionId: transactionId,
        status: 'pending', // Admin እስኪያጸድቀው ድረስ
        timestamp: new Date().getTime()
    };
    // እዚህ ጋር ለAdmin Database መረጃው ይላካል
    console.log("Deposit request sent for approval:", depositRequest);
    return depositRequest;
}

// 2. በAdmin ሲጸድቅ Balance ላይ መደመር (Deposit Approve)
function approveDeposit(userId, amount) {
    let currentBalance = getUserBalance(userId);
    let newBalance = currentBalance + amount;
    updateUserBalance(userId, newBalance);
    console.log(`Deposit Approved! New Balance: ${newBalance} ETB`);
}

// 3. ጨዋታ ሲቀላቀሉ ከBalance ላይ መቀነስ (Stake Deduction)
function deductStake(userId, stakeAmount) {
    let currentBalance = getUserBalance(userId);
    if (currentBalance >= stakeAmount) {
        let newBalance = currentBalance - stakeAmount;
        updateUserBalance(userId, newBalance);
        console.log(`Stake deducted: ${stakeAmount}. New Balance: ${newBalance}`);
        return true; // ክፍያው ተሳክቷል
    } else {
        alert("በቂ ሂሳብ የሎትም! እባክዎ መጀመሪያ ተቀማጭ ያድርጉ።");
        return false; // ክፍያው አልተሳካም
    }
}

// 4. ሲያሸንፉ Balance ላይ መደመር (Winning Credit)
function addWinnings(userId, winAmount) {
    let currentBalance = getUserBalance(userId);
    let newBalance = currentBalance + winAmount;
    updateUserBalance(userId, newBalance);
    console.log(`Winner! ${winAmount} ETB added. Total: ${newBalance}`);
}

// 5. ገንዘብ ለማውጣት ሲጠይቁ መቀነስ (Withdrawal Request)
function requestWithdrawal(userId, amount) {
    let currentBalance = getUserBalance(userId);
    if (currentBalance >= amount) {
        let newBalance = currentBalance - amount;
        updateUserBalance(userId, newBalance);
        // ለAdmin የክፍያ ጥያቄ ይላካል
        console.log(`Withdrawal request for ${amount} ETB processed.`);
        return true;
    } else {
        alert("ሊያወጡ የፈለጉት የብር መጠን ከሂሳብዎ ይበልጣል!");
        return false;
    }
}

// መረጃን ከዳታቤዝ ለማንበብ እና ለማስተካከል (Helper functions)
function getUserBalance(userId) {
    // ለጊዜው ከLocalStorage ወይም ከDatabase ይመጣል። ለምሳሌ፡
    return parseFloat(localStorage.getItem(`balance_${userId}`)) || 0.00;
}

function updateUserBalance(userId, newAmount) {
    localStorage.setItem(`balance_${userId}`, newAmount.toFixed(2));
    // በዋናው ገጽ ላይ እንዲታይ ያደርጋል
    if(document.getElementById('balance-display')) {
        document.getElementById('balance-display').innerText = `ETB ${newAmount.toFixed(2)}`;
    }
}
