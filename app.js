// 1. የጨዋታው መነሻ ዳታ (Initial Data)
const stakes = [10, 20, 30, 50, 100, 150];
let currentStake = 0;
let timeLeft = 60; // 60 ሰከንድ ካውንት ዳውን
let selectedCards = new Set();
let timerInterval;

const stakeList = document.getElementById('stake-list');
const cardGrid = document.getElementById('card-grid');

// 2. የStake ዝርዝርን በስክሪኑ ላይ መፍጠር
function initStakeScreen() {
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        // Possible win መጀመሪያ ላይ 0 ነው (ምክንያቱም ማንም ገና አልገዛም)
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span class="timer-display" id="timer-${s}">01:00</span>
            <span id="win-${s}">0.00 Birr</span>
            <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
        `;
        stakeList.appendChild(row);
    });
    startMainTimers();
}

// 3. የ60 ሰከንድ Countdown Timer ሎጂክ
function startMainTimers() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 60; // እንደገና ይጀምራል (ለሚቀጥለው ዙር)
            checkGameStart();
        }

        // ሁሉንም የሰከንድ ማሳያዎች ማደስ
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        document.querySelectorAll('.timer-display').forEach(el => {
            el.innerText = timeStr;
            if (timeLeft <= 10) el.style.color = "red"; // ከ10 ሰከንድ በታች ሲሆን ቀይ ይበራል
            else el.style.color = "white";
        });
    }, 1000);
}

// 4. የካርታ መምረጫ ገጽ መክፈት
function openCardSelection(stake) {
    currentStake = stake;
    selectedCards.clear();
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updatePossibleWinHeader();
    generateCards();
}

// 5. 143 ካርታዎችን መፍጠር (Image 2 መሰረት)
function generateCards() {
    cardGrid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = 'card-num';
        card.innerText = i;
        card.onclick = () => toggleCard(card, i);
        cardGrid.appendChild(card);
    }
}

// 6. ካርታ ሲመረጥ ሰማያዊ ማድረግ እና "Possible Win" ማስላት
function toggleCard(element, cardId) {
    if (selectedCards.has(cardId)) {
        selectedCards.delete(cardId);
        element.classList.remove('selected');
    } else {
        selectedCards.add(cardId);
        element.classList.add('selected');
    }
    updatePossibleWinHeader();
}

// 7. Possible Win ማስሊያ ፎርሙላ (stake * 0.85 * selected_cards)
function updatePossibleWinHeader() {
    const count = selectedCards.size;
    const possibleWin = (currentStake * 0.85 * count).toFixed(2);
    
    // በስክሪኑ ላይ ያለውን Win መጠን ማደስ
    const winDisplay = document.getElementById(`win-${currentStake}`);
    if (winDisplay) winDisplay.innerText = `${possibleWin} Birr`;
    
    // ለተመረጡት ካርታዎች ማሳያ (አማራጭ)
    console.log(`Stake: ${currentStake}, Cards: ${count}, Win: ${possibleWin}`);
}

// 8. ጊዜው ሲያልቅ ወደ ጨዋታው መውሰጃ
function checkGameStart() {
    if (selectedCards.size > 0) {
        alert("ጊዜው አልቋል! ወደ ጨዋታው እየገባህ ነው...");
        // እዚህ ጋር ወደ እውነተኛው የቢንጎ ኳስ መጥሪያ ገጽ ይወሰዳል
    } else {
        // ካርታ ያልገዛ ሰው ቀጣዩን ዙር ይጠብቃል
        console.log("ምንም ካርታ አልተገዛም፣ ቀጣዩን ዙር ይጠብቁ።");
    }
}

function showStakeScreen() {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.remove('hidden');
}

// ፕሮግራሙን ማስጀመር
initStakeScreen();
