#!/usr/bin/env python3
# 📐📐 「글 쓰는 스티커」의 글칸을 **가로로 최대한 넓게** 다시 잰다 (창업자 2026-08-31)
#
# 📮 창업자 원문 = *"스티커(글자쓰는 ) 전수검사해줘.
#    **가로로 길게 뺄 수 있을 만큼 글자칸을 빼줘 정사각형으로 하지 말고**"*
#    ＋ 그 앞 제보 = *"메모에 글자칸이 정사각형이라 글씨크기 키우면 줄이 넘어가고"* ·
#      *"모든 작은 메모지가 다 저런 느낌이야 **가로부분이 남는데 글자가 아래로만 내려가.**"*
#
# 🔢 왜 필요한가 (실측) — `BOX_PAD` 63컷의 글칸이 **폭 62.8% · 높이 57.8%** 이고
#    **38컷이 거의 정사각**이다. 종이는 가로가 넉넉한데 글칸이 정사각이라 **가로를 안 쓴다.**
#
# ⭐⭐ 재는 법 = **「글이 놓이는 띠」에서 종이가 이어진 가로 폭**을 본다.
#    ⑴ 알파로 종이 실루엣을 잡는다
#    ⑵ 글은 **세로 가운데**에 놓인다(`alignItems: safe center`) → 가운데 띠만 본다
#    ⑶ 그 띠의 **모든 행에서 종이가 이어진 구간**의 «겹치는 부분»을 구한다
#       → 어느 행에서도 종이 밖으로 안 나가는 **안전한 가로 칸**
#    ⑷ 안전 여유를 빼고 퍼센트로 낸다
#
# ⛔ **무늬·소품은 알파로 안 걸린다**(불투명하니까) — 그래서 이 도구는 «종이 넓이»까지만 답한다.
#    📌 **판을 뽑아 눈으로 검수하는 것이 반드시 따라와야 한다**(절대원칙 21 · 창업자 「전수검사」).
#
# 사용:
#   python3 tools/글칸-다시재기.py            # 63컷 전수 · 표만
#   python3 tools/글칸-다시재기.py --판       # ＋ 컷 위에 새 글칸을 그린 판 (눈 검수용)
#   python3 tools/글칸-다시재기.py --쓰기     # Stickers.jsx 의 BOX_PAD 를 실제로 갈아끼운다
import re
import sys
from pathlib import Path

뿌리 = Path('/home/user/hankki/hankki')
컷폴더 = 뿌리 / 'src/assets/stickers/photo'
소스 = 뿌리 / 'src/components/Stickers.jsx'

# 📐 안전 여유 — 종이 가장자리에 글자가 닿으면 «삐져나온 것»으로 보인다.
#    ⛔ 0 으로 두면 글자 획이 종이 테두리를 물고 나간다.
여유 = 3.0     # 퍼센트포인트 (좌·우 각각)


def 글칸재기(경로, 상=None, 하=None):
    """상·하 = 그 컷의 «글칸» 세로 범위(%). 글은 그 안에만 놓인다.

    ⛔⛔ **처음엔 「세로 가운데 42%」라는 «고정 띠»를 봤다가 창업자가 잡았다** —
       *"아래 3번째 오른쪽에서 2번째는 너무 작아 초록칸이"* (＝`dlb10` · 44%)
       🔢 뿌리 = `dlb10` 은 위가 **둥근 아치**(꽃 달린 라벨)라 세로 30% 근처에서 폭이 64%로 좁아진다.
          고정 띠가 그 좁은 행을 물어서 **폭이 50%로 깎였다**(띠를 30%로 줄이면 87%).
       📌 **글칸 «밖»을 보고 글칸을 정하고 있었다.** 글이 안 닿는 자리가 폭을 깎으면 안 된다.
       ✅ 그래서 띠를 **그 컷의 글칸 상·하 범위**로 잡는다 — 컷마다 다르고, 안 낡는다.
    """
    from PIL import Image
    im = Image.open(경로).convert('RGBA')
    W, H = im.size
    a = im.getchannel('A').load()
    # ⑴ 종이로 치는 문턱 — 반투명 가장자리는 종이가 아니다
    문턱 = 128
    상 = 30.0 if 상 is None else 상
    하 = 30.0 if 하 is None else 하
    y0, y1 = int(H * 상 / 100), int(H * (1 - 하 / 100))
    if y1 - y0 < 4:  # 글칸이 너무 납작하면 가운데 20% 로 물러선다
        y0, y1 = int(H * 0.4), int(H * 0.6)
    좌들, 우들 = [], []
    for y in range(y0, y1):
        행 = [x for x in range(W) if a[x, y] >= 문턱]
        if not 행:
            continue
        좌들.append(행[0])
        우들.append(행[-1])
    if not 좌들:
        return None
    # ⑶ 어느 행에서도 안 나가는 구간 = 왼끝의 «최댓값» ~ 오른끝의 «최솟값»
    좌 = max(좌들)
    우 = min(우들)
    if 우 <= 좌:
        return None
    return (좌 / W * 100, (W - 1 - 우) / W * 100)


