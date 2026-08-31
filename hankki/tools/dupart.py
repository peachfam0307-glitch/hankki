#!/usr/bin/env python3
"""🔎 **같은 그림이 두 이름으로 있나** — 파일 이름 말고 «픽셀»로 찾는다.

⛔⛔ 왜 (2026-08-03 사고)
  창업자: *"예비수채는 아까 가을추석으로 들어갔어"*
  클로드가 추석 팩 명단을 grep 해서 *"`wc_` 는 명단에 없다"* 고 답하고 **8컷을 새로 넣었다.**
  그런데 그 8컷은 **이미 `cs_i` 라는 다른 이름으로 앱에 들어와 있었다.**
    wc_01→cs_i01 · wc_02→cs_i02 · wc_03→cs_i03 · wc_04→cs_i04
    wc_05→cs_i05 · wc_06→cs_i07 · wc_07→cs_i10＋13 · wc_08→cs_i09
  그대로 뒀으면 **한 팩에 같은 그림이 두 번** 들어가고, 70컷을 채운 걸로 착각했을 것이다.

⭐⭐ 배운 것 = **「명단에 그 이름이 없다」 ≠ 「그 그림이 없다」.**
   자산은 앱에 들어올 때 이름이 바뀐다(원본 `wc_` → 앱 `cs_i`).
   ⛔ 그래서 «이름으로 찾는 검사»는 이 사고를 영원히 못 잡는다. 그림으로 봐야 한다.

⚠️ 이건 «판정»이 아니라 «후보 제시»다 — 닮았다고 알려주면 **사람이 그림을 보고** 정한다.
   (컷을 다시 자르면 여백·크기가 달라져 점수가 0.6까지 떨어진다. 그래도 같은 그림이다.)

쓰기
  python3 tools/dupart.py                       # 유료팩 컷 ↔ 앱 자산 전체 (기본)
  python3 tools/dupart.py <A> <B> [--th 0.86]   # 두 무더기를 맞대본다 (폴더나 glob)
"""
import os, sys, glob
import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TH = .86          # 이 위로는 «같은 그림일 수 있다» — 넉넉하게 잡고 사람이 거른다
N = 32            # 지문 크기


def files(spec):
    if os.path.isdir(spec):
        return sorted(glob.glob(os.path.join(spec, '**', '*.png'), recursive=True))
    return sorted(glob.glob(spec, recursive=True))


def sig(path):
    """흰 배경에 얹어 32×32 회색 지문. ⭐투명 PNG를 그냥 회색으로 바꾸면 «다 까맣게» 나온다."""
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    g = np.asarray(bg.convert('L').resize((N, N), Image.LANCZOS), dtype=float)
    return (g - g.mean()) / (g.std() + 1e-6)


def compare(A, B, th=TH, label=('A', 'B')):
    fa, fb = files(A), files(B)
    if not fa or not fb:
        print(f'  ⚠️  볼 파일이 없다 — {label[0]} {len(fa)}개 · {label[1]} {len(fb)}개')
        return 0
    sa = [sig(p) for p in fa]
    sb = [sig(p) for p in fb]
    hit = 0
    for i, a in enumerate(sa):
        sc = [float((a * b).mean()) for b in sb]
        j = int(np.argmax(sc))
        ka, kb = os.path.basename(fa[i])[:-4], os.path.basename(fb[j])[:-4]
        if ka == kb:                       # 같은 이름이면 같은 컷인 게 당연하다
            continue
        if sc[j] >= th:
            print(f'  🔁 {ka:14s} ≈ {kb:14s}  {sc[j]:.3f}')
            hit += 1
    return hit


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    th = TH
    for x in sys.argv[1:]:
        if x.startswith('--th'):
            th = float(x.split('=')[-1] if '=' in x else sys.argv[sys.argv.index(x) + 1])

    if len(a) >= 2:
        print(f'\n🔎 «{a[0]}»  ↔  «{a[1]}»   (문턱 {th})')
        n = compare(a[0], a[1], th)
        print(f'\n  닮은 짝 {n}개 — ⛔ 여기 뜬 건 «사람이 그림을 보고» 정한다\n')
        sys.exit(0)

    # 기본 = 유료팩 후보 폴더들 ↔ 앱에 이미 들어간 자산
    print('\n🔎 유료팩 후보 ↔ 앱에 이미 들어간 자산 — «같은 그림이 두 이름으로» 있나')
    print(f'   문턱 {th} · ⚠️ 판정이 아니라 후보 제시다')
    app = os.path.join(APP, 'src/assets/stickers')
    total = 0
    for d in sorted(glob.glob(os.path.join(APP, 'docs/stickers/신규-*'))):
        print(f'\n  ── {os.path.basename(d)} ──')
        n = compare(d, app, th, (os.path.basename(d), '앱'))
        if not n:
            print('     ok  겹치는 그림 없음')
        total += n
    print(f'\n  합계 {total}개 — ⛔ 「이름이 다르니 새 컷」이라고 넘기지 말 것\n')
