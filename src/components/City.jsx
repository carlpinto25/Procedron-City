import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rand, randI, pick, EDGE_COLORS, BUILDING_COLORS } from '../utils'

//Window grid on one face — all windows merged into ONE mesh per face
function WindowGrid({ faceW, faceH, offsetZ, rotY, winColor }) {
    const geo = useMemo(() => {
        const cols = Math.floor(faceW / 1.8)
        const rows = Math.floor(faceH / 2.2)
        const WW = 0.35, WH = 0.55
        const positions = []
        const uvs = []
        const indices = []
        let vi = 0
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (Math.random() > 0.45) continue
                const wx = -faceW / 2 + (c + 0.5) * (faceW / cols)
                const wy = -faceH / 2 + (r + 0.5) * (faceH / rows) + faceH / rows * 0.1
                // Two triangles per window quad
                positions.push(
                    wx - WW / 2, wy - WH / 2, 0,
                    wx + WW / 2, wy - WH / 2, 0,
                    wx + WW / 2, wy + WH / 2, 0,
                    wx - WW / 2, wy + WH / 2, 0,
                )
                uvs.push(0, 0, 1, 0, 1, 1, 0, 1)
                indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3)
                vi += 4
            }
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        g.setIndex(indices)
        g.computeVertexNormals()
        return g
    }, [faceW, faceH])

    const mat = useMemo(() => new THREE.MeshStandardMaterial({
        color: winColor,
        emissive: winColor,
        emissiveIntensity: rand(1, 3),
    }), [winColor])

    if (!geo.index || geo.index.count === 0) return null
    return (
        <mesh geometry={geo} material={mat} rotation={[0, rotY, 0]} position={[0, 0, offsetZ]} />
    )
}

//Neon horizontal strip around building
function NeonStrip({ bw, bh, bd, color, yFrac }) {
    const y = bh * yFrac - bh / 2
    return (
        <group position={[0, y, 0]}>
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(bw + 0.05, 0.12, bd + 0.05)]} />
                <lineBasicMaterial color={color} />
            </lineSegments>
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

//Rooftop antenna — static, no per-frame callbacks
function Antenna({ bh }) {
    const color = useMemo(() => pick(EDGE_COLORS), [])
    const antH = useMemo(() => rand(3, 10), [])
    const antR = useMemo(() => rand(0.04, 0.12), [])
    const hasBeacon = useMemo(() => Math.random() > 0.4, [])
    const emissive = useMemo(() => rand(2, 5), [])

    return (
        <group position={[0, bh / 2, 0]}>
            <mesh position={[0, antH / 2, 0]}>
                <cylinderGeometry args={[antR * 0.3, antR, antH, 6]} />
                <meshStandardMaterial color={0x223344} metalness={0.9} roughness={0.2} />
            </mesh>
            {hasBeacon && (
                <mesh position={[0, antH + antR * 1.4, 0]}>
                    <sphereGeometry args={[antR * 1.4, 8, 8]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} />
                </mesh>
            )}
        </group>
    )
}

//Single building
function Building({ x, z, heightScale = 1, rotY = 0 }) {
    const buildCount = useMemo(() => (Math.random() > 0.75 ? randI(2, 3) : 1), [])
    // BASE controls the maximum footprint per slot.
    // Must stay well inside the minimum cluster spacing so buildings never touch.
    const BASE = 10
    // Multi-building slots: place buildings at fixed cardinal offsets so they
    // can never overlap regardless of their individual dimensions.
    const MULTI_OFFSET = BASE * 0.42  // guaranteed clear separation

    const buildings = useMemo(() => {
        // Pre-compute offsets for multi-building layouts
        const offsets = buildCount === 1
            ? [{ ox: 0, oz: 0 }]
            : buildCount === 2
                ? [{ ox: -MULTI_OFFSET, oz: 0 }, { ox: MULTI_OFFSET, oz: 0 }]
                : [
                    { ox: -MULTI_OFFSET, oz: -MULTI_OFFSET * 0.6 },
                    { ox: MULTI_OFFSET, oz: -MULTI_OFFSET * 0.6 },
                    { ox: 0, oz: MULTI_OFFSET },
                ]
        const singleMaxFrac = 0.72   // single building max = 7.2 units
        const multiMaxFrac = 0.34   // multi building max  = 3.4 units, well within MULTI_OFFSET

        return offsets.map(({ ox, oz }) => {
            const maxFrac = buildCount === 1 ? singleMaxFrac : multiMaxFrac
            // Doubled minimums: 80% of BASE size and 24 min height
            const bw = rand(BASE * 0.80, BASE * maxFrac)
            const bd = rand(BASE * 0.80, BASE * maxFrac)
            const bh = rand(24, 75) * heightScale
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
    }, [buildCount, heightScale])

    return (
        <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
            {buildings.map((b, i) => (
                <group key={i} position={[b.ox, 0, b.oz]}>
                    {/* main body */}
                    <mesh position={[0, b.bh / 2, 0]}>
                        <boxGeometry args={[b.bw, b.bh, b.bd]} />
                        <meshStandardMaterial color={b.color} roughness={0.8} metalness={0.6} />
                    </mesh>

                    {/* windows */}
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
                        <group key={a} position={[rand(-b.bw * 0.35, b.bw * 0.35), 0, rand(-b.bd * 0.35, b.bd * 0.35)]}>
                            <Antenna bh={b.bh} />
                        </group>
                    ))}
                </group>
            ))}
        </group>
    )
}

