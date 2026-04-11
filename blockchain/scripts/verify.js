const hre = require("hardhat");

async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS || "DEPLOYED_ADDRESS_HERE";
    
    const caseIdToVerify = process.env.CASE_ID || "case_demo";
    const suspectedHash = process.env.SUSPECTED_HASH || "hash_demo";

    if (contractAddress === "DEPLOYED_ADDRESS_HERE") {
        console.warn("\n[!] Please define CONTRACT_ADDRESS logically to interact.");
        return;
    }

    const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
    const registry = await EvidenceRegistry.attach(contractAddress);

    console.log(`\n[+] Querying blockchain for Case ID: ${caseIdToVerify}`);
    
    try {
        const result = await registry.getEvidence(caseIdToVerify);
        console.log(`[+] Ledger Hash: ${result.fileHash}`);
        console.log(`[+] Input Hash: ${suspectedHash}`);
        
        if (result.fileHash === suspectedHash) {
            console.log("\n[SUCCESS] Hash matches the immutable ledger. STATUS: VERIFIED.");
        } else {
            console.warn("\n[WARNING] Hash mismatch detected. STATUS: TAMPERED.");
        }
    } catch (err) {
        console.error(`[-] Verification Error: ${err.reason || err.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
