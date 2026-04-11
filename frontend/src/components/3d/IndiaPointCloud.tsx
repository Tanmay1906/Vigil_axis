import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, QuadraticBezierLine } from '@react-three/drei'
import { useVigilStore } from '../../store/useVigilStore'
import * as THREE from 'three'

interface PointCloudProps {
  position?: [number, number, number]
}

// Rough approximation of India's border using Lat/Long
const INDIA_POLYGON = [
  [74.0, 37.0], [77.5, 34.0], [79.5, 30.5], [89.0, 27.5], [97.0, 28.0], 
  [93.0, 24.0], [88.0, 22.0], [85.0, 20.0], [80.0, 15.0], [78.0, 8.0], 
  [76.0, 8.0], [75.0, 13.0], [72.5, 19.0], [68.0, 23.0], [71.0, 28.0], 
  [74.5, 31.0]
]

// Target Nodes
const NODES = {
  DELHI: [77.2, 28.6],
  KOLKATA: [88.3, 22.5],
  MUMBAI: [72.8, 19.0],
  BENGALURU: [77.5, 12.9]
}

// Map Lat/Lon to 3D space
function latLonToVector([lon, lat]: number[]): THREE.Vector3 {
  const x = (lon - 82.5) * 0.2
  const y = (lat - 22.5) * 0.2
  return new THREE.Vector3(x, y, 0)
}

