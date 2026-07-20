import { spectralLightColors } from "@/model/audio-light-palette";
import type { CoverParticles } from "@/model/stage-particles";

import { coverColors, coverParticles } from "../cover";
import type { VisualEffect, VisualEffectInstance, VisualFrame } from "../effect";

// A WebGL port of Mineradio's "SILK" preset: the album cover is a plane of points
// rippling in Z. Simplex noise driven by bass/mid/treble (plus beat bursts and each
// particle's luma as depth) displaces them; perspective grows the near points; a
// soft additive sprite makes the overlaps bloom. Raw WebGL (no three.js) — one
// gl.POINTS draw over the cover cloud built by sampleCoverParticles. Consumes the
// engine's reactive audio (frame.audio) rather than deriving it.

const VERT = `
precision highp float;
attribute vec2 aPos;
attribute vec3 aColor;
attribute float aLuma;
attribute float aRand;
uniform float uTime, uBass, uMid, uTreble, uBeat, uEnergy, uBurst, uTwist;
uniform float uSpread, uDepth, uFocal, uPointScale, uPixel, uAspect;
varying vec3 vColor;
varying float vBright;

// Ashima simplex noise 3D (snoise) — https://github.com/ashima/webgl-noise (MIT).
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  vec3 pos = vec3(aPos * uSpread, 0.0);
  float t = uTime;
  float K = 1.6;
  float mid = snoise(vec3(pos.x*1.4, pos.y*1.4, t*0.55))*0.6
            + snoise(vec3(pos.x*2.8+5.0, pos.y*2.8-3.0, t*0.85))*0.4;
  float midDisp = mid * uMid * 0.55 * K;
  float trebleJ = snoise(vec3(pos.x*6.5, pos.y*6.5, t*3.5 + aRand*4.0)) * uTreble * 0.20 * K;
  float bassBreath = snoise(vec3(pos.x*0.35, pos.y*0.35, t*0.4)) * uBass * 0.45 * K;
  float depthZ = (aLuma - 0.5) * uDepth;
  float burstZ = uBurst * (0.4 + snoise(vec3(pos.x*0.8, pos.y*0.8, t*1.4)) * 0.5);
  pos.z = midDisp + trebleJ + bassBreath + depthZ + burstZ;

  if (uTwist > 0.001){
    float ta = uTwist * pos.z * 0.6;
    float cs = cos(ta), sn = sin(ta);
    pos.xy = mat2(cs,-sn,sn,cs) * pos.xy;
  }
  pos.xy *= 1.0 + uBass*0.05*K + uBurst*0.06;

  float dist = uFocal - pos.z;
  float scale = uFocal / max(0.5, dist);
  gl_Position = vec4(pos.x*scale*uAspect, pos.y*scale, 0.0, 1.0);

  float audioBoost = 1.0 + uBeat*0.35 + uBurst*0.6 + aLuma*0.5;
  gl_PointSize = clamp(uPointScale * scale * audioBoost * uPixel, 1.0, 22.0);

  vColor = aColor;
  vBright = 0.7 + uBass*0.12 + uEnergy*0.1 + uBurst*0.5 + uBeat*0.25 + aLuma*0.15;
}
`;

