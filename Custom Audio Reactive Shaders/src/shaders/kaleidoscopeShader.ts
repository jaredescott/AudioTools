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

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.0;

    float time = uTime * 0.3;
    float bassRotation = uAudioBass * PI * 0.5;

    float segments = 8.0 + floor(uAudioMid * 8.0);

    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    angle += time + bassRotation;

    float sector = angle / (2.0 * PI / segments);
    float sectorFloor = floor(sector);
    float sectorFract = fract(sector);

    if (mod(sectorFloor, 2.0) > 0.5) {
      sectorFract = 1.0 - sectorFract;
    }

    angle = sectorFract * (2.0 * PI / segments);

    vec2 kaleidoUv = vec2(cos(angle), sin(angle)) * radius;

    kaleidoUv *= rot(time * 0.5);

    float tunnel = 1.0 / (radius + 0.1);
    kaleidoUv += tunnel * 0.1;

    kaleidoUv += vec2(
      sin(time * 2.0 + uAudioBass * 2.0) * 0.1,
      cos(time * 1.5 + uAudioMid * 2.0) * 0.1
    );

    float pattern = 0.0;

    pattern += sin(kaleidoUv.x * 10.0 + time * 2.0) * 0.5;
    pattern += cos(kaleidoUv.y * 10.0 - time * 2.0) * 0.5;
    pattern += sin((kaleidoUv.x + kaleidoUv.y) * 8.0 + time * 3.0) * 0.5;

    pattern += sin(radius * 15.0 - time * 4.0 + uAudioBass * 5.0) * 0.3;

    pattern += cos(tunnel * 10.0 + time * 2.0) * 0.4;

    pattern += uAudioFrequency * sin(angle * segments * 2.0 + time * 5.0) * 0.5;

    float hue = pattern * 0.2 + time * 0.1 + radius * 0.3 + uAudioMid * 0.3 + uColorOffset / (2.0 * PI);
    float sat = 0.8 + uAudioBass * 0.2;
    float val = 0.7 + pattern * 0.2 + uAudioFrequency * 0.3;

    vec3 color = hsv2rgb(vec3(hue, sat, val));

    float glow = 1.0 / (abs(sin(pattern * 5.0 + time * 2.0)) + 0.1);
    glow *= 0.1 * (1.0 + uAudioBass * 0.5);
    color += glow * vec3(0.5, 0.3, 0.8);

    float rings = sin(radius * 20.0 - time * 3.0 + uAudioBass * 5.0);
    rings = smoothstep(0.3, 0.7, rings);
    color += rings * 0.2 * vec3(1.0, 0.8, 0.6) * uAudioFrequency;

    float vignette = smoothstep(1.5, 0.3, radius);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
