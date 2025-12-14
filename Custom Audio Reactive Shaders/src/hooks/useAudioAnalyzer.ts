import { useEffect, useRef, useState } from 'react';

export interface AudioData {
  frequency: number;
  bass: number;
  mid: number;
  treble: number;
  average: number;
}

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const [audioData, setAudioData] = useState<AudioData>({
    frequency: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    average: 0,
  });

  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!audioElement) return;

    const setupAudio = () => {
      if (audioContextRef.current) return;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.7;

      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;
    };

    const analyze = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;

      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);

      const dataArray = dataArrayRef.current;
      const length = dataArray.length;

      // Calculate different frequency ranges
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

      // Get the 2nd bin for kick drum detection (as mentioned in the article)
      const frequency = (dataArray[2] || 0) / 255;

      setAudioData({
        frequency,
        bass,
        mid,
        treble,
        average,
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    setupAudio();
    analyze();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioElement]);

  return audioData;
}
