// const { RelayProvider } = require('@opengsn/gsn')
// const { GsnTestEnvironment } = require('@opengsn/gsn/dist/GsnTestEnvironment' )

// NOTE: mocha & ethers is available automatically

const { expect } = require('chai')
// const { ethers } = require('hardhat') // enable this line if linting gives error

const { BigNumber } = ethers
const { AddressZero } = ethers.constants
const { defaultAbiCoder, keccak256, SigningKey, solidityPack, toUtf8Bytes } = ethers.utils

const TOKEN_NAME = 'Sample Coin'
const TOKEN_SYMBOL = 'SAM'
const TOKEN_INITIAL_SUPPLY = 10e9 // equivalent to total supply initially
const TOKEN_VERSION = '1'

const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const HARDHAT_CHAIN_ID = 31337 // default localhost chainId


/// Returns the Eip712 domain separator.
/**
 * Returns the EIP712 domain separator
 * @param {string} name
 * @param {number} chainId
 * @param {string} tokenAddress
 * @returns {string}
 */
const getDomainSeparator = (name, chainId, tokenAddress) => keccak256(
  defaultAbiCoder.encode(
    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    [
      keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
      keccak256(toUtf8Bytes(name)),
      keccak256(toUtf8Bytes(TOKEN_VERSION)),
      chainId,
      tokenAddress,
    ],
  ),
)

// Must match the typehash in Erc20PermitStorage.sol
const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)'),
)

const fakeSig = {
  v: BigNumber.from('27'),
  r: '0x0000000000000000000000000000000000000000000000000000000000000001',
  s: '0x0000000000000000000000000000000000000000000000000000000000000002',
}

/**
 * @interface PermitApproveRequest
 * @property {string} owner
 * @property {string} spender
 * @property {BigNumber} amount
 */

/**
 * Returns the Eip712 hash that must be signed by the user in order to make a call to `permit`.
 * @param {ERC20Permit} token
 * @param {BigNumber} chainId
 * @param {PermitApproveRequest} approve
 * @param {BigNumber} nonce
 * @param {BigNumber} deadline
 * @returns {Promise<string>}
 */
async function getPermitDigest(
  token, chainId, approve, nonce, deadline,
) {
  const tokenName = await token.name()
  const DOMAIN_SEPARATOR = getDomainSeparator(tokenName, chainId, token.address)
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.amount, nonce, deadline],
          ),
        ),
      ],
    ),
  )
}

/**
 * Creates a signature
 * @param {ERC20Permit} token
 * @param {BigNumber} deadline
 * @param {string} owner Owner address
 * @param {string} spender Spender address
 * @returns {Promise<Signature>}
 */
async function createSignature(token, deadline, owner, spender, amount) {
  // Get the user's nonce (owner in most cases)
  const nonce = await token.nonces(owner) // arg: address

  // Create the approval request
  const approve = { amount, owner, spender }

  // Get the EIP712 digest
  const digest = await getPermitDigest(
    token,
    BigNumber.from(String(HARDHAT_CHAIN_ID)),
    approve,
    nonce,
    deadline,
  )

  // Sign the digest
  const ownerSK = new SigningKey(OWNER_PRIVATE_KEY) // accounts[0]
  const signature = ownerSK.signDigest(digest)

  return signature
}

