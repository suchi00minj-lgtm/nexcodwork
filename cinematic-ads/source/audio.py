#!/usr/bin/env python3
"""Timeline JSON -> finished soundtrack (dialogue + score + sfx + ambience), optionally muxed.
usage:
  python audio.py build/timeline-02.json                       -> build/mix-02.wav
  python audio.py build/timeline-02.json silent.mp4 final.mp4  -> mix + mux
  python audio.py --demo out_dir                               -> one wav per mood / sfx / ambience
All sound is synthesised here (numpy/scipy); nothing is downloaded."""
import json, os, sys, subprocess, hashlib
import numpy as np
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'audio', 'cache')
os.makedirs(CACHE, exist_ok=True)


# ---------------------------------------------------------------- helpers
def secs(n): return np.arange(n) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def db(x): return 10 ** (x / 20)


def rms(x):
    x = np.asarray(x)
    return float(np.sqrt(np.mean(x ** 2) + 1e-12))


def lp(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    return signal.sosfilt(signal.butter(order, fc, 'low', fs=SR, output='sos'), x, axis=-1)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x, axis=-1)


def bp(x, lo, hi, order=2):
    hi = min(hi, SR * 0.45)
    return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=-1)


def sweep_bp(x, f0, f1, q=3.0, blocks=64):
    """time varying band-pass by processing blocks with interpolated centre frequency"""
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), blocks + 1).astype(int)
    zi = None
    for b in range(blocks):
        fc = f0 * (f1 / f0) ** (b / max(1, blocks - 1))
        lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR * 0.45)
        sos = signal.butter(2, [lo, hi], 'band', fs=SR, output='sos')
        if zi is None: zi = signal.sosfilt_zi(sos) * 0
        seg, zi = signal.sosfilt(sos, x[edges[b]:edges[b + 1]], zi=zi)
        out[edges[b]:edges[b + 1]] = seg
    return out


def pink(n, rng):
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR); f[0] = f[1]
    y = np.fft.irfft(X / np.sqrt(f), n)
    return y / (np.std(y) + 1e-9)


def brown(n, rng):
    y = np.cumsum(rng.standard_normal(n)); y = hp(y, 20)
    return y / (np.std(y) + 1e-9)


def env_adsr(n, a, d, s, r_start, r):
    """a,d,r in seconds; r_start = time the note is released"""
    t = secs(n)
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    e = np.where(t > r_start, e * np.exp(-(t - r_start) / max(r, 1e-4)), e)
    return e


def fade(x, fin, fout):
    x = x.copy(); n = x.shape[-1]
    a, b = int(fin * SR), int(fout * SR)
    if a: x[..., :a] *= np.linspace(0, 1, a) ** 2
    if b: x[..., n - b:] *= np.linspace(1, 0, b) ** 2
    return x


_WT = {}
def saw(f, t, maxf=9000.0, phase=0.0):
    h = max(1, min(40, int(maxf / max(f, 1))))
    if h not in _WT:
        x = np.arange(4096) / 4096
        _WT[h] = sum(np.sin(2 * np.pi * k * x) / k for k in range(1, h + 1)) * 0.55
    ph = ((f * t + phase) % 1.0) * 4096
    return _WT[h][ph.astype(np.int32)]


_SQ = {}
def square(f, t, maxf=6000.0):
    h = max(1, min(30, int(maxf / max(f, 1))))
    if h not in _SQ:
        x = np.arange(4096) / 4096
        _SQ[h] = sum(np.sin(2 * np.pi * k * x) / k for k in range(1, h + 1, 2)) * 0.8
    return _SQ[h][(((f * t) % 1.0) * 4096).astype(np.int32)]


def impulse(sec, damp=6000, seed=1, pre=0.012, early=True):
    rng = np.random.default_rng(seed)
    n = int(sec * SR); t = secs(n)
    out = []
    for ch in range(2):
        x = rng.standard_normal(n) * np.exp(-t * 6.9 / sec)
        x = lp(x, damp, 1)
        # high frequencies die faster
        x = x * 0.6 + lp(x, damp * 0.35, 1) * 0.4 * np.exp(-t * 3 / sec)
        if early:
            for k in range(6):
                i = int((0.006 + rng.random() * 0.03) * SR); x[i] += (0.6 - k * 0.08) * (1 if rng.random() > .5 else -1) * 6
        x = np.concatenate([np.zeros(int(pre * SR)), x])
        out.append(x / np.sqrt(np.sum(x ** 2)))
    return np.array(out)


def reverb(st, ir, wet):
    """st: stereo (2,n); returns stereo of the same length with tail cut"""
    n = st.shape[1]
    w = np.array([signal.fftconvolve(st[c], ir[c])[:n] for c in range(2)])
    return st * (1 - wet * 0.35) + w * wet


def place(buf, x, at, pan=0.0, gain=1.0):
    """add mono or stereo x into stereo buf at time 'at' (seconds)"""
    i = int(round(at * SR))
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        x = np.array([x * l, x * r])
    if i < 0: x = x[:, -i:]; i = 0
    m = min(x.shape[1], buf.shape[1] - i)
    if m > 0: buf[:, i:i + m] += x[:, :m] * gain


# ---------------------------------------------------------------- instruments (mono unless noted)
def piano(f, dur, vel=0.6, rng=None):
    n = int((dur + 1.8) * SR); t = secs(n)
    out = np.zeros(n)
    B = 0.00035
    dec_scale = (262 / f) ** 0.35
    for k in range(1, 11):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 15000: break
        amp = (1 / k ** 1.25) * (0.35 + 0.65 * vel) ** (k - 1)
        d1 = np.exp(-t * (0.55 + 0.42 * k) / dec_scale)
        out += amp * (np.sin(2 * np.pi * fk * t) + 0.5 * np.sin(2 * np.pi * fk * 1.0009 * t + k)) * d1
    out *= (1 - np.exp(-t / 0.0025))
    out *= np.where(t < dur, 1, np.exp(-(t - dur) / 0.22))
    hn = np.random.default_rng(int(f)).standard_normal(int(0.02 * SR)) * np.exp(-secs(int(0.02 * SR)) / 0.004)
    out[:len(hn)] += bp(hn, 800, 5000) * 0.25 * vel
    return out * vel * 0.32


