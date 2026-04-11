import { useEffect, useRef, useState } from 'react'
import { useVigilStore } from '../../store/useVigilStore'
import { motion, AnimatePresence } from 'framer-motion'

export function Dashboard() {
  const systemHealth = useVigilStore(state => state.systemHealth)
  const evidenceLog = useVigilStore(state => state.evidenceLog)
  const logEndRef = useRef<HTMLDivElement>(null)
  
  // Tactical HUD Simulation Data
  const [ramFeeds, setRamFeeds] = useState<string[]>([])
  
  // Auto-scroll logic
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [evidenceLog])

  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = ['DEL', 'MUM', 'BEN', 'KOL']
      const node = nodes[Math.floor(Math.random() * nodes.length)]
      const seq = Math.floor(Math.random() * 99).toString().padStart(2, '0')
      const ptr = '0x' + Math.random().toString(16).slice(2, 10).toUpperCase()
      const newFeed = `[${node}_NODE] 14:22:${seq} - CHAIN_SYNC: Verifying ${ptr}...`
      
      setRamFeeds(prev => {
        const next = [...prev, newFeed]
        if (next.length > 20) return next.slice(next.length - 20)
        return next
      })
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full w-full pointer-events-none relative z-10 font-sans p-6 text-white overflow-hidden">
      
      {/* CRT Grid / Scanline overlay overall */}
      <div className="absolute inset-0 z-[-1] opacity-10 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] mix-blend-overlay"></div>
      <div className="absolute inset-0 z-[-1] opacity-20 bg-[radial-gradient(circle_at_center,theme(colors.black/0),theme(colors.black)_120%)]"></div>

      {/* Grid Layout Container */}
      <div className="grid grid-cols-12 h-full gap-4">
        
        {/* LEFT COLUMN */}
        <div className="col-span-3 flex flex-col space-y-6 pointer-events-auto h-full justify-start pb-10">
          
          <h1 className="text-3xl font-bold tracking-widest text-[#9ae9f9] drop-shadow-[0_0_15px_rgba(0,242,255,0.7)] pt-4 uppercase">
            VIGIL-AXIS CMD_BRIDGE
          </h1>

          {/* Active Investigations */}
          <GlassPanel className="h-64 flex flex-col">
            <h2 className="text-xs tracking-widest text-[#00f2ff]/80 uppercase px-4 pt-4 mb-2">Active Investigations: 14</h2>
            <div className="text-[10px] text-gray-400 mb-2 px-4 uppercase">Prioritized Case IDs</div>
            <div className="flex-1 overflow-auto px-4 pb-4 space-y-1">
               {['#BX-990-ALPHA', '#RX-202-OMEGA', '#NC-404-EPSILON', '#VX-900-DELTA', '#TX-101-SIGMA'].map((caseId, idx) => (
                  <div key={idx} className={`text-xs py-2 px-3 border border-[#00f2ff]/20 bg-[#00f2ff]/5 hover:bg-[#00f2ff]/20 cursor-pointer transition-colors ${idx === 1 ? 'border-[#00f2ff]/60 bg-[#00f2ff]/10 text-white' : 'text-[#00f2ff]/70'}`}>
                    Prioritized Case ID {caseId}
                  </div>
               ))}
            </div>
          </GlassPanel>

          {/* System Entropy */}
          <GlassPanel className="h-40 flex flex-col relative w-4/5">
            <h2 className="text-xs font-bold tracking-widest text-white px-4 pt-4 uppercase">SYSTEM ENTROPY</h2>
            <div className="flex items-end flex-1 px-4 pb-4">
              <div className="w-full h-16 relative border-l border-b border-[#00f2ff]/30">
                 {/* Decorative Line Chart */}
                 <svg className="w-full h-full absolute inset-0 text-[#00f2ff]" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,80 L10,75 L20,90 L30,60 L40,65 L45,20 L50,80 L60,70 L70,50 L80,60 L90,85 L100,50" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_5px_rgba(0,242,255,0.8)]" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#FF0055" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                 </svg>
              </div>
            </div>
            <div className="flex justify-between text-[10px] px-4 pb-3">
               <div>Current Entropy: <span className="text-white font-bold text-xs pl-1">14.3</span></div>
               <div>Threshold: <span className="text-[#FF0055] font-bold text-xs pl-1">20.0</span></div>
            </div>
          </GlassPanel>

          {/* Network Latency */}
          <GlassPanel className="flex flex-col h-36 w-3/4">
            <h2 className="text-xs tracking-widest text-[#00f2ff] px-4 pt-3 uppercase">NETWORK LATENCY</h2>
            <div className="text-[9px] text-[#00f2ff]/60 px-4 mb-2">Global network status</div>
            <div className="flex-1 px-4 relative flex justify-center items-center opacity-70 border-b border-[#00f2ff]/20">
               {/* Crude World Map SVG approximation */}
               <svg viewBox="0 0 100 50" className="w-full h-12 text-[#00f2ff]/50" fill="currentColor">
                  <path d="M10,20 Q15,10 25,15 T40,25 Q45,20 50,30 T75,10 Q85,5 95,20 T80,45 Q60,35 45,40 T30,30 Z" opacity="0.2"/>
                  <circle cx="20" cy="18" r="1.5" fill="#00f2ff" />
                  <circle cx="45" cy="25" r="1.5" fill="#00f2ff" />
                  <circle cx="75" cy="15" r="1.5" fill="#00f2ff" />
               </svg>
            </div>
            <div className="text-[10px] px-4 py-3 flex text-[#00f2ff]">
              Avg Latency: <span className="text-white font-bold text-xs pl-2">45ms</span>
            </div>
          </GlassPanel>

        </div>

        {/* CENTER COLUMN (spacer for 3D view) */}
        <div className="col-span-4 lg:col-span-6 pointer-events-none" />

        {/* RIGHT COLUMN */}
        <div className="col-span-5 lg:col-span-3 flex flex-col space-y-6 pointer-events-auto h-full justify-between pb-10">
          
          <div className="flex flex-col items-end pt-8">
            {/* System Health Pulse */}
            <GlassPanel className="h-28 w-full">
              <h2 className="text-xs tracking-widest text-white px-4 pt-3 uppercase">SYSTEM HEALTH PULSE</h2>
              <div className="relative h-12 w-full px-4 overflow-hidden my-1">
                 <svg className="w-full h-full text-[#00f2ff]" preserveAspectRatio="none" viewBox="0 0 200 40">
                    <path d="M0,20 L50,20 L55,5 L60,35 L65,15 L70,20 L150,20 L155,5 L160,35 L165,15 L170,20 L200,20" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_5px_rgba(0,242,255,0.8)] pulse-anim" />
                 </svg>
              </div>
              <div className="flex justify-between px-4 pb-3">
                 <div className="text-[10px] text-[#00f2ff]">Node Integrity: <span className="text-white font-bold text-xs">98.7%</span></div>
                 <div className="text-[10px] text-[#00f2ff]">Session Uptime: <span className="text-white font-bold text-xs">14D 03H 22M</span></div>
              </div>
            </GlassPanel>
          </div>

          <div className="flex-1" />

          {/* Live Artifact Ticker */}
          <GlassPanel className="h-44 flex flex-col w-[110%] -ml-10">
            <div className="p-3 bg-black/40 border-b border-[#00f2ff]/20 text-[10px] tracking-widest text-white/90">
              LIVE ARTIFACT TICKER
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[9px] tracking-wider relative flex flex-col justify-end">
              <AnimatePresence mode="popLayout">
                {ramFeeds.slice(-5).map((feed, i) => (
                  <motion.div
                    key={feed + i}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[#00f2ff]/80 flex"
                  >
                    <span className="w-1 bg-[#00f2ff] mr-2 shadow-[0_0_5px_#00f2ff]" />
                    {feed}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassPanel>

        </div>

      </div>

      {/* FOOTER */}
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-auto">
         <div className="inline-block border-t border-[#00f2ff]/30 pt-2 text-[10px] tracking-[0.2em] font-mono text-[#00f2ff]/70">
            COMPLIANCE_MODE: <span className="text-[#00f2ff] font-bold">BSA_2026_ACTIVE</span> // ON-CHAIN_VERIFICATION: <span className="text-[#00f2ff] font-bold">SECURE</span>
         </div>
      </div>

    </div>
  )
}

function GlassPanel({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`border border-[#00f2ff]/20 bg-gradient-to-br from-[#021014]/80 to-[#001f26]/80 backdrop-blur-md rounded shadow-[0_0_30px_rgba(0,0,0,0.8)] shadow-inner drop-shadow-[0_0_10px_rgba(0,100,150,0.1)] relative overflow-hidden ${className}`}>
      {/* Glossy top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff]/40 to-transparent"></div>
      {children}
    </div>
  )
}