describe('SampleCoin Contract', () => {
  let SAMTokenFactory;
  let SAM;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let spender;

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    SAMTokenFactory = await ethers.getContractFactory('SampleCoin');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners()

    spender = addr1

    // To deploy our contract, we just have to call Token.deploy() and await for it to be
    // deployed(), which happens once its transaction has been mined.
    SAM = await SAMTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_INITIAL_SUPPLY) // { from: owner }
  });

  /*
  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      expect(await SAM.owner()).to.equal(owner.address)
    })

    it('Should assign the total supply of tokens to the owner', async () => {
      const ownerBalance = await SAM.balanceOf(owner.address)
      expect(await SAM.totalSupply()).to.equal(ownerBalance)
    });
  });

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
      expect(await SAM.balanceOf(owner.address)).to.equal(initialOwnerBalance - 150);
      expect(await SAM.balanceOf(addr1.address)).to.equal(100);
      expect(await SAM.balanceOf(addr2.address)).to.equal(50);
    });
  })
  */

  describe('ERC20Permit Behaviors', () => {
    describe('Views', () => {
      it('Retrieves the proper DOMAIN_SEPARATOR', async function () {
        const domainSeparator = getDomainSeparator(
          TOKEN_NAME,
          network.config.chainId || HARDHAT_CHAIN_ID,
          // this.contracts.erc20Permit.address,
          SAM.address,
        )

        expect(await SAM.DOMAIN_SEPARATOR()).to.equal(domainSeparator)
      })

      /*
      it('Should retrieve the proper PERMIT_TYPEHASH', async () => {
        expect(await SAM.PERMIT_TYPEHASH()).to.equal(PERMIT_TYPEHASH)
      })

      it('Should retrieve the VERSION', async () => {
        expect(await SAM.version()).to.equal(TOKEN_VERSION)
      })
      */
    })

    describe('Effects', () => {
      const allowAmt = BigNumber.from('100') // allowance amount

      const deadlineFuture = BigNumber.from('4102416000') // December 2099
      const deadlinePast = BigNumber.from('946656000') // December 1999

      // describe('When the owner is the ZERO address', ()  => {
      //   it('Reverts', async () => {
      //     console.log(fakeSig)
      //     await expect(
      //       SAM
      //         .connect(spender)
      //         .permit(AddressZero, spender.address, allowAmt, deadlineFuture, fakeSig.v, fakeSig.r, fakeSig.s),
      //     ).to.be.revertedWith('OwnerZeroAddress')
      //   })
      // })

      describe('Test', () => {
        it('Allows the spender claim the allowance signed by the owner', async () => {
          const signature = await createSignature(SAM, deadlineFuture, owner.address, spender.address, allowAmt)
          console.log(signature)

          await SAM
            .connect(spender)
            .permit(owner.address, spender.address, allowAmt, deadlineFuture, signature.v, signature.r, signature.s)

          const allowance = await SAM.allowance(owner, spender)
          expect(allowance).to.equal(allowAmt)
        });
      })

      /*
      describe('When the owner is NOT the ZERO address', () => {
        describe('When the spender is the ZERO address', () => {
          it('Reverts', async () => {
            await expect(
              SAM
                .connect(spender)
                .permit(owner.address, AddressZero, allowAmt, deadlineFuture, fakeSig.v, fakeSig.r, fakeSig.s),
            ).to.be.revertedWith('SpenderZeroAddress')
          })
        })

        describe('When the spender is NOT the ZERO address', () => {
          describe('When the deadline is in the PAST', function () {
            it('Reverts', async () => {
              const signature = await createSignature(SAM, deadlinePast, owner.address, spender.address, allowAmt)
              await expect(
                SAM
                  .connect(spender)
                  .permit(owner.address, spender.address, allowAmt, deadlinePast, signature.v, signature.r, signature.s),
              ).to.be.revertedWith('PermitExpired')
            })
          })

          describe('When the deadline is in the FUTURE', () => {
            describe('When the recovered owner is the ZERO address', () => {
              it('Reverts', async () => {
                const signature = await createSignature(SAM, deadlineFuture, AddressZero, spender.address, allowAmt)

                // Providing any number but 27 or 28 for the `v` argument of the ECDSA signature makes the `ecrecover`
                // precompile return the zero address.
                // https://ethereum.stackexchange.com/questions/69328/how-to-get-the-zero-address-from-ecrecover
                const goofedV = BigNumber.from('10')
                await expect(
                  SAM
                    .connect(spender)
                    .permit(owner.address, spender.address, allowAmt, deadlineFuture, goofedV, signature.r, signature.s)
                ).to.be.revertedWith('RecoveredOwnerZeroAddress')
              })
            })

            describe('When the recovered owner is NOT the ZERO address', () => {
              describe('When the signature is valid', () => {
                it('Allows the spender claim the allowance signed by the owner', async () => {
                  const signature = await createSignature(SAM, deadlineFuture, owner.address, spender.address, allowAmt)

                  await SAM
                    .connect(spender)
                    .permit(owner.address, spender.address, allowAmt, deadlineFuture, signature.v, signature.r, signature.s)

                  const allowance = await SAM.allowance(owner, spender)
                  expect(allowance).to.equal(allowAmt)
                });

                it('Increases the nonce of the user', async () => {
                  const signature = await createSignature(SAM, deadlineFuture, owner.address, spender.address, allowAmt)
                  const oldNonce = await SAM.nonces(owner.address)

                  await SAM
                    .connect(spender)
                    .permit(owner.address, spender.address, allowAmt, deadlineFuture, signature.v, signature.r, signature.s)

                  const newNonce = await SAM.nonces(owner.address)
                  expect(oldNonce).to.equal(newNonce.sub(1))
                });

                it('Emits an Approval event', async () => {
                  const signature = await createSignature(SAM, deadlineFuture, owner.address, spender.address, allowAmt)

                  await expect(
                    SAM
                      .connect(spender)
                      .permit(owner.address, spender.address, allowAmt, deadlineFuture, signature.v, signature.r, signature.s)
                  )
                    .to.emit(SAM, 'Approval').withArgs(owner, spender, allowAmt)
                })
              })

              describe('When the signature is invalid', () => {
                it('Reverts', async () => {
                  await expect(
                    SAM
                      .connect(spender)
                      .permit(owner.address, spender.address, allowAmt, deadlineFuture, fakeSig.v, fakeSig.r, fakeSig.s)
                  ).to.be.revertedWith('InvalidSignature')
                })
              })
            })
          })
        })
      })
      */
    })

  //   it('Should permit and emit Approval (replay safe)', async () => {
  //     // Create the approval request
  //     const approve = {
  //       owner: owner,
  //       spender: addr1,
  //       value: 100,
  //     }
  //
  //     // deadline as much as you want in the future
  //     const deadline = 100000000000000
  //
  //     // Get the user's nonce
  //     const nonce = await SAM.nonces(owner)
  //
  //     // Get the EIP712 digest
  //     const digest = getPermitDigest(name, SAM.address, HARDHAT_CHAIN_ID, approve, nonce, deadline)
  //
  //   // Sign it
  //   // NOTE: Using web3.eth.sign will hash the message internally again which
  //   // we do not want, so we're manually signing here
  //   const { v, r, s } = sign(digest, ownerPrivateKey)
  //
  //   // Approve it
  //   const receipt = await token.permit(approve.owner, approve.spender, approve.value, deadline, v, r, s)
  //   const event = receipt.logs[0]
  //
  //   // It worked!
  //   assert.equal(event.event, 'Approval')
  //   assert.equal(await token.nonces(owner), 1)
  //   assert.equal(await token.allowance(approve.owner, approve.spender), approve.value)
  //
  //   // Re-using the same sig doesn't work since the nonce has been incremented
  //   // on the contract level for replay-protection
  //   await expectRevert(
  //     token.permit(approve.owner, approve.spender, approve.value, deadline, v, r, s),
  //     'ERC20Permit: invalid signature'
  //   )
  //
  //   // invalid ecrecover's return address(0x0), so we must also guarantee that
  //   // this case fails
  //   await expectRevert(
  //     token.permit(
  //       '0x0000000000000000000000000000000000000000',
  //       approve.spender,
  //       approve.value,
  //       deadline,
  //       '0x99',
  //       r,
  //       s
  //     ),
  //     'ERC20Permit: invalid signature'
  //   )
  // })
  })
})
