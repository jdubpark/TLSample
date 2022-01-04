// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "hardhat/console.sol";

/**
 * Functions should be grouped according to their visibility and ordered:
 * constructor
 * receive function (if exists)
 * fallback function (if exists)
 * external
 * public
 * internal
 * private
 * (Within a grouping, place the view and pure functions last.)
*/

contract SampleToken is ERC20PresetMinterPauser, Ownable {
  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _initialSupply
  ) ERC20PresetMinterPauser(_name, _symbol) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _mint(msg.sender, _initialSupply * 10 ** decimals());
    console.log("Contract constructor caller: %s", msg.sender);
  }

  function decimals() public pure virtual override returns (uint8) {
    return 2;
  }

  // automatically only allows accounts with DEFAULT_ADMIN_ROLE
  function addMinter(address _addr) public {
    grantRole(MINTER_ROLE, _addr);
  }

  function removeMinter(address _addr) private {
    revokeRole(MINTER_ROLE, _addr);
  }
}
