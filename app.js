const stakes = [10, 20, 30, 50, 100, 150];
const stakeList = document.getElementById('stake-list');
const cardGrid = document.getElementById('card-grid');

// 1. የStake ዝርዝር መፍጠር
stakes.forEach(s => {
    const row = document.createElement('div');
    row.className = 'stake-row';
    row.innerHTML = `
        <span><b>${s} birr</b></span>
        <span style="color:red">0:30</span>
        <span>${s * 85} Birr</span>
        <button class="join-btn" onclick="openCardSelection(${s})">Join »</button>
    `;
    stakeList.appendChild(row);
});

// 2. የካርታ ምርጫ ገጽ መክፈት
function openCardSelection(stake) {
    document.getElementById('stake-screen').classList.add('hidden');
    document.getElementById('card-screen').classList.remove('hidden');
    document.getElementById('selected-stake-val').innerText = stake;
    generateCards();
}

function showStakeScreen() {
    document.getElementById('card-screen').classList.add('hidden');
    document.getElementById('stake-screen').classList.remove('hidden');
}

// 3. 100 ካርታዎችን መፍጠር (Image 2 መሰረት)
function generateCards() {
    cardGrid.innerHTML = "";
    for (let i = 1; i <= 143; i++) {
        const card = document.createElement('div');
        card.className = 'card-num';
        card.innerText = i;
        card.onclick = () => card.classList.toggle('selected');
        card.id = `card-${i}`;
        cardGrid.appendChild(card);
    }
}
