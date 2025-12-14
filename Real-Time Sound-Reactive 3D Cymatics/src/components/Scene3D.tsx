import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { ChladniPlate } from './ChladniPlate';

interface Scene3DProps {
  frequencyData: Uint8Array;
  sensitivity: number;
  particleCount: number;
}

export const Scene3D = ({
  frequencyData,
  sensitivity,
  particleCount,
}: Scene3DProps) => {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 4, 0], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#000000']} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4080ff" />

        <ChladniPlate
          frequencyData={frequencyData}
          sensitivity={sensitivity}
          particleCount={particleCount}
        />

        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};