def epiano(f, dur, vel=0.5):
    n = int((dur + 1.2) * SR); t = secs(n)
    mod = np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 9) * 1.2
    out = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 1.1) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2.5)
    out *= (1 - np.exp(-t / 0.003)) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.2))
    return out * vel * 0.3


def pad(freqs, dur, bright=1400, attack=0.9, release=1.4, vib=0.0):
    """stereo pad of detuned saws"""
    n = int((dur + release * 2.5) * SR); t = secs(n)
    L = np.zeros(n); R = np.zeros(n)
    v = 1 + vib * np.sin(2 * np.pi * 5.2 * t) if vib else 1
    for j, f in enumerate(freqs):
        for c, (cents, ph) in enumerate([(-8, .1), (+7, .55), (0, .3)]):
            w = saw(f * 2 ** (cents / 1200) * (v if np.isscalar(v) else 1), t if np.isscalar(v) else t * v, 7000, ph + j * .17)
            if c == 0: L += w
            elif c == 1: R += w
            else: L += w * .6; R += w * .6
    st = lp(np.array([L, R]), bright, 2)
    e = env_adsr(n, attack, 1.0, 1.0, dur, release)
    return st * e / (len(freqs) * 2.2)


def strings_stac(f, dur=0.18, vel=0.6, bright=2600):
    n = int((dur + 0.35) * SR); t = secs(n)
    x = saw(f, t, 9000) + saw(f * 1.004, t, 9000, .3)
    x = lp(x, bright, 2)
    return x * env_adsr(n, 0.008, 0.12, 0.25, dur, 0.09) * vel * 0.5


def pluck(f, vel=0.6, decay=1.0, bright=1.0, buzz=0.0):
    n = int((0.25 + decay * 1.6) * SR); t = secs(n)
    out = np.zeros(n)
    bend = 1 + buzz * 0.01 * np.exp(-t * 18)
    for k in range(1, 16):
        fk = f * k
        if fk > 14000: break
        amp = 1 / k ** (1.35 - 0.35 * bright) * (1 + buzz * (0.6 if 4 <= k <= 9 else 0))
        out += amp * np.sin(2 * np.pi * fk * t * bend) * np.exp(-t * (1.8 + 1.4 * k) / decay)
    out *= 1 - np.exp(-t / 0.0015)
    return out * vel * 0.28


def bass(f, dur, vel=0.7, bright=700):
    n = int((dur + 0.3) * SR); t = secs(n)
    x = np.sin(2 * np.pi * f * t) + 0.35 * saw(f, t, 2500)
    x = lp(x, bright, 2)
    return x * env_adsr(n, 0.006, 0.25, 0.75, dur, 0.06) * vel * 0.55


def drone(f, dur, bright=500):
    n = int(dur * SR); t = secs(n)
    x = np.sin(2 * np.pi * f * t) + 0.5 * saw(f, t, 3000) + 0.35 * saw(f * 1.5, t, 3000, .4)
    x = lp(x, bright, 2) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t))
    return fade(x, 1.5, 1.5) * 0.4


def bell(f, vel=0.5, length=2.2):
    n = int(length * SR); t = secs(n)
    out = np.zeros(n)
    for r, a, d in [(1, 1, 1.4), (2.0, .45, 2.2), (2.76, .35, 3.1), (5.4, .2, 5.0), (8.93, .1, 7.0)]:
        if f * r < 16000: out += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)
    return out * (1 - np.exp(-t / 0.001)) * vel * 0.25


def harmonium(freqs, dur):
    n = int((dur + 0.6) * SR); t = secs(n)
    x = np.zeros(n)
    for f in freqs:
        for k, a in [(1, 1), (2, .7), (3, .55), (4, .35), (5, .3), (6, .18), (7, .12)]:
            x += a * np.sin(2 * np.pi * f * k * t + k)
    x = lp(x, 2600, 2) * (0.88 + 0.12 * np.sin(2 * np.pi * 0.6 * t))
    return x * env_adsr(n, 0.12, 0.4, 0.85, dur, 0.25) / (len(freqs) * 3.2)


def kick(vel=1.0):
    n = int(0.45 * SR); t = secs(n)
    f = 46 + 90 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    x[:200] += np.random.default_rng(3).standard_normal(200) * 0.3 * np.exp(-np.arange(200) / 40)
    return np.tanh(x * 1.6) * vel * 0.7


def snare(vel=1.0):
    n = int(0.3 * SR); t = secs(n); rng = np.random.default_rng(5)
    x = bp(rng.standard_normal(n), 1200, 8000) * np.exp(-t * 18) * 0.8 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.6
    return x * vel * 0.5


def clap(vel=1.0):
    n = int(0.3 * SR); t = secs(n); rng = np.random.default_rng(7)
    e = np.zeros(n)
    for o in (0, 0.011, 0.022):
        e += np.where(t >= o, np.exp(-(t - o) * (120 if o < 0.02 else 22)), 0)
    return bp(rng.standard_normal(n), 900, 5000) * e * vel * 0.45


def hat(vel=1.0, open_=False, seed=9):
    n = int((0.35 if open_ else 0.08) * SR); t = secs(n)
    x = hp(np.random.default_rng(seed).standard_normal(n), 7000) * np.exp(-t * (9 if open_ else 60))
    return x * vel * 0.28


def shaker(vel=1.0, seed=11):
    n = int(0.09 * SR); t = secs(n)
    x = bp(np.random.default_rng(seed).standard_normal(n), 4000, 11000) * np.sin(np.pi * np.minimum(t / 0.09, 1)) ** 2
    return x * vel * 0.22


def woodblock(f=1100, vel=1.0):
    n = int(0.12 * SR); t = secs(n)
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 55)
    return x * vel * 0.4


def boom(vel=1.0, f0=70, length=2.2):
    n = int(length * SR); t = secs(n)
    f = f0 * 0.55 + f0 * 0.6 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    x += lp(np.random.default_rng(13).standard_normal(n), 400) * np.exp(-t * 9) * 0.7
    return np.tanh(x * 1.4) * vel * 0.7


def timpani(f=65, vel=1.0):
    n = int(1.6 * SR); t = secs(n)
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) + 0.25 * np.sin(2 * np.pi * f * 1.98 * t)) * np.exp(-t * 3.2)
    x += lp(np.random.default_rng(17).standard_normal(n), 900) * np.exp(-t * 40) * 0.5
    return x * vel * 0.45


