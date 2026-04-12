import { useState, useCallback } from 'react'
import { useVigilStore } from '../store/useVigilStore'
import { uploadEvidenceFile, UploadEvidenceResponse } from '../services/api'

const HEX_CHARS = "0123456789abcdef"

function generateRandomHex(length: number) {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]
  }
  return result
}

export function useForensics() {
  const [currentHash, setCurrentHash] = useState<string>('0'.repeat(64))
  const [progress, setProgress] = useState<number>(0)
  const [lastUpload, setLastUpload] = useState<UploadEvidenceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isScanning = useVigilStore(state => state.isScanning)
  const setIsScanning = useVigilStore(state => state.setIsScanning)
  const addEvent = useVigilStore(state => state.addEvent)
  const setSystemHealth = useVigilStore(state => state.setSystemHealth)

  const ingestEvidence = useCallback(async (
    file: File,
    options?: {
      collectorId?: string
      investigator?: string
      caseId?: string
      caseDescription?: string
      evidenceDescription?: string
    },
  ) => {
    setIsScanning(true)
    setProgress(0)
    setError(null)
    addEvent({ type: 'INFO', message: `INITIATING HASH_SEQ for [${file.name}]` })

    let currentProgress = 0
    const interval = window.setInterval(() => {
      currentProgress = Math.min(92, currentProgress + Math.random() * 14)
      setProgress(currentProgress)
      setCurrentHash(generateRandomHex(64))
    }, 120)

    try {
      const upload = await uploadEvidenceFile(file, options)
      window.clearInterval(interval)
      setProgress(100)
      setCurrentHash(upload.hash)
      setLastUpload(upload)
      setIsScanning(false)
      setSystemHealth(100)
      addEvent({
        type: 'SCANNED',
        message: `CHAIN ANCHORED ${upload.evidence_id} :: ${upload.txid ?? 'NO_TX'}`,
      })
      return upload
    } catch (ingestError) {
      window.clearInterval(interval)
      setIsScanning(false)
      setSystemHealth(55)
      const message = ingestError instanceof Error ? ingestError.message : 'Upload failed'
      setError(message)
      addEvent({ type: 'CRITICAL', message: `INGESTION FAILED :: ${message}` })
      throw ingestError
    }
  }, [setIsScanning, addEvent, setSystemHealth])

  return {
    ingestEvidence,
    currentHash,
    progress,
    isScanning,
    lastUpload,
    error,
  }
}
