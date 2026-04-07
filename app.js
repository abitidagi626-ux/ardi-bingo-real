const STAKES = [10, 20, 30, 50, 80, 100, 150, 200];
let selectedStake = null;
let myCards = [];
let drawnNumbers = new Set();
let markedSets = []; 
let timeLeft = 60;
let timerInterval = null;

function init() {
    const list = document.getElementById('stake-list');
    list.innerHTML = "";
    STAKES.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} Birr</b></span>
            <span class="t-disp">00:60</span>
            <button class="join-btn" id="btn-${s}" onclick="openBuy(${s})">Join »</button>
        `;
        list.appendChild(row);
    });
    startTimer();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const timeStr = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
        document.querySelectorAll('.t-disp').forEach(el => el.innerText = timeStr);
        if(document.getElementById('timer-display')) document.getElementById('timer-display').innerText = timeStr;
        
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            if(myCards.length > 0) startGame();
            else { 
                alert("Game starting soon! No cards bought."); 
                location.reload(); 
            }
        }
    }, 1000);
}

function openBuy(stake) {
    if(selectedStake !== null && selectedStake !== stake) {
        alert("You can only play in one stake per round!");
        return;
    }
    if(myCards.length >= 4) {
        alert("Maximum 4 cards allowed!");
        return;
    }
    selectedStake = stake;
    STAKES.forEach(s => { 
        if(s !== stake) document.getElementById(`btn-${s}`).classList.add('disabled'); 
    });
    showPreview();
    document.getElementById('buy-modal').classList.remove('hidden');
}

let tempPreview = [];
function showPreview() {
    const container = document.getElementById('card-preview');
    container.innerHTML = '';
    tempPreview = generateBingoCard();
    const grid = document.createElement('div');
    grid.style.display = 'grid'; 
    grid.style.gridTemplateColumns = 'repeat(5, 1fr)'; 
    grid.style.gap = '2px';
    
    tempPreview.forEach((n, i) => {
        const cell = document.createElement('div');
        cell.className = 'arena-cell'; 
        cell.style.color = 'black';
        cell.innerText = i === 12 ? 'F' : n;
        grid.appendChild(cell);
    });
    container.appendChild(grid);
    document.getElementById('card-count').innerText = `Cards Purchased: ${myCards.length}/4`;
}

function addCard() {
    myCards.push([...tempPreview]);
    markedSets.push(new Set(["F"]));
    document.getElementById('active-val').innerText = (selectedStake * myCards.length).toFixed(2);
    
    if(myCards.length < 4) {
        showPreview();
    } else {
        closeModal();
    }
}

function startGame() {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('buy-modal').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const board = document.getElementById('numbers-board');
    board.innerHTML = "";
    for(let i=1; i<=75; i++) {
        const div = document.createElement('div');
        div.className = 'board-cell'; 
        div.id = `b-${i}`; 
        div.innerText = i;
        board.appendChild(div);
    }

    const stack = document.getElementById('cards-stack');
    stack.innerHTML = "";
    myCards.forEach((card, cIdx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'player-card';
        card.forEach((num, i) => {
            const cell = document.createElement('div');
            cell.className = 'arena-cell' + (i === 12 ? ' marked' : '');
            cell.innerText = i === 12 ? 'F' : num;
            cell.onclick = () => {
                if(drawnNumbers.has(num)) {
                    cell.classList.add('marked');
                    markedSets[cIdx].add(num);
                    checkWin(card, cIdx);
                }
            };
            cardDiv.appendChild(cell);
        });
        stack.appendChild(cardDiv);
    });
    startDrawing();
}

function startDrawing() {
    let pool = Array.from({length: 75}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    const drawIntv = setInterval(() => {
        if(idx >= 75) { clearInterval(drawIntv); return; }
        let n = pool[idx];
        drawnNumbers.add(n);
        document.getElementById('current-ball').innerText = n;
        const ballEl = document.getElementById(`b-${n}`);
        if(ballEl) ballEl.classList.add('hit');
        idx++;
    }, 3000);
}

function checkWin(card, cIdx) {
    const wins = [
        [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24], // Rows
        [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24], // Cols
        [0,6,12,18,24],[4,8,12,16,20] // Diagonals
    ];
    const won = wins.some(w => w.every(p => markedSets[cIdx].has(p === 12 ? "F" : card[p])));
    if(won) document.getElementById('bingo-btn').style.display = 'block';
}

function generateBingoCard() {
    let card = [];
    for(let i=0; i<5; i++) {
        let col = Array.from({length: 15}, (_, j) => (i*15)+j+1)
                       .sort(() => Math.random()-0.5)
                       .slice(0,5);
        for(let j=0; j<5; j++) card[j*5 + i] = col[j];
    }
    return card;
}

function closeModal() { document.getElementById('buy-modal').classList.add('hidden'); }
function claimBingo() { alert("BINGO! You Won!"); location.reload(); }

window.onload = init;
