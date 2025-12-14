import { useState, useEffect } from 'react';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AudioControls } from './components/AudioControls';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { shaders } from './shaders';

function App() {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentShader, setCurrentShader] = useState(0);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [colorOffset, setColorOffset] = useState(0);
  const audioData = useAudioAnalyzer(audioElement);

  const handleRandomizeColors = () => {
    setColorOffset(Math.random() * Math.PI * 2);
  };

  // Auto-cycle shaders every 25 seconds when random mode is on
  useEffect(() => {
    if (!isRandomMode) return;

    const interval = setInterval(() => {
      setCurrentShader((prev) => (prev + 1) % shaders.length);
    }, 25000);

    return () => clearInterval(interval);
  }, [isRandomMode]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Title overlay */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Audio Reactive Shaders
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Three.js visualization powered by Web Audio API
          </p>
        </div>
      </div>

      {/* Visualizer */}
      <AudioVisualizer
        audioData={audioData}
        isPlaying={isPlaying}
        currentShader={currentShader}
        colorOffset={colorOffset}
      />

      {/* Controls */}
      <AudioControls
        audioElement={audioElement}
        setAudioElement={setAudioElement}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentShader={currentShader}
        onShaderChange={setCurrentShader}
        shaderNames={shaders.map(s => s.name)}
        isRandomMode={isRandomMode}
        setIsRandomMode={setIsRandomMode}
        onRandomizeColors={handleRandomizeColors}
      />
    </div>
  );
}

export default App;
