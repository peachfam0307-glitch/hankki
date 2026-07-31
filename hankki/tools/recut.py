#!/usr/bin/env python3
"""♻️ 다시 자르기 — 원본 시트에서 새로 자른 컷을 **앱의 옛 key에 자동으로 덮어쓴다.**

왜 만들었나 (2026-07-31):
  옛 컷 도구가 알파를 «판정»해서 **진갈색 외곽선의 옅은 가장자리를 배경으로 잘라먹었다.**
  선이 점점이 끊긴 컷이 앱 곳곳에 있다. 원본 시트는 다 남아 있으니 **다시 자르면 된다.**
  ⚠️ 그런데 손으로 하면 **어느 새 컷이 어느 옛 key인지** 짝짓는 데서 반드시 실수가 난다
     (낱개 이름 규칙이 팩마다 다르다: `01.png`·`x11.png`·`nsf_01.png`).

⭐ **짝은 이름이 아니라 픽셀로 짓는다.**
  12×12로 줄인 밝기＋알파 지문을 만들어 **가장 닮은 앱 컷**을 찾는다.
  크기·이름과 무관하게 «같은 그림인가»만 본다.

⚠️ **덮어쓰기 전에 반드시 확인시킨다** — `--apply` 없이는 짝만 보여주고 아무것도 안 바꾼다.
   그리고 옛 파일은 `docs/stickers/_옛컷-백업-<날짜>/` 에 **먼저 복사**한다(원본은 절대 안 지운다).

쓰기:
  python3 tools/recut.py <시트.png…> [--diecut auto] [--min 6000] [--frame] [--apply]
"""
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

APP = 'src/assets/stickers/photo'
FP = 12
NEAR = 0.22          # 이보다 가까우면 같은 그림. 넉넉히 — 다시 자르면 가장자리가 달라진다


def fp(path):
    """⚠️ **흰 테두리를 벗기고 지문을 뜬다.**
    띠부씰 테두리를 두르면 실루엣이 커져서 «같은 그림»인데도 지문이 크게 달라진다
    (실제로 닮음이 0.85까지 떨어져 짝을 못 찾았다).
    → 알파를 안쪽으로 긴변의 2.5%만큼 깎아 **테두리를 지우고**, 그 범위로 잘라서 잰다.
       테두리(0.7%)든 8px든 확실히 벗겨진다."""
    try:
        im = Image.open(path).convert('RGBA')
    except Exception:
        return None
    a = np.asarray(im, dtype=np.uint8)
    al = a[..., 3] > 25
    if al.sum() < 50:
        return None
    k = max(2, round(max(a.shape[:2]) * 0.025))
    core = ndimage.binary_erosion(al, np.ones((k, k)))
    if core.sum() < 30:
        core = al
    ys, xs = np.where(core)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = a[y0:y1, x0:x1].astype(np.float32) / 255.0
    msk = core[y0:y1, x0:x1].astype(np.float32)
    g = np.asarray(Image.fromarray((sub[..., :3].mean(2) * msk * 255).astype(np.uint8)).resize((FP, FP), Image.BILINEAR), dtype=np.float32)
    m = np.asarray(Image.fromarray((msk * 255).astype(np.uint8)).resize((FP, FP), Image.BILINEAR), dtype=np.float32)
    v = np.concatenate([g.ravel(), m.ravel()]) / 255.0
    n = np.linalg.norm(v)
    return v / n if n > 1e-6 else v


