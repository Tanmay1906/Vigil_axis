import { useEffect, useMemo, useState } from 'react'
import { fetchLedgerEntries } from '../services/api'

export interface BlockchainBlock {
  id: string
  hash: string
  timestamp: number
  metadata: string
  type: 'FILE_INGEST'
  caseId: string
  evidenceId: string | null
  blockNumber: number
}

export function useBlockchain() {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const entries = await fetchLedgerEntries(100)
        if (!active) {
          return
        }

        const mapped = entries.map((entry) => ({
          id: `${entry.tx_hash}-${entry.block_number}`,
          hash: entry.tx_hash,
          timestamp: entry.block_timestamp * 1000,
          metadata: `${entry.case_id}${entry.evidence_id ? ` / ${entry.evidence_id}` : ''}`,
          type: 'FILE_INGEST' as const,
          caseId: entry.case_id,
          evidenceId: entry.evidence_id,
          blockNumber: entry.block_number,
        }))

        setBlocks(mapped)
        setError(null)
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to fetch ledger')
        }
      }
    }

    load()
    const interval = window.setInterval(load, 10000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const latestBlock = useMemo(() => blocks[0] ?? null, [blocks])

  return { blocks, latestBlock, error }
}
