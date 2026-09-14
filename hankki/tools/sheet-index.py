#!/usr/bin/env python3
"""📇 원본 시트 우선순위 표 만들기 — **자르기 전에 무조건 이걸 먼저 본다.**

왜 만들었나 (창업자 2026-07-31):
  *"원본시트 구분을 좀 잘해놔. 내가 가장 최근에 준걸 우선적으로 사용해야지.
    어떻게 하면 네가 최우선으로 받은 이미지를 먼저 쓰게해? 이것도 어제 다 정했잖아.
    네가 일하는 방식 다 규칙만들고. 예전꺼 뒤져서 쓸까 이해불가임"*

  **맞는 말이다. 실제로 사고가 났다.**
  여름 프레임을 자를 때 **큰 4컷 시트가 이미 저장소에 있었는데** 못 찾고
  **옛 16종 격자 시트**를 들고 잘랐다. 컷이 272px밖에 안 돼서 2.3배로 늘려 쓰다
  가장자리가 톱니가 됐고, 창업자가 몇 번을 다시 봐야 했다.

  왜 못 찾았나 = ⒜폴더 이름이 `신규-2607-재료도구` 인데 **그 안에 프레임**이 있었다
                ⒝그 팩이 `docs/stickers/README.md` 인덱스에 **아예 없었다**
                ⒞「최신을 먼저 쓴다」가 **내 기억에만** 있었다

  → **기억에 맡기지 않는다.** 이 표를 자동으로 만들고, 자르기 전에 표를 본다.

════════ 무엇을 재나 ════════
시트마다 네 가지를 재서 **좋은 원본 순으로** 세운다.

  📅 **받은 날짜**   — 파일 mtime (같은 그림이면 **최신이 무조건 우선**)
  📏 **컷 크기**     — 시트 안 덩어리들의 긴변 중앙값 (클수록 좋다)
  🔲 **가짜 격자**   — 배경이 «246 / 253 두 톤 반반»이면 AI가 투명을 격자로 그린 것
                      ⚠️ 이런 시트는 **자르기 전에 격자부터 눕혀야** 한다
  🎨 **흰 다이컷**   — 그림에 흰 테두리가 이미 그려져 있나
                      ⚠️ 있으면 `--diecut keep`(두 겹 방지), 없으면 `--diecut auto`

쓰기:
  python3 tools/sheet-index.py            # 표를 다시 만든다
  python3 tools/sheet-index.py --check <시트.png>   # 이 시트 써도 되나 한 줄로
"""
import os
import sys
import time

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = 'docs/stickers'
OUT = 'docs/stickers/_원본-우선순위.md'
MIN_SIDE = 900          # 이보다 작으면 «시트»가 아니라 낱개 컷


def measure(path):
    """시트 한 장을 재서 dict 로 돌려준다. 시트가 아니면 None."""
    try:
        im = Image.open(path)
    except Exception:
        return None
    w, h = im.size
    if min(w, h) < MIN_SIDE:
        return None
    a = np.array(im.convert('RGB')).astype(int)
    mn = a.min(axis=2)
    ach = (a.max(2) - a.min(2)) <= 2

    # 🔲 가짜 투명 격자 = 배경이 «두 톤 반반»
    #   ⚠️ 「밝고 무채색이면 격자」로 재면 안 된다 — 그냥 살짝 어두운 흰 배경도 다 걸린다.
    #     (2026-07-31 실제로 그렇게 재서 «전부 격자»라고 잘못 보고했다)
    bg = ach & (mn >= 235)
    grid = False
    if bg.sum() > 1000:
        lo = (((mn >= 244) & (mn <= 250)) & bg).sum() / bg.sum()
        hi = (((mn >= 251) & (mn <= 254)) & bg).sum() / bg.sum()
        grid = lo > 0.15 and hi > 0.15

    # 📏 컷 크기 = 덩어리들의 긴변 중앙값
    sil = ndimage.binary_fill_holes(ndimage.binary_closing(mn < 246, np.ones((5, 5))))
    lab, n = ndimage.label(sil)
    if n == 0:
        return None
    sz = ndimage.sum(sil, lab, range(1, n + 1))
    keep = [i for i in range(1, n + 1) if sz[i - 1] > 0.004 * w * h]
    if not keep:
        return None
    longs = []
    for i in keep:
        ys, xs = np.where(lab == i)
        longs.append(max(ys.max() - ys.min(), xs.max() - xs.min()) + 1)

    # 🎨 흰 다이컷 = 실루엣 가장자리 띠가 «순백»인 비율
    band = sil & ~ndimage.binary_erosion(sil, np.ones((7, 7)))
    white_edge = ((mn >= 250) & band).sum() / max(band.sum(), 1)

    return {
        'path': path, 'w': w, 'h': h,
        'cuts': len(keep), 'long': int(np.median(longs)),
        'grid': grid, 'diecut': white_edge > 0.35,
        'mtime': os.path.getmtime(path),
    }


def scan():
    rows = []
    for dp, _dn, fn in os.walk(ROOT):
        if '_옛컷-백업' in dp or '_못쓰는' in dp or '낱개' in dp:
            continue
        for f in sorted(fn):
            if not f.lower().endswith('.png'):
                continue
            m = measure(os.path.join(dp, f))
            if m:
                rows.append(m)
    return rows


