const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null, timeLeft = 60, pendingCardId = null;
let boughtCardsNumbers = {}, drawnNumbers = new Set(), markedByPlayer = new Set();

const stakeData = { 10: { bought: new Set() }, 20: { bought: new Set() }, 30: { bought: new Set() }, 50: { bought: new Set() }, 80: { bought: new Set() }, 100: { bought: new Set() }, 150: { bought: new Set() }, 200: { bought: new Set() } };

function init() {
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `<span><b>${s} birr</b></span><span class="timer-display">00:60</span><span id="win-${s}">0.00</span><button class="join-btn" onclick="openCardSelection(${s})">Join »</button>`;
        stakeList.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) { timeLeft = 0; clearInterval(timerInterval); autoStartGame(); }
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
    }, 1000);
}

function autoStartGame() {
    let playedStake = stakes.find(s => stakeData[s].bought.size > 0);
    if (playedStake) startBingoArena(playedStake);
    else { alert("No cards bought!"); location.reload(); }
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
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = `card-num ${stakeData[currentStake].bought.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => showPreview(i);
        grid.appendChild(card);
    }
}

let lastPreview = [];
function showPreview(id) {
    if(stakeData[currentStake].bought.has(id)) return;
    pendingCardId = id;
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    lastPreview = generateBingoNumbers();
    lastPreview.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell' + (idx === 12 ? ' free' : '');
        cell.innerText = idx === 12 ? 'F' : n;
        cell.style.cssText = "border:1px solid #ddd; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-weight:bold;";
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
    for(let r=0; r<5; r++) for(let c=0; c<5; c++) card.push(columns[c][r]);
    return card;
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = lastPreview; 
    const totalWin = (currentStake * stakeData[currentStake].bought.size * 0.85).toFixed(2);
    const alertEl = document.getElementById('active-alert');
    alertEl.innerText = `ACTIVE AMOUNT: ${totalWin} ETB`;
    alertEl.style.display = 'block';
    document.getElementById(`win-${currentStake}`).innerText = `${totalWin} Birr`;
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
    markedByPlayer.add("F");

    myNums.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
        div.innerText = idx === 12 ? 'F' : n;
        div.onclick = () => {
            if (idx === 12) return;
            if (drawnNumbers.has(n)) {
                div.classList.add('marked');
                markedByPlayer.add(n);
                checkWin(myNums);
            }
        };
        arenaCard.appendChild(div);
    });

    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    const gameInt = setInterval(() => {
        if (idx >= 75) { clearInterval(gameInt); return; }
        let drawn = pool[idx];
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        document.getElementById(`ball-${drawn}`).classList.add('hit');
        idx++;
    }, 3000); 
}

function checkWin(card) {
    const wins = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
    const won = wins.some(w => w.every(i => markedByPlayer.has(i === 12 ? "F" : card[i])));
    if (won) document.getElementById('bingo-btn').style.display = 'block';
}

function claimBingo() { alert("BINGO! You Won!"); location.reload(); }
function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
