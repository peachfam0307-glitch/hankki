#!/usr/bin/env python3
# 🐧📋 **펭펭 정본 20컷 — 창업자 전수검수판 만들기** (2026-09-02)
#
# 📮 창업자 = *"내가 검수할게 하면서 어제뽑은 펭펭정본으로 갈아끼우자"*
#
# ⛔⛔ 규칙 13 = **모든 무료팩은 나가기 전에 창업자가 전수검사해서 승인해야 내보낼 수 있다.**
#    그래서 앱에 넣기 «전»에 이 판을 먼저 낸다.
#
# 🔍 판 하나에 넣는 것 = `docs/스티커-검수-절대원칙.md` 의 다섯 중 **눈으로 봐야만 아는 것들**
#    ① 진한 바탕  — 흰 테가 «몇 겹»인지 · 잔재가 보이나
#    ② 밝은 바탕  — 흰 그림이 배경에 묻히나
#    ③ 빨간 바탕  — 반투명 가장자리(계단)가 보이나
#    ④ 앱 크기    — 서랍에서 실제로 붙는 크기(238px)로 줄여서. ⭐**작으면 다 멀쩡해 보인다**
#       그래서 ①②③은 «원본 픽셀 100%» 로 둔다(줄이면 잔재도 같이 줄어 안 보인다).
#
# ⚠️ 숫자로 잡히는 것(잘림·조각·흰 테 두께·해상도)은 이미 `cut.py` 게이트가 봤다.
#    이 판이 보는 것은 **기계가 못 보는 것** = 「그림이 예쁜가 · 정본 옷이 맞나 · 쓸 만한가」.
#
# 🖨  python3 scripts/_판-펭펭정본-0902.py > /tmp/펭펭-그림.js
import base64, io, json, sys
from pathlib import Path
from PIL import Image

방 = Path(__file__).resolve().parents[1] / 'docs/stickers/펭펭-정본-2026-09-01/낱개'
컷들 = sorted(방.glob('*.png'))
if not 컷들:
    print(f'⛔ 컷이 없다: {방}', file=sys.stderr); sys.exit(1)

바탕 = [('진한', (58, 42, 30)), ('밝은', (250, 247, 240)), ('빨강', (196, 62, 48))]
APP = 238          # 서랍에서 실제로 붙는 크기(검수 절대원칙 ③)
PAD = 14

def strip(im):
    """①②③ 세 바탕에 «원본 100%» 로 얹고, 맨 끝에 앱 크기 한 칸."""
    w, h = im.size
    cw = w + PAD * 2
    app = im.copy()
    app.thumbnail((APP, APP), Image.LANCZOS)
    aw = APP + PAD * 2
    out = Image.new('RGB', (cw * 3 + aw, h + PAD * 2), (243, 237, 226))
    for i, (_, col) in enumerate(바탕):
        tile = Image.new('RGB', (cw, h + PAD * 2), col)
        tile.paste(im, (PAD, PAD), im)
        out.paste(tile, (cw * i, 0))
    # 앱 크기 칸 — 서랍 바탕(크림)에 얹는다
    tile = Image.new('RGB', (aw, h + PAD * 2), (246, 240, 229))
    tile.paste(app, ((aw - app.width) // 2, (h + PAD * 2 - app.height) // 2), app)
    out.paste(tile, (cw * 3, 0))
    return out

메타, 그림 = [], {}
for p in 컷들:
    im = Image.open(p).convert('RGBA')
    s = strip(im)
    buf = io.BytesIO()
    s.save(buf, 'WEBP', quality=84, method=5)
    그림[p.stem] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    메타.append({'key': p.stem, 'w': im.width, 'h': im.height, 'kb': round(p.stat().st_size / 1024)})
    print(f'  {p.stem}: 원본 {im.width}×{im.height} · 판 {s.width}×{s.height} · {len(buf.getvalue())//1024}KB', file=sys.stderr)

print('const CUTS = ' + json.dumps(메타, ensure_ascii=False) + ';')
print('const SHOTS = ' + json.dumps(그림, ensure_ascii=False) + ';')
