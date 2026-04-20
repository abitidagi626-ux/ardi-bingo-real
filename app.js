// ---------------------------------------------------------
// 1. የቴሌግራም እና የሂሳብ ሚዛን (Balance) ሎጂክ
// ---------------------------------------------------------
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let currentBalance = 0;
let currentStake = null;
let lockStake = null;
let timeLeft = 60;
let pendingCardId = null;

// የጨዋታ ዳታዎች
let boughtCardsNumbers = {};
let drawnNumbers = new Set();
let playerMarkedNumbers = {};
let gameInterval;
const stakeData = { 10: { bought: new Set() }, 20: { bought: new Set() }, 30: { bought: new Set() }, 50: { bought: new Set() }, 80: { bought: new Set() }, 100: { bought: new Set() }, 150: { bought: new Set() }, 200: { bought: new Set() } };

// ገጹ ሲከፈት ባላንስን ከ URL መቀበል (ከ server.js የሚላከው)
const urlParams = new URLSearchParams(window.location.search);
currentBalance = parseFloat(urlParams.get('balance')) || 0.00;
updateBalanceDisplay(currentBalance);

function updateBalanceDisplay(amount) {
    const display = document.getElementById('balance'); // index.html ላይ ያለው id
    if (display) display.innerText = amount.toFixed(2);
}

// ---------------------------------------------------------
// 2. የቴሌግራም ግንኙነት (Web App Bridge)
// ---------------------------------------------------------

function sendDataToBot(data) {
    if (tg) {
        tg.sendData(JSON.stringify(data));
    }
}

// ---------------------------------------------------------
// 3. የካርድ ቁጥሮች አመራረት (Bingo Card Generation)
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
// 4. ዋና ተግባራት (Main Logic)
// ---------------------------------------------------------

function init() {
    const list = document.getElementById('stake-list');
    if (!list) return;
    
    // የStake ዝርዝርን መፍጠር
    const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
    list.innerHTML = ""; // መጀመሪያ ባዶ ማድረግ
    
    stakes.forEach(s => {
        const row = document.createElement('div'); 
        row.className = 'stake-row';
        row.style = "display: flex; justify-content: space-between; align-items: center; background: #00443a; margin: 8px 0; padding: 12px; border-radius: 10px;";
        row.innerHTML = `
            <span><b>${s} ETB</b></span>
            <span class="timer-display" id="timer-${s}">00:60</span>
            <button onclick="handleJoinRequest(${s})" style="background:#efae10; border:none; border-radius:5px; padding:8px 15px; cursor:pointer; font-weight:bold;">Join »</button>`;
        list.appendChild(row);
    });
    
    startGlobalTimer();
}

function handleJoinRequest(stake) {
    if (lockStake && lockStake !== stake) {
        return alert("አሁን መቀጠል የሚችሉት በ " + lockStake + " ብር ብቻ ነው!");
    }

    if (currentBalance < stake) {
        return alert("በቂ ባላንስ የለዎትም! እባክዎ መጀመሪያ ዲፖዚት ያድርጉ።");
    }

    currentStake = stake;
    openCardSelection(stake);
}

function startGlobalTimer() {
    gameInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            const timeStr = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
            document.querySelectorAll('.timer-display').forEach(el => el.innerText = timeStr);
            if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
        } else { 
            clearInterval(gameInterval); 
            if (lockStake) startBingoArena(lockStake); 
            else { alert("ጊዜው አልቋል! እባክዎ ገጹን Refresh ያድርጉ።"); }
        }
    }, 1000);
}

function openCardSelection(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    updateCardCountUI(); 
    generateCardGrid();
}

function updateCardCountUI() { 
    const count = stakeData[currentStake].bought.size;
    document.getElementById('card-count-info').innerText = count; 
}

function generateCardGrid() {
    const grid = document.getElementById('card-grid'); 
    grid.innerHTML = "";
    grid.className = "card-grid";
    grid.style = "display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 15px;";
    
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div'); 
        card.className = `card-item ${stakeData[currentStake].bought.has(i) ? 'bought' : ''}`;
        if (stakeData[currentStake].bought.has(i)) card.style.background = "#555";
        card.style = "background: #efae10; color: black; padding: 15px 5px; text-align: center; border-radius: 8px; font-weight: bold; cursor: pointer;";
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
        cell.className = 'bingo-cell';
        cell.style = "border: 1px solid #ccc; padding: 5px; font-size: 12px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: white; color: black; font-weight: bold;";
        cell.innerText = idx === 12 ? 'FREE' : n; 
        previewGrid.appendChild(cell);
    });
    document.getElementById('card-modal').classList.remove('hidden');
}

