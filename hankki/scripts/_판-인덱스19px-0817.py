#!/usr/bin/env python3
"""🔖 「인덱스(북마크) 그림」 19px 실측판 — 창업자 판정용 (2026-08-17)

📮 창업자 *"일단 몇개를 넣을지 정해야해. 그리고 내가 준거 파일이야 확인해봐"*
📮 내가 한 약속 = *"32컷을 다 자르고 **19px 로 줄여서 진짜 읽히는 것만** 남긴 다음,
   그 중에서 몇 개 넣을지 정하자. 죽는 걸 후보에 올려놓고 고르면 헛수고니까."*

⭐⭐ **왜 19px 인가 — 내가 정한 숫자가 아니라 코드가 정한 숫자다.**
   `MyRecipesScreen.jsx` 의 인덱스 단추 = `size={gridSize === 'big' ? 19 : 16}`.
   ⛔ 크게 뽑아 놓고 「예쁘다」로 고르면 **앱에선 뭉개진다.** 그래서 «그 크기로» 재고 «그 크기로» 본다.

🖼 판에 넣는 것 =
   ① **진짜 19px·16px**(1배 · 눈속임 없음)  ② 그걸 «픽셀 그대로» 키운 것(8배)
   ③ 원본(작게)  ④ 숫자 — 19px 칸을 얼마나 채우나 · 진갈색 획이 남았나

⛔ 숫자로 «판정»하지 않는다(규칙 18 ⓘ). 숫자는 순서만 정하고 판정은 창업자 눈이 한다.
⛔ 결과 HTML 은 scratchpad 로 — 저장소가 public 이다. **만드는 코드만** 저장소에 둔다(규칙 30).

쓰기: python3 scripts/_판-인덱스19px-0817.py [낼파일.html]
"""
import base64
import io
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
낱개 = os.path.join(ROOT, 'docs/stickers/요리소품-창업자-2026-08-17/낱개')
기본낼곳 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/인덱스19px.html'

# 🎨 카드 배경 = 앱의 `--thumb`(크림) 위에 얹힌다. 판정은 «그 바탕에서» 해야 맞다.
바탕 = (250, 246, 238)


