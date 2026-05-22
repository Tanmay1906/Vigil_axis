import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardStats, fetchVerificationCases, CaseEvidence, DashboardStats as ApiDashboardStats } from '../../services/api'
import { useVigilStore } from '../../store/useVigilStore'

type EvidenceStatus = 'verified' | 'pending' | 'tampered'

type CaseSummary = {
  caseId: string
  caseDescription: string
  investigator: string
  collector: string
  evidenceCount: number
  latestEvidenceId: string
  latestEvidenceDescription: string
  lastUpdatedAt: string
  latestHash: string
  status: EvidenceStatus
}

type DashboardState = {
  caseSummaries: CaseSummary[]
  stats: ApiDashboardStats
  recentCaseEvents: string[]
}

const INITIAL_STATS: ApiDashboardStats = {
  pending: 0,
  completed: 0,
  integrity_score: 100,
  total_cases: 0,
  total_evidence: 0,
}

function summarizeStatus(item: CaseEvidence): EvidenceStatus {
  if (item.tx_hash && !item.tx_hash.startsWith('PENDING_')) {
    return 'verified'
  }
  return 'pending'
}

export function Dashboard() {
  const setSystemHealth = useVigilStore((state) => state.setSystemHealth)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<DashboardState>({
    caseSummaries: [],
    stats: INITIAL_STATS,
    recentCaseEvents: [],
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const cacheKey = 'vigil-dashboard-cache-v2'

    const cachedRaw = sessionStorage.getItem(cacheKey)
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as DashboardState
        setState(cached)
        setLoading(false)
      } catch {
        sessionStorage.removeItem(cacheKey)
      }
    }

    const load = async () => {
      setLoading(true)
      try {
        const [stats, cases] = await Promise.all([
          fetchDashboardStats(),
          fetchVerificationCases(20),
        ])

        if (!active) {
          return
        }

        const grouped = new Map<string, CaseEvidence[]>()
        for (const item of cases) {
          const bucket = grouped.get(item.case_id) || []
          bucket.push(item)
          grouped.set(item.case_id, bucket)
        }

        const caseSummaries: CaseSummary[] = Array.from(grouped.entries()).map(([caseId, items]) => {
          const sorted = [...items].sort((a, b) => {
            const aTs = a.uploaded_at_ist ? new Date(a.uploaded_at_ist).getTime() : 0
            const bTs = b.uploaded_at_ist ? new Date(b.uploaded_at_ist).getTime() : 0
            return bTs - aTs
          })
          const latest = sorted[0]
          const allVerified = items.every((entry) => summarizeStatus(entry) === 'verified')
          const status: EvidenceStatus = allVerified ? 'verified' : 'pending'

          return {
            caseId,
            caseDescription: latest.case_description || 'No case description',
            investigator: latest.investigator || 'UNKNOWN',
            collector: latest.collector || 'UNKNOWN',
            evidenceCount: items.length,
            latestEvidenceId: latest.evidence_id,
            latestEvidenceDescription: latest.evidence_description || latest.evidence_id,
            lastUpdatedAt: latest.uploaded_at_ist ? new Date(latest.uploaded_at_ist).toLocaleString() : 'UNKNOWN',
            latestHash: latest.hash,
            status,
          }
        }).sort((a, b) => {
          const aTs = a.lastUpdatedAt && a.lastUpdatedAt !== 'UNKNOWN' ? new Date(a.lastUpdatedAt).getTime() : 0
          const bTs = b.lastUpdatedAt && b.lastUpdatedAt !== 'UNKNOWN' ? new Date(b.lastUpdatedAt).getTime() : 0
          return bTs - aTs
        })

        const recentCaseEvents = caseSummaries.slice(0, 6).map((item) =>
          `${item.caseId}: ${item.latestEvidenceId} by ${item.investigator} at ${item.lastUpdatedAt}`,
        )

        const nextState: DashboardState = {
          caseSummaries,
          stats,
          recentCaseEvents,
        }

        setState(nextState)
        sessionStorage.setItem(cacheKey, JSON.stringify(nextState))
        setSystemHealth(stats.integrity_score)
        setError(null)
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to fetch dashboard state')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    const interval = window.setInterval(load, 30000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [setSystemHealth])

  const stats = useMemo(() => {
    const verified = state.caseSummaries.filter(item => item.status === 'verified').length
    const tampered = state.caseSummaries.filter(item => item.status === 'tampered').length
    const pending = state.caseSummaries.filter(item => item.status === 'pending').length

    return {
      totalCases: state.stats.total_cases,
      totalEvidence: state.stats.total_evidence,
      verified,
      tampered,
      pending,
      integrityRate: state.stats.integrity_score,
    }
  }, [state.caseSummaries, state.stats])

  return (
    <div className="min-h-screen rounded-3xl border border-cyan-400/20 bg-[linear-gradient(140deg,#030712_0%,#0b1220_55%,#111827_100%)] p-6 text-slate-100 shadow-[0_0_80px_rgba(8,145,178,0.12)]">
      <div className="mx-auto max-w-7xl space-y-5 font-['Space_Grotesk',ui-sans-serif,system-ui]">
        <header className="rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Forensic OS</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Case Command Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Case-level forensic operations view with custody ownership, evidence volume, and latest immutable hash records.
              </p>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-black/25 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Refresh Interval</p>
              <p className="text-sm font-medium text-cyan-100">30 seconds</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/50 p-3 text-xs text-rose-200">
            Dashboard API error: {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200">
            Synchronizing latest case records...
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Cases" value={String(stats.totalCases)} hint="registered cases" tone="slate" />
          <MetricCard title="Total Evidence" value={String(stats.totalEvidence)} hint="artifacts logged" tone="emerald" />
          <MetricCard title="Cases Pending" value={String(stats.pending)} hint="needs verification" tone="amber" />
          <MetricCard title="Tamper Alerts" value={String(stats.tampered)} hint="requires escalation" tone="rose" />
        </section>

        <section className="space-y-4">
          <div>
            <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/95 p-5 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Case Register</h2>
                <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">Immutable Hash Logging Enabled</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-[0.1em] text-slate-400">
                      <th className="py-2 pr-3 font-medium">Case ID</th>
                      <th className="py-2 pr-3 font-medium">Case Description</th>
                      <th className="py-2 pr-3 font-medium">Investigator / Collector</th>
                      <th className="py-2 pr-3 font-medium">Evidence Count</th>
                      <th className="py-2 pr-3 font-medium">Latest Evidence</th>
                      <th className="py-2 pr-3 font-medium">Latest Hash</th>
                      <th className="py-2 font-medium">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.caseSummaries.slice(0, 10).map((item) => (
                      <tr key={item.caseId} className="border-b border-slate-800">
                        <td className="py-3 pr-3 font-medium text-slate-100">{item.caseId}</td>
                        <td className="py-3 pr-3 text-slate-100">{item.caseDescription}</td>
                        <td className="py-3 pr-3 text-slate-300">
                          <div>{item.investigator}</div>
                          <div className="text-[11px] text-slate-500">{item.collector}</div>
                        </td>
                        <td className="py-3 pr-3 text-slate-300">{item.evidenceCount}</td>
                        <td className="py-3 pr-3 text-slate-300">
                          <div>{item.latestEvidenceId}</div>
                          <div className="text-[11px] text-slate-500">{item.latestEvidenceDescription}</div>
                        </td>
                        <td className="py-3 pr-3 font-mono text-xs text-slate-400">
                          {item.latestHash.slice(0, 16)}...{item.latestHash.slice(-8)}
                        </td>
                        <td className="py-3 text-slate-400">{item.lastUpdatedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <Panel title="Chain Of Custody" className="h-full">
                <div className="space-y-2 text-sm text-slate-300">
                  {state.recentCaseEvents.map((event) => (
                    <div key={event} className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                      {event}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="xl:col-span-3">
              <Panel title="Integrity Pulse" className="h-full">
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-white">{stats.integrityRate}%</p>
                  <p className="text-xs text-slate-400">verified evidence coverage</p>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.integrityRate}%` }}
                    transition={{ duration: 0.45 }}
                    className={`h-full rounded-full ${stats.integrityRate > 85 ? 'bg-emerald-600' : stats.integrityRate > 60 ? 'bg-amber-500' : 'bg-rose-600'}`}
                  />
                </div>
              </div>
            </Panel>
            </div>

            <div className="xl:col-span-3">
              <Panel title="Active Alert" className="h-full">
              <div className={`rounded-xl border p-3 text-sm ${stats.tampered > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {stats.tampered > 0
                  ? `${stats.tampered} artifact(s) failed hash verification and require analyst review.`
                  : 'No tamper alerts detected in current scan window.'}
              </div>
            </Panel>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard

function MetricCard({
  title,
  value,
  hint,
  tone
}: {
  title: string
  value: string
  hint: string
  tone: 'slate' | 'emerald' | 'amber' | 'rose'
}) {
  const tones = {
    slate: 'bg-slate-900/70 text-slate-100 border-slate-700',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30'
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}
    >
      <p className="text-xs uppercase tracking-[0.14em]">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="text-xs opacity-80">{hint}</p>
    </motion.div>
  )
}

function Panel({ title, children, className = '' }: { title: string, children: ReactNode, className?: string }) {
  return (
    <div className={`rounded-3xl border border-cyan-400/20 bg-slate-900/75 p-5 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)] ${className}`}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">{title}</h3>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: EvidenceStatus }) {
  const classes = {
    verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    tampered: 'border-rose-200 bg-rose-50 text-rose-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${classes[status]}`}>
      {status}
    </span>
  )
}
