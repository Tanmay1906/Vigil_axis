import { Activity, Box, Search, ShieldAlert, LogOut, UserRound, Shield, FolderKanban, ScrollText } from 'lucide-react'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthToken, getAuthPayload, getCurrentRole, UserRole } from '../../utils/auth'

interface SidebarProps {
  activeModule: string
  setActiveModule: (m: string) => void
}

export function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const navigate = useNavigate()
  const role = getCurrentRole()
  const auth = getAuthPayload()
  const modules: Array<{
    id: string
    icon: ComponentType<{ className?: string }>
    label: string
    description: string
    roles: UserRole[]
  }> = [
    { id: 'dashboard', icon: Activity, label: 'CASE DASHBOARD', description: 'Case-level overview', roles: ['forensic-investigator', 'forensic-auditor'] },
    { id: 'cases', icon: FolderKanban, label: 'CASE MANAGEMENT', description: 'Track all cases', roles: ['forensic-investigator', 'forensic-auditor'] },
    { id: 'evidence', icon: Search, label: 'EVIDENCE LAB', description: 'Upload and hash evidence', roles: ['forensic-investigator'] },
    { id: 'audit', icon: ScrollText, label: 'AUDIT TRAIL', description: 'Timeline and reports', roles: ['forensic-investigator'] },
    { id: 'verification', icon: ShieldAlert, label: 'VERIFICATION', description: 'Deep-diff integrity checks', roles: ['forensic-auditor'] },
    { id: 'ledger', icon: Box, label: 'LEDGER', description: 'Immutable chain records', roles: ['forensic-auditor'] }
  ]

  const visibleModules = modules.filter((module) => role ? module.roles.includes(role) : false)

  return (
    <aside className="w-20 lg:w-64 h-full border-r border-vigil-cyan/20 bg-vigil-bg/60 backdrop-blur-3xl flex flex-col items-center lg:items-start select-none z-10 sticky top-0 left-0">
      <div className="p-6 border-b border-vigil-cyan/10 w-full flex justify-center lg:justify-start">
        <div className="w-8 h-8 rounded-full bg-vigil-cyan shadow-[0_0_15px_#00F2FF] animate-pulse" />
        <div className="ml-4 hidden lg:block">
          <span className="font-bold tracking-widest text-vigil-cyan">VIGIL-AXIS</span>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-white/60">
            <Shield className="h-3 w-3" />
            {role === 'forensic-auditor' ? 'AUDITOR CONSOLE' : 'INVESTIGATOR CONSOLE'}
          </div>
        </div>
      </div>

      <div className="hidden w-full border-b border-vigil-cyan/10 px-4 py-3 lg:block">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-100">
            <UserRound className="h-3.5 w-3.5" />
            {auth?.username || 'UNIDENTIFIED'}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/50">
            {role === 'forensic-auditor' ? 'forensic-auditor' : 'forensic-investigator'}
          </div>
        </div>
      </div>

      <nav className="flex-1 w-full pt-8 space-y-4 px-4">
        {visibleModules.map(({ id, icon: Icon, label, description }) => {
          const isActive = activeModule === id
          return (
            <button
              key={id}
              onClick={() => setActiveModule(id)}
              className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                isActive 
                  ? 'bg-vigil-cyan/10 border border-vigil-cyan/30 text-vigil-cyan shadow-[inset_0_0_20px_rgba(0,242,255,0.1)]' 
                  : 'text-gray-400 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-vigil-cyan/20 to-transparent opacity-50 blur-md pointer-events-none" />
              )}
              <Icon className={`w-5 h-5 lg:mr-3 ${isActive ? 'drop-shadow-[0_0_8px_#00F2FF]' : ''}`} />
              <span className="hidden lg:block text-left">
                <span className="block text-sm font-mono tracking-wider">{label}</span>
                <span className="block text-[10px] text-white/45">{description}</span>
              </span>
            </button>
          )
        })}
      </nav>
      
      <div className="w-full border-t border-vigil-cyan/10 p-4">
        <button
          onClick={() => {
            clearAuthToken()
            navigate('/login', { replace: true })
          }}
          className="hidden w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-white/70 transition hover:border-rose-300/40 hover:bg-rose-500/10 hover:text-rose-200 lg:flex"
        >
          <LogOut className="h-3.5 w-3.5" />
          SIGN OUT
        </button>
        <div className="pt-3 text-center text-[10px] text-vigil-cyan/40 font-mono tracking-widest">
          <div className="hidden lg:block">OS.VER: 9.4.2</div>
        </div>
      </div>
    </aside>
  )
}