def 읽기():
    """⛔⛔ 「손으로 고침」 표시가 붙은 컷은 «건너뛴다».

    📌 창업자 실물 검수에서 잡혔다 — `dlb01` 은 좌 여백 30% 가 **왼쪽 달력 아이콘을 피하려고
       사람이 준 값**인데 도구가 8% 로 줄여서 **글자가 달력을 덮었다.**
       ⭐ 도구는 «알파»만 본다 — «왜 좁혔는지»는 모른다. 주석이 그걸 안다.
    ⛔ 목록을 여기 손으로 적지 않는다 — 적으면 낡는다. **주석을 그때그때 읽는다.**
    """
    s = 소스.read_text(encoding='utf-8')
    i = s.index('export const BOX_PAD')
    j = s.index('\n}', i)
    blk = s[i:j]
    out = []
    앞줄손 = False
    for ln in blk.split('\n'):
        m = re.match(r'^(\s*)(\w+):\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', ln)
        # ⛔⛔ 주석이 «같은 줄 끝»에도 붙는다 (`dgn01: [...],  // ⛔ 손으로 — …`)
        #    처음엔 「손으로」가 든 줄을 통째로 `continue` 했다가 **그 컷이 목록에서 사라졌다**
        #    (63 → 56). 결과는 같았지만 개수가 안 맞으면 다음 사람이 「왜 7개가 없지」로 헤맨다.
        #    ✅ 값 줄이면 «반드시» 목록에 넣고, 손 표시만 따로 딴다.
        같은줄손 = ('손으로' in ln) or ('덮' in ln) or ('피해' in ln)
        if m:
            out.append({'키': m.group(2), '상': float(m.group(3)), '우': float(m.group(4)),
                        '하': float(m.group(5)), '좌': float(m.group(6)), '손': 앞줄손 or 같은줄손})
            앞줄손 = False
        elif 같은줄손:
            앞줄손 = True      # 주석만 있는 줄 → 바로 «다음» 값 줄에 걸린다
        elif not ln.strip():
            앞줄손 = False
    return s, i, j, out


