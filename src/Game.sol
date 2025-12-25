// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Game {
    address public owner;
    uint256 public totalBank;
    uint256 public currentBet;
    bool public gameActive;
    address public currentPlayer;

    constructor() {
        owner = msg.sender;
        totalBank = 0;
        currentBet = 0;
        gameActive = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyPlayer() {
        require(msg.sender == currentPlayer, "Not current player");
        _;
    }

    function placeBet() external payable {
        require(!gameActive, "Game already active");
        require(msg.value >= 0.0001 ether, "Minimum bet 0.0001 ETH");

        currentBet = msg.value;
        totalBank += msg.value;
        currentPlayer = msg.sender;
        gameActive = true;
    }

    function rewardWinner() external onlyPlayer {
        require(gameActive, "Game not active");
        uint256 reward = currentBet;
        require(address(this).balance >= reward, "Not enough balance");

        currentBet = 0;
        gameActive = false;
        currentPlayer = address(0);
        totalBank -= reward;
        payable(msg.sender).transfer(reward);
    }

    function markLoss() external onlyPlayer {
        require(gameActive, "Game not active");

        currentBet = 0;
        gameActive = false;
        currentPlayer = address(0);
    }

    function resetGame() external {
        currentBet = 0;
        gameActive = false;
        currentPlayer = address(0);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= totalBank, "Not enough funds");
        totalBank -= amount;
        payable(owner).transfer(amount);
    }

    function getBank() external view returns (uint256) {
        return totalBank;
    }

    receive() external payable {}
}
