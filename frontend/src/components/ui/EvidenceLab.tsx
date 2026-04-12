import React, { useRef, useState } from 'react'
import { useForensics } from '../../hooks/useForensics'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, Terminal } from 'lucide-react'
import { fetchCaseRecords, type CaseRecord } from '../../services/api'

export function EvidenceLab() {
  const { ingestEvidence, currentHash, progress, isScanning, lastUpload, error } = useForensics()
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [investigatorName, setInvestigatorName] = useState('')
  const [forensicEvidenceName, setForensicEvidenceName] = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [caseMode, setCaseMode] = useState<'existing' | 'new'>('existing')
  const [caseRecords, setCaseRecords] = useState<CaseRecord[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [newCaseDescription, setNewCaseDescription] = useState('')
  const [caseLoading, setCaseLoading] = useState(false)
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    let active = true
    const loadCases = async () => {
      setCaseLoading(true)
      try {
        const rows = await fetchCaseRecords(300)
        if (!active) {
          return
        }
        setCaseRecords(rows)
        if (rows.length > 0 && !selectedCaseId) {
          setSelectedCaseId(rows[0].case_id)
        }
      } finally {
        if (active) {
          setCaseLoading(false)
        }
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [])

  const processFile = async (file: File) => {
    setFileName(file.name)
    setForensicEvidenceName(file.name)
    setDetailsSaved(false)
    setDetailsError('')
    setDuplicateAlert(null)

    try {
      await ingestEvidence(file, {
        collectorId: investigatorName || undefined,
        investigator: investigatorName || undefined,
        caseId: caseMode === 'existing' ? selectedCaseId || undefined : undefined,
        caseDescription: caseMode === 'new' ? newCaseDescription || undefined : undefined,
        evidenceDescription: forensicEvidenceName || file.name,
      })
      setDetailsSaved(true)
      const rows = await fetchCaseRecords(300)
      setCaseRecords(rows)
      if (caseMode === 'new' && rows.length > 0) {
        setCaseMode('existing')
        setSelectedCaseId(rows[0].case_id)
      }
    } catch (uploadError) {
      setDetailsSaved(false)
      const message = uploadError instanceof Error ? uploadError.message : ''
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('existing:')) {
        setDuplicateAlert(message)
      }
    }
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

    if (caseMode === 'existing' && !selectedCaseId) {
      setDetailsError('Select an existing case number before upload.')
      return
    }

    if (caseMode === 'new' && !newCaseDescription.trim()) {
      setDetailsError('Provide a case description for new case creation.')
      return
    }

    setDetailsError('')
    setDuplicateAlert(null)
    setDetailsSaved(true)
  }

  return (
    <div className="h-full flex flex-col space-y-6 pointer-events-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-vigil-cyan/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Investigator Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Evidence Lab</h2>
          <p className="mt-1 text-sm text-slate-300">Register evidence artifact, hash it, and push immutable chain metadata.</p>
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
          Pipeline: Upload -&gt; Hash -&gt; Anchor
        </div>
      </div>

      <div 
        className={`relative flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed transition-all duration-300 ${
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
              <div className="font-mono tracking-widest text-lg text-vigil-cyan">EVIDENCE DROP ZONE</div>
              <div className="text-xs opacity-50 font-mono text-center">
                SELECT FORENSIC ARTIFACT<br/>
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
                  {!isScanning && progress === 100 && (
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-vigil-cyan/20 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono tracking-[0.16em] text-cyan-200">OPERATION DETAILS</h3>
            {detailsSaved && <span className="text-[10px] font-mono text-emerald-300">DETAILS SAVED</span>}
          </div>
          <form onSubmit={handleSaveDetails} className="space-y-3">
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

            <div>
              <label className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">
                Case Link Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCaseMode('existing')}
                  className={`rounded-lg border px-3 py-2 text-xs ${caseMode === 'existing' ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-slate-900/70 text-slate-300'}`}
                >
                  Use Existing Case
                </button>
                <button
                  type="button"
                  onClick={() => setCaseMode('new')}
                  className={`rounded-lg border px-3 py-2 text-xs ${caseMode === 'new' ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-slate-900/70 text-slate-300'}`}
                >
                  Create New Case
                </button>
              </div>
            </div>

            {caseMode === 'existing' && (
              <div>
                <label htmlFor="selectedCaseId" className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">
                  Case No. (Evidence belongs to)
                </label>
                <select
                  id="selectedCaseId"
                  value={selectedCaseId}
                  onChange={(event) => setSelectedCaseId(event.target.value)}
                  className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
                >
                  {caseRecords.map((caseRow) => (
                    <option key={caseRow.case_id} value={caseRow.case_id}>
                      {caseRow.case_id} - {caseRow.description || 'No description'}
                    </option>
                  ))}
                </select>
                {caseLoading && <p className="mt-1 text-[10px] text-slate-400">Loading case numbers...</p>}
              </div>
            )}

            {caseMode === 'new' && (
              <div className="space-y-2">
                <label htmlFor="newCaseDescription" className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">
                  New Case Description (auto-created in DB on upload)
                </label>
                <input
                  id="newCaseDescription"
                  type="text"
                  value={newCaseDescription}
                  onChange={(event) => setNewCaseDescription(event.target.value)}
                  placeholder="e.g. Financial fraud device seizure"
                  className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
                />
                <p className="text-[10px] text-cyan-200/80">
                  When you upload, backend creates case automatically and links this evidence.
                </p>
              </div>
            )}

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
        </div>

        <div className="rounded-2xl border border-vigil-cyan/20 bg-black/40 p-4">
          <h3 className="mb-3 text-xs font-mono tracking-[0.16em] text-cyan-200">CHAIN RESPONSE</h3>
          {error && (
            <div className="mb-3 rounded-xl border border-rose-400/40 bg-rose-950/50 p-3 text-xs font-mono text-rose-200">
              Upload failed: {error}
            </div>
          )}

          {duplicateAlert && (
            <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-950/40 p-3 text-xs font-mono text-amber-200">
              Evidence already existed. {duplicateAlert}
            </div>
          )}

          {detailsSaved && lastUpload && (
            <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-3 text-xs font-mono text-emerald-200 animate-pulse">
              ✓ Case submitted successfully!
            </div>
          )}

          {!lastUpload && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-slate-400">
              Upload any file type (pdf, jpg, jpeg, png, doc, zip, etc.) and link it to a case number.
            </div>
          )}

          {lastUpload && (
            <div className="rounded-xl border border-vigil-cyan/20 bg-slate-950/80 p-3 text-xs font-mono text-cyan-100 space-y-1">
              <div>CASE ID: {lastUpload.case_id}</div>
              <div>EVIDENCE ID: {lastUpload.evidence_id}</div>
              <div>TXID: {lastUpload.txid ?? 'UNAVAILABLE'}</div>
              <div>BLOCK: {lastUpload.block_number ?? 'UNAVAILABLE'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