def main():
    s, i, j, 목록 = 읽기()
    print(f'📐 BOX_PAD {len(목록)}컷 — 글칸을 가로로 다시 잰다 (안전 여유 {여유}%p)\n')
    바뀜 = []
    없음 = []
    손건너 = []
    for r in 목록:
        if r.get('손'):
            손건너.append(r['키'])
            continue
        p = 컷폴더 / f"{r['키']}.png"
        if not p.exists():
            없음.append(r['키'])
            continue
        잰것 = 글칸재기(p, r['상'], r['하'])
        if not 잰것:
            없음.append(r['키'])
            continue
        새좌, 새우 = 잰것[0] + 여유, 잰것[1] + 여유
        옛폭 = 100 - r['좌'] - r['우']
        새폭 = 100 - 새좌 - 새우
        # ⛔ 좁아지는 쪽으로는 바꾸지 않는다 — 창업자 요청은 «넓히기»다
        if 새폭 <= 옛폭 + 0.5:
            continue
        바뀜.append({**r, '새좌': round(새좌, 1), '새우': round(새우, 1), '옛폭': 옛폭, '새폭': 새폭})
    바뀜.sort(key=lambda x: -(x['새폭'] - x['옛폭']))
    print(f"{'키':<10} {'옛 폭':>7} {'새 폭':>7} {'늘어남':>7}   좌/우 여백")
    for b in 바뀜:
        print(f"{b['키']:<10} {b['옛폭']:>6.1f}% {b['새폭']:>6.1f}% {b['새폭']-b['옛폭']:>+6.1f}%p   "
              f"{b['좌']:.1f}→{b['새좌']:.1f} / {b['우']:.1f}→{b['새우']:.1f}")
    print(f'\n✅ 넓어지는 컷 {len(바뀜)} / {len(목록)}')
    if 손건너:
        print(f'✋ 「손으로 고침」이라 건너뛴 컷 {len(손건너)} — {", ".join(손건너)}')
        print('   ⭐ 사람이 소품·아이콘을 피해 준 값이다. 도구는 알파만 보니 여기 손대면 덮는다.')
    if 없음:
        print(f'⚠️ 못 잰 컷 {len(없음)} — {", ".join(없음[:8])}{"…" if len(없음) > 8 else ""}')
    if 바뀜:
        평균 = sum(b['새폭'] - b['옛폭'] for b in 바뀜) / len(바뀜)
        print(f'📏 평균 {평균:+.1f}%p 넓어진다')

    if '--쓰기' in sys.argv:
        새s = s
        for b in 바뀜:
            옛줄 = re.search(rf"^(\s*){b['키']}:\s*\[[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+\]", 새s, re.M)
            if not 옛줄:
                print(f"⛔ {b['키']} 줄을 못 찾았다 — 멈춘다")
                sys.exit(1)
            새줄 = f"{옛줄.group(1)}{b['키']}: [{b['상']}, {b['새우']}, {b['하']}, {b['새좌']}]"
            새s = 새s[:옛줄.start()] + 새줄 + 새s[옛줄.end():]
        소스.write_text(새s, encoding='utf-8')
        print(f'\n✍️ Stickers.jsx 에 {len(바뀜)}컷을 썼다')

    if '--판' in sys.argv:
        from PIL import Image, ImageDraw
        낼 = Path('/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글칸판')
        낼.mkdir(parents=True, exist_ok=True)
        칸 = 260
        열 = 6
        줄 = (len(바뀜) + 열 - 1) // 열
        판 = Image.new('RGB', (열 * 칸, 줄 * (칸 + 26)), (26, 28, 36))
        d = ImageDraw.Draw(판)
        for n, b in enumerate(바뀜):
            im = Image.open(컷폴더 / f"{b['키']}.png").convert('RGBA')
            im.thumbnail((칸 - 8, 칸 - 8))
            bg = Image.new('RGBA', (칸, 칸), (245, 242, 235, 255))
            bg.paste(im, ((칸 - im.width) // 2, (칸 - im.height) // 2), im)
            g = ImageDraw.Draw(bg)
            ox, oy = (칸 - im.width) // 2, (칸 - im.height) // 2
            # 🟥 옛 글칸 · 🟩 새 글칸
            for 색, l, rr in ((( 220, 90, 90), b['좌'], b['우']), ((60, 190, 110), b['새좌'], b['새우'])):
                x1 = ox + im.width * l / 100
                x2 = ox + im.width * (1 - rr / 100)
                y1 = oy + im.height * b['상'] / 100
                y2 = oy + im.height * (1 - b['하'] / 100)
                g.rectangle([x1, y1, x2, y2], outline=색, width=2)
            r0, c0 = divmod(n, 열)
            판.paste(bg.convert('RGB'), (c0 * 칸, r0 * (칸 + 26) + 26))
            d.text((c0 * 칸 + 6, r0 * (칸 + 26) + 7),
                   f"{b['키']}  {b['옛폭']:.0f}→{b['새폭']:.0f}%", fill=(255, 220, 120))
        길 = 낼 / '글칸-옛빨강-새초록.png'
        판.save(길)
        print(f'\n📇 {길}  (🟥옛 · 🟩새)')


if __name__ == '__main__':
    main()
