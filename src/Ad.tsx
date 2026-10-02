import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {ThreeCanvas} from '@remotion/three';
import {Scene3D} from './Scene3D';

const handle = delayRender('fonts');
Promise.all([
  loadFont({family: 'Heebo', url: staticFile('heebo-hebrew-wght-normal.woff2'), weight: '100 900', unicodeRange: 'U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F'}),
  loadFont({family: 'Heebo', url: staticFile('heebo-latin-wght-normal.woff2'), weight: '100 900', unicodeRange: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'}),
]).then(() => continueRender(handle));

const FONT = 'Heebo, sans-serif';
const T = (s: number) => Math.round(s * 30);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Subtitles = the narration lines (no voice-over track; see README)
const CAPTIONS = [
  {from: 0.0, to: 4.0, text: 'יש חיוכים שלא צריכים להישאר בפנים.'},
  {from: 4.0, to: 10.0, text: 'בסלב סמייל: קשתיות בהתאמה אישית, בייצור ישראלי ובפיקוח רופא.'},
  {from: 10.0, to: 15.0, text: 'ישירות מהמעבדה, עם פחות פערי תיווך.'},
];

const Caption: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  const a = from === 0 ? 1 : interpolate(f, [T(from), T(from) + 8], [0, 1], cl);
  const b = interpolate(f, [T(to) - 8, T(to)], [1, 0], cl);
  const o = Math.min(a, b);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, bottom: 330, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - a) * 14}px)`}}>
      <div dir="rtl" style={{fontFamily: FONT, fontWeight: 700, fontSize: 56, lineHeight: 1.25, color: '#fff', textAlign: 'center', textWrap: 'balance', padding: '18px 34px', borderRadius: 26, background: 'rgba(6,24,28,0.58)', backdropFilter: 'blur(6px)', textShadow: '0 2px 10px rgba(0,0,0,.5)'}}>
        {text}
      </div>
    </div>
  );
};

const Chip: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  const o = Math.min(interpolate(f, [T(from), T(from) + 8], [0, 1], cl), interpolate(f, [T(to) - 8, T(to)], [1, 0], cl));
  if (o <= 0) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 40, color: '#dffdf8', padding: '10px 28px', border: '2px solid rgba(150,250,236,.7)', borderRadius: 40, background: 'rgba(8,40,44,.45)', letterSpacing: 0.5}}>{text}</div>
    </div>
  );
};

const Stages: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [T(11), T(11) + 10, T(15) - 8, T(15)], [0, 1, 1, 0], cl);
  const stage = f < 340 ? 0 : f < 378 ? 1 : f < 416 ? 2 : 3;
  const labels = ['התחלה', 'שלב 1', 'שלב 2', 'שלב 3'];
  if (o <= 0) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16, opacity: o}}>
      {labels.map((l, i) => (
        <div key={i} style={{fontFamily: FONT, fontWeight: 700, fontSize: 36, padding: '8px 24px', borderRadius: 34, color: i === stage ? '#06312f' : '#cfeee9', background: i === stage ? '#8ff5e6' : 'rgba(8,40,44,.45)', border: '2px solid rgba(150,250,236,.6)'}}>
          {l}
        </div>
      ))}
    </div>
  );
};

const Disclaimer: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  const o = Math.min(interpolate(f, [T(from), T(from) + 8], [0, 1], cl), interpolate(f, [T(to) - 8, T(to)], [1, 0], cl));
  if (o <= 0) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', bottom: 250, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 34, color: 'rgba(255,255,255,.92)', opacity: o, textShadow: '0 2px 8px rgba(0,0,0,.6)'}}>
      {text}
    </div>
  );
};

const Tagline: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [T(3.5), T(4)], [1, 0], cl);
  if (o <= 0) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', top: 280, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 70, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,.55)'}}>יישור בקשתיות שקופות</div>
    </div>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.16, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 37} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bg = interpolate(f, [0, 12], [0, 1], cl);
  const pop = (d: number) => spring({frame: f - d, fps, config: {damping: 16, stiffness: 120}});
  const row = (d: number): React.CSSProperties => ({opacity: pop(d), transform: `translateY(${(1 - pop(d)) * 40}px)`});
  return (
    <AbsoluteFill style={{background: '#0d4448', opacity: bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center', padding: '0 70px', width: '100%'}}>
        <div style={{...row(6), display: 'flex', justifyContent: 'center', marginBottom: 14}}>
          <svg width="150" height="90" viewBox="0 0 150 90"><path d="M10 20 Q75 100 140 20" fill="none" stroke="#8ff5e6" strokeWidth="12" strokeLinecap="round" /></svg>
        </div>
        <div style={{...row(8), fontFamily: FONT, fontWeight: 800, fontSize: 138, color: '#fff', letterSpacing: -2}}>Celeb Smile</div>
        <div dir="rtl" style={{...row(14), fontFamily: FONT, fontWeight: 700, fontSize: 84, color: '#8ff5e6', marginTop: 6}}>פשוט לחייך.</div>
        <div dir="rtl" style={{...row(30), fontFamily: FONT, fontWeight: 800, fontSize: 70, color: '#fff', marginTop: 120}}>סריקה ללא עלות לזמן מוגבל</div>
        <div dir="rtl" style={{...row(40), fontFamily: FONT, fontWeight: 500, fontSize: 52, color: '#d7f3ef', marginTop: 26}}>באר שבע והסביבה</div>
        <div style={{...row(50), display: 'flex', justifyContent: 'center', marginTop: 60}}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 22, fontFamily: FONT, fontWeight: 700, fontSize: 56, color: '#fff', background: '#1f9e5a', padding: '24px 52px', borderRadius: 70}}>
            <svg width="58" height="58" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.4 2.4 0 0 0-.8 1.8c0 1 .7 2 .8 2.1a8.800 8.8 0 0 0 3.400 3c1.3.5 1.800.6 2.500.5.400-.1 1.400-.6 1.600-1.200.2-.6.2-1 .1-1.100z" /></svg>
            <span>לתיאום ב־<bdi>WhatsApp</bdi></span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ad: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#0b2a33'}}>
      <Audio src={staticFile('music.wav')} volume={0.9} />
      <Sequence from={0} durationInFrames={T(15) + 2}>
        <AbsoluteFill style={{filter: 'contrast(1.08) saturate(1.06)'}}>
          <ThreeCanvas width={width} height={height} dpr={1} camera={{fov: 26, position: [0, 0, 8], near: 0.1, far: 80}} gl={{antialias: true, toneMapping: 4, outputColorSpace: 'srgb'} as any}>
            <Scene3D />
          </ThreeCanvas>
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none'}} />
        <Grain />
        <Tagline />
        <Chip from={4.2} to={6.0} text="סריקה דיגיטלית" />
        <Chip from={6.0} to={8.0} text="תכנון טיפול אישי" />
        <Chip from={8.0} to={10.0} text="קשתית בהתאמה אישית" />
        <Stages />
        {CAPTIONS.map((c, i) => (
          <Caption key={i} {...c} />
        ))}
        <Disclaimer from={0} to={10} text="הדמיית מחשב להמחשה בלבד" />
        <Disclaimer from={10.2} to={15} text="הדמיה מואצת להמחשה" />
      </Sequence>
      <Sequence from={T(15)} durationInFrames={T(5)}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
