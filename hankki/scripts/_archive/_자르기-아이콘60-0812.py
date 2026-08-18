# ✂️ 창업자 새 음식 아이콘 시트 10장(60컷) 자르기 — 2판 (2026-08-12)
#
# 📮 창업자 *"아래 잘린 음식들이 꽤 있어. 확인해주고"* · *"두부김치 무스비등등 아래부분 잘려보여"*
#
# ⛔⛔⛔ **1판(`_자르기-아이콘54-0812.py`)이 58/60 컷의 아래를 잘라먹었다. 창업자가 눈으로 잡았다.**
#
#    ⚠️⚠️ **더 나쁜 건 내 검사가 「잘림 0」이라고 «거짓 통과»시킨 것이다.**
#       나는 「컷 가장자리에 알파가 닿았나」를 쟀는데, `--diecut` 흰 테두리가 바깥을 둘러싸서
#       **납작하게 잘려도 가장자리에 안 닿는다.** 0/54 는 「안 잘렸다」가 아니라 «내가 딴 걸 쟀다»였다.
#       📌 규칙 18 ⓘ 그대로 — 검사가 초록불이어도 «무엇을 보는지»를 봐야 한다.
#
# ⭐⭐ **진짜 원인 = 라벨 띠 자리가 «윗줄과 아랫줄이 다르다». 고정값 하나로는 못 맞춘다.**
#    실측(시트06 · 칸높이 561):
#      · **윗줄** — 그림이 **0.85** 까지 내려오고 라벨은 0.85~0.96
#      · **아랫줄** — 그림이 **0.63** 에서 끝나고 라벨은 0.64~0.75
#    나는 `라벨시작 = 0.74` 하나로 둘 다 처리했다 →
#      **윗줄은 그림 아래 11%를 잘라먹고**, **아랫줄은 라벨이 살짝 남았다**(그때 본 「빈 여백」이 이것이다).
#    ⛔ 1판 주석에 *"실측으로 그림은 칸 높이의 69.3% 에서 끝났다"* 고 적었는데
#       **그건 시트04 «아랫줄» 하나를 보고 «전부»라고 한 것이다.**
#
# ✅ **고침 = 칸마다 「그림 덩어리와 라벨 띠 사이의 빈 줄」을 찾아 거기서 자른다.**
#    ⑴ 칸의 «줄마다 잉크 픽셀 수»를 센다
#    ⑵ 잉크가 이어지는 덩어리들을 찾는다(빈 줄 5개 이상이면 딴 덩어리)
#    ⑶ **맨 마지막 덩어리 = 라벨 띠** → 그 바로 «위»에서 자른다
#    🛡 안전장치 — 마지막 덩어리가 칸 높이의 25%를 넘으면 «라벨이 아니라 그림»이므로
#       손대지 않고 경고한다. 라벨과 그림이 붙어 있으면 잘못 자르느니 안 자르는 게 낫다.
import subprocess
import sys
from pathlib import Path
from PIL import Image

뿌리 = Path(__file__).resolve().parent.parent
폴더 = 뿌리 / 'docs/stickers/음식아이콘-창업자-2026-08-12'
시트들 = sorted((폴더 / '원본시트').glob('시트*.png'))
낼곳 = 폴더 / '낱개'
라벨곳 = 폴더 / '_라벨띠'
지운시트 = 폴더 / '_라벨지운시트'
for d in (낼곳, 라벨곳, 지운시트):
    d.mkdir(parents=True, exist_ok=True)

행, 열 = 2, 3
흰 = 235          # 이보다 밝으면 «빈 곳»으로 본다
틈 = 5            # 빈 줄이 이만큼 이어지면 딴 덩어리
상한 = 0.25       # 마지막 덩어리가 칸 높이의 이보다 크면 라벨이 아니다


def 라벨자리(px, x0, y0, x1, y1):
    """칸 안에서 «라벨 띠가 시작하는 y»를 돌려준다. 못 찾으면 None."""
    h = y1 - y0
    잉크 = [sum(1 for x in range(x0, x1) if sum(px[x, y]) / 3 < 흰) for y in range(y0, y1)]
    덩어리 = []
    시작 = None
    빈수 = 0
    for i, v in enumerate(잉크):
        if v > 0:
            if 시작 is None:
                시작 = i
            빈수 = 0
            끝 = i
        else:
            if 시작 is not None:
                빈수 += 1
                if 빈수 >= 틈:
                    덩어리.append((시작, 끝))
                    시작 = None
    if 시작 is not None:
        덩어리.append((시작, 끝))
    if len(덩어리) < 2:
        return None, 덩어리          # 덩어리가 하나면 라벨을 못 가른다
    a, b = 덩어리[-1]
    if (b - a + 1) > h * 상한:
        return None, 덩어리          # 🛡 너무 두껍다 = 라벨이 아니라 그림
    앞끝 = 덩어리[-2][1]
    선 = (앞끝 + a) // 2             # ⭐ 그림 끝과 라벨 시작의 «한가운데»에서 자른다
    return y0 + 선, 덩어리


경고 = []
for s in 시트들:
    n = s.stem[-2:]
    im = Image.open(s).convert('RGB')
    px = im.load()
    W, H = im.size
    새 = im.copy()
    말 = []
    for r in range(행):
        for c in range(열):
            x0, y0 = int(W * c / 열), int(H * r / 행)
            x1, y1 = int(W * (c + 1) / 열), int(H * (r + 1) / 행)
            키 = f'n{n}{r * 열 + c + 1:02d}'
            선, 덩어리 = 라벨자리(px, x0, y0, x1, y1)
            if 선 is None:
                경고.append(f'{키} — 라벨 띠를 못 가름(덩어리 {len(덩어리)}개). 손 안 댐')
                continue
            비 = (선 - y0) / (y1 - y0)
            말.append(f'{키}:{비:.2f}')
            # 🏷 ① 지우기 «전»에 라벨 띠를 남긴다 (이름 확정용)
            im.crop((x0, 선, x1, y1)).save(라벨곳 / f'L{키[1:]}.png')
            # 🧹 ② 그 자리를 흰색으로
            새.paste((255, 255, 255), (x0, 선, x1, y1))
    p = 지운시트 / f'시트{n}.png'
    새.save(p)
    print(f'🧹 시트{n}  자른 자리 → {" · ".join(말)}')

if 경고:
    print('\n⚠️ 경고')
    for w in 경고:
        print(f'   {w}')

print()
for p in sorted(지운시트.glob('시트*.png')):
    n = p.stem[-2:]
    r = subprocess.run([sys.executable, str(뿌리 / 'tools/cut.py'), str(p), str(낼곳), f'n{n}',
                        '--diecut', 'auto', '--grid', f'{행}x{열}'],
                       capture_output=True, text=True, cwd=str(뿌리))
    첫 = [l for l in r.stdout.splitlines() if '컷' in l][:1]
    print(f'✂️ 시트{n} → {첫[0].strip() if 첫 else r.returncode}')

컷들 = sorted(낼곳.glob('*.png'))
print(f'\n✅ 낱개 {len(컷들)}컷')
if len(컷들) != len(시트들) * 행 * 열:
    print(f'⛔ {len(시트들) * 행 * 열}컷이 나와야 하는데 {len(컷들)}컷이다')
