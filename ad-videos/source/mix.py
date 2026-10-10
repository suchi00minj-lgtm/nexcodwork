import json,subprocess,sys,os
V=json.load(open('build/timeline.json'))
ids=sys.argv[1].split(',') if len(sys.argv)>1 and sys.argv[1] else [v['id'] for v in V]
os.makedirs('final',exist_ok=True)
for v in V:
    if v['id'] not in ids: continue
    T=v['total']; ins=['-i',f"build/silent_{v['id']}.mp4",'-i','build/music.wav']; f=[]; labs=[]
    for i,s in enumerate(v['scenes']):
        ins+=['-i',s['vofile']]; ms=int((s['start']+0.2)*1000)
        f.append(f"[{i+2}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{i}]"); labs.append(f"[v{i}]")
    f.append(f"{''.join(labs)}amix=inputs={len(labs)}:normalize=0,apad=whole_dur={T}[vo]")
    f.append("[vo]asplit=2[vo1][vo2]")
    f.append(f"[1:a]atrim=0:{T},asetpts=N/SR/TB,volume=0.30[m]")
    f.append("[m][vo1]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350[md]")
    f.append(f"[md][vo2]amix=inputs=2:normalize=0,afade=t=out:st={T-1.3}:d=1.3,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[aout]")
    out=f"final/day-{v['id']}-{v['slug']}.mp4"
    cmd=['ffmpeg','-y','-loglevel','error']+ins+['-filter_complex',';'.join(f),'-map','0:v','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','160k','-t',str(T),'-movflags','+faststart',out]
    subprocess.run(cmd,check=True)
    print('mixed',out)
