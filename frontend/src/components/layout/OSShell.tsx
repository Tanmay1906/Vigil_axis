import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { StatusHeader } from './StatusHeader'
import { MainScene } from '../3d/MainScene'

interface OSShellProps {
  children: (activeModule: string) => React.ReactNode
}

export function OSShell({ children }: OSShellProps) {
  const [activeModule, setActiveModule] = useState('dashboard')

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans bg-transparent relative">
      
      {/* SVG Grain Filter Definition */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
        </filter>
      </svg>
      {/* SVG Grain Overlay - 2% Digital Noise */}
      <div className="pointer-events-none absolute inset-0 z-50 w-full h-full mix-blend-overlay opacity-[0.02]" style={{ filter: 'url(#noiseFilter)' }} />

      {/* Global CRT Overlay Line */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden mix-blend-screen opacity-[0.02]">
        <div className="w-full h-8 bg-white animate-scanline shadow-[0_0_20px_white]" />
      </div>

      {/* Background R3F Spatial Scene */}
      <MainScene activeModule={activeModule} />
      
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      <div className="flex-1 flex flex-col relative z-20 w-full h-full pointer-events-none">
        <div className="pointer-events-auto">
          <StatusHeader />
        </div>
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto pointer-events-auto relative scroll-smooth flex flex-col">
          <div className="max-w-7xl mx-auto h-full flex-1 w-full">
            {children(activeModule)}
          </div>
          
          {/* Global Legal Footer */}
          <footer className="w-full flex justify-center mt-auto pt-6 pb-2">
            <div className="text-[10px] font-mono tracking-[0.2em] text-vigil-cyan animate-dim-pulse border-t border-vigil-cyan/10 pt-2 px-8">
              BSA_2026_COMPLIANT // SEC_63(4)_VERIFIED
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