def riser(length=2.0, f0=300, f1=6000, seed=19):
    n = int(length * SR); t = secs(n)
    x = sweep_bp(np.random.default_rng(seed).standard_normal(n), f0, f1, 2.5)
    return x * (t / length) ** 2.2 * 0.5


def dhol_low(vel=1.0):
    n = int(0.5 * SR); t = secs(n)
    f = 62 + 50 * np.exp(-t * 20)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    x += bp(np.random.default_rng(23).standard_normal(n), 100, 900) * np.exp(-t * 40) * 0.4
    return np.tanh(x * 1.5) * vel * 0.6


def dhol_high(vel=1.0, seed=29):
    n = int(0.22 * SR); t = secs(n)
    x = bp(np.random.default_rng(seed).standard_normal(n), 900, 6000) * np.exp(-t * 32) + 0.6 * np.sin(2 * np.pi * 380 * t) * np.exp(-t * 26)
    return x * vel * 0.45


# ---------------------------------------------------------------- score
CH = {'maj': (0, 4, 7), 'min': (0, 3, 7)}
MOODS = {}


def mood(name):
    def deco(fn): MOODS[name] = fn; return fn
    return deco


class Score:
    def __init__(self, dur, bpm, seed):
        self.bpm = bpm; self.beat = 60 / bpm; self.bar = 4 * self.beat
        self.n = int((dur + 2) * SR); self.dur = dur
        self.nbars = int(np.ceil(dur / self.bar)) + 1
        self.rng = np.random.default_rng(seed)
        self.dry = np.zeros((2, self.n)); self.verb = np.zeros((2, self.n))

    def at(self, bar, beat=0.0, human=0.006):
        return bar * self.bar + beat * self.beat + (self.rng.normal(0, human) if human else 0)

    def add(self, x, t, pan=0.0, gain=1.0, wet=0.35):
        place(self.dry, x, t, pan, gain * (1 - wet * .4))
        if wet: place(self.verb, x, t, pan, gain * wet)

    def render(self, ir_len=2.4, damp=5500):
        ir = impulse(ir_len, damp, seed=self.bpm)
        w = np.array([signal.fftconvolve(self.verb[c], ir[c])[:self.n] for c in range(2)])
        out = self.dry + w
        return out[:, :int(self.dur * SR)]


def prog_cycle(prog, bar): return prog[bar % len(prog)]


