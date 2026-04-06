// ለእያንዳንዱ Stake የተገዙ ካርታዎችን እና የድል መጠን ለመያዝ
const stakeData = {
    10: { bought: new Set(), possibleWin: 0 },
    20: { bought: new Set(), possibleWin: 0 },
    30: { bought: new Set(), possibleWin: 0 },
    50: { bought: new Set(), possibleWin: 0 },
    80: { bought: new Set(), possibleWin: 0 },
    100: { bought: new Set(), possibleWin: 0 },
    150: { bought: new Set(), possibleWin: 0 },
    200: { bought: new Set(), possibleWin: 0 }
};

let currentStake = null;
let pendingCardId = null;
let timeLeft = 60;

function init() {
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    Object.keys(stakeData).forEach(s => {
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
        // እዚህ ጋር ካርታው በዚህ Stake ውስጥ ተገዝቶ ከሆነ ሰማያዊ ይሆናል
        card.className = `card-num ${boughtInCurrentStake.has(i) ? 'bought' : ''}`;
        card.innerText = i;
        card.onclick = () => showPreview(i);
        grid.appendChild(card);
    }
}

function showPreview(id) {
    // ቀድሞ የተገዛ ከሆነ Review አያስፈልገውም
    if(stakeData[currentStake].bought.has(id)) return;
    
    pendingCardId = id;
    document.getElementById('modal-card-no').innerText = `Card No. ${id}`;
    
    const previewGrid = document.getElementById('preview-grid');
    previewGrid.innerHTML = "";
    
    // የቢንጎ ቁጥሮችን በየ Column (B-I-N-G-O) ማመንጨት
    const numbers = generateBingoNumbers();
    numbers.forEach((n, idx) => {
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

// "Confirm Card" ሲጫን የሚሰራው ዋና ስራ
function confirmPurchase() {
    if (pendingCardId) {
        // ወደ ተገዙት ዝርዝር ጨምረው
        stakeData[currentStake].bought.add(pendingCardId);
        
        // የድል መጠን (Possible Win) አስላ (ለምሳሌ 85% ተመላሽ)
        const count = stakeData[currentStake].bought.size;
        const possibleWin = (currentStake * 0.85 * (count + 5)).toFixed(2); // ናሙና አሰራር
        document.getElementById(`win-${currentStake}`).innerText = `${possibleWin} Birr`;
        
        closeModal();
        generateCardGrid(); // ግሪዱን አድስ (ሰማያዊ እንዲሆን)
    }
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
