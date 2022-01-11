// NOTE: mocha & ethers is available automatically

const { expect } = require('chai')
// const { ethers } = require('hardhat') // enable this line if linting gives error

const { keccak256, toUtf8Bytes } = ethers.utils

const TOKEN_NAME = 'SampleToken'
const TOKEN_SYMBOL = 'SAM';
const TOKEN_INITIAL_SUPPLY = 10e9; // without decimals
const MINT_AMOUNT = 10e3; // without decimals

describe('Sample Contract', () => {
  let SAMTokenFactory;
  let SAM;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let decimals;

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    SAMTokenFactory = await ethers.getContractFactory('SampleToken');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners()

    // To deploy our contract, we just have to call Token.deploy() and await for it to be
    // deployed(), which happens once its transaction has been mined.
    SAM = await SAMTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_INITIAL_SUPPLY) // { from: owner }
    decimals = await SAM.decimals()
  });

  /**
   * NOTE: use describe.only() to only run that particular test
   */

  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      expect(await SAM.owner()).to.equal(owner.address)
    })

    it('Assigns the total supply of tokens to the owner', async () => {
      const ownerBalance = await SAM.balanceOf(owner.address)
      expect(await SAM.totalSupply()).to.equal(ownerBalance)
    })
  })

  describe('Transactions', () => {
    it('Transfers tokens between accounts', async () => {
      // Transfer tokens from owner to addr1
      await SAM.transfer(addr1.address, 1000)
      expect(await SAM.balanceOf(addr1.address)).to.equal(1000)

      // Transfer tokens from addr1 to addr2 (.connect sends from addr1)
      await SAM.connect(addr1).transfer(addr2.address, 1000)
      expect(await SAM.balanceOf(addr2.address)).to.equal(1000)
    })

    it('Fails if sender does not have enough tokens', async () => {
      const initialOwnerBalance = await SAM.balanceOf(owner.address)

      // Try to send 100 token from addr1 (0 tokens) to owner
      await expect(
        SAM.connect(addr1).transfer(owner.address, 100)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance') // ERC20__InsufficientBalance

      // Owner balance shouldn't have changed.
      expect(await SAM.balanceOf(owner.address)).to.equal(initialOwnerBalance)
    })

    it('Updates balances after transfers', async function () {
      const initialOwnerBalance = await SAM.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1
      await SAM.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2
      await SAM.transfer(addr2.address, 50);

      // Check balances
      expect(await SAM.balanceOf(owner.address)).to.equal(initialOwnerBalance - 150)
      expect(await SAM.balanceOf(addr1.address)).to.equal(100)
      expect(await SAM.balanceOf(addr2.address)).to.equal(50)
    })
  })
})