@mood('emotional')
def m_emotional(dur, seed):
    s = Score(dur, 70, seed)
    prog = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]
    mel = [[(0, 76, 2), (2, 74, 1), (3, 72, 1)], [(0, 72, 3), (3, 69, 1)], [(0, 67, 2), (2, 76, 1), (3, 74, 1)], [(0, 74, 4)]]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        tones = sorted([root + 12] + v + [v[0] + 12, v[1] + 12])
        for i, idx in enumerate([0, 2, 3, 4, 5, 4, 3, 2]):
            s.add(piano(mtof(tones[idx]), s.beat * 0.9, 0.36 + 0.08 * (i % 4 == 0) + s.rng.normal(0, .03)), s.at(b, i * .5), pan=-0.15 + 0.06 * idx, wet=.45)
        s.add(piano(mtof(root), s.bar * 0.95, 0.42), s.at(b), pan=-.2, wet=.4)
        if b >= 2: s.add(pad([mtof(x) for x in v], s.bar, bright=1100, attack=1.2, release=1.6), s.at(b, 0, 0), gain=.55, wet=.5)
        if b >= 4:
            n = int(s.bar * SR)
            cello = lp(saw(mtof(root), secs(n + SR), 3000), 650) * env_adsr(n + SR, .5, 1, 1, s.bar, .6) * .22
            s.add(cello, s.at(b, 0, 0), wet=.4)
        if b >= 4 and (b // 4) % 2 == 1:
            for off, m, ln in mel[b % 4]:
                s.add(piano(mtof(m), s.beat * ln * .95, 0.55), s.at(b, off), pan=.1, wet=.55)
    return s.render(3.0, 5000)


@mood('calm')
def m_calm(dur, seed):
    s = Score(dur, 76, seed)
    prog = [(41, [57, 60, 65]), (40, [55, 60, 64]), (38, [57, 62, 65]), (46, [58, 62, 65])]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        for beat in (0, 2):
            for k, m in enumerate([root] + v):
                s.add(epiano(mtof(m), s.beat * 1.9, .42 if k else .5), s.at(b, beat) + k * 0.012, pan=-.2 + .13 * k, wet=.4)
        s.add(pad([mtof(x + 12) for x in v], s.bar, bright=1500, attack=1.4), s.at(b, 0, 0), gain=.35, wet=.5)
        if b >= 2:
            for i in range(4):
                s.add(bell(mtof(v[(i + b) % 3] + 24), .18), s.at(b, i + .5), pan=.35 * (1 if i % 2 else -1), wet=.6)
        if b >= 4:
            for i in range(8): s.add(shaker(.35 + .25 * (i % 2)), s.at(b, i * .5), pan=.3, wet=.2)
    return s.render(2.6, 6000)


@mood('tension')
def m_tension(dur, seed):
    s = Score(dur, 100, seed)
    prog = [(38, [50, 53, 57]), (38, [50, 53, 57]), (34, [50, 53, 58]), (33, [49, 52, 57])]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        s.add(drone(mtof(root), s.bar + .3, 380), s.at(b, 0, 0) - .15, gain=.8, wet=.2)
        for i in range(16):
            m = root + 12 + (12 if i in (3, 11) else 0) + (7 if i in (7, 15) else 0)
            s.add(strings_stac(mtof(m), .1, .5 + .25 * (i % 4 == 0)), s.at(b, i * .25, .003), pan=-.25, wet=.25)
        for i in range(4): s.add(woodblock(1500 if i % 2 else 1250, .35), s.at(b, i, 0), pan=.4, wet=.2)
        if b >= 2:
            hi = [81, 82][b % 2]
            s.add(pad([mtof(hi), mtof(hi - 12)], s.bar, bright=3000, attack=1.5, release=1.0, vib=0.003), s.at(b, 0, 0), gain=.28, wet=.6)
        if b >= 2 and b % 2 == 0: s.add(boom(.8, 60), s.at(b, 0, 0), wet=.5)
        if b >= 4:
            for p in (0, 1.5, 2, 3.5 if b % 2 else 2.75): s.add(timpani(mtof(root - 12) * 2, .45), s.at(b, p), wet=.35)
        if b % 4 == 3: s.add(riser(s.bar, 200, 4000), s.at(b, 0, 0), gain=.6, wet=.3)
    return s.render(2.2, 5000)


@mood('suspense')
def m_suspense(dur, seed):
    s = Score(dur, 64, seed)
    notes = [64, 67, 65, 71, 72, 64, 63, 67]
    for b in range(s.nbars):
        s.add(drone(mtof(28), s.bar + .5, 300), s.at(b, 0, 0) - .25, gain=.9, wet=.2)
        s.add(drone(mtof(35), s.bar + .5, 260), s.at(b, 0, 0) - .25, gain=.4, wet=.2)
        s.add(pad([mtof(76), mtof(77)], s.bar, bright=2600, attack=2.0, release=1.2, vib=0.004), s.at(b, 0, 0), gain=.22, wet=.7)
        s.add(piano(mtof(notes[b % len(notes)]), s.beat * 3, .38), s.at(b, 1 if b % 2 else 2.5), pan=.3 * (-1) ** b, wet=.75)
        if b >= 2:
            for p in (0, .38): s.add(kick(.38), s.at(b, p, 0), wet=.25)
            for p in (2, 2.38): s.add(kick(.3), s.at(b, p, 0), wet=.25)
        if b % 4 == 3: s.add(riser(s.bar * .9, 150, 2500, b), s.at(b, 0, 0), gain=.45, wet=.4)
    return s.render(3.2, 4200)


@mood('comedy')
def m_comedy(dur, seed):
    s = Score(dur, 128, seed)
    prog = [(41, [60, 65, 69]), (36, [60, 64, 67]), (46, [62, 65, 70]), (36, [60, 64, 67])]
    mel = [[(0, 72, .5), (.5, 69, .5), (1, 72, .5), (2, 77, .5), (3, 76, .25), (3.5, 77, .25)],
           [(0, 79, .5), (1, 76, .5), (1.5, 72, .5), (2, 74, .5), (3, 72, .5)],
           [(0, 74, .5), (.5, 70, .5), (1, 74, .5), (2, 77, .5), (2.5, 74, .5), (3, 70, .5)],
           [(0, 72, .5), (.5, 74, .5), (1, 76, .5), (2, 72, .5), (3, 67, .5)]]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        s.add(pluck(mtof(root), .9, .5), s.at(b, 0), pan=-.1, wet=.15)
        s.add(pluck(mtof(root + 7), .8, .5), s.at(b, 2), pan=-.1, wet=.15)
        for p in (1, 3):
            for k, m in enumerate(v): s.add(pluck(mtof(m), .38, .35, .8), s.at(b, p) + k * .008, pan=.2, wet=.2)
        s.add(woodblock(1300, .5), s.at(b, 3.5), pan=.5, wet=.15)
        if b % 2: s.add(woodblock(900, .4), s.at(b, 1.5), pan=-.5, wet=.15)
        for i in range(8): s.add(shaker(.16 + .1 * (i % 2)), s.at(b, i * .5), pan=.35, wet=.1)
        if b >= 2:
            down = -12 if (b // 4) % 2 else 0
            for off, m, ln in mel[b % 4]:
                s.add(pluck(mtof(m + down), .55, .45, 1.0), s.at(b, off), pan=.05, wet=.25)
                s.add(bell(mtof(m + down + 12), .08, .8), s.at(b, off), pan=.05, wet=.3)
    return s.render(1.6, 7000)


@mood('upbeat')
def m_upbeat(dur, seed):
    s = Score(dur, 112, seed)
    prog = [(43, [55, 59, 62]), (38, [54, 57, 62]), (40, [55, 59, 64]), (36, [55, 60, 64])]
    hook = [(0, 79, .5), (.75, 76, .5), (1.5, 74, .5), (2.5, 76, .5), (3, 79, .75)]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        s.add(pad([mtof(x) for x in v], s.bar, bright=1800, attack=.4, release=.6), s.at(b, 0, 0), gain=.32, wet=.4)
        for i in range(8): s.add(bass(mtof(root + (12 if i % 2 else 0)), s.beat * .42, .75), s.at(b, i * .5, .002), wet=.05)
        for p in (0, .75, 1.5, 2.5, 3.25):
            for k, m in enumerate(v): s.add(pluck(mtof(m + 12), .46, .4, .9), s.at(b, p) + k * .006, pan=-.3 + .3 * k, wet=.3)
        if b >= 1:
            for p in range(4): s.add(kick(.8), s.at(b, p, .001), wet=.05)
            for p in (1, 3): s.add(clap(.7), s.at(b, p), pan=.05, wet=.3)
        if b >= 2:
            for p in range(4): s.add(hat(.3, True), s.at(b, p + .5), pan=.3, wet=.1)
            for p in range(8): s.add(hat(.14), s.at(b, p * .5 + .25), pan=-.3, wet=.05)
        if b >= 4 and b % 2 == 0:
            for off, m, ln in hook: s.add(bell(mtof(m), .3, 1.4), s.at(b, off), pan=.15, wet=.35)
        if b % 4 == 3: s.add(riser(s.bar * .5, 400, 7000, b), s.at(b, 2, 0), gain=.35, wet=.2)
    return s.render(1.8, 7000)


@mood('inspiring')
def m_inspiring(dur, seed):
    s = Score(dur, 90, seed)
    prog = [(48, [60, 64, 67]), (47, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
    mel = [(0, 79, 2), (2, 76, 1), (3, 74, 1)]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        tones = sorted(v + [v[0] + 12, v[1] + 12, v[2] + 12])
        for i, idx in enumerate([0, 1, 2, 3, 4, 3, 2, 1]):
            s.add(piano(mtof(tones[idx]), s.beat * .8, .38 + .06 * (i % 2 == 0)), s.at(b, i * .5), pan=-.2 + .08 * idx, wet=.4)
        s.add(piano(mtof(root - 12), s.bar, .5), s.at(b), wet=.4)
        if b >= 2: s.add(pad([mtof(x) for x in v] + [mtof(root)], s.bar, bright=1300 + min(b, 12) * 120, attack=1.0), s.at(b, 0, 0), gain=.5, wet=.5)
        if b >= 4:
            for i in range(8): s.add(strings_stac(mtof(v[i % 3] - 12), .14, .42), s.at(b, i * .5, .003), pan=.3, wet=.35)
        if b >= 6:
            for p in (0, 2): s.add(kick(.7), s.at(b, p, .001), wet=.25)
            s.add(timpani(mtof(root - 24) * 2, .5), s.at(b, 3.5), wet=.4)
        if b >= 8:
            s.add(snare(.5), s.at(b, 2), wet=.5)
            if b % 2 == 0:
                for off, m, ln in mel: s.add(bell(mtof(m), .25, 2.0), s.at(b, off), pan=.1, wet=.5)
        if b in (3, 7): s.add(riser(s.bar, 300, 6000, b), s.at(b, 0, 0), gain=.5, wet=.3)
        if b in (4, 8): s.add(boom(.7, 55), s.at(b, 0, 0), wet=.5)
    return s.render(2.8, 6000)


@mood('news')
def m_news(dur, seed):
    s = Score(dur, 120, seed)
    prog = [(36, [60, 63, 67]), (36, [60, 63, 67]), (44, [60, 63, 68]), (43, [59, 62, 67])]
    for b in range(s.nbars):
        root, v = prog_cycle(prog, b)
        for i in range(16):
            if i in (2, 6, 10, 13): continue
            m = v[0] + (12 if i % 4 == 0 else 0)
            s.add(strings_stac(mtof(m), .07, .45 + .3 * (i % 4 == 0), 3800), s.at(b, i * .25, .002), pan=-.2, wet=.2)
        s.add(timpani(mtof(root - 12) * 2, .8), s.at(b, 0), wet=.35)
        if b % 2 == 0:
            n = int(s.beat * 1.4 * SR)
            stab = sum(lp(saw(mtof(m - 12), secs(n), 4000), 1500) for m in v) * env_adsr(n, .015, .25, .3, s.beat, .2) * .2
            s.add(stab, s.at(b, 0), wet=.35)
        for p in (0, 2): s.add(kick(.65), s.at(b, p, .001), wet=.1)
        for p in (1, 3): s.add(snare(.45), s.at(b, p), wet=.3)
        for i in range(16): s.add(hat(.13 + .08 * (i % 2 == 0)), s.at(b, i * .25), pan=.3, wet=.05)
        for i in (0, 3):
            n = int(.06 * SR); blip = np.sin(2 * np.pi * 1760 * secs(n)) * np.exp(-secs(n) * 40) * .12
            s.add(blip, s.at(b, 3 + i * .25, 0), pan=.5, wet=.2)
        if b % 4 == 3:
            for i in range(8): s.add(timpani(mtof(root - 12) * 2, .25 + .06 * i), s.at(b, 2 + i * .25, 0), wet=.3)
    return s.render(1.6, 6500)


@mood('festival')
def m_festival(dur, seed):
    s = Score(dur, 104, seed)
    chords = [(50, [62, 66, 69]), (48, [60, 64, 67]), (43, [62, 67, 71]), (50, [62, 66, 69])]
    mel = [[(0, 69, .5), (.5, 71, .5), (1, 69, .5), (1.5, 66, .5), (2, 64, 1), (3, 62, 1)],
           [(0, 66, .5), (.5, 69, .5), (1, 71, .5), (1.5, 74, .5), (2, 72, 1), (3, 69, 1)],
           [(0, 74, .75), (.75, 72, .25), (1, 69, .5), (1.5, 71, .5), (2, 69, 1), (3, 66, 1)],
           [(0, 64, .5), (.5, 66, .5), (1, 64, .5), (1.5, 62, .5), (2, 62, 2)]]
    for b in range(s.nbars):
        root, v = prog_cycle(chords, b)
        s.add(harmonium([mtof(x) for x in v], s.bar), s.at(b, 0, 0), gain=.6, pan=-.15, wet=.35)
        for p, m in zip(range(4), [57, 62, 62, 50]): s.add(pluck(mtof(m), .3, 1.6, .9, buzz=1), s.at(b, p), pan=-.4, wet=.4)
        for p in (0, 1.5, 2, 3.5): s.add(dhol_low(.85), s.at(b, p, .003), wet=.15)
        for p in (1, 3): s.add(dhol_high(.75), s.at(b, p), pan=.1, wet=.2)
        for p in (.5, 2.5, 3): s.add(dhol_high(.35, 31), s.at(b, p), pan=.1, wet=.15)
        for i in range(16): s.add(shaker(.25 + .25 * (i % 4 == 2), 37), s.at(b, i * .25, .002), pan=.4, wet=.1)
        if b >= 2:
            for off, m, ln in mel[b % 4]:
                s.add(pluck(mtof(m + 12), .5, .9, 1.0, buzz=1.4), s.at(b, off), pan=.15, wet=.35)
        if b % 2 == 0: s.add(bell(mtof(86), .15, 1.6), s.at(b, 0), pan=.5, wet=.5)
    return s.render(1.8, 7000)


def compose(mood_name, dur, seed=1):
    key = hashlib.md5(f'v4|{mood_name}|{dur:.2f}|{seed}'.encode()).hexdigest()[:12]
    f = os.path.join(CACHE, f'm_{mood_name}_{key}.npy')
    if os.path.exists(f): return np.load(f)
    x = MOODS.get(mood_name, m_upbeat)(dur, seed)
    x = hp(x, 35)
    x = x / (rms(x) + 1e-9) * db(-20)  # loudness-match all moods
    np.save(f, x.astype(np.float32))
    return x


# ---------------------------------------------------------------- sound effects (return mono or stereo)
def sfx(name, seed=0):
    rng = np.random.default_rng(seed + 101)
    def nz(n): return rng.standard_normal(n)
    if name == 'door_bell':
        out = np.zeros(int(2.4 * SR))
        place2 = lambda x, at: out.__setitem__(slice(int(at * SR), int(at * SR) + len(x)), out[int(at * SR):int(at * SR) + len(x)] + x[:len(out) - int(at * SR)])
        place2(bell(mtof(88), .9, 1.8), 0.0); place2(bell(mtof(84), .9, 1.8), 0.42)
        return out * .9
    if name == 'cash_register':
        n = int(1.6 * SR); t = secs(n); out = np.zeros(n)
        k = bp(nz(int(.18 * SR)), 300, 3000) * np.exp(-secs(int(.18 * SR)) * 25)
        out[:len(k)] += k * .8
        d = int(.12 * SR); drawer = bp(nz(int(.45 * SR)), 150, 1800) * np.exp(-secs(int(.45 * SR)) * 6) * .5
        out[d:d + len(drawer)] += drawer
        b = bell(2400, 1, 1.2) + bell(3150, .6, 1.2)
        i = int(.22 * SR); out[i:i + len(b)] += b[:n - i] * 1.4
        return out
    if name == 'phone_ding':
        n = int(.9 * SR); t = secs(n)
        return (np.sin(2 * np.pi * 1318 * t) + .6 * np.sin(2 * np.pi * 1975 * t)) * np.exp(-t * 6) * .35
    if name == 'notification':
        n = int(.7 * SR); t = secs(n)
        a = np.sin(2 * np.pi * 988 * t) * np.exp(-t * 14); b = np.sin(2 * np.pi * 1480 * t) * np.exp(-np.maximum(t - .11, 0) * 9) * (t > .11)
        return (a + b) * .3
    if name == 'clock_tick':
        out = np.zeros(int(3.2 * SR))
        for i in range(6):
            w = woodblock(2400 if i % 2 else 1900, .9) + hp(nz(int(.12 * SR)), 3000) * np.exp(-secs(int(.12 * SR)) * 90) * .2
            j = int(i * .5 * SR); out[j:j + len(w)] += w
        return out * .8
    if name == 'rain':
        n = int(5 * SR)
        x = np.array([hp(pink(n, rng), 600) * .35 + bp(nz(n), 2000, 9000) * .12 for _ in range(2)])
        return fade(x, .8, 1.2) * .5
    if name == 'thunder':
        n = int(5 * SR); t = secs(n)
        x = lp(brown(n, rng), 160) * (np.exp(-t * .9) * (1 + .6 * np.sin(2 * np.pi * 1.7 * t))) * 1.2
        crack = hp(nz(int(.3 * SR)), 900) * np.exp(-secs(int(.3 * SR)) * 14) * .5
        x[int(.05 * SR):int(.05 * SR) + len(crack)] += crack
        return fade(x, .02, 1.5) * .9
    if name == 'crowd':
        n = int(4 * SR); t = secs(n); x = np.zeros((2, n))
        for v in range(14):
            syl = lp(np.abs(nz(n)), 5 + rng.random() * 3, 1); syl = np.clip(syl / (np.std(syl) + 1e-9), 0, 3)
            f1 = 350 + rng.random() * 600
            voice = bp(nz(n), f1, f1 * 3.5) * syl
            pan = rng.uniform(-.8, .8)
            x[0] += voice * np.cos((pan + 1) * np.pi / 4); x[1] += voice * np.sin((pan + 1) * np.pi / 4)
        return fade(x / 14 * 1.6, .6, .9)
    if name in ('whoosh', 'swoosh_up'):
        L = .7 if name == 'whoosh' else 1.0
        n = int(L * SR); t = secs(n)
        f0, f1 = (2500, 300) if name == 'whoosh' else (250, 5000)
        x = sweep_bp(nz(n), f0, f1, 2.2)
        e = np.sin(np.pi * np.minimum(t / L, 1)) ** (1.6 if name == 'whoosh' else 3.0)
        if name == 'swoosh_up': e = (t / L) ** 2 * np.exp(-np.maximum(t - .85 * L, 0) * 30)
        pan = np.linspace(-.6, .6, n)
        return np.array([x * e * np.cos((pan + 1) * np.pi / 4), x * e * np.sin((pan + 1) * np.pi / 4)]) * 1.4
    if name == 'keyboard':
        out = np.zeros(int(1.8 * SR)); tt = 0.0
        while tt < 1.6:
            c = bp(nz(int(.03 * SR)), 1500, 7000) * np.exp(-secs(int(.03 * SR)) * 180) * rng.uniform(.4, .9)
            c[:40] += np.sin(np.linspace(0, 6, 40)) * .2
            j = int(tt * SR); out[j:j + len(c)] += c
            tt += rng.uniform(.06, .19)
        return out * .9
    if name == 'paper':
        n = int(.9 * SR); t = secs(n)
        x = hp(nz(n), 1800) * np.clip(lp(np.abs(nz(n)), 25, 1) * 6, 0, 1.5) * np.sin(np.pi * t / .9)
        return x * .45
    if name == 'heartbeat':
        out = np.zeros(int(2.6 * SR))
        for i in range(3):
            for o, g in ((0, 1), (.22, .7)):
                k = lp(kick(g), 160); j = int((i * .8 + o) * SR); out[j:j + len(k)] += k[:len(out) - j]
        return out * 1.3
    if name == 'camera_click':
        n = int(.25 * SR); out = np.zeros(n)
        for o in (0, .07):
            c = bp(nz(int(.03 * SR)), 1000, 8000) * np.exp(-secs(int(.03 * SR)) * 150); j = int(o * SR); out[j:j + len(c)] += c
        return out * .7
    if name == 'car_door':
        n = int(.8 * SR); t = secs(n)
        x = lp(nz(n), 300) * np.exp(-t * 18) * 2 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 14) * .6
        return x * .6
    if name == 'bike_horn':
        n = int(.9 * SR); t = secs(n); out = np.zeros(n)
        for o, L in ((0, .16), (.24, .34)):
            m = int(L * SR); tt = secs(m)
            h = lp(square(415, tt) + .7 * square(520, tt), 2600) * np.minimum(1, np.minimum(tt / .01, (L - tt) / .02))
            j = int(o * SR); out[j:j + m] += h
        return out * .35
    if name == 'scooter':
        n = int(3.2 * SR); t = secs(n)
        f = 34 + 10 * np.sin(np.pi * t / 3.2)
        x = lp(saw(1, np.cumsum(f) / SR, 2000) + .3 * nz(n) * .3, 1400)
        e = np.exp(-((t - 1.6) / .9) ** 2)
        pan = np.linspace(-.9, .9, n)
        return np.array([x * e * np.cos((pan + 1) * np.pi / 4), x * e * np.sin((pan + 1) * np.pi / 4)]) * .5
    if name == 'applause':
        n = int(3.5 * SR); out = np.zeros((2, n))
        for _ in range(420):
            c = clap(rng.uniform(.2, .6)); j = int(rng.uniform(0, 3.2) * SR); ch = rng.integers(0, 2)
            m = min(len(c), n - j); out[ch, j:j + m] += c[:m]
        return fade(out, .3, 1.0) * .6
    if name == 'printer':
        n = int(2.0 * SR); t = secs(n)
        gr = bp(nz(n), 1500, 6000) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 48 * t))) * .35
        mot = saw(220, t, 3000) * .06
        x = (gr + mot) * np.where(t < 1.5, 1, 0) * np.minimum(1, t / .03)
        tear = hp(nz(int(.25 * SR)), 2000) * np.exp(-secs(int(.25 * SR)) * 10) * .5
        j = int(1.62 * SR); x[j:j + len(tear)] += tear
        return x
    if name == 'gasp_hit':
        n = int(2.6 * SR)
        b = boom(1.0, 60, 2.6)
        t = secs(n); chord = sum(lp(saw(mtof(m), t, 5000), 1800) for m in (38, 45, 50, 53)) * np.exp(-t * 2.2) * .22 * np.minimum(1, t / .01)
        nzb = hp(nz(n), 2000) * np.exp(-t * 12) * .25
        x = b + chord + nzb
        return reverb(np.array([x, x]), impulse(2.0, 4500, 41), .5)
    if name == 'logo_chime':
        out = np.zeros(int(2.8 * SR))
        for i, m in enumerate((79, 84, 88)):
            bl = bell(mtof(m), .55, 2.4); j = int(i * .09 * SR); out[j:j + len(bl)] += bl[:len(out) - j]
        return reverb(np.array([out, out]), impulse(2.2, 6000, 43), .45)
    if name == 'impact':
        return boom(.8, 55, 1.8)
    if name == 'ui_tick':
        return woodblock(2600, .4)
    return np.zeros(int(.1 * SR))


