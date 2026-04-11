import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion as motion3d } from 'framer-motion-3d'
import { motion as motion2d } from 'framer-motion'
import { useBlockchain, BlockchainBlock } from '../../hooks/useBlockchain'
import { ShieldCheck } from 'lucide-react'

export function LedgerChain() {
  const { blocks } = useBlockchain()
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} position={[0, -0.5, -2]}>
      {blocks.map((block, i) => (
        <LedgerBlock 
          key={block.id} 
          data={block} 
          // Stacking deeply into the Z space for Infinite Chain effect
          position={new THREE.Vector3(
            Math.sin(i * 0.5) * 1.5,     // Slight winding X
            Math.cos(i * 0.3) * 0.5,     // Slight bobbing Y
            -i * 2                       // Extending deeply Z
          )} 
        />
      ))}
    </group>
  )
}

function LedgerBlock({ position, data }: { position: THREE.Vector3, data: BlockchainBlock }) {
  const [hovered, setHovered] = useState(false)

  // Subdued floating logic
  const yOffset = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(() => {
     // Frame logic for continuous gentle movement can go here if needed.
  })

  return (
    <motion3d.mesh 
      position={[position.x, position.y, position.z]}
      animate={{ 
        y: position.y + (hovered ? 0.5 : Math.sin(Date.now() / 2000 + yOffset) * 0.2),
        scale: hovered ? 1.2 : 1,
        rotateY: hovered ? Math.PI / 8 : 0,
        rotateX: hovered ? -Math.PI / 16 : 0
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1.5, 0.8, 0.5]} />
      <meshPhysicalMaterial 
        color={hovered ? '#00F2FF' : 'rgba(0, 242, 255, 0.1)'}
        transmission={0.95}
        opacity={1}
        metalness={0.9}
        roughness={0.05}
        ior={2.5}
        thickness={1.5}
        envMapIntensity={2.0}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
      
      {/* Laser Glass Edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 0.8, 0.5)]} />
        <lineBasicMaterial color={hovered ? "#ffffff" : "#00F2FF"} transparent opacity={hovered ? 0.8 : 0.2} />
      </lineSegments>

      {/* Floating BSA Hologram HUD */}
      <Html center position={[0, 0, 0.3]} zIndexRange={[100, 0]} className="pointer-events-none">
        <motion2d.div 
          animate={{ opacity: hovered ? 1 : 0.6, scale: hovered ? 1.1 : 1 }}
          className="flex flex-col items-center justify-center w-48 font-mono"
        >
          {/* BSA Seal */}
          <div className={`p-1 rounded-full border mb-1 flex items-center justify-center transition-colors ${hovered ? 'bg-vigil-cyan/20 border-vigil-cyan text-vigil-cyan shadow-[0_0_15px_#00F2FF]' : 'bg-black/40 border-vigil-cyan/30 text-vigil-cyan/50 backdrop-blur-md'}`}>
            <ShieldCheck className="w-3 h-3" />
          </div>
          
          {/* Block Data */}
          <div className={`text-center glass-panel bg-black/60 border ${hovered ? 'border-vigil-cyan/50 shadow-[0_0_20px_#00F2FF]' : 'border-vigil-cyan/10'} p-2 w-full`}>
            <div className="text-[8px] text-white/50 mb-1">BSA_2026_SEAL</div>
            <div className={`text-[9px] truncate tracking-wider ${hovered ? 'text-white' : 'text-vigil-cyan/70'}`}>
              {data.hash.slice(0, 16)}...
            </div>
            {hovered && (
              <motion2d.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 pt-2 border-t border-vigil-cyan/30 text-[8px] text-vigil-amethyst"
              >
                META: {data.metadata}<br/>
                TS: {new Date(data.timestamp).toISOString().split('T')[1]}
              </motion2d.div>
            )}
          </div>
        </motion2d.div>
      </Html>
    </motion3d.mesh>
  )
}
