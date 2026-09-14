#!/usr/bin/env python3
# ✂️🪒 자른 컷의 «흰 테 바깥선»만 매끈하게 다듬는다 (2026-08-26)
#
# 📮 창업자 = *"가위로 자른 것 같지않고 표면이 찢은것 같아보이는거는 고칠수 없는거야?"*
#            · *"바닥면쪽이 대부분 손으로 찢은거같아"*
#
# ⛔⛔ 뿌리 = **흰 테는 «네모 도장으로 부풀려» 만든다.** 부풀리기(dilation)는
#    울퉁불퉁한 실루엣을 그대로 키워서 **각진 다각형 테두리**가 된다.
#    ⭐ 접시 «바닥»이 제일 심한 이유 = 거기서 접시가 그림자로 «흐려지며» 끝나서
#       실루엣 판정이 한 픽셀씩 흔들리고, 그 흔들림을 흰 테가 그대로 키워 보여 준다.
#    🔢 실측(gr_003 빨간떡볶이) = 알파가 1.0 → 0.83 → 0.15 → 0 로 **2px 만에** 끊긴다.
#       즉 «부드럽지 않아서»가 아니라 **«선이 구불거려서»** 찢어 보인다.
#
# ⭐⭐ 그래서 «알파만» 다듬는다 — 색은 한 픽셀도 안 건드린다.
#    ⑴ 알파를 흐린다(가우시안) → 구불거림이 뭉개진다
#    ⑵ 0.5 를 기준으로 다시 세운다 → 테 «두께»는 그대로, 선만 매끈
#    📌 이게 SDF(거리장) 다듬기와 같은 일이고, 글꼴·아이콘에서 쓰는 표준 방법이다.
#
# ⛔ `tools/cut.py` 는 손대지 않는다(창업자 절대원칙 2026-08-18) — 자른 «뒤»에 얹는다.
# ⛔ **색(RGB)을 흐리지 않는다** — 흰 기운이 번져 흰 테가 넓어진다
#    (`docs/스티커-자르기-표준-2026-07-30.md` 에 적힌 함정 그대로).
#
# ⚠️ 지킬 것 셋 — 어기면 저장하지 않고 죽는다
#    ① 넓이가 ±2% 안 (테가 굵어지거나 그림이 깎이면 안 된다)
#    ② 본체에서 떨어진 조각 0개 (절대원칙)
#    ③ 진갈색 외곽선(<200) 을 한 픽셀도 안 잃는다 (절대원칙 ⓪)
#
# 씀:  python3 tools/컷-가장자리-다듬기.py <폴더|파일> [흐림=1.6] [--dry]
import os, sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

대상 = sys.argv[1]
흐림 = float(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 1.6
목표폭 = 1.6   # 다듬은 뒤 가장자리가 0→1 로 넘어가는 폭(px). 원본이 딱 이만큼이라 그대로 맞춘다
말로만 = '--dry' in sys.argv

파일들 = sorted(glob.glob(os.path.join(대상, '*.png'))) if os.path.isdir(대상) else [대상]
고침 = 죽음 = 0
for f in 파일들:
    im = Image.open(f).convert('RGBA')
    arr = np.asarray(im).astype(np.int16).copy()
    a = arr[:, :, 3].astype(float) / 255.0

    # ── ⑴ 흐리고 ⑵ 0.5 에서 다시 세운다.
    #    ⭐ 되세우는 기울기를 «흐린 만큼» 잡아야 테 두께가 안 변한다 —
    #       가우시안은 0.5 자리를 안 옮기고 «기울기만» 눕히므로, 그 기울기를 되돌리면 된다.
    b = ndimage.gaussian_filter(a, 흐림)
    # ⛔⛔ 되세우는 값을 «짐작하면» 흐릿한 후광이 남는다(첫 판이 그랬다).
    #    가우시안은 0.5 자리를 안 옮기고 «기울기만» 눕힌다 — 그 기울기가 1/(σ√2π) 다.
    #    목표 폭(≈1.6px)으로 되세우려면 그만큼 곱해 주면 된다. **계산으로 나오는 값이다.**
    기울기 = 흐림 * 2.5066 / 목표폭
    새 = np.clip((b - 0.5) * 기울기 + 0.5, 0, 1)

    # ── ⛔ 그림 «속»은 안 건드린다 — 가장자리 둘레에서만 바꾼다
    #    (안 그러면 그릇 안 반투명한 곳·유리잔이 같이 흐려진다)
    속 = ndimage.binary_erosion(a > 0.5, np.ones((3, 3)), iterations=int(round(흐림 * 2)) + 2)
    새[속] = np.maximum(새[속], a[속])

    새a = (새 * 255).round().astype(np.int16)

    # ── 지킬 것 ① 넓이
    옛넓 = float((a > 0.5).sum()); 새넓 = float((새 > 0.5).sum())
    if 옛넓 and abs(새넓 - 옛넓) / 옛넓 > 0.02:
        print(f'⛔ {os.path.basename(f)} — 넓이가 {(새넓-옛넓)/옛넓*100:+.1f}% 바뀌었다'); 죽음 += 1; continue

    # ── 지킬 것 ② 떨어진 조각
    on = 새 > 0.15
    lab, n = ndimage.label(on)
    if n > 1:
        sz = ndimage.sum(on, lab, range(1, n + 1))
        if (sz < sz.max() * 0.12).any():
            print(f'⛔ {os.path.basename(f)} — 떨어진 조각이 생겼다'); 죽음 += 1; continue

    # ── 지킬 것 ③ 진갈색 외곽선
    잉크 = (arr[:, :, :3].min(axis=2) < 200) & (a > 0.5)
    남음 = (잉크 & (새 > 0.5)).sum()
    if 잉크.sum() and 남음 / 잉크.sum() < 0.995:
        print(f'⛔ {os.path.basename(f)} — 외곽선을 {100-남음/잉크.sum()*100:.1f}% 파먹었다'); 죽음 += 1; continue

    if not 말로만:
        arr[:, :, 3] = 새a
        Image.fromarray(arr.astype(np.uint8)).save(f)
    고침 += 1

print(f'{"✅" if 죽음 == 0 else "⛔"} 다듬음 {고침}개 · 죽음 {죽음}개' + (' (말로만)' if 말로만 else ''))
sys.exit(1 if 죽음 else 0)
