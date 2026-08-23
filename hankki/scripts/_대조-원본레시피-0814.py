#!/usr/bin/env python3
# 🔎🔎 «창업자가 이름 붙여 준 원본» ↔ «앱에 들어간 컷» 픽셀 대조
#
#   📮 창업자 *"내가 이름까지 다 붙여서 뽑아줬어 원본찾아서 레시피에 대조해서 맞는그림 들어갔는지 확인해"*
#
# ⛔ **「같은 파일 이름이 있나」로 세면 안 된다** — 오늘 그렇게 세서 「전부 0개」가 나왔다.
#    앱에 넣을 때 `n0101` → `fe_XXX` 로 **이름을 바꿔서** 넣기 때문이다.
#    그래서 이름이 아니라 **그림 자체**를 본다.
#
# 어떻게 = dHash(가로 밝기차) ＋ aHash(평균 밝기) 두 개를 같이 본다.
#   한 개만 쓰면 단색 배경 컷끼리 우수수 붙는다. 둘 다 가까울 때만 «같은 그림»으로 본다.
#   알파는 흰 바탕에 얹어서 없앤다 — 앱 컷은 배경을 지운 판이라 알파를 그냥 두면 죄다 검게 나온다.
import sys, json, os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'src/assets'
STK = ROOT / 'docs/stickers'


def hashes(p):
    try:
        im = Image.open(p)
    except Exception:
        return None
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    im = im.convert('L')
    g = im.resize((9, 8), Image.LANCZOS)
    px = list(g.getdata())
    d = 0
    for y in range(8):
        for x in range(8):
            d = (d << 1) | (1 if px[y * 9 + x] > px[y * 9 + x + 1] else 0)
    a = im.resize((8, 8), Image.LANCZOS)
    ap = list(a.getdata())
    m = sum(ap) / 64
    h = 0
    for v in ap:
        h = (h << 1) | (1 if v > m else 0)
    return d, h


def dist(a, b):
    return bin(a ^ b).count('1')


# ── 창업자가 이름 붙여 준 원본 모으기 ──────────────────────────────
# ① 파일 이름이 곧 요리 이름인 폴더 (01-01-콩나물밥.png)
# ② 이름표.json 이 있는 폴더 (n0101 → 버섯들깨무침)
원본 = []   # (폴더, 키, 이름, 경로)
for d in sorted(STK.iterdir()):
    if not d.is_dir() or d.name.startswith('_'):
        continue
    낱개 = d / '낱개'
    if not 낱개.is_dir():
        continue
    표 = {}
    j = d / '이름표.json'
    if j.exists():
        try:
            raw = json.loads(j.read_text())
            표 = raw.get('컷') or {k: v for k, v in raw.items() if not k.startswith('_')}
        except Exception:
            표 = {}
    for f in sorted(낱개.glob('*.png')):
        key = f.stem
        이름 = 표.get(key)
        if not 이름:
            # 01-01-콩나물밥 → 콩나물밥
            parts = key.split('-')
            if len(parts) >= 3 and parts[0].isdigit():
                이름 = '-'.join(parts[2:])
        원본.append((d.name, key, 이름, f))

앱 = sorted(ASSETS.rglob('*.png'))
print(f'📦 창업자 원본 낱개 {len(원본)}개  ·  앱 src/assets 전체 {len(앱)}개', file=sys.stderr)

앱해시 = {}
for f in 앱:
    h = hashes(f)
    if h:
        앱해시[str(f.relative_to(ASSETS))] = h

결과 = []
for 폴더, 키, 이름, f in 원본:
    h = hashes(f)
    if not h:
        continue
    best, bd = None, 99
    for k2, h2 in 앱해시.items():
        dd = dist(h[0], h2[0])
        if dd > 12:
            continue
        da = dist(h[1], h2[1])
        tot = dd + da
        if tot < bd:
            best, bd = k2, tot
    결과.append({'폴더': 폴더, '키': 키, '이름': 이름, '앱키': best, '거리': bd if best else None})

out = ROOT / 'docs/_대조-원본-앱-0814.json'
out.write_text(json.dumps(결과, ensure_ascii=False, indent=1))

들어감 = [r for r in 결과 if r['앱키'] and r['거리'] <= 6]
아슬 = [r for r in 결과 if r['앱키'] and 6 < r['거리'] <= 12]
없음 = [r for r in 결과 if not r['앱키'] or r['거리'] > 12]
print(f'\n✅ 앱에 들어간 것 {len(들어감)}  ·  ⚠️ 비슷한데 애매 {len(아슬)}  ·  ⛔ 앱에 없음 {len(없음)}')

폴더별 = {}
for r in 결과:
    s = 폴더별.setdefault(r['폴더'], [0, 0, 0])
    if r['앱키'] and r['거리'] <= 6:
        s[0] += 1
    elif r['앱키'] and r['거리'] <= 12:
        s[1] += 1
    else:
        s[2] += 1
print(f"\n{'폴더':40} {'들어감':>6} {'애매':>5} {'없음':>5}")
for k in sorted(폴더별):
    a, b, c = 폴더별[k]
    print(f'{k:40} {a:>6} {b:>5} {c:>5}')
print(f'\n📄 {out}')
