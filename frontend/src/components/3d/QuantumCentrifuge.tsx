import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVigilStore } from '../../store/useVigilStore'
import * as THREE from 'three'

interface QuantumCentrifugeProps {
  position?: [number, number, number]
}

export function QuantumCentrifuge({ position = [0, 0, 0] }: QuantumCentrifugeProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const isScanning = useVigilStore(state => state.isScanning)
  const systemHealth = useVigilStore(state => state.systemHealth)
  
  const particleCount = 2000
  const [positions, targetPositions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const target = new Float32Array(particleCount * 3)
    const init = new Float32Array(particleCount * 3)
    
    // Initial Cube Shape
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 2
      const y = (Math.random() - 0.5) * 2
      const z = (Math.random() - 0.5) * 2
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      init[i*3] = x; init[i*3+1] = y; init[i*3+2] = z;
      
      // Target Shattered Sphere Shape
      const r = 3 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      target[i*3] = r * Math.sin(phi) * Math.cos(theta)
      target[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      target[i*3+2] = r * Math.cos(phi)
    }
    return [pos, target, init]
  }, [particleCount])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y += delta * (isScanning ? 2 : 0.2)
    pointsRef.current.rotation.x += delta * (isScanning ? 1.5 : 0.1)

    const attributes = pointsRef.current.geometry.attributes
    const positionAttr = attributes.position as THREE.BufferAttribute
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      // If scanning, lerp towards target (shattered) shape, else lerp to original (solid)
      const targetX = isScanning ? targetPositions[i3] : initialPositions[i3]
      const targetY = isScanning ? targetPositions[i3+1] : initialPositions[i3+1]
      const targetZ = isScanning ? targetPositions[i3+2] : initialPositions[i3+2]
      
      positionAttr.array[i3] += (targetX - positionAttr.array[i3]) * 0.05
      positionAttr.array[i3+1] += (targetY - positionAttr.array[i3+1]) * 0.05
      positionAttr.array[i3+2] += (targetZ - positionAttr.array[i3+2]) * 0.05
    }
    positionAttr.needsUpdate = true
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
        size={isScanning ? 0.05 : 0.02}
        color={systemHealth < 50 ? "#FF3131" : "#00F2FF"}
        transparent
        opacity={isScanning ? 0.9 : 0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
