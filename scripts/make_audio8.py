"""Original 7s ambient track + soft glass 'seat' chime, synthesised locally."""
import math, random, struct, wave
SR = 44100; DUR = 8.0; N = int(SR * DUR)
random.seed(3)
L = [0.0] * N; R = [0.0] * N
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def add(buf, t0, s, g):
    i0 = int(t0 * SR)
    for i, v in enumerate(s):
        if 0 <= i0 + i < N: buf[i0 + i] += v * g
for ci, chord in enumerate([[48, 55, 59, 64], [45, 52, 59, 64]]):
    n = int(4.6 * SR)
    for note in chord:
        for det, pan in ((-0.003, .35), (0.003, .65)):
            f = hz(note) * (1 + det)
            s = [min(1, i / SR / 1.2) * min(1, (4.6 - i / SR) / 1.4) * (math.sin(2*math.pi*f*i/SR) + .25*math.sin(4*math.pi*f*i/SR)) for i in range(n)]
            add(L, ci * 3.4, s, .05 * (1.5 - pan)); add(R, ci * 3.4, s, .05 * (.5 + pan))
for k, note in enumerate([76, 79, 83, 79, 72, 76, 79]):
    f = hz(note); s = [math.exp(-i/SR*3.4) * math.sin(2*math.pi*f*i/SR) for i in range(int(1.2*SR))]
    add(L, .6 + k * .55, s, .05); add(R, .6 + k * .55, s, .05)
def whoosh(t0, length=1.4, g=.1):
    n = int(length * SR); y = 0; o = []
    for i in range(n):
        x = i / n; y += (.02 + .3 * math.sin(math.pi * x) ** 2) * ((random.random()*2-1) - y); o.append(y * math.sin(math.pi * x) ** 1.5)
    add(L, t0, o, g); add(R, t0, o, g)
whoosh(1.85)
for note, g in ((91, .09), (98, .05), (103, .03)):   # glass "click" as the aligner seats (~4.5s)
    f = hz(note); s = [math.exp(-i/SR*5) * math.sin(2*math.pi*f*i/SR) for i in range(int(2*SR))]
    add(L, 4.95, s, g); add(R, 4.95, s, g)
D = int(.27 * SR)
for i in range(D, N): L[i] += .25 * R[i - D]; R[i] += .25 * L[i - D]
pk = max(max(map(abs, L)), max(map(abs, R)))
with wave.open('videos/celeb-smile-8s/assets/music8.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    b = bytearray()
    for i in range(N):
        t = i / SR; m = min(1, t / .6) * min(1, (DUR - t) / 1.2) * .8 / pk
        b += struct.pack('<hh', int(L[i]*m*32767), int(R[i]*m*32767))
    w.writeframes(bytes(b))
