#!/usr/bin/env python3
# 🔒 홍보물 원본 캡처 «가리기» — 개인정보 ＋ 계정 주인에게만 보이는 줄 (2026-08-28)
#
# 📮 창업자 = *"영상만들때 **내 개인정보랑 친구목록은 다 지워줘야해**"*
# 📮 창업자 = *"1번 **인사이트보기 나와. 지워야하고.**"*
#
# ⭐⭐ 왜 「인사이트 보기」를 지우나 — **그 줄은 계정 «주인»에게만 보인다.**
#    홍보물을 보는 사람은 남의 게시물을 보는 «일반 유저»다. 주인 화면을 보여주면
#    ⑴ 유저가 자기 화면에서 못 찾고 ⑵ 「이건 내 화면이 아니네」로 읽힌다.
#    ⛔ 덮지 않고 «잘라낸다» — 덮으면 빈 자리가 남아 오히려 눈에 띈다(공유 시트 친구 줄과 같은 방식).
#
# 🔢 실측 (2026-08-28 · 1080×2340)
#    · 상단바        = y 0~95   (통신사·시각·알림 배지)  → 아래 깨끗한 띠로 덮는다
#    · 인사이트 줄   = y 563~764 (앞뒤 흰 여백 포함)      → 통째로 잘라낸다(202px)
#    · 앱 목록 블러  = 한끼 아이콘 (412, 478) 반지름 150만 선명
#
# ⛔ `3-공유시트.png` 는 «이미» 카톡 친구 3명 줄을 잘라낸 판이라(세로 2002) 여기서 또 안 자른다.
#
# 실행: cd /home/user/hankki/hankki && python3 scripts/_판-인스타원본가리기-0828.py
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

원본 = Path(__file__).resolve().parent.parent / 'design/promo/가져오기안내-원본캡처-2508'

상단바_끝 = 96
인사이트 = (563, 765)          # 잘라낼 범위 [위, 아래)
한끼자리 = (412, 478, 150)     # 앱 목록에서 선명하게 남길 원 (x, y, 반지름)


def 상단바덮기(im: Image.Image) -> Image.Image:
    """통신사·시각·알림 배지를 바로 아래 깨끗한 띠로 덮는다."""
    a = np.array(im)
    띠 = a[상단바_끝:상단바_끝 + 6].mean(axis=0).astype('uint8')
    for y in range(0, 상단바_끝):
        a[y] = 띠
    return Image.fromarray(a)


def 인사이트잘라내기(im: Image.Image) -> Image.Image:
    """「인사이트 보기 · 게시물 홍보하기」 줄을 통째로 덜어내고 아래를 위로 당긴다."""
    위, 아래 = 인사이트
    새 = Image.new('RGB', (im.width, im.height - (아래 - 위)), (255, 255, 255))
    새.paste(im.crop((0, 0, im.width, 위)), (0, 0))
    새.paste(im.crop((0, 아래, im.width, im.height)), (0, 위))
    return 새


def 앱목록블러(im: Image.Image) -> Image.Image:
    """한끼 아이콘만 선명하게 두고 나머지 앱(＝개인 앱 목록)을 흐린다."""
    cx, cy, r = 한끼자리
    흐림 = im.filter(ImageFilter.GaussianBlur(18))
    마스크 = Image.new('L', im.size, 255)
    ImageDraw.Draw(마스크).ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
    마스크 = 마스크.filter(ImageFilter.GaussianBlur(14))
    return Image.composite(흐림, im, 마스크)


# ⛔⛔ 도구띠 판은 인사이트 줄을 «안» 자른다 — 이유 둘
#   ⑴ 우리가 그 판에서 쓰는 건 «맨 아래 도구 띠»뿐이다(합성 재료). 위쪽은 안 쓴다.
#   ⑵ 자르면 도구 띠의 y 좌표가 202px 밀려서 오려낼 자리가 어긋난다.
#   📌 「가릴 수 있으니 다 가린다」가 아니라 «쓰는 데»를 보고 정한다.
할일 = [
    ('1-인스타-도구띠.png', '1-인스타-도구띠-가림.png', ['상단바']),
    ('2-인스타-깨끗.png', '2-인스타-깨끗-가림.png', ['상단바', '인사이트']),
    ('3-공유시트.png', '3-공유시트-가림.png', ['상단바']),
    ('4-앱목록.png', '4-앱목록-가림.png', ['상단바', '블러']),
]

for 들, 낼, 무엇 in 할일:
    p = 원본 / 들
    if not p.exists():
        sys.exit(f'⛔ 재료가 없다 → {p}')
    im = Image.open(p).convert('RGB')
    잰것 = [im.size]
    if '상단바' in 무엇:
        im = 상단바덮기(im)
    if '인사이트' in 무엇:
        im = 인사이트잘라내기(im)
    if '블러' in 무엇:
        im = 앱목록블러(im)
    im.save(원본 / 낼)
    print(f'✅ {낼}  {잰것[0]} → {im.size}  ({"·".join(무엇)})')

    # 🔒 스스로 검사 — 상단바가 진짜 덮였나(어두운 글자가 한 점도 없어야 한다)
    if '상단바' in 무엇:
        위쪽 = np.asarray(im.convert('L'))[0:상단바_끝 - 10]
        if int(위쪽.min()) < 200:
            sys.exit(f'⛔ {낼} — 상단바에 아직 어두운 글자가 남았다 (최소 {int(위쪽.min())})')

# 🔒 인사이트 줄이 진짜 사라졌나 — 보라색 「게시물 홍보하기」 단추가 0px 이어야 한다
#    ⭐ 「깨끗판」만 본다 — 도구띠 판은 위쪽을 안 쓰므로 대상이 아니다(위 할일 주석 참조).
낼 = '2-인스타-깨끗-가림.png'
rgb = np.asarray(Image.open(원본 / 낼).convert('RGB')).astype(int)
보라 = ((rgb[:, :, 2] > 180) & (rgb[:, :, 0] < 150) & (rgb[:, :, 1] < 150)).sum()
print(f'   {낼} — 보라 단추 {보라}px')
if 보라 > 400:
    sys.exit(f'⛔ {낼} — 「게시물 홍보하기」가 아직 남아 있다')
