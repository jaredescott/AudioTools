import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AudioData } from '../hooks/useAudioAnalyzer';
import { shaders } from '../shaders';

interface AudioVisualizerProps {
  audioData: AudioData;
  isPlaying: boolean;
  currentShader: number;
  colorOffset: number;
}

export function AudioVisualizer({ audioData, isPlaying, currentShader, colorOffset }: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const audioDataRef = useRef<AudioData>(audioData);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create geometry - icosahedron for organic shape
    const geometry = new THREE.IcosahedronGeometry(1, 64);

    // Get current shader
    const shader = shaders[currentShader];

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioFrequency: { value: 0 },
        uAudioBass: { value: 0 },
        uAudioMid: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uCameraPosition: { value: camera.position },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uColorOffset: { value: colorOffset },
      },
      wireframe: false,
      side: THREE.DoubleSide,
    });
    materialRef.current = material;

    // Create mesh - use fullscreen plane for all shaders except Audio Sphere (shader 0)
    let meshGeometry = geometry;
    if (currentShader !== 0) {
      // Calculate plane size to fill screen based on camera FOV and aspect ratio
      const aspect = window.innerWidth / window.innerHeight;
      const distance = camera.position.z;
      const vFov = (camera.fov * Math.PI) / 180;
      const planeHeight = 2 * Math.tan(vFov / 2) * distance;
      const planeWidth = planeHeight * aspect;

      meshGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      geometry.dispose();
    }

    const mesh = new THREE.Mesh(meshGeometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      timeRef.current += 0.01;

      if (materialRef.current) {
        // Smooth interpolation for audio values
        const targetFreq = audioDataRef.current.frequency;
        const targetBass = audioDataRef.current.bass;
        const targetMid = audioDataRef.current.mid;

        const currentFreq = materialRef.current.uniforms.uAudioFrequency.value;
        const currentBass = materialRef.current.uniforms.uAudioBass.value;
        const currentMid = materialRef.current.uniforms.uAudioMid.value;

        // Faster lerp for more responsive audio reaction
        const lerpFactor = 0.3;

        materialRef.current.uniforms.uTime.value = timeRef.current;
        materialRef.current.uniforms.uAudioFrequency.value =
          currentFreq + (targetFreq - currentFreq) * lerpFactor;
        materialRef.current.uniforms.uAudioBass.value =
          currentBass + (targetBass - currentBass) * lerpFactor;
        materialRef.current.uniforms.uAudioMid.value =
          currentMid + (targetMid - currentMid) * lerpFactor;
      }

      if (meshRef.current && currentShader === 0) {
        // Slow rotation for visual interest (only for Audio Sphere)
        meshRef.current.rotation.y += 0.002;
        meshRef.current.rotation.x += 0.001;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);

      if (materialRef.current && materialRef.current.uniforms.uResolution) {
        materialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Mouse move handler for mouse-reactive shaders
    const handleMouseMove = (event: MouseEvent) => {
      if (materialRef.current && materialRef.current.uniforms.uMouse) {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        materialRef.current.uniforms.uMouse.value.set(x, y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      if (meshRef.current && meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }
    };
  }, [currentShader]);

  // Update audio data ref
  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  // Update color offset uniform
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uColorOffset) {
      materialRef.current.uniforms.uColorOffset.value = colorOffset;
    }
  }, [colorOffset]);

  return <div ref={containerRef} className="fixed inset-0" />;
}
