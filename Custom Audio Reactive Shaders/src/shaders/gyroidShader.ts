export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vGyroid;
  varying float vNoise;

  uniform float uTime;
  uniform float uAudioFrequency;
  uniform float uAudioBass;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float gyroid(vec3 p, float scale) {
    vec3 s = p * scale;
    return dot(sin(s + uTime), cos(vec3(s.z, s.x, s.y) + uTime)) / scale;
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    // Scale controlled by audio - wider range for more dramatic effect
    float audioScale = 16.0 + uAudioBass * 40.0 + uAudioFrequency * 30.0;

    float gy = gyroid(pos, audioScale);
    vGyroid = gy;

    // Noise with audio-driven variation
    float noiseScale = 2000.0 + uAudioFrequency * 500.0;
    float n = snoise(pos * noiseScale + uTime);
    vNoise = n;

    float col = gy * n * 1.9;

    // More dramatic expansion tied to music
    float expansion = gy * 1.0 + col * 0.2;
    expansion *= (1.0 + uAudioBass * 1.5 + uAudioFrequency * 0.8);

    // Add pulsing based on audio
    float pulse = sin(uTime * 2.0 + uAudioBass * 10.0) * 0.1;
    expansion += pulse * uAudioBass;

    pos += normal * expansion;

    vPosition = pos;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vGyroid;
  varying float vNoise;

  uniform float uTime;
  uniform float uAudioFrequency;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform float uMorphAmount;
  uniform float uColorOffset;

  void main() {
    // Base blue color with noise and normal
    vec3 color = vec3(vNoise) * 0.5 + vNormal * 0.4 + vec3(0.1, 0.1, 0.9);

    // Audio-reactive color pulsing
    color.r += uAudioFrequency * 0.7;
    color.g += uAudioMid * 0.6;
    color.b += uAudioBass * 0.5 + 0.2;

    // Strong metallic effect
    float metallic = abs(vNoise) * 1.0;
    vec3 metallicColor = vec3(metallic) * (1.0 + uAudioFrequency * 1.2);
    color += metallicColor * 0.4;

    // View-dependent effects
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

    // Shine with audio boost
    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0);
    float shine = 0.9 + uAudioBass * 0.8 + uAudioFrequency * 0.4;
    color += vec3(fresnel) * shine;

    // Enhanced specular highlights
    float specular = pow(max(dot(reflect(-viewDirection, vNormal), viewDirection), 0.0), 32.0);
    color += vec3(specular) * (1.0 + uAudioFrequency * 2.0);

    // Blue rim lighting
    float rim = 1.0 - max(dot(viewDirection, vNormal), 0.0);
    rim = pow(rim, 2.0);
    color += vec3(0.2, 0.3, 1.0) * rim * (0.6 + uAudioBass * 0.5);

    // Gyroid pattern visibility
    color += vGyroid * 0.2 * (1.0 + uAudioMid * 1.5);

    // Add pulsing brightness with bass
    color *= (1.0 + uAudioBass * 0.3);

    gl_FragColor = vec4(color, 1.0);
  }
`;
