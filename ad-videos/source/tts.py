import json,subprocess,os,sys,concurrent.futures as cf
V=json.load(open('campaign.json'))
os.makedirs('build/vo',exist_ok=True)
env=dict(os.environ)
VOICE=sys.argv[1] if len(sys.argv)>1 else 'hi-IN-SwaraNeural'
jobs=[]
for v in V:
    for i,s in enumerate(v['scenes']):
        out=f"build/vo/{v['id']}_{i}.mp3"
        s['vofile']=out
        jobs.append((s['vo'],out))
def run(j):
    text,out=j
    if os.path.exists(out) and os.path.getsize(out)>0: return out
    for k in range(3):
        proxy=['--proxy',os.environ['HTTPS_PROXY']] if os.environ.get('HTTPS_PROXY') else []
        r=subprocess.run(['edge-tts']+proxy+['--voice',VOICE,'--rate=+14%','--text',text,'--write-media',out],env=env,capture_output=True,text=True)
        if r.returncode==0 and os.path.getsize(out)>0: return out
    raise SystemExit('tts fail '+out+r.stderr[-300:])
with cf.ThreadPoolExecutor(6) as ex: list(ex.map(run,jobs))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]).decode().strip())
MIN={'hook':2.6,'shot':3.0,'bullets':3.2,'stat':2.6,'price':3.4,'cta':4.6}
for v in V:
    t=0
    for s in v['scenes']:
        d=dur(s['vofile']); s['vodur']=round(d,3)
        s['dur']=round(max(MIN[s['type']], d+0.55 + (0.5 if s['type']=='cta' else 0)),2)
        s['start']=round(t,3); t+=s['dur']
    v['total']=round(t,2)
    print(v['id'],v['total'],[s['dur'] for s in v['scenes']])
json.dump(V,open('build/timeline.json','w'),ensure_ascii=False,indent=1)
