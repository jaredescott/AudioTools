import { useState } from 'react';
import { Radio } from 'lucide-react';
import AudioGoniometer, { VisualizationMode } from './components/AudioGoniometer';
import AudioControls from './components/AudioControls';

function App() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const [gain, setGain] = useState(2);
  const [persistence, setPersistence] = useState(0.85);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('circular');
  const [shapeType, setShapeType] = useState('lissajous');
  const [detectedShape, setDetectedShape] = useState('lissajous');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Radio className="text-emerald-400" size={40} />
            <h1 className="text-4xl font-bold text-white">
              Audio Goniometer
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Real-time stereo field and phase correlation analyzer
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <AudioGoniometer
              audioContext={audioContext}
              sourceNode={sourceNode}
              gain={gain}
              persistence={persistence}
              visualizationMode={visualizationMode}
              shapeType={shapeType}
              onShapeDetected={setDetectedShape}
            />

            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white font-semibold">Visualization Mode</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVisualizationMode('circular')}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      visualizationMode === 'circular'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Circular
                  </button>
                  <button
                    onClick={() => setVisualizationMode('lissajous')}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      visualizationMode === 'lissajous'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Lissajous
                  </button>
                  <button
                    onClick={() => setVisualizationMode('polar')}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      visualizationMode === 'polar'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Polar
                  </button>
                  <button
                    onClick={() => setVisualizationMode('linear')}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      visualizationMode === 'linear'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Linear
                  </button>
                  <button
                    onClick={() => setVisualizationMode('3d-lissajous')}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all col-span-2 ${
                      visualizationMode === '3d-lissajous'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    3D Lissajous
                  </button>
                </div>
              </div>

              {visualizationMode === '3d-lissajous' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white font-semibold">Active 3D Shape</label>
                    <span className="text-pink-400 font-mono text-sm capitalize font-bold">
                      {detectedShape}
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-slate-900 rounded-lg border border-pink-500/20">
                    <p className="text-slate-300 text-sm mb-2">
                      Shape automatically morphs based on:
                    </p>
                    <ul className="text-slate-400 text-xs space-y-1 ml-4">
                      <li>• Low frequencies → Torus</li>
                      <li>• High frequencies → Spiral</li>
                      <li>• Major chords (C/G/F) → Sphere</li>
                      <li>• Sharp notes (C#/F#/G#) → Knot</li>
                      <li>• Mid-range balanced → Rose</li>
                      <li>• Default → Lissajous</li>
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white font-semibold">Trail Persistence</label>
                  <span className="text-emerald-400 font-mono">{Math.round(persistence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.95"
                  step="0.05"
                  value={persistence}
                  onChange={(e) => setPersistence(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>None</span>
                  <span>Maximum</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white font-semibold">Visualization Gain</label>
                  <span className="text-emerald-400 font-mono">{gain.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={gain}
                  onChange={(e) => setGain(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0.5x</span>
                  <span>10x</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AudioControls
              onAudioContextChange={setAudioContext}
              onSourceNodeChange={setSourceNode}
            />

            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">How to Read</h3>
              <div className="space-y-3 text-slate-300 text-sm">
                <div>
                  <span className="font-semibold text-emerald-400">Vertical line:</span> Pure mono signal
                </div>
                <div>
                  <span className="font-semibold text-emerald-400">Horizontal line:</span> Pure stereo (out of phase)
                </div>
                <div>
                  <span className="font-semibold text-emerald-400">Circle:</span> Wide stereo field
                </div>
                <div>
                  <span className="font-semibold text-emerald-400">45° diagonal:</span> Perfect stereo balance
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <span className="font-semibold text-blue-400">Phase Correlation:</span> +100% = perfect mono, 0% = decorrelated, -100% = inverted
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-sm text-slate-500">
          <p>Professional audio visualization tool for monitoring stereo imaging and phase relationship</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
