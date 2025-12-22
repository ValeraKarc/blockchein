// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Secure Gambling Tic-Tac-Toe on Blockchain
/// @author Grok (built by xAI)
/// @notice This contract implements a secure on-chain Tic-Tac-Toe game with gambling mechanics.
/// Players stake ETH to start a game against an AI bot (using Minimax for optimal play).
/// Wins double the stake; losses forfeit it to the pool. Owner can withdraw the pool.
/// @dev Security features: CEI pattern to prevent reentrancy, require checks with messages,
/// no tx.origin, deterministic AI (no randomness vuln), gas-optimized Minimax (int8 for scores).
/// Uses transfer() for payouts (safe with 2300 gas stipend). No external calls except transfers.
contract GamblingTicTacToe {
    string public constant PROJECT_NAME = "Крестики-нолики за деньги";
    string public constant DESCRIPTION = "Правила приза при выигрыше - x2";
    uint256 public totalFunds;
    address public immutable owner;

    struct Donation {
        address donor;
        uint256 amount;
    }

    Donation[] public donations;

    struct Game {
        uint8[9] board; // 0: empty, 1: player (X), 2: bot (O)
        bool active;
        uint256 stake;
        bool playerTurn;
        bool playerWon;
    }

    mapping(address => Game) public games;

    event GameStarted(address indexed player, uint256 stake);
    event MoveMade(address indexed player, uint8 pos, uint8 botPos);
    event GameEnded(address indexed player, bool won);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event PrizeClaimed(address indexed player, uint256 prize);

    /// @notice Constructor sets the deployer as owner.
    /// @dev Owner is immutable for security (cannot be changed).
    constructor() {
        owner = msg.sender;
    }

    /// @notice Starts a new game with a stake.
    /// @dev Requires minimum stake, no active game. Uses CEI.
    function startGame() external payable {
        require(msg.value >= 0.001 ether, "Minimum stake is 0.001 ETH");
        require(!games[msg.sender].active, "Game already active");

        uint8[9] memory emptyBoard;
        games[msg.sender] = Game({
            board: emptyBoard,
            active: true,
            stake: msg.value,
            playerTurn: true,
            playerWon: false
        });

        totalFunds += msg.value;
        donations.push(Donation(msg.sender, msg.value));

        emit GameStarted(msg.sender, msg.value);
    }

    /// @notice Makes a player move and triggers bot response if applicable.
    /// @param pos Position to place X (0-8).
    /// @dev Validates move, checks win/draw, bot uses Minimax. Pure functions for AI to avoid state issues.
    function makeMove(uint8 pos) external {
        Game storage game = games[msg.sender];
        require(game.active, "No active game");
        require(game.playerTurn, "Not your turn");
        require(pos < 9, "Invalid position");
        require(game.board[pos] == 0, "Position occupied");

        // Player move
        game.board[pos] = 1;

        if (_checkWin(game.board, 1)) {
            game.active = false;
            game.playerWon = true;
            emit GameEnded(msg.sender, true);
            return;
        }

        if (_isBoardFull(game.board)) {
            game.active = false;
            emit GameEnded(msg.sender, false);
            return;
        }

        // Bot move
        game.playerTurn = false;
        uint8 botPos = _findBestMove(game.board);
        game.board[botPos] = 2;

        if (_checkWin(game.board, 2) || _isBoardFull(game.board)) {
            game.active = false;
            emit GameEnded(msg.sender, false);
        } else {
            game.playerTurn = true;
        }

        emit MoveMade(msg.sender, pos, botPos);
    }

    /// @notice Claims prize if player won.
    /// @dev CEI: Check conditions, update state, then transfer. Revert if insufficient funds.
    function claimPrize() external {
        Game storage game = games[msg.sender];
        require(!game.active, "Game still active");
        require(game.playerWon, "You did not win");
        uint256 stake = game.stake;
        require(stake > 0, "No stake to claim");

        uint256 prize = stake * 2;
        require(totalFunds >= prize, "Insufficient pool");

        // Effects
        game.stake = 0;
        totalFunds -= prize;

        // Interaction
        payable(msg.sender).transfer(prize);

        emit PrizeClaimed(msg.sender, prize);
    }

    /// @notice Withdraws the pool by owner.
    /// @dev CEI: Check owner and funds, update state, transfer.
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        uint256 amount = totalFunds;
        require(amount > 0, "No funds");

        // Effects
        totalFunds = 0;

        // Interaction
        payable(owner).transfer(amount);

        emit FundsWithdrawn(owner, amount);
    }

    /// @notice Returns donor count for viewing history.
    function donorCount() external view returns (uint256) {
        return donations.length;
    }

    /// @notice Returns donor details by index.
    function donors(uint256 index) external view returns (address donor, uint256 amount) {
        Donation storage d = donations[index];
        return (d.donor, d.amount);
    }

    // Internal pure functions for AI and checks (gas-efficient, no state access)

    /// @dev Finds best bot move using Minimax.
    function _findBestMove(uint8[9] memory _board) internal pure returns (uint8) {
        int8 bestVal = -127;
        uint8 bestMove = 255;
        for (uint8 i = 0; i < 9; i++) {
            if (_board[i] == 0) {
                _board[i] = 2;
                int8 moveVal = _minimax(_board, 0, false);
                _board[i] = 0;
                if (moveVal > bestVal) {
                    bestMove = i;
                    bestVal = moveVal;
                }
            }
        }
        return bestMove;
    }

    /// @dev Recursive Minimax with alpha-beta pruning potential (simplified for gas).
    function _minimax(uint8[9] memory _board, uint8 depth, bool isMax) internal pure returns (int8) {
        int8 score = _evaluate(_board);
        if (score == 10 || score == -10) return score - int8(depth);
        if (_isBoardFull(_board)) return 0;

        int8 best = isMax ? -127 : 127;
        for (uint8 i = 0; i < 9; i++) {
            if (_board[i] == 0) {
                _board[i] = isMax ? 2 : 1;
                int8 val = _minimax(_board, depth + 1, !isMax);
                _board[i] = 0;
                best = isMax ? _max(best, val) : _min(best, val);
            }
        }
        return best;
    }

    /// @dev Evaluates board score.
    function _evaluate(uint8[9] memory _board) internal pure returns (int8) {
        if (_checkWin(_board, 2)) return 10;
        if (_checkWin(_board, 1)) return -10;
        return 0;
    }

    /// @dev Checks for win.
    function _checkWin(uint8[9] memory _board, uint8 player) internal pure returns (bool) {
        uint8[3][8] memory wins = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        for (uint8 i = 0; i < 8; i++) {
            uint8[3] memory w = wins[i];
            if (_board[w[0]] == player && _board[w[1]] == player && _board[w[2]] == player) return true;
        }
        return false;
    }

    /// @dev Checks if board is full.
    function _isBoardFull(uint8[9] memory _board) internal pure returns (bool) {
        for (uint8 i = 0; i < 9; i++) {
            if (_board[i] == 0) return false;
        }
        return true;
    }

    /// @dev Max helper.
    function _max(int8 a, int8 b) internal pure returns (int8) {
        return a > b ? a : b;
    }

    /// @dev Min helper.
    function _min(int8 a, int8 b) internal pure returns (int8) {
        return a < b ? a : b;
    }
}