#!/usr/bin/env python3
"""🔍 자른 컷 2단계 검수 — **숫자로 좁히고, 눈으로 판정한다.**

창업자 2026-07-31: *"이렇게 2번 검수하는거 코드에 박아둬."*

════════ 왜 2단계인가 (이걸 몰라서 하루를 썼다) ════════
2026-07-30~31에 같은 실수를 세 번 했다.

  ① 숫자만 믿었다  → 재료 스티커가 **0%로 나왔는데 화면은 지저분했다.**
     찌꺼기가 "어둡고 무채색"이 아니라 **회갈색**이라 필터에 안 걸린 것.
  ② 눈만 믿었다    → 6컷만 고치고 끝낸 줄 알았는데 **앱 전체에 퍼져 있었다.**
     853컷을 눈으로 다 볼 수는 없다.
  ③ 숫자로 판정했다 → 의심 71컷 안에 **꼬르곰의 흰 다이컷 테두리**와
     **뚝배기의 검은 몸통**이 잔뜩 섞여 있었다. 둘 다 "어둡다".

📌 **결론: 숫자는 「어디를 볼지」만 정하고, 「맞나 틀리나」는 눈이 정한다.**
   숫자 없이는 다 못 보고, 눈 없이는 그림과 찌꺼기를 못 가른다.

════════ 그래서 이 도구가 하는 일 ════════
  1단계(숫자) — 컷 전부의 **바깥 테두리 띠**를 재서 의심 순위를 매긴다
       ⒜ 격자 찌꺼기 : 어둡고 무채색           (AI가 그려 넣은 회색 체커)
       ⒝ 회갈색 잔재 : 속살보다 눈에 띄게 어두움 (흰 배경과의 경계가 남은 것)
       ⒞ 가장자리 닿음 : 잘렸을 가능성
  2단계(눈)  — 사람이 **딱 두 장만** 보면 되게 판을 만들어 준다
       ⒜ 전체 컨택트시트   (진한 판 `#22263A` — 흰 그림·투명 실패가 드러난다)
       ⒝ 전체 컨택트시트   (빨간 판 — **그림 안에 갇힌 흰 판**이 모양째로 드러난다)
       ⒞ 의심 컷 확대 시트 (밝은 판 — 테두리 잔재는 밝은 판에서 잘 보인다)

⚠️ **두 판을 다 만드는 이유** = 진한 판에서는 **흰 테두리 잔재**가, 밝은 판에서는
   **어두운 잔재**가 보인다. 한 판만 보면 반은 놓친다(2026-07-29 실제 사고).

⚠️ 파일 이름 주의 — 처음엔 `inspect.py` 로 지었다가 **파이썬 표준 모듈 `inspect` 를 가려**
   numpy/scipy import 가 통째로 깨졌다. 📌 **도구 이름이 표준 모듈 이름을 뺏으면 안 된다.**

쓰기:
    python3 tools/cut-check.py <폴더>            # 그 폴더의 *.png 전부
    python3 tools/cut-check.py <폴더> --out 검수  # 결과 이미지 저장 위치
    python3 tools/cut-check.py <폴더> --top 24   # 확대해서 볼 의심 컷 개수

⭐ `tools/cut.py` 가 자른 뒤 **자동으로 이걸 부른다.** 자르기만 하고 검수를 건너뛸 수 없다.
"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

DARK_PANEL = (34, 38, 58)    # #22263A — 흰 그림·투명 실패가 드러나는 판
# ⭐⭐ **빨간 판 (2026-07-31 추가)** — 진한 판만으로는 못 잡은 사고가 있었다.
#   가을 바구니 «손잡이 안쪽»이 **흰 판으로 막혀** 있었는데, 진한 판에선 그게
#   «밝은 얼룩»으로만 보여 **그림의 흰 부분(레이스·니트)과 구분이 안 갔다.**
#   채도 높은 색 위에 얹으니 **막힌 모양째로** 드러났다. → `--punch` 로 고쳤다.
RED_PANEL = (185, 50, 50)
LIGHT_PANEL = (246, 243, 235)  # 앱 크림 배경과 비슷 — 어두운 잔재가 드러나는 판


def measure(path):
    """컷 하나를 재서 (격자찌꺼기%, 회갈색잔재%, 가장자리닿음) 를 낸다."""
    a = np.array(Image.open(path).convert('RGBA')).astype(int)
    al = a[..., 3] > 25
    if al.sum() < 300:
        return None
    # 바깥 3px 띠 — 잔재는 여기 산다
    band = al & ~ndimage.binary_erosion(al, np.ones((7, 7)))
    if band.sum() == 0:
        return None
    rgb = a[..., :3]
    lum = rgb.mean(2)

    # ⒜ 격자 찌꺼기 = 어둡고 무채색 (AI가 그린 회색 체커의 흔적)
    grid = ((rgb.max(2) < 130) & ((rgb.max(2) - rgb.min(2)) <= 24) & band).sum() * 100.0 / band.sum()

    # ⒝ 회갈색 잔재 = 띠 안에서 **상대적으로** 어두운 픽셀
    #    ⚠️ 절대 밝기로 재면 놓친다 — 계란후라이 잔재는 밝기 130~200이었다.
    v = lum[band]
    dim = (v < np.percentile(v, 80) - 45).sum() * 100.0 / len(v)

    # ⒞ 가장자리에 닿았나 = 잘렸을 가능성
    h, w = al.shape
    touch = bool(al[0].any() or al[h - 1].any() or al[:, 0].any() or al[:, w - 1].any())
    return grid, dim, touch


def sheet(paths, out, panel, cell=200, cols=None, labels=None):
    """컨택트시트 한 장을 만든다."""
    if not paths:
        return None
    cols = cols or min(16, max(4, int(len(paths) ** 0.5) + 2))
    rows = (len(paths) + cols - 1) // cols
    img = Image.new('RGB', (cell * cols, cell * rows), panel)
    d = ImageDraw.Draw(img)
    ink = (255, 235, 150) if panel == DARK_PANEL else (60, 50, 40)
    for i, p in enumerate(paths):
        im = Image.open(p).convert('RGBA')
        im.thumbnail((cell - 16, cell - 30))
        x, y = (i % cols) * cell + 8, (i // cols) * cell + 24
        img.paste(im, (x, y), im)
        d.text(((i % cols) * cell + 8, (i // cols) * cell + 6),
               (labels[i] if labels else os.path.basename(p)[:-4])[:22], fill=ink)
    img.save(out)
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        sys.exit(1)
    src = args[0]
    out_dir = args[1] if len(args) > 1 else os.path.join(os.path.dirname(src.rstrip('/')) or '.', '_검수')
    top = 24
    if '--top' in sys.argv:
        top = int(sys.argv[sys.argv.index('--top') + 1])
    os.makedirs(out_dir, exist_ok=True)

    files = sorted(glob.glob(os.path.join(src, '*.png')) if os.path.isdir(src) else glob.glob(src))
    if not files:
        print(f'❌ 볼 게 없다: {src}')
        sys.exit(1)

    rows = []
    for p in files:
        m = measure(p)
        if m:
            rows.append((m[0], m[1], m[2], p))

    print(f'\n🔍 1단계(숫자) — {len(rows)}컷 측정')
    grids = [r[0] for r in rows]
    dims = [r[1] for r in rows]
    touched = [r for r in rows if r[2]]
    print(f'   격자 찌꺼기  평균 {sum(grids)/len(grids):5.1f}%   최대 {max(grids):5.1f}%')
    print(f'   회갈색 잔재  평균 {sum(dims)/len(dims):5.1f}%   최대 {max(dims):5.1f}%')
    if touched:
        print(f'   ⚠️ 가장자리에 닿은 컷 {len(touched)}개 — 잘렸을 수 있다:')
        for r in touched[:8]:
            print(f'      {os.path.basename(r[3])}')

    # 의심 = 격자 8%↑ 또는 회갈색 45%↑ (닿은 건 무조건 맨 위로)
    suspect = sorted([r for r in rows if r[0] >= 8 or r[1] >= 45 or r[2]],
                     key=lambda r: (not r[2], -(r[0] + r[1])))
    print(f'   → 눈으로 볼 의심 컷 {len(suspect)}개')

    base = os.path.basename(src.rstrip('/')) or 'cut'
    p1 = sheet(files, os.path.join(out_dir, f'{base}-전체-진한판.png'), DARK_PANEL)
    p3 = sheet(files, os.path.join(out_dir, f'{base}-전체-빨간판.png'), RED_PANEL)
    p2 = sheet([r[3] for r in suspect[:top]],
               os.path.join(out_dir, f'{base}-의심-밝은판.png'), LIGHT_PANEL,
               cell=430, cols=4,
               labels=[f'{os.path.basename(r[3])[:-4]}  격자{r[0]:.0f}% 어둠{r[1]:.0f}%' for r in suspect[:top]])
    # 🔍🔍 **까만 판 «크게»** — 2026-08-12 창업자 *"까만판에 올려봐. 테두리가 이상해"*
    #   ⛔ 그날 나는 밝은 판만 보고 「깨끗하다」고 보고했고, 접시·냄비 아래 흰 얼룩을 통째로 놓쳤다.
    #   📌 위 `-전체-진한판` 은 셀 200px 이라 **한 컷이 엄지손톱만 하다** — 잔재가 그 크기론 안 보인다.
    #      그래서 「만들어는 놨는데 봐도 못 잡는」 판이 된다.
    #   ⭐ 셀을 460px 로 크게 잡은 판을 «따로» 만든다. 열자마자 보인다.
    #      (컷 수가 많으면 앞 24장만 — 다 넣으면 판이 너무 커져 아무도 안 연다)
    p4 = sheet(files[:24], os.path.join(out_dir, f'{base}-진한판-크게.png'), DARK_PANEL,
               cell=460, cols=4)

    print('\n👁 2단계(눈) — 이 두 장을 열어서 본다')
    print(f'   ⭐⭐ ① 진한 판 «크게»  {p4}')
    print('      → **여기부터 연다.** 흰 잔재·바닥 그림자는 «까만 판을 키워야» 보인다.')
    print('      ⛔ 2026-08-12 — 밝은 판만 보고 「깨끗하다」고 했다가 창업자가 잡았다')
    print('         (*"지금 지저분하게 잘렸어"* → *"까만판에 올려봐"*). 접시·냄비 아래 흰 얼룩이었다.')
    print(f'   ①-a 전체(진한 판)  {p1}')
    print('      → 흰 그림이 안 보이거나 투명이 안 된 컷이 여기서 드러난다')
    print(f'   ①-b 전체(빨간 판) {p3}')
    print('      → **그림 안에 갇힌 흰 판**(바구니 손잡이 속)이 여기서만 모양째로 드러난다')
    if p2:
        print(f'   ② 의심(밝은 판)  {p2}')
        print('      → 테두리에 삐죽삐죽한 잔재·점점이가 있는지 본다')
    print('   ⚠️ 어두운 선이 있다고 다 잘못된 게 아니다 —')
    print('      우리 진갈색 마감·검은 뚝배기·수박 껍질은 **그림 자체**다. 그건 그대로 둔다.')

    # ══════════ 3단계 — **실제 앱에서 보일 크기로** 본다 ══════════
    # ⚠️ 1·2단계는 **원본 픽셀**을 본다. 그런데 유저는 원본을 안 본다.
    #    2026-07-31 창업자 제보(마늘·셰프모자)가 정확히 이 구멍이었다 —
    #    **파일은 0%로 깨끗한데 화면은 지저분했다.** 원인은 확대였다.
    # 📌 그래서 3단계는 **앱과 같은 크기·같은 배경**으로 다시 그려서 본다.
    #    + 알파 품질(반투명 픽셀 비율)도 같이 본다. 알파가 0/255뿐이면 키울 때 **계단**이 진다.
    STICKER_PX, FRAME_PX = 238, 626
    hard = []
    shots = []
    for _, _, _, p in rows:
        im = Image.open(p).convert('RGBA')
        a = np.array(im)
        al = a[..., 3]
        soft = ((al > 0) & (al < 255)).sum() * 100.0 / max((al > 0).sum(), 1)
        if soft < 2.0:
            hard.append((soft, os.path.basename(p)[:-4]))
        show = FRAME_PX if 'frame' in p or os.path.basename(p).startswith('nf') else STICKER_PX
        im2 = im.resize((max(1, round(im.width * show / max(im.size))),
                         max(1, round(im.height * show / max(im.size)))), Image.LANCZOS)
        shots.append((im2, os.path.basename(p)[:-4]))

    print(f'\n📐 3단계(실제 크기) — 앱에 보일 크기로 다시 그려서 본다')
    if hard:
        print(f'   ⚠️ 알파가 0/255뿐인 컷 {len(hard)}개 — 키우면 **계단**이 진다:')
        for s, n in sorted(hard)[:8]:
            print(f'      {n}  (반투명 {s:.1f}%)')
    else:
        print('   ✅ 알파 품질 OK — 반투명 가장자리가 살아 있다(계단 안 진다)')

    cell = 260
    cols = min(10, len(shots))
    rws = (len(shots) + cols - 1) // cols
    canvas = Image.new('RGB', (cell * cols, cell * rws), LIGHT_PANEL)
    dd = ImageDraw.Draw(canvas)
    for i, (im2, nm) in enumerate(shots):
        t = im2.copy(); t.thumbnail((cell - 12, cell - 26))
        canvas.paste(t, ((i % cols) * cell + 6, (i // cols) * cell + 20), t)
        dd.text(((i % cols) * cell + 6, (i // cols) * cell + 4), nm[:20], fill=(120, 110, 100))
    p3 = os.path.join(out_dir, f'{base}-실제크기.png')
    canvas.save(p3)
    print(f'   ③ 실제 크기   {p3}')
    print('      → 앱에서 보일 크기 그대로다. 여기서 안 지저분하면 유저도 안 지저분하다.\n')


if __name__ == '__main__':
    main()
