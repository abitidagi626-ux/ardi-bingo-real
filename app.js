<!DOCTYPE html>
<html lang="am">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ardi Bingo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <header class="main-header">
            <div class="top-bar">
                <span class="icon">❓</span>
                <div class="toggle-switch"><div class="switch-ball"></div></div>
                <button class="refresh-btn" onclick="location.reload()">Refresh</button>
                <div class="balance-box">💰 ETB <span id="balance">0.00</span></div>
            </div>
            <div class="sub-header">
                <button class="menu-btn">☰</button>
                <button class="deposit-btn">+ Deposit</button>
                <div class="logo">ARDI BINGO</div>
            </div>
        </header>

        <div id="stake-screen" class="screen">
            <h2 class="title">Please Choose Your Stake</h2>
            <div class="stake-table">
                <div class="table-header">
                    <span>Stake</span><span>Active</span><span>Possible Win</span><span>Join</span>
                </div>
                <div id="stake-list"></div>
            </div>
        </div>

        <div id="card-screen" class="screen hidden">
            <div class="card-header">
                <button class="back-btn" onclick="showStakeScreen()">⬅️</button>
                <div class="stake-info"><span id="selected-stake-val">0</span> Birr Per Card</div>
                <button class="random-btn">🔀</button>
            </div>
            <div id="card-grid" class="card-grid"></div>
            <div class="footer-actions">
                <button class="buy-btn" onclick="buyCards()">BUY SELECTED CARDS</button>
            </div>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>
