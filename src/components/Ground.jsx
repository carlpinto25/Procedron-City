import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const fogVert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fogFrag = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;

  // Noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); 
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractal Brownian Motion for depth
  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 5; ++i) {
      v += a * snoise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 8.0; // scale of the fog
    uv.y += uTime * 0.15; // drift
    uv.x -= uTime * 0.08;

    // Domain warping for cloud like look
    vec2 q = vec2(0.);
    q.x = fbm(uv + 0.00 * uTime);
    q.y = fbm(uv + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

    float f = fbm(uv + r);

    // Map to fog colors
    vec3 color1 = vec3(0.01, 0.05, 0.1);  // dark deep base
    vec3 color2 = vec3(0.00, 1.00, 0.6); // volumetric glowing cyan
    vec3 color3 = vec3(0.8, 0.0, 1.0);    // neon pink/purple hints
    
    // Mix based on fbm values
    vec3 col = mix(color1, color2, clamp((f*f)*2.0, 0.0, 1.0));
    col = mix(col, color3, clamp(length(q), 0.0, 1.0) * 0.4);

    float alpha = smoothstep(0.0, 1.0, f);
    
    // radial distance fade out mapping (from center)
    float dist = length(vUv - 0.5) * 2.0;
    float edgeFade = smoothstep(1.0, 0.2, dist);

    // Render out as transparent emissive fog
    gl_FragColor = vec4(col * 1.5, alpha * edgeFade * 0.9);
  }
`

export function Ground() {
  const matRef = useRef()

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  // We set transparent to true so the alpha map properly blends the fog over the void base, 
  // depthWrite to false to avoid cutting out geometry behind it if overlapping
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.2, 0]}>
      <planeGeometry args={[500, 500]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={fogVert}
        fragmentShader={fogFrag}
        uniforms={{ uTime: { value: 0 } }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

