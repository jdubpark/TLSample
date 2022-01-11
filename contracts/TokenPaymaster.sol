// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@opengsn/contracts/src/forwarder/IForwarder.sol";
import "@opengsn/contracts/src/BasePaymaster.sol";

import "./SampleToken.sol";

/**
 * A Token-based paymaster.
 * - each request is paid for by the caller.
 * - acceptRelayedCall - verify the caller can pay for the request in tokens.
 * - preRelayedCall - pre-pay the maximum possible price for the tx
 * - postRelayedCall - refund the caller for the unused gas
 *
 * Modified to support only one token
 * But you need to support multiple tokens, refer to: https://github.com/opengsn/gsn-paymasters/blob/master/contracts/TokenPaymaster.sol
 *
 * More Paymaster examples: https://github.com/opengsn/gsn-paymasters/tree/master/contracts
 */
contract TokenPaymaster is BasePaymaster {
    function versionPaymaster() external override virtual view returns (string memory){
        return "2.2.0+opengsn.token.ipaymaster";
    }

    SampleToken token;

    uint public gasUsedByPost;

    constructor(address _tokenAddr) {
        token = SampleToken(_tokenAddr);
        // token.apprve(address(_tokenAddr), uint(-1));
    }

    /**
     * set gas used by postRelayedCall, for proper gas calculation.
     * You can use TokenGasCalculator to calculate these values (they depend on actual code of postRelayedCall,
     * but also the gas usage of the token)
     */
    function setPostGasUsage(uint _gasUsedByPost) external onlyOwner {
        gasUsedByPost = _gasUsedByPost;
    }

    // return the payer of this request.
    // for account-based target, this is the target account.
    function getPayer(GsnTypes.RelayRequest calldata _relayRequest) public virtual view returns (address) {
        (this);
        return _relayRequest.request.to;
    }

    event Received(uint eth);

    receive() external override payable {
        emit Received(msg.value);
    }

    function _calculatePreCharge(
        SampleToken _token,
        GsnTypes.RelayRequest calldata _relayRequest,
        uint256 _maxPossibleGas
    )
        internal
        view
        returns (address payer, uint256 tokenPreCharge)
    {
        (_token);
        payer = this.getPayer(_relayRequest);
        // Get token pre charge
        uint ethMaxCharge = relayHub.calculateCharge(_maxPossibleGas, _relayRequest.relayData);
        ethMaxCharge += _relayRequest.request.value;
        tokenPreCharge = _getTokenToEthOutputPrice(ethMaxCharge);
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata _relayRequest,
        bytes calldata _signature,
        bytes calldata _approvalData,
        uint256 _maxPossibleGas
    )
        external
        override
        virtual
        relayHubOnly
        returns (bytes memory context, bool revertOnRecipientRevert)
    {
        (_relayRequest, _signature, _approvalData, _maxPossibleGas);

        // Gas charge on Paymaster
        (address payer, uint256 tokenPrecharge) = _calculatePreCharge(token, _relayRequest, _maxPossibleGas);
        token.transferFrom(payer, address(this), tokenPrecharge);

        // Returning "true" means this paymaster accepts all requests
        //   that are not rejected by the recipient contract.
        // More on the matter: https://docs.opengsn.org/contracts/#paying-for-your-user-s-meta-transaction
        return (abi.encode(payer, tokenPrecharge, token), true);
    }

    function postRelayedCall(
        bytes calldata _context,
        bool,
        uint256 _gasUseWithoutPost,
        GsnTypes.RelayData calldata _relayData
    )
        external
        override
        virtual
        relayHubOnly
    {
        (address _payer, uint256 tokenPrecharge, SampleToken _token) = abi.decode(_context, (address, uint256, SampleToken));
        _postRelayedCallInternal(_payer, tokenPrecharge, 0, _gasUseWithoutPost, _relayData, _token);
    }

    function _postRelayedCallInternal(
        address _payer,
        uint256 _tokenPrecharge,
        uint256 _valueRequested,
        uint256 _gasUseWithoutPost,
        GsnTypes.RelayData calldata _relayData,
        SampleToken _token
    ) internal {
        uint256 ethActualCharge = relayHub.calculateCharge(_gasUseWithoutPost + gasUsedByPost, _relayData);
        uint256 tokenActualCharge = _getTokenToEthOutputPrice(_valueRequested + ethActualCharge);
        uint256 tokenRefund = _tokenPrecharge - tokenActualCharge;
        _refundPayer(_payer, _token, tokenRefund);
        _depositProceedsToHub(ethActualCharge);
        emit TokensCharged(_gasUseWithoutPost, gasUsedByPost, ethActualCharge, tokenActualCharge);
    }

    function _getTokenToEthOutputPrice(uint256 _ethBought) private pure returns (uint256 out) {
        // for now, do 1:1 on token & ether
        return _ethBought;
    }

    function _refundPayer(
        address _payer,
        SampleToken _token,
        uint256 _tokenRefund
    ) private {
        require(_token.transfer(_payer, _tokenRefund), "failed refund");
    }

    function _depositProceedsToHub(uint256 ethActualCharge) private {
        //solhint-disable-next-line
        relayHub.depositFor{value:ethActualCharge}(address(this));
    }

    event TokensCharged(uint gasUseWithoutPost, uint gasJustPost, uint ethActualCharge, uint tokenActualCharge);
}
