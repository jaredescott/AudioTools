export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uAudioFrequency;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform float uColorOffset;

  #define PI 3.14159265359

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;

    float numBars = 64.0;
    float barIndex = floor(uv.x * numBars);
    float barX = fract(uv.x * numBars);

    float time = uTime * 2.0;

    float freq = hash(barIndex * 0.1 + floor(time * 2.0) * 0.01);
    freq = freq * 0.3 + 0.1;
    freq += sin(time * 3.0 + barIndex * 0.5) * 0.1;
    freq += uAudioFrequency * 0.4;
    freq += uAudioBass * sin(barIndex * 0.2) * 0.3;
    freq += uAudioMid * cos(barIndex * 0.3) * 0.2;

    float barWidth = 0.7;
    float barMask = smoothstep(barWidth, barWidth - 0.1, abs(barX - 0.5) * 2.0);

    float barHeight = freq;
    float heightMask = smoothstep(barHeight, barHeight - 0.02, 1.0 - uv.y);

    float hue = barIndex / numBars + time * 0.1 + uColorOffset / (2.0 * PI);
    float sat = 0.8;
    float val = heightMask * barMask;

    vec3 color = hsv2rgb(vec3(hue, sat, val * 1.2));

    float glow = heightMask * barMask * 0.3;
    color += glow;

    float edge = 1.0 - smoothstep(barHeight - 0.01, barHeight, 1.0 - uv.y);
    color += edge * barMask * vec3(1.0, 1.0, 1.0) * 0.5;

    vec3 bgColor = vec3(0.05, 0.05, 0.1);
    color = mix(bgColor, color, barMask * heightMask);

    gl_FragColor = vec4(color, 1.0);
  }
`;
