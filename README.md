# 🛡️ VIGIL-AXIS: The Immutable Forensic OS

**Bridging the Gap Between Digital Crime Scenes and the Courtroom**

VIGIL-AXIS is a forensic operating system built to create an unbreakable **digital chain of custody** for cyber investigations. It automates volatile evidence collection, generates cryptographic fingerprints using **SHA-256**, and anchors proof of integrity on a blockchain to make forensic evidence more transparent, verifiable, and court-ready under the **BSA 2026** framework.

---

## 🚀 Vision

To establish a **tamper-proof, legally defensible, and automated forensic pipeline** that transforms digital evidence from a matter of trust into a matter of proof.

VIGIL-AXIS is designed to help investigators, law-enforcement agencies, and judicial stakeholders preserve digital evidence with integrity from seizure to courtroom presentation.

---

## ⚖️ Problem Statement

Digital forensics still suffers from major trust and admissibility gaps:

- **Fragile Chain of Custody**  
  Manual evidence handling and logging make it difficult to prove that files remained unchanged from collection to court.

- **Volatile Data Loss**  
  Critical live artifacts such as RAM strings, logs, and active process data are often lost during traditional dead forensics.

- **Legal Inadmissibility**  
  Under the **Bharatiya Sakshya Adhiniyam (BSA) 2026**, electronic evidence needs technical integrity support such as a **Section 63(4) certificate**, which most existing tools do not generate automatically.

- **Lack of Transparent Audit Trails**  
  Many existing forensic systems store logs in centralized databases, which can be altered, deleted, or challenged.

---

## 💡 Solution

VIGIL-AXIS combines:

- **Automated triage**
- **Cryptographic hashing**
- **Blockchain notarization**
- **Legal compliance automation**

This creates a **Forensic-on-Chain** workflow where each artifact is collected, hashed, logged, and made independently verifiable.

---

## ✨ Core Features

### 1. Automated Triage
Python/Bash-based forensic scripts capture volatile system artifacts such as:

- RAM traces
- System logs
- Live forensic metadata

This reduces the risk of losing evidence before acquisition.

### 2. SHA-256 Fingerprinting
Every collected artifact is hashed locally using **SHA-256**, creating a unique digital fingerprint that acts like evidence DNA.

### 3. Blockchain Notary
The generated hashes are recorded through **smart contracts** on blockchain networks such as:

- Polygon Amoy
- Aptos Testnet

This creates a permanent, timestamped, tamper-resistant audit trail.

### 4. BSA 2026 Compliance Engine
VIGIL-AXIS is built around legal admissibility and can support automated generation of **Section 63(4) integrity certificates** for courtroom use.

### 5. Verification Layer
Evidence can be validated against the blockchain record and presented through a simple **Verified / Tampered** model for investigators, auditors, and judges.

---

## 🔄 Forensic Lifecycle

VIGIL-AXIS follows a four-step evidence workflow:

1. **Extraction**  
   Automated scripts collect volatile forensic artifacts.

2. **Notarization**  
   SHA-256 hashing generates a unique digital fingerprint.

3. **Immutability**  
   The hash is anchored to a blockchain smart contract.

4. **Admissibility**  
   A compliance-ready integrity record supports legal scrutiny.

---

## 🧠 Why VIGIL-AXIS?

- Replaces **human trust** with **mathematical proof**
- Secures chain of custody using **decentralized ledgers**
- Minimizes evidence loss with **zero-latency triage**
- Supports **BSA 2026-first** forensic compliance
- Bridges the gap between **technical investigation** and **judicial verification**

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- TanStack Query
- Framer Motion
- Recharts

### Backend
- Node.js
- Python 3.12
- PostgreSQL
- IPFS
- Socket.io
- Swagger / OpenAPI

### Blockchain
- Solidity
- Hardhat / Truffle
- Polygon Amoy / Aptos Testnet
- Ethers.js / Web3.js

### Security & Forensics
- SHA-256 Hashing
- JWT + 2FA
- Python/Bash Triage Scripts
- Forensic tooling integration

---

## 👥 Target Users

VIGIL-AXIS is designed for:

- Cyber forensic investigators
- Law Enforcement Agencies (LEAs)
- Incident response teams
- Judicial auditors
- Compliance and legal verification teams

---

## 📈 Value Proposition

VIGIL-AXIS offers a unified platform for:

- Automated forensic evidence acquisition
- Immutable integrity assurance
- Blockchain-backed custody verification
- Legal admissibility support
- Transparent auditability for court proceedings

---

## 🌍 Innovation Highlights

- **Deterministic Integrity** — Cryptographic certainty over manual assurance
- **On-Chain Notary** — Immutable evidence blueprint
- **Zero-Trust Validation** — Dashboard-based verification against distributed records
- **Hybrid Forensic-as-a-Service** — Scalable and cost-efficient deployment model
- **Native Legal Alignment** — Built specifically for the Indian BSA 2026 landscape

---

## 🔐 Expected Impact

VIGIL-AXIS aims to transform digital forensics from a process that can be challenged on technicalities into one backed by a verifiable, permanent, and court-defensible chain of custody.

---

## 👨‍💻 Team Sekiro

- **Tanmay Verma**
- **Kunal Verma**

---

## 🏷️ Tagline

**Automated. Verifiable. BSA 2026 Compliant.**

---

## 📌 Note

This project is a compliance-first forensic innovation focused on evidence integrity, chain-of-custody assurance, and legal readiness for the next generation of digital investigations.
