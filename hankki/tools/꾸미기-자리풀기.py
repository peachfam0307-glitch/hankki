#!/usr/bin/env python3
# 🎯 꾸미기 조각의 «자리·크기»를 눈대중이 아니라 «풀어서» 정한다 (2026-09-19)
#
# 📮 창업자 = *"이거 앞으로도 내가 준 시안을 완벽하게 재는 법 스티커 붙이는 법
#    도구로 만들어서 저장해놔. 시행착오 없이 가게."*
#
# ⛔⛔ 2026-09-19 새벽에 «접시 하나»로 몇 시간을 헛돌았다. 삽질 다섯을 다 여기에 박는다.
#   ① 크기를 «감으로» 찍고 자리만 만졌다 — s 0.98 이 정답의 **1.5배** 였는데 몰랐다
#      📌 자리를 아무리 옮겨도 «크기»가 틀리면 절대 안 맞는다. 크기부터 푼다.
#   ② 그릇 실루엣을 «화면 색 차이»로 잡았다 — 카드 배경이 크림 그라데이션이라
#      **흰 그릇이 배경으로 읽혀** 사방 2~3px 모자랐고, 그만큼이 흰 테로 삐져나왔다
#      ✅ 실루엣은 «원본 PNG 의 알파»로 잡는다. 화면 픽셀로 잡지 않는다.
#   ③ 실측 파일(docs/꾸미기릴스-창업자카드-실측-*.json)에 값이 다 있었는데 «안 썼다»
#      📌 재 놓고 안 쓰면 안 잰 것과 같다. --실측 으로 그 파일을 읽어 «출발값»으로 쓴다.
#   ④ 「모서리 끝쪽으로 ＋ 잘리지 않게」를 눈대중으로 했다 — 이건 **부등식**이다
#      중심 x ≥ 폭/2 · 중심 y ≥ 높이/2 (반대쪽은 1 에서 뺀다). --한계 가 푼다.
#   ⑤ 후보를 «하나만» 내밀고 판정을 기다렸다 — 틀리면 왕복이 한 번 더 는다
#      ✅ --후보 N 으로 **3~4개를 같이** 낸다(창업자 = *"중간중간 잰 값을 3-4개 나한테 보여주는 것"*)
#
# ── 쓰는 법 ────────────────────────────────────────────────────────────
#   ① 조각 재기 — 크기·종횡비·구멍(프레임이면)
#      python3 tools/꾸미기-자리풀기.py 재기 pf_ad08
#
#   ② 안 잘리는 한계 — 그 크기로 중심이 갈 수 있는 끝
#      python3 tools/꾸미기-자리풀기.py 한계 pc3_02 --s 0.24
#
#   ③ 프레임이 «대상을 통째로 삼키는» s/x/y 범위를 푼다 (그릇 프레임 전용)
#      python3 tools/꾸미기-자리풀기.py 덮기 pf_ad08 --대상 n3010 --후보 4
#
# ⛔ 이 도구는 «계산»만 한다. 실제로 얹어 찍는 것은 scripts/_판-꾸미기대조-*.mjs 가 한다.
#    계산이 맞아도 «눈으로» 한 번 본다 — 그게 규칙 18 이다.
import argparse, glob, json, sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
    from scipy import ndimage
except ImportError as e:
    sys.exit(f'⛔ 필요한 것이 없다: {e}  →  pip install pillow numpy scipy')

앱 = Path(__file__).resolve().parent.parent

# 🔢 실측 상수 — ⛔여기 숫자는 «기억»이 아니라 브라우저에서 «잰» 값이다.
#   잰 법 = 앱을 열어 꾸미기 화면에서 아래를 읽었다 (2026-09-19)
#     document.querySelector('.decor-stage').getBoundingClientRect()   → x0 y68 w390 h406
#     그 안 커버 <img> 의 rect ＋ naturalWidth/Height ＋ object-fit    → 209.4375px · contain · (90.28125, 86.28125)
#   ⚠️ 앱 레이아웃이 바뀌면 이 값도 바뀐다 — `--판재기` 로 다시 재는 법은 아래 도움말에 적어 뒀다.
판폭, 판높이 = 390.0, 406.0
커버 = {'box': 209.4375, 'x': 90.28125, 'y': 86.28125}


