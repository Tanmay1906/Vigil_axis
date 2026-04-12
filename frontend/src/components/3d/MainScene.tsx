import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'

import { IndiaPointCloud } from './IndiaPointCloud'
import { LedgerChain } from './LedgerChain'
import { QuantumCentrifuge } from './QuantumCentrifuge'

interface MainSceneProps {
  activeModule: string
}

export function MainScene({ activeModule }: MainSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none z-0">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={60} />
        <OrbitControls enablePan={false} enableZoom={true} enableRotate={activeModule !== 'dashboard'} />
        
        <ambientLight intensity={0.1} />
        <spotLight position={[5, 10, 5]} angle={0.2} penumbra={1} intensity={2} />
        <spotLight position={[-5, -10, -5]} angle={0.2} penumbra={1} intensity={1} color="#7000FF" />
        
        <Suspense fallback={null}>
          <Environment preset="night" />
          
          {/* Spatial Transitions based on Module */}
          {/* Keep dashboard background clear behind Evidence Register. */}
          {activeModule === 'dashboard' && null}
          {activeModule === 'ledger' && <LedgerChain />}
          {activeModule === 'evidence' && <QuantumCentrifuge />}
          
          <ContactShadows resolution={1024} scale={30} blur={3} opacity={0.3} far={15} color="#00F2FF" position={[0, -2.5, 0]} />
          
          {/* Removed EffectComposer to prevent postprocessing hook crashes */}
        </Suspense>
      </Canvas>
    </div>
  )
}
