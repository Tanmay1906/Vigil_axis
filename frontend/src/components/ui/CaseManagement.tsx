import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, FileText, FolderOpen, Search } from 'lucide-react'
import {
  type CaseEvidence,
  fetchVerificationCases,
  fetchVerificationSourceByEvidence,
  type VerificationSourceResponse,
} from '../../services/api'

type CaseFolder = {
  caseId: string
  caseDescription: string
  investigator: string
  collector: string
  evidences: CaseEvidence[]
  lastUpdatedAt: string
}

export function CaseManagement() {
  const [folders, setFolders] = useState<CaseFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [openedCaseId, setOpenedCaseId] = useState<string | null>(null)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [evidenceSource, setEvidenceSource] = useState<VerificationSourceResponse | null>(null)
  const [evidenceLoading, setEvidenceLoading] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const all = await fetchVerificationCases(80)
        if (!active) return

        const grouped = new Map<string, CaseEvidence[]>()
        for (const item of all) {
          const bucket = grouped.get(item.case_id) || []
          bucket.push(item)
          grouped.set(item.case_id, bucket)
        }

        const nextFolders: CaseFolder[] = Array.from(grouped.entries())
          .map(([caseId, entries]) => {
            const sorted = [...entries].sort((a, b) => {
              const aTs = a.uploaded_at_ist ? new Date(a.uploaded_at_ist).getTime() : 0
              const bTs = b.uploaded_at_ist ? new Date(b.uploaded_at_ist).getTime() : 0
              return bTs - aTs
            })
            const latest = sorted[0]
            return {
              caseId,
              caseDescription: latest.case_description || 'No case description',
              investigator: latest.investigator || 'UNKNOWN',
              collector: latest.collector || 'UNKNOWN',
              evidences: sorted,
              lastUpdatedAt: latest.uploaded_at_ist || '',
            }
          })
          .sort((a, b) => {
            const aTs = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0
            const bTs = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0
            return bTs - aTs
          })

        setFolders(nextFolders)
        setError(null)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Failed to load cases')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadEvidenceSource = async () => {
      if (!selectedEvidenceId) {
        setEvidenceSource(null)
        return
      }

      setEvidenceLoading(true)
      try {
        const payload = await fetchVerificationSourceByEvidence(selectedEvidenceId)
        if (!active) return
        setEvidenceSource(payload)
      } catch {
        if (active) setEvidenceSource(null)
      } finally {
        if (active) setEvidenceLoading(false)
      }
    }

    loadEvidenceSource()
    return () => {
      active = false
    }
  }, [selectedEvidenceId])

  const filteredFolders = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return folders
    return folders.filter((folder) =>
      folder.caseId.toLowerCase().includes(q) ||
      folder.caseDescription.toLowerCase().includes(q) ||
      folder.investigator.toLowerCase().includes(q) ||
      folder.collector.toLowerCase().includes(q) ||
      folder.evidences.some((e) => e.evidence_id.toLowerCase().includes(q))
    )
  }, [folders, query])

  const selectedCase = useMemo(
    () => folders.find((f) => f.caseId === openedCaseId) || null,
    [folders, openedCaseId],
  )

  const selectedEvidence = useMemo(
    () => selectedCase?.evidences.find((e) => e.evidence_id === selectedEvidenceId) || null,
    [selectedCase, selectedEvidenceId],
  )

  const sourceEvidence = useMemo(() => {
    if (!evidenceSource || !selectedEvidenceId) return null

    if (Array.isArray(evidenceSource.evidence)) {
      return evidenceSource.evidence.find((e) => e.evidence_id === selectedEvidenceId)
        || evidenceSource.evidence[0]
        || null
    }

    return evidenceSource.evidence
  }, [evidenceSource, selectedEvidenceId])

  const handleOpenCase = (caseId: string) => {
    const nextCase = folders.find((f) => f.caseId === caseId)
    setOpenedCaseId(caseId)
    setSelectedEvidenceId(nextCase?.evidences[0]?.evidence_id || null)
  }

  const handleBack = () => {
    setOpenedCaseId(null)
    setSelectedEvidenceId(null)
    setEvidenceSource(null)
  }

  return (
    <div className="h-full overflow-y-auto rounded-3xl border border-cyan-400/20 bg-slate-950/90 p-6 text-slate-100 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">Investigator Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Case Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            {openedCaseId
              ? 'Select an evidence file to inspect its artifact details and hashes.'
              : 'Open a case folder, select evidence, and inspect artifact details.'}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
          Total cases: {folders.length}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search case, investigator, collector, evidence id…"
          className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
      </div>

      {loading && (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-200">
          Loading case folders…
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
          Case API error: {error}
        </div>
      )}

      {!openedCaseId && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="mb-4 text-[11px] uppercase tracking-[0.14em] text-slate-500">Desktop — case folders</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredFolders.map((folder) => (
              <button
                key={folder.caseId}
                onClick={() => handleOpenCase(folder.caseId)}
                className="group rounded-xl border border-transparent p-3 text-left transition-all hover:border-cyan-300/30 hover:bg-white/5"
              >
                <div className="relative mx-auto mb-3 h-16 w-[88px]">
                  <div className="absolute left-2 top-1 h-[10px] w-8 rounded-t-md bg-amber-200/90" />
                  <div className="absolute inset-x-0 top-[10px] bottom-0 rounded-md border border-amber-300/60 bg-gradient-to-b from-amber-200 to-amber-400 shadow-[0_6px_16px_rgba(251,191,36,.2)] transition-transform group-hover:-translate-y-0.5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(120,53,15,0.55)"
                        strokeWidth="1.5"
                        className="h-7 w-7"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[13px] font-medium text-slate-100">{folder.caseId}</p>
                <p className="mt-1 text-center text-[11px] text-slate-500">{folder.evidences.length} evidence</p>
              </button>
            ))}
          </div>

          {!loading && filteredFolders.length === 0 && (
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-3 text-xs text-slate-500">
              No matching case folders found.
            </div>
          )}
        </div>
      )}

      {openedCaseId && (
        <div className="space-y-4 min-w-0">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Desktop
            </button>
            <ChevronRight className="h-4 w-4 text-slate-600" />
            <FolderOpen className="h-4 w-4 text-amber-300" />
            <span className="font-medium text-slate-100">{openedCaseId}</span>
            {selectedEvidence && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-600" />
                <FileText className="h-4 w-4 text-cyan-300" />
                <span className="text-slate-200">{selectedEvidence.evidence_id}</span>
              </>
            )}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3 xl:col-span-4">
              <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">Evidence files</p>
              <div className="flex max-h-[58vh] flex-col gap-2 overflow-y-auto pr-1">
                {selectedCase?.evidences.map((evidence) => {
                  const active = evidence.evidence_id === selectedEvidenceId
                  return (
                    <button
                      key={evidence.evidence_id}
                      onClick={() => setSelectedEvidenceId(evidence.evidence_id)}
                      className={[
                        'w-full rounded-xl border px-3 py-2.5 text-left transition-all',
                        active
                          ? 'border-cyan-400/40 bg-cyan-500/10'
                          : 'border-white/10 bg-slate-900/60 hover:border-white/20 hover:bg-white/5',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex min-w-0 items-center gap-2 text-[13px] text-slate-100">
                          <FileText className="h-4 w-4 shrink-0 text-cyan-300" />
                          <span className="truncate">{evidence.evidence_id}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {evidence.evidence_description || 'No evidence description'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-4 xl:col-span-8">
              <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">Opened evidence</p>

              {!selectedEvidence && (
                <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-3 text-xs text-slate-500">
                  Select an evidence file to inspect details.
                </div>
              )}

              {selectedEvidence && (
                <div className="space-y-3 min-w-0">
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Evidence Overview</p>
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.08em]">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                          {selectedEvidence.case_id}
                        </span>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                          {selectedEvidence.tx_hash && !selectedEvidence.tx_hash.startsWith('PENDING_') ? 'Pending' : 'Not Anchored'}
                        </span>
                        {evidenceLoading && (
                          <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-2 py-1 text-slate-300">
                            Loading source
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <DetailChip label="Evidence ID" value={selectedEvidence.evidence_id} />
                      <DetailChip label="Evidence Name" value={selectedEvidence.evidence_description || 'No evidence description'} />
                      <DetailChip label="Case Description" value={selectedCase?.caseDescription || 'No case description'} />
                      <DetailChip label="Uploaded At" value={selectedEvidence.uploaded_at_ist || 'Unknown'} />
                      <DetailChip label="Investigator" value={selectedCase?.investigator || 'No investigator assigned'} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-3">
                    <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-cyan-300/80">Integrity Snapshot</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <DetailChip label="Indexed SHA-256" value={selectedEvidence.hash} mono />
                      <DetailChip label="Blockchain SHA-256" value={evidenceSource?.source_hash || sourceEvidence?.hash || 'Unavailable'} mono />
                      <DetailChip label="Transaction ID" value={evidenceSource?.txid || selectedEvidence.tx_hash || 'Unavailable'} mono />
                      <DetailChip
                        label="Blockchain Timestamp"
                        value={
                          evidenceSource?.block_timestamp
                            ? new Date(Number(evidenceSource.block_timestamp) * 1000).toLocaleString()
                            : sourceEvidence?.uploaded_at_ist
                              ? new Date(sourceEvidence.uploaded_at_ist).toLocaleString()
                              : selectedEvidence.uploaded_at_ist
                                ? new Date(selectedEvidence.uploaded_at_ist).toLocaleString()
                                : 'Not yet confirmed on blockchain'
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-slate-500">Stored Evidence Profile</p>

                    {selectedEvidence.evidence_profile ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <DetailChip label="File Type" value={selectedEvidence.evidence_profile.file_type || 'unknown'} />
                        <DetailChip
                          label="File Size"
                          value={selectedEvidence.evidence_profile.file_size_bytes?.toLocaleString() ? `${selectedEvidence.evidence_profile.file_size_bytes.toLocaleString()} bytes` : 'unknown'}
                        />
                        <DetailChip label="Created Day" value={selectedEvidence.evidence_profile.created_day || 'unknown'} />
                        <DetailChip label="Created At" value={selectedEvidence.evidence_profile.created_at || 'unknown'} />
                        <DetailChip label="Cache State" value={selectedEvidence.evidence_profile.cache_state || 'unknown'} />
                        <DetailChip label="Cache Path" value={selectedEvidence.evidence_profile.cache_path || 'unknown'} />
                        <div className="rounded-lg border border-white/10 bg-black/30 p-3 md:col-span-2">
                          <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-slate-500">Memory Preview</p>
                          <div className="max-h-24 overflow-auto break-all rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-cyan-100">
                            {selectedEvidence.evidence_profile.memory_preview_hex || 'Unavailable'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-400">
                        No stored profile is attached to this evidence record yet.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-slate-500">Raw Payload</p>
                    <pre className="max-h-[28vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
{JSON.stringify(
  {
    case_id: selectedEvidence.case_id,
    evidence_id: selectedEvidence.evidence_id,
    chain_anchor_status: (selectedEvidence.tx_hash && !selectedEvidence.tx_hash.startsWith('PENDING_')) ? 'anchored' : 'not_anchored',
    verification_status: (selectedEvidence.tx_hash && !selectedEvidence.tx_hash.startsWith('PENDING_')) ? 'pending' : 'not_anchored',
    source_payload_available: !!evidenceSource,
    evidence_profile: selectedEvidence.evidence_profile || sourceEvidence?.evidence_profile || null,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailChip({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className={mono ? 'break-all font-mono text-[12px] leading-relaxed text-cyan-100' : 'break-words text-[12px] leading-relaxed text-slate-100'}>
        {value}
      </div>
    </div>
  )
}