def 조각찾기(key):
    """조각 key 로 원본 PNG 를 찾는다. ⛔ dist 의 webp 를 쓰지 않는다 — 알파가 손실될 수 있다."""
    후보 = glob.glob(str(앱 / 'src/assets/stickers/**' / f'{key}.png'), recursive=True)
    if not 후보:
        sys.exit(f'⛔ 조각을 못 찾았다: {key}\n   찾은 곳 = src/assets/stickers/**/{key}.png\n'
                 f'   📌 「없다」가 아니라 「이름이 다르다」일 수 있다 — 서랍을 찍어 aria-label 로 확인할 것\n'
                 f'      (scripts/_shot-꾸미기서랍-*.mjs)')
    return 후보[0]


def 알파(경로):
    im = Image.open(경로).convert('RGBA')
    return im.size, np.asarray(im.split()[3])


def 구멍재기(a):
    """프레임 가운데의 «갇힌 투명 구멍» 을 찾는다. 바깥 투명과 구분한다."""
    투명 = a <= 16
    바깥 = np.zeros_like(투명)
    바깥[0, :] = 투명[0, :]; 바깥[-1, :] = 투명[-1, :]
    바깥[:, 0] = 투명[:, 0]; 바깥[:, -1] = 투명[:, -1]
    바깥 = ndimage.binary_propagation(바깥, mask=투명)
    구멍 = 투명 & ~바깥
    if not 구멍.any():
        return None
    ys, xs = np.nonzero(구멍)
    return {'x0': int(xs.min()), 'x1': int(xs.max()), 'y0': int(ys.min()), 'y1': int(ys.max()),
            '픽셀': int(구멍.sum())}


def cmd_재기(args):
    p = 조각찾기(args.key)
    (w, h), a = 알파(p)
    ys, xs = np.nonzero(a > 10)
    print(f'📏 {args.key}  →  {Path(p).relative_to(앱)}')
    print(f'   크기      = {w} × {h}   종횡비(가로/세로) = {w/h:.4f}')
    print(f'   불투명 범위 = x {xs.min()}~{xs.max()} · y {ys.min()}~{ys.max()}')
    구멍 = 구멍재기(a)
    if 구멍:
        print(f'   ⭕ 가운데 구멍 = x {구멍["x0"]}~{구멍["x1"]} · y {구멍["y0"]}~{구멍["y1"]}  ({구멍["픽셀"]:,}px)')
        print(f'      → 프레임이다. 이 구멍으로 «아래 것이 비쳐 보인다» — 덮으려면 「덮기」를 쓴다.')
    else:
        print('   ⭕ 가운데 구멍 없음 = 그냥 스티커다.')
    print()
    print('👉 다음 = 안 잘리는 한계를 본다')
    print(f'   python3 tools/꾸미기-자리풀기.py 한계 {args.key} --s 0.24')


def cmd_한계(args):
    """⛔ 「모서리 끝쪽으로 ＋ 잘리지 않게」 = 눈대중이 아니라 부등식이다."""
    p = 조각찾기(args.key)
    (w, h), _ = 알파(p)
    비 = w / h
    print(f'📐 {args.key} — 판({판폭:.0f}×{판높이:.0f}) 안에서 «중심»이 갈 수 있는 끝')
    print(f'   종횡비 = {비:.4f}')
    print()
    print('    s     화면 폭 × 높이      왼/위 최소        오른/아래 최대')
    print('   ────  ─────────────────  ───────────────  ───────────────')
    for s in args.s:
        폭 = s * 판폭; 높 = 폭 / 비
        xmin = (폭 / 2) / 판폭; ymin = (높 / 2) / 판높이
        경고 = '  ⛔판보다 크다' if (폭 > 판폭 or 높 > 판높이) else ''
        print(f'   {s:<5.2f} {폭:6.1f} × {높:6.1f}      x≥{xmin:.4f} y≥{ymin:.4f}  x≤{1-xmin:.4f} y≤{1-ymin:.4f}{경고}')
    print()
    print('   📌 x 를 «최소값 그대로» 주면 모서리에 딱 붙는다. 그보다 작으면 잘린다.')


