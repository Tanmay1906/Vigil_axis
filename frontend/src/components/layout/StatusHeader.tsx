import { useEffect, useState } from 'react'
import { Lock, Clock, Wifi, User, ShieldCheck } from 'lucide-react'
import { useVigilStore } from '../../store/useVigilStore'
import { getAuthPayload } from '../../utils/auth'

const MODULE_LABEL: Record<string, string> = {
  dashboard: 'CASE COMMAND CENTER',
  cases: 'CASE MANAGEMENT',
  evidence: 'EVIDENCE INGESTION LAB',
  audit: 'AUDIT TRAIL',
  verification: 'INTEGRITY VERIFICATION',
  ledger: 'IMMUTABLE LEDGER',
}

export function StatusHeader({ activeModule = 'dashboard' }: { activeModule?: string }) {
  const [time, setTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const systemHealth = useVigilStore(state => state.systemHealth)
  const auth = getAuthPayload()
  const username = auth?.username || 'ANON'
  const roleLabel = auth?.role === 'forensic-auditor' ? 'FORENSIC AUDITOR' : 'FORENSIC INVESTIGATOR'

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const healthColor = systemHealth < 50 ? 'text-vigil-crimson' : 'text-vigil-cyan'
  const shadowColor = systemHealth < 50 ? 'shadow-[0_0_10px_#FF3131]' : 'shadow-[0_0_10px_#00F2FF]'

  return (
    <header className="w-full border-b border-white/10 bg-vigil-bg/40 backdrop-blur-md px-4 py-3 lg:px-8 z-10 select-none">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <div className="flex items-center text-xs font-mono tracking-widest bg-vigil-cyan/10 border border-vigil-cyan/30 px-3 py-1 rounded text-vigil-cyan">
            <Lock className="w-3 h-3 mr-2" />
            ENCRYPTED 256-BIT
          </div>
          <div className="flex items-center text-xs font-mono tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded text-white/80">
            <ShieldCheck className="w-3 h-3 mr-2" />
            {MODULE_LABEL[activeModule] || MODULE_LABEL.dashboard}
          </div>
          <div className="flex items-center text-xs font-mono tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded text-white/70">
            <User className="w-3 h-3 mr-2" />
            {username} · {roleLabel}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:gap-6 font-mono text-sm tracking-wider">
          <div className={`flex items-center space-x-2 ${healthColor}`}>
            <div className={`w-2 h-2 rounded-full ${shadowColor} animate-pulse bg-current`} />
            <span>SYS_HEALTH: {systemHealth.toFixed(1)}%</span>
          </div>
          <div className={`flex items-center text-xs ${isOnline ? 'text-emerald-300' : 'text-rose-300'}`}>
            <Wifi className="w-3 h-3 mr-2" />
            {isOnline ? 'LIVE LINK ACTIVE' : 'NETWORK OFFLINE'}
          </div>
          <div className="flex items-center text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            <span className="text-xs ml-1 opacity-50">.{time.getMilliseconds().toString().padStart(3, '0')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
