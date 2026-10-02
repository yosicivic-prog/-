import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {useThree} from '@react-three/fiber';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

// ---------- timeline (frames @30fps) ----------
const SCAN_IN = 125;
const SCAN_OUT = 210;
const ALIGNER_IN = 225;
const ALIGNER_SETTLE = [300, 335] as const;
const STEPS: [number, number, number][] = [
  [340, 365, 0.4],
  [378, 403, 0.75],
  [416, 446, 1],
];

export const alignProgress = (f: number) => {
  let p = 0;
  let prev = 0;
  for (const [a, b, to] of STEPS) {
    const k = interpolate(f, [a, b], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });
    p += (to - prev) * k;
    prev = to;
  }
  return p;
};

// ---------- tooth layout ----------
type ToothDef = {w: number; h: number; d: number; mis: [number, number, number, number, number]};
// [dx, dy, dz, rotY, rotZ] initial misalignment (mirrored on the other side by sign tweaks)
const HALF: ToothDef[] = [
  {w: 0.9, h: 1.05, d: 0.55, mis: [0.05, -0.02, 0.18, 0.2, 0.07]},
  {w: 0.7, h: 0.86, d: 0.5, mis: [-0.07, 0.04, -0.12, -0.45, -0.14]},
  {w: 0.78, h: 0.98, d: 0.62, mis: [0.1, -0.05, 0.28, 0.35, 0.05]},
  {w: 0.68, h: 0.8, d: 0.62, mis: [-0.04, 0.03, -0.1, -0.25, 0.04]},
  {w: 0.66, h: 0.78, d: 0.62, mis: [0.03, 0, 0.05, 0.12, -0.03]},
];
const R = 3.4;
const GAP = 0.0;

type Placed = ToothDef & {side: 1 | -1; s: number};
const placed: Placed[] = (() => {
  const out: Placed[] = [];
  for (const side of [1, -1] as const) {
    let s = GAP;
    HALF.forEach((t) => {
      out.push({...t, side, s: side * (s + t.w / 2)});
      s += t.w + GAP;
    });
  }
  return out;
})();

const toothGeometry = (w: number, h: number, d: number, pow = 0.62) => {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, 48, 36);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const p = g.attributes.position;
  const f = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), pow);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    // flatter, thinner incisal (bottom) edge and slightly tapered root
    const taper = 1 - 0.16 * Math.max(0, y);
    x = f(x) * (w / 2) * taper;
    z = f(z) * (d / 2) * (y < 0 ? 0.82 : 1);
    y = f(y) * (h / 2);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
};

const pose = (t: Placed, p: number) => {
  const a = t.s / R;
  const k = 1 - p;
  const [dx, dy, dz, ry, rz] = t.mis;
  const sg = t.side;
  const x = R * Math.sin(a) + dx * k * sg;
  const z = -R * (1 - Math.cos(a)) + dz * k;
  const y = 0.5 - t.h / 2 + dy * k;
  return {
    pos: [x, y, z] as [number, number, number],
    rot: [0, a + ry * k * sg, rz * k * sg] as [number, number, number],
  };
};

// ---------- environment / backdrop ----------
const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.75;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