def 실루엣(대상key):
    """대상(음식 사진)의 실루엣을 «판 좌표»로 옮긴다.
    ⛔⛔ 화면 픽셀 색으로 잡지 않는다 — 카드 배경이 크림 그라데이션이라 흰 그릇을 놓친다(2026-09-19 실측).
    ✅ 원본 PNG 의 알파를 앱이 그리는 자리(contain)로 옮긴다."""
    p = 조각찾기(대상key)
    (w, h), a = 알파(p)
    배 = 커버['box'] / max(w, h) if False else 커버['box'] / w   # contain: 긴 변 기준
    배 = min(커버['box'] / w, 커버['box'] / h)
    그릴폭, 그릴높 = w * 배, h * 배
    ox = 커버['x'] + (커버['box'] - 그릴폭) / 2
    oy = 커버['y'] + (커버['box'] - 그릴높) / 2
    return {'src': p, 'nw': w, 'nh': h, '배': 배, 'ox': ox, 'oy': oy, '폭': 그릴폭, '높': 그릴높, 'alpha': a}


def cmd_덮기(args):
    S = args.배율                      # 계산 해상도(판 1px = S px)
    W, H = int(판폭 * S), int(판높이 * S)
    대 = 실루엣(args.대상)
    dw, dh = int(round(대['폭'] * S)), int(round(대['높'] * S))
    al = np.asarray(Image.fromarray(대['alpha']).resize((dw, dh), Image.LANCZOS))
    sil = np.zeros((H, W), bool)
    ox, oy = int(round(대['ox'] * S)), int(round(대['oy'] * S))
    sil[oy:oy + dh, ox:ox + dw] = al > 10
    sil = ndimage.binary_fill_holes(sil)
    ys, xs = np.nonzero(sil)
    print(f'🍽 덮기 — 프레임 {args.key} 로 대상 {args.대상} 을 통째로 삼킨다')
    print(f'   대상 실루엣 = x {xs.min()}~{xs.max()} · y {ys.min()}~{ys.max()}  (판 {W}×{H} · {S}배)')
    # 테두리 띠 = 실루엣의 «가장자리». 이 띠가 구멍에 걸리면 대상의 테가 드러난다.
    띠 = sil & ~ndimage.binary_erosion(sil, np.ones((3 * int(S), 3 * int(S))))
    by, bx = np.nonzero(띠)
    fp = 조각찾기(args.key)
    (fw0, fh0), fa0 = 알파(fp)
    비 = fw0 / fh0
    통과 = []
    for s100 in range(int(args.최소 * 100), int(args.최대 * 100) + 1):
        s = s100 / 100
        fw = int(round(s * W)); fh = int(round(fw / 비))
        if fw < 8 or fh < 8 or fw > W * 2 or fh > H * 2: continue
        A = np.asarray(Image.fromarray(fa0).resize((fw, fh), Image.LANCZOS)) > 40
        F = ndimage.binary_fill_holes(A)
        찾음 = None
        for cy in range(int(H * 0.25), int(H * 0.75), 2):
            for cx in range(int(W * 0.35), int(W * 0.65), 2):
                x0, y0 = cx - fw // 2, cy - fh // 2
                lx, ly = bx - x0, by - y0
                if not ((lx >= 0) & (lx < fw) & (ly >= 0) & (ly < fh)).all(): continue
                if not A[ly, lx].all(): continue      # ⓐ 대상의 테가 구멍에 안 걸린다
                sx, sy = xs - x0, ys - y0
                if not ((sx >= 0) & (sx < fw) & (sy >= 0) & (sy < fh)).all(): continue
                if F[sy, sx].all():                   # ⓑ 대상 «전체» 가 프레임 안에 들어온다
                    찾음 = (cx, cy); break
            if 찾음: break
        if 찾음: 통과.append((s, 찾음[0] / W, 찾음[1] / H))
    if not 통과:
        print('   ⛔ 통과하는 조합이 없다.')
        print('      📌 크기 범위를 넓혀 본다 (--최소 0.4 --최대 1.6)')
        print('      📌 그래도 없으면 이 프레임으로는 이 대상을 덮을 수 없다 — 다른 프레임을 고른다.')
        return
    print(f'   ✅ 통과 범위 = s {통과[0][0]} ~ {통과[-1][0]}   (그 밖은 테가 드러나거나 대상이 삐져나온다)')
    print()
    골 = [통과[round(i * (len(통과) - 1) / max(1, args.후보 - 1))] for i in range(args.후보)]
    print(f'   👀 창업자에게 «같이» 보여줄 후보 {len(골)}개 — ⛔하나만 내밀지 않는다')
    for i, (s, x, y) in enumerate(골, 1):
        print(f'      {i}.  s {s:.2f}  ·  x {x:.4f}  ·  y {y:.4f}')
    print()
    print('   👉 이 값들로 낱장을 찍어 «한 판»으로 붙여 보낸다:')
    print('      SMOKE_CHROMIUM=… LAYERS=1 DS=<s> DX=<x> DY=<y> OUT=/tmp/… node scripts/_판-꾸미기대조-0919.mjs')
    print('      ⛔ 채팅에 <img src="/tmp/…"> 로 붙이면 «창업자 화면엔 안 뜬다» — 파일로 보낸다.')
    if args.json:
        Path(args.json).write_text(json.dumps([{'s': s, 'x': x, 'y': y} for s, x, y in 골], ensure_ascii=False, indent=2))
        print(f'   💾 {args.json} 에 저장했다')


