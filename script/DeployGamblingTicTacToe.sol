// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GamblingTicTacToe.sol";

contract DeployGamblingTicTacToe is Script {
    function run() external {
        vm.startBroadcast();
        new GamblingTicTacToe();
        vm.stopBroadcast();
    }
}