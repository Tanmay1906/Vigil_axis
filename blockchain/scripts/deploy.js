const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying EvidenceRegistry to the EVM...");
  
  const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`[+] EvidenceRegistry deployed safely at: ${registryAddress}`);

  console.log("Deploying AuditTrail...");
  const AuditTrail = await hre.ethers.getContractFactory("AuditTrail");
  const audit = await AuditTrail.deploy();
  
  await audit.waitForDeployment();
  const auditAddress = await audit.getAddress();
  console.log(`[+] AuditTrail deployed safely at: ${auditAddress}`);

  // Structurally format parameters for persistent bridge logic natively
  const deployData = {
      "EvidenceRegistry": registryAddress,
      "abi_path": "artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
  };

  const outputPath = path.join(__dirname, "..", "deployed_contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployData, null, 2));
  console.log(`\n[+] Contract configuration saved explicitly to ${outputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
