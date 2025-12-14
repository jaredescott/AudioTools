import { useEffect, useRef, useState } from 'react';

export type VisualizationMode = 'circular' | 'lissajous' | 'polar' | 'linear' | '3d-lissajous';

interface AudioGoniometerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null;
  gain: number;
  persistence: number;
  visualizationMode: VisualizationMode;
  shapeType?: string;
  onShapeDetected?: (shape: string) => void;
}

export default function AudioGoniometer({
  audioContext,
  sourceNode,
  gain,
  persistence,
  visualizationMode,
  shapeType = 'lissajous',
  onShapeDetected
}: AudioGoniometerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserLeftRef = useRef<AnalyserNode | null>(null);
  const analyserRightRef = useRef<AnalyserNode | null>(null);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0.3 });
  const historyRef = useRef<Array<{left: number[], right: number[]}>>([]);
  const [autoShape, setAutoShape] = useState('lissajous');
  const shapeChangeTimerRef = useRef<number>(0);

  useEffect(() => {
    historyRef.current = [];
  }, [visualizationMode, shapeType]);

  useEffect(() => {
    if (!audioContext || !sourceNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const splitter = audioContext.createChannelSplitter(2);
    analyserLeftRef.current = audioContext.createAnalyser();
    analyserRightRef.current = audioContext.createAnalyser();

    analyserLeftRef.current.fftSize = 2048;
    analyserRightRef.current.fftSize = 2048;

    sourceNode.connect(splitter);
    splitter.connect(analyserLeftRef.current, 0);
    splitter.connect(analyserRightRef.current, 1);

    const bufferLength = analyserLeftRef.current.frequencyBinCount;
    const leftData = new Uint8Array(bufferLength);
    const rightData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(analyserLeftRef.current.frequencyBinCount);

    const analyzeMusicalCharacteristics = (): string => {
      analyserLeftRef.current?.getByteFrequencyData(frequencyData);

      const sampleRate = audioContext.sampleRate;
      const nyquist = sampleRate / 2;
      const binWidth = nyquist / frequencyData.length;

      const noteFrequencies = [
        { name: 'C', freq: 261.63 }, { name: 'C#', freq: 277.18 },
        { name: 'D', freq: 293.66 }, { name: 'D#', freq: 311.13 },
        { name: 'E', freq: 329.63 }, { name: 'F', freq: 349.23 },
        { name: 'F#', freq: 369.99 }, { name: 'G', freq: 392.00 },
        { name: 'G#', freq: 415.30 }, { name: 'A', freq: 440.00 },
        { name: 'A#', freq: 466.16 }, { name: 'B', freq: 493.88 }
      ];

      let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
      let dominantFreq = 0;
      let maxMagnitude = 0;

      for (let i = 0; i < frequencyData.length; i++) {
        const freq = i * binWidth;
        const magnitude = frequencyData[i];

        if (freq < 250) lowEnergy += magnitude;
        else if (freq < 2000) midEnergy += magnitude;
        else highEnergy += magnitude;

        if (magnitude > maxMagnitude) {
          maxMagnitude = magnitude;
          dominantFreq = freq;
        }
      }

      const totalEnergy = lowEnergy + midEnergy + highEnergy;
      if (totalEnergy < 100) return autoShape;

      const lowRatio = lowEnergy / totalEnergy;
      const midRatio = midEnergy / totalEnergy;
      const highRatio = highEnergy / totalEnergy;

      let closestNote = '';
      let minDiff = Infinity;
      for (const note of noteFrequencies) {
        for (let octave = 0; octave < 4; octave++) {
          const freq = note.freq * Math.pow(2, octave);
          const diff = Math.abs(dominantFreq - freq);
          if (diff < minDiff) {
            minDiff = diff;
            closestNote = note.name;
          }
        }
      }

      if (lowRatio > 0.5) return 'torus';
      else if (highRatio > 0.4) return 'spiral';
      else if (midRatio > 0.5 && (closestNote === 'C' || closestNote === 'G' || closestNote === 'F')) return 'sphere';
      else if (closestNote.includes('#')) return 'knot';
      else if (midRatio > highRatio && lowRatio < 0.3) return 'rose';
      else return 'lissajous';
    };

    const drawCircularGuides = (centerX: number, centerY: number) => {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rad) * 180,
          centerY + Math.sin(rad) * 180
        );
        ctx.stroke();
      }
    };

    const drawLinearGuides = (centerX: number, centerY: number) => {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;

      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 50;
        ctx.beginPath();
        ctx.moveTo(0, centerY + offset);
        ctx.lineTo(canvas.width, centerY + offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + offset, 0);
        ctx.lineTo(centerX + offset, canvas.height);
        ctx.stroke();
      }
    };

    const drawPolarGuides = (centerX: number, centerY: number) => {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      ctx.lineWidth = 1;

      for (let r = 50; r <= 200; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rad) * 200,
          centerY + Math.sin(rad) * 200
        );
        ctx.stroke();
      }
    };

    const project3D = (x: number, y: number, z: number, centerX: number, centerY: number) => {
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);

      let y1 = y * cosX - z * sinX;
      let z1 = y * sinX + z * cosX;

      let x1 = x * cosY + z1 * sinY;
      let z2 = -x * sinY + z1 * cosY;

      const perspective = 300;
      const scale = perspective / (perspective + z2 + 100);
      return {
        x: centerX + x1 * scale,
        y: centerY - y1 * scale,
        z: z2
      };
    };

    const draw3DAxes = (centerX: number, centerY: number) => {
      const axisLength = 80;

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const xAxis1 = project3D(-axisLength, 0, 0, centerX, centerY);
      const xAxis2 = project3D(axisLength, 0, 0, centerX, centerY);
      ctx.moveTo(xAxis1.x, xAxis1.y);
      ctx.lineTo(xAxis2.x, xAxis2.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.beginPath();
      const yAxis1 = project3D(0, -axisLength, 0, centerX, centerY);
      const yAxis2 = project3D(0, axisLength, 0, centerX, centerY);
      ctx.moveTo(yAxis1.x, yAxis1.y);
      ctx.lineTo(yAxis2.x, yAxis2.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.beginPath();
      const zAxis1 = project3D(0, 0, -axisLength, centerX, centerY);
      const zAxis2 = project3D(0, 0, axisLength, centerX, centerY);
      ctx.moveTo(zAxis1.x, zAxis1.y);
      ctx.lineTo(zAxis2.x, zAxis2.y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('L', xAxis2.x + 10, xAxis2.y);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.fillText('R', yAxis2.x + 10, yAxis2.y);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.fillText('T', zAxis2.x + 10, zAxis2.y);
    };

    const draw = () => {
      if (!analyserLeftRef.current || !analyserRightRef.current) return;

      analyserLeftRef.current.getByteTimeDomainData(leftData);
      analyserRightRef.current.getByteTimeDomainData(rightData);

      if (visualizationMode === '3d-lissajous') {
        shapeChangeTimerRef.current++;
        if (shapeChangeTimerRef.current % 30 === 0) {
          const newShape = analyzeMusicalCharacteristics();
          if (newShape !== autoShape) {
            setAutoShape(newShape);
            onShapeDetected?.(newShape);
          }
        }
      }

      const fadeAmount = visualizationMode === '3d-lissajous' ? 0.05 : (1 - persistence);
      const bgColor = visualizationMode === '3d-lissajous' ? '0, 0, 0' : '15, 23, 42';

      if (persistence === 0 && visualizationMode !== '3d-lissajous') {
        ctx.fillStyle = `rgb(${bgColor})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = `rgba(${bgColor}, ${fadeAmount})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (visualizationMode === 'circular') {
        drawCircularGuides(centerX, centerY);
      } else if (visualizationMode === 'linear') {
        drawLinearGuides(centerX, centerY);
      } else if (visualizationMode === 'polar') {
        drawPolarGuides(centerX, centerY);
      }

      if (visualizationMode === '3d-lissajous') {
        let avgAmplitude = 0;
        for (let i = 0; i < bufferLength; i++) {
          const left = Math.abs((leftData[i] - 128) / 128);
          const right = Math.abs((rightData[i] - 128) / 128);
          avgAmplitude += (left + right) / 2;
        }
        avgAmplitude = avgAmplitude / bufferLength;

        const numCurves = 30;
        const pointsPerCurve = 150;
        const amplitude = 100 * gain * (0.5 + avgAmplitude * 3);

        for (let curveIdx = 0; curveIdx < numCurves; curveIdx++) {
          const progress = curveIdx / numCurves;
          const age = 1 - progress;
          const alpha = 0.2 * age * (0.5 + avgAmplitude * 2);

          ctx.strokeStyle = `rgba(244, 114, 182, ${alpha})`;
          ctx.lineWidth = 1.2 * age;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(244, 114, 182, ${alpha * 0.6})`;
          ctx.beginPath();
          let hasStarted = false;

          for (let pointIdx = 0; pointIdx <= pointsPerCurve; pointIdx++) {
            const t = (pointIdx / pointsPerCurve) * Math.PI * 2;
            let x3d = 0, y3d = 0, z3d = 0;

            switch (autoShape) {
              case 'lissajous': {
                const freqRatioX = 3 + Math.sin(rotation.x * 2 + progress * Math.PI) * 0.5;
                const freqRatioY = 2 + Math.cos(rotation.y * 2 + progress * Math.PI) * 0.5;
                const freqRatioZ = 4 + Math.sin((rotation.x + rotation.y) + progress * Math.PI) * 0.5;
                const phaseOffset = progress * Math.PI * 2;
                const zOffset = (progress - 0.5) * 150;
                x3d = Math.sin(t * freqRatioX + phaseOffset) * amplitude;
                y3d = Math.sin(t * freqRatioY + phaseOffset + Math.PI / 4) * amplitude;
                z3d = Math.sin(t * freqRatioZ + phaseOffset) * 50 + zOffset;
                break;
              }
              case 'sphere': {
                const lat = (progress - 0.5) * Math.PI;
                const lon = t;
                const radius = amplitude * 0.8;
                x3d = radius * Math.cos(lat) * Math.cos(lon);
                y3d = radius * Math.cos(lat) * Math.sin(lon);
                z3d = radius * Math.sin(lat);
                break;
              }
              case 'torus': {
                const R = amplitude * 0.6;
                const r = amplitude * 0.3;
                const u = t;
                const v = progress * Math.PI * 2;
                x3d = (R + r * Math.cos(v)) * Math.cos(u);
                y3d = (R + r * Math.cos(v)) * Math.sin(u);
                z3d = r * Math.sin(v);
                break;
              }
              case 'spiral': {
                const radius = amplitude * 0.5 * (1 - progress);
                const height = (progress - 0.5) * 200;
                const spiralSpeed = 3 + rotation.x;
                x3d = radius * Math.cos(t * spiralSpeed);
                y3d = radius * Math.sin(t * spiralSpeed);
                z3d = height + Math.sin(t * 5) * 20;
                break;
              }
              case 'knot': {
                const p = 2 + Math.sin(rotation.x) * 0.5;
                const q = 3 + Math.cos(rotation.y) * 0.5;
                const scale = amplitude * 0.4;
                const phase = progress * Math.PI * 2;
                x3d = scale * (Math.cos(t * p) + 2 * Math.cos(t * q) + Math.sin(phase));
                y3d = scale * (Math.sin(t * p) + 2 * Math.sin(t * q) + Math.cos(phase));
                z3d = scale * (-Math.sin(t * p * 3) + Math.cos(phase) * 2);
                break;
              }
              case 'rose': {
                const k = 3 + Math.sin(rotation.x + progress * Math.PI) * 2;
                const r = Math.cos(k * t) * amplitude * 0.7;
                const zLayer = (progress - 0.5) * 120;
                x3d = r * Math.cos(t);
                y3d = r * Math.sin(t);
                z3d = zLayer + Math.sin(t * 8) * 15;
                break;
              }
            }

            const projected = project3D(x3d, y3d, z3d, centerX, centerY);

            if (!hasStarted) {
              ctx.moveTo(projected.x, projected.y);
              hasStarted = true;
            } else {
              ctx.lineTo(projected.x, projected.y);
            }
          }
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = 'rgb(34, 197, 94)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.beginPath();

        let hasStarted = false;

        for (let i = 0; i < bufferLength; i++) {
          const left = (leftData[i] - 128) / 128;
          const right = (rightData[i] - 128) / 128;

          let x: number, y: number;

          if (visualizationMode === 'lissajous') {
            x = centerX + left * 180 * gain;
            y = centerY - right * 180 * gain;
          } else if (visualizationMode === 'polar') {
            const angle = Math.atan2(right, left);
            const magnitude = Math.sqrt(left * left + right * right);
            x = centerX + Math.cos(angle) * magnitude * 180 * gain;
            y = centerY + Math.sin(angle) * magnitude * 180 * gain;
          } else {
            const mid = (left + right) / 2;
            const side = (left - right) / 2;
            x = centerX + side * 180 * gain;
            y = centerY - mid * 180 * gain;
          }

          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      let correlation = 0;
      let leftSum = 0;
      let rightSum = 0;

      for (let i = 0; i < bufferLength; i++) {
        const left = (leftData[i] - 128) / 128;
        const right = (rightData[i] - 128) / 128;
        correlation += left * right;
        leftSum += left * left;
        rightSum += right * right;
      }

      const denominator = Math.sqrt(leftSum * rightSum);
      const phaseCorrelation = denominator > 0 ? correlation / denominator : 0;

      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`Phase: ${(phaseCorrelation * 100).toFixed(1)}%`, 10, 20);

      if (visualizationMode === '3d-lissajous') {
        setRotation(prev => ({
          x: prev.x + 0.004,
          y: prev.y + 0.005
        }));
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      splitter.disconnect();
      if (analyserLeftRef.current) analyserLeftRef.current.disconnect();
      if (analyserRightRef.current) analyserRightRef.current.disconnect();
    };
  }, [audioContext, sourceNode, gain, persistence, visualizationMode]);

  const getVisualizationDescription = () => {
    switch (visualizationMode) {
      case 'circular':
        return 'Horizontal = Stereo Width • Vertical = Phase • Center = Mono';
      case 'lissajous':
        return 'X-axis = Left Channel • Y-axis = Right Channel • Classic oscilloscope view';
      case 'polar':
        return 'Angle = Phase • Radius = Magnitude • Circular pattern shows stereo field';
      case 'linear':
        return 'Mid/Side encoding • Horizontal = Stereo • Vertical = Mono content';
      case '3d-lissajous':
        return 'X = Left • Y = Right • Z = Time • 3D path traces stereo relationships';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="bg-slate-900 rounded-lg shadow-2xl border-2 border-slate-700"
      />
      <div className="text-sm text-slate-400 text-center max-w-md">
        <p className="font-semibold text-slate-300 mb-1">
          {visualizationMode.charAt(0).toUpperCase() + visualizationMode.slice(1)} Mode
        </p>
        <p>{getVisualizationDescription()}</p>
      </div>
    </div>
  );
}
