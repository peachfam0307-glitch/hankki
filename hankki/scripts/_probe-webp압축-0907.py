import os,re,io,collections,json,sys
from PIL import Image
d='dist/assets'; out={}
files=sorted(f for f in os.listdir(d) if f.endswith('.png'))
tot=collections.defaultdict(lambda:[0,0,0,0,0])  # n, png, webp85, webpLL, px>1024
dims=collections.Counter()
for i,f in enumerate(files):
    m=re.match(r'^([a-zA-Z]+?)[_\-]?\d',f) or re.match(r'^([a-zA-Z]+)',f); k=m.group(1)
    p=os.path.join(d,f); s=os.path.getsize(p)
    try: im=Image.open(p).convert('RGBA')
    except Exception as e: continue
    w=im.width; dims[min(w//512*512,2048)]+=1
    b=io.BytesIO(); im.save(b,'WEBP',quality=85,method=4); a=b.tell()
    b=io.BytesIO(); im.save(b,'WEBP',lossless=True,method=4); l=b.tell()
    t=tot[k]; t[0]+=1; t[1]+=s; t[2]+=a; t[3]+=l; t[4]+= (w>1024)
    if i%300==0: print(i,'/',len(files),file=sys.stderr,flush=True)
json.dump({'tot':tot,'dims':dims},open('/tmp/claude-0/-home-user-hankki/80070571-2b0b-555b-9e75-fec80b60b45e/scratchpad/webp_measure.json','w'))
P=sum(v[1] for v in tot.values()); A=sum(v[2] for v in tot.values()); L=sum(v[3] for v in tot.values())
print(f"png 합계 {P/1e6:.0f}MB → webp q85 {A/1e6:.0f}MB ({A/P:.0%}) · webp 무손실 {L/1e6:.0f}MB ({L/P:.0%})")
print('가로px 구간(512단위):',sorted(dims.items()))
print(f"{'접두어':<7}{'장수':>5}{'png MB':>8}{'q85 MB':>8}{'무손실MB':>9}{'>1024px':>8}")
for k,v in sorted(tot.items(),key=lambda x:-x[1][1])[:14]: print(f"{k:<7}{v[0]:>5}{v[1]/1e6:>8.1f}{v[2]/1e6:>8.1f}{v[3]/1e6:>9.1f}{v[4]:>8}")
