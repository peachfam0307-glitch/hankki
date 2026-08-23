#!/usr/bin/env python3
"""📇 컨택트시트 — 「훑어보기」와 「판정」을 갈라놓는 도구.

왜 (2026-08-04 하루에 세 번 틀렸다):
  ① 판6 컨택트시트에서 «칸을 밀려 읽었다» — 파일 정렬이 문자열 순이라
     `xn010` 이 `xn05` 보다 앞에 왔는데 나는 번호순일 거라 믿었다.
  ② `xm_01` 을 460px 판으로 보고 "매끈 곰이다" 라고 단정했다 → 창업자 *"매끈곰 아니야."*
  ③ `kp_bench` 를 300px 컨택트시트에서 보고 "펭펭 혼자" 라고 적었다 →
     창업자 *"카롱이 누워서 펭들고운동하는거야ㅋ"*. 3.2배로 키우니 카롱 귀·온천수건이 보였다.

  ⭐⭐ 뿌리 하나 = **컨택트시트는 「무엇이 있나」를 훑는 도구지 「무엇인가」를 판정하는 도구가 아니다.**
     🈵 글자에만 적용하던 「3배로 키워 읽는다」가 **캐릭터·구성 판정에도 똑같이 필요하다.**

쓰는 법
  python3 tools/contact.py <폴더|파일…> [--cols 6] [--size 300] [--out 판.png]
  python3 tools/contact.py <폴더> --zoom <이름조각> [--x 3]      # 판정용 — 그 컷만 크게

⛔ 이 도구가 만든 시트에는 «판정 금지» 띠가 박힌다. 지우지 말 것.
"""
import argparse, glob, os, re, sys
from PIL import Image, ImageDraw

def natkey(p):
    """자연순 — xn05 < xn010. ⛔문자열 정렬이 2026-08-04 에 칸을 밀리게 했다."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', os.path.basename(p))]

def collect(args):
    out = []
    for a in args:
        if os.path.isdir(a):
            out += glob.glob(os.path.join(a, '*.png')) + glob.glob(os.path.join(a, '*.jpg'))
        else:
            out += glob.glob(a)
    return sorted(set(out), key=natkey)

def sheet(files, cols, S, out):
    rows = (len(files) + cols - 1) // cols
    BAND = 46
    W = cols * (S + 12) + 12
    H = BAND + rows * (S + 26) + 12
    c = Image.new('RGB', (W, H), (34, 38, 58))
    d = ImageDraw.Draw(c)
    d.rectangle([0, 0, W, BAND], fill=(150, 60, 50))
    d.text((14, 9), '⛔ 훑어보기용 — 이 판으로 «무엇인가»를 판정하지 말 것. '
                   '판정은 tools/contact.py --zoom 으로 3배 이상 키워서.', fill=(255, 235, 230))
    d.text((14, 27), '   (2026-08-04: 이 크기에서 두 마리를 한 마리로, 물결 곰을 매끈 곰으로 봤다)', fill=(255, 210, 205))
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGBA')
        w0, h0 = im.size
        s = min((S - 10) / im.width, (S - 10) / im.height)
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
        x = 12 + (i % cols) * (S + 12)
        y = BAND + 12 + (i // cols) * (S + 26)
        c.paste(im, (x + (S - im.width) // 2, y + 20 + (S - 10 - im.height) // 2), im)
        d.text((x + 3, y + 3), f'{i+1}. {os.path.basename(f)[:-4]}  {w0}x{h0}', fill=(205, 214, 235))
    c.save(out, quality=93)
    print(f'📇 {out}  ({len(files)}컷 · {cols}열 · {c.size[0]}x{c.size[1]})')
    print('   ⛔ 판정은 이 판으로 하지 않는다 — --zoom 으로 키워서 본다.')

def zoom(files, frag, x, out):
    hit = [f for f in files if frag in os.path.basename(f)]
    if not hit:
        print(f'⛔ «{frag}» 로 찾히는 컷이 없다. 있는 것 = ' +
              ', '.join(os.path.basename(f)[:-4] for f in files[:12]) + (' …' if len(files) > 12 else ''))
        sys.exit(1)
    ims = []
    for f in hit[:4]:
        im = Image.open(f).convert('RGBA')
        ims.append((os.path.basename(f)[:-4], im.size, im.resize(
            (int(im.width * x), int(im.height * x)), Image.LANCZOS)))
    W = sum(i.width for _, _, i in ims) + 40 * (len(ims) + 1)
    H = max(i.height for _, _, i in ims) + 74
    c = Image.new('RGB', (W, H), (250, 248, 244))
    d = ImageDraw.Draw(c)
    px = 40
    for name, orig, im in ims:
        c.paste(im, (px, 54), im)
        d.text((px, 30), f'{name}   원본 {orig[0]}x{orig[1]} · {x}배', fill=(70, 60, 55))
        px += im.width + 40
    d.text((14, 8), f'🔍 판정용 — {x}배 확대. 글자·종·마릿수는 «여기서» 본다.', fill=(150, 60, 50))
    c.thumbnail((3000, 3000), Image.LANCZOS)
    c.save(out, quality=96)
    print(f'🔍 {out}  ({len(ims)}컷 · {x}배 · {c.size[0]}x{c.size[1]})')

ap = argparse.ArgumentParser()
ap.add_argument('paths', nargs='+')
ap.add_argument('--cols', type=int, default=6)
ap.add_argument('--size', type=int, default=300)
ap.add_argument('--zoom', default=None, help='이 이름 조각이 든 컷만 크게 (판정용)')
ap.add_argument('--x', type=float, default=3.0, help='확대 배율 (기본 3 · 글자는 8까지)')
ap.add_argument('--out', default=None)
a = ap.parse_args()

fs = collect(a.paths)
if not fs:
    print('⛔ 이미지가 없다:', a.paths); sys.exit(1)
if a.zoom:
    zoom(fs, a.zoom, a.x, a.out or '/tmp/zoom.png')
else:
    sheet(fs, a.cols, a.size, a.out or '/tmp/contact.png')
