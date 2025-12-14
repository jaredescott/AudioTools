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

  const float _FogMul = -0.008;
  const float _FogPow = 1.0;
  const vec3 _LightDir = vec3(-0.23047, 0.87328, -0.42927);
  const float _Brightness = 0.4;
  const float _Contrast = 0.83;
  const float _Saturation = 1.21;
  const vec3 _SunColor = vec3(1.0, 0.95441, 0.77206);
  const vec3 _Zenith = vec3(0.77941, 0.5898, 0.41263);
  const float _ZenithFallOff = 2.36;
  const vec3 _Nadir = vec3(1.0, 0.93103, 0.0);
  const float _NadirFallOff = 1.91;
  const vec3 _Horizon = vec3(0.96324, 0.80163, 0.38954);
  const vec3 _PyramidCol = vec3(0.69853, 0.40389, 0.22086);
  const vec2 _PyramidHeightFog = vec2(38.66, 1.3);
  const vec3 _TerrainCol = vec3(0.56618, 0.29249, 0.1915);
  const vec3 _TerrainSpecColor = vec3(1.0, 0.77637, 0.53676);
  const float _TerrainSpecPower = 55.35;
  const float _TerrainSpecStrength = 1.56;
  const float _TerrainGlitterPower = 3.2;
  const vec3 _TerrainRimColor = vec3(0.16176, 0.13131, 0.098724);
  const float _TerrainRimPower = 5.59;
  const float _TerrainRimStrength = 1.61;
  const float _TerrainFogPower = 2.11;
  const vec3 _TerrainShadowColor = vec3(0.48529, 0.13282, 0.0);
  const float _DrawDistance = 70.0;
  const float _MaxSteps = 96.0;
  const vec3 _SunPosition = vec3(0.2, 56.0, -40.1);
  const float _SunSize = 26.0;
  const float _SunScale = 15.0;
  const vec3 _PyramidPos = vec3(0.0, 10.9, -50.0);
  const vec3 _PyramidScale = vec3(34.1, 24.9, 18.0);
  const vec3 _CameraPos = vec3(1.0, 2.2, 18.6);
  const vec2 _LargeWaveDetail = vec2(0.25, 0.73);
  const vec3 _LargeWavePowStre = vec3(0.6, 2.96, -2.08);
  const vec3 _LargeWaveOffset = vec3(-3.65, 4.41, -11.64);
  const float _SmallDetailStrength = 0.006;
  const vec3 _SmallWaveDetail = vec3(3.19, 16.0, 6.05);
  const vec2 _WindSpeed = vec2(2.0, 0.6);

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

  vec3 noised(vec2 x) {
    vec2 f = fract(x);
    vec2 u = f * f * (3.0 - 2.0 * f);
    vec2 p = floor(x);
    float a = noise(p + vec2(0.5, 0.5));
    float b = noise(p + vec2(1.5, 0.5));
    float c = noise(p + vec2(0.5, 1.5));
    float d = noise(p + vec2(1.5, 1.5));
    return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y,
                6.0 * f * (1.0 - f) * (vec2(b - a, c - a) + (a - b - c + d) * u.yx));
  }

  float pn(vec3 p) {
    vec3 i = floor(p);
    vec4 a = dot(i, vec3(1.0, 57.0, 21.0)) + vec4(0.0, 57.0, 21.0, 78.0);
    vec3 f = cos((p - i) * PI) * -0.5 + 0.5;
    a = mix(sin(cos(a) * a), sin(cos(1.0 + a) * (1.0 + a)), f.x);
    a.xy = mix(a.xz, a.yw, f.y);
    return mix(a.x, a.y, f.z);
  }

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float sdPlane(vec3 p) {
    return p.y;
  }

  float sdTriPrism(vec3 p, vec2 h) {
    vec3 q = abs(p);
    float d1 = q.z - h.y;
    float d2 = max(q.x * 0.866025 + p.y * 0.5, -p.y) - h.x * 0.5;
    return length(max(vec2(d1, d2), 0.0)) + min(max(d1, d2), 0.0);
  }

  float sdLargeWaves(vec3 pos) {
    float distZ = abs(pos.z - _CameraPos.z);
    float distX = abs(pos.x - _CameraPos.x);
    float dist = (distZ) + (distX * 0.1);
    dist = dist * dist * 0.01;

    float detailNoise = noised(pos.xz).x * -2.5;
    float largeWaves = (sin(_LargeWaveOffset.z + pos.z * _LargeWaveDetail.y + pos.z * 0.02) *
                        sin((_LargeWaveOffset.x + dist) + (pos.x * _LargeWaveDetail.x)) * 0.5) + 0.5;
    largeWaves = -_LargeWaveOffset.y + pow(largeWaves, _LargeWavePowStre.x) * _LargeWavePowStre.y - detailNoise * 0.1;
    largeWaves = smin(largeWaves, _LargeWavePowStre.z, 0.2);
    largeWaves = (largeWaves - dist);
    return largeWaves * 0.9;
  }

  float sdSmallWaves(vec3 pos) {
    float detailNoise = noised(pos.xz).x * _SmallWaveDetail.z;
    float smallWaves = sin(pos.z * _SmallWaveDetail.y + detailNoise + uTime * _WindSpeed.y) *
                       sin(pos.x * _SmallWaveDetail.x + detailNoise + uTime * _WindSpeed.x) * _SmallDetailStrength;
    return smallWaves * 0.9;
  }

  float sdTerrain(vec3 pos) {
    float smallWaves = sdSmallWaves(pos);
    float largeWaves = sdLargeWaves(pos);
    float audioWave = sin(pos.z * 0.5 + uTime) * sin(pos.x * 0.3) * uAudioBass * 0.5;
    return smallWaves + largeWaves + audioWave;
  }

  float sdBigMountain(vec3 pos) {
    float scaleMul = min(_PyramidScale.x, min(_PyramidScale.y, _PyramidScale.z));
    vec3 posPyramid = pos - _PyramidPos;
    float derNoise = sin(noised(posPyramid.xz * 1.5).x) * 1.0;
    posPyramid.x = posPyramid.x + derNoise;
    posPyramid /= _PyramidScale;
    float pyramid = sdTriPrism(posPyramid, vec2(1.0, 1.9)) * scaleMul;
    return pyramid;
  }

  vec2 map(vec3 pos) {
    float terrain = sdTerrain(pos);
    vec2 res = vec2(pos.y + terrain, 10.0);
    float pyramid = sdBigMountain(pos);
    if (pyramid < res.x) {
      res = vec2(pyramid, 1.0);
    }
    return res;
  }

  vec3 calcNormal(vec3 pos) {
    vec2 e = vec2(0.0005, 0.0);
    return normalize(vec3(
      map(pos + e.xyy).x - map(pos - e.xyy).x,
      map(pos + e.yxy).x - map(pos - e.yxy).x,
      map(pos + e.yyx).x - map(pos - e.yyx).x
    ));
  }

  vec3 sky(vec3 ro, vec3 rd) {
    float sunDistance = length(_SunPosition);
    vec3 delta = _SunPosition.xyz - (ro + rd * sunDistance);
    delta.xy *= vec2(14.7, 1.47);
    float sunDist = length(delta);
    float spot = 1.0 - smoothstep(0.0, _SunSize, sunDist);
    vec3 sun = clamp(_SunScale * spot * spot * spot, 0.0, 1.0) * _SunColor;

    float y = rd.y;
    float zen = 1.0 - pow(min(1.0, 1.0 - y), _ZenithFallOff);
    vec3 zenithColor = _Zenith * zen;

    float nad = 1.0 - pow(min(1.0, 1.0 + y), _NadirFallOff);
    vec3 nadirColor = _Nadir * nad;

    float hor = 1.0 - zen - nad;
    vec3 horizonColor = _Horizon * hor;

    vec3 skyColor = sun * 0.1 + zenithColor + horizonColor + nadirColor;
    skyColor += uAudioFrequency * _Horizon * 0.2;

    return skyColor;
  }

  vec3 castRay(vec3 ro, vec3 rd) {
    float tmin = 0.1;
    float tmax = _DrawDistance;
    float t = tmin;
    float m = -1.0;

    for (float i = 0.0; i < _MaxSteps; i += 1.0) {
      float precis = 0.0005 * t;
      vec2 res = map(ro + rd * t);
      if (res.x < precis || t > tmax) {
        m = res.y;
        break;
      }
      t += res.x;
    }

    if (t > tmax) m = -1.0;
    return vec3(t, m, 0.0);
  }

  vec3 render(vec3 ro, vec3 rd) {
    vec3 skyCol = sky(ro, rd);
    vec3 res = castRay(ro, rd);
    vec3 col = skyCol;

    float t = res.x;
    float m = res.y;

    if (m < 0.0) {
      return col;
    }

    vec3 pos = ro + t * rd;
    float skyFog = 1.0 - exp(_FogMul * t * pow(pos.y, _FogPow));

    vec3 pyramidCol = mix(_PyramidCol, skyCol, skyFog * 0.5);

    if (m < 1.5) {
      float nh = (pos.y / _PyramidHeightFog.x);
      nh = nh * nh * nh * nh * nh;
      float heightFog = pow(clamp(1.0 - nh, 0.0, 1.0), _PyramidHeightFog.y);
      heightFog = clamp(heightFog, 0.0, 1.0);
      pyramidCol = mix(pyramidCol, skyCol, heightFog);
      return pyramidCol;
    }

    vec3 nor = calcNormal(pos);

    float diff = clamp(dot(nor, _LightDir) + 1.0, 0.0, 1.0);

    vec3 ref = reflect(rd, nor);
    vec3 halfDir = normalize(_LightDir + rd);
    float mainSpec = clamp(dot(ref, halfDir), 0.0, 1.0);
    mainSpec = pow(mainSpec, _TerrainSpecPower) * _TerrainSpecStrength * 2.0;

    float textureGlitter = noise(pos.xz * 7.0) * 1.15;
    textureGlitter = pow(textureGlitter, _TerrainGlitterPower);
    mainSpec *= textureGlitter;

    float rim = pow(1.0 - clamp(dot(nor, -rd), 0.0, 1.0), _TerrainRimPower) * _TerrainRimStrength;
    rim *= (1.0 + uAudioMid * 0.5);

    vec3 rimColor = rim * _TerrainRimColor;
    vec3 specColor = mainSpec * _TerrainSpecColor;

    vec3 shadowCol = _TerrainShadowColor;
    vec3 terrainCol = mix((rimColor + specColor) + _TerrainCol * diff, skyCol, pow(skyFog, _TerrainFogPower));

    return mix(shadowCol, terrainCol, 0.7);
  }

  mat3 setCamera(vec3 ro, vec3 ta, float roll) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(roll), cos(roll), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
  }

  void main() {
    vec2 p = (vUv * 2.0 - 1.0);
    p.x *= 1.35;

    float cameraShake = sin(uTime * 0.25) * 0.15 * uAudioBass;
    vec3 ro = _CameraPos + vec3(cameraShake, 0.0, 0.0);
    vec3 ta = vec3(0.0, 2.0, 0.0);

    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(p.xy, 1.038));

    vec3 col = render(ro, rd);

    float vig = pow(1.0 - 0.4 * dot(p, p), 0.6) * 1.25;
    vig = min(vig, 1.0);
    col *= vig;

    col = pow(col, vec3(0.8333));

    gl_FragColor = vec4(col, 1.0);
  }
`;
