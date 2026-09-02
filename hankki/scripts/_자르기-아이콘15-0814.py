# ✂️ 창업자 새 음식 아이콘 시트 3장(15컷) 자르기 — 2026-08-14
#
# 📮 창업자가 «이름을 붙여» 보낸 시트다. 내가 「다시 뽑아야 한다」고 짚은 셋(꽃게탕·전찌개·대하소금구이)이
#    시트01 에 그대로 왔고, 나머지 12컷은 라이브러리를 넓히는 컷이다.
#
# ⭐ 방식은 `_자르기-아이콘60-0812.py` 를 그대로 따른다 — **라벨 띠를 「칸마다」 찾아 지우고 자른다.**
#    ⛔ 고정 비율 하나로 자르면 **윗줄은 그림을 잘라먹고 아랫줄은 라벨이 남는다**(2026-08-12 사고).
#
# ⛔⛔ **이번 시트는 «격자가 시트마다 다르다»** — 시트01 은 3컷(2×2 격자의 세 칸만 참)이다.
#    빈 칸은 라벨을 못 찾아 저절로 걸러진다. 그 「경고」는 정상이므로 개수로 판정한다.
#
# 🏷 **이름은 라벨을 «눈으로» 읽어 붙인다** — 오늘 창업자 옛 시트에서
#    `08-05-소스.png` 안에 나물이, `08-06-궁채나물.png` 안에 소스가 든 걸 찾았다(라벨이 뒤바뀜).
#    그래서 자른 뒤 **컷＋라벨을 나란히 놓은 확인판**을 만들어 내가 열어 본다(규칙 21).
import subprocess
import sys
from pathlib import Path
from PIL import Image

뿌리 = Path(__file__).resolve().parent.parent
폴더 = 뿌리 / 'docs/stickers/음식아이콘-창업자-2026-08-14'
낼곳, 라벨곳, 지운시트 = 폴더 / '낱개', 폴더 / '_라벨띠', 폴더 / '_라벨지운시트'
for d in (낼곳, 라벨곳, 지운시트):
    d.mkdir(parents=True, exist_ok=True)

# 시트 파일 이름 → (행, 열, 실제 컷 수)
격자 = {'시트01-국물구이-3컷': (2, 2, 3), '시트02-샐러드랩-6컷': (2, 3, 6), '시트03-간식면빵-6컷': (2, 3, 6)}

흰, 틈, 상한 = 235, 5, 0.25


def 라벨자리(px, x0, y0, x1, y1):
    """칸 안에서 «라벨 띠가 시작하는 y»를 돌려준다. 못 찾으면 None."""
    h = y1 - y0
    잉크 = [sum(1 for x in range(x0, x1) if sum(px[x, y]) / 3 < 흰) for y in range(y0, y1)]
    덩어리, 시작, 빈수, 끝 = [], None, 0, 0
    for i, v in enumerate(잉크):
        if v > 0:
            if 시작 is None:
                시작 = i
            빈수, 끝 = 0, i
        elif 시작 is not None:
            빈수 += 1
            if 빈수 >= 틈:
                덩어리.append((시작, 끝))
                시작 = None
    if 시작 is not None:
        덩어리.append((시작, 끝))
    if len(덩어리) < 2:
        return None, 덩어리
    a, b = 덩어리[-1]
    if (b - a + 1) > h * 상한:
        return None, 덩어리          # 🛡 두꺼우면 라벨이 아니라 그림이다 — 손대지 않는다
    return y0 + (덩어리[-2][1] + a) // 2, 덩어리


빈칸 = []
for s in sorted((폴더 / '원본시트').glob('시트*.png')):
    행, 열, 몇컷 = 격자[s.stem]
    n = s.stem[2:4]
    im = Image.open(s).convert('RGB')
    px, (W, H) = im.load(), im.size
    새, 말 = im.copy(), []
    for r in range(행):
        for c in range(열):
            x0, y0 = int(W * c / 열), int(H * r / 행)
            x1, y1 = int(W * (c + 1) / 열), int(H * (r + 1) / 행)
            키 = f'n{n}{r * 열 + c + 1:02d}'
            선, 덩어리 = 라벨자리(px, x0, y0, x1, y1)
            if 선 is None:
                빈칸.append(f'{키}(덩어리 {len(덩어리)})')
                # ⭐ 빈 칸이면 통째로 하얗게 — 안 그러면 자르기가 부스러기를 컷으로 뱉는다
                새.paste((255, 255, 255), (x0, y0, x1, y1))
                continue
            말.append(f'{키}:{(선 - y0) / (y1 - y0):.2f}')
            im.crop((x0, 선, x1, y1)).save(라벨곳 / f'L{키[1:]}.png')
            새.paste((255, 255, 255), (x0, 선, x1, y1))
    새.save(지운시트 / f'시트{n}.png')
    print(f'🧹 시트{n} ({행}x{열}) 자른 자리 → {" · ".join(말)}')

if 빈칸:
    print(f'\n⚪ 라벨을 못 가른 칸 {len(빈칸)}개 (시트01 의 빈 칸이면 정상) — {" · ".join(빈칸)}')

print()
# ⛔⛔ **「몇 px 을 주면 몇 % 가 나온다」가 아니다** — 게이트는 «실루엣 바깥부터 거의 다 흰 링이 몇 겹인가»를
#    센다. 그림 가장자리가 진갈색이면 링이 덜 세어져서 **같은 3px 인데 시트01 은 0.17%, 시트03 은 통과**였다.
#    📌 그래서 값을 「정하지」 않고 **게이트가 통과할 때까지 올린다** — 나온 물건을 재는 것이 규칙이다.
for p in sorted(지운시트.glob('시트*.png')):
    n = p.stem[-2:]
    행, 열, _ = next(v for k, v in 격자.items() if k[2:4] == n)
    for 값 in (3, 5, 8, 12):
        r = subprocess.run([sys.executable, str(뿌리 / 'tools/cut.py'), str(p), str(낼곳), f'n{n}',
                            '--diecut', str(값), '--grid', f'{행}x{열}'],
                           capture_output=True, text=True, cwd=str(뿌리))
        if r.returncode == 0:
            첫 = [l for l in r.stdout.splitlines() if '컷' in l][:1]
            print(f'✂️ 시트{n} (--diecut {값}) → {첫[0].strip() if 첫 else "ok"}')
            break
    else:
        print(f'⛔ 시트{n} — 3·5·8·12 어느 값으로도 절대원칙을 못 지켰다')
        print(r.stdout[-400:] or r.stderr[-400:])

컷들 = sorted(낼곳.glob('*.png'))
기대 = sum(v[2] for v in 격자.values())
print(f'\n{"✅" if len(컷들) == 기대 else "⛔"} 낱개 {len(컷들)}컷 (기대 {기대})')
for p in 컷들:
    w, h = Image.open(p).size
    print(f'   {p.name}  {w}x{h}')
