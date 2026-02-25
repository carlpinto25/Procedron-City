import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDensity;

  // Simple 2d noise hook
  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractal Brownian Motion for cloudy texture
  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 4; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
  }

  void main() {
    // scale coordinates
    vec2 p = (vUv - 0.5) * 12.0; 
    
    // animate drifting fog
    float n = fbm(p + vec2(uTime * 0.1, uTime * 0.05));
    
    // circular fade out towards edges safely inside the plane
    float dist = length(vUv - 0.5) * 2.0;
    float edgeFade = smoothstep(1.0, 0.4, dist);
    
    // base alpha mapping noise to a soft mask
    float alpha = smoothstep(0.1, 0.9, n) * edgeFade * uDensity;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`

export function GroundFog() {
  const matsRef = useRef([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    matsRef.current.forEach((mat, i) => {
      if (mat) {
        // Offset time per layer
        mat.uniforms.uTime.value = t + i * 15.0
      }
    })
  })

  // Stack horizontal planes. 
  // The lower we go, the denser the fog (higher max opacity).
  // Taller, thicker layers with very high density near the ground
  const layers = [
    { y: 0.5, density: 1.00 },
    { y: 4.0, density: 0.95 },
    { y: 8.0, density: 0.85 },
    { y: 14.0, density: 0.65 },
    { y: 22.0, density: 0.40 },
    { y: 35.0, density: 0.20 },
    { y: 50.0, density: 0.08 },
  ]

  return (
    <group>
      {layers.map((layer, i) => (
        <mesh key={i} position={[0, layer.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[350, 350, 2, 2]} />
          <shaderMaterial
            ref={el => matsRef.current[i] = el}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              uTime: { value: 0 },
              // A much more vibrant, dense bluish color
              uColor: { value: new THREE.Color(0x0d4fa1) },
              uDensity: { value: layer.density }
            }}
            transparent={true}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  )
}
