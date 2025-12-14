import { useState } from 'react';
import { Scene3D } from './components/Scene3D';
import { ControlPanel } from './components/ControlPanel';
import { PresetModal } from './components/PresetModal';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { usePresets } from './hooks/usePresets';
import { CymaticPreset } from './lib/supabase';
import { AlertCircle } from 'lucide-react';

export interface PresetConfig {
  sensitivity: number;
  patternType: 'radial' | 'harmonic' | 'interference' | 'chladni';
  colorScheme: 'spectral' | 'monochrome' | 'heat' | 'ocean';
  wireframe: boolean;
  segments: number;
}

function App() {
  const {
    frequencyData,
    isActive,
    audioSource,
    startMicrophone,
    stopAudio,
    loadAudioFile,
    volume,
    setVolume,
  } = useAudioAnalyzer(2048);

  const {
    presets,
    loading: presetsLoading,
    savePreset,
    deletePreset,
  } = usePresets();

  const [sensitivity, setSensitivity] = useState(1.5);
  const [particleCount, setParticleCount] = useState(8000);
  const [error, setError] = useState<string | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const handleStartMicrophone = async () => {
    try {
      setError(null);
      await startMicrophone();
    } catch (err) {
      setError('Failed to access microphone. Please grant permission and try again.');
      console.error(err);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      await loadAudioFile(file);
    } catch (err) {
      setError('Failed to load audio file. Please try a different file.');
      console.error(err);
    }
  };

  const handleSavePreset = () => {
    setShowPresetModal(true);
  };

  const handleLoadPresets = () => {
    setShowPresetModal(true);
  };

  const getCurrentConfig = (): PresetConfig => ({
    sensitivity,
    patternType: 'chladni',
    colorScheme: 'spectral',
    wireframe: false,
    segments: 128,
  });

  const loadConfig = (preset: CymaticPreset) => {
    setSensitivity(preset.sensitivity);
  };

  const handleSavePresetToDb = async (name: string, description: string, isPublic: boolean) => {
    const config = getCurrentConfig();
    await savePreset({
      name,
      description,
      sensitivity: config.sensitivity,
      pattern_type: config.patternType,
      color_scheme: config.colorScheme,
      wireframe: config.wireframe,
      segments: config.segments,
      is_public: isPublic,
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Scene3D
        frequencyData={frequencyData}
        sensitivity={sensitivity}
        particleCount={particleCount}
      />

      <ControlPanel
        isActive={isActive}
        audioSource={audioSource}
        onStartMicrophone={handleStartMicrophone}
        onStopAudio={stopAudio}
        onFileUpload={handleFileUpload}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
        particleCount={particleCount}
        onParticleCountChange={setParticleCount}
        volume={volume}
        onVolumeChange={setVolume}
        onSavePreset={handleSavePreset}
        onLoadPresets={handleLoadPresets}
      />

      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!isActive && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            3D Cymatic Visualizer
          </h1>
          <p className="text-xl text-gray-300 drop-shadow-md">
            Start with microphone or upload an audio file
          </p>
        </div>
      )}

      <PresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        currentConfig={getCurrentConfig()}
        presets={presets}
        loading={presetsLoading}
        onSave={handleSavePresetToDb}
        onLoad={loadConfig}
        onDelete={deletePreset}
      />
    </div>
  );
}

export default App;