def 담기(im):
    b = io.BytesIO()
    im.save(b, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def 칸에넣기(im, px):
    """19px 정사각 칸에 «맞춰 넣는다»(contain) — 앱이 하는 그대로."""
    c = im.copy()
    c.thumbnail((px, px), Image.LANCZOS)
    out = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    out.paste(c, ((px - c.width) // 2, (px - c.height) // 2))
    return out


def 재기(sm):
    """그 크기에서 «무엇이 남았나»."""
    px = sm.width
    d = sm.load()
    잉크 = 진한 = 0
    최소 = 255.0
    for y in range(px):
        for x in range(px):
            r, g, b, a = d[x, y]
            if a < 40:
                continue
            잉크 += 1
            k = a / 255.0        # 반투명이면 크림과 섞인 «보이는 색»으로 본다
            R = r * k + 바탕[0] * (1 - k)
            G = g * k + 바탕[1] * (1 - k)
            B = b * k + 바탕[2] * (1 - k)
            밝기 = 0.299 * R + 0.587 * G + 0.114 * B
            if 밝기 < 120:
                진한 += 1
            최소 = min(최소, 밝기)
    return 잉크 / (px * px), (진한 / 잉크 if 잉크 else 0.0), 최소


def main():
    낼곳 = sys.argv[1] if len(sys.argv) > 1 else 기본낼곳
    파일들 = sorted(f for f in os.listdir(낱개) if f.endswith('.png'))
    줄 = []
    for f in 파일들:
        im = Image.open(os.path.join(낱개, f)).convert('RGBA')
        s19, s16 = 칸에넣기(im, 19), 칸에넣기(im, 16)
        채움, 진한비, _ = 재기(s19)
        # 8배 — 픽셀이 «보이게» 키운다(부드럽게 키우면 실제보다 좋아 보인다)
        z19 = s19.resize((19 * 8, 19 * 8), Image.NEAREST)
        z16 = s16.resize((16 * 8, 16 * 8), Image.NEAREST)
        작 = im.copy()
        작.thumbnail((120, 120), Image.LANCZOS)
        줄.append(dict(이름=f[:-4], 크기=f'{im.width}×{im.height}', 채움=채움, 진한비=진한비,
                      d19=담기(s19), d16=담기(s16), z19=담기(z19), z16=담기(z16), 원본=담기(작)))

    # 📊 순서 = 「19px 칸을 얼마나 채우나」 — 채울수록 줄여도 덩어리가 남는다.
    #    ⛔ 이건 «순서»일 뿐 «판정»이 아니다.
    줄.sort(key=lambda r: -r['채움'])

    칸 = '\n'.join(f'''
  <article class="cut">
    <header><b>{r["이름"]}</b><span class="rank">{i + 1}위</span></header>
    <div class="zooms">
      <figure><img src="{r["z19"]}" width="152" height="152" alt=""><figcaption>19px ×8</figcaption></figure>
      <figure><img src="{r["z16"]}" width="128" height="128" alt=""><figcaption>16px ×8</figcaption></figure>
      <figure class="orig"><img src="{r["원본"]}" width="76" height="76" alt=""><figcaption>원본</figcaption></figure>
    </div>
    <div class="real"><span>진짜 크기 →</span>
      <img src="{r["d19"]}" width="19" height="19" alt=""><img src="{r["d16"]}" width="16" height="16" alt=""></div>
    <dl>
      <div><dt>19px 칸 채움</dt><dd>{r["채움"] * 100:.0f}%</dd></div>
      <div><dt>진한 획 남음</dt><dd>{r["진한비"] * 100:.0f}%</dd></div>
      <div><dt>원본</dt><dd>{r["크기"]}</dd></div>
    </dl>
  </article>''' for i, r in enumerate(줄))

    html = f'''<!-- 자동 생성 · scripts/_판-인덱스19px-0817.py -->
<title>인덱스 19px 실측</title>
<style>
:root{{--ground:#faf6ee;--card:#fffdf8;--ink:#4a3f33;--dim:#8a7c6c;--line:#e6ddcd;--hi:#c8623f}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{
  --ground:#1d1a17;--card:#262220;--ink:#efe6d8;--dim:#a4998a;--line:#3a342e}}}}
:root[data-theme="dark"]{{--ground:#1d1a17;--card:#262220;--ink:#efe6d8;--dim:#a4998a;--line:#3a342e}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--ground);color:var(--ink);
  font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
  line-height:1.65;-webkit-text-size-adjust:100%}}
.wrap{{max-width:1180px;margin:0 auto;padding:28px 18px 80px}}
h1{{font-size:1.5rem;margin:0 0 6px;letter-spacing:-.02em;text-wrap:balance}}
.sub{{color:var(--dim);font-size:.92rem;margin:0 0 22px}}
.note{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:0 0 26px}}
.note p{{margin:.35em 0;font-size:.93rem}}
.note b{{color:var(--hi)}}
.grid{{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}}
.cut{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 14px 10px}}
.cut header{{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}}
.cut header b{{font-size:1rem;letter-spacing:.02em}}
.rank{{font-size:.78rem;color:var(--dim);font-variant-numeric:tabular-nums}}
.zooms{{display:flex;align-items:flex-end;gap:10px}}
.zooms figure{{margin:0;text-align:center}}
.zooms img{{display:block;image-rendering:pixelated;background:#faf6ee;border-radius:6px}}
.zooms .orig img{{image-rendering:auto;background:transparent}}
figcaption{{font-size:.7rem;color:var(--dim);margin-top:4px}}
.real{{display:flex;align-items:center;gap:6px;margin:10px 0 8px;padding:7px 10px;
  background:#faf6ee;border-radius:10px;font-size:.72rem;color:#8a7c6c}}
.real img{{display:block}}
dl{{display:flex;gap:14px;margin:0;padding-top:8px;border-top:1px dashed var(--line);flex-wrap:wrap}}
dl div{{display:flex;gap:5px;align-items:baseline}}
dt{{font-size:.72rem;color:var(--dim)}}
dd{{margin:0;font-size:.82rem;font-weight:700;font-variant-numeric:tabular-nums}}
</style>
<div class="wrap">
  <h1>인덱스 그림 19px 실측</h1>
  <p class="sub">창업자 요리소품 시트 8장 → 낱개 {len(줄)}컷 · 2026-08-17</p>
  <div class="note">
    <p><b>왜 19px 인가</b> — 목록 카드의 인덱스 단추가 앱에서 실제로 그려지는 크기다(큰 격자 19px · 작은 격자 16px). 코드가 정한 숫자지 내가 고른 숫자가 아니다.</p>
    <p><b>×8 판은 「부드럽게」 키우지 않았다</b> — 픽셀 그대로 키웠다. 부드럽게 키우면 실제보다 좋아 보여서 판정이 틀어진다.</p>
    <p><b>순서는 「19px 칸을 얼마나 채우나」</b>로 매겼다. 채울수록 줄여도 덩어리가 남는다. ⛔ 순서일 뿐 판정이 아니다 — 판정은 눈이 한다.</p>
  </div>
  <div class="grid">{칸}</div>
</div>'''

    os.makedirs(os.path.dirname(낼곳), exist_ok=True)
    with open(낼곳, 'w', encoding='utf-8') as fp:
        fp.write(html)
    print(f'✅ {len(줄)}컷 → {낼곳}')
    print('\n순위  컷      19px채움  진한획  원본')
    for i, r in enumerate(줄):
        print(f'{i + 1:>3}  {r["이름"]}  {r["채움"] * 100:>6.0f}%  {r["진한비"] * 100:>5.0f}%  {r["크기"]}')


if __name__ == '__main__':
    main()
