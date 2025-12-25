const contractAddress = "0x18Fc1705d9AA24A6A933DC9c320d70d5b19a2D93";
const abi = [
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"resetGame","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getBank","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"rewardWinner","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"markLoss","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"placeBet","outputs":[],"stateMutability":"payable","type":"function"}
];

let provider, signer, contract;
let betAmount = "0";
let gameActive = false;

const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");
const gameDiv = document.getElementById("game");
const placeBetBtn = document.getElementById("placeBetBtn");
const betAmountInput = document.getElementById("betAmount");
const cardsDiv = document.getElementById("cards");
const restartBtn = document.getElementById("restartBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const withdrawAmountInput = document.getElementById("withdrawAmount");
const bankStatus = document.getElementById("bankStatus");

// Connect MetaMask
connectBtn.onclick = async () => {
  if(!window.ethereum) return alert("Install MetaMask!");
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  contract = new ethers.Contract(contractAddress, abi, signer);
  const account = await signer.getAddress();
  statusEl.innerText = "Connected: " + account.slice(0,6) + "...";
  gameDiv.style.display = "block";
  updateBank();
};

// Update Bank
async function updateBank() {
  if(!contract) return;
  const bank = await contract.getBank();
  bankStatus.innerText = "Game Bank: " + ethers.formatEther(bank) + " ETH";
}

// Place Bet
placeBetBtn.onclick = async () => {
  if(gameActive) return alert("Finish current game first!");
  const amount = betAmountInput.value;
  if(!amount || Number(amount) < 0.0001) return alert("Minimum bet 0.0001 ETH");
  try {
    betAmount = amount.toString();
    const tx = await contract.placeBet({ value: ethers.parseEther(betAmount) });
    await tx.wait();
    gameActive = true;
    renderCards();
    updateBank();
  } catch(e){
    console.error(e);
    alert("Bet failed: " + e.message);
  }
};

// Render Cards
function renderCards() {
  cardsDiv.innerHTML = "";
  cardsDiv.style.display = "flex";
  let selectedCardIndex = null;

  for(let i=0;i<5;i++){
    const card = document.createElement("div");
    card.classList.add("card");

    const front = document.createElement("div");
    front.classList.add("front");
    front.innerText = "?";

    const back = document.createElement("div");
    back.classList.add("back");

    card.appendChild(front);
    card.appendChild(back);
    cardsDiv.appendChild(card);

    card.onclick = async () => {
      if(selectedCardIndex !== null) return; 
      selectedCardIndex = i;

      const winningIndex = Math.floor(Math.random()*5);

      Array.from(cardsDiv.children).forEach((c, index)=>{
        c.classList.add("flipped");
        c.querySelector(".front").innerText = (index===winningIndex) ? "★" : "✖";
      });

      gameActive = false;

      if(selectedCardIndex === winningIndex){
        alert("You won! Confirm transaction to get your reward.");
        try {
          const tx = await contract.rewardWinner();
          await tx.wait();
          updateBank();
        } catch(e){
          console.error(e);
          alert("Transaction failed: "+e.message);
        }
      } else {
        alert("You lost!");
        try {
          const tx = await contract.markLoss();
          await tx.wait();
        } catch(e){
          console.error(e);
        }
      }
    };
  }
}

// Restart Game
restartBtn.onclick = async () => {
  if(!contract) return;
  try {
    const tx = await contract.resetGame();
    await tx.wait();
    cardsDiv.innerHTML = "";
    cardsDiv.style.display = "none";
    betAmountInput.value = "";
    gameActive = false;
    betAmount = "0";
    alert("Game reset! Place a new bet.");
    updateBank();
  } catch(e){
    console.error(e);
    alert("Reset failed: "+e.message);
  }
};

// Withdraw Bank
withdrawBtn.onclick = async () => {
  const amount = withdrawAmountInput.value;
  if(!amount || Number(amount)<=0) return alert("Enter valid amount");
  try {
    const tx = await contract.withdraw(ethers.parseEther(amount.toString()));
    await tx.wait();
    alert("Funds withdrawn!");
    updateBank();
  } catch(e){
    console.error(e);
    alert("Withdraw failed: "+e.message);
  }
};
