import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Color, FogExp2 } from 'three'

import { City } from './components/City'
import { Ground } from './components/Ground'
import { Stars } from './components/Stars'
import { Particles } from './components/Particles'
import { Vehicles } from './components/Vehicles'
import { HoloRings } from './components/HoloRings'
import { Lights } from './components/Lights'
import { HUD } from './components/HUD'

export default function App() {
    useEffect(() => {
        const percentEl = document.getElementById('loader-percent')
        const loader = document.getElementById('loader')

        let p = 0
        const interval = setInterval(() => {
            // Randomly increase percentage to simulate loading
            p += Math.floor(Math.random() * 18) + 8
            if (p >= 100) {
                p = 100
                clearInterval(interval)
                // Fade out once we hit 100%
                if (loader) {
                    setTimeout(() => {
                        loader.style.opacity = '0'
                        setTimeout(() => loader.remove(), 800)
                    }, 300)
                }
            }
            if (percentEl) percentEl.innerText = p + '%'
        }, 120)

        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <Canvas
                camera={{ position: [80, 55, 110], fov: 60, near: 0.1, far: 1200 }}
                gl={{
                    antialias: true,
                    toneMapping: 4,          // ACESFilmicToneMapping
                    toneMappingExposure: 0.9,
                }}
                shadows
                onCreated={({ scene, gl }) => {
                    scene.background = new Color(0x010408)
                    scene.fog = new FogExp2(0x010408, 0.008)
                    gl.shadowMap.enabled = true
                }}
            >
                <AdaptiveDpr pixelated />

                <Lights />
                <Ground />
                <City />
                <Stars />
                <Particles />
                <Vehicles />
                <HoloRings />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.06}
                    minDistance={20}
                    maxDistance={350}
                    maxPolarAngle={Math.PI / 2.05}
                    autoRotate
                    autoRotateSpeed={0.35}
                />

                <EffectComposer>
                    <Bloom
                        intensity={0.85}
                        radius={0.55}
                        luminanceThreshold={0.12}
                        luminanceSmoothing={0.08}
                        blendFunction={BlendFunction.ADD}
                    />
                </EffectComposer>
            </Canvas>

            <HUD />
        </>
    )
}
