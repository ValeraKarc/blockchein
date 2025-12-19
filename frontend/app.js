window.addEventListener("DOMContentLoaded", async () => {
    const contractAddress = "0xe14d58C1D2E086418D8a1b3C5C4B451D543f1d64"; // После деплоя вставь адрес
    const abi = [
        // Вставь ABI контракта здесь. Пример:
        {"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_description","type":"string"},{"internalType":"uint256","name":"_goal","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
        {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"donors","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"donorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"donations","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"fund","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[],"name":"goal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"projectName","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"refund","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"totalFunds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ];

    const connectBtn = document.getElementById("connectBtn");
    const fundBtn = document.getElementById("fundBtn");
    const withdrawBtn = document.getElementById("withdrawBtn");
    const refundBtn = document.getElementById("refundBtn");
    const projectNameEl = document.getElementById("projectName");
    const descriptionEl = document.getElementById("description");
    const goalEl = document.getElementById("goal");
    const totalFundsEl = document.getElementById("totalFunds");
    const ownerEl = document.getElementById("owner");
    const amountInput = document.getElementById("amount");
    const progressFill = document.getElementById("progress");
    const donationsList = document.getElementById("donationsList");
    const gameSection = document.getElementById("gameSection");

    let provider, signer, contract;

    connectBtn.onclick = async () => {
        if (!window.ethereum) {
            alert("Установите MetaMask!");
            return;
        }
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            contract = new ethers.Contract(contractAddress, abi, signer);
            const account = await signer.getAddress();
            connectBtn.innerText = "Подключено: " + account.slice(0,6) + "...";
            loadContractData();
        } catch (err) {
            console.error(err);
            alert("Ошибка подключения: " + err.message);
        }
    };

    async function loadContractData() {
        if (!contract) return;
        const name = await contract.projectName();
        const desc = await contract.description();
        const goal = await contract.goal();
        const total = await contract.totalFunds();
        const owner = await contract.owner();
        projectNameEl.textContent = name;
        descriptionEl.textContent = desc;
        goalEl.textContent = ethers.formatEther(goal);
        totalFundsEl.textContent = ethers.formatEther(total);
        ownerEl.textContent = owner;
        const progressPercent = Math.min(100, Number(ethers.formatEther(total)) / Number(ethers.formatEther(goal)) * 100);
        progressFill.style.width = progressPercent + "%";
        donationsList.innerHTML = "";
        const donorCount = await contract.donorCount();
        for (let i = 0; i < donorCount; i++) {
            const d = await contract.donors(i);
            if (Number(d.amount) > 0) {
                const li = document.createElement("li");
                li.textContent = `${d.donor}: ${ethers.formatEther(d.amount)} ETH`;
                donationsList.appendChild(li);
            }
        }
    }

    fundBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        const ethAmount = amountInput.value;
        if (!ethAmount || Number(ethAmount) <= 0) return alert("Введите корректное количество ETH");
        try {
            await (await contract.fund({ value: ethers.parseEther(ethAmount) })).wait();
            loadContractData();
            gameSection.classList.remove("hidden"); // Показать игру после доната
            alert("Донат успешен! Теперь сыграйте в крестики-нолики.");
        } catch (err) {
            console.error(err);
            alert("Ошибка пожертвования: " + err.message);
        }
    };

    withdrawBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        try {
            await (await contract.withdraw()).wait();
            loadContractData();
        } catch (err) {
            console.error(err);
            alert("Ошибка вывода: " + err.message);
        }
    };

    refundBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        try {
            await (await contract.refund()).wait();
            loadContractData();
        } catch (err) {
            console.error(err);
            alert("Ошибка возврата: " + err.message);
        }
    };

    // Реализация Tic-Tac-Toe с ботом
    const boardEl = document.getElementById("board");
    const resetGameBtn = document.getElementById("resetGame");
    const gameStatusEl = document.getElementById("gameStatus");
    let board = Array(9).fill(null);
    let currentPlayer = "X"; // Игрок начинает
    let gameActive = true;

    function initGame() {
        board = Array(9).fill(null);
        currentPlayer = "X";
        gameActive = true;
        gameStatusEl.textContent = "";
        boardEl.innerHTML = "";
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.index = i;
            cell.addEventListener("click", handleCellClick);
            boardEl.appendChild(cell);
        }
    }

    function handleCellClick(e) {
        const index = e.target.dataset.index;
        if (board[index] || !gameActive || currentPlayer !== "X") return;
        board[index] = "X";
        e.target.textContent = "X";
        checkWinner();
        if (gameActive) {
            currentPlayer = "O";
            botMove();
        }
    }

    function botMove() {
        let available = board.map((val, idx) => val ? null : idx).filter(val => val !== null);
        if (available.length === 0) return;
        const move = available[Math.floor(Math.random() * available.length)]; // Простой рандомный бот (можно улучшить minimax)
        board[move] = "O";
        boardEl.querySelector(`[data-index="${move}"]`).textContent = "O";
        checkWinner();
        currentPlayer = "X";
    }

    function checkWinner() {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        for (let win of wins) {
            if (board[win[0]] && board[win[0]] === board[win[1]] && board[win[0]] === board[win[2]]) {
                gameActive = false;
                gameStatusEl.textContent = `${board[win[0]]} выиграл!`;
                return;
            }
        }
        if (!board.includes(null)) {
            gameActive = false;
            gameStatusEl.textContent = "Ничья!";
        }
    }

    resetGameBtn.onclick = initGame;
    initGame(); // Инициализация игры (скрыта до доната)
});
