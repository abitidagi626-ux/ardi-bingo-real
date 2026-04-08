const STAKES = [10, 20, 30, 50, 80, 100, 150, 200];
let selectedStake = null;
let myCard = [];
let drawnNumbers = new Set();
let markedNumbers = new Set();
let timeLeft = 60;
let currentPossibleWin = 0; // ነጥብ 3፡ ለማስተላለፍ

function init() {
    const list = document.getElementById('stake-list');
    list.innerHTML = "";
    STAKES.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} Birr</b></span>
            <span class="t-disp">00:60</span>
            <span id="win-${s}">0.00</span>
            <button class="join-btn" onclick="openBuy(${s})">Join »</button>
        `;
        list.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    const timer = setInterval(() => {
        timeLeft--;
        const timeStr = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
        document.querySelectorAll('.t-disp').forEach(el => el.innerText = timeStr);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = timeStr;
        
        if(timeLeft <= 0) {
            clearInterval(timer);
            if(myCard.length > 0) startGame();
            else location.reload();
        }
    }, 1000);
}

function openBuy(stake) {
    if(selectedStake !== null && selectedStake !== stake) return;
    selectedStake = stake;
    // Possible Win ስሌት (ለአንድ ካርድ 85%)
    currentPossibleWin = (stake * 0.85).toFixed(2);
    document.getElementById(`win-${stake}`).innerText = currentPossibleWin;
    showPreview();
    document.getElementById('card-modal').classList.remove('hidden');
}

let tempCard = [];
function showPreview() {
    const grid = document.getElementById('preview-grid');
    grid.innerHTML = "";
    tempCard = generateBingoCard();
    tempCard.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'arena-cell'; cell.style.color = 'black';
        cell.innerText = idx === 12 ? 'F' : n;
        grid.appendChild(cell);
    });
}

function confirmPurchase() {
    myCard = [...tempCard];
    markedNumbers.add("F"); // Free space
    closeModal();
    // JOIN በተኑን Disabled ለማድረግ (አንድ ካርድ ብቻ ስለሚቻል)
    document.querySelectorAll('.join-btn').forEach(btn => btn.disabled = true);
}

function startGame() {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // ነጥብ 3: Possible Win መጠንን በካርዱ ላይ በጎላ (Bold) ሁኔታ ማሳየት
    const winDisplay = document.getElementById('win-amount-card');
    winDisplay.classList.remove('hidden');
    document.getElementById('card-win-val').innerText = `${currentPossibleWin} Birr`;

    setupArena();
    startDrawing();
}

function setupArena() {
    const board = document.getElementById('numbers-board');
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-cell'; div.id = `b-${i}`; div.innerText = i;
        board.appendChild(div);
    }

    const arenaCard = document.getElementById('player-card');
    myCard.forEach((n, idx) => {
        const div = document.createElement('div');
        div.className = 'arena-cell' + (idx === 12 ? ' marked' : '');
        div.innerText = idx === 12 ? 'F' : n;
        div.onclick = () => {
            if (idx === 12) return;
            if (drawnNumbers.has(n)) {
                div.classList.add('marked');
                markedNumbers.add(n);
                checkBingo(); // Manual Click በሆነ ቁጥር ቼክ ያደርጋል
            }
        };
        arenaCard.appendChild(div);
    });
}

function startDrawing() {
    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    const drawIntv = setInterval(() => {
        if(idx >= 75) { clearInterval(drawIntv); return; }
        let n = pool[idx];
        drawnNumbers.add(n);
        document.getElementById('current-ball').innerText = n;
        if(document.getElementById(`b-${n}`)) document.getElementById(`b-${n}`).classList.add('hit');
        idx++;
    }, 3000); // በየ 3 ሴኮንዱ
}

// ነጥብ 1 & ቼክ ዊን
function checkBingo() {
    const wins = [
        [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24], // Rows
        [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24], // Cols
        [0,6,12,18,24],[4,8,12,16,20] // Diagonals
    ];
    const won = wins.some(w => w.every(i => markedNumbers.has(i === 12 ? "F" : myCard[i])));
    // ነጥብ 1: ዊን ከሆነ ቢንጎ በተኑን ያሳያል
    if (won) document.getElementById('bingo-btn').style.display = 'block';
}

function generateBingoCard() {
    let card = [];
    for(let i=0; i<5; i++) {
        let col = Array.from({length: 15}, (_, j) => (i*15)+j+1).sort(() => Math.random()-0.5).slice(0,5);
        for(let j=0; j<5; j++) card[j*5 + i] = col[j];
    }
    return card;
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function claimBingo() { alert("BINGO! You Won!"); location.reload(); }

init();