SFX_GAIN = {'door_bell': -14, 'cash_register': -12, 'phone_ding': -15, 'notification': -15, 'clock_tick': -16, 'rain': -18,
            'thunder': -12, 'crowd': -20, 'whoosh': -16, 'swoosh_up': -16, 'keyboard': -17, 'paper': -17, 'heartbeat': -12,
            'camera_click': -15, 'car_door': -14, 'bike_horn': -18, 'scooter': -17, 'applause': -16, 'printer': -16,
            'gasp_hit': -9, 'logo_chime': -14, 'impact': -12, 'ui_tick': -20}


def sfx_norm(name, seed=0):
    x = sfx(name, seed)
    pk = np.max(np.abs(x)) + 1e-9
    return x / pk * db(SFX_GAIN.get(name, -16) + 6)


# ---------------------------------------------------------------- ambience beds (stereo, full length)
def ambience(name, n, seed=0):
    rng = np.random.default_rng(seed + 500)
    def st(f): return np.array([f(), f()])
    t = secs(n)
    room = st(lambda: lp(brown(n, rng), 260)) * .6 + st(lambda: lp(pink(n, rng), 2500)) * .05
    if name in ('store', 'store_night', 'room'):
        x = room
        traffic = st(lambda: lp(pink(n, rng), 700)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t + rng.random() * 6))
        x = x + traffic * (.35 if name == 'store' else .15)
        if name == 'store':
            for at in np.arange(rng.uniform(2, 5), n / SR, rng.uniform(6, 10)):
                h = lp(sfx('bike_horn', int(at)), 1500) * .12; place(x, h, at, rng.uniform(-.7, .7))
        if name == 'store_night':
            ch = np.zeros(n)
            for at in np.arange(0, n / SR, .5):
                m = int(.12 * SR); tt = secs(m)
                c = np.sin(2 * np.pi * 4300 * tt) * (np.sin(2 * np.pi * 28 * tt) > 0) * np.sin(np.pi * tt / .12)
                j = int((at + rng.uniform(0, .1)) * SR); ch[j:j + m] += c[:n - j] * .05
            x = x + np.array([ch, np.roll(ch, 2400)])
        return x
    if name in ('street', 'street_soft'):
        x = room * .5 + st(lambda: lp(pink(n, rng), 1100)) * (.9 if name == 'street' else .55) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.05 * t))
        gap = (4, 7) if name == 'street' else (7, 12)
        for at in np.arange(rng.uniform(1, 3), n / SR, rng.uniform(*gap)):
            place(x, sfx('bike_horn', int(at * 7)) * .25, at, rng.uniform(-.8, .8))
        if name == 'street':
            for at in np.arange(rng.uniform(2, 4), n / SR, 9): place(x, sfx('scooter', int(at)) * .5, at)
            cr = np.tile(sfx('crowd', 3), (1, int(np.ceil(n / (4 * SR))) + 1))[:, :n]
            x = x + cr * .08
        return x
    if name == 'fan':
        whir = lp(pink(n, rng), 900) * (0.75 + 0.25 * np.sin(2 * np.pi * 3.1 * t))
        return room * .7 + np.array([whir, np.roll(whir, 900)]) * .35
    if name == 'ac':
        hum = sum(np.sin(2 * np.pi * 50 * k * t) / k for k in (1, 2, 3)) * .05
        hiss = st(lambda: bp(pink(n, rng), 300, 3000)) * .18
        return room * .5 + hiss + np.array([hum, hum])
    if name == 'rain':
        x = st(lambda: hp(pink(n, rng), 500)) * .5 + st(lambda: bp(rng.standard_normal(n), 2500, 10000)) * .1 + room * .4
        drops = np.zeros(n)
        for at in rng.uniform(0, n / SR, int(n / SR * 3)):
            m = int(.03 * SR); d = np.sin(2 * np.pi * rng.uniform(1500, 3500) * secs(m)) * np.exp(-secs(m) * 140)
            j = int(at * SR); drops[j:j + m] += d[:n - j] * .15
        return x + np.array([drops, np.roll(drops, 700)])
    return np.zeros((2, n))


