import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldAlert } from 'lucide-react'

// Mock Data Generation
const generateHexRows = (count: number, insertMismatch: boolean = false) => {
  const rows = []
  const mismatchRow = insertMismatch ? Math.floor(count / 2) : -1
  for(let i=0; i<count; i++) {
    const hex = Array.from({length: 8}, () => Math.random().toString(16).substr(2, 6).toUpperCase()).join(' ')
    if (i === mismatchRow) {
      // Create a corrupted string loosely matching the length
      rows.push(hex.replace(/[0-9]/g, 'X'))
    } else {
      rows.push(hex)
    }
  }
  return { rows, mismatchRow }
}

const sourceA = generateHexRows(20)
const sourceB = generateHexRows(20, true)

export function VerificationEngine() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scannerY, setScannerY] = useState(0)
  
  // Detect if scanner is over the mismatch row (~ 50% down the screen, simplified logic)
  const isBreach = scannerY > 200 && scannerY < 300

  return (
    <div className="h-full flex flex-col space-y-6 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-vigil-cyan/10 pb-4">
        <h2 className="text-xl font-mono tracking-widest text-white/80">VERIFICATION ENGINE</h2>
        <div className={`px-4 py-1 border rounded text-xs font-mono tracking-widest flex items-center transition-colors ${isBreach ? 'border-vigil-blood bg-vigil-blood/20 text-vigil-blood animate-pulse shadow-[0_0_20px_#FF4500]' : 'border-vigil-cyan/30 text-vigil-cyan/50'}`}>
          {isBreach ? <ShieldAlert className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          {isBreach ? 'INTEGRITY BREACH DETECTED' : 'SYSTEM NOMINAL'}
        </div>
      </div>

      <div className="flex-1 relative flex bg-black/40 border border-vigil-cyan/10 rounded-xl overflow-hidden shadow-2xl" ref={containerRef}>
        
        {/* Source A */}
        <div className="flex-1 border-r border-vigil-cyan/20 p-6 flex flex-col relative z-0">
          <div className="font-mono text-[10px] text-white/30 mb-8 border-b border-white/5 pb-2">SOURCE_A : BLOCKCHAIN_LEDGER</div>
          <div className="font-mono text-xs text-vigil-cyan/70 space-y-3 leading-none opacity-80 z-0">
            {sourceA.rows.map((row, i) => (
              <div key={i}>{row}</div>
            ))}
          </div>
        </div>

        {/* Source B */}
        <div className="flex-1 p-6 flex flex-col relative z-0">
          <div className="font-mono text-[10px] text-white/30 mb-8 border-b border-white/5 pb-2">SOURCE_B : LOCAL_MEMORY</div>
          <div className="font-mono text-xs text-vigil-cyan/70 space-y-3 leading-none opacity-80 z-0">
            {sourceB.rows.map((row, i) => {
              const isMismatchRow = i === sourceB.mismatchRow
              return (
                <div 
                  key={i} 
                  className={`transition-colors duration-150 ${isMismatchRow && isBreach ? 'text-vigil-blood animate-glitch drop-shadow-[0_0_8px_#FF4500] bg-vigil-blood/10' : ''}`}
                >
                  {row}
                </div>
              )
            })}
          </div>
        </div>

        {/* Draggable Scanner Blade */}
        <motion.div
          drag="y"
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={(_, info) => setScannerY(info.point.y)}
          className={`absolute left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize z-50 group`}
          style={{ top: '10%' }}
        >
          <div className={`w-full h-[2px] transition-colors ${isBreach ? 'bg-vigil-blood shadow-[0_0_15px_#FF4500]' : 'bg-vigil-cyan shadow-[0_0_15px_#00F2FF]'}`} />
          <div className={`absolute w-16 h-8 border rounded flex items-center justify-center backdrop-blur-md transition-colors ${isBreach ? 'border-vigil-blood bg-vigil-blood/10 text-vigil-blood shadow-[0_0_10px_#FF4500]' : 'border-vigil-cyan bg-vigil-cyan/10 text-vigil-cyan shadow-[0_0_10px_#00F2FF]'}`}>
            <span className="font-mono text-[10px]">SCAN</span>
          </div>
          {/* Laser Wash Area */}
          <div className={`absolute top-0 w-full h-32 bg-gradient-to-b from-transparent pointer-events-none transition-colors ${isBreach ? 'to-vigil-blood/20' : 'to-vigil-cyan/10'}`} style={{ transform: 'translateY(-100%) '}} />
        </motion.div>
      </div>
    </div>
  )
}
