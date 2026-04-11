require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337 // Default for Local Hardhat network
    },
    // Optional: configuration for an external local node or testnet
    // localhost: {
    //   url: "http://127.0.0.1:8545"
    // }
  }
};
