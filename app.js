// 1. የጨዋታው መነሻ ዳታ (Initial Data)
const stakes = [10, 20, 30, 50, 100, 150];
let currentStake = 0;
let timeLeft = 60;
let timerInterval;

// እያንዳንዱ ስቴክ የራሱ የተመረጡ ካርታዎች እንዲኖሩት በ Object እናስቀምጣለን
let stakeData = {
    10: new Set(),
    20: new Set(),
    30: new Set(),
    50: new Set(),
    100: new Set(),
    150: new Set()
};

const stakeList = document.getElementById('stake-list');
const cardGrid = document.getElementById('card-grid');

// 2. የStake ዝርዝርን በስክሪኑ ላይ መፍጠር
function initStakeScreen() {
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
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
            timeLeft = 60;
            checkGameStart();
        }

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        document.querySelectorAll('.timer-display').forEach(el => {
            el.innerText = timeStr;
            if (timeLeft <= 10) el.style.color = "red";
            else el.style.color = "white";
        });
    }, 1000);
}

// 4. የካርታ መምረጫ ገጽ መክፈት
function openCardSelection(stake) {
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updatePossibleWinHeader();
    generateCards();
}

// 5. የቢንጎ ካርታ ቁጥሮችን ማመንጨት (Image 2 መሰረት)
// B:1-15, I:16-30, N:31-45, G:46-60, O:61-75
function generateBingoNumbers() {
    let numbers = [];
    const ranges = [
        { min: 1, max: 15 },  // B
        { min: 16, max: 30 }, // I
        { min: 31, max: 45 }, // N
        { min: 46, max: 60 }, // G
        { min: 61, max: 75 }  // O
    ];

    ranges.forEach(range => {
        let columnNumbers = [];
        while (columnNumbers.length < 5) {
            let num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            if (!columnNumbers.includes(num)) columnNumbers.push(num);
        }
        numbers.push(...columnNumbers);
    });
    return numbers;
}

// 6. 143 ካርታዎችን መፍጠር
function generateCards() {
    cardGrid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = 'card-num';
        // ቀደም ብሎ በዚህ ስቴክ ተመርጦ ከሆነ ሰማያዊ እንዲሆን
        if (stakeData[currentStake].has(i)) {
            card.classList.add('selected');
        }
        card.innerText = i;
        card.onclick = () => toggleCard(card, i);
        cardGrid.appendChild(card);
    }
}

// 7. ካርታ ሲመረጥ ሰማያዊ ማድረግ እና በየስቴኩ መለየት
function toggleCard(element, cardId) {
    if (stakeData[currentStake].has(cardId)) {
        stakeData[currentStake].delete(cardId);
        element.classList.remove('selected');
    } else {
        stakeData[currentStake].add(cardId);
        element.classList.add('selected');
    }
    updatePossibleWinHeader();
}

// 8. Possible Win ማስሊያ (stake * 0.85 * selected_cards)
function updatePossibleWinHeader() {
    const count = stakeData[currentStake].size;
    const possibleWin = (currentStake * 0.85 * count).toFixed(2);
    
    const winDisplay = document.getElementById(`win-${currentStake}`);
    if (winDisplay) winDisplay.innerText = `${possibleWin} Birr`;
}

// 9. ጊዜው ሲያልቅ (Game Logic)
function checkGameStart() {
    let totalSelected = 0;
    stakes.forEach(s => totalSelected += stakeData[s].size);

    if (totalSelected > 0) {
        console.log("ጨዋታው እየጀመረ ነው...");
        // ወደ ኳስ መጥሪያ ገጽ ይወስዳል
    }
}

function showStakeScreen() {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.remove('hidden');
}

// ፕሮግራሙን ማስጀመር
initStakeScreen();
