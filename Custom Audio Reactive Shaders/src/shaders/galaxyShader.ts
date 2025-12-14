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

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    vec2 originalUv = uv;

    float time = uTime * 0.15;

    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    angle += time * 0.2 + uAudioBass * 0.3;
    uv = vec2(cos(angle), sin(angle)) * radius;

    uv *= rot(time * 0.1);

    vec2 starUv = originalUv * 5.0;
    starUv *= rot(time * 0.05);

    float stars = 0.0;
    for (int i = 0; i < 3; i++) {
      vec2 offset = vec2(float(i) * 123.45, float(i) * 67.89);
      float starField = hash(floor(starUv + offset));

      if (starField > 0.98) {
        vec2 starPos = fract(starUv + offset) - 0.5;
        float starDist = length(starPos);
        float flicker = 0.5 + 0.5 * sin(time * 10.0 + float(i) * 100.0);
        float twinkle = smoothstep(0.02, 0.001, starDist) * flicker;
        stars += twinkle;
      }

      starUv *= 1.5;
    }

    vec2 nebulaUv = uv * 2.0;
    nebulaUv += vec2(
      fbm(uv * 2.0 + time * 0.3),
      fbm(uv * 2.0 - time * 0.2)
    ) * 0.5;

    float nebula1 = fbm(nebulaUv * 3.0 + time * 0.2);
    float nebula2 = fbm(nebulaUv * 2.0 - time * 0.15);

    nebula1 = pow(nebula1, 2.0);
    nebula2 = pow(nebula2, 2.0);

    nebula1 += uAudioBass * 0.3;
    nebula2 += uAudioMid * 0.3;

    vec3 color1 = palette(
      nebula1,
      vec3(0.5, 0.5, 0.5),
      vec3(0.5, 0.5, 0.5),
      vec3(1.0, 0.7, 0.4),
      vec3(0.0, 0.15, 0.20)
    );

    vec3 color2 = palette(
      nebula2,
      vec3(0.5, 0.5, 0.5),
      vec3(0.5, 0.5, 0.5),
      vec3(0.8, 0.2, 1.0),
      vec3(0.3, 0.2, 0.2)
    );

    vec3 nebulaColor = mix(color1, color2, 0.5);
    nebulaColor *= 0.6;

    float spiral = sin(angle * 3.0 + radius * 8.0 - time * 2.0 + uAudioBass * 2.0);
    spiral = smoothstep(0.2, 0.8, spiral);
    nebulaColor += spiral * 0.3 * vec3(0.8, 0.6, 1.0) * (1.0 - radius * 0.5);

    vec2 dustUv = uv * 10.0 + time * 0.1;
    float dust = fbm(dustUv);
    dust = pow(dust, 3.0);
    vec3 dustColor = vec3(0.4, 0.3, 0.5) * dust * 0.3;

    vec3 finalColor = nebulaColor + dustColor;

    finalColor += stars * vec3(1.0, 0.95, 0.9) * (1.5 + uAudioFrequency * 0.5);

    float coreGlow = 1.0 / (radius * 3.0 + 0.5);
    coreGlow = pow(coreGlow, 2.0) * 0.3;
    coreGlow *= (1.0 + uAudioBass * 0.5);
    finalColor += coreGlow * vec3(0.9, 0.7, 1.0);

    float vignette = 1.0 - smoothstep(0.5, 1.5, radius);
    finalColor *= vignette;

    float bassGlow = uAudioBass * 0.1;
    finalColor += bassGlow * vec3(0.5, 0.3, 0.8);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
