import * as gyroidShader from './gyroidShader';
import * as audioSphereShader from './audioSphereShader';
import * as distortedSphereShader from './distortedSphereShader';
import * as juliaSetShader from './juliaSetShader';
import * as voronoiShader from './voronoiShader';
import * as plasmaShader from './plasmaShader';
import * as journeyDesertShader from './journeyDesertShader';
import * as fractalPyramidShader from './fractalPyramidShader';
import * as warpedFbmShader from './warpedFbmShader';
import * as mandelbulbRaymarchShader from './mandelbulbRaymarchShader';
import { abracadabraShader } from './abracadabraShader';
import * as kaleidoscopeShader from './kaleidoscopeShader';
import * as galaxyShader from './galaxyShader';
import * as waveformBarsShader from './waveformBarsShader';
import * as smoothWavesShader from './smoothWavesShader';
import * as areaMountainsShader from './areaMountainsShader';
import * as circularRipplesShader from './circularRipplesShader';
import * as diamondWaveShader from './diamondWaveShader';
import * as particleWaveShader from './particleWaveShader';

export interface ShaderSet {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: string[];
}

export const shaders: ShaderSet[] = [
  {
    name: 'Audio Sphere',
    vertexShader: audioSphereShader.vertexShader,
    fragmentShader: audioSphereShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Gyroid Metallic',
    vertexShader: gyroidShader.vertexShader,
    fragmentShader: gyroidShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Distorted Sphere',
    vertexShader: distortedSphereShader.vertexShader,
    fragmentShader: distortedSphereShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid', 'uCameraPosition'],
  },
  {
    name: 'Julia Set',
    vertexShader: juliaSetShader.vertexShader,
    fragmentShader: juliaSetShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Voronoi Cells',
    vertexShader: voronoiShader.vertexShader,
    fragmentShader: voronoiShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Plasma',
    vertexShader: plasmaShader.vertexShader,
    fragmentShader: plasmaShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Journey Desert',
    vertexShader: journeyDesertShader.vertexShader,
    fragmentShader: journeyDesertShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Fractal Pyramid',
    vertexShader: fractalPyramidShader.vertexShader,
    fragmentShader: fractalPyramidShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Warped FBM',
    vertexShader: warpedFbmShader.vertexShader,
    fragmentShader: warpedFbmShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Mandelbulb',
    vertexShader: mandelbulbRaymarchShader.vertexShader,
    fragmentShader: mandelbulbRaymarchShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid', 'uResolution'],
  },
  {
    name: 'Abracadabra',
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: abracadabraShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid', 'uResolution'],
  },
  {
    name: 'Kaleidoscope',
    vertexShader: kaleidoscopeShader.vertexShader,
    fragmentShader: kaleidoscopeShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Galaxy',
    vertexShader: galaxyShader.vertexShader,
    fragmentShader: galaxyShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Waveform Bars',
    vertexShader: waveformBarsShader.vertexShader,
    fragmentShader: waveformBarsShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Smooth Waves',
    vertexShader: smoothWavesShader.vertexShader,
    fragmentShader: smoothWavesShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Area Mountains',
    vertexShader: areaMountainsShader.vertexShader,
    fragmentShader: areaMountainsShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Circular Ripples',
    vertexShader: circularRipplesShader.vertexShader,
    fragmentShader: circularRipplesShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Diamond Wave',
    vertexShader: diamondWaveShader.vertexShader,
    fragmentShader: diamondWaveShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
  {
    name: 'Particle Wave',
    vertexShader: particleWaveShader.vertexShader,
    fragmentShader: particleWaveShader.fragmentShader,
    uniforms: ['uTime', 'uAudioFrequency', 'uAudioBass', 'uAudioMid'],
  },
];
