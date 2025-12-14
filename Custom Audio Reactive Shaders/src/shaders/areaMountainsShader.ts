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

  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  float mountainLine(float x, float t, float offset, float audioMod) {
    float y = 0.0;
    y += sin(x * 2.0 + t + offset) * 0.1;
    y += sin(x * 4.0 - t * 1.5 + offset) * 0.05;
    y += noise(x * 3.0 + t * 0.5 + offset) * 0.08;
    y += audioMod * 0.15;
    return y + 0.3;
  }

  void main() {
    vec2 uv = vUv;

    float time = uTime * 0.5;

    vec3 color = vec3(0.0);

    float numLayers = 4.0;

    for (float i = 0.0; i < numLayers; i++) {
      float layerOffset = i * 1.5;
      float depth = (numLayers - i) / numLayers;

      float audioMod = uAudioBass * depth * 0.5 + uAudioMid * (1.0 - depth) * 0.3;
      float lineY = mountainLine(uv.x * 3.0, time, layerOffset, audioMod);
      lineY = lineY * 0.6 + 0.2 + i * 0.1;

      float fillMask = step(uv.y, lineY);

      float hue = 0.5 + i * 0.15 + time * 0.02 + uColorOffset / (2.0 * PI);
      float sat = 0.7 - i * 0.1;
      float val = 0.5 + depth * 0.3;

      vec3 layerColor = hsv2rgb(vec3(hue, sat, val));

      float edge = smoothstep(0.01, 0.0, abs(uv.y - lineY));
      layerColor += edge * vec3(0.5, 0.7, 1.0) * 0.5;

      float gradient = 1.0 - (uv.y / lineY) * 0.3;
      layerColor *= gradient;

      color = mix(color, layerColor, fillMask);
    }

    vec3 bgColor = vec3(0.02, 0.02, 0.05);
    color = mix(bgColor, color, step(0.001, length(color)));

    float glow = uAudioFrequency * 0.1;
    color += vec3(0.3, 0.5, 0.7) * glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;
