import React, { useRef, useState } from 'react'
import { useForensics } from '../../hooks/useForensics'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, Terminal } from 'lucide-react'

export function EvidenceLab() {
  const { simulateIngestion, currentHash, progress, isScanning } = useForensics()
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [investigatorName, setInvestigatorName] = useState('')
  const [forensicEvidenceName, setForensicEvidenceName] = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setFileName(file.name)
    setForensicEvidenceName(file.name)
    setDetailsSaved(false)
    setDetailsError('')
    await simulateIngestion(file.name)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
    const file = e.dataTransfer.files[0]
    await processFile(file)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    await processFile(file)
    e.target.value = ''
  }

  const handleSaveDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!investigatorName.trim() || !forensicEvidenceName.trim()) {
      setDetailsError('Investigator name and forensic evidence name are required.')
      return
    }

    setDetailsError('')
    setDetailsSaved(true)
  }

  return (
    <div className="h-full flex flex-col space-y-6 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-vigil-cyan/10 pb-4">
        <h2 className="text-xl font-mono tracking-widest text-white/80">EVIDENCE INGESTION LAB</h2>
      </div>

      <div 
        className={`flex-1 relative flex flex-col items-center justify-center rounded-2xl border border-dashed transition-all duration-300 ${
          dragActive ? 'border-vigil-cyan bg-vigil-cyan/10 scale-[1.02]' : 'border-vigil-cyan/30 bg-black/20 hover:border-vigil-cyan/50 hover:bg-black/40'
        }`}
        onClick={() => {
          if (!fileName) {
            fileInputRef.current?.click()
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {!isScanning && progress === 0 ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center space-y-4 text-white/50"
            >
              <div className="p-6 rounded-full bg-vigil-cyan/5 border border-vigil-cyan/10 animate-pulse">
                <UploadCloud className="w-16 h-16 text-vigil-cyan" />
              </div>
              <div className="font-mono tracking-widest text-lg text-vigil-cyan">QUANTUM CENTRIFUGE</div>
              <div className="text-xs opacity-50 font-mono text-center">
                INITIALIZE DECONSTRUCTION<br/>
                [ DROP OR CLICK TO SELECT ANY DOCUMENT ]
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl px-8 flex flex-col space-y-6"
            >
              <div className="flex items-center space-x-4 border-b border-white/10 pb-2">
                <Terminal className="w-5 h-5 text-vigil-cyan" />
                <span className="font-mono text-sm text-vigil-cyan">PYTHON 3.12 ARTIFACT ENGINE</span>
                <span className="ml-auto font-mono text-xs text-white/40">TARGET: {fileName}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-vigil-cyan/80">
                  <span>DECONSTRUCTION PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-vigil-cyan shadow-[0_0_15px_#00F2FF]"
                  />
                </div>
              </div>

              <div className="glass-panel bg-black/80 p-4 border border-vigil-cyan/20 h-48 overflow-hidden font-mono text-xs leading-relaxed">
                <div className="text-white/40 mb-2">{'>>>'} EXTRACTING SHA-256 FINGERPRINT...</div>
                <div className={`break-all tracking-[0.2em] transition-colors duration-300 ${!isScanning ? 'text-vigil-cyan drop-shadow-[0_0_8px_#00F2FF]' : 'text-vigil-cyan/50'}`}>
                   {currentHash}
                </div>
                <div className="mt-4 text-[10px] text-white/30 space-y-1">
                  <div>{'[PID: 8492] Buffer mapping ...'}</div>
                  <div>{`[PID: 8492] Hex derivation stream offset ${Date.now().toString().slice(-4)}`}</div>
                  {!isScanning && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-vigil-cyan mt-4 pt-2 border-t border-vigil-cyan/20"
                    >
                      {">"} FINGERPRINT LOCKED. CHAIN OF CUSTODY UPDATED.
                    </motion.div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveDetails} className="rounded-2xl border border-vigil-cyan/20 bg-black/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono tracking-[0.18em] text-vigil-cyan">EVIDENCE DETAILS</h3>
                  {detailsSaved && <span className="text-[10px] font-mono text-emerald-300">DETAILS SAVED</span>}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor="investigatorName" className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">
                      Investigator Name
                    </label>
                    <input
                      id="investigatorName"
                      type="text"
                      value={investigatorName}
                      onChange={(event) => setInvestigatorName(event.target.value)}
                      placeholder="e.g. R. Mehta"
                      className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="forensicEvidenceName" className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">
                      Forensic Evidence Name
                    </label>
                    <input
                      id="forensicEvidenceName"
                      type="text"
                      value={forensicEvidenceName}
                      onChange={(event) => setForensicEvidenceName(event.target.value)}
                      placeholder="e.g. Laptop Image - Case 42"
                      className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>

                {detailsError && (
                  <p className="text-[10px] font-mono text-rose-300">{detailsError}</p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-vigil-cyan/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-950 transition hover:bg-vigil-cyan"
                >
                  Save Evidence Details
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
