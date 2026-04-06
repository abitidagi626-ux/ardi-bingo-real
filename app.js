const stakes = [10, 20, 30, 50, 100, 150];
let currentStake = 0;
let timeLeft = 60; 
let selectedCards = new Set();
let timerInterval;

function initStakeScreen() {
    const stakeList = document.getElementById('stake-list');
    stakeList.innerHTML = "";
    stakes.forEach(s => {
        const row = document.createElement('div');
        row.className = 'stake-row';
        row.innerHTML = `
            <span><b>${s} birr</b></span>
            <span class="timer-display" id="timer-${s}">01:00</span>
            <span class="win-amount" id="win-${s}">0.00 Birr</span>
            <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
        `;
        stakeList.appendChild(row);
    });
    startGlobalTimer();
}

function startGlobalTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = 60;

        const sec = timeLeft < 10 ? '0' + timeLeft : timeLeft;
        const timeStr = `00:${sec}`;

        document.querySelectorAll('.timer-display').forEach(el => {
            el.innerText = timeStr;
            el.style.color = timeLeft <= 10 ? "red" : "#00ff00";
        });
    }, 1000);
}

function openCardSelection(stake) {
    currentStake = stake;
    selectedCards.clear();
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    generateCards();
}

function generateCards() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = 'card-num';
        card.innerText = i;
        card.onclick = () => {
            card.classList.toggle('selected');
            if (selectedCards.has(i)) selectedCards.delete(i);
            else selectedCards.add(i);
            updatePossibleWin();
        };
        grid.appendChild(card);
    }
}

function updatePossibleWin() {
    const possibleWin = (currentStake * 0.85 * selectedCards.size).toFixed(2);
    const winDisplay = document.getElementById(`win-${currentStake}`);
    if (winDisplay) winDisplay.innerText = `${possibleWin} Birr`;
}

function showStakeScreen() {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.remove('hidden');
}

function buyCards() {
    if(selectedCards.size === 0) return alert("እባክዎ መጀመሪያ ካርታ ይምረጡ!");
    alert(`${selectedCards.size} ካርታዎችን ገዝተዋል። ጨዋታው እስኪጀምር ይጠብቁ!`);
}

initStakeScreen();
