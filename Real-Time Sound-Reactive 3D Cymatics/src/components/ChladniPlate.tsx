import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChladniPlateProps {
  frequencyData: Uint8Array;
  sensitivity: number;
  particleCount: number;
}

const PLATE_SIZE = 4;

export const ChladniPlate = ({
  frequencyData,
  sensitivity,
  particleCount,
}: ChladniPlateProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const plateRef = useRef<THREE.Mesh>(null);

  const velocities = useMemo(() => {
    const vels = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      vels[i] = 0;
    }
    return vels;
  }, [particleCount]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * PLATE_SIZE;
      pos[i3 + 1] = 0.01;
      pos[i3 + 2] = (Math.random() - 0.5) * PLATE_SIZE;

      col[i3] = 1;
      col[i3 + 1] = 1;
      col[i3 + 2] = 1;
    }

    return { positions: pos, colors: col };
  }, [particleCount]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [positions, colors]);

  const calculateWaveAmplitude = (x: number, z: number, time: number) => {
    const bass = frequencyData[4] / 255;
    const bassHigh = frequencyData[12] / 255;
    const midLow = frequencyData[24] / 255;
    const mid = frequencyData[48] / 255;
    const midHigh = frequencyData[72] / 255;
    const treble = frequencyData[100] / 255;
    const highTreble = frequencyData[120] / 255;

    const m = 2 + bass * 6 + bassHigh * 3;
    const n = 3 + midLow * 7 + mid * 4;
    const m2 = 3 + mid * 5 + midHigh * 3;
    const n2 = 4 + treble * 6 + highTreble * 4;

    const normalizedX = x / (PLATE_SIZE / 2);
    const normalizedZ = z / (PLATE_SIZE / 2);

    const theta = Math.atan2(normalizedZ, normalizedX);
    const r = Math.sqrt(normalizedX * normalizedX + normalizedZ * normalizedZ);

    const mode1 = Math.cos(m * normalizedX * Math.PI) * Math.sin(n * normalizedZ * Math.PI);
    const mode2 = Math.sin(m2 * normalizedX * Math.PI) * Math.cos(n2 * normalizedZ * Math.PI);
    const mode3 = Math.cos(theta * (m + m2) * 0.5) * Math.sin(r * Math.PI * (n + n2) * 0.3);

    const wave = mode1 * bass * 0.45 +
                 mode2 * mid * 0.35 +
                 mode3 * treble * 0.2;

    const standing = Math.sin(time * 2);

    return Math.abs(wave) * (0.8 + 0.2 * standing);
  };

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;

    const positionAttr = particlesRef.current.geometry.attributes.position;
    const colorAttr = particlesRef.current.geometry.attributes.color;
    const positions = positionAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;
    const time = clock.getElapsedTime();

    const bass = frequencyData[4] / 255;
    const mid = frequencyData[40] / 255;
    const treble = frequencyData[96] / 255;

    const delta = 0.01;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];

      if (Math.abs(x) > PLATE_SIZE / 2 || Math.abs(z) > PLATE_SIZE / 2) {
        positions[i3] = (Math.random() - 0.5) * PLATE_SIZE;
        positions[i3 + 2] = (Math.random() - 0.5) * PLATE_SIZE;
        velocities[i3] = 0;
        velocities[i3 + 2] = 0;
        continue;
      }

      const amplitude = calculateWaveAmplitude(x, z, time);

      const amplitudeRight = calculateWaveAmplitude(x + delta, z, time);
      const amplitudeLeft = calculateWaveAmplitude(x - delta, z, time);
      const amplitudeUp = calculateWaveAmplitude(x, z + delta, time);
      const amplitudeDown = calculateWaveAmplitude(x, z - delta, time);

      const gradientX = (amplitudeRight - amplitudeLeft) / (2 * delta);
      const gradientZ = (amplitudeUp - amplitudeDown) / (2 * delta);

      const forceScale = sensitivity * 0.002;
      velocities[i3] -= gradientX * forceScale;
      velocities[i3 + 2] -= gradientZ * forceScale;

      const vibrationForce = amplitude * sensitivity * 0.0003;
      velocities[i3] += (Math.random() - 0.5) * vibrationForce;
      velocities[i3 + 2] += (Math.random() - 0.5) * vibrationForce;

      velocities[i3] *= 0.95;
      velocities[i3 + 2] *= 0.95;

      positions[i3] += velocities[i3];
      positions[i3 + 2] += velocities[i3 + 2];

      const r = Math.sqrt(x * x + z * z) / (PLATE_SIZE / 2);
      const pulse = Math.sin(time * 6) * 0.25 + 0.25;

      colors[i3] = 0.15 + bass * 0.65 + r * treble * 0.3 + pulse * bass * 0.4;
      colors[i3 + 1] = 0.08 + mid * 0.75 + pulse * mid * 0.5;
      colors[i3 + 2] = 0.45 + treble * 0.55 + pulse * treble * 0.4;
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  return (
    <group>
      <mesh ref={plateRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[PLATE_SIZE, PLATE_SIZE, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.3}
          metalness={0.7}
          transparent={true}
          opacity={0.2}
        />
      </mesh>

      <points ref={particlesRef} geometry={geometry} material={particleMaterial} />
    </group>
  );
};
