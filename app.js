const board = document.getElementById('bingo-board');

// 1. የቢንጎ ካርታ ቁጥሮችን ማመንጨት (1-75)
function generateNumbers() {
    let nums = [];
    while(nums.length < 25) {
        let r = Math.floor(Math.random() * 75) + 1;
        if(nums.indexOf(r) === -1) nums.push(r);
    }
    return nums;
}

// 2. ካርታውን በስክሪኑ ላይ መሳል
const myNumbers = generateNumbers();
myNumbers.forEach((num, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    
    if(index === 12) {
        cell.innerText = "FREE";
        cell.classList.add('free', 'marked');
    } else {
        cell.innerText = num;
        cell.onclick = () => cell.classList.toggle('marked');
    }
    board.appendChild(cell);
});

// 3. ቢንጎ መሆኑን ማረጋገጥ (ለወደፊቱ የምንጨምረው)
function checkBingo() {
    alert("ቢንጎ መሆኑ እየተመረመረ ነው...!");
}
