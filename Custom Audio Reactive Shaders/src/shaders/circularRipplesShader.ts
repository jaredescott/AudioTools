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

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;

    float time = uTime;

    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    float numRings = 20.0 + uAudioBass * 10.0;
    float ringPattern = sin(radius * numRings - time * 3.0) * 0.5 + 0.5;

    float audioWarp = sin(angle * 8.0 + time * 2.0) * uAudioMid * 0.1;
    audioWarp += sin(angle * 4.0 - time) * uAudioFrequency * 0.1;

    float warpedRadius = radius + audioWarp;
    float warpedRings = sin(warpedRadius * numRings - time * 3.0) * 0.5 + 0.5;

    float radialLines = sin(angle * 32.0 + time) * 0.5 + 0.5;
    radialLines = pow(radialLines, 3.0);

    float shape = warpedRings;
    shape += radialLines * 0.3;

    float hue = angle / (2.0 * PI) + time * 0.1 + uColorOffset / (2.0 * PI);
    hue += warpedRadius * 0.2;

    float sat = 0.8 + uAudioMid * 0.2;
    float val = shape * 0.8 + 0.2;

    vec3 color = hsv2rgb(vec3(hue, sat, val));

    float centerGlow = exp(-radius * 2.0) * 0.5;
    centerGlow *= (1.0 + uAudioBass);
    color += centerGlow * vec3(1.0, 0.8, 0.5);

    float edgeGlow = smoothstep(0.02, 0.0, abs(fract(warpedRadius * numRings - time * 3.0) - 0.5) * 2.0);
    color += edgeGlow * vec3(1.0, 0.9, 0.7) * 0.5;

    float vignette = 1.0 - smoothstep(0.5, 1.2, radius);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