function confirmPurchase() {
    // ባላንስ መቀነስ (በዌብ አፑ ላይ)
    currentBalance -= currentStake;
    updateBalanceDisplay(currentBalance);
    
    // ዳታውን መመዝገብ
    stakeData[currentStake].bought.add(pendingCardId);
    boughtCardsNumbers[pendingCardId] = getFixedNumbers(pendingCardId);
    playerMarkedNumbers[pendingCardId] = new Set([12]);
    lockStake = currentStake;
    
    // ለቦቱ መረጃ መላክ (database.json እንዲቀንስ)
    sendDataToBot({
        type: 'buy_card',
        amount: currentStake,
        cardId: pendingCardId
    });

    closeModal(); 
    updateCardCountUI(); 
    generateCardGrid();
    
    tg.HapticFeedback.impactOccurred('medium');
}

function startBingoArena(stake) {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const board = document.getElementById('numbers-board');
    board.innerHTML = ""; 
    board.style = "display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; font-size: 10px;";
    
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div'); 
        div.id = `ball-${i}`; 
        div.innerText = i; 
        div.style = "background: #333; padding: 2px; text-align: center; border-radius: 2px;";
        board.appendChild(div);
    }
    
    const container = document.getElementById('arena-cards-container');
    container.innerHTML = ""; 
    
    stakeData[stake].bought.forEach(id => {
        const wrapper = document.createElement('div');
        wrapper.className = 'arena-card-wrapper';
        wrapper.style = "margin-bottom: 20px; background: #00332c; padding: 10px; border-radius: 10px;";
        wrapper.innerHTML = `<div style="text-align:center; color:#efae10; font-weight:bold; margin-bottom:5px;">CARD #${id}</div>`;
        
        const cardGrid = document.createElement('div');
        cardGrid.style = "display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; background: white; padding: 5px;";
        
        boughtCardsNumbers[id].forEach((n, idx) => {
            const cell = document.createElement('div');
            cell.style = "background:#eee; color:black; height:35px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; border:1px solid #ccc;";
            if (idx === 12) { cell.innerText = 'FREE'; cell.style.background = '#efae10'; }
            else cell.innerText = n;
            
            cell.onclick = () => { 
                if(drawnNumbers.has(n) || idx === 12) { 
                    playerMarkedNumbers[id].add(idx); 
                    cell.style.background = '#efae10'; 
                    tg.HapticFeedback.selectionChanged();
                } 
            };
            cardGrid.appendChild(cell);
        });
        
        wrapper.appendChild(cardGrid);
        const btn = document.createElement('button');
        btn.style = "width:100%; margin-top:10px; padding:10px; background:#efae10; border:none; border-radius:5px; font-weight:bold; cursor:pointer;";
        btn.innerText = 'BINGO';
        btn.onclick = () => manualBingoCheck(id);
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
    });
    
    // የቁጥሮች እጣ ማውጣት
    let pool = Array.from({length:75}, (_,i)=>i+1).sort(()=>Math.random()-0.5);
    let idx = 0;
    const arenaInterval = setInterval(() => {
        if(idx >= 75) return clearInterval(arenaInterval);
        let drawn = pool[idx];
        drawnNumbers.add(drawn);
        document.getElementById('current-ball').innerText = drawn;
        const ballEl = document.getElementById(`ball-${drawn}`);
        if(ballEl) ballEl.style.background = "#efae10";
        idx++;
    }, 3500);
}

function manualBingoCheck(id) {
    const marked = playerMarkedNumbers[id];
    const patterns = [
        [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24], 
        [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24], 
        [0,6,12,18,24],[4,8,12,16,20]
    ];
    
    let isWin = patterns.some(p => p.every(idx => marked.has(idx)));
    
    if (isWin) { 
        tg.HapticFeedback.notificationOccurred('success');
        const winAmount = (currentStake * 0.8).toFixed(2); // ምሳሌ ክፍያ
        showBingoWinner(id);
        
        // ለአድሚኑ ማሳወቅ
        sendDataToBot({
            type: 'game_win',
            cardId: id,
            amount: winAmount
        });
    } else { 
        alert("ገና አልሞላም! ቁጥሮቹን በትክክል ምልክት ማድረጎን ያረጋግጡ።"); 
    }
}

function showBingoWinner(cardId) {
    const overlay = document.getElementById('winner-display-overlay');
    document.getElementById('winner-text').innerText = `ካርቴላ #${cardId} አሸንፏል!`;
    overlay.classList.remove('hidden');
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function showStakeScreen() { document.getElementById('card-screen').classList.add('hidden'); document.getElementById('stake-screen').classList.remove('hidden'); }

// ማስጀመር
init();
