const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let timeLeft = 60;
let pendingCardId = null;
let boughtCardsNumbers = {}; 
let drawnNumbers = new Set(); // የወጡ ቁጥሮችን ለመያዝ
let markedByPlayer = new Set(); // ተጫዋቹ የነካቸውን ቁጥሮች ለመያዝ

const stakeData = {
    10: { bought: new Set() }, 20: { bought: new Set() }, 30: { bought: new Set() },
    50: { bought: new Set() }, 80: { bought: new Set() }, 100: { bought: new Set() },
    150: { bought: new Set() }, 200: { bought: new Set() }
};

function init() {
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span class="timer-display">00:60</span>
            <span id="win-${s}">0.00 Birr</span>
            <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
        `;
        stakeList.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timerInterval);
            autoStartGame(); 
        }
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
    }, 1000);
}

function autoStartGame() {
    let activeStake = stakes.find(s => stakeData[s].bought.size > 0);
    if (activeStake) {
        startBingoArena(activeStake);
    } else {
        alert("Time up! No cards were purchased.");
        location.reload();
    }
}

function openCardSelection(stake) {
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    generateCardGrid();
}

function generateCardGrid() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = "";
    const boughtInCurrentStake = stakeData[currentStake].bought;
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = `card-num ${boughtInCurrentStake.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => showPreview(i);
        grid.appendChild(card);
    }
}

let lastGeneratedNums = [];
function showPreview(id) {
    if(stakeData[currentStake].bought.has(id)) return;
    pendingCardId = id;
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    lastGeneratedNums = generateBingoNumbers();
    lastGeneratedNums.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell' + (idx === 12 ? ' free' : '');
        cell.innerText = idx === 12 ? 'F' : n;
        previewGrid.appendChild(cell);
    });
    document.getElementById('card-modal').classList.remove('hidden');
}

function generateBingoNumbers() {
    let card = [];
    const ranges = [[1,15], [16,30], [31,45], [46,60], [61,75]];
    let columns = ranges.map(range => {
        let pool = Array.from({length: 15}, (_, i) => range[0] + i).sort(() => Math.random() - 0.5);
        return pool.slice(0, 5);
    });
    for(let row=0; row<5; row++) for(let col=0; col<5; col++) card.push(columns[col][row]);
    return card;
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = lastGeneratedNums; 
    const numberOfCards = stakeData[currentStake].bought.size;
    const possibleWin = (currentStake * numberOfCards * 0.85).toFixed(2);
    
    // ነጥብ 2፡ ደራሽ amount በቀይ እንዲመጣ (HTML ላይ "active-alert" የሚል id ያለው div ያስፈልገዋል)
    const alertEl = document.getElementById('active-alert');
    if(alertEl) {
        alertEl.innerText = `ACTIVE AMOUNT: ${possibleWin} ETB`;
        alertEl.style.display = 'block';
    }

    const winEl = document.getElementById(`win-${currentStake}`);
    if(winEl) winEl.innerText = `${possibleWin} Birr`;
    closeModal();
    generateCardGrid();
}

function startBingoArena(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    const board = document.getElementById('numbers-board');
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-cell'; div.id = `ball-${i}`; div.innerText = i;
        board.appendChild(div);
    }

    const firstId = Array.from(stakeData[stake].bought)[0];
    const myNums = boughtCardsNumbers[firstId];
    const arenaCard = document.getElementById('arena-card');
    
    markedByPlayer.add("F"); // Free space በነባሪ የተመረጠ ነው

    myNums.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
        div.innerText = idx === 12 ? 'F' : n;
        
        // ነጥብ 1: Manual Click - ተጫዋቹ ሲነካው ብቻ እንዲሞላ
        div.onclick = () => {
            if (idx === 12) return;
            if (drawnNumbers.has(n)) {
                div.classList.add('marked');
                markedByPlayer.add(n);
                checkBingoWin(myNums); // ለእያንዳንዱ ክሊክ ቢንጎ መኖሩን ይፈትሻል
            }
        };
        arenaCard.appendChild(div);
    });

    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    const gameInt = setInterval(() => {
        if (idx >= 75) { clearInterval(gameInt); return; }
        let drawn = pool[idx];
        drawnNumbers.add(drawn); // የወጣው ቁጥር ይመዘገባል
        document.getElementById('current-ball').innerText = drawn;
        document.getElementById(`ball-${drawn}`).classList.add('hit');
        // አውቶ-ክሊክ እዚህ ጋር ተወግዷል
        idx++;
    }, 3000); 
}

// ነጥብ 3: 1 መስመር ሲሞላ ቢንጎ እንዲል
function checkBingoWin(cardNumbers) {
    const wins = [
        [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24], // Horizontal
        [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24], // Vertical
        [0,6,12,18,24], [4,8,12,16,20] // Diagonal
    ];

    const isBingo = wins.some(pattern => 
        pattern.every(index => {
            const val = (index === 12) ? "F" : cardNumbers[index];
            return markedByPlayer.has(val);
        })
    );

    if (isBingo) {
        const bingoBtn = document.getElementById('bingo-btn');
        if(bingoBtn) bingoBtn.style.display = 'block';
    }
}

function claimBingo() {
    alert("BINGO! You Won!");
    location.reload();
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); pendingCardId = null; }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
