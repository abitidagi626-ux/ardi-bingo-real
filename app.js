const stakes = [10, 20, 30, 50, 100, 150];
let currentStake = null;
let timeLeft = 60;
let pendingCardId = null;

// ለእያንዳንዱ Stake የተገዙ ካርታዎችን ለይቶ ለመያዝ
const stakeData = {
    10: { bought: new Set() },
    20: { bought: new Set() },
    30: { bought: new Set() },
    50: { bought: new Set() },
    100: { bought: new Set() },
    150: { bought: new Set() }
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
    setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = 60;
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
    }, 1000);
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

function showPreview(id) {
    if(stakeData[currentStake].bought.has(id)) return;
    pendingCardId = id;
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    
    const numbers = generateBingoNumbers();
    numbers.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell' + (idx === 12 ? ' free' : '');
        cell.innerText = idx === 12 ? 'F' : n;
        previewGrid.appendChild(cell);
    });
    
    document.getElementById('card-modal').classList.remove('hidden');
}

// ምስል 1 ላይ በተጠቀሰው መሰረት 1-15 (B), 16-30 (I)... ሎጅክ
function generateBingoNumbers() {
    let card = [];
    const ranges = [[1,15], [16,30], [31,45], [46,60], [61,75]];
    
    // 5x5 Grid መፍጠር (Column by Column)
    let columns = ranges.map(range => {
        let pool = [];
        for(let i=range[0]; i<=range[1]; i++) pool.push(i);
        return pool.sort(() => Math.random() - 0.5).slice(0, 5);
    });

    for(let row=0; row<5; row++) {
        for(let col=0; col<5; col++) {
            card.push(columns[col][row]);
        }
    }
    return card;
}

function confirmPurchase() {
    stakeData[currentStake].bought.add(pendingCardId);
    updateWinDisplay();
    closeModal();
    generateCardGrid();
}

function updateWinDisplay() {
    const count = stakeData[currentStake].bought.size;
    const win = (currentStake * 0.85 * count).toFixed(2);
    const winEl = document.getElementById(`win-${currentStake}`);
    if(winEl) winEl.innerText = `${win} Birr`;
}

function closeModal() {
    document.getElementById('card-modal').classList.add('hidden');
    pendingCardId = null;
}

function showStakeScreen() {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.remove('hidden');
}

init();
