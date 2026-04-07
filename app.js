const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let timeLeft = 60;
let pendingCardId = null;
let boughtCardsNumbers = {}; // የገዛናቸውን ካርታዎች ቁጥሮች ለመያዝ

const stakeData = {
    10: { bought: new Set() },
    20: { bought: new Set() },
    30: { bought: new Set() },
    50: { bought: new Set() },
    80: { bought: new Set() },
    100: { bought: new Set() },
    150: { bought: new Set() },
    200: { bought: new Set() }
};

function init() {
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span class="timer-display" id="timer-${s}">00:60</span>
            <span id="win-${s}">0.00 Birr</span>
            <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
        `;
        stakeList.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    const timerInt = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timerInt);
            autoStartGame(); // ታይመሩ ሲያልቅ በራሱ ይጀምራል
        }
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
    }, 1000);
}

function autoStartGame() {
    let playedStake = null;
    for (let s of stakes) {
        if (stakeData[s].bought.size > 0) { playedStake = s; break; }
    }
    if (playedStake) {
        startBingoArena(playedStake);
    } else {
        alert("Time up! No cards bought.");
        location.reload();
    }
}

function openCardSelection(stake) {
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
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

let tempNumbers = [];
function showPreview(id) {
    if(stakeData[currentStake].bought.has(id)) return;
    pendingCardId = id;
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    tempNumbers = generateBingoNumbers();
    tempNumbers.forEach((n, idx) => {
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
        let pool = [];
        for(let i=range[0]; i<=range[1]; i++) pool.push(i);
        return pool.sort(() => Math.random() - 0.5).slice(0, 5);
    });
    for(let row=0; row<5; row++) {
        for(let col=0; col<5; col++) card.push(columns[col][row]);
    }
    return card;
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = tempNumbers; // ቁጥሮቹን አስቀምጥ
    const numberOfCards = stakeData[currentStake].bought.size;
    const possibleWin = (currentStake * numberOfCards * 0.85).toFixed(2);
    document.getElementById(`win-${currentStake}`).innerText = `${possibleWin} Birr`;
    closeModal();
    generateCardGrid();
}

// --- GAME ARENA (IMAGE 2) ---
function startBingoArena(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    const board = document.getElementById('numbers-board');
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-cell';
        div.id = `ball-${i}`;
        div.innerText = i;
        board.appendChild(div);
    }

    const firstCardId = Array.from(stakeData[stake].bought)[0];
    const arenaCard = document.getElementById('arena-card');
    arenaCard.style.display = 'grid';
    arenaCard.style.gridTemplateColumns = 'repeat(5, 1fr)';
    const myNums = boughtCardsNumbers[firstCardId];
    
    myNums.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'arena-cell';
        div.id = `my-num-${n}`;
        div.innerText = idx === 12 ? 'F' : n;
        arenaCard.appendChild(div);
    });

    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    const gameInt = setInterval(() => {
        if (idx >= 75) { clearInterval(gameInt); return; }
        let drawn = pool[idx];
        document.getElementById('current-ball').innerText = drawn;
        document.getElementById(`ball-${drawn}`).classList.add('hit');
        const match = document.getElementById(`my-num-${drawn}`);
        if(match) match.classList.add('marked');
        idx++;
    }, 3000);
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
