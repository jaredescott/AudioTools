import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CymaticSphereProps {
  frequencyData: Uint8Array;
  sensitivity: number;
  patternType: 'radial' | 'harmonic' | 'interference' | 'chladni';
  colorScheme: 'spectral' | 'monochrome' | 'heat' | 'ocean';
  wireframe: boolean;
  segments: number;
}

export const CymaticSphere = ({
  frequencyData,
  sensitivity,
  patternType,
  colorScheme,
  wireframe,
  segments,
}: CymaticSphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.SphereGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;
    uniform float uTime;
    uniform float uFrequencies[128];
    uniform float uSensitivity;
    uniform int uPatternType;

    #define PI 3.14159265359

    float getFrequency(int index) {
      if (index < 0) return 0.0;
      if (index >= 128) return 0.0;
      return uFrequencies[index];
    }

    float radialPattern(vec3 pos) {
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y);

      int freqIndex = int(mod(phi * 20.0, 128.0));
      float freq = getFrequency(freqIndex);

      float wave = sin(phi * 10.0 + uTime) * cos(theta * 8.0);
      return wave * freq * 0.01;
    }

    float harmonicPattern(vec3 pos) {
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y);

      float displacement = 0.0;

      for (int i = 0; i < 8; i++) {
        int freqIndex = i * 16;
        float freq = getFrequency(freqIndex);
        float harmonic = float(i + 1);

        displacement += sin(phi * harmonic * 3.0 + uTime * 0.5) *
                       cos(theta * harmonic * 2.0) *
                       freq * 0.005;
      }

      return displacement;
    }

    float interferencePattern(vec3 pos) {
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y);

      int bassIndex = 2;
      int midIndex = 32;
      int highIndex = 80;

      float bass = getFrequency(bassIndex);
      float mid = getFrequency(midIndex);
      float high = getFrequency(highIndex);

      float wave1 = sin(phi * 6.0 + uTime) * bass * 0.01;
      float wave2 = cos(theta * 8.0 + uTime * 1.5) * mid * 0.008;
      float wave3 = sin(phi * 12.0 + theta * 10.0 + uTime * 2.0) * high * 0.006;

      return wave1 + wave2 + wave3;
    }

    float chladniPattern(vec3 pos) {
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y);

      // Get frequency bands
      float bass = getFrequency(4);
      float midLow = getFrequency(16);
      float mid = getFrequency(40);
      float midHigh = getFrequency(64);
      float treble = getFrequency(96);

      // Map frequencies to harmonic mode numbers
      float m1 = floor(bass * 8.0) + 2.0;
      float n1 = floor(midLow * 10.0) + 3.0;
      float m2 = floor(mid * 6.0) + 3.0;
      float n2 = floor(midHigh * 8.0) + 4.0;
      float m3 = floor(treble * 5.0) + 2.0;

      // Calculate multiple Chladni modes (spherical harmonics)
      float mode1 = cos(m1 * theta) * sin(n1 * phi);
      float mode2 = sin(m2 * theta) * cos(n2 * phi);
      float mode3 = cos(m3 * theta + PI * 0.5) * sin(m3 * phi);

      // Combine modes with frequency-weighted amplitudes
      float pattern = mode1 * bass * 0.4 +
                     mode2 * mid * 0.35 +
                     mode3 * treble * 0.25;

      // Create sharper nodal lines using power function
      pattern = pow(abs(pattern), 0.6) * sign(pattern);

      // Add standing wave effect
      float wave = sin(uTime * 2.0 + phi * n1);
      pattern *= (0.7 + 0.3 * wave);

      return pattern * 0.15;
    }

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      vec3 pos = normalize(position);
      float displacement = 0.0;

      if (uPatternType == 0) {
        displacement = radialPattern(pos);
      } else if (uPatternType == 1) {
        displacement = harmonicPattern(pos);
      } else if (uPatternType == 2) {
        displacement = interferencePattern(pos);
      } else if (uPatternType == 3) {
        displacement = chladniPattern(pos);
      }

      displacement *= uSensitivity;
      vDisplacement = displacement;

      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;
    uniform int uColorScheme;
    uniform float uTime;

    vec3 spectralColor(float t) {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(0.0, 0.33, 0.67);
      return a + b * cos(6.28318 * (c * t + d));
    }

    vec3 heatColor(float t) {
      vec3 cold = vec3(0.0, 0.0, 0.5);
      vec3 warm = vec3(1.0, 0.5, 0.0);
      vec3 hot = vec3(1.0, 1.0, 0.0);

      if (t < 0.5) {
        return mix(cold, warm, t * 2.0);
      } else {
        return mix(warm, hot, (t - 0.5) * 2.0);
      }
    }

    vec3 oceanColor(float t) {
      vec3 deep = vec3(0.0, 0.1, 0.3);
      vec3 shallow = vec3(0.0, 0.6, 0.8);
      vec3 foam = vec3(0.8, 1.0, 1.0);

      if (t < 0.5) {
        return mix(deep, shallow, t * 2.0);
      } else {
        return mix(shallow, foam, (t - 0.5) * 2.0);
      }
    }

    void main() {
      // Enhanced intensity mapping for Chladni patterns
      float intensity = abs(vDisplacement) * 15.0;

      // Create sharper contrast at nodal lines
      float nodalPattern = smoothstep(0.0, 0.15, intensity) * smoothstep(1.0, 0.5, intensity);
      intensity = pow(intensity, 0.8);
      intensity = clamp(intensity, 0.0, 1.0);

      vec3 color;

      if (uColorScheme == 0) {
        color = spectralColor(intensity);
      } else if (uColorScheme == 1) {
        // Enhanced monochrome with visible nodal lines
        color = vec3(intensity * 0.9 + 0.1);
        // Add blue tint to nodal lines
        if (intensity < 0.2) {
          color = mix(vec3(0.1, 0.2, 0.4), color, intensity * 5.0);
        }
      } else if (uColorScheme == 2) {
        color = heatColor(intensity);
      } else if (uColorScheme == 3) {
        color = oceanColor(intensity);
      }

      // Enhanced lighting for better depth perception
      vec3 light = normalize(vec3(1.0, 1.0, 1.0));
      float diffuse = max(dot(vNormal, light), 0.4);

      // Add rim lighting to highlight edges
      vec3 viewDir = normalize(vPosition);
      float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
      rim = pow(rim, 3.0) * 0.3;

      color *= diffuse;
      color += vec3(rim) * intensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFrequencies: { value: new Array(128).fill(0) },
      uSensitivity: { value: sensitivity },
      uPatternType: { value: 0 },
      uColorScheme: { value: 0 },
    }),
    []
  );

  const patternTypeMap = {
    radial: 0,
    harmonic: 1,
    interference: 2,
    chladni: 3,
  };

  const colorSchemeMap = {
    spectral: 0,
    monochrome: 1,
    heat: 2,
    ocean: 3,
  };

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uSensitivity.value = sensitivity;
      materialRef.current.uniforms.uPatternType.value = patternTypeMap[patternType];
      materialRef.current.uniforms.uColorScheme.value = colorSchemeMap[colorScheme];

      const frequencies = new Array(128).fill(0);
      const step = Math.floor(frequencyData.length / 128);

      for (let i = 0; i < 128; i++) {
        const index = i * step;
        if (index < frequencyData.length) {
          frequencies[i] = frequencyData[index] / 255.0;
        }
      }

      materialRef.current.uniforms.uFrequencies.value = frequencies;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry ref={geometryRef} args={[2, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={wireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
