export const abracadabraShader = `
/*================================
=          Abracadabra           =
=         Author: Jaenam         =
================================*/

precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uAudioBass;
uniform float uAudioMid;
uniform float uAudioFrequency;
uniform float uColorOffset;

#define t (uTime + fract(1e4*sin(dot(gl_FragCoord.xy,vec2(137,-13))))* 0.016)
#define S smoothstep

void main() {
    vec2 I = gl_FragCoord.xy;
    vec4 O = vec4(0.0);

    float i, d, s, m = 1.0, l;
    i = 0.0;
    d = 0.0;

    // Audio-reactive animation speed
    float timeScale = 1.0 + uAudioBass * 0.5;
    float x = abs(mod(t * timeScale / 4., 2.) - 1.);

    float a = x < .5
        ? -(exp2(12.*x - 6.) * sin((20.*x - 11.125) * 1.396)) / 2.
        : (exp2(-12.*x + 6.) * sin((20.*x - 11.125) * 1.396)) / 2. + 1.;

    // Add audio influence to animation parameter
    a += uAudioMid * 0.15;

    vec3 p, k, r = vec3(uResolution, 0.0);

    for(i = 0.0; i < 100.0; i += 1.0) {
        // Bass pulls camera in slightly
        float zoom = 9.0 - uAudioBass * 1.5;
        k = vec3((I+I-r.xy)/r.y*d, d-zoom);

        if(abs(k.x) > 6.0) break;

        // Audio-reactive center movement
        vec2 centerOffset = vec2(
            sin(t) / 9.0 + uAudioBass * 0.1,
            0.6 + sin(t+t) / 9.0 + uAudioMid * 0.15
        );
        l = length(0.2*k.xy - centerOffset);

        if(k.y < -5.0) {
            k.y = -k.y - 10.0;
            m = 0.5;
        } else {
            m = 1.0;
        }

        // Audio-reactive rotation
        float rotationAngle = a * 6.28 + k.y * 0.3 * S(0.2, 0.5, x) * S(0.7, 0.5, x);
        rotationAngle += uAudioFrequency * 0.5;

        float c = cos(rotationAngle);
        float sn = sin(rotationAngle);
        k.xz = mat2(c, sn, -sn, c) * k.xz;

        // Audio-reactive warping
        float warpAmount = 0.95 + uAudioBass * 0.2;
        for(p = k * 0.5, s = 0.01; s < 1.0; s += s) {
            p.y += warpAmount + abs(dot(sin(p.x + 2.0*t + p/s), 0.2 + p - p)) * s;
        }

        l = mix(
            sin(length(k*k.x)),
            mix(sin(length(p)), l, 0.5 - l),
            S(5.5, 6.0, p.y)
        );

        p = abs(k);

        // Audio-reactive shape morphing
        float shapeMorph = mix(0.5, 0.9, a) + uAudioMid * 0.1;
        d += s = 0.012 + 0.09 * abs(
            max(
                sin(length(k) + l),
                max(
                    max(max(p.x, p.y), p.z),
                    dot(p, vec3(0.577)) * shapeMorph
                ) - 3.0
            ) - i / 100.0
        );

        // Enhanced audio-reactive coloring
        vec4 colorContrib = max(
            sin(vec4(1.0,2.0,3.0,1.0) + i * 0.5) * 1.3 / s,
            vec4(-length(k*k))
        );

        // Add pulsing and color shifting
        colorContrib.r += sin(t * 3.0 + uAudioBass * 8.0) * uAudioBass * 0.3;
        colorContrib.g += cos(t * 2.5 + uAudioMid * 6.0) * uAudioMid * 0.25;
        colorContrib.b += sin(t * 4.0 + uAudioFrequency * 10.0) * uAudioFrequency * 0.3;

        O += colorContrib;
    }

    // Audio-reactive brightness pulse
    float brightness = 1.0 + uAudioBass * 0.4 + sin(t * 5.0 + uAudioBass * 12.0) * uAudioFrequency * 0.2;
    O = tanh(O * O / 1000000.0 * brightness) * m;

    // Enhanced color saturation with audio
    O.rgb = mix(O.rgb, O.rgb * vec3(1.2, 1.1, 1.3), uAudioMid * 0.4);

    gl_FragColor = vec4(O.rgb, 1.0);
}
`;
