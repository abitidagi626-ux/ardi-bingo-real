const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let timeLeft = 60;
let pendingCardId = null;
let boughtCardsMap = {}; // የትኛው Stake ላይ ምን እንደተገዛ

const stakeData = {
    10: { bought: new Set(), numbers: [] },
    20: { bought: new Set(), numbers: [] },
    30: { bought: new Set(), numbers: [] },
    50: { bought: new Set(), numbers: [] },
    80: { bought: new Set(), numbers: [] },
    100: { bought: new Set(), numbers: [] },
    150: { bought: new Set(), numbers: [] },
    200: { bought: new Set(), numbers: [] }
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
    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(interval);
            checkAndStartGame();
        }
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
    }, 1000);
}

// Timer 0 ሲሆን የሚሰራው ስራ
function checkAndStartGame() {
    let playedStake = null;
    for (let s of stakes) {
        if (stakeData[s].bought.size > 0) {
            playedStake = s;
            break; 
        }
    }

    if (playedStake) {
        startBingoGame(playedStake);
    } else {
        alert("Time is up! No cards bought.");
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
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    
    const nums = generateBingoNumbers();
    boughtCardsMap[id] = nums; // ለጊዜው መረጃውን ያዝ
    
    nums.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell' + (idx === 12 ? ' free' : '');
        cell.innerText = idx === 12 ? 'F' : n;
        previewGrid.appendChild(cell);
    });
    document.getElementById('card-modal').classList.remove('hidden');
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    
    // Possible Win: stake * number of cards * 0.85
    const count = stakeData[currentStake].bought.size;
    const win = (currentStake * count * 0.85).toFixed(2);
    document.getElementById(`win-${currentStake}`).innerText = `${win} Birr`;
    
    closeModal();
    generateCardGrid();
}

// --- GAME ARENA LOGIC (IMAGE 2) ---
function startBingoGame(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    const firstCardId = Array.from(stakeData[stake].bought)[0];
    document.getElementById('game-stake').innerText = stake;
    document.getElementById('game-card-no').innerText = firstCardId;
    document.getElementById('game-win').innerText = (stake * stakeData[stake].bought.size * 0.85).toFixed(2);

    // 1-75 ቦርድ ፍጠር
    const board = document.getElementById('bingo-board');
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-num';
        div.id = `board-${i}`;
        div.innerText = i;
        board.appendChild(div);
    }

    // የተገዛውን ካርታ በቀኝ በኩል አሳይ
    const playerArea = document.getElementById('player-card-display');
    const myNums = boughtCardsMap[firstCardId];
    myNums.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'preview-cell';
        div.id = `mycell-${n}`;
        div.innerText = idx === 12 ? 'F' : n;
        playerArea.style.display = 'grid';
        playerArea.style.gridTemplateColumns = 'repeat(5, 1fr)';
        playerArea.appendChild(div);
    });

    // ቁጥሮችን በየ 3 ሰከንዱ ማውጣት ጀምር
    let allNumbers = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let index = 0;
    const gameInt = setInterval(() => {
        if(index >= 75) { clearInterval(gameInt); return; }
        
        let drawn = allNumbers[index];
        document.getElementById('current-ball').innerText = drawn;
        
        // ቦርዱ ላይ ምልክት አድርግ
        document.getElementById(`board-${drawn}`).classList.add('active');
        
        // ተጫዋቹ ካርታ ላይ ካለ ምልክት አድርግ
        const myCell = document.getElementById(`mycell-${drawn}`);
        if(myCell) myCell.classList.add('marked');
        
        index++;
    }, 3000);
}

// Helpers
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
    document.getElementById('stake-screen').classList.remove('hidden'); 
}

init();
