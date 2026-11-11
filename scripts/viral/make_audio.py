"""Sound beds for the three viral clips, synthesised locally (no music library is available here).
A pulse, an airy pad, and a few hits placed on the visible actions. usage: python3 scripts/viral/make_audio.py
"""
import math, os, random, struct, wave

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)

FILMS = {
    "cs-viral-invisible": dict(dur=11.4, end=8.2, whoosh=[2.8, 3.55], click=[5.98], thud=[]),
    "cs-viral-tooth": dict(dur=13.0, end=9.8, whoosh=[1.6], click=[2.1, 3.72, 5.27, 6.82], thud=[]),
    "cs-viral-price": dict(dur=11.1, end=7.9, whoosh=[2.35], click=[], thud=[3.02, 3.64, 4.26, 4.72]),
}


def build(name, f):
    random.seed(11)
    N = int(SR * f["dur"])
    L = [0.0] * N
    R = [0.0] * N

    def add(t0, s, gl, gr=None):
        gr = gl if gr is None else gr
        i0 = int(t0 * SR)
        for i, v in enumerate(s):
            j = i0 + i
            if 0 <= j < N:
                L[j] += v * gl
                R[j] += v * gr

    beat = 0.6  # 100 bpm
    # pulse: a soft kick with enough click to exist on a phone speaker
    kick = [math.exp(-i / SR * 16) * math.sin(2 * math.pi * (48 + 70 * math.exp(-i / SR * 38)) * i / SR) + 0.25 * math.exp(-i / SR * 220) * (random.random() * 2 - 1) for i in range(int(0.34 * SR))]
    tick = [math.exp(-i / SR * 150) * (random.random() * 2 - 1) for i in range(int(0.06 * SR))]
    n = 0
    while n * beat < f["dur"] - 0.3:
        t = n * beat
        g = 0.5 if t < f["end"] else 0.32
        add(t, kick, g)
        add(t + beat / 2, tick, 0.07, 0.11)
        n += 1
    # pad: two chords, detuned sines with a slow swell
    chords = [[57, 64, 69, 72], [53, 60, 65, 72]]
    seg = beat * 4
    c = 0
    while c * seg < f["dur"]:
        ln = seg + 1.2
        for note in chords[c % 2]:
            for det, pan in ((-0.004, 0.3), (0.004, 0.7)):
                fr = hz(note) * (1 + det)
                s = [min(1, i / SR / 0.9) * min(1, (ln - i / SR) / 1.1) * (math.sin(2 * math.pi * fr * i / SR) + 0.3 * math.sin(4 * math.pi * fr * i / SR)) for i in range(int(ln * SR))]
                add(c * seg, s, 0.035 * (1.4 - pan), 0.035 * (0.4 + pan))
        c += 1

    def whoosh(t0, length=0.7, g=0.16):
        m = int(length * SR)
        y = 0.0
        o = []
        for i in range(m):
            x = i / m
            y += (0.03 + 0.45 * math.sin(math.pi * x) ** 2) * ((random.random() * 2 - 1) - y)
            o.append(y * math.sin(math.pi * x) ** 1.4)
        add(t0 - length * 0.55, o, g)

    for t in f["whoosh"]:
        whoosh(t)
    for t in f["click"]:  # the tray seating: a short glassy tap
        for note, g in ((96, 0.11), (103, 0.06), (108, 0.035)):
            fr = hz(note)
            add(t, [math.exp(-i / SR * 9) * math.sin(2 * math.pi * fr * i / SR) for i in range(int(0.7 * SR))], g)
        add(t, [math.exp(-i / SR * 300) * (random.random() * 2 - 1) for i in range(int(0.03 * SR))], 0.2)
    for k, t in enumerate(f["thud"]):  # a slab knocked out
        s = [math.exp(-i / SR * 11) * math.sin(2 * math.pi * (62 + 90 * math.exp(-i / SR * 30)) * i / SR) + 0.5 * math.exp(-i / SR * 70) * (random.random() * 2 - 1) for i in range(int(0.4 * SR))]
        add(t, s, 0.55, 0.55)
        whoosh(t + 0.3, 0.45, 0.1)
    # riser into the end card, then one impact
    m = int(0.9 * SR)
    y = 0.0
    o = []
    for i in range(m):
        x = i / m
        y += (0.05 + 0.5 * x * x) * ((random.random() * 2 - 1) - y)
        o.append(y * x * x)
    add(f["end"] - 0.9, o, 0.2)
    imp = [math.exp(-i / SR * 5) * math.sin(2 * math.pi * (42 + 60 * math.exp(-i / SR * 20)) * i / SR) + 0.35 * math.exp(-i / SR * 30) * (random.random() * 2 - 1) for i in range(int(1.1 * SR))]
    add(f["end"], imp, 0.7)
    for note, g in ((81, 0.07), (88, 0.05), (93, 0.035)):
        fr = hz(note)
        add(f["end"] + 0.02, [math.exp(-i / SR * 2.2) * math.sin(2 * math.pi * fr * i / SR) for i in range(int(2.4 * SR))], g)
    # short stereo echo
    D = int(0.21 * SR)
    for i in range(D, N):
        L[i] += 0.2 * R[i - D]
        R[i] += 0.2 * L[i - D]
    pk = max(max(map(abs, L)), max(map(abs, R)))
    out = os.path.join(ROOT, "videos", name, "assets", "sound.wav")
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        b = bytearray()
        for i in range(N):
            t = i / SR
            g = min(1, t / 0.03) * min(1, (f["dur"] - t) / 0.9) * 0.89 / pk  # -1 dBFS peak
            b += struct.pack("<hh", int(L[i] * g * 32767), int(R[i] * g * 32767))
        w.writeframes(bytes(b))
    print("wrote", out)


for name, f in FILMS.items():
    build(name, f)
