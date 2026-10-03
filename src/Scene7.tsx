import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {placed, pose, R, toothGeometry} from './Scene3D';

const TEETH_P = 0.4; // natural, mildly irregular teeth; the aligner is not shown straightening them

// A studio "room": grey walls + softbox strips. Gives the glass crisp, believable edge highlights.
const makeStudio = () => {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({color: new THREE.Color(0.2, 0.23, 0.24), side: THREE.BackSide})));
  const strip = (w: number, h: number, pos: [number, number, number], k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color().setScalar(k), side: THREE.DoubleSide}));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  strip(3, 22, [-14, 3, 7], 9);
  strip(2, 22, [14, 2, 4], 7);
  strip(18, 5, [0, 15, 2], 3.5);
  strip(22, 1.6, [0, 4, -16], 6);
  strip(12, 3, [0, -12, 8], 1.4);
  strip(2.2, 18, [-5, 2, 17], 10); // front softbox: gives the clear tray a visible highlight line
  strip(1.4, 18, [6, 1, 17], 6);
  return room;
};

export const Studio: React.FC<{rot: number}> = ({rot}) => {
  const {gl, scene} = useThree();
  // built synchronously so frame 0 of every render tab already has the studio lighting
  const env = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(makeStudio(), 0.02).texture;
    pm.dispose();
    return t;
  }, [gl]);
  scene.environment = env;
  scene.environmentIntensity = 1;
  scene.environmentRotation = new THREE.Euler(0, rot, 0);
  return null;
};

export const gradientBackdrop = () => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#c3d2d4');
  g.addColorStop(0.55, '#97aeb2');
  g.addColorStop(1, '#6d878b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  return new THREE.CanvasTexture(c);
};

// open the shell at the gum side so it reads as a thin hollow tray rather than a glass blob
export const openShell = (g: THREE.BufferGeometry, yCut: number) => {
  const pos = g.attributes.position;
  const idx = g.index!;
  const keep: number[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
    if (cy < yCut) keep.push(a, b, c);
  }
  g.setIndex(keep);
  g.computeVertexNormals();
  return g;
};

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const io = Easing.inOut(Easing.cubic);
  const out = Easing.out(Easing.cubic);

  const geoms = useMemo(
    () =>
      placed.map((t) => ({
        tooth: toothGeometry(t.w, t.h, t.d),
        shell: openShell(toothGeometry(t.w + 0.075, t.h + 0.06, t.d + 0.075, 0.6), t.h / 2 - 0.2),
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
  const backdrop = useMemo(gradientBackdrop, []);

  const toothMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#eee5d3',
        roughness: 0.3,
        clearcoat: 0.9,
        clearcoatRoughness: 0.15,
        sheen: 0.5,
        sheenColor: new THREE.Color('#ffe9d0'),
        emissive: new THREE.Color('#3a2a1e'),
        emissiveIntensity: 0.18,
        envMapIntensity: 0.8,
      }),
    [],
  );
  const gumMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#e08a92',
        roughness: 0.4,
        clearcoat: 0.7,
        clearcoatRoughness: 0.25,
        sheen: 0.6,
        sheenColor: new THREE.Color('#ffb0b8'),
        emissive: new THREE.Color('#5a1a24'),
        emissiveIntensity: 0.18,
      }),
    [],
  );
  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        transmission: 1,
        thickness: 0.04,
        ior: 1.5,
        roughness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.01,
        envMapIntensity: 4,
        specularIntensity: 1,
        side: THREE.DoubleSide,
      }),
    [],
  );

  // ---- aligner motion ----
  // 0-2.2s macro, hovering and turning in the air; 2.2-4.5s it travels down and seats on the teeth; 4.5-7s close-up
  const fit = interpolate(frame, [64, 135], [0, 1], {...cl, easing: Easing.inOut(Easing.quad)});
  const settle = interpolate(frame, [64, 135], [0, 1], {...cl, easing: out});
  const hoverY = 1.9 + Math.sin(frame / 22) * 0.05;
  const posY = hoverY * (1 - settle);
  const posZ = 2.6 * (1 - settle);
  const yaw = interpolate(frame, [0, 64, 135], [-0.95, 0.5, 0], {...cl, easing: io});
  const pitch = interpolate(frame, [0, 64, 135], [0.3, 0.25, 0], {...cl, easing: io});
  const roll = interpolate(frame, [0, 64, 135], [0.12, -0.08, 0], {...cl, easing: io});

  // ---- camera ----
  const kf = [0, 64, 135, 210];
  const lookAt = {
    x: interpolate(frame, kf, [0.0, 0.0, 0.1, 0.35], {...cl, easing: io}),
    y: interpolate(frame, kf, [1.95, 1.7, -0.05, 0.02], {...cl, easing: io}),
    z: interpolate(frame, kf, [2.6, 2.0, -0.4, 0.1], {...cl, easing: io}),
  };
  camera.position.set(
    interpolate(frame, kf, [0.9, 0.4, 0.1, 0.9], {...cl, easing: io}),
    interpolate(frame, kf, [2.5, 2.2, 0.7, 0.15], {...cl, easing: io}),
    interpolate(frame, kf, [8.4, 12.5, 15.2, 9.6], {...cl, easing: io}),
  );
  camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  (camera as THREE.PerspectiveCamera).fov = interpolate(frame, kf, [20, 24, 28, 21], {...cl, easing: io});
  camera.updateProjectionMatrix();

  // light sweeps across the edges by rotating the environment
  const envRot = interpolate(frame, [0, 210], [0.9, -0.7], cl);

  return (
    <>
      <Studio rot={envRot} />
      <mesh position={[0, 0, -18]} scale={[50, 70, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={backdrop} toneMapped={false} />
      </mesh>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 8]} intensity={2.2} color="#fff4e6" />
      <directionalLight position={[-6, 2, 4]} intensity={0.9} color="#e8f6ff" />

      <mesh geometry={gum} material={gumMat} scale={[1, 0.8, 0.9]} position={[0, 0.26, -0.02]} />
      {placed.map((t, i) => {
        const ps = pose(t, TEETH_P);
        return <mesh key={i} geometry={geoms[i].tooth} material={toothMat} position={ps.pos} rotation={ps.rot} />;
      })}

      <group position={[0, posY, posZ]} rotation={[pitch, yaw, roll]}>
        {placed.map((t, i) => {
          const ps = pose(t, TEETH_P);
          return <mesh key={i} geometry={geoms[i].shell} material={shellMat} position={ps.pos} rotation={ps.rot} />;
        })}
      </group>
      {fit < -1 && null}
    </>
  );
};
