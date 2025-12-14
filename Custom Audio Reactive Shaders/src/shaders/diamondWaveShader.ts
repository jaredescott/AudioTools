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

  float sdDiamond(vec2 p, float size) {
    p = abs(p);
    return (p.x + p.y - size) / sqrt(2.0);
  }

  void main() {
    vec2 uv = vUv;

    float time = uTime * 2.0;

    vec3 color = vec3(0.0);

    float numDiamonds = 12.0;
    float spacing = 1.0 / numDiamonds;

    for (float i = 0.0; i < numDiamonds; i++) {
      float xPos = (i + 0.5) * spacing;

      float audioMod = sin(time * 2.0 + i * 0.5) * 0.5 + 0.5;
      audioMod = audioMod * 0.3 + 0.2;
      audioMod += uAudioBass * 0.3;
      audioMod += uAudioMid * sin(i * 0.8) * 0.2;

      float yPos = 0.5 + sin(time + i * 0.8) * audioMod;

      vec2 diamondPos = vec2(xPos, yPos);
      vec2 toCenter = uv - diamondPos;

      float size = 0.05 + audioMod * 0.05;
      float dist = sdDiamond(toCenter, size);

      float fill = smoothstep(0.005, -0.005, dist);

      float outline = smoothstep(0.008, 0.003, abs(dist));

      float hue = i / numDiamonds + time * 0.1 + uColorOffset / (2.0 * PI);
      float sat = 0.8;
      float val = 1.0;

      vec3 diamondColor = hsv2rgb(vec3(hue, sat, val));

      color += diamondColor * fill * 0.8;
      color += diamondColor * outline;

      float glow = exp(-abs(dist) * 15.0) * 0.2;
      color += diamondColor * glow;
    }

    vec3 bgGradient = mix(
      vec3(0.02, 0.0, 0.05),
      vec3(0.05, 0.0, 0.1),
      uv.y
    );

    color += bgGradient;

    float vignette = 1.0 - length(uv - 0.5) * 0.4;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
