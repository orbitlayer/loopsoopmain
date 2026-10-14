"use client";

import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

/*
 * Aurora — WebGL animated aurora background (ported from reactbits.dev, MIT).
 * Refined for the LOOPSOOP light theme: soft, low-key colour ramp meant to sit
 * behind a hero and fade into the off-white page. Renders a transparent canvas;
 * colour comes through with premultiplied alpha so it blends over any bg.
 */

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                              \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                      \
     bool isInBetween = currentColor.position <= factor;      \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                           \
  ColorStop currentColor = colors[index];                     \
  ColorStop nextColor = colors[index + 1];                    \
  float range = nextColor.position - currentColor.position;   \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, clamp(lerpFactor, 0.0, 1.0)); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

export type AuroraProps = {
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
};

export default function Aurora({
  colorStops = ["#a5b4fc", "#c4b5fd", "#93c5fd"],
  amplitude = 0.9,
  blend = 0.5,
  speed = 0.6,
}: AuroraProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ colorStops, amplitude, blend, speed });
  propsRef.current = { colorStops, amplitude, blend, speed };

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      // A full-screen shader gradient gains nothing from MSAA; skipping it
      // saves GPU work every frame.
      antialias: false,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete (geometry.attributes as Record<string, unknown>).uv;
    }

    const toRgb = (hex: string): [number, number, number] => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    };

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStops.map(toRgb) },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    const resize = () => {
      if (!ctn) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.uResolution.value = [ctn.offsetWidth, ctn.offsetHeight];
    };
    window.addEventListener("resize", resize);
    resize();

    // Only recompute the colour-stop RGBs when they actually change, instead of
    // allocating a new array (+ 3 Color objects) on every single frame.
    let stopsKey = propsRef.current.colorStops.join("|");
    let stopsRgb = propsRef.current.colorStops.map(toRgb);
    program.uniforms.uColorStops.value = stopsRgb;

    let raf = 0;
    let running = false;
    let inView = true;
    let docVisible = typeof document !== "undefined" ? !document.hidden : true;

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const p = propsRef.current;
      program.uniforms.uTime.value = t * 0.001 * p.speed * 0.5;
      program.uniforms.uAmplitude.value = p.amplitude;
      program.uniforms.uBlend.value = p.blend;
      const key = p.colorStops.join("|");
      if (key !== stopsKey) {
        stopsKey = key;
        stopsRgb = p.colorStops.map(toRgb);
        program.uniforms.uColorStops.value = stopsRgb;
      }
      renderer.render({ scene: mesh });
    };

    // Pause the loop whenever the hero is scrolled out of view or the tab is
    // hidden — no point animating a background nobody can see (saves CPU/GPU
    // and battery on long pages).
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const sync = () => (inView && docVisible ? start() : stop());

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(ctn);

    const onVisibility = () => {
      docVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    sync();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      if (gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ctnDom} className="h-full w-full" />;
}
