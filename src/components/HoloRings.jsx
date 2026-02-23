import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { rand } from '../utils'

const RING_COUNT = 4

export function HoloRings() {
    const refs = useRef([])

    const configs = useMemo(() =>
        Array.from({ length: RING_COUNT }, (_, i) => ({
            radius: 8 + i * 5,
            baseY: 30 + i * 8,
            phase: i * 0.7,
            speed: 0.3,
        })),
        [])

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        refs.current.forEach((mesh, i) => {
            if (!mesh) return
            const c = configs[i]
            mesh.position.y = c.baseY + Math.sin(t * c.speed * 0.4 + c.phase) * 3
            mesh.rotation.z = t * c.speed * 0.15
            const s = 0.5 + 0.5 * Math.sin(t * c.speed + c.phase)
            mesh.material.opacity = 0.1 + 0.2 * s
        })
    })

    return (
        <>
            {configs.map((c, i) => (
                <mesh
                    key={i}
                    ref={el => (refs.current[i] = el)}
                    position={[0, c.baseY, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <torusGeometry args={[c.radius, 0.06, 8, 80]} />
                    <meshStandardMaterial
                        color={0x00ffe7}
                        emissive={0x00ffe7}
                        emissiveIntensity={3}
                        side={2}  /* DoubleSide */
                        transparent
                        opacity={0.25}
                    />
                </mesh>
            ))}
        </>
    )
}
