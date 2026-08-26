# 🌑 진한판 — 8/24 이후 «새로 올린 컷»만 어두운 바탕에 크게 (전수검사용)
# 📮 창업자 2026-08-26 = "지금 앱에 반영된 400여컷들 진한판에 다 올려. 전수검사하게."
#                      → "내가 볼 수 있게(확대해서) 올라단 새컷들만!"
# ⭐ 진한 바탕이라야 «흰 테·파먹힘·삐뚤어짐»이 보인다(스티커 검수 절대원칙 ①).
# ⭐ 컷은 «원본 픽셀 그대로» 올린다 — 줄이면 잔재도 같이 줄어 안 보인다(규칙 13).
# 실행 = python3 scripts/_판-진한판-새컷-0826.py
# 🏷 이름표 = 검수판
import os, sys, re, glob, hashlib, json
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _이름표읽기 import 이름표, 픽커
앱 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sha(p):
    try: return hashlib.sha1(open(p,'rb').read()).hexdigest()
    except: return None

# ── 8/24 이후 창업자 시트에서 온 컷만 고른다 (해시로 되짚어 확인 · ⛔짐작 금지) ──
새폴더 = ('음식-창업자-2026-08-24','음식-창업자-2026-08-25','음식-창업자-2026-08-26',
          '창업자-2026-08-24','음식-창업자-2608','음식-창업자-2608b')
새해시 = set()
for f in 새폴더:
    for p in glob.glob(f'{앱}/docs/stickers/{f}/**/*.png', recursive=True):
        if '원본시트' in p or os.path.basename(p).startswith('_'): continue
        h = sha(p)
        if h: 새해시.add(h)

src = open(f'{앱}/src/components/FoodIcon.jsx', encoding='utf-8').read()
nm, pk = 이름표(src), 픽커(src)
사진 = re.compile(r'^(fe|fh|fy|fj|fi|fb|gr)_')
컷 = []
for k in pk:
    if not 사진.match(k): continue
    p = f'{앱}/src/assets/stickers/photo/{k}.png'
    if os.path.exists(p) and sha(p) in 새해시:
        컷.append((pk[k], nm.get(k,'?'), k, p))
컷.sort(key=lambda x: (x[0], x[1]))
print(f'8/24 이후 새 컷 중 픽커에 실린 것 = {len(컷)}개')

# ── 진한판 그리기 ──
BG, FG, SUB, LINE = (26,22,19), (238,231,222), (167,150,132), (58,48,40)
칸, 여백, 글자칸 = 460, 18, 46
열, 행 = 5, 6
쪽수 = (len(컷) + 열*행 - 1)//(열*행)
def 폰트(sz):
    # ⛔ 이 컨테이너엔 나눔·Noto 한글 폰트가 «없다» — DejaVu 로 그리면 한글이 전부 «네모»가 된다.
    #    2026-08-26 에 실제로 그렇게 뽑아 놓고 규칙 21(열어보기)로 잡았다.
    #    ✅ 한글이 되는 것 = wqy-zenhei(중국어 폰트지만 한글 글리프가 있다) · unifont
    for f in ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
              '/usr/share/fonts/opentype/unifont/unifont.otf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        if os.path.exists(f):
            try: return ImageFont.truetype(f, sz)
            except Exception: pass
    return ImageFont.load_default()
F, Fs, Fh = 폰트(21), 폰트(17), 폰트(30)
out = os.environ.get('OUTDIR', '/tmp/진한판')
os.makedirs(out, exist_ok=True)
만든 = []
for 쪽 in range(쪽수):
    몫 = 컷[쪽*열*행:(쪽+1)*열*행]
    W = 여백 + 열*(칸+여백)
    H = 70 + 행*(칸+글자칸+여백) + 여백
    im = Image.new('RGB', (W,H), BG); d = ImageDraw.Draw(im)
    d.text((여백, 20), f'한끼 · 8/24 이후 새 컷 전수검수   {쪽+1} / {쪽수}   ({len(컷)}컷)', font=Fh, fill=FG)
    for i,(갈래,이름,키,p) in enumerate(몫):
        cx = 여백 + (i%열)*(칸+여백); cy = 70 + (i//열)*(칸+글자칸+여백)
        d.rectangle([cx,cy,cx+칸,cy+칸], outline=LINE)
        try:
            g = Image.open(p).convert('RGBA')
            s = min(칸/g.width, 칸/g.height, 1.0)          # ⛔키우지 않는다(뭉갠다)
            g = g.resize((max(1,int(g.width*s)), max(1,int(g.height*s))), Image.LANCZOS)
            im.paste(g, (cx+(칸-g.width)//2, cy+(칸-g.height)//2), g)
        except Exception as e:
            d.text((cx+10, cy+10), f'못 읽음 {e}', font=Fs, fill=(220,90,90))
        d.text((cx+4, cy+칸+4), 이름[:16], font=F, fill=FG)
        d.text((cx+4, cy+칸+26), f'{키} · {갈래}', font=Fs, fill=SUB)
    f = f'{out}/진한판-새컷-{쪽+1:02d}.png'
    im.save(f); 만든.append(f)
    print(' ', f, f'{os.path.getsize(f)//1024}KB')
json.dump([{'갈래':a,'이름':b,'키':c} for a,b,c,_ in 컷],
          open(f'{앱}/scripts/_진한판-새컷-목록-0826.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'\n✅ {len(만든)}장')