AMB_LEVEL = {'store': -40, 'store_night': -42, 'room': -44, 'street': -33, 'street_soft': -37, 'fan': -40, 'ac': -42, 'rain': -31}

DIALOG_ROOM = {'store_interior': (.5, .09), 'counter_closeup': (.45, .07), 'godown': (.9, .16), 'home': (.45, .08), 'ca_office': (.4, .06),
               'clinic': (.5, .08), 'street': (.25, .03), 'store_front': (.3, .04), 'news_studio': (.35, .04)}


def load_voice(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
    a = hp(a, 85)
    act = a[np.abs(a) > 0.02]
    level = rms(act) if len(act) else rms(a)
    return a / (level + 1e-9) * db(-19)


def smooth_env(x, att=0.06, rel=0.45, hop=240):
    """envelope follower on |x| -> per-sample gain curve"""
    m = len(x) // hop + 1
    blocks = np.pad(np.abs(x), (0, m * hop - len(x))).reshape(m, hop).max(axis=1)
    out = np.zeros(m); a = np.exp(-hop / SR / att); r = np.exp(-hop / SR / rel); y = 0
    for i, v in enumerate(blocks):
        y = a * y + (1 - a) * v if v > y else r * y + (1 - r) * v
        out[i] = y
    return np.interp(np.arange(len(x)), np.arange(m) * hop, out)


def mix(tl, out_wav):
    total = tl['total']
    n = int(np.ceil(total * SR)) + SR // 2
    dlg = {k: np.zeros((2, n)) for k in ('dry',) + tuple(DIALOG_ROOM)}
    for s in tl['shots']:
        room = s.get('set') if s['type'] == 'scene' and s.get('set') in DIALOG_ROOM else 'dry'
        for l in s.get('lines', []):
            v = load_voice(l['file'])
            pan = 0.0
            place(dlg[room], v, s['start'] + l['astart'], pan)
    dialogue = dlg['dry'].copy()
    for k, (ln, wet) in DIALOG_ROOM.items():
        if np.any(dlg[k]): dialogue += reverb(dlg[k], impulse(ln, 5000, 7), wet)
    dialogue = dialogue[:, :n]

    # ---- score with crossfades
    music = np.zeros((2, n))
    cues = tl.get('music_cues') or [{'mood': 'upbeat', 'time': 0}]
    XF = 1.2
    for i, c in enumerate(cues):
        t0 = max(0.0, c['time'] - (XF / 2 if i else 0))
        t1 = (cues[i + 1]['time'] + XF / 2) if i + 1 < len(cues) else total
        seed = int(hashlib.md5(f"{tl['id']}{i}".encode()).hexdigest()[:6], 16)
        x = compose(c['mood'], t1 - t0 + 0.05, seed)
        x = fade(x, XF if i else 0.25, XF if i + 1 < len(cues) else 2.4)
        place(music, x, t0)
    # ---- auto sound design for edits
    shots = tl['shots']
    events = list(tl.get('sfx', []))
    for i, s in enumerate(shots):
        tr = s.get('transition')
        if i and tr == 'whip': events.append({'name': 'whoosh', 'time': s['start'] - 0.32})
        if i and tr == 'flash': events.append({'name': 'impact', 'time': s['start'] - 0.02})
        if s['type'] == 'endcard':
            events.append({'name': 'swoosh_up', 'time': s['start'] - 0.75})
            events.append({'name': 'logo_chime', 'time': s['start'] + 0.35})
        if i and s['type'] in ('screen', 'card') and tr in (None, 'cut', 'fade'):
            events.append({'name': 'ui_tick', 'time': s['start'] + 0.05})
    fx = np.zeros((2, n))
    for k, e in enumerate(events):
        x = sfx_norm(e['name'], k)
        pan = {'door_bell': -.35, 'bike_horn': .5, 'scooter': 0, 'printer': .25, 'cash_register': .2}.get(e['name'], 0)
        place(fx, x, e['time'], pan)
    # ---- ambience beds, gated per shot with short fades
    amb = np.zeros((2, n))
    names = sorted({a['name'] for a in tl.get('amb', [])})
    for nm in names:
        bed = ambience(nm, n, hash(nm) % 1000)
        bed = bed / (rms(bed) + 1e-9) * db(AMB_LEVEL.get(nm, -42))
        gate = np.zeros(n)
        for a in tl['amb']:
            if a['name'] == nm: gate[int(a['start'] * SR):int(a['end'] * SR)] = 1
        gate = np.convolve(gate, np.ones(int(.06 * SR)) / int(.06 * SR), mode='same')
        amb += bed * gate
    # ---- ducking
    d_env = smooth_env(dialogue.sum(0) * .5)
    presence = np.clip(d_env / db(-30), 0, 1) ** .7
    music *= 1 - 0.68 * presence
    amb *= 1 - 0.3 * presence
    fx_env = smooth_env(fx.sum(0) * .5, .01, .3)
    music *= 1 - 0.25 * np.clip(fx_env / db(-14), 0, 1)
    master = dialogue + music * db(-4) + fx + amb
    master = master[:, :int(round(total * SR))]
    master = fade(master, 0.02, 0.4)
    tmp = out_wav + '.pre.wav'
    write_wav(tmp, master)
    loudnorm(tmp, out_wav)
    os.remove(tmp)
    return out_wav


def write_wav(path, st):
    st = np.clip(st, -1, 1)
    from scipy.io import wavfile
    wavfile.write(path, SR, (st.T * 32767).astype(np.int16))


def loudnorm(src, dst, I=-14, TP=-1.5, LRA=11):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    js = r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1]
    m = json.loads(js)
    af = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample={SR}")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', str(SR), dst], check=True)


def mux(video, wav, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', '-shortest', out], check=True)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--demo':
        od = a[1]; os.makedirs(od, exist_ok=True)
        for m in MOODS:
            write_wav(os.path.join(od, f'music_{m}.wav'), compose(m, 20, 1) * db(-2))
        for nm in SFX_GAIN:
            x = sfx_norm(nm)
            write_wav(os.path.join(od, f'sfx_{nm}.wav'), x if x.ndim == 2 else np.array([x, x]))
        for nm in AMB_LEVEL:
            b = ambience(nm, 8 * SR); write_wav(os.path.join(od, f'amb_{nm}.wav'), b / rms(b) * db(-30))
        print('ok')
        sys.exit()
    tl = json.load(open(a[0]))
    wav = os.path.join(HERE, 'build', f"mix-{tl['id']}.wav")
    mix(tl, wav)
    if len(a) >= 3: mux(a[1], wav, a[2])
    print(wav)
