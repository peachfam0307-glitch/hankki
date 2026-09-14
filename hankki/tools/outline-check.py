#!/usr/bin/env python3
"""🔎 끊긴 외곽선 찾기 — 「우리 그림체의 진갈색 테두리가 잘리다 파먹혔나」를 전수로 잰다.

왜 만들었나 (창업자 2026-07-31):
  *"근데 이게 한두개가 아니라. 외곽선 있는 그림들은 다 이래.. 꼬르곰 펭펭도 이럴지도 몰라.
    그게 답답한거야"*
  맞는 말이다. 원인이 **하나**라서 그렇다 — 옛 컷 도구가 알파를 «판정»했고
  (`배경 = 밝기 >= 234`), 진갈색 외곽선의 **안티에일리어싱된 옅은 가장자리**가 그 문턱을 넘어
  배경으로 잘려나갔다. 그래서 **이어져 있어야 할 선이 점점이 끊겼다.**
  한 컷씩 눈으로 찾을 수 없으니 **숫자로 전수 조사**한다.

════════ 어떻게 재나 ════════
외곽선이 성한 그림은 **실루엣을 따라 어두운 픽셀이 고르게** 있다.
파먹힌 그림은 **어떤 구간은 진하고 어떤 구간은 통째로 비어** 있다.
→ 무게중심에서 본 **각도 36칸**으로 나눠 칸마다 「테두리에 어두운 픽셀이 얼마나 있나」를 재고,
   **칸끼리 얼마나 들쭉날쭉한가**를 본다.

  덮임(cover) = 테두리 띠에서 어두운 픽셀 비율
    · 높다(>0.55)           → 외곽선이 성하다 ✅
    · 중간(0.15~0.55)이면서
      칸별 편차가 크다      → ⚠️ **끊긴 것** (있어야 할 선이 반만 남았다)
    · 낮다(<0.15)           → 애초에 외곽선이 없는 그림(수채·파스텔) — 문제 아님

⚠️⚠️ **이 숫자는 「어디를 볼지」만 정한다. 판정은 눈이 한다**(`/3번검수` 원칙).
   실제로 2026-07-31에 상위 20개를 눈으로 보니 **꼬르곰·펭펭(`gp_*`)은 전부 멀쩡했다**(오탐).
   흰 갈매기·흰 돛처럼 원래 밝은 그림도 외곽선이 얇아 낮게 나온다.

📌📌 **그리고 사실 이 검사로 골라낼 필요가 없다.**
   원본 시트가 `docs/stickers/**/원본시트/` 에 **260장 전부** 남아 있어서
   (「창업자가 준 시트는 무조건 다 저장」 규칙 덕이다) **의심 가는 걸 고르지 말고 전부 다시 자르면 된다.**
   이 검사는 «얼마나 급한가»를 재는 용도지, 대상을 고르는 용도가 아니다.

쓰기:
  python3 tools/outline-check.py <폴더 또는 파일…> [--top 30]
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

DARK = 150        # 이보다 어두우면 '외곽선 후보'(우리 진갈색 마감 #5B4436 = 91)
SECTORS = 36      # 각도 칸 수


def measure(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(int)
    al = a[..., 3] > 25
    if al.sum() < 400:
        return None
    rgb = a[..., :3]
    # 테두리 띠 = 실루엣 바깥 2px
    band = al & ~ndimage.binary_erosion(al, np.ones((5, 5)))
    if band.sum() < 60:
        return None
    dark = band & (rgb.max(2) < DARK)
    cover = dark.sum() / band.sum()
    # ⭐⭐ **흰 다이컷 테두리가 있으면 애초에 안 파먹힌다** (2026-07-31 눈으로 확인).
    #   꼬르곰·펭펭(`gp_*`)이 숫자로는 상위였는데 **멀쩡했다** — 그림에 흰 테두리가 이미 그려져 있어서
    #   실루엣 경계가 흰색이고, 진갈색 선은 그 안쪽에 **보호받으며** 앉아 있었기 때문이다.
    #   → 이게 창업자의 「띠부씰로 자르자」가 맞다는 증거다. **잘 나온 컷들이 이미 그러고 있었다.**
    #   ⚠️ 그래서 흰 테두리가 있는 컷은 이 검사에서 빼야 한다(오탐).
    white_edge = (band & (rgb.max(2) > 232) & ((rgb.max(2) - rgb.min(2)) < 26)).sum() / band.sum()

    # 무게중심에서 본 각도로 칸을 나눈다
    ys, xs = np.where(band)
    cy, cx = ys.mean(), xs.mean()
    ang = (np.arctan2(ys - cy, xs - cx) + np.pi) / (2 * np.pi)     # 0~1
    sec = np.minimum((ang * SECTORS).astype(int), SECTORS - 1)
    dv = dark[ys, xs]
    per = np.array([dv[sec == s].mean() if (sec == s).any() else np.nan for s in range(SECTORS)])
    per = per[~np.isnan(per)]
    if len(per) < 8:
        return None
    # 들쭉날쭉함 = 「선이 있는 칸」과 「없는 칸」이 섞여 있는 정도
    has, none = (per > 0.55).mean(), (per < 0.12).mean()
    patchy = min(has, none) * 2          # 둘 다 많을수록 1에 가깝다 = 끊김
    return cover, patchy, per.std(), white_edge


def main():
    ti = sys.argv.index('--top') + 1 if '--top' in sys.argv else None
    top = int(sys.argv[ti]) if ti else 30
    skip = {ti} if ti else set()          # --top 뒤의 숫자는 경로가 아니다
    args = [a for i, a in enumerate(sys.argv) if i > 0 and not a.startswith('--') and i not in skip]
    files = []
    for a in args or ['src/assets/stickers/photo']:
        if os.path.isdir(a):
            files += [os.path.join(a, f) for f in sorted(os.listdir(a)) if f.endswith('.png')]
        else:
            files.append(a)

    rows = []
    for f in files:
        m = measure(f)
        if m:
            rows.append((os.path.basename(f)[:-4], *m))

    guarded = [r for r in rows if r[4] > 0.20]                      # 흰 다이컷 테두리가 지켜준 컷
    bare = [r for r in rows if r[4] <= 0.20]                        # 맨몸 — 파먹힐 수 있는 컷
    broken = [r for r in bare if 0.15 <= r[1] <= 0.62 and r[2] > 0.45]
    solid = [r for r in bare if r[1] > 0.62]
    noline = [r for r in bare if r[1] < 0.15]

    print(f'\n🔎 {len(rows)}컷 측정')
    print(f'   🛡 흰 테두리가 지켜줌 {len(guarded):4d}컷   ← 안 건드려도 된다(곰펭이 여기)')
    print(f'   ── 맨몸 {len(bare)}컷 중 ──')
    print(f'   ✅ 외곽선 성함     {len(solid):4d}컷')
    print(f'   ⚠️ 끊긴 것 의심    {len(broken):4d}컷   ← 눈으로 볼 것')
    print(f'   ㅡ 외곽선 없는 그림 {len(noline):4d}컷   (수채·파스텔 — 문제 아님)')
    if broken:
        broken.sort(key=lambda r: -r[3])
        print(f'\n   들쭉날쭉한 순서 (위 {min(top, len(broken))}개)')
        print(f'   {"컷":16s} {"덮임":>6s} {"끊김":>6s} {"편차":>6s}')
        for nm, cov, pat, sd, _w in broken[:top]:
            print(f'   {nm:16s} {cov:6.2f} {pat:6.2f} {sd:6.2f}')
    print()
    return broken


if __name__ == '__main__':
    main()
