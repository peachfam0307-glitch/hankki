#!/usr/bin/env python3
"""⛔ **파는 컷이 「다른 이름으로」 공짜로 나가고 있나** — 전수조사. (2026-08-03 신설)

왜
  창업자: *"그래야 유료를 사지 주면 누가사"* · *"큰일날뻔했네"* · *"**더 찾아봐 있나**"*

⛔⛔ `scripts/check-packmix.mjs` 는 **이름으로만** 본다. 그래서
   가을 유료팩 8컷이 9/1·10/1·11/1 에 무료로 열리는 컷과 **같은 그림인데도**
   *"✅ 안 샌다"* 고 통과시키고 있었다. 이름이 `wh_02` ↔ `au_i03` 로 달랐기 때문이다.
   📌 **그림이 두 벌 들어왔다** — `가을-창업자-2507`(무료 계절 자산) 과
      `신규-2607-수채화팩`(유료팩 후보) 에 같은 소재가 각각 그려져 있었다.

무엇을 보나
  ⒜ 파는 컷  = `src/data/paidPacks.js` 의 `packed` (파일은 docs/stickers 어딘가)
  ⒝ 공짜 컷  = 꾸미기 서랍 `STICKER_GROUPS[].items` ＋ 공유 카드 `SEASON_CUTS`
              (열리는 날 `from` 도 같이 읽는다 — **아직 안 열렸어도 열릴 예정이면 새는 것**)
  → 둘을 **픽셀 지문**으로 맞대본다.

⚠️ 판정이 아니라 «후보 제시»다 — 뜬 건 사람이 그림을 보고 정한다.
쓰기:  python3 tools/leak-art.py [--th 0.86]
"""
import os, re, sys, glob, json
import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TH = .86
N = 32


def read(p):
    return open(os.path.join(APP, p), encoding='utf8').read()


def keys_in(src, start):
    a = src.index(start)
    return [m.group(1) for m in re.finditer(r"'([a-z0-9_]+)'", src[a:])]


# ⒜ 파는 컷 ──────────────────────────────────────────────
src = read('src/data/paidPacks.js')
packs = []
for m in re.finditer(r"label: '([^']+)'", src):
    seg = src[m.end():]
    nxt = seg.find('label: ')
    seg = seg[:nxt] if nxt > 0 else seg
    pk = re.search(r'packed: \[(.*?)\n\s*\]', seg, re.S)
    packs.append((m.group(1), [x.group(1) for x in re.finditer(r"'([a-z0-9_]+)'", pk.group(1))] if pk else []))

# ⒝ 공짜로 닿는 컷 ＋ 열리는 날 ────────────────────────────
st = read('src/components/Stickers.jsx')
free = {}
for g in re.finditer(r"\{[^{}]*?items: \[(.*?)\]\s*\}", st[st.index('export const STICKER_GROUPS'):], re.S):
    blk = g.group(0)
    day = (re.search(r"from: '([^']+)'", blk) or [None, '지금 열려 있음'])[1]
    lab = (re.search(r"label: '([^']+)'", blk) or [None, '?'])[1]
    for k in re.finditer(r"'([a-z0-9_]+)'", g.group(1)):
        free[k.group(1)] = (day, '꾸미기 서랍 · ' + lab)
for k in keys_in(read('src/data/cardSeasons.js'), 'export const SEASON_CUTS'):
    free.setdefault(k, ('—', '레꾸자랑 카드'))


def find(k):
    for pat in (f'docs/stickers/**/{k}.png', f'src/assets/stickers/**/{k}.png'):
        g = glob.glob(os.path.join(APP, pat), recursive=True)
        if g:
            return g[0]
    return None


_cache = {}


def sig(path):
    if path not in _cache:
        im = Image.open(path).convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        bg.alpha_composite(im)
        g = np.asarray(bg.convert('L').resize((N, N), Image.LANCZOS), dtype=float)
        _cache[path] = (g - g.mean()) / (g.std() + 1e-6)
    return _cache[path]


th = TH
for i, x in enumerate(sys.argv):
    if x.startswith('--th'):
        th = float(x.split('=')[-1] if '=' in x else sys.argv[i + 1])

fk = [(k, find(k)) for k in sorted(free)]
fk = [(k, p) for k, p in fk if p]
fs = [sig(p) for _, p in fk]
print(f'\n⛔ 파는 컷 ↔ 공짜로 닿는 컷 {len(fk)}개 — «그림»으로 대조 (문턱 {th})')

hits = []
for label, packed in packs:
    if not packed:
        print(f'\n  ── {label} ── ⏳ 팩 명단 미정')
        continue
    miss = [k for k in packed if not find(k)]
    print(f'\n  ── {label} — 파는 컷 {len(packed)}개 ──' + (f'  ⚠️파일 못 찾음 {len(miss)}: {" ".join(miss[:6])}' if miss else ''))
    n = 0
    for k in packed:
        p = find(k)
        if not p:
            continue
        a = sig(p)
        sc = [float((a * b).mean()) for b in fs]
        j = int(np.argmax(sc))
        if sc[j] >= th:
            day, where = free[fk[j][0]]
            print(f'   🔁 {k:8s} = {fk[j][0]:8s}  {sc[j]:.3f}   → {day} 무료 · {where}')
            hits.append(dict(pack=label, paid=k, free=fk[j][0], score=round(sc[j], 3), day=day, where=where))
            n += 1
    if not n:
        print('     ok  공짜로 새는 그림 없음')

print(f'\n  합계 {len(hits)}컷이 «다른 이름으로» 공짜로 나간다')
if hits:
    out = os.path.join(APP, 'docs/누수-그림대조-자동.json')
    json.dump(hits, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(f'  📄 {os.path.relpath(out, APP)} 에 적었다 — ⛔ 창업자가 판정할 것\n')
