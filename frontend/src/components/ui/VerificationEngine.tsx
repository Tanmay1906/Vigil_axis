import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Download, Shield, ShieldAlert } from 'lucide-react'
import {
  CaseEvidence,
  fetchVerificationCases,
  fetchVerificationSourceByCase,
  fetchVerificationSourceByEvidence,
} from '../../services/api'

type VerificationState = {
  localHash: string
  sourceHash: string
  mismatchOffset: number | null
  isVerified: boolean
}

async function sha256Hex(file: File): Promise<string> {
  const data = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function firstMismatchOffset(a: string, b: string): number | null {
  const max = Math.max(a.length, b.length)
  for (let index = 0; index < max; index += 1) {
    if (a[index] !== b[index]) {
      return index
    }
  }
  return null
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = word
      currentY += lineHeight
    } else {
      line = testLine
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY)
  }

  return currentY + lineHeight
}

async function generateCertificateImageUrl(input: {
  caseId: string
  evidenceId: string
  verifiedAt: string
  localHash: string
  sourceHash: string
}): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 1000
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Unable to initialize certificate renderer.')
  }

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  bg.addColorStop(0, '#0a1224')
  bg.addColorStop(0.5, '#111c34')
  bg.addColorStop(1, '#0b1528')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)'
  ctx.lineWidth = 4
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56)

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104)

  ctx.fillStyle = 'rgba(34, 211, 238, 0.12)'
  ctx.fillRect(84, 90, canvas.width - 168, 130)

  ctx.fillStyle = '#a5f3fc'
  ctx.font = '700 24px Segoe UI'
  ctx.fillText('VIGIL-AXIS FORENSIC CERTIFICATION UNIT', 100, 140)

  ctx.fillStyle = '#f8fafc'
  ctx.font = '700 52px Segoe UI'
  ctx.fillText('BSA 2026 ADMISSIBILITY CERTIFICATE', 100, 205)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 22px Segoe UI'
  ctx.fillText('Digital Evidence Integrity Validation - Court Submission Ready', 100, 248)

  let y = 320
  const left = 110
  const maxWidth = canvas.width - 220

  ctx.fillStyle = '#67e8f9'
  ctx.font = '600 24px Segoe UI'
  ctx.fillText('Certificate Details', left, y)
  y += 42

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '500 22px Consolas'
  ctx.fillText(`Case ID       : ${input.caseId}`, left, y)
  y += 38
  ctx.fillText(`Evidence ID   : ${input.evidenceId}`, left, y)
  y += 38
  ctx.fillText(`Verified At   : ${input.verifiedAt}`, left, y)
  y += 52

  ctx.fillStyle = '#67e8f9'
  ctx.font = '600 24px Segoe UI'
  ctx.fillText('Hash Verification', left, y)
  y += 42

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '500 20px Consolas'
  y = drawWrappedText(ctx, `Local SHA-256      : ${input.localHash}`, left, y, maxWidth, 30)
  y = drawWrappedText(ctx, `Blockchain SHA-256 : ${input.sourceHash}`, left, y, maxWidth, 30)
  y += 20

  ctx.fillStyle = 'rgba(16, 185, 129, 0.20)'
  ctx.fillRect(left - 10, y - 28, maxWidth + 20, 74)
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)'
  ctx.lineWidth = 2
  ctx.strokeRect(left - 10, y - 28, maxWidth + 20, 74)

  ctx.fillStyle = '#86efac'
  ctx.font = '700 28px Segoe UI'
  ctx.fillText('RESULT: HASH MATCHED - EVIDENCE INTEGRITY VERIFIED', left, y + 14)

  y += 88
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 20px Segoe UI'
  y = drawWrappedText(
    ctx,
    'This digital artifact satisfies integrity verification controls under the Bharatiya Sakshya Adhiniyam (BSA) 2026 workflow and is certified as admissible for legal proceedings, subject to chain-of-custody compliance.',
    left,
    y,
    maxWidth,
    30,
  )

  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 17px Segoe UI'
  ctx.fillText('Issued by: VIGIL-AXIS Verification Engine | Role: Forensic Auditor', left, canvas.height - 85)
  ctx.fillText('Certificate Type: Digital Image Certificate (PNG) | Ref: BSA-2026-VX', left, canvas.height - 52)

  return canvas.toDataURL('image/png')
}

