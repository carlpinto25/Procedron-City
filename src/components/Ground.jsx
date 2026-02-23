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
    // Smoother, larger scale for smoke
    vec2 uv = vUv * 3.0; 
    
    // Slow drifting wind effect
    uv.y += uTime * 0.03; 
    uv.x -= uTime * 0.015;

    // Domain warping for cloud like look
    vec2 q = vec2(0.);
    q.x = fbm(uv + 0.00 * uTime);
    q.y = fbm(uv + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.05 * uTime);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.02 * uTime);

    // Apply distortion and get final noise value (0.0 to 1.0 roughly)
    float f = fbm(uv + r * 2.0);

    // SMOKE COLORS (Dark grays, dirty greens, lit by city ambient light)
    vec3 color1 = vec3(0.01, 0.02, 0.03);  // Deep shadows/void
    vec3 color2 = vec3(0.15, 0.18, 0.22);  // Dense gray smoke
    vec3 color3 = vec3(0.3, 0.4, 0.45);    // Highlights from moonlight/neon
    
    // Mix colors based on density
    // Square the noise value to create clumpier, distinct smoke tendrils
    float density = clamp((f*f)*2.5, 0.0, 1.0);
    vec3 col = mix(color1, color2, density);
    
    // Add specular-like highlights where smoke is thickest
    col = mix(col, color3, clamp(length(q) * f, 0.0, 1.0) * 0.8);

    // Edge fade out so it doesn't clip as a hard square
    float dist = length(vUv - 0.5) * 2.0;
    float edgeFade = smoothstep(1.0, 0.3, dist); // Start fading further out

    // The alpha depends on the density of the noise
    float alpha = smoothstep(0.1, 0.9, f) * 0.8; // Max 80% opacity for thickest parts

    // Render transparent smoke
    // We don't boost the rgb here like emissive neon fog, just standard blending
    gl_FragColor = vec4(col, alpha * edgeFade);
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.5, 0]}>
      <planeGeometry args={[500, 500]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={fogVert}
        fragmentShader={fogFrag}
        uniforms={{ uTime: { value: 0 } }}
        transparent={true}
        depthWrite={false}
      // Use normal alpha blending for smoke instead of additive glowing blending
      />
    </mesh>
  )
}

