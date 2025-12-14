import { useState } from 'react';
import { X, Save, Trash2, Download } from 'lucide-react';
import { CymaticPreset } from '../lib/supabase';
import { PresetConfig } from '../App';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: PresetConfig;
  presets: CymaticPreset[];
  loading: boolean;
  onSave: (name: string, description: string, isPublic: boolean) => Promise<void>;
  onLoad: (preset: CymaticPreset) => void;
  onDelete: (id: string) => Promise<void>;
}

export const PresetModal = ({
  isOpen,
  onClose,
  currentConfig,
  presets,
  loading,
  onSave,
  onLoad,
  onDelete,
}: PresetModalProps) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('load');
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!presetName.trim()) return;

    try {
      setSaving(true);
      await onSave(presetName, presetDescription, isPublic);
      setPresetName('');
      setPresetDescription('');
      setIsPublic(false);
      setActiveTab('load');
    } catch (err) {
      console.error('Failed to save preset:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (preset: CymaticPreset) => {
    onLoad(preset);
    onClose();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      try {
        await onDelete(id);
      } catch (err) {
        console.error('Failed to delete preset:', err);
      }
    }
  };

  const patternLabels = {
    radial: 'Radial Waves',
    harmonic: 'Harmonic Resonance',
    interference: 'Wave Interference',
    chladni: 'Chladni Patterns',
  };

  const colorLabels = {
    spectral: 'Spectral',
    monochrome: 'Monochrome',
    heat: 'Heat',
    ocean: 'Ocean',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Presets</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('load')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === 'load'
                ? 'text-white bg-slate-800'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Load Preset
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === 'save'
                ? 'text-white bg-slate-800'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Save Current
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="My Awesome Pattern"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Describe your pattern..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-white">
                    Make this preset public
                  </span>
                </label>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-white mb-2">Current Configuration</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>Sensitivity: {currentConfig.sensitivity.toFixed(1)}x</p>
                  <p>Pattern: {patternLabels[currentConfig.patternType]}</p>
                  <p>Color: {colorLabels[currentConfig.colorScheme]}</p>
                  <p>Wireframe: {currentConfig.wireframe ? 'On' : 'Off'}</p>
                  <p>Quality: {currentConfig.segments}</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!presetName.trim() || saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preset'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-gray-400 py-8">Loading presets...</p>
              ) : presets.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No presets found. Create your first preset!
                </p>
              ) : (
                presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{preset.name}</h3>
                          {preset.is_public && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                              Public
                            </span>
                          )}
                        </div>
                        {preset.description && (
                          <p className="text-sm text-gray-400 mb-2">{preset.description}</p>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            {patternLabels[preset.pattern_type]} • {colorLabels[preset.color_scheme]}
                          </p>
                          <p>Sensitivity: {preset.sensitivity}x • Quality: {preset.segments}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleLoad(preset)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          title="Load preset"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => preset.id && handleDelete(preset.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          title="Delete preset"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
