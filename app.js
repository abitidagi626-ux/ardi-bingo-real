const stakes = [10, 20, 30, 50, 80, 100, 150, 200];
let currentStake = null, timeLeft = 60;
let playerInventory = []; // የገዛናቸው ካርዶች
let drawnNumbers = new Set();
let markedSets = []; // ለእያንዳንዱ ካርድ የራሱ ማርክ መያዣ

function init() {
    const list = document.getElementById('stake-list');
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.id = `row-${s}`;
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span class="timer">00:60</span>
            <span id="active-${s}">0.00</span>
            <button class="join-btn" id="btn-${s}" onclick="openPurchase(${s})">Join »</button>
        `;
        list.appendChild(row);
    });
    startTimer();
}

function startTimer() {
    const intv = setInterval(() => {
        timeLeft--;
        if(timeLeft <= 0) { clearInterval(intv); startGame(); }
        document.querySelectorAll('.timer').forEach(el => el.innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`);
        if(document.getElementById('modal-timer')) document.getElementById('modal-timer').innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
    }, 1000);
}

function openPurchase(stake) {
    if (currentStake !== null && currentStake !== stake) {
        alert("አንዴ ካርድ የገዙበትን ዙር መቀየር አይችሉም!");
        return;
    }
    if (playerInventory.length >= 4) {
        alert("በአንድ ዙር ቢበዛ 4 ካርድ ብቻ ነው መግዛት የሚቻለው!");
        return;
    }
    currentStake = stake;
    lockOtherStakes(stake);
    showPreview();
}

function lockOtherStakes(selected) {
    stakes.forEach(s => {
        if(s !== selected) {
            const btn = document.getElementById(`btn-${s}`);
            btn.classList.add('disabled');
            btn.disabled = true;
        }
    });
}

let tempCard = [];
function showPreview() {
    const grid = document.getElementById('preview-grid');
    grid.innerHTML = "";
    tempCard = generateBingoNumbers();
    tempCard.forEach((n, idx) => {
        const cell = document.createElement('div');
        cell.className = 'arena-cell';
        cell.innerText = idx === 12 ? 'F' : n;
        grid.appendChild(cell);
    });
    document.getElementById('purchase-count').innerText = `Cards: ${playerInventory.length}/4`;
    document.getElementById('card-modal').classList.remove('hidden');
}

function confirmPurchase() {
    playerInventory.push([...tempCard]);
    markedSets.push(new Set(["F"]));
    
    // Active Amount ማሳያ (Blue Box)
    const activeDisplay = document.getElementById('active-amount');
    const totalActive = (currentStake * playerInventory.length * 1.5).toFixed(2); // ለምሳሌ
    activeDisplay.innerText = totalActive;
    document.getElementById(`active-${currentStake}`).innerText = totalActive;

    closeModal();
    if(playerInventory.length < 4) {
        // ተጨማሪ መግዛት ከፈለገ እንደገና እንዲከፍት እድል ይሰጣል
    }
}

function startGame() {
    if(playerInventory.length === 0) { alert("ምንም ካርድ አልገዙም!"); location.reload(); return; }
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    setupBoard();
    setupPlayerCards();
    runDrawing();
}

function setupBoard() {
    const board = document.getElementById('numbers-board');
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-cell'; div.id = `ball-${i}`; div.innerText = i;
        board.appendChild(div);
    }
}

function setupPlayerCards() {
    const stack = document.getElementById('cards-stack');
    playerInventory.forEach((cardNums, cardIdx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'player-card';
        cardNums.forEach((n, i) => {
            const cell = document.createElement('div');
            cell.className = 'arena-cell' + (i === 12 ? ' marked' : '');
            cell.innerText = i === 12 ? 'F' : n;
            cell.onclick = () => {
                if(drawnNumbers.has(n)) {
                    cell.classList.add('marked');
                    markedSets[cardIdx].add(n);
                    checkBingo(cardNums, cardIdx);
                }
            };
            cardDiv.appendChild(cell);
        });
        stack.appendChild(cardDiv);
    });
}

function runDrawing() {
    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let i = 0;
    const intv = setInterval(() => {
        if(i >= 75) clearInterval(intv);
        let num = pool[i];
        drawnNumbers.add(num);
        document.getElementById('current-ball').innerText = num;
        if(document.getElementById(`ball-${num}`)) document.getElementById(`ball-${num}`).classList.add('hit');
        i++;
    }, 3000);
}

function checkBingo(nums, idx) {
    const wins = [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
    const hasWon = wins.some(w => w.every(pos => markedSets[idx].has(pos === 12 ? "F" : nums[pos])));
    if(hasWon) document.getElementById('bingo-btn').style.display = 'block';
}

function generateBingoNumbers() {
    let card = [];
    for(let c=0; c<5; c++) {
        let pool = Array.from({length: 15}, (_, i) => (c*15) + i + 1).sort(() => Math.random() - 0.5);
        for(let r=0; r<5; r++) card[r*5 + c] = pool[r];
    }
    return card;
}

function closeModal() { document.getElementById('card-modal').classList.add('hidden'); }
function claimBingo() { alert("BINGO! You Won!"); location.reload(); }

init();