function pointInPolygon(point: number[], vs: number[][]) {
  let x = point[0], y = point[1]
  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1]
    let xj = vs[j][0], yj = vs[j][1]
    let intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function IndiaPointCloud({ position = [0, 0, 0] }: PointCloudProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const systemHealth = useVigilStore(state => state.systemHealth)
  
  const isCompromised = systemHealth < 100

  const particleCount = 10000
  const [positions, initialPositions, nodeIndices] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const init = new Float32Array(particleCount * 3)
    const nodes: number[] = []

    let i = 0
    while (i < particleCount) {
      const lon = 68.0 + Math.random() * (97.0 - 68.0)
      const lat = 8.0 + Math.random() * (37.0 - 8.0)

      if (pointInPolygon([lon, lat], INDIA_POLYGON)) {
        const v = latLonToVector([lon, lat])
        const z = (Math.random() - 0.5) * 0.8
        
        pos[i * 3] = v.x
        pos[i * 3 + 1] = v.y
        pos[i * 3 + 2] = z
        init[i * 3] = v.x
        init[i * 3 + 1] = v.y
        init[i * 3 + 2] = z

        for (const coord of Object.values(NODES)) {
          if (Math.abs(lon - coord[0]) < 1.0 && Math.abs(lat - coord[1]) < 1.0) {
            if (Math.random() > 0.8) nodes.push(i)
          }
        }
        i++
      }
    }
    return [pos, init, nodes]
  }, [particleCount])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.15
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
    }

    if (pointsRef.current) {
      const attributes = pointsRef.current.geometry.attributes
      const positionAttr = attributes.position as THREE.BufferAttribute
      const colorAttr = attributes.color as THREE.BufferAttribute

      const entropyPhase = isCompromised ? 0.2 : 0.02
      const vibrationSpeed = isCompromised ? 15 : 2
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const ix = initialPositions[i3]
        const iy = initialPositions[i3 + 1]
        const iz = initialPositions[i3 + 2]
        
        positionAttr.array[i3] = ix + Math.sin(state.clock.elapsedTime * vibrationSpeed + ix) * entropyPhase
        positionAttr.array[i3 + 1] = iy + Math.cos(state.clock.elapsedTime * vibrationSpeed + iy) * entropyPhase
        positionAttr.array[i3 + 2] = iz + Math.sin(state.clock.elapsedTime * vibrationSpeed + iz) * entropyPhase

        if (colorAttr) {
          if (nodeIndices.includes(i)) {
            const pulse = (Math.sin(state.clock.elapsedTime * 5 + ix) + 1) / 2
            if (isCompromised) {
              colorAttr.array[i3] = 1.0
              colorAttr.array[i3 + 1] = 0.19 * pulse
              colorAttr.array[i3 + 2] = 0.19 * pulse
            } else {
              colorAttr.array[i3] = 0.0
              colorAttr.array[i3 + 1] = 0.95 * pulse
              colorAttr.array[i3 + 2] = 1.0 * pulse
            }
          } else {
            if (isCompromised) {
              colorAttr.array[i3] = 0.5
              colorAttr.array[i3 + 1] = 0.05
              colorAttr.array[i3 + 2] = 0.05
            } else {
              colorAttr.array[i3] = 0.0
              colorAttr.array[i3 + 1] = 0.3
              colorAttr.array[i3 + 2] = 0.4
            }
          }
        }
      }
      positionAttr.needsUpdate = true
      if (colorAttr) colorAttr.needsUpdate = true
    }
  })

  const colors = useMemo(() => new Float32Array(particleCount * 3), [particleCount])

  // Map to Vector3s
  const nodeVectors = {
    DELHI: latLonToVector(NODES.DELHI),
    KOLKATA: latLonToVector(NODES.KOLKATA),
    MUMBAI: latLonToVector(NODES.MUMBAI),
    BENGALURU: latLonToVector(NODES.BENGALURU),
  }

  // Generate glowing arcing lines
  const arcs = [
    { start: nodeVectors.DELHI, end: nodeVectors.KOLKATA },
    { start: nodeVectors.KOLKATA, end: nodeVectors.BENGALURU },
    { start: nodeVectors.BENGALURU, end: nodeVectors.MUMBAI },
    { start: nodeVectors.MUMBAI, end: nodeVectors.DELHI },
    { start: nodeVectors.DELHI, end: nodeVectors.BENGALURU },
  ]

  return (
    <group ref={groupRef} position={new THREE.Vector3(...position)} scale={1.2}>
      {/* City Markers */}
      {Object.entries(nodeVectors).map(([name, vec]) => (
        <Html key={name} position={[vec.x, vec.y, 0]} center className="pointer-events-none">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-[#00f2ff] rounded-full shadow-[0_0_10px_#00f2ff] animate-ping" />
            <div className="text-[9px] font-mono tracking-widest text-white drop-shadow-[0_0_5px_#00f2ff]">
              {name === 'BENGALURU' ? 'Bengaluru' : name === 'DELHI' ? 'New Delhi' : name.charAt(0) + name.slice(1).toLowerCase()}
            </div>
          </div>
        </Html>
      ))}

      {/* Connection Arcs */}
      {arcs.map((arc, i) => {
        // Find a mid point and push it "out" for a 3D arc effect
        const mid = new THREE.Vector3().addVectors(arc.start, arc.end).multiplyScalar(0.5)
        mid.z += 0.5 + Math.random() * 0.3 // Arc bulge
        
        return (
          <QuadraticBezierLine
            key={i}
            start={arc.start}
            end={arc.end}
            mid={mid}
            color="#00f2ff"
            lineWidth={0.5}
            dashed={false}
            transparent
            opacity={0.3}
          />
        )
      })}

      {/* Kolkata Annotation Box */}
      <Html position={[nodeVectors.KOLKATA.x + 0.5, nodeVectors.KOLKATA.y - 0.5, 0]} className="pointer-events-none">
        <div className="w-48 border border-[#00f2ff]/30 bg-[#001f26]/80 backdrop-blur-md p-2 rounded relative">
          {/* Connector line from Kolkata */}
          <div className="absolute top-0 -left-6 w-6 h-[1px] bg-[#00f2ff]/50 transform -translate-y-4 -rotate-12 border-b border-[#00f2ff]/20"></div>
          <div className="text-[10px] font-sans text-gray-300 leading-tight">
            Global 0.02 opacity CRT scanline overlay &/ fine digital noise mission-critical monitor
          </div>
        </div>
      </Html>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute 
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          ref={materialRef}
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
