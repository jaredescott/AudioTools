import { useEffect, useRef, useState, useCallback } from 'react';

export interface AudioData {
  frequency: number;
  bass: number;
  mid: number;
  treble: number;
  average: number;
}

export type AudioSource = 'microphone' | 'file' | 'none';

interface UseAudioAnalyzerReturn {
  audioData: AudioData;
  isActive: boolean;
  audioSource: AudioSource;
  audioElement: HTMLAudioElement | null;
  isAudioReady: boolean;
  loadError: string | null;
  startMicrophone: () => Promise<void>;
  stopAudio: () => void;
  loadAudioFile: (file: File) => void;
  setLoadError: (error: string | null) => void;
}

const createDefaultAudioData = (): AudioData => ({
  frequency: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  average: 0,
});

export function useAudioAnalyzer(): UseAudioAnalyzerReturn {
  const [audioData, setAudioData] = useState<AudioData>(createDefaultAudioData);
  const [isActive, setIsActive] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>('none');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  const analyze = useCallback(() => {
    if (!analyzerRef.current || !dataArrayRef.current) return;

    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);

    const dataArray = dataArrayRef.current;
    const length = dataArray.length;

    const bassEnd = Math.floor(length * 0.1);
    const midEnd = Math.floor(length * 0.5);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let totalSum = 0;

    for (let i = 0; i < length; i++) {
      const value = dataArray[i] / 255;
      totalSum += value;

      if (i < bassEnd) {
        bassSum += value;
      } else if (i < midEnd) {
        midSum += value;
      } else {
        trebleSum += value;
      }
    }

    const bass = bassSum / bassEnd;
    const mid = midSum / (midEnd - bassEnd);
    const treble = trebleSum / (length - midEnd);
    const average = totalSum / length;
    const frequency = (dataArray[2] || 0) / 255;

    setAudioData({
      frequency,
      bass,
      mid,
      treble,
      average,
    });

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, []);

  const connectSource = useCallback(
    (source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode) => {
      if (!audioContextRef.current || !analyzerRef.current) return;

      sourceRef.current?.disconnect();
      sourceRef.current = source;
      source.connect(analyzerRef.current);
      analyzerRef.current.connect(audioContextRef.current.destination);

      setIsActive(true);
      animationFrameRef.current = requestAnimationFrame(analyze);
    },
    [analyze]
  );

  const startMicrophone = useCallback(async () => {
    try {
      stopAudio();

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.7;
      analyzerRef.current = analyzer;
      dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      connectSource(source);

      setAudioSource('microphone');
      setAudioElement(null);
      audioElementRef.current = null;
      setIsAudioReady(false);
      setLoadError(null);
    } catch (err) {
      console.error('Microphone access failed:', err);
      setLoadError('Microphone access denied. Please allow microphone permission.');
      throw err;
    }
  }, [connectSource]);

  const loadAudioFile = useCallback(
    (file: File) => {
      stopAudio();
      setLoadError(null);
      setIsAudioReady(false);

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.loop = true;

      audio.addEventListener('loadedmetadata', () => {
        // Will be used by AudioControls for duration
      });

      audio.addEventListener('canplay', () => {
        setIsAudioReady(true);
      });

      audio.addEventListener('error', () => {
        setLoadError('This file format may not be supported. Try MP3 or WAV.');
        setIsAudioReady(false);
      });

      audioElementRef.current = audio;
      setAudioElement(audio);

      const setupFileSource = () => {
        if (!audioContextRef.current || !analyzerRef.current || !dataArrayRef.current) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = ctx;

          const analyzer = ctx.createAnalyser();
          analyzer.fftSize = 512;
          analyzer.smoothingTimeConstant = 0.7;
          analyzerRef.current = analyzer;
          dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
        }

        const source = audioContextRef.current!.createMediaElementSource(audio);
        connectSource(source);
        setAudioSource('file');
      };

      if (audio.readyState >= 2) {
        setupFileSource();
        setIsAudioReady(true);
      } else {
        audio.addEventListener('canplay', setupFileSource, { once: true });
      }
    },
    [connectSource]
  );

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setAudioElement(null);

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyzerRef.current = null;
    dataArrayRef.current = null;

    setIsActive(false);
    setAudioSource('none');
    setIsAudioReady(false);
    setAudioData(createDefaultAudioData());
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return {
    audioData,
    isActive,
    audioSource,
    audioElement,
    isAudioReady,
    loadError,
    startMicrophone,
    stopAudio,
    loadAudioFile,
    setLoadError,
  };
}
