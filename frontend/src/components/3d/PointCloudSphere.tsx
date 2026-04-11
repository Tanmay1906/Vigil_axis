import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVigilStore } from '../../store/useVigilStore'
import * as THREE from 'three'

interface PointCloudProps {
  position?: [number, number, number]
}

export function PointCloudSphere({ position = [0, 0, 0] }: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const systemHealth = useVigilStore(state => state.systemHealth)
  
  // Crimson if health < 100, otherwise Cyan
  const isCompromised = systemHealth < 100
  const targetColor = new THREE.Color(isCompromised ? '#FF3131' : '#00F2FF')
  const materialRef = useRef<THREE.PointsMaterial>(null)

  // Generate sphere geometry vertices
  const particleCount = 4000
  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const init = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      // Golden spiral method for even distribution on a sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      
      const r = 2.0 // Radius
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      init[i * 3] = x
      init[i * 3 + 1] = y
      init[i * 3 + 2] = z
    }
    return [pos, init]
  }, [particleCount])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.1
      pointsRef.current.rotation.z += delta * 0.05
      
      const attributes = pointsRef.current.geometry.attributes
      const positionAttr = attributes.position as THREE.BufferAttribute
      
      // Vibration/Entropy based on systemHealth
      const entropyPhase = isCompromised ? 0.3 : 0.05
      const vibrationSpeed = isCompromised ? 15 : 2
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const ix = initialPositions[i3]
        const iy = initialPositions[i3 + 1]
        const iz = initialPositions[i3 + 2]
        
        // Add pseudo-random noise mapped by time
        positionAttr.array[i3] = ix + Math.sin(state.clock.elapsedTime * vibrationSpeed + ix) * entropyPhase
        positionAttr.array[i3 + 1] = iy + Math.cos(state.clock.elapsedTime * vibrationSpeed + iy) * entropyPhase
        positionAttr.array[i3 + 2] = iz + Math.sin(state.clock.elapsedTime * vibrationSpeed + iz) * entropyPhase
      }
      positionAttr.needsUpdate = true
    }
    
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.1)
    }
  })

  return (
    <points ref={pointsRef} position={new THREE.Vector3(...position)}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        ref={materialRef}
        size={0.03}
        color="#00F2FF"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