// ── Generate all building positions via clusters ────────────
function generateCityLayout() {
    const buildings = []

    // Hand-crafted cluster seed positions spread across the scene,
    // intentionally non-uniform with varied gaps between them.
    const clusterSeeds = [
        // Central downtown — dense, tall
        { cx: 0, cz: 0, cols: 6, rows: 7, spacing: 22, heightScale: 1.6, density: 0.92 },
        // Midtown north
        { cx: -20, cz: -110, cols: 5, rows: 4, spacing: 20, heightScale: 1.2, density: 0.85 },
        // East side commercial
        { cx: 110, cz: 10, cols: 4, rows: 6, spacing: 21, heightScale: 1.0, density: 0.80 },
        // West industrial
        { cx: -115, cz: 20, cols: 5, rows: 5, spacing: 24, heightScale: 0.7, density: 0.75 },
        // South-east suburb
        { cx: 90, cz: 110, cols: 4, rows: 4, spacing: 19, heightScale: 0.6, density: 0.65 },
        // South-west suburb
        { cx: -85, cz: 105, cols: 4, rows: 3, spacing: 20, heightScale: 0.55, density: 0.60 },
        // Far north tech park
        { cx: 30, cz: -160, cols: 5, rows: 3, spacing: 22, heightScale: 0.9, density: 0.70 },
        // North-east cluster
        { cx: 115, cz: -90, cols: 3, rows: 4, spacing: 20, heightScale: 0.85, density: 0.75 },
        // North-west loft district
        { cx: -110, cz: -85, cols: 3, rows: 3, spacing: 21, heightScale: 1.1, density: 0.72 },
        // Far east scatter
        { cx: 175, cz: 40, cols: 2, rows: 5, spacing: 23, heightScale: 0.65, density: 0.60 },
        // Far south strip
        { cx: 10, cz: 175, cols: 7, rows: 2, spacing: 22, heightScale: 0.5, density: 0.65 },
        // Small outlier pocket west
        { cx: -175, cz: -30, cols: 2, rows: 3, spacing: 22, heightScale: 0.8, density: 0.68 },
        // Small outlier pocket south-east
        { cx: 155, cz: -155, cols: 2, rows: 2, spacing: 20, heightScale: 0.9, density: 0.60 },
        // Far north-west scatter
        { cx: -145, cz: -150, cols: 3, rows: 2, spacing: 21, heightScale: 0.7, density: 0.55 },
    ]

    clusterSeeds.forEach((seed, si) => {
        const { cx, cz, cols, rows, spacing, heightScale, density } = seed

        // Centre the cluster around its seed point
        const w = (cols - 1) * spacing
        const h = (rows - 1) * spacing

        // Each cluster gets a slight overall tilt so streets feel angled
        const clusterRotY = rand(-0.18, 0.18)

        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                // Probabilistic skip — trims corners unevenly for irregular edges
                if (Math.random() > density) continue

                // Grid position within cluster
                const lx = col * spacing - w / 2
                const lz = row * spacing - h / 2

                // Apply cluster rotation (in cluster local space)
                const cosR = Math.cos(clusterRotY)
                const sinR = Math.sin(clusterRotY)
                const rx = lx * cosR - lz * sinR
                const rz = lx * sinR + lz * cosR

                // Per-building position jitter — capped at 8% of spacing so
                // buildings from adjacent cells can never reach each other.
                const jx = rand(-spacing * 0.08, spacing * 0.08)
                const jz = rand(-spacing * 0.08, spacing * 0.08)

                // Per-building slight rotation (up to ~10°)
                const rotY = clusterRotY + rand(-0.17, 0.17)

                buildings.push({
                    key: `${si}-${col}-${row}`,
                    x: cx + rx + jx,
                    z: cz + rz + jz,
                    heightScale,
                    rotY,
                })
            }
        }
    })

    return buildings
}

// ── City ────────────────────────────────────────────────────
export function City() {
    const buildings = useMemo(() => generateCityLayout(), [])

    return (
        <>
            {buildings.map(b => (
                <Building key={b.key} x={b.x} z={b.z} heightScale={b.heightScale} rotY={b.rotY} />
            ))}
        </>
    )
}
