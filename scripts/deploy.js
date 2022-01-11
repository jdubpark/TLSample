const hre = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const NAME = 'Sample Coin'
  const SYMBOL = 'SAM'
  const INITIAL_SUPPLY = 10e9

  const SampleCoin = await hre.ethers.getContractFactory('SampleToken')
  const sam = await SampleCoin.deploy(NAME, SYMBOL, INITIAL_SUPPLY)

  await sam.deployed()

  console.log('SAM deployed to:', sam.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
