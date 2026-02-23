import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const gridVert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const gridFrag = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;

  float gridLine(float v, float freq, float width) {
    float gv = fract(v * freq);
    return smoothstep(width, 0.0, min(gv, 1.0 - gv));
  }

  void main() {
    vec2 uv = vUv;
    float major = gridLine(uv.x, 12.0, 0.006) + gridLine(uv.y, 12.0, 0.006);
    float minor = gridLine(uv.x, 48.0, 0.003) + gridLine(uv.y, 48.0, 0.003);
    float pulse = 0.5 + 0.5 * sin(uTime * 0.8 + uv.x * 6.28 * 3.0 + uv.y * 6.28 * 3.0);
    vec3 majorCol = vec3(0.0, 1.0, 0.88) * (0.7 + 0.3 * pulse);
    vec3 minorCol = vec3(0.0, 0.5, 0.44);
    vec3 base     = vec3(0.01, 0.015, 0.025);
    vec3 col = base + minor * minorCol * 0.5 + major * majorCol;
    float dist = length(uv - 0.5) * 2.0;
    col *= 1.0 - dist * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Ground() {
  const matRef = useRef()

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={gridVert}
        fragmentShader={gridFrag}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  )
}
