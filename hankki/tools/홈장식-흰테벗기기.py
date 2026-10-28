#!/usr/bin/env python3
"""🧹 홈 장식용 — 「흰 테」를 벗긴다.

📮 창업자 2026-09-09 = *"스티커 흰부분이 너무 많아. 지저분하고"* — 맞는 말이었다.

════════ 왜 필요한가 ════════
흰 테는 **서랍 스티커의 보호막**이다(`docs/자르기-먼저읽기.md` ⓷).
흰 배경에서 자를 때 진갈색 외곽선이 파먹히는 걸 막는 게 목적이지, 예쁘라고 두르는 게 아니다.

그런데 **홈 배경 장식**은 사정이 다르다:
  · 서랍 스티커는 유저가 사진 «위에» 붙이니 흰 테가 「씰」로 읽힌다.
  · 홈 장식은 «배경에 스며야» 하는데 흰 테가 둘리면 오려 붙인 종이처럼 뜬다.

⛔ 게다가 이 시트들은 **그림에 흰 테가 이미 그려져 있었다**(박쥐 1.58% · 거미줄 1.35%).
   거기에 `--diecut auto`(1.2%)를 또 둘러 **두 겹**이 됐다. 그게 창업자가 본 「흰 부분」이다.

════════ 어떻게 벗기나 ════════
⛔ 그냥 「밝은 픽셀 지우기」로 하면 **셰프 모자·흰 한복·구름이 통째로 날아간다.**
   흰 그림과 흰 테는 «색»으로는 구별이 안 된다.

✅ **「진한 선으로 둘러싸였나」로 가른다.**
   ① 잉크 = 진한 선(<200)을 닫고 그 «안쪽»을 메운다 → 셰프 모자·흰 한복은 선 «안»이라 살아남는다
   ② 흰테 = 지금 실루엣 안에 있으면서 ⒜잉크 밖이고 ⒝거의 흰(≥238) 곳 → 이것만 벗긴다
   ③ 가장자리는 거리밭으로 다시 부드럽게 — 벗기고 나서 계단이 지면 안 하느니 못하다

🚫 **외곽선은 여기서도 안 파먹는다.** 어두운 픽셀(<200)은 어떤 경우에도 안 지운다.
   벗긴 뒤 남은 어두운 픽셀 수를 세어 99.5% 아래면 그 컷은 **손대지 않고 원본을 남긴다.**

쓰기:
    python3 tools/홈장식-흰테벗기기.py <낱개폴더> <내보낼폴더>
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

WHITE = 238      # 이보다 밝으면 '흰 테 후보'
INK = 200        # 이보다 어두우면 '외곽선' — 절대 안 지운다


def 벗기기(path, out):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    rgb, al = a[:, :, :3].astype(int), a[:, :, 3].astype(float) / 255
    mn = rgb.min(axis=2)
    sil = al > 0.5
    if sil.sum() < 200:
        im.save(out); return '작아서 건너뜀'

    # ① 잉크 = 진한 선으로 둘러싸인 «안쪽» 전부 (흰 모자·흰 한복이 여기서 살아난다)
    잉크 = ndimage.binary_fill_holes(ndimage.binary_closing(mn < INK, np.ones((7, 7))))
    # ⭐ 선이 없는 연한 그림(구름·억새 이삭)도 살린다 — 「확실히 그림인」 밝기까지는 그림으로 본다
    잉크 |= (mn < WHITE) & sil

    # ② 벗길 곳 = 실루엣 안 · 잉크 밖 · 거의 흰
    흰테 = sil & ~잉크 & (mn >= WHITE)
    if 흰테.sum() < 50:
        im.save(out); return '흰 테 없음'

    남길 = sil & ~흰테
    # 잔챙이 정리 — 벗기고 나면 점처럼 남는 곳이 생긴다
    남길 = ndimage.binary_closing(남길, np.ones((3, 3)))
    남길 = ndimage.binary_fill_holes(남길)

    # ③ 가장자리를 거리밭으로 다시 부드럽게 — 계단이 지면 안 하느니 못하다
    dist = ndimage.distance_transform_edt(~남길)
    dist = ndimage.gaussian_filter(dist, sigma=max(1.0, max(sil.shape) * 0.0025))
    새알파 = np.clip((0.9 - dist) / 1.5, 0.0, 1.0)
    새알파 = np.maximum(새알파 * al.clip(0, 1), np.where(남길, al, 0.0))
    # 🚫 외곽선은 어떤 경우에도 안 판다
    새알파 = np.where(mn < INK, np.maximum(새알파, al), 새알파)

    _원 = int(((mn < 150) & (al > 0.1)).sum())
    _새 = int(((mn < 150) & (새알파 > 0.1)).sum())
    if _원 > 200 and _새 / _원 < 0.995:
        im.save(out)
        return f'⛔ 외곽선 {_새/_원*100:.1f}% — 손대지 않고 원본 그대로 둔다'

    # ⭐⭐ **벗기고 나면 「떨어진 조각」이 새로 생긴다.** (2026-09-09 실측 — 달토끼 3 · 곰펭 2 · 박쥐 1)
    #   ⛔ 반짝이·별은 흰 테가 «다리»가 되어 본체에 붙어 있었다. 테를 벗기니 홀로 떨어진다.
    #   📮 창업자 *"옆에 하트나 그런거 달린거는 떼고 쓰자. 흰색이 연결되어 보이니까 이상해"*
    #   → 본체의 12%보다 작고 «떨어진» 것만 턴다. 지울 땐 3px 부풀려 가장자리까지 없앤다
    #     (0.5 로 자르면 반투명 자국이 남는다 — 자르기 도구가 겪은 것과 같다).
    덩 = 새알파 > 0.05
    lbl, n = ndimage.label(덩)
    if n > 1:
        크기 = ndimage.sum(덩, lbl, range(1, n + 1))
        큰 = 크기.max()
        for i in range(1, n + 1):
            if 크기[i - 1] < 큰 * 0.12:
                새알파[ndimage.binary_dilation(lbl == i, np.ones((3, 3)), iterations=3)] = 0

    a[:, :, 3] = (새알파 * 255).astype(np.uint8)
    Image.fromarray(a).save(out)
    return f'벗김 {int(흰테.sum())}px'


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.endswith('.png'):
            continue
        print(f'   {f:22s} {벗기기(os.path.join(src, f), os.path.join(dst, f))}')
