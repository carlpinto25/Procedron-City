import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rand, pick } from '../utils'

const COUNT = 800
const P_COLORS = [[0, 1, 0.9], [1, 0, 0.8], [0.2, 0.6, 1], [1, 0.4, 0]]

export function Particles() {
    const pointsRef = useRef()

    const { geo, velocities } = useMemo(() => {
        const positions = new Float32Array(COUNT * 3)
        const colors = new Float32Array(COUNT * 3)
        const velocities = new Float32Array(COUNT)

        for (let i = 0; i < COUNT; i++) {
            const r = rand(10, 90)
            const a = Math.random() * Math.PI * 2
            positions[i * 3] = Math.cos(a) * r
            positions[i * 3 + 1] = rand(0, 70)
            positions[i * 3 + 2] = Math.sin(a) * r
            velocities[i] = rand(0.02, 0.09)
            const c = pick(P_COLORS)
            colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2]
        }

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        return { geo, velocities }
    }, [])

    useFrame(() => {
        const attr = geo.attributes.position
        for (let i = 0; i < COUNT; i++) {
            const y = attr.getY(i) + velocities[i] * 0.4
            attr.setY(i, y > 80 ? 0 : y)
        }
        attr.needsUpdate = true
    })

    return (
        <points ref={pointsRef} geometry={geo}>
            <pointsMaterial
                size={0.18}
                vertexColors
                sizeAttenuation
                transparent
                opacity={0.6}
            />
        </points>
    )
}
