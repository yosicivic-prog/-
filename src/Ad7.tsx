import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Scene7} from './Scene7';
import {Grain} from './Ad';

const FONT = 'Heebo, sans-serif';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Tilt: React.FC<{side: 'top' | 'bottom'}> = ({side}) => (
  <AbsoluteFill
    style={{
      backdropFilter: 'blur(10px)',
      WebkitMaskImage: `linear-gradient(${side === 'top' ? 'to bottom' : 'to top'}, black 0%, black 12%, transparent 30%)`,
      maskImage: `linear-gradient(${side === 'top' ? 'to bottom' : 'to top'}, black 0%, black 12%, transparent 30%)`,
    }}
  />
);

const EndText: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 150, fps, config: {damping: 20, stiffness: 90}});
  const o = interpolate(f, [150, 166], [0, 1], cl);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 330, opacity: o}}>
      <div dir="rtl" style={{transform: `translateY(${(1 - s) * 24}px)`, textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 3px 22px rgba(5,30,34,.6)'}}>קשתיות שקופות.</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: '0 3px 22px rgba(5,30,34,.6)'}}>פשוט לחייך.</div>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: '#d9f7f3', marginTop: 22, letterSpacing: 1, direction: 'ltr'}}>Celeb Smile</div>
      </div>
    </AbsoluteFill>
  );
};

export const Ad7: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#97aeb2'}}>
      <Audio src={staticFile('music7.wav')} volume={0.9} />
      <AbsoluteFill style={{filter: 'contrast(1.06) saturate(1.04)'}}>
        <ThreeCanvas width={width} height={height} dpr={1} camera={{fov: 20, position: [0, 0, 8], near: 0.1, far: 90}} gl={{antialias: true, toneMapping: 4, outputColorSpace: 'srgb'} as any}>
          <Scene7 />
        </ThreeCanvas>
      </AbsoluteFill>
      <Tilt side="top" />
      <Tilt side="bottom" />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,40,44,.28) 100%)', pointerEvents: 'none'}} />
      <Grain />
      <EndText />
    </AbsoluteFill>
  );
};
