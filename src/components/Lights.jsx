import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const NEON_COLORS = [0x00ffe7, 0xff00cc, 0xff6600, 0x3399ff]

export function Lights() {
    const refs = useRef([])

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        refs.current.forEach((light, i) => {
            if (light) light.intensity = 80 + 50 * Math.sin(t * 0.7 + i * 1.3)
        })
    })

    return (
        <>
            <ambientLight color={0x0a111f} intensity={6} />
            <directionalLight
                color={0x4488bb}
                intensity={1.8}
                position={[60, 120, 40]}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={10}
                shadow-camera-far={400}
                shadow-camera-left={-180}
                shadow-camera-right={180}
                shadow-camera-top={180}
                shadow-camera-bottom={-180}
            />
            {NEON_COLORS.map((col, i) => {
                const angle = (i / NEON_COLORS.length) * Math.PI * 2
                return (
                    <pointLight
                        key={i}
                        ref={el => (refs.current[i] = el)}
                        color={col}
                        intensity={120}
                        distance={120}
                        decay={2}
                        position={[Math.cos(angle) * 50, 18, Math.sin(angle) * 50]}
                    />
                )
            })}
        </>
    )
}
