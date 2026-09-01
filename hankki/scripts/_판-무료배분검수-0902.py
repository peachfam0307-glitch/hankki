#!/usr/bin/env python3
# 📋 무료 배분 검수판 — 캡처를 «줄여서» base64 로 굽는다 (2026-09-02)
#
# ⛔ 아티팩트는 바깥 그림을 못 불러온다(CSP) → 반드시 data URI 로 심어야 한다.
# ⭐ 원본은 411×891 을 2배(822×1782)로 찍은 것이라 그대로 심으면 판이 무거워진다.
#    폭 420 으로 줄인다 — 폰에서 보는 크기라 그대로 읽힌다.
# 🖨  python3 scripts/_판-무료배분검수-0902.py > /tmp/판-그림.js
import base64, io, json, sys
from pathlib import Path
from PIL import Image

방 = Path('/tmp/무료배분검수')
컷 = {
    'pop_before': ('2026-09-01-전', '1-팝업.png', None),
    'pop_after':  ('2026-09-01-후', '1-팝업.png', None),
    'sum_before': ('2026-09-01-전', '3-서랍-여름.png', (0, 980, 822, 1782)),   # 서랍 선반만
    'sum_after':  ('2026-09-01-후', '3-서랍-여름.png', (0, 980, 822, 1782)),
    'pop_oct':    ('2026-10-01-후', '1-팝업.png', None),
    'pop_nov':    ('2026-11-01-후', '1-팝업.png', None),
}
out = {}
for 이름, (폴더, 파일, crop) in 컷.items():
    p = 방 / 폴더 / 파일
    if not p.exists():
        print(f'⛔ 없다: {p}', file=sys.stderr); sys.exit(1)
    im = Image.open(p).convert('RGB')
    if crop:
        im = im.crop(crop)
    w = 420
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=82, method=5)
    out[이름] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    print(f'  {이름}: {im.width}×{im.height} · {len(buf.getvalue())//1024}KB', file=sys.stderr)
print('const SHOTS = ' + json.dumps(out, ensure_ascii=False) + ';')
