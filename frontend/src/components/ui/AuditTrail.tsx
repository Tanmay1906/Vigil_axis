import { useEffect, useMemo, useState } from 'react'
import { Download, History, Search } from 'lucide-react'
import { buildAuditReportUrl, fetchAuditSummary, fetchVerificationCases, type AuditCaseSummary } from '../../services/api'

export function AuditTrail() {
  const [cases, setCases] = useState<string[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [summary, setSummary] = useState<AuditCaseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const all = await fetchVerificationCases(160)
        if (!active) {
          return
        }

        const uniqueCases = Array.from(new Set(all.map((item) => item.case_id))).sort((a, b) => a.localeCompare(b))
        setCases(uniqueCases)

        const defaultCase = uniqueCases[0]
        if (defaultCase) {
          setSelectedCase(defaultCase)
        }
      } catch (bootstrapError) {
        if (active) {
          setError(bootstrapError instanceof Error ? bootstrapError.message : 'Failed to load case list')
        }
      }
    }

    bootstrap()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadSummary = async () => {
      if (!selectedCase) {
        return
      }

      setLoading(true)
      try {
        const loaded = await fetchAuditSummary(selectedCase)
        if (!active) {
          return
        }
        setSummary(loaded)
        setError(null)
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load audit summary')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSummary()
    return () => {
      active = false
    }
  }, [selectedCase])

  const filteredEvents = useMemo(() => {
    if (!summary) {
      return []
    }

    const q = query.trim().toLowerCase()
    if (!q) {
      return summary.audit_trail
    }

    return summary.audit_trail.filter((event) => {
      const detailsText = JSON.stringify(event.details || {}).toLowerCase()
      return (
        event.action.toLowerCase().includes(q)
        || event.actor.toLowerCase().includes(q)
        || (event.evidence_id || '').toLowerCase().includes(q)
        || detailsText.includes(q)
      )
    })
  }, [summary, query])

  return (
    <div className="h-full overflow-y-auto rounded-3xl border border-cyan-400/20 bg-slate-950/90 p-6 text-slate-100 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Investigator Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Audit Trail</h2>
          <p className="mt-1 text-sm text-slate-300">Timeline of all actions for selected case with downloadable report.</p>
        </div>
        <a
          href={buildAuditReportUrl(selectedCase || undefined)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20"
        >
          <Download className="h-4 w-4" />
          Download Audit PDF
        </a>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-cyan-200/80">Case</label>
          <select
            value={selectedCase}
            onChange={(event) => setSelectedCase(event.target.value)}
            className="w-full rounded-lg border border-cyan-400/20 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            {cases.map((caseId) => (
              <option key={caseId} value={caseId}>{caseId}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-cyan-200/80">Search events</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="action, actor, evidence id"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200">
          Loading audit timeline...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">
          Audit API error: {error}
        </div>
      )}

      <div className="min-w-0 rounded-2xl border border-white/10 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">
          {summary?.case.case_id || selectedCase || 'No case selected'}
        </div>

        <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
          {filteredEvents.map((event) => (
            <div key={event.audit_id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-cyan-200">
                  {event.action}
                </span>
                <span className="text-[11px] text-slate-400">{event.occurred_at_ist ? new Date(event.occurred_at_ist).toLocaleString() : 'UNKNOWN'}</span>
              </div>
              <div className="mt-2 text-sm text-slate-200">Actor: {event.actor}</div>
              <div className="mt-1 text-xs text-slate-400">Evidence: {event.evidence_id || '-'}</div>
              <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-slate-300">
                {JSON.stringify(event.details || {}, null, 0)}
              </div>
            </div>
          ))}

          {!loading && filteredEvents.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              <div className="inline-flex items-center gap-2">
                <History className="h-4 w-4" />
                No audit entries for current filter.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
