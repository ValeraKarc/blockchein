// app.js - Secure Frontend for Gambling Tic-Tac-Toe dApp
// Uses Ethers.js v6 for Web3 interactions. No eval or unsafe-eval. Input validation on client-side.
// Added: ABI full array, error decoding for reverts, MetaMask events for auto-reload.

window.addEventListener("DOMContentLoaded", async () => {
    const contractAddress = "0x253F0835b5252E7C3bAc602FED8Abb9138c7E8C9"; // После деплоя
    const abi = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "won",
                    "type": "bool"
                }
            ],
            "name": "GameEnded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "stake",
                    "type": "uint256"
                }
            ],
            "name": "GameStarted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "pos",
                    "type": "uint8"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "botPos",
                    "type": "uint8"
                }
            ],
            "name": "MoveMade",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "prize",
                    "type": "uint256"
                }
            ],
            "name": "PrizeClaimed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "FundsWithdrawn",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "DESCRIPTION",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "PROJECT_NAME",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "claimPrize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "donorCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "donations",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "donor",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "index",
                    "type": "uint256"
                }
            ],
            "name": "donors",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "donor",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }