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

    float time = uTime * 0.5;
    float bassTime = time + uAudioBass * 2.0;

    float plasma = 0.0;

    plasma += sin((uv.x + time) * 3.0);
    plasma += sin((uv.y + time) * 4.0);
    plasma += sin((uv.x + uv.y + time) * 3.0);

    vec2 center = vec2(
      sin(time * 0.5) * 0.3,
      cos(time * 0.3) * 0.3
    );
    float dist = length(uv - center);
    plasma += sin(dist * 8.0 - bassTime * 2.0);

    center = vec2(
      cos(time * 0.7) * 0.4,
      sin(time * 0.4) * 0.4
    );
    dist = length(uv - center);
    plasma += sin(dist * 6.0 + bassTime);

    plasma += sin(length(uv) * 5.0 - time * 2.0);

    plasma += uAudioMid * sin(uv.x * 10.0 + time * 3.0);
    plasma += uAudioFrequency * cos(uv.y * 10.0 - time * 3.0);

    plasma /= 7.0;
    plasma += uAudioBass * 0.5;

    float hue = plasma * 0.5 + 0.5 + time * 0.1 + uColorOffset / (2.0 * PI);
    float sat = 0.7 + uAudioMid * 0.3;
    float val = 0.6 + plasma * 0.3 + uAudioFrequency * 0.2;

    vec3 color = hsv2rgb(vec3(hue, sat, val));

    float wave = sin(plasma * PI * 4.0 + uAudioBass * 2.0) * 0.5 + 0.5;
    color += wave * uAudioFrequency * vec3(0.3, 0.5, 0.7);

    float vignette = 1.0 - length(uv) * 0.3;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
