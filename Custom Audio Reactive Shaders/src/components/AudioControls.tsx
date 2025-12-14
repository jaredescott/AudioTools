import { useRef, useState } from 'react';
import { Play, Pause, Upload, Volume2, VolumeX, Sparkles, Shuffle, Palette } from 'lucide-react';

interface AudioControlsProps {
  audioElement: HTMLAudioElement | null;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentShader: number;
  onShaderChange: (index: number) => void;
  shaderNames: string[];
  isRandomMode: boolean;
  setIsRandomMode: (enabled: boolean) => void;
  onRandomizeColors: () => void;
}

export function AudioControls({
  audioElement,
  setAudioElement,
  isPlaying,
  setIsPlaying,
  currentShader,
  onShaderChange,
  shaderNames,
  isRandomMode,
  setIsRandomMode,
  onRandomizeColors,
}: AudioControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [songName, setSongName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSongName(file.name.replace(/\.[^/.]+$/, ''));

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.volume = volume;
    audio.loop = true;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    setAudioElement(audio);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (audioElement) {
      audioElement.volume = value;
    }
  };

  const toggleMute = () => {
    if (!audioElement) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioElement.muted = newMutedState;
  };

  const handleSeek = (value: number) => {
    if (!audioElement) return;
    audioElement.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-lg">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Song info and progress */}
        {audioElement && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-medium truncate max-w-md">
                {songName || 'Unknown Track'}
              </h3>
              <span className="text-gray-400 text-sm tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-colors"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Song</span>
            </button>

            {/* Shader selector */}
            <div className="relative">
              <Sparkles className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
              <select
                value={currentShader}
                onChange={(e) => onShaderChange(parseInt(e.target.value))}
                className="pl-10 pr-4 py-2.5 bg-gray-900/80 backdrop-blur-sm text-white rounded-lg border border-gray-700 hover:border-cyan-500 focus:border-cyan-500 focus:outline-none transition-colors font-medium appearance-none cursor-pointer"
              >
                {shaderNames.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Random mode checkbox */}
            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer group">
              <input
                type="checkbox"
                checked={isRandomMode}
                onChange={(e) => setIsRandomMode(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
              />
              <Shuffle className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              <span className="text-white font-medium text-sm">Random</span>
            </label>

            {/* Randomize Colors button */}
            <button
              onClick={onRandomizeColors}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105"
            >
              <Palette className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Play/Pause */}
          {audioElement && (
            <button
              onClick={togglePlayPause}
              className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
              disabled={!audioElement}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              )}
            </button>
          )}

          {/* Volume control */}
          {audioElement && (
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        {!audioElement && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Upload a song to see the audio-reactive visualization
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
