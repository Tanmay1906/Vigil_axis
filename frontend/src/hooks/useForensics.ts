import { useState, useCallback } from 'react'
import { useVigilStore } from '../store/useVigilStore'

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
  const isScanning = useVigilStore(state => state.isScanning)
  const setIsScanning = useVigilStore(state => state.setIsScanning)
  const addEvent = useVigilStore(state => state.addEvent)
  const setSystemHealth = useVigilStore(state => state.setSystemHealth)

  const simulateIngestion = useCallback(async (fileInfo: string) => {
    setIsScanning(true)
    setProgress(0)
    addEvent({ type: 'INFO', message: `INITIATING HASH_SEQ for [${fileInfo}]` })

    return new Promise<string>((resolve) => {
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 8
        if (currentProgress >= 100) {
          currentProgress = 100
          setProgress(100)
          clearInterval(interval)
          const finalHash = generateRandomHex(64)
          setCurrentHash(finalHash)
          setIsScanning(false)
          
          if (Math.random() > 0.8) {
            addEvent({ type: 'CRITICAL', message: `ANOMALY DETECTED IN HASH ${finalHash.slice(0, 8)}...` })
            setSystemHealth(Math.floor(Math.random() * 40) + 40)
          } else {
            addEvent({ type: 'SCANNED', message: `VERIFIED SECURE: ${finalHash}` })
          }
          
          resolve(finalHash)
        } else {
          setProgress(currentProgress)
          setCurrentHash(generateRandomHex(64))
        }
      }, 50)
    })
  }, [setIsScanning, addEvent, setSystemHealth])

  return {
    simulateIngestion,
    currentHash,
    progress,
    isScanning
  }
}
