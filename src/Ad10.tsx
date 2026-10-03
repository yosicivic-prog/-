import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Scene10, START, END} from './Scene10';
import {Grain} from './Ad';

const FONT = 'Heebo, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Stages: React.FC = () => {
  const f = useCurrentFrame();
  const t = (f - START) / (END - START);
  const stage = t < 0 ? 0 : t < 0.34 ? 1 : t < 0.67 ? 2 : 3;
  const labels = ['התחלה', 'שלב 1', 'שלב 2', 'שלב 3'];
  return (
    <div dir="rtl" style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16}}>
      {labels.map((l, i) => (
        <div key={i} style={{fontFamily: FONT, fontWeight: 700, fontSize: 36, padding: '8px 26px', borderRadius: 34, color: i === stage ? '#fff' : '#41436b', background: i === stage ? '#5a5ca8' : 'rgba(255,255,255,.55)', border: '2px solid rgba(90,92,168,.6)'}}>
          {l}
        </div>
      ))}
    </div>
  );
};

export const Ad10: React.FC = () => {
  const {width, height} = useVideoConfig();
  const f = useCurrentFrame();
  const endO = interpolate(f, [255, 275], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: '#b9bbd4'}}>
      <Audio src={staticFile('music.wav')} endAt={300} volume={(fr) => 0.9 * interpolate(fr, [250, 300], [1, 0], cl)} />
      <AbsoluteFill style={{filter: 'contrast(1.05) saturate(1.05)'}}>
        <ThreeCanvas width={width} height={height} dpr={1} camera={{fov: 30, position: [0, 0, 14], near: 0.1, far: 90}} gl={{antialias: true, toneMapping: 4, outputColorSpace: 'srgb'} as any}>
          <Scene10 />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(30,30,70,.28) 100%)'}} />
      <Grain />
      <Stages />
      <div dir="rtl" style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 64, color: '#2b2d5e'}}>קשתיות שקופות</div>
      <div dir="rtl" style={{position: 'absolute', bottom: 300, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 40, color: '#2b2d5e', opacity: 1}}>הדמיה מואצת להמחשה</div>
      <div style={{position: 'absolute', bottom: 220, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 44, letterSpacing: 8, color: '#2b2d5e', opacity: endO}}>CELEB SMILE</div>
    </AbsoluteFill>
  );
};
