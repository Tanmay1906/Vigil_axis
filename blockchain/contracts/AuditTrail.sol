// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditTrail {
    struct AuditLog {
        string caseId;
        string action;
        uint256 timestamp;
        address caller;
    }

    AuditLog[] public logs;

    event ActionLogged(string indexed caseId, string action, address caller, uint256 timestamp);

    function logAction(string memory _caseId, string memory _action) public {
        logs.push(AuditLog({
            caseId: _caseId,
            action: _action,
            timestamp: block.timestamp,
            caller: msg.sender
        }));

        emit ActionLogged(_caseId, _action, msg.sender, block.timestamp);
    }
}
