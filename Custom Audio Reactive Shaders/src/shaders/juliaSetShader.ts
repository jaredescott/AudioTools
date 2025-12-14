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
  #define MAX_ITERATIONS 150

  vec2 complexMult(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 3.0;
    float zoom = 1.0 + uAudioBass * 0.5;
    uv /= zoom;

    vec2 c = vec2(
      cos(uTime * 0.3) * 0.7 + sin(uTime * 0.2) * 0.2,
      sin(uTime * 0.3) * 0.7 + cos(uTime * 0.15) * 0.2
    );

    c.x += uAudioMid * 0.3;
    c.y += uAudioFrequency * 0.3;

    vec2 z = uv;
    float iterations = 0.0;
    float maxIter = float(MAX_ITERATIONS);

    for (int i = 0; i < MAX_ITERATIONS; i++) {
      if (length(z) > 4.0) break;

      z = complexMult(z, z) + c;
      iterations += 1.0;
    }

    if (iterations >= maxIter) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      float t = iterations / maxIter;
      t = sqrt(t);

      float hue = t * 3.0 + uTime * 0.1 + uAudioFrequency * 0.5 + uColorOffset / (2.0 * PI);
      float sat = 0.8 + uAudioMid * 0.2;
      float val = 0.6 + t * 0.4 + uAudioBass * 0.3;

      vec3 color = hsv2rgb(vec3(hue, sat, val));

      float glow = exp(-iterations * 0.05) * uAudioFrequency * 0.5;
      color += vec3(glow * 0.5, glow * 0.3, glow);

      gl_FragColor = vec4(color, 1.0);
    }
  }
`;
