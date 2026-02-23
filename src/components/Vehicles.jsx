import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { rand, pick } from '../utils'

const VEHICLE_COUNT = 18

function Vehicle({ radius, height, speed, phase, tilt }) {
    const groupRef = useRef()
    const phaseRef = useRef(phase)

    useFrame(() => {
        phaseRef.current += speed
        const p = phaseRef.current
        if (groupRef.current) {
            groupRef.current.position.set(
                Math.cos(p) * radius,
                height + Math.sin(p * 2.3) * 3,
                Math.sin(p) * radius,
            )
            groupRef.current.rotation.y = -p - Math.PI / 2
            groupRef.current.rotation.z = tilt
        }
    })

    return (
        <group ref={groupRef}>
            {/* body */}
            <mesh>
                <boxGeometry args={[2.2, 0.3, 0.7]} />
                <meshStandardMaterial color={0x334455} metalness={0.9} roughness={0.2} />
            </mesh>
            {/* port nav light */}
            <mesh position={[-1.1, 0, 0]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color={0xff2222} emissive={0xff2222} emissiveIntensity={4} />
            </mesh>
            {/* starboard nav light */}
            <mesh position={[1.1, 0, 0]}>
                <sphereGeometry args={[0.08, 6, 6]} />
                <meshStandardMaterial color={0x22aaff} emissive={0x22aaff} emissiveIntensity={4} />
            </mesh>
        </group>
    )
}

export function Vehicles() {
    const configs = useMemo(() =>
        Array.from({ length: VEHICLE_COUNT }, () => ({
            radius: rand(30, 90),
            height: rand(18, 65),
            speed: rand(0.0015, 0.004) * (Math.random() > 0.5 ? 1 : -1),
            phase: Math.random() * Math.PI * 2,
            tilt: rand(-0.1, 0.1),
        })),
        [])

    return (
        <>
            {configs.map((cfg, i) => <Vehicle key={i} {...cfg} />)}
        </>
    )
}
