#!/usr/bin/env python3
"""🧪 「몸통 아래 돌기」 잣대가 «진짜 돌기»만 잡나 — 안전망 (2026-08-17)

⛔⛔ **왜 만들었나** — 창업자 요리소품 시트 8장(32컷)을 자르는데 **7컷이 「돌기」로 죽었다.**
   눈으로 보니 일곱 다 «그림 자체»였다 — 오븐장갑 손목고리 · 클립에 매달린 하트 ·
   깃발 모양 냅킨 · 긴 토크 · 소금통 · 하트 씰 · 셰프모자.
   ⭐ **라벨 조각이 하나도 없었다.** 잣대가 늑대를 외친 것이다.

🔢 **뿌리 = 「길다」를 «절대값 12줄»로 쟀다.**
   `cut-check.py` 주석은 뜻을 정확히 적어놨다 —
     *"둥근 그릇의 아랫부분은 «짧게» 좁아진다. 글자 조각은 «길게» 이어진다."*
   그런데 코드는 `len(꼬리) >= 12` 였다. **키가 500px 인 컷에서 12줄은 「길게」가 아니다.**
   실측 = 걸린 일곱 컷의 꼬리 = 19~51줄 = **전체 높이의 4~10%** (＝동그란 바닥이 좁아지는 그 구간)

⛔ **「그럼 그냥 문턱을 올리자」로 끝내면 안 된다** — 잣대를 느슨하게 하면
   2026-08-15 의 「소고기솥밥 «솥» 글자 조각」이 도로 새어 나간다.
   그래서 **옛 사고를 만들어 놓고** 「그건 여전히 잡히나 ＋ 멀쩡한 건 통과하나」를 둘 다 잰다.

쓰기:  python3 scripts/_repro-돌기잣대-0817.py
       (성공 = exit 0 · 하나라도 어긋나면 exit 1)
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))

정상컷 = os.path.join(ROOT, 'docs/stickers/요리소품-창업자-2026-08-17/낱개')


def 라벨조각붙이기(src, dst, 글자높이=46, 다리폭=7, 사이=26):
    """🩹 2026-08-15 사고를 «만든다» — 컷 아래에 라벨 글자 조각을 흰 다리로 이어 붙인다.

    ⭐ 그때 실제로 일어난 모양 그대로다: 글자가 **떨어져 있는데** 흰 다이컷이 둘을 이어
       한 덩어리가 되어 「떨어진 조각 0개」 검사를 통과했다.
    """
    a = np.array(Image.open(src).convert('RGBA'))
    h, w = a.shape[:2]
    아래 = 사이 + 글자높이 + 20
    큰 = np.zeros((h + 아래, w, 4), dtype=np.uint8)
    큰[:h] = a

    sil = a[..., 3] > 40
    행 = sil.sum(axis=1)
    바닥 = int(np.where(행 > 0)[0].max())
    열 = np.where(sil[바닥 - 2])[0]
    cx = int((열.min() + 열.max()) / 2) if len(열) else w // 2

    im = Image.fromarray(큰)
    d = ImageDraw.Draw(im)
    # 흰 다리 — 이게 「떨어진 조각」 검사를 무력화한 그 다이컷이다
    d.rectangle([cx - 다리폭, 바닥 - 4, cx + 다리폭, 바닥 + 사이 + 6], fill=(255, 253, 248, 255))
    # 글자 조각(진갈색 획 두 개 = 「솥」 같은 모양)
    for dx in (-15, 6):
        d.rectangle([cx + dx, 바닥 + 사이, cx + dx + 10, 바닥 + 사이 + 글자높이],
                    fill=(93, 52, 16, 255))
    d.rectangle([cx - 22, 바닥 + 사이 + 8, cx + 22, 바닥 + 사이 + 18], fill=(93, 52, 16, 255))
    im.save(dst)


def main():
    from importlib import import_module
    cc = import_module('cut-check'.replace('-', '_')) if False else None
    # ⚠️ 파일 이름에 하이픈이 있어 import 가 안 된다 → 소스를 읽어 함수만 꺼낸다
    ns = {}
    with open(os.path.join(ROOT, 'tools', 'cut-check.py'), encoding='utf-8') as f:
        src = f.read()
    exec(compile(src.split("def main()")[0], 'cut-check.py', 'exec'), ns)
    원칙검사 = ns['원칙검사']

    컷들 = sorted(f for f in os.listdir(정상컷) if f.endswith('.png')) if os.path.isdir(정상컷) else []
    if not 컷들:
        print(f'❌ 볼 컷이 없다: {정상컷}')
        return 1

    나쁨 = 0
    print(f'🧪 창업자 요리소품 {len(컷들)}컷 — «그림 자체»인데 돌기로 걸리나')
    걸림 = []
    for f in 컷들:
        r = 원칙검사(os.path.join(정상컷, f))
        if r and r[2]:
            걸림.append(f)
    if 걸림:
        나쁨 += 1
        print(f'   ⛔ {len(걸림)}컷이 거짓 경보 — {걸림}')
    else:
        print(f'   ✅ {len(컷들)}컷 전부 통과 (거짓 경보 0)')

    print('🧪 옛 사고 재현 — 라벨 글자 조각을 흰 다리로 이어 붙인다')
    with tempfile.TemporaryDirectory() as tmp:
        잡은수 = 0
        표본 = 컷들[:6]
        for f in 표본:
            dst = os.path.join(tmp, f)
            라벨조각붙이기(os.path.join(정상컷, f), dst)
            r = 원칙검사(dst)
            if r and r[2]:
                잡은수 += 1
        if 잡은수 == len(표본):
            print(f'   ✅ 심은 {len(표본)}컷 전부 잡힌다')
        else:
            나쁨 += 1
            print(f'   ⛔ 심었는데 {len(표본) - 잡은수}컷을 놓쳤다 ({잡은수}/{len(표본)})')

    print('\n' + ('⛔⛔ 잣대가 어긋났다\n' if 나쁨 else '✅✅ 돌기 잣대 정상 — 그림은 통과하고 라벨 조각은 잡는다\n'))
    return 1 if 나쁨 else 0


if __name__ == '__main__':
    sys.exit(main())
