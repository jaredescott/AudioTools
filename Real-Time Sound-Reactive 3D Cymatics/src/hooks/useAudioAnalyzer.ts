import { useEffect, useRef, useState, useCallback } from 'react';

export type AudioSource = 'microphone' | 'file' | 'none';

interface UseAudioAnalyzerReturn {
  frequencyData: Uint8Array;
  isActive: boolean;
  audioSource: AudioSource;
  startMicrophone: () => Promise<void>;
  stopAudio: () => void;
  loadAudioFile: (file: File) => Promise<void>;
  volume: number;
  setVolume: (volume: number) => void;
}

export const useAudioAnalyzer = (fftSize: number = 2048): UseAudioAnalyzerReturn => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(fftSize / 2));
  const [isActive, setIsActive] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>('none');
  const [volume, setVolume] = useState(1.0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = fftSize;
      analyzerRef.current.smoothingTimeConstant = 0.8;

      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;

      analyzerRef.current.connect(audioContextRef.current.destination);
    }
  }, [fftSize, volume]);

  const analyzeAudio = useCallback(() => {
    if (analyzerRef.current) {
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
      analyzerRef.current.getByteFrequencyData(dataArray);
      setFrequencyData(dataArray);
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);

  const startMicrophone = useCallback(async () => {
    try {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      initializeAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (audioContextRef.current && analyzerRef.current && gainNodeRef.current) {
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyzerRef.current);

        setIsActive(true);
        setAudioSource('microphone');
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }, [initializeAudioContext, analyzeAudio]);

  const loadAudioFile = useCallback(async (file: File) => {
    try {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      initializeAudioContext();

      const audioElement = new Audio();
      audioElement.crossOrigin = 'anonymous';

      const url = URL.createObjectURL(file);
      audioElement.src = url;
      audioElement.loop = true;
      audioElement.volume = volume;

      audioElementRef.current = audioElement;

      if (audioContextRef.current && analyzerRef.current && gainNodeRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(analyzerRef.current);

        await audioElement.play();

        setIsActive(true);
        setAudioSource('file');
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }, [initializeAudioContext, analyzeAudio, volume]);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setIsActive(false);
    setAudioSource('none');
    setFrequencyData(new Uint8Array(fftSize / 2));
  }, [fftSize]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return {
    frequencyData,
    isActive,
    audioSource,
    startMicrophone,
    stopAudio,
    loadAudioFile,
    volume,
    setVolume,
  };
};
