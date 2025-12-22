// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GamblingTicTacToe {
    string public projectName = "Крестики-нолики за деньги";
    string public description = "Правила приза при выигрыше - x2";
    uint public totalFunds;
    address public owner;

    struct Donation {
        address donor;
        uint amount;
    }

    Donation[] public donations;

    struct Game {
        uint8[9] board; // 0 empty, 1 player (X), 2 bot (O)
        bool active;
        uint stake;
        bool playerTurn;
        bool playerWon;
    }

    mapping(address => Game) public games;

    event GameStarted(address player, uint stake);
    event MoveMade(address player, uint pos, uint botPos);
    event GameEnded(address player, bool won);

    constructor() {
        owner = msg.sender;
    }

    function startGame() public payable {
        require(msg.value >= 0.001 ether, "Minimum stake is 0.001 ETH");
        require(!games[msg.sender].active, "Game already active");

        uint8[9] memory emptyBoard;
        games[msg.sender] = Game(emptyBoard, true, msg.value, true, false);
        totalFunds += msg.value;
        donations.push(Donation(msg.sender, msg.value));

        emit GameStarted(msg.sender, msg.value);
    }

    function makeMove(uint8 pos) public {
        Game storage game = games[msg.sender];
        require(game.active, "No active game");
        require(game.playerTurn, "Not your turn");
        require(pos < 9, "Invalid position");
        require(game.board[pos] == 0, "Position occupied");

        // Player move (X = 1)
        game.board[pos] = 1;

        if (checkWin(game.board, 1)) {
            game.active = false;
            game.playerWon = true;
            emit GameEnded(msg.sender, true);
            return;
        }

        if (isBoardFull(game.board)) {
            game.active = false;
            emit GameEnded(msg.sender, false);
            return;
        }

        // Bot move (O = 2)
        game.playerTurn = false;
        uint8 botPos = findBestMove(game.board);
        game.board[botPos] = 2;

        if (checkWin(game.board, 2) || isBoardFull(game.board)) {
            game.active = false;
            emit GameEnded(msg.sender, false);
        } else {
            game.playerTurn = true;
        }

        emit MoveMade(msg.sender, pos, botPos);
    }

    function claimPrize() public {
        Game storage game = games[msg.sender];
        require(!game.active, "Game still active");
        require(game.playerWon, "You did not win");
        require(game.stake > 0, "No stake to claim");

        uint prize = game.stake * 2;
        require(totalFunds >= prize, "Insufficient pool");

        totalFunds -= prize;
        game.stake = 0;
        payable(msg.sender).transfer(prize);
    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner");
        require(totalFunds > 0, "No funds");
        uint amount = totalFunds;
        totalFunds = 0;
        payable(owner).transfer(amount);
    }

    // Minimax AI (pure functions for security)
    function findBestMove(uint8[9] memory _board) internal pure returns (uint8) {
        int8 bestVal = -127;
        uint8 bestMove = 255;
        for (uint8 i = 0; i < 9; i++) {
            if (_board[i] == 0) {
                _board[i] = 2;
                int8 moveVal = minimax(_board, 0, false);
                _board[i] = 0;
                if (moveVal > bestVal) {
                    bestMove = i;
                    bestVal = moveVal;
                }
            }
        }
        return bestMove;
    }

    function minimax(uint8[9] memory _board, uint8 depth, bool isMax) internal pure returns (int8) {
        int8 score = evaluate(_board);
        if (score == 10 || score == -10) return score - int8(depth); // Depth adjustment for faster wins
        if (isBoardFull(_board)) return 0;

        int8 best = isMax ? -127 : 127;
        for (uint8 i = 0; i < 9; i++) {
            if (_board[i] == 0) {
                _board[i] = isMax ? 2 : 1;
                int8 val = minimax(_board, depth + 1, !isMax);
                _board[i] = 0;
                best = isMax ? max(best, val) : min(best, val);
            }
        }
        return best;
    }

    function evaluate(uint8[9] memory _board) internal pure returns (int8) {
        if (checkWin(_board, 2)) return 10;
        if (checkWin(_board, 1)) return -10;
        return 0;
    }

    function checkWin(uint8[9] memory _board, uint8 player) internal pure returns (bool) {
        uint8[3][8] memory wins = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ];
        for (uint8 i = 0; i < 8; i++) {
            if (_board[wins[i][0]] == player && _board[wins[i][1]] == player && _board[wins[i][2]] == player) return true;
        }
        return false;
    }

    function isBoardFull(uint8[9] memory _board) internal pure returns (bool) {
        for (uint8 i = 0; i < 9; i++) {
            if (_board[i] == 0) return false;
        }
        return true;
    }

    function max(int8 a, int8 b) internal pure returns (int8) {
        return a > b ? a : b;
    }

    function min(int8 a, int8 b) internal pure returns (int8) {
        return a < b ? a : b;
    }

    function donorCount() public view returns (uint) {
        return donations.length;
    }

    function donors(uint index) public view returns (address donor, uint amount) {
        Donation storage d = donations[index];
        return (d.donor, d.amount);
    }
}