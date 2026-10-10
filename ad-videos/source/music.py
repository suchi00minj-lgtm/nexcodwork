# Royalty-free background bed, synthesised here: 104 BPM, C-G-Am-F, soft pad + pluck + light drums.
import numpy as np, wave
SR=44100; BPM=104; beat=60/BPM; bars=20; L=int(SR*beat*4*bars)
t=np.arange(L)/SR; out=np.zeros(L)
def note(f): return 440*2**((f-69)/12)
chords=[[48,52,55,60],[43,47,50,55],[45,48,52,57],[41,45,48,53]]  # C G Am F
rng=np.random.default_rng(7)
for b in range(bars):
    ch=chords[b%4]; s=int(b*4*beat*SR); n=int(4*beat*SR); tt=np.arange(n)/SR
    env=np.minimum(1,tt/0.4)*np.minimum(1,(4*beat-tt)/0.3)
    pad=sum(np.sin(2*np.pi*note(m+12)*tt)*0.5+np.sin(2*np.pi*note(m+12)*1.003*tt)*0.5 for m in ch[1:])/3
    out[s:s+n]+=0.10*pad*env
    bass=np.sin(2*np.pi*note(ch[0]-12)*tt)*np.exp(-tt*1.2)
    out[s:s+n]+=0.16*bass
    arp=[ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+12,ch[1]+24,ch[3]+12,ch[2]+12,ch[3]+12]
    for k in range(8):
        a=s+int(k*beat/2*SR); m=int(beat/2*SR*1.6); m=min(m,L-a); ta=np.arange(m)/SR
        tone=np.sign(np.sin(2*np.pi*note(arp[k])*ta))*0.25+np.sin(2*np.pi*note(arp[k])*ta)
        out[a:a+m]+=0.045*tone*np.exp(-ta*7)
    for k in range(4):
        a=s+int(k*beat*SR); m=int(0.25*SR); ta=np.arange(m)/SR
        if k in (0,2):
            f=110*np.exp(-ta*18)+45; ph=2*np.pi*np.cumsum(f)/SR
            out[a:a+m]+=0.30*np.sin(ph)*np.exp(-ta*9)
        else:
            out[a:a+m]+=0.06*rng.standard_normal(m)*np.exp(-ta*22)
        for h in (0,0.5):
            a2=s+int((k+h)*beat*SR); m2=int(0.05*SR); nz=rng.standard_normal(m2); nz=np.diff(np.concatenate([[0],nz]))
            out[a2:a2+m2]+=0.025*nz*np.exp(-np.arange(m2)/SR*60)
out/=np.max(np.abs(out))*1.15
st=np.stack([out,np.roll(out,int(SR*0.012))],1)
w=wave.open('build/music.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
w.writeframes((st*32767).astype(np.int16).tobytes());w.close()
print('music',L/SR,'s')
