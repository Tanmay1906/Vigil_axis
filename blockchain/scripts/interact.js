const hre = require("hardhat");
const crypto = require("crypto");

async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS || "DEPLOYED_ADDRESS_HERE";
    
    if (contractAddress === "DEPLOYED_ADDRESS_HERE") {
        console.warn("\n[!] Please update contractAddress in script to test correctly.");
        return;
    }

    const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
    const registry = await EvidenceRegistry.attach(contractAddress);

    const caseId = "case_" + crypto.randomBytes(4).toString("hex");
    const fileHash = crypto.createHash("sha256").update("Simulated forensic payload").digest("hex");
    const timestamp = Math.floor(Date.now() / 1000);

    console.log(`\n[+] Pushing Evidence for ${caseId}...`);
    const tx = await registry.addEvidence(caseId, fileHash, timestamp);
    console.log(`[+] Transaction pending: ${tx.hash}`);
    
    await tx.wait();
    console.log(`[+] Evidence anchored reliably!`);

    console.log(`\n[+] Fetching Evidence for ${caseId}...`);
    const result = await registry.getEvidence(caseId);
    console.log(`[+] Ledger Record -> Hash: ${result.fileHash}, Timestamp: ${result.timestamp}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
