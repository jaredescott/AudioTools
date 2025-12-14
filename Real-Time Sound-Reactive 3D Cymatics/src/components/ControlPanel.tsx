import { Mic, Upload, Play, Square, Volume2, Settings2 } from 'lucide-react';
import { AudioSource } from '../hooks/useAudioAnalyzer';

interface ControlPanelProps {
  isActive: boolean;
  audioSource: AudioSource;
  onStartMicrophone: () => void;
  onStopAudio: () => void;
  onFileUpload: (file: File) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  particleCount: number;
  onParticleCountChange: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  onSavePreset: () => void;
  onLoadPresets: () => void;
}

export const ControlPanel = ({
  isActive,
  audioSource,
  onStartMicrophone,
  onStopAudio,
  onFileUpload,
  sensitivity,
  onSensitivityChange,
  particleCount,
  onParticleCountChange,
  volume,
  onVolumeChange,
  onSavePreset,
  onLoadPresets,
}: ControlPanelProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onFileUpload(file);
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white p-6 rounded-xl shadow-2xl w-80 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5" />
        <h2 className="text-xl font-bold">Cymatic Controls</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-semibold mb-3 block">Audio Input</label>
          <div className="flex gap-2">
            <button
              onClick={isActive && audioSource === 'microphone' ? onStopAudio : onStartMicrophone}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                isActive && audioSource === 'microphone'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isActive && audioSource === 'microphone' ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Mic
                </>
              )}
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              File
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          {isActive && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Play className="w-3 h-3 text-green-400" />
              <span className="text-green-400">
                {audioSource === 'microphone' ? 'Microphone Active' : 'Playing Audio File'}
              </span>
            </div>
          )}
        </div>

        {isActive && (
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Volume: {Math.round(volume * 100)}%
            </label>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold mb-2 block">
            Sensitivity: {sensitivity.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">
            Particle Count: {particleCount.toLocaleString()}
          </label>
          <input
            type="range"
            min="1000"
            max="20000"
            step="1000"
            value={particleCount}
            onChange={(e) => onParticleCountChange(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Higher counts may affect performance
          </p>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <label className="text-sm font-semibold mb-2 block">Presets</label>
          <div className="flex gap-2">
            <button
              onClick={onSavePreset}
              className="flex-1 py-2 px-4 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={onLoadPresets}
              className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
