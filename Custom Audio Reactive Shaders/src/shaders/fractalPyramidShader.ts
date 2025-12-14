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
  uniform vec2 uResolution;
  uniform float uColorOffset;

  vec3 palette(float d) {
    return mix(vec3(0.2, 0.7, 0.9), vec3(1.0, 0.0, 1.0), d);
  }

  vec2 rotate(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return p * mat2(c, s, -s, c);
  }

  float map(vec3 p) {
    for(int i = 0; i < 8; ++i) {
      float t = uTime * 0.2;
      p.xz = rotate(p.xz, t + uAudioBass * 0.5);
      p.xy = rotate(p.xy, t * 1.89 + uAudioMid * 0.3);
      p.xz = abs(p.xz);
      p.xz -= 0.5;
    }
    return dot(sign(p), p) / 5.0;
  }

  vec4 rm(vec3 ro, vec3 rd) {
    float t = 0.0;
    vec3 col = vec3(0.0);
    float d;

    for(float i = 0.0; i < 64.0; i++) {
      vec3 p = ro + rd * t;
      d = map(p) * 0.5;

      if(d < 0.02) {
        break;
      }
      if(d > 100.0) {
        break;
      }

      float colorIntensity = length(p) * 0.1;
      col += palette(colorIntensity + uAudioFrequency * 0.3) / (400.0 * d);
      t += d;
    }

    return vec4(col, 1.0 / (d * 100.0));
  }

  void main() {
    vec2 resolution = vec2(1920.0, 1080.0);
    vec2 uv = (vUv * resolution - resolution * 0.5) / resolution.x;

    vec3 ro = vec3(0.0, 0.0, -50.0);
    ro.xz = rotate(ro.xz, uTime);

    vec3 cf = normalize(-ro);
    vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
    vec3 cu = normalize(cross(cf, cs));

    vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;
    vec3 rd = normalize(uuv - ro);

    vec4 col = rm(ro, rd);

    gl_FragColor = col;
  }
`;
