#!/usr/bin/env python3
"""✂️ 스티커 자르기 — **표준 도구.** 앞으로 시트는 전부 이걸로 자른다.

왜 하나로 합쳤나 (창업자 2026-07-30):
  *"우리 이거 구조적으로 잡자. 반복적으로 프레임 고친거 원인 찾고 거기에 맞는 코드 만들어서
    이제 한번에 가자."*
  하루에 프레임을 **네 번** 고쳤다(잘림 → 잡조각 → 계단 → 흰 테). 매번 다른 도구로 땜질했다.
  도구가 12개로 난립했고 각자 다른 방식이라 사고가 반복됐다.

════════ 왜 지저분하게 잘렸나 — 진짜 원인 ════════
옛 도구(`cutout-stickers.py`)는 알파를 **판정**했다:
    배경 후보 = (채도 낮음) & (밝기 >= 234)      ← 둘 중 하나로 자름
그래서 **중간이 없다.** 흰 배경에 그린 그림의 가장자리는 원래 **흰색과 반쯤 섞여** 있는데,
이걸 "배경(0)이냐 그림(255)이냐"로 나누니 두 가지가 동시에 터진다:
  ① **계단** — 알파가 0/255뿐이라 곡선이 픽셀 계단으로 보인다(626px로 키우면 확 보인다)
  ② **흰 테** — 반쯤 흰 픽셀이 '그림'으로 굳어, 색은 흰 기운을 띤 채 불투명으로 남는다
     (그걸 나중에 흐려서 부드럽게 만들면 **흰 테가 더 넓어진다** — 실제로 그랬다)

════════ 그래서 어떻게 자르나 — 표준 5단계 ════════
① **덩어리(blob)로 자른다. 격자 금지.**
   격자로 자르면 선 위에 칼이 지나가 **본체가 잘리거나 옆 그림이 딸려 온다.**
   (실제 사고: 레몬 컷에 옆 요트의 돛이 붙어 왔고, 요트는 왼쪽 선이 잘렸다)
② **알파를 판정하지 않고 계산한다.**
       보이는색 = 원래색 × α + 255 × (1−α)   →   α = (255 − 보이는색) / (255 − 원래색)
   '원래색'은 **속살**(안쪽으로 몇 px 들어간 진짜 그림 색)에서 가져온다.
   → 반투명 가장자리가 **원본 그대로** 살아난다. 계단도 흰 테도 안 생긴다.
③ **색을 속살 색으로 되돌린다** — 가장자리에 남은 흰 기운을 빼낸다.
④ **프레임이면 가운데 창을 뚫는다** — 한가운데에서 흰색만 번지게 한다(선이 막아준다).
   ⚠️ 바깥에서 번지게 하면 선의 틈으로 새어 그림까지 지운다. **반드시 가운데에서.**
⑤ **여백 12px** — 가장자리에 딱 붙으면 잘린 것처럼 보이고 게이트에 걸린다.

════════ 자른 뒤 검수 ════════
`node scripts/check-cutouts.mjs` 가 **잘림·잡조각·계단** 을 자동으로 본다.
`npm run smoke` 에 물려 있어 **걸리면 배포가 막힌다.** 사람 눈을 믿지 않는다.

쓰기:
  python3 tools/cut.py <시트.png> <내보낼폴더> <접두어> [--frame] [--min 8000]
     --frame  프레임이면 켠다(가운데 창 뚫기)
     --diecut N|auto  🏷흰 테두리를 **바깥쪽만** 두른다 (안쪽 창은 투명 그대로)
                      auto = 긴변의 0.7% (얇은 보호막·기본) · 숫자 = 그 px (두꺼운 띠부씰 팩용)
     --min    이 픽셀 수보다 작은 덩어리는 먼지로 보고 버린다
     --join N 떨어진 조각을 한 덩어리로 묶는 거리(기본 5). 쪼리처럼 두 짝이면 키운다
     --drop R 본체 대비 이 비율보다 작고 떨어진 조각(하트·반짝)은 뗀다(기본 0.12 · 0이면 끔)
     --punch R 그림 «안»에 갇힌 순백(≥252) 구멍이 컷 넓이의 R 이상이면 투명하게 뚫는다
              (바구니 손잡이 안쪽처럼 `binary_fill_holes` 가 메워버린 배경. 0.004 권장)
     --grid RxC 씬 컷용 — 격자는 «나누는 데만» 쓰고 한 칸의 덩어리를 한 컷으로 묶는다
                (곰 + 떨어진 그릴·선풍기처럼 소품이 흩어진 시트. ⛔칼이 그림을 안 자른다)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

PAD = 12
WHITE = 246          # 이보다 밝고 채도 낮으면 '배경 후보'
CORE_ERODE = 7       # 속살 = 안쪽 이만큼 들어간 곳


def cut(sheet, outdir, prefix, is_frame=False, min_px=8000, diecut=0, join=5, drop=0.12, grid=None, punch=0.0):
    rgb = np.array(Image.open(sheet).convert('RGB')).astype(float)
    mn = rgb.min(axis=2)
    art = mn < WHITE

    # ① 덩어리로 나눈다 (격자 금지)
    # ⚠️ `join` = **떨어진 조각을 한 덩어리로 묶는 거리.** 기본 5px.
    #   2026-07-31 여름 쪼리가 **두 짝인데 한 짝만** 잘렸다 — 두 짝 사이가 5px보다 벌어져
    #   별개 덩어리로 잡혔기 때문. `--join 25` 처럼 키우면 한 컷으로 붙는다.
    #   ⛔ 너무 키우면 **옆 그림까지 딸려 온다.** 안 붙을 때만 조금씩 올릴 것.
    filled = ndimage.binary_fill_holes(ndimage.binary_closing(art, np.ones((join, join))))
    lab, n = ndimage.label(filled)
    sizes = ndimage.sum(filled, lab, range(1, n + 1))
    keep = [i for i in range(1, n + 1) if sizes[i - 1] >= min_px]
    cents = ndimage.center_of_mass(filled, lab, keep)

    # ⭐⭐ **`--grid RxC` = 씬 컷(캐릭터 + 떨어진 소품)을 위한 모드.** (2026-07-31)
    #   여름 곰 시트는 한 칸 안에 **곰 + 떨어진 그릴·선풍기·빙수·음료**가 흩어져 있다.
    #   덩어리로만 자르면 **소품이 각각 딴 컷**이 되고, `--join` 을 키우면
    #   **칸 안 조각 간격보다 칸 사이 간격이 좁아** 옆 칸까지 붙어버린다(실측: 60에서 이미 3컷).
    #   → **격자는 「나누는 데만」 쓴다.** 덩어리를 다 찾은 뒤 **무게중심이 어느 칸인지**로 배정하고,
    #     같은 칸의 덩어리를 **한 컷으로 묶는다.** 크롭은 그 덩어리들의 전역 bbox.
    #   ⛔ **칼이 그림 위를 지나가지 않는다** — 그래서 «격자 금지» 원칙과 어긋나지 않는다.
    #     (금지한 건 «격자선으로 픽셀을 자르는 것»이지 «칸으로 묶는 것»이 아니다.)
    groups = []
    if grid:
        gr, gc = grid
        ch, cw = rgb.shape[0] / gr, rgb.shape[1] / gc
        cell_of = {}
        for b, (cy, cx) in zip(keep, cents):
            r, c = min(int(cy // ch), gr - 1), min(int(cx // cw), gc - 1)
            cell_of.setdefault((r, c), []).append(b)
        for (r, c) in sorted(cell_of):
            groups.append(cell_of[(r, c)])
        print(f'   ▦ 격자 {gr}×{gc} → {len(groups)}칸에 덩어리 {len(keep)}개 배정')
    else:
        # 사람이 보는 순서(위→아래, 왼→오른)로 번호를 매긴다
        rowh = rgb.shape[0] / 4
        order = sorted(zip(keep, cents), key=lambda t: (round(t[1][0] / rowh), t[1][1]))
        groups = [[b] for b, _ in order]

    os.makedirs(outdir, exist_ok=True)
    made = []
    for idx, blobs in enumerate(groups, 1):
        m = np.isin(lab, blobs)
        ys, xs = np.where(m)
        # ⚠️ **테두리를 두를 거면 여백을 그만큼 더 준다.** 2026-07-31 게이트가 잡아냈다 —
        #   `PAD 12` 에 띠부씰 8px 을 두르니 여백이 3px밖에 안 남아 `pf_sm07` 이 **가장자리에 닿았다**
        #   (`check-cutouts.mjs` 가 배포를 막았다. 게이트가 제 일을 했다.)
        long0 = max(ys.max() - ys.min(), xs.max() - xs.min()) + 1 + 2 * PAD
        d0 = round(long0 * 0.007) if diecut == 'auto' else (int(diecut) if diecut else 0)
        pad = PAD + max(0, d0) + 4
        y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, m.shape[0])
        x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, m.shape[1])
        reg = m[y0:y1, x0:x1]
        sub = rgb[y0:y1, x0:x1]
        h, w = reg.shape

        # ⭐⭐ **곁다리 조각(하트·반짝)은 뗀다.** (창업자 2026-07-31
        #   *"옆에 하트나 그런거 달린거는 떼고 쓰자. 흰색이 연결되어 보이니까 이상해."*)
        #   ⚠️ 왜 생기나 = `--join` 으로 떨어진 조각을 붙이면 **쪼리 두 짝**처럼 붙어야 할 것도 붙지만
        #      **갈매기 옆 하트·선글라스 옆 반짝**까지 한 덩어리가 된다. 그러면 띠부씰 흰 테가
        #      본체와 하트를 **이어버려서** 물갈퀴처럼 보인다.
        #   → 본체 대비 `drop`(기본 12%)보다 작고 **떨어져 있는** 조각은 지운다.
        #     쪼리 두 짝은 크기가 비슷해(50%대) 살아남고, 하트·반짝(2~5%)만 떨어진다.
        #   ⛔ 붙어 있는 건 안 건드린다 — 눈·부리·리본은 본체와 한 덩어리다.
        if drop > 0:
            # ⚠️⚠️ **시트 배경은 순백이 아니다.** 2026-07-31 실측 — 여름 소품 시트의 배경 중
            #   **1.7%가 240~245**였다. `WHITE(246)` 문턱으로는 그 얼룩이 「그림」으로 잡혀
            #   **히비스커스 뒤에 흰 네모 판**이 깔렸다(진한 판에서 확 드러났다).
            #   → 조각을 셀 때만 **문턱을 10 더 엄하게**(236) 준다. 얼룩은 빠지고 그림은 남는다.
            #     실루엣 가장자리가 조금 안으로 들어와도 **띠부씰 흰 테두리가 그 자리를 덮는다.**
            piece = reg & (sub.min(axis=2) < WHITE - 10)
            plab, pn = ndimage.label(ndimage.binary_closing(piece, np.ones((3, 3))))
            if pn > 1:
                psz = ndimage.sum(piece, plab, range(1, pn + 1))
                big = psz.max()
                kill = np.zeros_like(reg)
                for pi in range(1, pn + 1):
                    if psz[pi - 1] < big * drop:
                        kill |= (plab == pi)
                if kill.any():
                    # ⚠️⚠️ **조각만 지우면 「이어주던 다리」가 남아 흰 얼룩이 된다.** 2026-07-31 실제로 그랬다 —
                    #   `--join 25` 가 하트와 본체 사이를 메워 다리를 만들어 뒀는데, 하트만 빼니
                    #   그 **다리(원본이 흰 배경인 자리)** 가 실루엣에 남아 흰 네모로 보였다.
                    #   → 조각을 빼는 게 아니라 **살아남은 조각만으로 실루엣을 다시 짠다.**
                    #     이때 closing 은 작게(5px) — 다시 다리를 만들면 안 되니까.
                    #     쪼리 두 짝처럼 살아남은 것끼리는 **각자 테두리를 두르면 되고, 그게 자연스럽다.**
                    keep_pieces = piece & ~kill
                    reg = ndimage.binary_fill_holes(ndimage.binary_closing(keep_pieces, np.ones((5, 5))))
                    if reg.sum() < 50:
                        continue

        # ② 알파 = 흰 배경에 섞인 만큼 되돌리기 · ③ 색 = 속살 색
        core = ndimage.binary_erosion(reg & (sub.min(axis=2) < WHITE - 12), np.ones((CORE_ERODE, CORE_ERODE)))
        if core.sum() < 20:
            core = reg & (sub.min(axis=2) < WHITE - 12)
        if core.sum() < 5:
            continue
        _, ci = ndimage.distance_transform_edt(~core, return_indices=True)
        base = sub[ci[0], ci[1]]                       # 각 픽셀의 '원래색'
        gap = 255.0 - base
        ch = np.argmax(gap, axis=2)
        ii, jj = np.indices(ch.shape)
        mix = np.clip((255.0 - sub[ii, jj, ch]) / np.maximum(gap[ii, jj, ch], 1), 0, 1)

        # ⚠️⚠️ **흰색 되돌리기는 바깥 실루엣에서만 한다.**
        #   처음엔 그림 전체에 적용했다가 **돛·갈매기·밀짚모자의 흰 부분이 통째로 비쳤다.**
        #   당연하다 — 이 식은 "흰색에 가까우면 배경"으로 보는데, **흰 그림도 흰색**이다.
        #   → 안쪽은 그냥 불투명(255). 바깥 테두리 띠에서만 흰색에 섞인 만큼을 되돌린다.
        band = reg & ~ndimage.binary_erosion(reg, np.ones((7, 7)))
        alpha = np.where(reg, 1.0, 0.0)
        alpha[band] = np.minimum(alpha[band], mix[band])
        alpha[~reg] = 0                                # 이 덩어리 밖(옆 그림)은 무조건 잘라낸다

        # ④ 프레임이면 가운데에서 흰색만 번지게 해 창을 뚫는다
        win_mask = None
        if is_frame:
            # ⚠️⚠️ **문턱을 244로 두면 얇은 선을 관통한다.** 2026-07-31 창업자 발견 —
            #   진주 조개·불가사리 아치의 **안쪽 창 윤곽선만 점선처럼 끊겨** 있었다.
            #   (바깥 윤곽선은 멀쩡했다 = 같은 그림에서 선이 어디는 이어지고 어디는 끊기면 **잘린 것**이다.)
            #   원인 = 얇은 선의 안티에일리어싱된 옅은 픽셀이 244를 넘어 **배경으로 판정** → 그 틈으로 물이 새서
            #   선을 안쪽에서부터 갉아먹었다. 나는 이걸 "점선 디자인"으로 잘못 읽었다.
            #   → ⒜문턱을 **252**로 올려 옅은 선도 벽이 되게 하고 ⒝**4-연결**로 번지게 해 대각선 틈도 막는다.
            STRICT, LOOSE, CROSS = 252, 236, np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]], bool)
            white = sub.min(axis=2) >= STRICT
            seed = np.zeros_like(white)
            seed[h // 2, w // 2] = True
            if white[h // 2, w // 2]:
                win = ndimage.binary_propagation(seed, mask=white & reg, structure=CROSS)
                # 문턱을 올린 대가 = 창 가장자리에 흰 띠가 조금 남는다.
                # **번지지 말고 2px만 부풀린다** — 부풀리기는 거리가 정해져 있어 틈으로 도망 못 간다.
                # ⭐⭐ **창 안에 「알맹이」가 있으면 그건 창이 아니다.** (2026-07-31 조개 진주)
                #   `pf_sm12` 조개 프레임은 창 한가운데에 **흰 진주**가 앉아 있다.
                #   부풀리기(2px)가 진주 가장자리를 덮고, 진주 자체가 거의 순백이라
                #   **진주가 통째로 사라졌다.**
                #   → 번진 창(`win`)의 **구멍을 메워** 보면 그 차이가 곧 «창 안의 알맹이»다.
                #     그걸 창에서 빼면 진주는 살고 창은 그대로 뚫린다.
                #   ⛔ 「진한 선 안쪽을 전부 뺀다」로 하면 안 된다 — 프레임 테두리도 닫힌 선이라
                #     **창 전체가 알맹이로 잡혀 아예 안 뚫린다**(실제로 그랬다).
                island = ndimage.binary_fill_holes(win) & ~win
                win = ndimage.binary_dilation(win, np.ones((3, 3)), iterations=2) & (sub.min(axis=2) >= LOOSE) & reg
                win &= ~island
                frac = win.sum() / (h * w)
                # 안전장치 — 너무 작거나 크거나 테두리에 닿으면 안 뚫는다(선 틈으로 샌 것)
                if 0.06 < frac < 0.92 and not (win[0].any() or win[-1].any() or win[:, 0].any() or win[:, -1].any()):
                    win_mask = win
                    alpha[win] = 0
                    # 창 경계도 계단 안 지게 — 창 바로 바깥 1px은 반투명으로
                    edge = ndimage.binary_dilation(win, np.ones((3, 3))) & ~win & reg
                    alpha[edge] = np.minimum(alpha[edge], 0.55)

        # ④-2 🕳 **--punch : 그림 안에 갇힌 흰 구멍을 전부 뚫는다.** (2026-07-31 가을 세트에서 발견)
        #   ⚠️ 왜 필요한가 = 덩어리를 만들 때 `binary_fill_holes` 가 **둘러싸인 배경까지 그림으로** 만든다.
        #      바구니 «손잡이 안쪽»·나뭇가지 «사이»가 그렇다. 좁은 구멍은 바깥 띠 규칙(7px)이 알아서
        #      투명하게 만들지만, **띠보다 넓은 구멍은 가운데가 흰 판으로 남는다.**
        #      밝은 배경에선 안 보이다가 **어두운 꾸미기 배경에서 흰 판이 그대로 드러난다.**
        #   ⛔ `--frame` 은 **가운데 한 곳**만 뚫는다(프레임 창). 손잡이 구멍은 가운데가 아니라 못 잡는다.
        #   ⚠️ 문턱을 **252**로 아주 엄하게 준다 — 그림의 흰 부분(레이스·보자기·크림)은 음영이 있어
        #      252를 못 넘는다. 순백에 가까운 «종이»만 뚫린다.
        #   ⚠️ 크롭 테두리에 닿는 흰색은 «갇힌 게 아니라 바깥»이라 건드리지 않는다(이미 잘려 있다).
        if punch:
            STRICT2, LOOSE2, CROSS2 = 252, 236, np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]], bool)
            inner = (sub.min(axis=2) >= STRICT2) & reg
            hlab, hn = ndimage.label(inner, structure=CROSS2)
            hole = np.zeros_like(reg)
            for hi in range(1, hn + 1):
                comp = hlab == hi
                if comp.sum() < punch * h * w:
                    continue
                if comp[0].any() or comp[-1].any() or comp[:, 0].any() or comp[:, -1].any():
                    continue
                hole |= comp
            if hole.any():
                hole = ndimage.binary_dilation(hole, np.ones((3, 3)), iterations=2) & (sub.min(axis=2) >= LOOSE2) & reg
                win_mask = hole if win_mask is None else (win_mask | hole)
                alpha[hole] = 0
                edge = ndimage.binary_dilation(hole, np.ones((3, 3))) & ~hole & reg
                alpha[edge] = np.minimum(alpha[edge], 0.55)

        # ⚠️ **색도 테두리 띠에서만 바꾼다.** 처음엔 전부 '속살 색'으로 덮었다가
        #   **돛·레몬 속살·갈매기 배가 딴 색으로 칠해졌다.** 안쪽은 원래 색 그대로 둔다.
        out_rgb = sub.copy()
        out_rgb[band] = base[band]                     # 띠에 남은 흰 기운만 속살 색으로

        # ⑤ 🏷 띠부씰 마감 (--diecut N) — 창업자 제안 2026-07-31
        #   *"아예 띠부씰처럼 흰색을 조금 남기고 자를래?(바깥쪽만) 안쪽은 투명으로 잘라내고"*
        #   ⭐ 왜 이게 통째로 해결책인가 = 바깥 가장자리의 **흰 잔재가 「잔재」가 아니라 「테두리」가 된다.**
        #      진한 판에서 흰 점점이가 보이던 건 흰 배경이 덜 지워진 것인데, 어차피 흰 테두리를 두를 거면
        #      그건 지울 대상이 아니라 **테두리의 일부**다. 지우려고 애쓸수록 그림을 파먹었다.
        #   ⛔ **바깥쪽만.** 창(win) 안쪽으로는 절대 안 두른다 — 프레임 창은 투명해야 사진이 비친다.
        if diecut:
            # ⭐⭐ **두께는 「그림 크기에 비례」해야 한다.** (2026-07-31 여름 소품에서 발견)
            #   프레임은 긴변 600px인데 소품은 250px이다. **같은 8px을 두르면 소품에선 두 배로 두껍게 보이고,
            #   히비스커스 꽃잎과 잎사귀 사이 오목한 틈이 흰색으로 메워졌다.**
            #   → `--diecut auto` = **긴변의 0.7%** (600px→4px · 250px→2px).
            #   ⚠️⚠️ **얇아야 한다.** 창업자 2026-07-31:
            #      *"두껍게 하면 모든스티커가 다 띠부씰같자나..."* — **맞다.**
            #      이 흰 테는 **「스타일」이 아니라 「보호막」**이다. 흰 배경에서 자를 때 외곽선이
            #      파먹히는 걸 막는 게 목적이지, 띠부씰처럼 **보이려는** 게 아니다.
            #      두꺼우면 그림마다 흰 테가 눈에 띄어 **전부 같은 스티커처럼 보인다.**
            #      📌 진짜 띠부씰 느낌이 필요한 팩은 그때 값을 크게 준다(`--diecut 10`).
            #   ⚠️⚠️ **그런데 0.7%는 너무 얇았다.** (창업자 2026-07-31 재검수
            #      *"테두리가 넘 얇아서 지저분해보이는 것들도 있어"*)
            #      실측하니 재료·글자는 **1.0~1.4px**밖에 안 됐다. 앱 표시 크기로 줄이면 **1px 미만** —
            #      덮으라고 만든 흰 테가 **잔재를 못 덮고 회색 실밥처럼** 보였다.
            #      → **1.2%로 올리고 바닥을 3px**로 뒀다. 창업자가 예쁘다고 한 여름 프레임이
            #        실측 **1.14%**(609px에 6.7px)였다 — **그 숫자에 맞춘 것**이다.
            d = round(max(reg.shape) * 0.012) if diecut == 'auto' else int(diecut)
            d = max(3, min(d, pad - 3))                        # 크롭 여백 밖으로는 못 두른다
            # ⭐⭐⭐ **칼선은 「그림」에서 재야 한다 — 「그림자」에서 재면 너덜너덜해진다.**
            #   (창업자 2026-07-31 재검수 *"매끈하게 안된애들도 있고"*)
            #   ⚠️ 시트에는 그림 둘레에 **연한 회색 그림자**가 칠해져 있다. 배경 문턱(246)은
            #      그 그림자까지 「그림」으로 잡는다. 그림자는 **번지듯 불규칙**해서
            #      그걸 기준으로 칼선을 뽑으면 **셰프모자·앞치마·새우처럼 솜뭉치 테두리**가 된다.
            #   → 칼선은 **`solid`(진짜 그림)** 에서 잰다:
            #      ⒜**진한 선(<200)으로 둘러싸인 안쪽 전부** — 셰프모자처럼 «흰 그림»도 이걸로 살아난다
            #      ⒝＋**확실히 그림인 픽셀(<236)** — 외곽선이 없는 수채·파스텔용
            #      그림자(240~245)는 둘 다에 안 걸려 **빠진다.**
            ink = ndimage.binary_fill_holes(ndimage.binary_closing(sub.min(axis=2) < 200, np.ones((7, 7))))
            solid = (ink | (sub.min(axis=2) < WHITE - 10)) & reg
            solid = ndimage.binary_fill_holes(ndimage.binary_closing(solid, np.ones((5, 5))))
            if solid.sum() < 50:
                solid = reg                                    # 못 찾으면 원래대로(안전)
            if win_mask is not None:
                solid &= ~win_mask
            # ⭐⭐ **칼선은 「부풀리기」가 아니라 「거리밭」으로 만든다.** (창업자 2026-07-31
            #   *"띠부실모드 테두리 부드럽게 잘 커팅해야해"*)
            #   부풀리기(dilation)는 그림의 자잘한 요철을 **그대로 따라가서 너덜너덜**해진다.
            #   진짜 띠부씰은 칼이 한 번에 지나가 **매끈한 곡선**이다.
            #   → ⒜그림에서 얼마나 떨어졌는지(거리)를 재고 ⒝그 거리밭을 **흐린다**(요철이 뭉개짐)
            #     ⒞`거리 ≤ d` 인 곳이 테두리. 흐린 거리밭의 등고선이라 **저절로 매끈하고 둥글다.**
            #   ⒟경계에서 1.4px에 걸쳐 알파를 0으로 떨구니 **계단도 없다**(따로 처리 불필요).
            #   ⚠️⚠️ **부드러움은 「두께」가 아니라 「그림 크기」를 따라간다.** (창업자 2026-07-31
            #      *"대신 부드럽게 잘 잘라줘야해"*)
            #      처음엔 흐림 정도를 두께 d 에 비례시켰는데, **얇게 하라니까 흐림까지 같이 약해져
            #      실루엣이 너덜너덜**해졌다. 뭉개야 할 요철의 크기는 **그림 해상도**가 정하지
            #      테두리 두께와는 상관이 없다. → 둘을 갈랐다.
            dist = ndimage.distance_transform_edt(~solid)
            dist = ndimage.gaussian_filter(dist, sigma=max(1.8, max(reg.shape) * 0.007))
            cut_a = np.clip((d + 0.6 - dist) / 1.4, 0.0, 1.0)  # 칼선 안쪽=1 · 바깥=0 · 경계는 부드럽게
            out_rgb[band] = sub[band]                          # 색도 원래대로 — 속살색으로 덮으면 테두리와 경계가 진다
            # ⭐ **실루엣을 통째로 다시 짠다** — 그림자가 만든 너덜한 가장자리를 매끈한 칼선으로 갈아끼운다.
            #   (그림 안쪽은 그대로 불투명, 바깥은 칼선까지만 흰색)
            alpha = np.where(solid, 1.0, cut_a)
            out_rgb[~solid & (cut_a > 0)] = 255.0
            if win_mask is not None:
                # ⭐⭐ **창 안쪽에도 칼선을 두른다.** (창업자 2026-07-31
                #   *"여름프레임은 내부투명도 띠부씰모드로 라인따야할듯해"*)
                #   전엔 «바깥쪽만» 둘렀다. 그러니 프레임 바깥은 흰 띠부씰 선인데
                #   **창 가장자리만 맨살**이라 한 장에 두 가지 마감이 섞여 어색했다.
                #   → 창 «안쪽»으로 d 만큼 흰 선을 넣는다. 가운데는 그대로 투명해서 사진이 비친다.
                inner = ndimage.distance_transform_edt(win_mask)
                inner = ndimage.gaussian_filter(inner, sigma=max(1.8, max(reg.shape) * 0.007))
                ring = np.clip((d + 0.6 - inner) / 1.4, 0.0, 1.0)
                alpha[win_mask] = ring[win_mask]
                out_rgb[win_mask & (ring > 0)] = 255.0
        out = np.dstack([out_rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])

        # ⚠️ **가장자리에 닿으면 투명 여백을 덧댄다.** 2026-07-31 게이트가 잡아낸 것 —
        #   그림이 시트 왼쪽 끝 가까이 있으면 **테두리를 두를 자리가 시트 밖**이라 크롭이 0에서 잘린다.
        #   원본 그림 자체는 안 잘렸으니(시트 0열엔 그림이 없다) **캔버스만 넓히면 된다.**
        #   ⛔ 그림을 건드리지 않는다 — 진짜 잘린 컷을 이걸로 덮어 감추면 게이트가 무의미해진다.
        need = 0
        for side in (out[0, :, 3], out[-1, :, 3], out[:, 0, 3], out[:, -1, 3]):
            if side.max() > 25:
                need = PAD
        if need:
            out = np.pad(out, ((need, need), (need, need), (0, 0)), constant_values=0)
            print(f'   ↳ 가장자리에 닿아 투명 여백 {need}px 덧댐')

        name = f'{prefix}{idx:02d}.png'
        Image.fromarray(out).save(os.path.join(outdir, name))
        made.append((name, out.shape[1], out.shape[0]))

    print(f'{os.path.basename(sheet)} → {len(made)}컷')
    for nm, w, h in made:
        print(f'   {nm}  {w}x{h}')
    return made


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) < 3:
        print(__doc__)
        sys.exit(1)
    mn_i = sys.argv.index('--min') + 1 if '--min' in sys.argv else None
    dc_i = sys.argv.index('--diecut') + 1 if '--diecut' in sys.argv else None
    jn_i = sys.argv.index('--join') + 1 if '--join' in sys.argv else None
    dr_i = sys.argv.index('--drop') + 1 if '--drop' in sys.argv else None
    gd_i = sys.argv.index('--grid') + 1 if '--grid' in sys.argv else None
    pu_i = sys.argv.index('--punch') + 1 if '--punch' in sys.argv else None
    cut(args[0], args[1], args[2],
        is_frame='--frame' in sys.argv,
        min_px=int(sys.argv[mn_i]) if mn_i else 8000,
        diecut=(sys.argv[dc_i] if sys.argv[dc_i] == 'auto' else int(sys.argv[dc_i])) if dc_i else 0,
        join=int(sys.argv[jn_i]) if jn_i else 5,
        drop=float(sys.argv[dr_i]) if dr_i else 0.12,
        grid=tuple(int(x) for x in sys.argv[gd_i].lower().split('x')) if gd_i else None,
        punch=float(sys.argv[pu_i]) if pu_i else 0.0)

    # 🔍 자른 뒤 **자동으로 3단계 검수**를 부른다 (창업자 2026-07-31 *"2번 검수하는거 코드에 박아둬"*).
    # ⚠️ 왜 자동인가 = 검수는 **잊으면 안 하는 일**이다. 2026-07-30에 프레임 6컷만 고치고
    #    끝낸 줄 알았다가 창업자가 앱 전체에서 같은 문제를 다시 잡아냈다.
    #    **자르기와 검수를 한 명령으로 묶으면 「깜빡」이 구조적으로 불가능해진다.**
    # ⛔ 끄고 싶으면 `--no-check` — 다만 앱에 넣기 전엔 반드시 한 번은 돌릴 것.
    if '--no-check' not in sys.argv:
        import subprocess
        here = os.path.dirname(os.path.abspath(__file__))
        subprocess.run([sys.executable, os.path.join(here, 'cut-check.py'), args[1]], check=False)
