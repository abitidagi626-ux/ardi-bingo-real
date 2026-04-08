const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let timeLeft = 60;
let pendingCardId = null;
let boughtCardsNumbers = {}; 
let lastGeneratedNums = [];
let drawnNumbers = new Set();
let gameInterval;

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
    const timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
            document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
            if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
        } else {
            clearInterval(timer);
            autoStartGame();
        }
    }, 1000);
}

function autoStartGame() {
    let activeStake = stakes.find(s => stakeData[s].bought.size > 0);
    if (activeStake) {
        startBingoArena(activeStake);
    } else {
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
    const bought = stakeData[currentStake].bought;
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = `card-num ${bought.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => showPreview(i);
        grid.appendChild(card);
    }
}

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
    const count = stakeData[currentStake].bought.size;
    const win = (currentStake * count * 0.80).toFixed(2); // 80% Win Amount
    document.getElementById(`win-${currentStake}`).innerText = `${win} Birr`;
    document.getElementById('arena-win-amount').innerText = `${win} Birr`;
    closeModal();
    generateCardGrid();
}

function startBingoArena(stake) {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.add('hidden');
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
    myNums.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
        div.id = `my-num-${n}`;
        div.innerText = idx === 12 ? 'F' : n;
        arenaCard.appendChild(div);
    });

    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    gameInterval = setInterval(() => {
        if (idx >= 75) { clearInterval(gameInterval); return; }
        let drawn = pool[idx];
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        document.getElementById(`ball-${drawn}`).classList.add('hit');
        const match = document.getElementById(`my-num-${drawn}`);
        if(match) match.classList.add('marked');
        
        if (checkOneLineBingo(myNums)) {
            clearInterval(gameInterval);
            handleWin();
        }
        idx++;
    }, 3000);
}

function checkOneLineBingo(card) {
    const lines = [
        [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24], // Rows
        [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24], // Cols
        [0,6,12,18,24], [4,8,12,16,20] // Diagonals
    ];
    return lines.some(line => line.every(i => i === 12 || drawnNumbers.has(card[i])));
}

function handleWin() {
    const overlay = document.getElementById('bingo-overlay');
    overlay.style.display = 'block';
    setTimeout(() => {
        location.reload(); // በ 3 ሰከንድ ውስጥ ወደ መጀመሪያው ገጽ ይመለሳል
    }, 3000);
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
