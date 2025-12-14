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

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  vec3 voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec2 mg, mr;
    float md = 8.0;

    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);

        o = 0.5 + 0.5 * sin(uTime * 0.5 + 6.2831 * o + uAudioBass * 2.0);

        vec2 r = g + o - f;
        float d = dot(r, r);

        if (d < md) {
          md = d;
          mr = r;
          mg = g;
        }
      }
    }

    md = 8.0;
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        vec2 g = mg + vec2(float(i), float(j));
        vec2 o = hash2(n + g);

        o = 0.5 + 0.5 * sin(uTime * 0.5 + 6.2831 * o + uAudioBass * 2.0);

        vec2 r = g + o - f;

        if (dot(mr - r, mr - r) > 0.00001) {
          md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
        }
      }
    }

    return vec3(md, mr);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = vUv * 6.0 * (1.0 + uAudioMid * 0.5);

    vec3 vor = voronoi(uv);
    float dist = vor.x;

    float cells = smoothstep(0.0, 0.05, dist);
    cells = cells * cells * (3.0 - 2.0 * cells);

    float edges = 1.0 - smoothstep(0.0, 0.08, dist);

    vec2 cellId = floor(uv) + 0.5 * vor.yz;
    float cellHash = fract(sin(dot(cellId, vec2(12.9898, 78.233))) * 43758.5453);

    float hue = cellHash + uTime * 0.1 + uAudioFrequency * 0.5 + uColorOffset / (2.0 * PI);
    float sat = 0.6 + uAudioMid * 0.4;
    float val = cells * (0.4 + uAudioBass * 0.3);

    vec3 color = hsv2rgb(vec3(hue, sat, val));

    vec3 edgeColor = vec3(0.8, 0.9, 1.0) * (1.0 + uAudioFrequency);
    color = mix(color, edgeColor, edges);

    float pulse = sin(uTime * 2.0 + cellHash * 6.28) * 0.5 + 0.5;
    color += pulse * uAudioBass * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;