def main():
    if '--check' in sys.argv:
        p = sys.argv[sys.argv.index('--check') + 1]
        m = measure(p)
        if not m:
            print(f'⚠️ {p} — 시트가 아니다(짧은 변 {MIN_SIDE}px 미만)')
            return 1
        bad = []
        if m['grid']:
            bad.append('🔲 가짜 투명 격자 — 자르기 전에 격자부터 흰색으로 눕힐 것')
        if m['long'] < 400:
            bad.append(f"📏 컷이 {m['long']}px 밖에 안 된다 — 크게 쓰는 것(프레임)이면 다시 뽑을 것")
        if m['diecut']:
            bad.append('🎨 흰 다이컷이 이미 그려져 있다 — `--diecut keep` (auto 면 두 겹)')
        print(f"\n📇 {os.path.basename(p)}  {m['w']}x{m['h']} · 컷 {m['cuts']}개 · 컷 긴변 {m['long']}px")
        for b in bad:
            print(f'   ⚠️ {b}')
        if not bad:
            print('   ✅ 그대로 잘라도 된다')
        # 🔒 훅이 여는 열쇠 — 이 검사를 돌려야 오늘치 cut.py/recut.py 가 허용된다.
        #   (`.claude/hooks/cut-guard.sh` 참고. 규칙을 기억이 아니라 하네스가 강제한다)
        import time as _t
        open('/tmp/hankki-cut-ok-' + _t.strftime('%Y%m%d', _t.localtime(_t.time() + 9 * 3600)), 'w').write(p)
        print('   🔒 오늘치 자르기 통과 표시를 남겼다')
        print()
        return 0

    rows = scan()
    # 팩(폴더)별로 묶고, **받은 날짜 최신 순** — 같은 그림이면 최신이 우선이다
    packs = {}
    for r in rows:
        pack = os.path.relpath(os.path.dirname(r['path']), ROOT).split(os.sep)[0]
        packs.setdefault(pack, []).append(r)
    order = sorted(packs.items(), key=lambda kv: -max(x['mtime'] for x in kv[1]))

    L = ['# 📇 원본 시트 우선순위 — **자르기 전에 이 표부터 본다**', '',
         '> 창업자 2026-07-31: *"내가 가장 최근에 준걸 우선적으로 사용해야지."*',
         '> ⛔ **옛날 시트 뒤져서 쓰지 말 것.** 같은 그림이면 **위에 있는 팩이 무조건 우선.**', '',
         '⚠️ 이 표는 `python3 tools/sheet-index.py` 로 **자동 생성**된다. 손으로 고치지 말 것.',
         f'(마지막 갱신 {time.strftime("%Y-%m-%d %H:%M", time.localtime())} · 시트 {len(rows)}장)', '',
         '| 팩 (최신 순) | 시트 | 컷 긴변(중앙) | 🔲격자 | 🎨흰다이컷 | 받은 날 |',
         '|---|---:|---:|:---:|:---:|---|']
    for pack, rs in order:
        longs = sorted(x['long'] for x in rs)
        med = longs[len(longs) // 2]
        g = sum(1 for x in rs if x['grid'])
        d = sum(1 for x in rs if x['diecut'])
        day = time.strftime('%Y-%m-%d', time.localtime(max(x['mtime'] for x in rs)))
        L.append(f"| `{pack}` | {len(rs)} | {med} | {'⚠️'+str(g) if g else '—'} | "
                 f"{'🎨'+str(d) if d else '—'} | {day} |")
    L += ['', '## 🚩 바로 조심할 것', '']
    for r in sorted([x for x in rows if x['grid']], key=lambda x: -x['mtime']):
        L.append(f"- 🔲 **가짜 격자** — `{os.path.relpath(r['path'], ROOT)}` (자르기 전에 눕힐 것)")
    small = [x for x in rows if x['long'] < 400 and not x['grid']]
    L.append('')
    L.append(f'- 📏 컷이 400px 미만인 시트 **{len(small)}장** — 작게 쓰는 것(이모지·데코)엔 문제없다. '
             '**크게 쓰는 것(프레임·표지)에는 쓰지 말 것.**')
    L += ['', '## 📌 규칙', '',
          '1. **자르기 전에 `python3 tools/sheet-index.py --check <시트>` 를 돌린다.** 세 가지를 한 줄로 알려준다.',
          '2. 같은 그림이 여러 팩에 있으면 **이 표에서 위에 있는(최신) 팩**을 쓴다.',
          '3. 새 시트를 받으면 **그날 바로** 이 표를 다시 만든다(`python3 tools/sheet-index.py`).',
          '4. 폴더 이름은 **내용을 말해야 한다** — `신규-2607-재료도구` 안에 프레임이 있어서 못 찾았다.']
    open(OUT, 'w').write('\n'.join(L) + '\n')
    print(f'📇 {OUT} — 팩 {len(order)}개 · 시트 {len(rows)}장')
    print(f'   🔲 가짜 격자 {sum(1 for x in rows if x["grid"])}장 · '
          f'🎨 흰 다이컷 {sum(1 for x in rows if x["diecut"])}장')
    return 0


if __name__ == '__main__':
    sys.exit(main())
