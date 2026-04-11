import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useBlockchain } from '../../hooks/useBlockchain'

export function NodeGrid() {
  const { blocks } = useBlockchain()
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += delta * 0.5
      if (groupRef.current.position.z > 2) {
        groupRef.current.position.z = 0
      }
    }
  })

  return (
    <group ref={groupRef}>
      {blocks.map((block, i) => (
        <NodeCube 
          key={block.id} 
          position={new THREE.Vector3((i % 3) * 2 - 2, Math.floor(i / 3) * 2 - 2, -i * 2)} 
          data={block}
        />
      ))}
    </group>
  )
}

function NodeCube({ position, data }: { position: THREE.Vector3, data: any }) {
  const [hovered, setHovered] = useState(false)

  return (
    <mesh 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshPhysicalMaterial 
        color={hovered ? '#7000FF' : 'rgba(255,255,255,0.1)'}
        transmission={0.9}
        opacity={1}
        metalness={0.2}
        roughness={0.1}
        ior={1.5}
        clearcoat={1}
      />
      {hovered && (
        <Html center position={[0, 0.6, 0]} className="pointer-events-none">
          <div className="bg-vigil-bg/90 border border-vigil-cyan/50 text-vigil-cyan text-xs p-1 rounded font-mono w-40 text-center backdrop-blur-md">
            <div>{data.type}</div>
            <div className="opacity-50 text-[8px] truncate">{data.hash}</div>
          </div>
        </Html>
      )}
    </mesh>
  )
}
