// ---------------------------------------------------------
// 1. የቴሌግራም እና የሂሳብ ሚዛን (Balance) ሎጂክ
// ---------------------------------------------------------
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let currentBalance = 0;
let currentStake = null;
let lockStake = null;
let timeLeft = 60; // ታይመሩ 60 ሰከንድ
let pendingCardId = null;

// የጨዋታ ዳታዎች
let boughtCardsNumbers = {};
let drawnNumbers = new Set();
let playerMarkedNumbers = {};
let gameInterval;
const stakeData = { 10: { bought: new Set() }, 20: { bought: new Set() }, 30: { bought: new Set() }, 50: { bought: new Set() }, 80: { bought: new Set() }, 100: { bought: new Set() }, 150: { bought: new Set() }, 200: { bought: new Set() } };

// ገጹ ሲከፈት ባላንስን ከ URL መቀበል
const urlParams = new URLSearchParams(window.location.search);
currentBalance = parseFloat(urlParams.get('balance')) || 0.00;
updateBalanceDisplay(currentBalance);

function updateBalanceDisplay(amount) {
    const display = document.getElementById('balance'); 
    if (display) display.innerText = amount.toFixed(2);
}

// ---------------------------------------------------------
// 2. የካርድ ቁጥሮች አመራረት
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 3. ዋና ተግባራት (Main Logic)
// ---------------------------------------------------------

function init() {
    const list = document.getElementById('stake-list');
    if (!list) return;
    
    const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
    list.innerHTML = ""; 
    
    stakes.forEach(s => {
        const row = document.createElement('div'); 
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} ETB</b></span>
            <span class="timer-display" id="timer-${s}">00:60</span>
            <span id="win-${s}">0.00</span>
            <button onclick="handleJoinRequest(${s})" style="background:#efae10; border:none; border-radius:5px; padding:8px 15px; cursor:pointer; font-weight:bold;">Join »</button>`;
        list.appendChild(row);
    });
    
    startGlobalTimer();
}

// ታይመሩ 0 ሲሆን በራሱ ወደ ጌም እንዲወስድ የተስተካከለ
function startGlobalTimer() {
    const timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            const timeStr = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
            document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
            if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
        } else { 
            clearInterval(timer); 
            // ታይመሩ 0 ሲሆን እና ተጫዋቹ ካርድ ገዝቶ ከሆነ ወደ ጌም አሬና ውሰደው
            if (lockStake) {
                startBingoArena(lockStake); 
            } else {
                alert("ጊዜው አልቋል! ካርድ ስላልገዙ ጨዋታውን ማየት አይችሉም።");
                location.reload();
            }
        }
    }, 1000);
}

function handleJoinRequest(stake) {
    if (lockStake && lockStake !== stake) {
        return alert("አሁን መቀጠል የሚችሉት በ " + lockStake + " ብር ብቻ ነው!");
    }
    if (currentBalance < stake) {
        return alert("በቂ ባላንስ የለዎትም!");
    }
    currentStake = stake;
    openCardSelection(stake);
}

function openCardSelection(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updateCardCountUI(); 
    generateCardGrid();
}

function generateCardGrid() {
    const grid = document.getElementById('card-grid'); 
    grid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div'); 
        card.className = `card-num ${stakeData[currentStake].bought.has(i) ? 'bought' : ''}`;
        card.innerText = i; 
        card.onclick = () => { if(stakeData[currentStake].bought.size < 4) showPreview(i); };
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
        cell.innerText = idx === 12 ? 'F' : n; 
        previewGrid.appendChild(cell);
    });
    document.getElementById('card-modal').classList.remove('hidden');
}

// ካርድ ሲገዛ የሚሰራው ዋና ተግባር
function confirmPurchase() {
    // 1. ባላንስ መቀነስ
    currentBalance -= currentStake;
    updateBalanceDisplay(currentBalance);
    
    // 2. ዳታ መመዝገብ
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = getFixedNumbers(pendingCardId);
    playerMarkedNumbers[pendingCardId] = new Set([12]);
    lockStake = currentStake;
    
    // 3. ከገጹ ሳይወጣ (Web App ሳይዘጋ) ለቦቱ መረጃ መላክ
    // tg.sendData() ገጹን ስለሚዘጋው፣ እዚህ ጋር በ fetch ወይም በሌላ መንገድ ቦቱን ማሳወቅ ይቻላል
    // ካልሆነም ጌሙ ሲያልቅ ብቻ መላክ ይቻላል። ለጊዜው ባላንሱን እዚህ ቀንሰነዋል።
    
    closeModal(); 
    updateCardCountUI(); 
    generateCardGrid();
    
    tg.HapticFeedback.impactOccurred('medium');
}

function updateCardCountUI() { 
    const count = stakeData[currentStake].bought.size;
    document.getElementById('card-count-info').innerText = count; 
}

// ወደ ቁጥሮች መጥሪያ (Arena) የሚወስድ ክፍል
function startBingoArena(stake) {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const board = document.getElementById('numbers-board');
    board.innerHTML = ""; 
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div'); 
        div.className = 'board-cell'; 
        div.id = `ball-${i}`; 
        div.innerText = i; 
        board.appendChild(div);
    }
    
    const container = document.getElementById('arena-cards-container');
    container.innerHTML = ""; 
    stakeData[stake].bought.forEach(id => {
        const wrapper = document.createElement('div'); 
        wrapper.className = 'arena-card-wrapper';
        wrapper.innerHTML = `<div class="card-label-small">CARD #${id}</div>`;
        const cardGrid = document.createElement('div'); 
        cardGrid.className = 'player-card-arena';
        
        boughtCardsNumbers[id].forEach((n, idx) => {
            const cell = document.createElement('div'); 
            cell.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
            cell.innerText = idx === 12 ? 'F' : n; 
            cell.onclick = () => { if(drawnNumbers.has(n)) { playerMarkedNumbers[id].add(idx); cell.classList.add('marked'); } };
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
    
    // የቁጥሮች መጥሪያ ሎጂክ
    let pool = Array.from({length:75}, (_,i)=>i+1).sort(()=>Math.random()-0.5), idx = 0;
    gameInterval = setInterval(() => {
        if(idx >= 75) return clearInterval(gameInterval);
        let drawn = pool[idx]; 
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        const cell = document.getElementById(`ball-${drawn}`);
        if(cell) cell.classList.add('hit');
        idx++;
    }, 3500);
}

function manualBingoCheck(id) {
    const marked = playerMarkedNumbers[id];
    const patterns = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
    if (patterns.some(p => p.every(idx => marked.has(idx)))) {
        clearInterval(gameInterval);
        alert("BINGO! አሸንፈዋል!");
        location.reload();
    } else {
        alert("ገና አልሞላም!");
    }
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

init();