const FRAG = `
precision highp float;
varying vec3 vColor;
varying float vBright;
void main(){
  float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
  float a = smoothstep(1.0, 0.0, d);
  a = pow(a, 1.7);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * vBright, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function program(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g] = [c, x];
  else if (hp < 2) [r, g] = [x, c];
  else if (hp < 3) [g, b] = [c, x];
  else if (hp < 4) [g, b] = [x, c];
  else if (hp < 5) [r, b] = [x, c];
  else [r, b] = [c, x];
  const m = lig - c / 2;
  return [r + m, g + m, b + m];
}

const SPREAD = 1.7;
const DEPTH = 1.15;
const FOCAL = 6;
const POINT_SCALE = 2.4;

export const cloudEffect: VisualEffect = {
  id: "particles",
  labelKey: "stage.effect.particles",
  // Punchier than the default: the particle cloud reads best when it's agitated —
  // snappier damping, more contrast, and a touch more beat sensitivity.
  tuning: { levelContrast: 1.9, attack: 0.9, release: 0.55, levelFall: 0.045, burstGain: 3.8 },
  create(canvas: HTMLCanvasElement): VisualEffectInstance {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });
    const prog = gl ? program(gl) : null;
    const loc = gl && prog ? resolveLocations(gl, prog) : null;
    const buffers = gl
      ? {
          pos: gl.createBuffer(),
          color: gl.createBuffer(),
          luma: gl.createBuffer(),
          rand: gl.createBuffer(),
        }
      : null;

    let seeds: CoverParticles | null = null;
    let count = 0;
    let aspect = 1;
    let dprPixel = 1;

    function upload(p: CoverParticles): void {
      if (!gl || !buffers) return;
      seeds = p;
      count = p.count;
      const pos = new Float32Array(count * 2);
      const color = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 2] = p.nx[i];
        pos[i * 2 + 1] = p.ny[i];
        color[i * 3] = p.r[i];
        color[i * 3 + 1] = p.g[i];
        color[i * 3 + 2] = p.b[i];
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
      gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.luma);
      gl.bufferData(gl.ARRAY_BUFFER, p.luma, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.rand);
      gl.bufferData(gl.ARRAY_BUFFER, p.seed, gl.STATIC_DRAW);
    }

    return {
      resize(width: number, height: number, dpr: number) {
        if (!gl) return;
        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect = height / Math.max(1, width); // compress x so the cover stays square
        dprPixel = dpr;
      },

      draw({ timeSec, audio, image, accent }: VisualFrame) {
        if (!gl || !prog || !loc || !buffers) return;
        // The drawing side fetches its own cover cloud + palette.
        const particles = coverParticles(image);
        if (particles && particles !== seeds) upload(particles);

        const tint = spectralLightColors({ accent, tones: coverColors(image) ?? [accent] }).stops[0]
          ?.color;
        const [cr, cg, cb] = tint
          ? hslToRgb(tint.h, Math.min(tint.s, 45), Math.min(tint.l, 6))
          : [0.02, 0.02, 0.03];
        gl.clearColor(cr, cg, cb, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!seeds || count === 0) return;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive → overlaps bloom
        gl.useProgram(prog);

        bindAttrib(gl, buffers.pos, loc.aPos, 2);
        bindAttrib(gl, buffers.color, loc.aColor, 3);
        bindAttrib(gl, buffers.luma, loc.aLuma, 1);
        bindAttrib(gl, buffers.rand, loc.aRand, 1);

        gl.uniform1f(loc.uTime, timeSec);
        gl.uniform1f(loc.uBass, audio.bass);
        gl.uniform1f(loc.uMid, audio.mid);
        gl.uniform1f(loc.uTreble, audio.treble);
        gl.uniform1f(loc.uBeat, audio.beat);
        gl.uniform1f(loc.uEnergy, audio.overall);
        gl.uniform1f(loc.uBurst, audio.burst);
        gl.uniform1f(loc.uTwist, 0.12);
        gl.uniform1f(loc.uSpread, SPREAD);
        gl.uniform1f(loc.uDepth, DEPTH);
        gl.uniform1f(loc.uFocal, FOCAL);
        gl.uniform1f(loc.uPointScale, POINT_SCALE);
        gl.uniform1f(loc.uPixel, dprPixel);
        gl.uniform1f(loc.uAspect, aspect);

        gl.drawArrays(gl.POINTS, 0, count);
      },

      dispose() {
        if (!gl) return;
        if (prog) gl.deleteProgram(prog);
        if (buffers) {
          gl.deleteBuffer(buffers.pos);
          gl.deleteBuffer(buffers.color);
          gl.deleteBuffer(buffers.luma);
          gl.deleteBuffer(buffers.rand);
        }
        // NOTE: do NOT force-lose the context. React StrictMode (dev) remounts on
        // the SAME canvas element (setup → cleanup → setup); loseContext() here
        // poisons that shared context, so the re-created instance renders nothing
        // until the canvas is replaced — the "first open is blank, a toggle fixes
        // it" bug. The context is released when the canvas is removed / GC'd.
      },
    };
  },
};

type Locations = {
  aPos: number;
  aColor: number;
  aLuma: number;
  aRand: number;
  uTime: WebGLUniformLocation | null;
  uBass: WebGLUniformLocation | null;
  uMid: WebGLUniformLocation | null;
  uTreble: WebGLUniformLocation | null;
  uBeat: WebGLUniformLocation | null;
  uEnergy: WebGLUniformLocation | null;
  uBurst: WebGLUniformLocation | null;
  uTwist: WebGLUniformLocation | null;
  uSpread: WebGLUniformLocation | null;
  uDepth: WebGLUniformLocation | null;
  uFocal: WebGLUniformLocation | null;
  uPointScale: WebGLUniformLocation | null;
  uPixel: WebGLUniformLocation | null;
  uAspect: WebGLUniformLocation | null;
};

function resolveLocations(gl: WebGLRenderingContext, prog: WebGLProgram): Locations {
  const u = (name: string) => gl.getUniformLocation(prog, name);
  return {
    aPos: gl.getAttribLocation(prog, "aPos"),
    aColor: gl.getAttribLocation(prog, "aColor"),
    aLuma: gl.getAttribLocation(prog, "aLuma"),
    aRand: gl.getAttribLocation(prog, "aRand"),
    uTime: u("uTime"),
    uBass: u("uBass"),
    uMid: u("uMid"),
    uTreble: u("uTreble"),
    uBeat: u("uBeat"),
    uEnergy: u("uEnergy"),
    uBurst: u("uBurst"),
    uTwist: u("uTwist"),
    uSpread: u("uSpread"),
    uDepth: u("uDepth"),
    uFocal: u("uFocal"),
    uPointScale: u("uPointScale"),
    uPixel: u("uPixel"),
    uAspect: u("uAspect"),
  };
}

function bindAttrib(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer | null,
  location: number,
  size: number,
): void {
  if (location < 0 || !buffer) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}
