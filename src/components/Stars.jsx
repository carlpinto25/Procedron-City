import { useMemo } from 'react'
import * as THREE from 'three'
import { rand, pick } from '../utils'

const STAR_COUNT = 2000
const STAR_COLORS = [[0.6, 0.8, 1], [1, 0.9, 0.8], [0.8, 0.6, 1], [0.5, 1, 0.9]]

export function Stars() {
    const { positions, colors } = useMemo(() => {
        const positions = new Float32Array(STAR_COUNT * 3)
        const colors = new Float32Array(STAR_COUNT * 3)
        for (let i = 0; i < STAR_COUNT; i++) {
            const theta = Math.acos(2 * Math.random() - 1)
            const phi = Math.random() * Math.PI * 2
            const r = rand(350, 500)
            positions[i * 3] = r * Math.sin(theta) * Math.cos(phi)
            positions[i * 3 + 1] = Math.abs(r * Math.cos(theta)) + 20
            positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi)
            const c = pick(STAR_COLORS)
            colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2]
        }
        return { positions, colors }
    }, [])

    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        return g
    }, [positions, colors])

    return (
        <points geometry={geo}>
            <pointsMaterial size={0.45} vertexColors sizeAttenuation />
        </points>
    )
}
