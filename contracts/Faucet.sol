// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

import "./SampleToken.sol";

contract Faucet is Ownable {
    string symbol;
    address tokenAddr;
    uint mintAmount;

    uint timeout = 30 minutes;
    mapping (address => uint) timeouts;

    event Drip(address indexed to);

    constructor(string memory _symbol, address _tokenAddr, uint _mintAmount) {
        symbol = _symbol;
        tokenAddr = _tokenAddr;
        mintAmount = _mintAmount; // with decimals
    }

    // Drip to msg.sender
    function drip() external {
      require(timeouts[msg.sender] <= block.timestamp - timeout, "DRIP_COOLDOWN");

      SampleToken token = SampleToken(tokenAddr);
      console.log("Faucet sender: %s", msg.sender);
      console.log("Faucet mint amount: %s", mintAmount);
      token.mint(msg.sender, mintAmount);
      timeouts[msg.sender] = block.timestamp;

      emit Drip(msg.sender);
    }

    // @param {address} owner - address to check on SampleToken
    function _balanceOf(address _owner) private view returns (uint) {
        SampleToken token = SampleToken(tokenAddr);
        return token.balanceOf(_owner);
    }

    /*
    function destroy() public {
        require(msg.sender == owner, "Only the owner of this faucet can destroy it.");
        selfdestruct(msg.sender);
    }
    */
}