ap = argparse.ArgumentParser(description='꾸미기 조각의 자리·크기를 풀어서 정한다', formatter_class=argparse.RawDescriptionHelpFormatter,
    epilog='''
📐 판 자리를 «다시 재는» 법 (앱 레이아웃이 바뀌었을 때)
   꾸미기 화면을 연 뒤 브라우저에서:
     const st = document.querySelector('.decor-stage'), sb = st.getBoundingClientRect()
     const im = st.querySelector('img'), b = im.getBoundingClientRect()
     ({stage:[sb.width,sb.height], box:b.width, x:b.x-sb.x, y:b.y-sb.y, fit:getComputedStyle(im).objectFit})
   그 값을 이 파일 맨 위 `판폭/판높이/커버` 에 옮겨 적는다. ⛔기억으로 고치지 않는다.
''')
sub = ap.add_subparsers(dest='명령', required=True)
a1 = sub.add_parser('재기', help='조각의 크기·종횡비·구멍을 잰다'); a1.add_argument('key'); a1.set_defaults(fn=cmd_재기)
a2 = sub.add_parser('한계', help='안 잘리는 중심 좌표 한계를 푼다'); a2.add_argument('key')
a2.add_argument('--s', type=float, nargs='+', default=[0.18, 0.22, 0.24, 0.28]); a2.set_defaults(fn=cmd_한계)
a3 = sub.add_parser('덮기', help='프레임이 대상을 통째로 삼키는 s/x/y 를 푼다'); a3.add_argument('key')
a3.add_argument('--대상', required=True, help='덮을 대상 조각 key (보통 음식 아이콘)')
a3.add_argument('--최소', type=float, default=0.50); a3.add_argument('--최대', type=float, default=1.20)
a3.add_argument('--후보', type=int, default=4, help='창업자에게 보여줄 후보 개수(기본 4)')
a3.add_argument('--배율', type=float, default=3.0); a3.add_argument('--json')
a3.set_defaults(fn=cmd_덮기)
args = ap.parse_args(); args.fn(args)
