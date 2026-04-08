const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let lockStake = null; // አንድ ጊዜ ካርድ የተገዛበትን ስቴክ ለመቆለፍ
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
            <button class="join-btn" id="btn-join-${s}" onclick="openCardSelection(${s})">Join »</button>
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
    if (lockStake && stakeData[lockStake].bought.size > 0) {
        startBingoArena(lockStake);
    } else {
        location.reload(); 
    }
}

function openCardSelection(stake) {
    // ሌላ ስቴክ ላይ ካርድ ተገዝቶ ከሆነ መከልከል
    if (lockStake && lockStake !== stake) {
        alert("You have already purchased cards for " + lockStake + " Birr stake. You cannot switch stakes.");
        return;
    }
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updateCardCountUI();
    generateCardGrid();
}

function updateCardCountUI() {
    const count = stakeData[currentStake].bought.size;
    document.getElementById('card-count-info').innerText = count;
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
    
    // ከ 4 ካርድ በላይ መግዛትን መከልከል
    if (stakeData[currentStake].bought.size >= 4) {
        alert("Maximum limit reached! You can only buy up to 4 cards.");
        return;
    }

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
    lockStake = currentStake; // ስቴክ ተቆለፈ
    
    // የጆይን በተኖችን ማሰናከል (ከተቆለፈው ውጭ)
    stakes.forEach(s => {
        if(s !== lockStake) {
            const btn = document.getElementById(`btn-join-${s}`);
            if(btn) btn.disabled = true;
        }
    });

    const count = stakeData[currentStake].bought.size;
    const win = (currentStake * count * 0.80).toFixed(2);
    document.getElementById(`win-${currentStake}`).innerText = `${win} Birr`;
    document.getElementById('arena-win-amount').innerText = `${win} Birr`;
    
    updateCardCountUI();
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

    const cardsContainer = document.getElementById('arena-cards-container');
    const boughtIds = Array.from(stakeData[stake].bought);
    
    boughtIds.forEach(id => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'player-card-arena';
        cardDiv.id = `arena-card-${id}`;
        const nums = boughtCardsNumbers[id];
        nums.forEach((n, idx) => {
            const cell = document.createElement('div');
            cell.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
            cell.id = `cell-${id}-${n}`;
            cell.innerText = idx === 12 ? 'F' : n;
            cardDiv.appendChild(cell);
        });
        cardsContainer.appendChild(cardDiv);
    });

    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    gameInterval = setInterval(() => {
        if (idx >= 75) { clearInterval(gameInterval); return; }
        let drawn = pool[idx];
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        if(document.getElementById(`ball-${drawn}`)) document.getElementById(`ball-${drawn}`).classList.add('hit');
        
        // በሁሉም ካርዶች ላይ ምልክት ማድረግ
        boughtIds.forEach(id => {
            const cell = document.getElementById(`cell-${id}-${drawn}`);
            if(cell) cell.classList.add('marked');
        });

        idx++;
    }, 3000);
}

function checkOneLineBingo(cardNums) {
    const lines = [
        [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
        [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
        [0,6,12,18,24], [4,8,12,16,20]
    ];
    return lines.some(line => line.every(i => i === 12 || drawnNumbers.has(cardNums[i])));
}

function manualBingoCheck() {
    const boughtIds = Array.from(stakeData[lockStake].bought);
    let isAnyWinner = false;
    
    boughtIds.forEach(id => {
        if(checkOneLineBingo(boughtCardsNumbers[id])) {
            isAnyWinner = true;
        }
    });

    if(isAnyWinner) {
        clearInterval(gameInterval);
        handleWin();
    } else {
        alert("Not Bingo yet! Keep playing.");
    }
}

function handleWin() {
    const overlay = document.getElementById('bingo-overlay');
    overlay.style.display = 'block';
    setTimeout(() => {
        location.reload();
    }, 3000);
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
