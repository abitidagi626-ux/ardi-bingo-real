const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let timeLeft = 60;
let pendingCardId = null;
let gameInterval = null;

const stakeData = {
    10: { bought: new Map(), timer: 60 },
    20: { bought: new Map(), timer: 60 },
    30: { bought: new Map(), timer: 60 },
    50: { bought: new Map(), timer: 60 },
    80: { bought: new Map(), timer: 60 },
    100: { bought: new Map(), timer: 60 },
    150: { bought: new Map(), timer: 60 },
    200: { bought: new Map(), timer: 60 }
};

function init() {
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span id="timer-${s}">00:60</span>
            <span id="win-${s}">0.00 Birr</span>
            <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
        `;
        stakeList.appendChild(row);
    });
    startSystemTimer();
}

function startSystemTimer() {
    setInterval(() => {
        stakes.forEach(s => {
            stakeData[s].timer--;
            if (stakeData[s].timer <= 0) {
                // Timer 0 ሲሆን ካርታ ከገዛ ወደ ጨዋታው ይወሰዳል
                if (stakeData[s].bought.size > 0 && currentStake === s) {
                    startBingoGame(s);
                }
                stakeData[s].timer = 60; // Reset
            }
            const timeStr = `00:${stakeData[s].timer < 10 ? '0' + stakeData[s].timer : stakeData[s].timer}`;
            const el = document.getElementById(`timer-${s}`);
            if(el) el.innerText = timeStr;
        });
    }, 1000);
}

function openCardSelection(stake) {
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    generateCardGrid();
}

function generateCardGrid() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = `card-num ${stakeData[currentStake].bought.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => showPreview(i);
        grid.appendChild(card);
    }
}

function showPreview(id) {
    if(stakeData[currentStake].bought.has(id)) return;
    pendingCardId = id;
    const numbers = generateBingoNumbers();
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    numbers.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell' + (idx === 12 ? ' free' : '');
        cell.innerText = idx === 12 ? 'F' : n;
        previewGrid.appendChild(cell);
    });
    document.getElementById('card-modal').dataset.pendingNumbers = JSON.stringify(numbers);
    document.getElementById('card-modal').classList.remove('hidden');
}

function confirmPurchase() {
    const nums = JSON.parse(document.getElementById('card-modal').dataset.pendingNumbers);
    stakeData[currentStake].bought.set(pendingCardId, nums);
    
    // ስሌት፡ stake * number of cards * 0.85
    const possibleWin = (currentStake * stakeData[currentStake].bought.size * 0.85).toFixed(2);
    document.getElementById(`win-${currentStake}`).innerText = `${possibleWin} Birr`;
    
    closeModal();
    generateCardGrid();
}

// ዋናው የጨዋታ ገጽ (Image 2 style)
function startBingoGame(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.add('hidden');
    const gameScreen = document.getElementById('game-screen');
    gameScreen.classList.remove('hidden');

    // 1-75 ቁጥሮችን መደርደር
    const board = document.getElementById('numbers-board');
    board.innerHTML = "";
    for(let i=1; i<=75; i++) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.id = `ball-${i}`;
        ball.innerText = i;
        board.appendChild(ball);
    }

    // የመጀመሪያውን የተገዛ ካርታ ማሳየት
    const firstCardEntry = stakeData[stake].bought.entries().next().value;
    displayActiveCard(firstCardEntry[0], firstCardEntry[1]);
    
    // Random ቁጥር ማውጣት መጀመር
    let calledNumbers = [];
    gameInterval = setInterval(() => {
        if(calledNumbers.length >= 75) clearInterval(gameInterval);
        let rand;
        do { rand = Math.floor(Math.random() * 75) + 1; } while(calledNumbers.includes(rand));
        calledNumbers.push(rand);
        document.getElementById(`ball-${rand}`).classList.add('called');
    }, 2000);
}

function displayActiveCard(id, numbers) {
    document.getElementById('active-card-id').innerText = id;
    const grid = document.getElementById('bingo-grid-view');
    grid.innerHTML = "";
    numbers.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'bingo-cell';
        cell.innerText = idx === 12 ? 'F' : n;
        grid.appendChild(cell);
    });
}

function generateBingoNumbers() {
    let card = [];
    const ranges = [[1,15], [16,30], [31,45], [46,60], [61,75]];
    let columns = ranges.map(r => {
        let p = []; for(let i=r[0]; i<=r[1]; i++) p.push(i);
        return p.sort(() => Math.random() - 0.5).slice(0, 5);
    });
    for(let r=0; r<5; r++) for(let c=0; c<5; c++) card.push(columns[c][r]);
    return card;
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { 
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.remove('hidden'); 
}

init();
