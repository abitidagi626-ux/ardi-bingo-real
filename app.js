let currentStake = 0;
let timeLeft = 60;
let pendingCardId = null;
let boughtCards = new Set();
let timerInterval;

function init() {
    const stakes = [10, 20, 30, 50, 100, 150];
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span class="timer-display">00:60</span>
            <span id="win-${s}">0.00 Birr</span>
            <button class="join-btn" style="background:#efae10; border:none; padding:5px 10px; border-radius:5px;" onclick="openCardSelection(${s})">Join »</button>
        `;
        stakeList.appendChild(row);
    });
    startTimer();
}

function startTimer() {
    setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = 60;
        const timeStr = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
        const modalTimer = document.getElementById('modal-timer');
        if(modalTimer) modalTimer.innerText = timeStr;
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
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = `card-num ${boughtCards.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => showPreview(i);
        grid.appendChild(card);
    }
}

// Image 2 ላይ ያለውን የካርታ ገጽታ መፍጠር
function showPreview(id) {
    if(boughtCards.has(id)) return; // ተገዝቶ ከሆነ አይከፈትም
    pendingCardId = id;
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";

    // የቢንጎ ቁጥሮችን በዘፈቀደ ማመንጨት (ለእያንዳንዱ ካርታ)
    const cardNums = generateBingoNumbers();
    cardNums.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell';
        if(idx === 12) {
            cell.innerText = "F";
            cell.classList.add('free');
        } else {
            cell.innerText = n;
        }
        previewGrid.appendChild(cell);
    });

    document.getElementById('card-modal').classList.remove('hidden');
}

function generateBingoNumbers() {
    let numbers = [];
    for(let i=0; i<25; i++) numbers.push(Math.floor(Math.random() * 75) + 1);
    return numbers;
}

function confirmPurchase() {
    boughtCards.add(pendingCardId);
    updatePossibleWin();
    closeModal();
    generateCardGrid(); // ሰማያዊ እንዲሆን ለማደስ
}

function updatePossibleWin() {
    const win = (currentStake * 0.85 * boughtCards.size).toFixed(2);
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
