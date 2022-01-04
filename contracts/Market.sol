// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 0.01 ether;

    struct MarketItem {
        uint itemId;
        address nftContract;
        address payable owner;
        uint256 price;
        address payable seller;
        bool sold;
        uint256 tokenId;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        address owner,
        uint256 price,
        address seller,
        bool sold,
        uint256 indexed tokenId
    );

    constructor() {
        owner = payable(msg.sender);
    }

    function getListingPrice() public view returns (uint256) {
      return listingPrice;
    }

    function createMarketItem(
      address _nftContract,
      uint256 _price,
      uint256 _tokenId
    ) public payable nonReentrant {
      require(_price > 0, "Price cannot be zero");
      require(msg.value == listingPrice, "Price must equal the listing price");

      _itemIds.increment();
      uint256 itemId = _itemIds.current();
    }
}
