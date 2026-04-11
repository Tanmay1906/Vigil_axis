import React from 'react'
import { Activity, Box, Search, ShieldAlert } from 'lucide-react'

interface SidebarProps {
  activeModule: string
  setActiveModule: (m: string) => void
}

export function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const modules = [
    { id: 'dashboard', icon: Activity, label: 'CMD_BRIDGE' },
    { id: 'evidence', icon: Search, label: 'EVIDENCE_LAB' },
    { id: 'verification', icon: ShieldAlert, label: 'VERIFICATION' },
    { id: 'ledger', icon: Box, label: 'LEDGER' }
  ]

  return (
    <aside className="w-20 lg:w-64 h-full border-r border-vigil-cyan/20 bg-vigil-bg/60 backdrop-blur-3xl flex flex-col items-center lg:items-start select-none z-10 sticky top-0 left-0">
      <div className="p-6 border-b border-vigil-cyan/10 w-full flex justify-center lg:justify-start">
        <div className="w-8 h-8 rounded-full bg-vigil-cyan shadow-[0_0_15px_#00F2FF] animate-pulse" />
        <span className="ml-4 font-bold tracking-widest text-vigil-cyan hidden lg:block">VIGIL-AXIS</span>
      </div>

      <nav className="flex-1 w-full pt-8 space-y-4 px-4">
        {modules.map(({ id, icon: Icon, label }) => {
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
              <span className="text-sm font-mono tracking-wider hidden lg:block">{label}</span>
            </button>
          )
        })}
      </nav>
      
      <div className="p-6 w-full text-center text-[10px] text-vigil-cyan/40 font-mono tracking-widest border-t border-vigil-cyan/10">
        <div className="hidden lg:block">OS.VER: 9.4.2</div>
      </div>
    </aside>
  )
}
