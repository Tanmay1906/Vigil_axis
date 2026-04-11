import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVigilStore } from '../../store/useVigilStore'
import * as THREE from 'three'

export function IntegritySphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const systemHealth = useVigilStore(state => state.systemHealth)
  
  // Crimson if health < 50, otherwise Cyan
  const targetColor = new THREE.Color(systemHealth < 50 ? '#FF3131' : '#00F2FF')

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
      
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.color.lerp(targetColor, 0.1)
      
      // Pulse scale
      const pulseBase = systemHealth < 50 ? 1.05 : 1
      const pulseSpeed = systemHealth < 50 ? 5 : 2
      const scale = pulseBase + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.02
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 2]} />
      <meshStandardMaterial 
        wireframe
        color="#00F2FF"
        emissive="#00F2FF"
        emissiveIntensity={systemHealth < 50 ? 2 : 0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}
