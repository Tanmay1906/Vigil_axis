// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceRegistry {
    
    struct Evidence {
        string caseId;
        string fileHash;
        uint256 timestamp;
        bool exists;
    }

    // O(1) Mapping for retrieving evidence hashes natively
    mapping(string => Evidence) private evidenceMap;

    event EvidenceAdded(string indexed caseId, string fileHash, uint256 timestamp);

    function addEvidence(string memory _caseId, string memory _fileHash, uint256 _timestamp) public {
        // Prevent duplicate caseIds explicitly securely
        require(!evidenceMap[_caseId].exists, "Evidence for this Case ID already exists");

        evidenceMap[_caseId] = Evidence({
            caseId: _caseId,
            fileHash: _fileHash,
            timestamp: _timestamp,
            exists: true
        });

        emit EvidenceAdded(_caseId, _fileHash, _timestamp);
    }

    function getEvidence(string memory _caseId) public view returns (string memory caseId, string memory fileHash, uint256 timestamp) {
        require(evidenceMap[_caseId].exists, "Evidence not found for the given Case ID");
        Evidence memory ev = evidenceMap[_caseId];
        return (ev.caseId, ev.fileHash, ev.timestamp);
    }
}
