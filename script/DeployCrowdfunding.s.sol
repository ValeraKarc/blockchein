// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Crowdfunding.sol";

contract DeployCrowdfunding is Script {
    function run() external {
        vm.startBroadcast();
        new Crowdfunding("Tic-Tac-Toe Crowdfunding Project", "Соберите средства на разработку блокчейн-игры крестики-нолики!", 1 ether);
        vm.stopBroadcast();
    }
}