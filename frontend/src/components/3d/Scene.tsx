import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import { IntegritySphere } from './IntegritySphere'
import { NodeGrid } from './NodeGrid'

interface SceneProps {
  view: 'sphere' | 'grid'
}

export function Scene({ view }: SceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto z-0">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={50} />
        <OrbitControls enablePan={false} enableZoom={true} />
        
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <Environment preset="night" />
          {view === 'sphere' && <IntegritySphere />}
          {view === 'grid' && <NodeGrid />}
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.4} far={10} color="#00F2FF" />
        </Suspense>
      </Canvas>
    </div>
  )
}
