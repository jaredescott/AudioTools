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

  float wave(float x, float t, float offset, float audioMod) {
    return sin(x * 8.0 - t * 2.0 + offset) * 0.1 * (1.0 + audioMod) + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    float time = uTime;

    vec3 color = vec3(0.0);

    float numWaves = 5.0;

    for (float i = 0.0; i < numWaves; i++) {
      float offset = i * PI * 0.4;
      float waveY = wave(uv.x, time, offset, uAudioBass * 0.3 + uAudioMid * 0.2);
      waveY += sin(uv.x * 3.0 + time + i) * 0.05 * uAudioFrequency;

      float dist = abs(uv.y - waveY);
      float thickness = 0.02 + uAudioBass * 0.01;
      float alpha = smoothstep(thickness, thickness * 0.3, dist);
      alpha = 1.0 - alpha;

      float glow = exp(-dist * 20.0) * 0.5;

      float hue = i / numWaves * 0.3 + time * 0.05 + 0.5 + uColorOffset / (2.0 * PI);
      float sat = 0.9;
      float val = 1.0;

      vec3 waveColor = hsv2rgb(vec3(hue, sat, val));

      color += waveColor * (alpha + glow);
    }

    vec3 bgGradient = mix(
      vec3(0.05, 0.0, 0.1),
      vec3(0.1, 0.05, 0.15),
      uv.y
    );

    color += bgGradient;

    float vignette = 1.0 - length(uv - 0.5) * 0.5;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
