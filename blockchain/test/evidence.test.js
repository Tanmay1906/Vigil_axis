const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvidenceRegistry", function () {
    let registry;

    beforeEach(async function () {
        const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
        registry = await EvidenceRegistry.deploy();
    });

    it("should securely add evidence and retrieve it identically", async function () {
        const caseId = "case_001";
        const fileHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const timestamp = 1712160000;

        await registry.addEvidence(caseId, fileHash, timestamp);

        const result = await registry.getEvidence(caseId);
        expect(result.caseId).to.equal(caseId);
        expect(result.fileHash).to.equal(fileHash);
        expect(result.timestamp).to.equal(timestamp);
    });

    it("should gracefully prevent duplicate caseId entries", async function () {
        const caseId = "case_002";
        const fileHash = "hash123";
        const timestamp = 1712160000;

        await registry.addEvidence(caseId, fileHash, timestamp);

        await expect(
            registry.addEvidence(caseId, "newHash", timestamp)
        ).to.be.revertedWith("Evidence for this Case ID already exists");
    });

    it("should safely revert when retrieving non-existent caseId mapping", async function () {
        await expect(
            registry.getEvidence("non_existent_case")
        ).to.be.revertedWith("Evidence not found for the given Case ID");
    });
});