export function VerificationEngine() {
  const [cases, setCases] = useState<CaseEvidence[]>([])
  const [selectedCase, setSelectedCase] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState('')
  const [loadingCases, setLoadingCases] = useState(true)
  const [state, setState] = useState<VerificationState>({
    localHash: '',
    sourceHash: '',
    mismatchOffset: null,
    isVerified: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [certificateImageUrl, setCertificateImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const cacheKey = 'vigil-verification-cases-v1'

    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CaseEvidence[]
        if (parsed.length > 0) {
          setCases(parsed)
          setSelectedCase(parsed[0].case_id)
          setSelectedEvidence(parsed[0].evidence_id)
          setLoadingCases(false)
        }
      } catch {
        sessionStorage.removeItem(cacheKey)
      }
    }

    const loadCases = async () => {
      setLoadingCases(true)
      try {
        const loaded = await fetchVerificationCases(120)
        if (!active) {
          return
        }
        setCases(loaded)
        sessionStorage.setItem(cacheKey, JSON.stringify(loaded))
        if (loaded.length > 0) {
          setSelectedCase(loaded[0].case_id)
          setSelectedEvidence(loaded[0].evidence_id)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load verification cases')
        }
      } finally {
        if (active) {
          setLoadingCases(false)
        }
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [])

  const evidenceForCase = useMemo(
    () => cases.filter((item) => item.case_id === selectedCase),
    [cases, selectedCase],
  )

  const runVerification = async (file: File) => {
    if (!selectedCase) {
      setError('Select a case before verification.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const localHash = await sha256Hex(file)
      const sourcePayload = selectedEvidence
        ? await fetchVerificationSourceByEvidence(selectedEvidence)
        : await fetchVerificationSourceByCase(selectedCase)

      const sourceHash = sourcePayload.source_hash.toLowerCase()
      const normalizedLocal = localHash.toLowerCase()
      const mismatch = firstMismatchOffset(normalizedLocal, sourceHash)

      setState({
        localHash: normalizedLocal,
        sourceHash,
        mismatchOffset: mismatch,
        isVerified: mismatch === null,
      })

      if (mismatch === null) {
        const generatedImage = await generateCertificateImageUrl({
          caseId: selectedCase,
          evidenceId: selectedEvidence || 'N/A',
          verifiedAt: new Date().toUTCString(),
          localHash: normalizedLocal,
          sourceHash,
        })
        setCertificateImageUrl(generatedImage)
      } else {
        setCertificateImageUrl(null)
      }
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  const statusTone = state.isVerified
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    : 'border-rose-400/40 bg-rose-500/10 text-rose-200'

  return (
    <div className="h-full overflow-y-auto rounded-3xl border border-cyan-400/20 bg-slate-950/90 p-6 pointer-events-auto text-slate-100 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)]">
      <div className="mb-6 rounded-2xl border border-cyan-400/25 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),rgba(2,6,23,0.25)_45%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.92))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/20 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Forensic Auditor Console</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Verification Engine</h2>
            <p className="mt-1 text-sm text-slate-300">Deep integrity verification across local artifact hash and immutable blockchain source.</p>
          </div>
          <div className={`px-4 py-1.5 border rounded-lg text-xs font-mono tracking-widest flex items-center transition-colors ${statusTone}`}>
          {state.isVerified ? <Shield className="w-4 h-4 mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
          {state.localHash ? (state.isVerified ? 'INTEGRITY VERIFIED' : 'INTEGRITY ALERT') : 'AWAITING ARTIFACT'}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-vigil-cyan/20 bg-black/40 p-4 space-y-4">
        {loadingCases && (
          <p className="text-xs font-mono text-cyan-200/80">Loading verification cases...</p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">Case ID</label>
            <select
              value={selectedCase}
              onChange={(event) => {
                const caseId = event.target.value
                setSelectedCase(caseId)
                const firstEvidence = cases.find((item) => item.case_id === caseId)
                setSelectedEvidence(firstEvidence?.evidence_id || '')
              }}
              className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
            >
              {Array.from(new Set(cases.map((item) => item.case_id))).map((caseId) => (
                <option key={caseId} value={caseId}>{caseId}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">Evidence ID</label>
            <select
              value={selectedEvidence}
              onChange={(event) => setSelectedEvidence(event.target.value)}
              className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
            >
              {evidenceForCase.map((item) => (
                <option key={item.evidence_id} value={item.evidence_id}>{item.evidence_id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-200/80">Local Artifact</label>
            <input
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  runVerification(file)
                }
              }}
              className="w-full rounded-lg border border-vigil-cyan/20 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none"
            />
          </div>
        </div>

        {busy && <p className="text-xs font-mono text-cyan-300/80">Computing local hash and comparing against ledger source...</p>}
        {error && <p className="text-xs font-mono text-rose-300">{error}</p>}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <HashPanel title="SOURCE_A : BLOCKCHAIN_LEDGER" hash={state.sourceHash} mismatchOffset={state.mismatchOffset} compareLeft />
        <HashPanel title="SOURCE_B : LOCAL_ARTIFACT" hash={state.localHash} mismatchOffset={state.mismatchOffset} />
      </div>

      {state.localHash && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-2xl border p-4 text-sm ${state.isVerified ? 'border-emerald-400/30 bg-emerald-950/35 text-emerald-100' : 'border-rose-400/30 bg-rose-950/35 text-rose-100'}`}
        >
          {state.isVerified
            ? 'Hashes are identical. Integrity verification passed.'
            : `Hash mismatch detected at hex offset ${state.mismatchOffset}.`}
        </motion.div>
      )}

      {state.isVerified && state.localHash && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-emerald-400/30 bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(2,6,23,0.6))] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/20 p-2 text-emerald-100">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-100">Admissibility Certificate Ready</p>
                <p className="text-xs text-emerald-200/90">
                  Evidence matched successfully. Download the BSA 2026 admissibility image certificate for court submission.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {certificateImageUrl && (
                <a
                  href={certificateImageUrl}
                  download={`bsa_2026_admissibility_${selectedCase}_${selectedEvidence || 'evidence'}.png`}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Certificate Image
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function HashPanel({
  title,
  hash,
  mismatchOffset,
  compareLeft = false,
}: {
  title: string
  hash: string
  mismatchOffset: number | null
  compareLeft?: boolean
}) {
  const chunks = useMemo(() => hash.match(/.{1,8}/g) || [], [hash])

  return (
    <div className="rounded-xl border border-vigil-cyan/20 bg-black/50 p-4">
      <div className="font-mono text-[10px] text-white/40 mb-3">{title}</div>
      <div className="font-mono text-xs text-vigil-cyan/80 break-all leading-7">
        {chunks.length === 0 && <span className="text-white/30">No hash loaded.</span>}
        {chunks.map((chunk, index) => {
          const start = index * 8
          const end = start + chunk.length
          const mismatchInside = mismatchOffset !== null && mismatchOffset >= start && mismatchOffset < end
          if (!mismatchInside || compareLeft) {
            return <span key={`${title}-${start}`} className="mr-2">{chunk}</span>
          }

          const localOffset = mismatchOffset - start
          return (
            <span key={`${title}-${start}`} className="mr-2">
              {chunk.slice(0, localOffset)}
              <span className="bg-vigil-blood/30 text-vigil-blood px-0.5 rounded-sm">{chunk[localOffset]}</span>
              {chunk.slice(localOffset + 1)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
