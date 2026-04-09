const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null, lockStake = null, timeLeft = 60, pendingCardId = null;
let boughtCardsNumbers = {}, drawnNumbers = new Set(), playerMarkedNumbers = {}, gameInterval;

const stakeData = { 10: { bought: new Set() }, 20: { bought: new Set() }, 30: { bought: new Set() }, 50: { bought: new Set() }, 80: { bought: new Set() }, 100: { bought: new Set() }, 150: { bought: new Set() }, 200: { bought: new Set() } };

function getFixedNumbers(cardId) {
    let card = [];
    const ranges = [[1,15], [16,30], [31,45], [46,60], [61,75]];
    ranges.forEach((range, colIdx) => {
        let colNumbers = [];
        for (let i = range[0]; i <= range[1]; i++) colNumbers.push(i);
        let seed = cardId + colIdx;
        for (let i = colNumbers.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            let rnd = seed / 233280;
            let j = Math.floor(rnd * (i + 1));
            [colNumbers[i], colNumbers[j]] = [colNumbers[j], colNumbers[i]];
        }
        card.push(colNumbers.slice(0, 5));
    });
    let finalCard = [];
    for(let r=0; r<5; r++) for(let c=0; c<5; c++) finalCard.push(card[c][r]);
    return finalCard;
}

function init() {
    const list = document.getElementById('stake-list');
    list.innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; padding:10px 5px; font-size:11px; color:#aaa; text-align:center; border-bottom:1px solid #004d40;"><span>Stake</span><span>Active</span><span>Win</span><span>Join</span></div>`;
    stakes.forEach(s => {
        const row = document.createElement('div'); row.className = 'stake-row';
        row.innerHTML = `<span><b>${s}</b></span><span class="timer-display">00:60</span><span id="win-${s}">0.00</span><button onclick="openCardSelection(${s})" style="background:#efae10; border:none; border-radius:4px; padding:4px; cursor:pointer; font-weight:bold; font-size:11px;">Join »</button>`;
        list.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    const timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            document.querySelectorAll('.timer-display').forEach(el => el.innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`);
            if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
        } else { clearInterval(timer); if (lockStake) startBingoArena(lockStake); else location.reload(); }
    }, 1000);
}

function openCardSelection(stake) {
    if (lockStake && lockStake !== stake) return alert("Stake locked to " + lockStake);
    currentStake = stake;
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updateCardCountUI(); generateCardGrid();
}

function updateCardCountUI() { document.getElementById('card-count-info').innerText = stakeData[currentStake].bought.size; }

function generateCardGrid() {
    const grid = document.getElementById('card-grid'); grid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div'); card.className = `card-num ${stakeData[currentStake].bought.has(i) ? 'bought' : ''}`;
        card.innerText = i; card.onclick = () => { if(stakeData[currentStake].bought.size < 4) showPreview(i); };
        grid.appendChild(card);
    }
}

function showPreview(id) {
    pendingCardId = id; 
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    const previewGrid = document.getElementById('preview-grid'); 
    previewGrid.innerHTML = "";
    let fixedNumbers = getFixedNumbers(id);
    fixedNumbers.forEach((n, idx) => {
        const cell = document.createElement('div'); 
        cell.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
        cell.style.border = "1px solid #ddd"; cell.style.aspectRatio = "1";
        cell.style.display = "flex"; cell.style.alignItems = "center"; cell.style.justifyContent = "center";
        cell.style.fontWeight = "bold"; cell.style.color = "black";
        cell.innerText = idx === 12 ? 'F' : n; 
        previewGrid.appendChild(cell);
    });
    document.getElementById('card-modal').classList.remove('hidden');
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = getFixedNumbers(pendingCardId);
    playerMarkedNumbers[pendingCardId] = new Set([12]);
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
        const div = document.createElement('div'); div.className = 'board-cell'; div.id = `ball-${i}`; div.innerText = i; board.appendChild(div);
    }
    const container = document.getElementById('arena-cards-container');
    stakeData[stake].bought.forEach(id => {
        const wrapper = document.createElement('div'); wrapper.className = 'arena-card-wrapper';
        wrapper.innerHTML = `<div class="card-label-small">CARD #${id}</div>`;
        const cardGrid = document.createElement('div'); cardGrid.className = 'player-card-arena';
        boughtCardsNumbers[id].forEach((n, idx) => {
            const cell = document.createElement('div'); cell.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
            cell.innerText = idx === 12 ? 'F' : n; 
            cell.onclick = () => { if(drawnNumbers.has(n)) { playerMarkedNumbers[id].add(idx); cell.classList.add('marked'); } };
            cardGrid.appendChild(cell);
        });
        wrapper.appendChild(cardGrid);
        const btn = document.createElement('button'); btn.className = 'bingo-btn-card'; btn.innerText = 'BINGO';
        btn.onclick = () => manualBingoCheck(id);
        wrapper.appendChild(btn); container.appendChild(wrapper);
    });
    let pool = Array.from({length:75}, (_,i)=>i+1).sort(()=>Math.random()-0.5), idx = 0;
    gameInterval = setInterval(() => {
        if(idx >= 75) return clearInterval(gameInterval);
        let drawn = pool[idx]; drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        if(document.getElementById(`ball-${drawn}`)) document.getElementById(`ball-${drawn}`).classList.add('hit');
        idx++;
    }, 3500);
}

function manualBingoCheck(id) {
    const marked = playerMarkedNumbers[id];
    const patterns = [
        [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24], 
        [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24], 
        [0,6,12,18,24],[4,8,12,16,20], [0, 4, 20, 24] 
    ];
    let winningPattern = patterns.find(p => p.every(idx => marked.has(idx)));
    if (winningPattern) { clearInterval(gameInterval); showBingoWinner(id, winningPattern); } 
    else { alert("Not Bingo yet!"); }
}

function showBingoWinner(cardId, pattern) {
    const overlay = document.getElementById('winner-display-overlay');
    const text = document.getElementById('winner-text');
    const preview = document.getElementById('winning-card-preview');
    text.innerText = `Card Number #${cardId} is the Winner!`;
    overlay.classList.remove('hidden');
    const cardGrid = document.createElement('div');
    cardGrid.className = 'player-card-arena';
    cardGrid.style.display = 'grid'; cardGrid.style.gridTemplateColumns = 'repeat(5, 1fr)'; cardGrid.style.gap = '2px';
    boughtCardsNumbers[cardId].forEach((n, idx) => {
        const cell = document.createElement('div'); cell.className = 'arena-cell';
        cell.style.width = '40px'; cell.style.height = '40px'; cell.style.border = '1px solid #ccc';
        cell.style.display = 'flex'; cell.style.alignItems = 'center'; cell.style.justifyContent = 'center';
        cell.style.fontWeight = 'bold'; cell.style.color = 'black';
        cell.innerText = idx === 12 ? 'F' : n;
        if (pattern.includes(idx)) cell.classList.add('winner-cell');
        cardGrid.appendChild(cell);
    });
    preview.innerHTML = ""; preview.appendChild(cardGrid);
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
