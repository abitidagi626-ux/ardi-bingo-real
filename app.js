const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null, timeLeft = 60, pendingCardId = null;
let boughtCardsNumbers = {}, drawnNumbers = new Set(), markedByPlayer = new Set();
const stakeData = {};
stakes.forEach(s => stakeData[s] = { bought: new Set() });

function init() {
    const list = document.getElementById('stake-list');
    list.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s}</b></span>
            <span class="timer-display">00:60</span>
            <span id="win-${s}">0.00</span>
            <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
        `;
        list.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    const timer = setInterval(() => {
        timeLeft--;
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;

        if (timeLeft <= 0) {
            clearInterval(timer);
            autoStartGame();
        }
    }, 1000);
}

function openCardSelection(stake) {
    currentStake = stake;
    document.getElementById('card-price-info').innerText = `${stake} Birr Per Card`;
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

function showPreview(id) {
    if(stakeData[currentStake].bought.has(id)) return;
    pendingCardId = id;
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    const nums = generateBingoNumbers();
    nums.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'arena-cell';
        cell.innerText = idx === 12 ? 'F' : n;
        previewGrid.appendChild(cell);
    });
    boughtCardsNumbers[id] = nums; 
    document.getElementById('card-modal').classList.remove('hidden');
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    const totalWin = (currentStake * stakeData[currentStake].bought.size * 0.85).toFixed(2);
    document.getElementById('active-alert').innerText = `ACTIVE AMOUNT: ${totalWin} ETB`;
    document.getElementById('active-alert').style.display = 'block';
    document.getElementById(`win-${currentStake}`).innerText = totalWin;
    closeModal();
    generateCardGrid();
}

function autoStartGame() {
    let playedStake = stakes.find(s => stakeData[s].bought.size > 0);
    if (playedStake) {
        startBingoArena(playedStake);
    } else {
        alert("Time is up! No cards bought.");
        location.reload();
    }
}

function startBingoArena(stake) {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // Numbers Board (1-75)
    const board = document.getElementById('numbers-board');
    board.innerHTML = "";
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-cell'; div.id = `ball-${i}`; div.innerText = i;
        board.appendChild(div);
    }

    // Player Card
    const firstId = Array.from(stakeData[stake].bought)[0];
    const myNums = boughtCardsNumbers[firstId];
    const arenaCard = document.getElementById('arena-card');
    arenaCard.innerHTML = "";
    markedByPlayer.add("F");

    myNums.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
        div.innerText = idx === 12 ? 'F' : n;
        div.onclick = () => {
            if (drawnNumbers.has(n) || idx === 12) {
                div.classList.add('marked');
                markedByPlayer.add(idx === 12 ? "F" : n);
                checkWin(myNums);
            }
        };
        arenaCard.appendChild(div);
    });

    // Start Ball Drawing
    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    const gameInt = setInterval(() => {
        if (idx >= 75) { clearInterval(gameInt); return; }
        let drawn = pool[idx];
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        if(document.getElementById(`ball-${drawn}`)) document.getElementById(`ball-${drawn}`).classList.add('hit');
        idx++;
    }, 3000);
}

function generateBingoNumbers() {
    let card = [];
    for(let i=0; i<5; i++) {
        let pool = Array.from({length: 15}, (_, j) => (i*15)+j+1).sort(() => Math.random()-0.5);
        for(let r=0; r<5; r++) card[r*5 + i] = pool[r];
    }
    return card;
}

function checkWin(card) {
    const wins = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
    const won = wins.some(w => w.every(i => markedByPlayer.has(i === 12 ? "F" : card[i])));
    if (won) document.getElementById('bingo-btn').style.display = 'block';
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }
function claimBingo() { alert("BINGO! You Won!"); location.reload(); }

window.onload = init;
