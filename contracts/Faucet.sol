// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "hardhat/console.sol";

import "./SampleToken.sol";

/**
 * By extending BaseRelayRecipient, we acknowledge that Faucet is GSN-callable.
 *
 * NOTE: GSN-callable contracts MUST use _msgSender() NOT msg.sender.
 *       That's because on relay calls, msg.sender will be the Forwarder contract, not the user!
 *       And BaseRelayRecipient provides user's address with _msgSender().
 */

contract Faucet is BaseRelayRecipient {
    string symbol;
    address tokenAddr;
    uint mintAmount;
    address _trustedForwarder;

    uint timeout = 30 minutes;
    mapping (address => uint) timeouts;

    event Drip(address indexed to);

    constructor(string memory _symbol, address _tokenAddr, uint _mintAmount, address _forwarder) {
        symbol = _symbol;
        tokenAddr = _tokenAddr;
        mintAmount = _mintAmount; // with decimals
        _trustedForwarder = _forwarder; // the contract you will receive the calls through
    }

    // Drip to _msgSender
    function drip() external {
      require(timeouts[_msgSender()] <= block.timestamp - timeout, "DRIP_COOLDOWN");

      SampleToken token = SampleToken(tokenAddr);
      console.log("Faucet sender: %s", _msgSender());
      console.log("Faucet mint amount: %s", mintAmount);
      token.mint(_msgSender(), mintAmount);
      timeouts[_msgSender()] = block.timestamp;

      emit Drip(_msgSender());
    }

     function versionRecipient() external virtual override view returns (string memory) {
       return "2.0";
     }

    // @param {address} owner - address to check on SampleToken
    function _balanceOf(address _owner) private view returns (uint) {
        SampleToken token = SampleToken(tokenAddr);
        return token.balanceOf(_owner);
    }

    /*
    function destroy() private {
        require(msg.sender == owner, "Only the owner of this faucet can destroy it.");
        selfdestruct(msg.sender);
    }
    */
}
