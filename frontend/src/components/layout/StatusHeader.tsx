import React, { useEffect, useState } from 'react'
import { Lock, Clock } from 'lucide-react'
import { useVigilStore } from '../../store/useVigilStore'

export function StatusHeader() {
  const [time, setTime] = useState(new Date())
  const systemHealth = useVigilStore(state => state.systemHealth)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const healthColor = systemHealth < 50 ? 'text-vigil-crimson' : 'text-vigil-cyan'
  const shadowColor = systemHealth < 50 ? 'shadow-[0_0_10px_#FF3131]' : 'shadow-[0_0_10px_#00F2FF]'

  return (
    <header className="h-16 w-full border-b border-white/10 bg-vigil-bg/40 backdrop-blur-md flex items-center justify-between px-8 z-10 select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-xs font-mono tracking-widest bg-vigil-cyan/10 border border-vigil-cyan/30 px-3 py-1 rounded text-vigil-cyan">
          <Lock className="w-3 h-3 mr-2" />
          ENCRYPTED 256-BIT
        </div>
      </div>

      <div className="flex items-center space-x-8 font-mono text-sm tracking-wider">
        <div className={`flex items-center space-x-2 ${healthColor}`}>
          <div className={`w-2 h-2 rounded-full ${shadowColor} animate-pulse bg-current`} />
          <span>SYS_HEALTH: {systemHealth.toFixed(1)}%</span>
        </div>
        <div className="flex items-center text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
          <span className="text-xs ml-1 opacity-50">.{time.getMilliseconds().toString().padStart(3, '0')}</span>
        </div>
      </div>
    </header>
  )
}
