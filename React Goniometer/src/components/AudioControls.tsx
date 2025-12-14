import { useState, useRef } from 'react';
import { Mic, Music, Play, Pause, Upload } from 'lucide-react';

interface AudioControlsProps {
  onAudioContextChange: (context: AudioContext | null) => void;
  onSourceNodeChange: (node: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null) => void;
}

export default function AudioControls({ onAudioContextChange, onSourceNodeChange }: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopAllAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsPlaying(false);
    setIsMicActive(false);
    onSourceNodeChange(null);
  };

  const handleMicToggle = async () => {
    if (isMicActive) {
      stopAllAudio();
      return;
    }

    try {
      stopAllAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        onAudioContextChange(audioContextRef.current);
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      onSourceNodeChange(source);
      setIsMicActive(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    stopAllAudio();

    const url = URL.createObjectURL(file);
    setSelectedFile(file.name);

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.loop = true;
    }

    audioElementRef.current.src = url;
    audioElementRef.current.load();
  };

  const handlePlayPause = async () => {
    if (!audioElementRef.current || !audioElementRef.current.src) {
      fileInputRef.current?.click();
      return;
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        onAudioContextChange(audioContextRef.current);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaElementSource(audioElementRef.current);
      source.connect(audioContextRef.current.destination);
      onSourceNodeChange(source);

      await audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">Audio Input</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleMicToggle}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            isMicActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          <Mic size={20} />
          {isMicActive ? 'Stop Mic' : 'Microphone'}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-all"
        >
          <Upload size={20} />
          Select File
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {selectedFile && (
        <div className="bg-slate-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Music size={18} />
            <span className="text-sm truncate">{selectedFile}</span>
          </div>

          <button
            onClick={handlePlayPause}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              isPlaying
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={20} />
                Pause
              </>
            ) : (
              <>
                <Play size={20} />
                Play
              </>
            )}
          </button>
        </div>
      )}

      {!selectedFile && !isMicActive && (
        <div className="text-center py-6 text-slate-400 text-sm">
          Select an audio source to begin visualization
        </div>
      )}
    </div>
  );
}
