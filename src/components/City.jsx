import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
    rand, randI, pick,
    GRID_COUNT, BLOCK_SIZE, GAP_SIZE, CELL, CITY_OFFSET,
    EDGE_COLORS, BUILDING_COLORS,
} from '../utils'

// ── Window grid on one face ─────────────────────────────────
function WindowGrid({ faceW, faceH, offsetZ, rotY, winColor }) {
    const cols = Math.floor(faceW / 1.8)
    const rows = Math.floor(faceH / 2.2)
    const wins = useMemo(() => {
        const out = []
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (Math.random() > 0.45) continue
                out.push([
                    -faceW / 2 + (c + 0.5) * (faceW / cols),
                    -faceH / 2 + (r + 0.5) * (faceH / rows) + faceH / rows * 0.1,
                ])
            }
        }
        return out
    }, [cols, rows, faceW, faceH])

    return (
        <group rotation={[0, rotY, 0]} position={[0, 0, offsetZ]}>
            {wins.map(([wx, wy], i) => (
                <mesh key={i} position={[wx, wy, 0]}>
                    <planeGeometry args={[0.35, 0.55]} />
                    <meshStandardMaterial
                        color={winColor}
                        emissive={winColor}
                        emissiveIntensity={rand(1, 3)}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ── Neon horizontal strip around building ──────────────────
function NeonStrip({ bw, bh, bd, color, yFrac }) {
    const y = bh * yFrac - bh / 2
    return (
        <group position={[0, y, 0]}>
            {/* edge lines */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(bw + 0.05, 0.12, bd + 0.05)]} />
                <lineBasicMaterial color={color} />
            </lineSegments>
            {/* emissive planes for bloom */}
            {[
                { rot: [0, 0, 0], pos: [0, 0, bd / 2 + 0.04], pw: bw },
                { rot: [0, Math.PI, 0], pos: [0, 0, -bd / 2 - 0.04], pw: bw },
                { rot: [0, Math.PI / 2, 0], pos: [bw / 2 + 0.04, 0, 0], pw: bd },
                { rot: [0, -Math.PI / 2, 0], pos: [-bw / 2 - 0.04, 0, 0], pw: bd },
            ].map(({ rot, pos, pw }, i) => (
                <mesh key={i} rotation={rot} position={pos}>
                    <planeGeometry args={[pw, 0.12]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    )
}

// ── Rooftop antenna ─────────────────────────────────────────
function Antenna({ bh }) {
    const beaconRef = useRef()
    const beaconLtRef = useRef()
    const phase = useMemo(() => Math.random() * Math.PI * 2, [])
    const speed = useMemo(() => rand(0.8, 2.5), [])
    const color = useMemo(() => pick(EDGE_COLORS), [])
    const antH = useMemo(() => rand(3, 10), [])
    const antR = useMemo(() => rand(0.04, 0.12), [])
    const hasBeacon = useMemo(() => Math.random() > 0.4, [])

    useFrame(({ clock }) => {
        const s = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * speed + phase)
        if (beaconRef.current) beaconRef.current.material.emissiveIntensity = 1 + 4 * s
        if (beaconLtRef.current) beaconLtRef.current.intensity = s * 12
    })

    return (
        <group position={[0, bh / 2, 0]}>
            <mesh position={[0, antH / 2, 0]}>
                <cylinderGeometry args={[antR * 0.3, antR, antH, 6]} />
                <meshStandardMaterial color={0x223344} metalness={0.9} roughness={0.2} />
            </mesh>
            {hasBeacon && (
                <>
                    <mesh ref={beaconRef} position={[0, antH + antR * 1.4, 0]}>
                        <sphereGeometry args={[antR * 1.4, 8, 8]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
                    </mesh>
                    <pointLight ref={beaconLtRef} color={color} intensity={8} distance={18} decay={2} position={[0, antH + antR * 1.4, 0]} />
                </>
            )}
        </group>
    )
}

// ── Single building block ───────────────────────────────────
function Building({ cx, cz }) {
    const buildCount = useMemo(() => (Math.random() > 0.7 ? randI(2, 3) : 1), [])

    const buildings = useMemo(() => {
        return Array.from({ length: buildCount }, () => {
            const bw = rand(BLOCK_SIZE * 0.3, BLOCK_SIZE * (buildCount === 1 ? 0.88 : 0.55))
            const bd = rand(BLOCK_SIZE * 0.3, BLOCK_SIZE * (buildCount === 1 ? 0.88 : 0.55))
            const bh = rand(4, 80)
            const ox = buildCount > 1 ? rand(-BLOCK_SIZE * 0.2, BLOCK_SIZE * 0.2) : 0
            const oz = buildCount > 1 ? rand(-BLOCK_SIZE * 0.2, BLOCK_SIZE * 0.2) : 0
            const color = pick(BUILDING_COLORS)
            const edgeColor = pick(EDGE_COLORS)
            const winColor = pick([0x88ccff, 0xffdd88, 0x00ffe7, 0xff88cc, 0xaaffaa])
            const antCount = Math.random() > 0.6 ? randI(1, 3) : (Math.random() > 0.5 ? 1 : 0)
            const hasNeon = bh > 15 && Math.random() > 0.35
            const hasNeon2 = bh > 30 && Math.random() > 0.5
            const hasRoof = Math.random() > 0.5
            const roofColor = pick(EDGE_COLORS)
            return { bw, bd, bh, ox, oz, color, edgeColor, winColor, antCount, hasNeon, hasNeon2, hasRoof, roofColor }
        })
    }, [buildCount])

    return (
        <>
            {buildings.map((b, i) => {
                const px = cx + b.ox
                const pz = cz + b.oz
                return (
                    <group key={i} position={[px, 0, pz]}>
                        {/* main body */}
                        <mesh position={[0, b.bh / 2, 0]} castShadow receiveShadow>
                            <boxGeometry args={[b.bw, b.bh, b.bd]} />
                            <meshStandardMaterial color={b.color} roughness={0.8} metalness={0.6} />
                        </mesh>

                        {/* windows (4 faces) */}
                        {b.bh > 8 && (
                            <group position={[0, b.bh / 2, 0]}>
                                <WindowGrid faceW={b.bw} faceH={b.bh} offsetZ={b.bd / 2 + 0.01} rotY={0} winColor={b.winColor} />
                                <WindowGrid faceW={b.bw} faceH={b.bh} offsetZ={-b.bd / 2 - 0.01} rotY={Math.PI} winColor={b.winColor} />
                                <WindowGrid faceW={b.bd} faceH={b.bh} offsetZ={b.bw / 2 + 0.01} rotY={Math.PI / 2} winColor={b.winColor} />
                                <WindowGrid faceW={b.bd} faceH={b.bh} offsetZ={-b.bw / 2 - 0.01} rotY={-Math.PI / 2} winColor={b.winColor} />
                            </group>
                        )}

                        {/* neon strip near top */}
                        {b.hasNeon && (
                            <group position={[0, b.bh / 2, 0]}>
                                <NeonStrip bw={b.bw} bh={b.bh} bd={b.bd} color={b.edgeColor} yFrac={rand(0.6, 0.95)} />
                            </group>
                        )}

                        {/* extra neon strip near base */}
                        {b.hasNeon2 && (
                            <group position={[0, b.bh * 0.1, 0]}>
                                <NeonStrip bw={b.bw} bh={b.bh * 0.2} bd={b.bd} color={pick(EDGE_COLORS)} yFrac={0.5} />
                            </group>
                        )}

                        {/* rooftop glow edge */}
                        {b.hasRoof && (
                            <group position={[0, b.bh + 0.08, 0]}>
                                <lineSegments>
                                    <edgesGeometry args={[new THREE.BoxGeometry(b.bw + 0.1, 0.15, b.bd + 0.1)]} />
                                    <lineBasicMaterial color={b.roofColor} />
                                </lineSegments>
                            </group>
                        )}

                        {/* antennas */}
                        {Array.from({ length: b.antCount }, (_, a) => (
                            <group
                                key={a}
                                position={[
                                    rand(-b.bw * 0.35, b.bw * 0.35),
                                    0,
                                    rand(-b.bd * 0.35, b.bd * 0.35),
                                ]}
                            >
                                <Antenna bh={b.bh} />
                            </group>
                        ))}
                    </group>
                )
            })}
        </>
    )
}

// ── Full city grid ──────────────────────────────────────────
export function City() {
    const blocks = useMemo(() => {
        const out = []
        for (let gx = 0; gx < GRID_COUNT; gx++) {
            for (let gz = 0; gz < GRID_COUNT; gz++) {
                if (Math.random() < 0.1) continue   // 10% plaza gaps
                out.push({
                    key: `${gx}-${gz}`,
                    cx: gx * CELL - CITY_OFFSET,
                    cz: gz * CELL - CITY_OFFSET,
                })
            }
        }
        return out
    }, [])

    return (
        <>
            {blocks.map(b => <Building key={b.key} cx={b.cx} cz={b.cz} />)}
        </>
    )
}
