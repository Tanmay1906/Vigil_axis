import { useState, useCallback } from 'react'

export interface BlockchainBlock {
  id: string
  hash: string
  timestamp: number
  metadata: string
  type: 'RAM_DUMP' | 'BROWSER_HISTORY' | 'FILE_INGEST'
}

export function useBlockchain() {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([
    {
      id: crypto.randomUUID(),
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      timestamp: Date.now() - 3600000,
      metadata: 'INITIAL_SYSTEM_BOOT_VALIDATION',
      type: 'RAM_DUMP'
    }
  ])

  const logToChain = useCallback((type: BlockchainBlock['type'], metadata: string) => {
    const newBlock: BlockchainBlock = {
      id: crypto.randomUUID(),
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      timestamp: Date.now(),
      metadata,
      type
    }
    setBlocks(prev => [newBlock, ...prev])
    return newBlock
  }, [])

  return { blocks, logToChain }
}
