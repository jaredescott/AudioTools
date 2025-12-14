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

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;

    float time = uTime;

    vec3 color = vec3(0.0);

    float gridSize = 40.0;
    vec2 gridUv = uv * vec2(gridSize, gridSize * 0.5);
    vec2 gridId = floor(gridUv);
    vec2 gridPos = fract(gridUv);

    float waveHeight = sin(gridId.x * 0.3 + time * 2.0) * 0.5 + 0.5;
    waveHeight += sin(gridId.x * 0.15 - time * 1.5) * 0.3;
    waveHeight = waveHeight * 0.4 + 0.1;
    waveHeight += uAudioBass * 0.3;
    waveHeight += uAudioMid * sin(gridId.x * 0.2) * 0.2;

    float targetY = 0.5 - waveHeight;

    float particleActive = step(gridId.y / (gridSize * 0.5), 1.0 - waveHeight);

    float distToCenter = length(gridPos - 0.5);
    float particleSize = 0.3 + uAudioFrequency * 0.2;
    float particle = smoothstep(particleSize, particleSize * 0.5, distToCenter);

    float hue = gridId.x / gridSize + time * 0.1 + uColorOffset / (2.0 * PI);
    hue += gridId.y / (gridSize * 0.5) * 0.3;

    float sat = 0.8;
    float val = particle * particleActive;

    vec3 particleColor = hsv2rgb(vec3(hue, sat, val));

    float glow = exp(-distToCenter * 3.0) * 0.3 * particleActive;
    particleColor += glow;

    color += particleColor;

    vec3 bgColor = vec3(0.02, 0.01, 0.05);
    color = mix(bgColor, color, step(0.001, length(color)));

    gl_FragColor = vec4(color, 1.0);
  }
`;