const radialTexture = (inner: string, outer: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(0.55, inner);
  g.addColorStop(0.62, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
};

const Backdrop: React.FC<{frame: number}> = ({frame}) => {
  const bg = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#0b2a33');
    g.addColorStop(0.5, '#123f45');
    g.addColorStop(1, '#241a22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 512);
    return new THREE.CanvasTexture(c);
  }, []);
  const disc = useMemo(() => radialTexture('rgba(255,255,255,0.55)', 'rgba(255,255,255,0.9)'), []);
  const bokeh = useMemo(() => {
    const cols = ['#ffb36b', '#ff8f6b', '#ffd9a0', '#6fe3d6', '#ff7aa2', '#ffe4b5'];
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({length: 34}, () => ({
      x: (rnd() - 0.5) * 14,
      y: (rnd() - 0.5) * 22,
      z: -9 - rnd() * 5,
      r: 0.8 + rnd() * 1.6,
      c: cols[Math.floor(rnd() * cols.length)],
      o: 0.12 + rnd() * 0.2,
      sp: 0.2 + rnd() * 0.5,
      ph: rnd() * 6.28,
    }));
  }, []);
  const t = frame / 30;
  // "laughter" pulse on the warm lights during the opening
  const pulse = 1 + 0.35 * Math.max(0, Math.sin(t * 7.5)) * (t < 4 ? 1 : 0.2);
  return (
    <group>
      <mesh position={[0, 0, -16]} scale={[40, 60, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={bg} toneMapped={false} />
      </mesh>
      {bokeh.map((b, i) => (
        <mesh key={i} position={[b.x + Math.sin(t * 0.3 * b.sp + b.ph) * 0.4, b.y + Math.cos(t * 0.25 * b.sp + b.ph) * 0.3, b.z]} scale={[b.r * 2, b.r * 2, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={disc} color={b.c} transparent opacity={b.o * pulse} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- main scene ----------
export const Scene3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const p = alignProgress(frame);

  const geoms = useMemo(
    () =>
      placed.map((t) => ({
        tooth: toothGeometry(t.w, t.h, t.d),
        shell: toothGeometry(t.w + 0.12, t.h + 0.08, t.d + 0.12, 0.6),
      })),
    [],
  );

  const gum = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let s = -4.1; s <= 4.1; s += 0.2) {
      const a = s / R;
      pts.push(new THREE.Vector3(R * Math.sin(a), 0.62, -R * (1 - Math.cos(a)) - 0.12));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.5, 24, false);
  }, []);

  // ---- camera path ----
  const ease = Easing.inOut(Easing.cubic);
  const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const kf = [0, 120, 300, 450];
  const camX = interpolate(frame, kf, [0.5, 0.2, 2.2, 0.2], {...cl, easing: ease});
  const camY = interpolate(frame, kf, [-0.1, 0.0, 0.7, -0.4], {...cl, easing: ease});
  const camZ = interpolate(frame, kf, [12.5, 10.5, 13.5, 15.5], {...cl, easing: ease});
  const look = interpolate(frame, kf, [0, 0.2, -0.2, 0.0], {...cl, easing: ease});
  camera.position.set(camX, camY, camZ);
  camera.lookAt(look * 0.5, 0.0, -0.5);
  (camera as THREE.PerspectiveCamera).fov = interpolate(frame, [0, 450], [26, 31], cl);
  camera.updateProjectionMatrix();

  // ---- scan + aligner ----
  const scanVis = interpolate(frame, [SCAN_IN - 6, SCAN_IN + 6, SCAN_OUT - 8, SCAN_OUT + 8], [0, 1, 1, 0], cl);
  const barX = interpolate(frame, [SCAN_IN, SCAN_OUT - 12], [-3.9, 3.9], {...cl, easing: Easing.inOut(Easing.sin)});
  const alignerOp = interpolate(frame, [ALIGNER_IN, ALIGNER_IN + 25], [0, 1], cl);
  const alignerLift = interpolate(frame, [ALIGNER_IN, ALIGNER_SETTLE[0], ALIGNER_SETTLE[1]], [1.05, 0.85, 0], {...cl, easing: ease});
  const alignerRot = interpolate(frame, [ALIGNER_IN, ALIGNER_SETTLE[0]], [0.35, 0], {...cl, easing: ease});
  const pShell = Math.min(1, p + 0.18);
  const scaleHold = interpolate(frame, [ALIGNER_SETTLE[1], 346], [1.0, 1.0], cl);

  const toothMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#efe6d2',
        roughness: 0.32,
        clearcoat: 0.9,
        clearcoatRoughness: 0.18,
        sheen: 0.6,
        sheenColor: new THREE.Color('#ffe9d0'),
        sheenRoughness: 0.5,
        emissive: new THREE.Color('#3a2a1e'),
        emissiveIntensity: 0.22,
        envMapIntensity: 0.9,
      }),
    [],
  );
  const gumMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d9707a',
        roughness: 0.42,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        sheen: 0.5,
        sheenColor: new THREE.Color('#ff9aa5'),
        emissive: new THREE.Color('#4a0f1a'),
        emissiveIntensity: 0.2,
      }),
    [],
  );
  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d9f6f2',
        emissive: new THREE.Color('#1f6b68'),
        emissiveIntensity: 0.3,
        transmission: 0.9,
        thickness: 0.22,
        ior: 1.47,
        roughness: 0.035,
        attenuationColor: new THREE.Color('#e6fffb'),
        attenuationDistance: 3,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 3.2,
        transparent: true,
        specularIntensity: 1,
      }),
    [],
  );
  shellMat.opacity = alignerOp;
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#6af7e6', wireframe: true, transparent: true, toneMapped: false}), []);
  wireMat.opacity = 0.55 * scanVis;

  return (
    <>
      <Env />
      <Backdrop frame={frame} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 7]} intensity={2.4} color="#fff1dd" />
      <directionalLight position={[-6, 1, 3]} intensity={1.2} color="#7fe9e0" />
      <pointLight position={[0, -3, 4]} intensity={14} color="#ffb48a" distance={14} />
      <pointLight position={[0, 3, -3]} intensity={40} color="#9ff3ff" distance={14} />

      <mesh geometry={gum} material={gumMat} scale={[1, 0.8, 0.9]} position={[0, 0.26, -0.02]} />

      {placed.map((t, i) => {
        const ps = pose(t, p);
        return (
          <group key={i}>
            <mesh geometry={geoms[i].tooth} material={toothMat} position={ps.pos} rotation={ps.rot} />
            {scanVis > 0.01 && <mesh geometry={geoms[i].tooth} material={wireMat} position={ps.pos} rotation={ps.rot} scale={1.012} />}
          </group>
        );
      })}

      {alignerOp > 0.01 && (
        <group position={[0, alignerLift, alignerLift * 0.8]} rotation={[0, alignerRot, 0]} scale={scaleHold}>
          {placed.map((t, i) => {
            const ps = pose(t, pShell);
            return <mesh key={i} geometry={geoms[i].shell} material={shellMat} position={ps.pos} rotation={ps.rot} />;
          })}
        </group>
      )}

      {scanVis > 0.01 && (
        <mesh position={[barX, 0, 0.9]}>
          <planeGeometry args={[0.035, 3.2]} />
          <meshBasicMaterial color="#9ffcf0" transparent opacity={scanVis} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </>
  );
};