def main():
    argv = sys.argv[1:]
    apply = '--apply' in argv
    sheets = [a for a in argv if not a.startswith('--') and a.endswith('.png')]
    if not sheets:
        print(__doc__)
        return 1
    def opt(name, dflt=None):
        return argv[argv.index(name) + 1] if name in argv and argv.index(name) + 1 < len(argv) else dflt
    diecut, minpx, is_frame, join, drop = opt('--diecut'), opt('--min'), '--frame' in argv, opt('--join'), opt('--drop')

    # ① 앱 컷 지문
    app_names, app_fp = [], []
    for f in sorted(os.listdir(APP)):
        if f.endswith('.png'):
            v = fp(os.path.join(APP, f))
            if v is not None:
                app_names.append(f[:-4])
                app_fp.append(v)
    A = np.array(app_fp, dtype=np.float32)

    # ② 시트를 임시로 자른다
    tmp = tempfile.mkdtemp(prefix='recut-')
    here = os.path.dirname(os.path.abspath(__file__))
    for i, sh in enumerate(sheets):
        cmd = [sys.executable, os.path.join(here, 'cut.py'), sh, os.path.join(tmp, f's{i}'), 'r', '--no-check']
        if diecut: cmd += ['--diecut', diecut]
        if minpx: cmd += ['--min', minpx]
        if join: cmd += ['--join', join]
        if drop: cmd += ['--drop', drop]
        if is_frame: cmd += ['--frame']
        subprocess.run(cmd, check=False, stdout=subprocess.DEVNULL)

    news = []
    for dp, _dn, fn in os.walk(tmp):
        news += [os.path.join(dp, f) for f in sorted(fn) if f.endswith('.png')]

    # ③ 픽셀로 짝짓기
    #   ⚠️⚠️ **파일 순서대로 배정하면 안 된다.** 처음엔 그렇게 했다가 **쪼리가 `mn_81`(컵케이크)를
    #      선점**하고, 정작 진짜 짝인 `sk_14` 는 비어 있는데 레몬이 짝을 못 찾았다.
    #      먼저 온 컷이 남의 자리를 차지해 버린다.
    #   → ⒜**한 시트의 컷은 거의 한 접두어로 간다**(같은 팩이니까). 1차 매칭의 **최빈 접두어**로
    #        후보를 좁히고 ⒝**닮은 순서대로** 배정한다(제일 확실한 짝부터 자리를 잡는다).
    import re as _re
    fps = [(p, fp(p)) for p in news]
    fps = [(p, v) for p, v in fps if v is not None]
    D = np.array([[float(np.linalg.norm(A[j] - v)) for j in range(len(A))] for _p, v in fps])

    def prefix_of(name):
        m = _re.match(r'^(.*?)(?=\d)', name)
        return (m.group(1) if m and m.group(1) else name).rstrip('_')

    rough = [app_names[int(D[i].argmin())] for i in range(len(fps))]
    from collections import Counter
    top = Counter(prefix_of(n) for n in rough).most_common(1)
    allow = None
    if top and top[0][1] >= max(3, len(fps) // 2):
        allow = top[0][0]
        print(f'   🔎 이 시트는 «{allow}» 무리로 보인다 — 후보를 거기로 좁힌다')

    # 접두어로 좁히면 엉뚱한 데로 갈 위험이 확 줄어드니 **문턱을 넉넉히** 준다.
    #   (좁히기 전엔 0.22로 조여야 했지만, 좁힌 뒤엔 레몬·쪼리처럼 구도가 조금 달라진 컷도 잡아야 한다.)
    near = 0.36 if allow else NEAR
    cand = [j for j in range(len(A)) if allow is None or prefix_of(app_names[j]) == allow]
    order = sorted(((D[i][j], i, j) for i in range(len(fps)) for j in cand), key=lambda t: t[0])
    takenI, takenJ, pairs = set(), set(), []
    for dist, i, j in order:
        if i in takenI or j in takenJ or dist > near:
            continue
        takenI.add(i); takenJ.add(j)
        pairs.append((fps[i][0], app_names[j], dist))
    # 🖐 손으로 지정 — `--pair r06=sk_07,r14=sk_14`
    #   자동이 99%를 맞춰도 **한두 개는 구도가 달라 문턱을 못 넘는다.** 그걸 위해 남겨둔 문.
    #   ⛔ 문턱을 더 풀면 엉뚱한 컷이 섞인다 — 그건 손으로 지정하는 것보다 훨씬 나쁘다.
    manual = {}
    for kv in (opt('--pair') or '').split(','):
        if '=' in kv:
            a, b = kv.split('=', 1)
            manual[a.strip()] = b.strip()
    for i, (pth, _v) in enumerate(fps):
        key = manual.get(os.path.basename(pth)[:-4])
        if key and key in app_names:
            j = app_names.index(key)
            pairs = [t for t in pairs if t[1] != key]
            takenI.add(i); takenJ.add(j)
            pairs.append((pth, key, 0.0))
    orphans = [(fps[i][0], app_names[int(D[i].argmin())], float(D[i].min()))
               for i in range(len(fps)) if i not in takenI]

    print(f'\n♻️ 새로 자른 {len(news)}컷 · 짝 찾음 {len(pairs)} · 못 찾음 {len(orphans)}\n')
    for p, key, d in sorted(pairs, key=lambda t: t[2]):
        print(f'   {key:16s} ← {os.path.basename(p):10s}  닮음 {1-d:.3f}')
    if orphans:
        print('\n   ❓ 앱에 짝이 없다 (안 쓰는 컷이거나 새 그림)')
        for p, near, d in orphans:
            print(f'   {os.path.basename(p):10s}  제일 닮은 건 {near} ({1-d:.3f})')

    # ⭐⭐ **짝을 그림으로 보여준다 — 숫자만 믿고 덮어쓰지 않는다.**
    #   닮음이 0.8이어도 엉뚱한 컷일 수 있다(실제로 쪼리가 `mn_81` 로 갔다).
    #   잘못된 key에 덮어쓰면 **앱에 딴 그림이 뜬다.** 되돌리기도 번거롭다.
    #   → 우리 원칙 그대로: **숫자는 어디를 볼지만 정하고, 맞나 틀리나는 눈이 정한다.**
    panel = opt('--panel')
    if panel:
        from PIL import ImageDraw
        px, cell, cols = 190, 208, 6
        rows = (len(pairs) + len(orphans) + cols - 1) // cols
        c = Image.new('RGB', (cols * cell * 2 + 20, rows * cell + 70), (246, 243, 235))
        d = ImageDraw.Draw(c)
        d.text((16, 14), '짝 확인 — 각 쌍 왼쪽=앱에 있는 옛 컷 / 오른쪽=새로 자른 것', fill=(100, 100, 110))
        items = [(k, p, f'{1-dd:.2f}') for p, k, dd in pairs] + [(None, p, '짝없음') for p, _n, _d in orphans]
        for i, (key, newp, tag) in enumerate(items):
            col, row = i % cols, i // cols
            srcs = [os.path.join(APP, key + '.png') if key else None, newp]
            for kk, sp2 in enumerate(srcs):
                if not sp2 or not os.path.exists(sp2):
                    continue
                im = Image.open(sp2).convert('RGBA')
                w, h = im.size
                sc = px / max(w, h)
                im = im.resize((max(1, int(w * sc)), max(1, int(h * sc))), Image.LANCZOS)
                c.paste(im, ((col * 2 + kk) * cell + 10 + (px - im.width) // 2,
                             row * cell + 70 + (px - im.height) // 2), im)
            d.text((col * 2 * cell + 10, row * cell + 56), f'{key or "?"} {tag}', fill=(130, 130, 140))
        c.save(panel)
        print(f'   👁 짝 확인표 → {panel}')

    if not apply:
        print('\n   ⚠️ 아직 아무것도 안 바꿨다. 짝이 다 맞으면 `--apply` 를 붙여 다시 돌린다.\n')
        return 0

    # ④ 옛 파일 백업 후 덮어쓰기 + 비율 갱신
    import re
    from datetime import datetime, timedelta, timezone
    day = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d')   # KST
    bak = f'docs/stickers/_옛컷-백업-{day}'
    os.makedirs(bak, exist_ok=True)
    ratios = {}
    for p, key, _d in pairs:
        dst = os.path.join(APP, key + '.png')
        shutil.copy(dst, os.path.join(bak, key + '.png'))     # ⛔원본은 절대 안 지운다
        shutil.copy(p, dst)
        w, h = Image.open(dst).size
        ratios[key] = round(w / h, 4)
    sp = 'src/components/Stickers.jsx'
    s = open(sp, encoding='utf-8').read()
    for k, v in ratios.items():
        s = re.sub(rf'\b{k}: [0-9.]+', f'{k}: {v}', s)         # PNG를 바꾸면 비율도 같이(규칙)
    open(sp, 'w', encoding='utf-8').write(s)
    print(f'\n   ✅ {len(pairs)}컷 덮어씀 · 옛 파일은 {bak}/ 에 보관 · PHOTO_RATIO 갱신\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
