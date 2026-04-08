const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null;
let lockStake = null;
let timeLeft = 60;
let pendingCardId = null;
let boughtCardsNumbers = {}; 
let drawnNumbers = new Set();
let playerMarkedNumbers = {}; // ተጫዋቹ የነካቸውን ቁጥሮች ለመያዝ
let gameInterval;

const stakeData = {
    10: { bought: new Set() }, 20: { bought: new Set() }, 30: { bought: new Set() },
    50: { bought: new Set() }, 80: { bought: new Set() }, 100: { bought: new Set() },
    150: { bought: new Set() }, 200: { bought: new Set() }
};

function init() {
    const list = document.getElementById('stake-list');
    list.innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; padding:10px; font-size:11px; color:#aaa; text-align:center;">
        <span>Stake</span><span>Active</span><span>Possible Win</span><span>Join</span></div>`;
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.style = "display:grid; grid-template-columns:1fr 1fr 1fr 1fr; padding:15px 5px; border-bottom:1px solid #004d40; text-align:center; align-items:center;";
        row.innerHTML = `<span><b>${s}</b></span><span class="timer-display">00:60</span><span id="win-${s}">0.00</span>
            <button class="join-btn" id="btn-join-${s}" onclick="openCardSelection(${s})" style="background:#efae10; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">Join</button>`;
        list.appendChild(row);
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
            if (lockStake && stakeData[lockStake].bought.size > 0) startBingoArena(lockStake); 
            else location.reload();
        }
    }, 1000);
}

function openCardSelection(stake) {
    if (lockStake && lockStake !== stake) return alert("Locked to " + lockStake + " stake.");
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updateCardCountUI();
    generateCardGrid();
}

function updateCardCountUI() {
    document.getElementById('card-count-info').innerText = stakeData[currentStake].bought.size;
}

function generateCardGrid() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = `card-num ${stakeData[currentStake].bought.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => { if(stakeData[currentStake].bought.size < 4) showPreview(i); else alert("Max 4 Cards"); };
        grid.appendChild(card);
    }
}

function showPreview(id) {
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
    let columns = ranges.map(range => Array.from({length: 15}, (_, i) => range[0] + i).sort(() => Math.random() - 0.5).slice(0, 5));
    for(let r=0; r<5; r++) for(let c=0; c<5; c++) card.push(columns[c][r]);
    return card;
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = lastGeneratedNums;
    playerMarkedNumbers[pendingCardId] = new Set([12]); // FREE space is auto-marked
    lockStake = currentStake;
    const win = (currentStake * stakeData[currentStake].bought.size * 0.8).toFixed(2);
    document.getElementById(`win-${currentStake}`).innerText = win;
    document.getElementById('arena-win-amount').innerText = win;
    closeModal(); updateCardCountUI(); generateCardGrid();
}

function startBingoArena(stake) {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    const board = document.getElementById('numbers-board');
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div'); div.className = 'board-cell'; div.id = `ball-${i}`; div.innerText = i;
        board.appendChild(div);
    }

    const container = document.getElementById('arena-cards-container');
    stakeData[stake].bought.forEach(id => {
        const wrapper = document.createElement('div');
        wrapper.className = 'arena-card-wrapper';
        wrapper.innerHTML = `<div class="card-label-small">Card #${id}</div>`;
        
        const cardGrid = document.createElement('div');
        cardGrid.className = 'player-card-arena';
        boughtCardsNumbers[id].forEach((n, idx) => {
            const cell = document.createElement('div');
            cell.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
            cell.innerText = idx === 12 ? 'F' : n;
            cell.onclick = () => toggleMark(id, idx, n, cell);
            cardGrid.appendChild(cell);
        });
        wrapper.appendChild(cardGrid);
        
        const btn = document.createElement('button');
        btn.className = 'bingo-btn-card';
        btn.innerText = 'BINGO';
        btn.onclick = () => manualBingoCheck(id);
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
    });

    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    gameInterval = setInterval(() => {
        if(idx >= 75) return clearInterval(gameInterval);
        let drawn = pool[idx];
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        if(document.getElementById(`ball-${drawn}`)) document.getElementById(`ball-${drawn}`).classList.add('hit');
        idx++;
    }, 3500);
}

function toggleMark(cardId, index, number, element) {
    if (index === 12) return; 
    if (!drawnNumbers.has(number)) return; // የወጣ ቁጥር ካልሆነ ክሊክ አይሰራም

    if (playerMarkedNumbers[cardId].has(index)) {
        playerMarkedNumbers[cardId].delete(index);
        element.classList.remove('marked');
    } else {
        playerMarkedNumbers[cardId].add(index);
        element.classList.add('marked');
    }
}

function manualBingoCheck(cardId) {
    const marked = playerMarkedNumbers[cardId];
    const lines = [
        [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
        [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
        [0,6,12,18,24],[4,8,12,16,20]
    ];
    const isWin = lines.some(line => line.every(idx => marked.has(idx)));
    if (isWin) {
        clearInterval(gameInterval);
        document.getElementById('bingo-overlay').style.display = 'block';
        setTimeout(() => location.reload(), 3000);
    } else {
        alert("Not Bingo yet! Check your marked numbers.");
    }
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
