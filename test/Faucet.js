// const { RelayProvider } = require('@opengsn/provider')
// const { GsnTestEnvironment } = require('@opengsn/gsn/dist/GsnTestEnvironment' )
const { expect } = require('chai')
// const { ethers } = require('hardhat') // enable this line if linting gives error
const forwarderAddress = require( '../build/gsn/Forwarder').address
// TODO: Replace this default Paymaster with TokenPaymaster
// INFO: paymaster that will accept and pay for all transactions
const paymasterAddress = require('../build/gsn/Paymaster').address

const { keccak256, toUtf8Bytes } = ethers.utils

const config = {
    paymasterAddress,
    loggerConfiguration: {
        logLevel: 'debug',
        // loggerUrl: 'logger.opengsn.org',
    }
}

const TOKEN_NAME = 'SampleToken'
const TOKEN_SYMBOL = 'SAM';
const TOKEN_INITIAL_SUPPLY = 10e9; // without decimals
const MINT_AMOUNT = 10e3; // without decimals

describe('Sample Faucet', () => {
  let SAMTokenFactory;
  let FaucetFactory;
  let SAM;
  let Faucet;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let decimals;

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    SAMTokenFactory = await ethers.getContractFactory('SampleToken');
    FaucetFactory = await ethers.getContractFactory('Faucet');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners()

    // To deploy our contract, we just have to call Token.deploy() and await for it to be
    // deployed(), which happens once its transaction has been mined.
    SAM = await SAMTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_INITIAL_SUPPLY) // { from: owner }
    decimals = await SAM.decimals()

    // forwarderAddress is the address of the Forwarder deployed on network (on local, use `npx gsn start`)
    Faucet = await FaucetFactory.deploy(TOKEN_SYMBOL, SAM.address, MINT_AMOUNT * 10 ** decimals, forwarderAddress)

    await SAM.addMinter(Faucet.address);
  });

  /**
   * NOTE: use describe.only() to only run that particular test
   */

  describe('Deployment', () => {
    it('Set Faucet as the only other minter', async () => {
      const MINTER_ROLE = keccak256(toUtf8Bytes('MINTER_ROLE')) // convert utf8 to bytes first
      const minterCount = await SAM.getRoleMemberCount(MINTER_ROLE)

      const minters = [];
      for (let i = 0; i < minterCount; ++i) {
          minters.push(await SAM.getRoleMember(MINTER_ROLE, i));
      }

      expect(minterCount).to.equal(2)
      expect(minters).to.deep.equal([await SAM.owner(), Faucet.address]) // must do .deep.equal
    })
  })

  describe('Drips', () => {
    it('Drips and emit "Drip"', async () => {
      // Call .drip() on Faucet as addr1 (msg.sender == addr1.address)
      await expect(Faucet.connect(addr1).drip()).to.emit(Faucet, 'Drip')
      expect(await SAM.balanceOf(addr1.address)).to.equal(MINT_AMOUNT * 10 ** decimals)
    })

    it('Maintains timeout for the same address', async () => {
      await Faucet.connect(addr1).drip()
      await expect(Faucet.connect(addr1).drip()).to.be.revertedWith('DRIP_COOLDOWN')
    })

    it('', async () => {
      const provider = await RelayProvider.newProvider({ provider: web3.currentProvider, config }).init()
      const web3 = new Web3(provider);
    })
  })
})
