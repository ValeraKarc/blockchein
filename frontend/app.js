window.addEventListener("DOMContentLoaded", async () => {
    const contractAddress = "0x253F0835b5252E7C3bAc602FED8Abb9138c7E8C9";
    const abi = [
        // Updated ABI - paste from forge build or remix
        {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"bool","name":"won","type":"bool"}],"name":"GameEnded","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"stake","type":"uint256"}],"name":"GameStarted","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"pos","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"botPos","type":"uint256"}],"name":"MoveMade","type":"event"},
        {"inputs":[],"name":"claimPrize","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"donations","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"donors","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"donorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"games","outputs":[{"components":[{"internalType":"uint8[9]","name":"board","type":"uint8[9]"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"playerTurn","type":"bool"},{"internalType":"bool","name":"playerWon","type":"bool"}],"internalType":"struct GamblingTicTacToe.Game","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint8","name":"pos","type":"uint8"}],"name":"makeMove","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"projectName","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"startGame","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[],"name":"totalFunds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ];

    const connectBtn = document.getElementById("connectBtn");
    const startBtn = document.getElementById("startBtn");
    const withdrawBtn = document.getElementById("withdrawBtn");
    const claimBtn = document.getElementById("claimBtn");
    const projectNameEl = document.getElementById("projectName");
    const descriptionEl = document.getElementById("description");
    const totalFundsEl = document.getElementById("totalFunds");
    const ownerEl = document.getElementById("owner");
    const amountInput = document.getElementById("amount");
    const donationsList = document.getElementById("donationsList");
    const gameSection = document.getElementById("gameSection");
    const gameStatusEl = document.getElementById("gameStatus");
    const gameResultEl = document.getElementById("gameResult");
    const boardEl = document.getElementById("board");

    let provider, signer, contract, address;

    connectBtn.onclick = async () => {
        if (!window.ethereum) return alert("Установите MetaMask!");
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            address = await signer.getAddress();
            contract = new ethers.Contract(contractAddress, abi, signer);
            connectBtn.innerText = "Подключено: " + address.slice(0,6) + "...";
            loadData();
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    async function loadData() {
        if (!contract) return;
        projectNameEl.textContent = await contract.projectName();
        descriptionEl.textContent = await contract.description();
        totalFundsEl.textContent = ethers.formatEther(await contract.totalFunds());
        ownerEl.textContent = await contract.owner();

        donationsList.innerHTML = "";
        const count = await contract.donorCount();
        for (let i = 0; i < count; i++) {
            const d = await contract.donors(i);
            if (Number(d.amount) > 0) {
                const li = document.createElement("li");
                li.textContent = `${d.donor}: ${ethers.formatEther(d.amount)} ETH`;
                donationsList.appendChild(li);
            }
        }

        await loadGame();
    }

    async function loadGame() {
        if (!address) return;
        const game = await contract.games(address);
        if (game.active) {
            gameSection.classList.remove("hidden");
            startBtn.disabled = true;
            gameStatusEl.textContent = game.playerTurn ? "Ваш ход (X)" : "Ход бота (O)";
            renderBoard(game.board);
        } else if (game.stake > 0) {
            gameSection.classList.remove("hidden");
            renderBoard(game.board);
            if (game.playerWon) {
                gameResultEl.textContent = "Ты Выиграл!";
                gameResultEl.classList.add("win");
                claimBtn.classList.remove("hidden");
            } else {
                gameResultEl.textContent = "Проиграл! Ставка forfeited.";
                gameResultEl.classList.add("lose");
            }
        } else {
            gameSection.classList.add("hidden");
            startBtn.disabled = false;
            gameStatusEl.textContent = "";
            gameResultEl.textContent = "";
            gameResultEl.className = "";
            claimBtn.classList.add("hidden");
        }
    }

    function renderBoard(board) {
        boardEl.innerHTML = "";
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.index = i;
            cell.textContent = board[i] === 1 ? "X" : board[i] === 2 ? "O" : "";
            if (board[i] === 1) cell.classList.add("x");
            if (board[i] === 2) cell.classList.add("o");
            if (board[i] === 0 && games[address]?.playerTurn && games[address]?.active) {
                cell.addEventListener("click", handleCellClick);
            }
            boardEl.appendChild(cell);
        }
    }

    async function handleCellClick(e) {
        const pos = parseInt(e.target.dataset.index);
        try {
            const tx = await contract.makeMove(pos, { gasLimit: 1000000 });
            await tx.wait();
            loadData();
        } catch (err) {
            alert("Ошибка хода: " + err.message);
        }
    }

    startBtn.onclick = async () => {
        if (!contract) return alert("Подключите MetaMask!");
        const eth = amountInput.value;
        if (!eth || Number(eth) < 0.001) return alert("Мин. 0.001 ETH");
        try {
            const tx = await contract.startGame({ value: ethers.parseEther(eth) });
            await tx.wait();
            loadData();
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    withdrawBtn.onclick = async () => {
        if (!contract) return alert("Подключите MetaMask!");
        try {
            const tx = await contract.withdraw();
            await tx.wait();
            loadData();
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    claimBtn.onclick = async () => {
        if (!contract) return alert("Подключите MetaMask!");
        try {
            const tx = await contract.claimPrize();
            await tx.wait();
            loadData();
        } catch (err) {
            alert("Ошибка: " + err.message);
        }
    };

    // Listen for events (optional, for real-time)
    if (contract) {
        contract.on("MoveMade", (player) => { if (player === address) loadData(); });
        contract.on("GameEnded", (player) => { if (player === address) loadData(); });
    }
});