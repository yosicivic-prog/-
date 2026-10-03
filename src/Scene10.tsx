import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {placed, pose, R, toothGeometry} from './Scene3D';
import {Studio, openShell} from './Scene7';

export const START = 45; // straightening starts (frames)
export const END = 255; // fully straight
export const straightness = (f: number) =>
  interpolate(f, [START, END], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

const backdropTexture = () => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#e4e5f0');
  g.addColorStop(0.5, '#b9bbd4');
  g.addColorStop(1, '#8486ab');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  return new THREE.CanvasTexture(c);
};

const LOWER_Y = -2.2;

export const Scene10: React.FC = () => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const io = Easing.inOut(Easing.cubic);
  const p = straightness(frame);
  const pLower = straightness(frame - 12); // lower arch lags slightly: more natural

  const geoms = useMemo(
    () =>
      placed.map((t) => ({
        tooth: toothGeometry(t.w, t.h, t.d),
        shell: openShell(toothGeometry(t.w + 0.11, t.h + 0.08, t.d + 0.11, 0.6), t.h / 2 - 0.2),
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
  const bg = useMemo(backdropTexture, []);

  const toothMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f0e7d4', roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: new THREE.Color('#ffe9d0'),
        emissive: new THREE.Color('#3a2a1e'), emissiveIntensity: 0.16, envMapIntensity: 0.8, side: THREE.DoubleSide,
      }),
    [],
  );
  const gumMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d9737c', roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.6, sheenColor: new THREE.Color('#ffb0b8'),
        emissive: new THREE.Color('#5a1a24'), emissiveIntensity: 0.18, side: THREE.DoubleSide,
      }),
    [],
  );
  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#eafcff', emissive: new THREE.Color('#2a6f78'), emissiveIntensity: 0.12, transmission: 1, thickness: 0.04, ior: 1.5, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.01,
        envMapIntensity: 4, specularIntensity: 1, side: THREE.DoubleSide,
      }),
    [],
  );
  const mouthMat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, '#4a1622');
    g.addColorStop(0.7, '#5b1e2a');
    g.addColorStop(1, 'rgba(91,30,42,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false});
  }, []);

  // camera: slow drift + push-in
  camera.position.set(
    interpolate(frame, [0, 300], [-0.7, 0.7], {...cl, easing: Easing.inOut(Easing.sin)}),
    interpolate(frame, [0, 300], [0.9, 0.5], {...cl, easing: io}),
    interpolate(frame, [0, 300], [19, 16.2], {...cl, easing: io}),
  );
  camera.lookAt(0, -1.15, -0.6);
  (camera as THREE.PerspectiveCamera).fov = 30;
  camera.updateProjectionMatrix();

  const Arch = ({pp}: {pp: number}) => (
    <>
      <mesh geometry={gum} material={gumMat} scale={[1, 0.8, 0.9]} position={[0, 0.26, -0.02]} />
      {placed.map((t, i) => {
        const ps = pose(t, pp);
        return <mesh key={i} geometry={geoms[i].tooth} material={toothMat} position={ps.pos} rotation={ps.rot} />;
      })}
      {placed.map((t, i) => {
        const ps = pose(t, Math.min(1, pp + 0.0));
        return <mesh key={'s' + i} geometry={geoms[i].shell} material={shellMat} position={ps.pos} rotation={ps.rot} />;
      })}
    </>
  );

  return (
    <>
      <Studio rot={interpolate(frame, [0, 300], [0.8, -0.6], cl)} />
      <mesh position={[0, 0, -18]} scale={[60, 80, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={bg} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.1, -4.6]} scale={[13, 9, 1]}>
        <planeGeometry />
        <primitive object={mouthMat} attach="material" />
      </mesh>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 9]} intensity={2.2} color="#fff4e6" />
      <directionalLight position={[-6, 1, 4]} intensity={0.9} color="#e8f0ff" />
      <group>
        <Arch pp={p} />
      </group>
      <group position={[0, LOWER_Y, -0.1]} scale={[1, -1, 1]}>
        <Arch pp={pLower} />
      </group>
    </>
  );
};
