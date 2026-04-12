import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

type EvidenceStatus = 'verified' | 'pending' | 'tampered'

type Evidence = {
  id: string
  name: string
  hash: string
  status: EvidenceStatus
  timestamp: string
  source: string
  size: string
}

const mockEvidence: Evidence[] = [
  {
    id: 'EV-001',
    name: 'Disk_Image_A01.dd',
    hash: 'A9F23C71D612...91B',
    status: 'verified',
    timestamp: '2026-04-12 10:22',
    source: 'Workstation-07',
    size: '84.2 GB'
  },
  {
    id: 'EV-002',
    name: 'Mobile_Dump_X2.bin',
    hash: '77BC12811FAE...FFE',
    status: 'tampered',
    timestamp: '2026-04-12 09:10',
    source: 'Android Device',
    size: '12.6 GB'
  },
  {
    id: 'EV-003',
    name: 'Log_Archive.zip',
    hash: '98AA11C04DE8...223',
    status: 'pending',
    timestamp: '2026-04-11 18:45',
    source: 'Server Cluster B',
    size: '2.1 GB'
  },
  {
    id: 'EV-004',
    name: 'Registry_Snapshot.hiv',
    hash: 'B310CAE82FD5...A90',
    status: 'verified',
    timestamp: '2026-04-11 16:02',
    source: 'Endpoint-113',
    size: '940 MB'
  }
]

const custodyEvents = [
  'EV-001 collected by SOC Operator and sealed with SHA-256',
  'EV-002 hash mismatch detected during cross-node verification',
  'EV-003 queued for triage validation and time-stamp notarization',
  'EV-004 archived under legal hold profile with retention lock'
]

export function Dashboard() {
  const [evidence, setEvidence] = useState<Evidence[]>([])

  useEffect(() => {
    setEvidence(mockEvidence)
  }, [])

  const stats = useMemo(() => {
    const verified = evidence.filter(item => item.status === 'verified').length
    const tampered = evidence.filter(item => item.status === 'tampered').length
    const pending = evidence.filter(item => item.status === 'pending').length

    return {
      total: evidence.length,
      verified,
      tampered,
      pending,
      integrityRate: evidence.length > 0 ? Math.round((verified / evidence.length) * 100) : 0
    }
  }, [evidence])

  return (
    <div className="min-h-screen rounded-3xl border border-cyan-400/20 bg-[linear-gradient(140deg,#030712_0%,#0b1220_55%,#111827_100%)] p-6 text-slate-100 shadow-[0_0_80px_rgba(8,145,178,0.12)]">
      <div className="mx-auto max-w-7xl space-y-5 font-['Space_Grotesk',ui-sans-serif,system-ui]">
        <header className="rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Forensic OS</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Digital Evidence Integrity Desk</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Centralized dashboard for ingestion, cryptographic hashing, custody tracking, and tamper detection across digital evidence artifacts.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl border border-cyan-400/30 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/80">
                New Case
              </button>
              <button className="rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400">
                Ingest Evidence
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Evidence" value={String(stats.total)} hint="records" tone="slate" />
          <MetricCard title="Verified" value={String(stats.verified)} hint="integrity passed" tone="emerald" />
          <MetricCard title="Pending" value={String(stats.pending)} hint="awaiting hash check" tone="amber" />
          <MetricCard title="Tampered" value={String(stats.tampered)} hint="requires escalation" tone="rose" />
        </section>

        <section className="space-y-4">
          <div>
            <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/95 p-5 shadow-[0_18px_50px_-30px_rgba(8,145,178,0.45)]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Evidence Register</h2>
                <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">Immutable Hash Logging Enabled</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-[0.1em] text-slate-400">
                      <th className="py-2 pr-3 font-medium">ID</th>
                      <th className="py-2 pr-3 font-medium">Artifact</th>
                      <th className="py-2 pr-3 font-medium">Source</th>
                      <th className="py-2 pr-3 font-medium">Size</th>
                      <th className="py-2 pr-3 font-medium">Hash</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.map(item => (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="py-3 pr-3 font-medium text-slate-100">{item.id}</td>
                        <td className="py-3 pr-3 text-slate-100">{item.name}</td>
                        <td className="py-3 pr-3 text-slate-300">{item.source}</td>
                        <td className="py-3 pr-3 text-slate-300">{item.size}</td>
                        <td className="py-3 pr-3 font-mono text-xs text-slate-400">{item.hash}</td>
                        <td className="py-3 pr-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 text-slate-400">{item.timestamp}</td>
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
                  {custodyEvents.map(event => (
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
                  <p className="text-xs text-slate-400">hash success rate</p>
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

function Panel({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) {
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
