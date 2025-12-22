// app.js - Secure Frontend for Gambling Tic-Tac-Toe dApp
// Uses Ethers.js v6 for Web3 interactions. No eval or unsafe-eval. Input validation on client-side.

window.addEventListener("DOMContentLoaded", async () => {
    const contractAddress = "INSERT_DEPLOYED_ADDRESS_HERE"; // Replace after deploy
    const abi = [ /* Updated ABI from contract - paste here */ ]; // Use Remix or forge to get full ABI

    // DOM elements - cached for performance
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

    let provider, signer, contract, userAddress;

    connectBtn.onclick = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();
            contract = new ethers.Contract(contractAddress, abi, signer);
            connectBtn.innerText = `Connected: ${userAddress.slice(0, 6)}...`;
            await loadData();
        } catch (err) {
            console.error(err);
            alert(`Connection error: ${err.message}`);
        }
    };

    async function loadData() {
        if (!contract) return;
        try {
            projectNameEl.textContent = await contract.PROJECT_NAME();
            descriptionEl.textContent = await contract.DESCRIPTION();
            totalFundsEl.textContent = ethers.formatEther(await contract.totalFunds());
            ownerEl.textContent = await contract.owner();

            donationsList.innerHTML = "";
            const count = Number(await contract.donorCount());
            for (let i = 0; i < count; i++) {
                const [donor, amount] = await contract.donors(i);
                if (Number(amount) > 0) {
                    const li = document.createElement("li");
                    li.textContent = `${donor}: ${ethers.formatEther(amount)} ETH`;
                    donationsList.appendChild(li);
                }
            }

            await loadGameState();
        } catch (err) {
            console.error(err);
            alert(`Data load error: ${err.message}`);
        }
    }

    async function loadGameState() {
        if (!userAddress) return;
        try {
            const game = await contract.games(userAddress);
            if (game.active) {
                gameSection.classList.remove("hidden");
                startBtn.disabled = true;
                gameStatusEl.textContent = game.playerTurn ? "Your turn (X)" : "Bot's turn (O)";
                renderBoard(game.board);
            } else if (game.stake > 0) {
                gameSection.classList.remove("hidden");
                renderBoard(game.board);
                if (game.playerWon) {
                    gameResultEl.textContent = "Ты Выиграл!";
                    gameResultEl.classList.add("win");
                    claimBtn.classList.remove("hidden");
                } else {
                    gameResultEl.textContent = "You lost! Stake forfeited.";
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
        } catch (err) {
            console.error(err);
            alert(`Game load error: ${err.message}`);
        }
    }

    function renderBoard(board) {
        boardEl.innerHTML = "";
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.index = i.toString();
            cell.textContent = board[i] === 1 ? "X" : board[i] === 2 ? "O" : "";
            if (board[i] === 1) cell.classList.add("x");
            if (board[i] === 2) cell.classList.add("o");
            if (board[i] === 0 && games[userAddress]?.playerTurn && games[userAddress]?.active) {
                cell.addEventListener("click", handleCellClick);
            }
            boardEl.appendChild(cell);
        }
    }

    async function handleCellClick(e) {
        const pos = parseInt(e.target.dataset.index, 10);
        if (isNaN(pos)) return; // Secure against invalid input
        try {
            const tx = await contract.makeMove(pos, { gasLimit: 1_000_000 }); // Gas limit for Minimax
            await tx.wait();
            await loadData();
        } catch (err) {
            console.error(err);
            alert(`Move error: ${err.message}`);
        }
    }

    startBtn.onclick = async () => {
        if (!contract) return alert("Connect MetaMask first!");
        const ethAmount = parseFloat(amountInput.value);
        if (isNaN(ethAmount) || ethAmount < 0.001) return alert("Minimum stake 0.001 ETH");
        try {
            const tx = await contract.startGame({ value: ethers.parseEther(ethAmount.toString()) });
            await tx.wait();
            await loadData();
        } catch (err) {
            console.error(err);
            alert(`Start error: ${err.message}`);
        }
    };

    withdrawBtn.onclick = async () => {
        if (!contract) return alert("Connect MetaMask first!");
        try {
            const tx = await contract.withdraw();
            await tx.wait();
            await loadData();
        } catch (err) {
            console.error(err);
            alert(`Withdraw error: ${err.message}`);
        }
    };

    claimBtn.onclick = async () => {
        if (!contract) return alert("Connect MetaMask first!");
        try {
            const tx = await contract.claimPrize();
            await tx.wait();
            await loadData();
        } catch (err) {
            console.error(err);
            alert(`Claim error: ${err.message}`);
        }
    };

    // Event listeners for real-time updates (secure, filtered by user)
    if (contract) {
        contract.on("MoveMade", (player) => {
            if (player.toLowerCase() === userAddress.toLowerCase()) loadData();
        });
        contract.on("GameEnded", (player) => {
            if (player.toLowerCase() === userAddress.toLowerCase()) loadData();
        });
    }
});