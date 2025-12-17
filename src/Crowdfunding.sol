// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfunding {
    string public projectName;
    string public description;
    uint256 public goal;
    uint256 public totalFunds;
    address public owner;

    struct Donation {
        address donor;
        uint256 amount;
    }

    Donation[] public donations;

    constructor(
        string memory _name,
        string memory _description,
        uint256 _goal
    ) {
        projectName = _name;
        description = _description;
        goal = _goal;
        owner = msg.sender;
    }

    function fund() external payable {
        require(msg.value > 0, "Donate more than 0");

        donations.push(Donation(msg.sender, msg.value));
        totalFunds += msg.value;
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        require(totalFunds > 0, "No funds");

        uint256 amount = totalFunds;
        totalFunds = 0;

        payable(owner).transfer(amount);
    }

    function refund() external {
        require(totalFunds < goal, "Goal reached");

        uint256 refundAmount;

        for (uint256 i = 0; i < donations.length; i++) {
            if (donations[i].donor == msg.sender && donations[i].amount > 0) {
                refundAmount += donations[i].amount;
                donations[i].amount = 0;
            }
        }

        require(refundAmount > 0, "Nothing to refund");

        totalFunds -= refundAmount;
        payable(msg.sender).transfer(refundAmount);
    }

    function donorCount() external view returns (uint256) {
        return donations.length;
    }

    function donors(uint256 index)
        external
        view
        returns (address, uint256)
    {
        Donation storage d = donations[index];
        return (d.donor, d.amount);
    }
}
