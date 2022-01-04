// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8;

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import "hardhat/console.sol";

//
// ERC20Permit adds `permit`:
//    Used to change an account’s ERC20 allowance by presenting a message signed by the account.
//    By not relying on IERC20.approve, the token holder account doesn’t need to send a transaction,
//    and thus is not required to hold Ether at all.
//

contract SampleCoin is ERC20, ERC20Permit, Ownable {
    uint constant MINT_AMOUNT = 10 ** 3 * 10 ** 2;

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) ERC20(_name, _symbol) ERC20Permit(_name) {
        _mint(msg.sender, _initialSupply * 10 ** decimals());
        console.log("Contract constructor caller: ", msg.sender);
    }

    /**
     * Override decimals to 2 (akin to cents)
     */
    function decimals() public override pure returns (uint8) {
        return 2;
    }

    function versionRecipient() external pure returns (string memory) {
        return "2.0.0";
    }
}
