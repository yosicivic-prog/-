"""Synthesises an original 20s ambient track locally (no samples, no external audio)."""
import math, random, struct, wave

SR = 44100
DUR = 20.0
N = int(SR * DUR)
random.seed(7)
L = [0.0] * N
R = [0.0] * N

def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def add(buf, start, samples, gain):
    i0 = int(start * SR)
    for i, v in enumerate(samples):
        j = i0 + i
        if 0 <= j < N:
            buf[j] += v * gain

# --- pad: Cmaj7 -> Am7 -> Fmaj7 -> G6, 5s each, slow attack/release, slight detune
chords = [[48, 55, 59, 64], [45, 52, 59, 64], [41, 48, 57, 64], [43, 50, 59, 64]]
for ci, chord in enumerate(chords):
    t0 = ci * 5.0
    length = 6.6
    n = int(length * SR)
    for k, note in enumerate(chord):
        for det, pan in ((-0.0035, 0.35), (0.0035, 0.65)):
            f = hz(note) * (1 + det)
            s = []
            for i in range(n):
                t = i / SR
                env = min(1, t / 1.6) * min(1, (length - t) / 1.8)
                env *= 0.85 + 0.15 * math.sin(2 * math.pi * 0.2 * t + k)
                s.append(env * (math.sin(2 * math.pi * f * t) + 0.25 * math.sin(2 * math.pi * 2 * f * t)))
            add(L, t0, s, 0.045 * (1 - pan + 0.5))
            add(R, t0, s, 0.045 * (pan + 0.5))

# --- pluck arpeggio from 3.5s
arp = [[72, 76, 79, 83], [69, 72, 76, 79], [65, 69, 72, 76], [67, 71, 74, 79]]
step = 0.5
t = 3.5
idx = 0
while t < 18.5:
    chord = arp[min(3, int(t // 5))]
    note = chord[idx % 4]
    n = int(1.4 * SR)
    f = hz(note)
    s = [math.exp(-i / SR * 3.2) * (math.sin(2 * math.pi * f * i / SR) + 0.3 * math.sin(2 * math.pi * 3 * f * i / SR)) for i in range(n)]
    pan = 0.3 + 0.4 * ((idx % 4) / 3)
    add(L, t, s, 0.07 * (1 - pan + 0.3))
    add(R, t, s, 0.07 * (pan + 0.3))
    t += step
    idx += 1

# --- soft swells (filtered noise) at scene changes
def whoosh(t0, length=1.1, gain=0.12):
    n = int(length * SR)
    y = 0.0
    out = []
    for i in range(n):
        x = i / n
        a = 0.02 + 0.35 * math.sin(math.pi * x) ** 2
        y += a * ((random.random() * 2 - 1) - y)
        out.append(y * math.sin(math.pi * x) ** 1.5)
    add(L, t0, out, gain)
    add(R, t0, out, gain)
for tw in (3.55, 9.55, 14.55):
    whoosh(tw)

# --- bell chime at the CTA (15.1s)
for note, g in ((88, 0.09), (95, 0.05), (100, 0.03)):
    f = hz(note)
    n = int(3.0 * SR)
    s = [math.exp(-i / SR * 1.6) * math.sin(2 * math.pi * f * i / SR) for i in range(n)]
    add(L, 15.1, s, g)
    add(R, 15.1, s, g)

# --- cheap stereo echo + master fades
D = int(0.31 * SR)
for i in range(D, N):
    L[i] += 0.28 * R[i - D]
    R[i] += 0.28 * L[i - D]
peak = max(max(abs(v) for v in L), max(abs(v) for v in R))
with wave.open('public/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    frames = bytearray()
    for i in range(N):
        t = i / SR
        m = min(1, t / 2.0) * min(1, (DUR - t) / 1.5) * 0.8 / peak
        frames += struct.pack('<hh', int(max(-1, min(1, L[i] * m)) * 32767), int(max(-1, min(1, R[i] * m)) * 32767))
    w.writeframes(bytes(frames))
print('ok', peak)
