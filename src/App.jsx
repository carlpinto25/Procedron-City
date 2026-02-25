import { useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Color, FogExp2 } from 'three'

function FogAnimator() {
    useFrame(({ scene, clock }) => {
        if (scene.fog) {
            scene.fog.density = 0.007 + Math.sin(clock.elapsedTime * 0.5) * 0.002
        }
    })
    return null
}

import { City } from './components/City'
import { Ground } from './components/Ground'
import { Lights } from './components/Lights'
import { HUD } from './components/HUD'
import { GroundFog } from './components/GroundFog'

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
                onCreated={({ scene }) => {
                    scene.background = new Color(0x1a3040)
                    scene.fog = new FogExp2(0x1a3040, 0.007)
                }}
            >
                <AdaptiveDpr pixelated />
                <FogAnimator />
                <GroundFog />

                <Lights />
                <Ground />
                <City />

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
                        luminanceThreshold={0.30}
                        luminanceSmoothing={0.08}
                        blendFunction={BlendFunction.ADD}
                    />
                </EffectComposer>
            </Canvas>

            <HUD />
        </>
    )
}
