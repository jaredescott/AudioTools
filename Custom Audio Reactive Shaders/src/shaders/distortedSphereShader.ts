export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  uniform float uTime;
  uniform float uAudioFrequency;
  uniform float uAudioBass;
  uniform float uAudioMid;
  uniform vec3 uCameraPosition;
  uniform float uColorOffset;

  float sphere(vec3 p, float r) {
    return length(p) - r;
  }

  float distort(vec3 p, float a) {
    return min(0.05, sin(p.x * a) + sin(p.y * a) + sin(p.z * a));
  }

  float surfaceDistance(vec3 p) {
    float sphereSize = 0.5 + uAudioBass * 0.15;

    float distortFreq = 12.0 + uAudioMid * 8.0 + uAudioFrequency * 5.0;
    float timeSpeed = 0.03 + uAudioBass * 0.05;

    return max(
      sphere(p, sphereSize),
      distort(p + uTime * timeSpeed, distortFreq)
    );
  }

  vec3 calculateNormal(vec3 p) {
    const float eps = 0.001;
    vec2 h = vec2(eps, 0.0);
    return normalize(vec3(
      surfaceDistance(p + h.xyy) - surfaceDistance(p - h.xyy),
      surfaceDistance(p + h.yxy) - surfaceDistance(p - h.yxy),
      surfaceDistance(p + h.yyx) - surfaceDistance(p - h.yyx)
    ));
  }

  float simpleLighting(vec3 p, vec3 normal, vec3 lightDir) {
    float diffuse = max(0.0, dot(normal, normalize(lightDir)));

    vec3 viewDir = normalize(uCameraPosition - p);
    vec3 reflectDir = reflect(-normalize(lightDir), normal);
    float specular = pow(max(0.0, dot(viewDir, reflectDir)), 32.0);

    return diffuse + specular * 0.5;
  }

  vec3 shade(vec3 p, vec3 normal) {
    vec3 lightDirection = vec3(
      sin(uTime * 0.15) * 0.5,
      1.0,
      cos(uTime * 0.15) * 0.5
    );

    float lightIntensity = 1.2 + uAudioBass * 0.5 + sin(uTime * 0.5) * 0.1;
    float light = simpleLighting(p, normal, lightDirection) * lightIntensity;

    vec3 baseColor = vec3(1.0, 1.0, 1.5);

    baseColor.r += uAudioBass * 0.3;
    baseColor.g += uAudioMid * 0.2;
    baseColor.b += uAudioFrequency * 0.5;

    vec3 color = baseColor;
    color += normal * (0.2 + uAudioMid * 0.15);

    float internalGlow = length(p) * (1.0 + uAudioBass * 0.5);
    color -= internalGlow;

    color += vec3(uAudioFrequency * 0.3, uAudioMid * 0.2, uAudioBass * 0.2);

    return color * light;
  }

  void main() {
    vec3 rayOrigin = uCameraPosition;
    vec3 rayDirection = normalize(vPosition - rayOrigin);

    float t = 0.0;
    vec3 p = rayOrigin;

    bool hit = false;
    float dist = 0.0;

    for(int i = 0; i < 100; i++) {
      p = rayOrigin + rayDirection * t;
      dist = surfaceDistance(p);

      if(dist < 0.001) {
        hit = true;
        break;
      }

      if(t > 10.0) {
        break;
      }

      t += dist * 0.5;
    }

    if(!hit) {
      discard;
    }

    vec3 normal = calculateNormal(p);
    vec3 color = shade(p, normal);

    float edgeGlow = 1.0 - abs(dot(normalize(rayDirection), normal));
    edgeGlow = pow(edgeGlow, 3.0) * (0.5 + uAudioFrequency * 0.8);
    color += vec3(edgeGlow * 0.8, edgeGlow * 0.9, edgeGlow);

    float alpha = 1.0;
    if(dist > 0.0) {
      alpha = smoothstep(0.05, 0.0, dist);
    }

    gl_FragColor = vec4(color, alpha);
  }
`;
