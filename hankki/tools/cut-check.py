#!/usr/bin/env python3
"""🔍 자른 컷 2단계 검수 — **숫자로 좁히고, 눈으로 판정한다.**

창업자 2026-07-31: *"이렇게 2번 검수하는거 코드에 박아둬."*

════════ 왜 2단계인가 (이걸 몰라서 하루를 썼다) ════════
2026-07-30~31에 같은 실수를 세 번 했다.

  ① 숫자만 믿었다  → 재료 스티커가 **0%로 나왔는데 화면은 지저분했다.**
     찌꺼기가 "어둡고 무채색"이 아니라 **회갈색**이라 필터에 안 걸린 것.
  ② 눈만 믿었다    → 6컷만 고치고 끝낸 줄 알았는데 **앱 전체에 퍼져 있었다.**
     853컷을 눈으로 다 볼 수는 없다.
  ③ 숫자로 판정했다 → 의심 71컷 안에 **꼬르곰의 흰 다이컷 테두리**와
     **뚝배기의 검은 몸통**이 잔뜩 섞여 있었다. 둘 다 "어둡다".

📌 **결론: 숫자는 「어디를 볼지」만 정하고, 「맞나 틀리나」는 눈이 정한다.**
   숫자 없이는 다 못 보고, 눈 없이는 그림과 찌꺼기를 못 가른다.

════════ 그래서 이 도구가 하는 일 ════════
  1단계(숫자) — 컷 전부의 **바깥 테두리 띠**를 재서 의심 순위를 매긴다
       ⒜ 격자 찌꺼기 : 어둡고 무채색           (AI가 그려 넣은 회색 체커)
       ⒝ 회갈색 잔재 : 속살보다 눈에 띄게 어두움 (흰 배경과의 경계가 남은 것)
       ⒞ 가장자리 닿음 : 잘렸을 가능성
  2단계(눈)  — 사람이 **딱 두 장만** 보면 되게 판을 만들어 준다
       ⒜ 전체 컨택트시트   (진한 판 `#22263A` — 흰 그림·투명 실패가 드러난다)
       ⒝ 전체 컨택트시트   (빨간 판 — **그림 안에 갇힌 흰 판**이 모양째로 드러난다)
       ⒞ 의심 컷 확대 시트 (밝은 판 — 테두리 잔재는 밝은 판에서 잘 보인다)

⚠️ **두 판을 다 만드는 이유** = 진한 판에서는 **흰 테두리 잔재**가, 밝은 판에서는
   **어두운 잔재**가 보인다. 한 판만 보면 반은 놓친다(2026-07-29 실제 사고).

⚠️ 파일 이름 주의 — 처음엔 `inspect.py` 로 지었다가 **파이썬 표준 모듈 `inspect` 를 가려**
   numpy/scipy import 가 통째로 깨졌다. 📌 **도구 이름이 표준 모듈 이름을 뺏으면 안 된다.**

쓰기:
    python3 tools/cut-check.py <폴더>            # 그 폴더의 *.png 전부
    python3 tools/cut-check.py <폴더> --out 검수  # 결과 이미지 저장 위치
    python3 tools/cut-check.py <폴더> --top 24   # 확대해서 볼 의심 컷 개수

⭐ `tools/cut.py` 가 자른 뒤 **자동으로 이걸 부른다.** 자르기만 하고 검수를 건너뛸 수 없다.
"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

DARK_PANEL = (34, 38, 58)    # #22263A — 흰 그림·투명 실패가 드러나는 판
# ⭐⭐ **빨간 판 (2026-07-31 추가)** — 진한 판만으로는 못 잡은 사고가 있었다.
#   가을 바구니 «손잡이 안쪽»이 **흰 판으로 막혀** 있었는데, 진한 판에선 그게
#   «밝은 얼룩»으로만 보여 **그림의 흰 부분(레이스·니트)과 구분이 안 갔다.**
#   채도 높은 색 위에 얹으니 **막힌 모양째로** 드러났다. → `--punch` 로 고쳤다.
RED_PANEL = (185, 50, 50)
LIGHT_PANEL = (246, 243, 235)  # 앱 크림 배경과 비슷 — 어두운 잔재가 드러나는 판


def measure(path):
    """컷 하나를 재서 (격자찌꺼기%, 회갈색잔재%, 가장자리닿음) 를 낸다."""
    a = np.array(Image.open(path).convert('RGBA')).astype(int)
    al = a[..., 3] > 25
    if al.sum() < 300:
        return None
    # 바깥 3px 띠 — 잔재는 여기 산다
    band = al & ~ndimage.binary_erosion(al, np.ones((7, 7)))
    if band.sum() == 0:
        return None
    rgb = a[..., :3]
    lum = rgb.mean(2)

    # ⒜ 격자 찌꺼기 = 어둡고 무채색 (AI가 그린 회색 체커의 흔적)
    grid = ((rgb.max(2) < 130) & ((rgb.max(2) - rgb.min(2)) <= 24) & band).sum() * 100.0 / band.sum()

    # ⒝ 회갈색 잔재 = 띠 안에서 **상대적으로** 어두운 픽셀
    #    ⚠️ 절대 밝기로 재면 놓친다 — 계란후라이 잔재는 밝기 130~200이었다.
    v = lum[band]
    dim = (v < np.percentile(v, 80) - 45).sum() * 100.0 / len(v)

    # ⒞ 가장자리에 닿았나 = 잘렸을 가능성
    h, w = al.shape
    touch = bool(al[0].any() or al[h - 1].any() or al[:, 0].any() or al[:, w - 1].any())
    return grid, dim, touch


# ══════════════════════════════════════════════════════════════════════
# 🚫🚫 **[절대원칙 · 창업자 2026-08-13] 아래 둘을 어기면 «자르기가 실패한다».**
#
#   📮 창업자 원문 — *"앞으로 이 원칙대로. **테두리 바깥에 흰색조각들 없이.**
#      **정한 테두리 두께에 맞춰서 자르기(절대원칙).** 규칙만들어. 어기는일 없게."*
#
#   ⛔⛔ **왜 「규칙」이 아니라 「장치」인가** — 그날 창업자가 정확히 물었다:
#      *"정해놓은 걸 왜 니멋대로 바꿔? 이럴거면 규칙을 왜 정해? 시스템을 뭐하러 만들어?
#        어떻게 하면 니가 니맘대로 못하게할수있지?"*
#      문서(스티커-자르기-표준-2026-07-30.md)에 **「얇은 게 기본 · 0.7%」**라고 이미 적혀 있었는데
#      내가 keep(2.3%)을 골랐고 **아무것도 안 막았다.** 그래서 결과물을 «재서» 막는다.
#      📌 **내 판단을 믿지 않는다 — 나온 물건을 잰다.**
#
#   ① 흰 테 두께 = 긴변의 **0.35 ~ 1.30%**
#      근거 = 문서 `--diecut auto` **0.7%** · 기존 앱 99컷 실측 **0.61%** · 창업자 판정 *"딱좋아 두께"*
#      ⚠️ 띠부씰 팩으로 «일부러» 두껍게 낼 때만 `--allow-thick` 로 연다(문서 규칙 그대로).
#   ② 본체에서 떨어진 조각 = **0개** (제일 큰 덩어리의 12% 미만인 딴 덩어리)
#      근거 = 창업자 2026-07-31 *"옆에 하트나 그런거 달린거는 떼고 쓰자. 흰색이 연결되어 보이니까 이상해"*
#      ⛔ 그 조각들이 **각자 흰 테를 얻어** 컷 바깥에 흰 점처럼 뜬다 — 2026-08-13 에 33컷에 481개였다.
# ══════════════════════════════════════════════════════════════════════
테두께_최소, 테두께_최대, 조각비율 = 0.35, 1.30, 0.12


def 원칙검사(path):
    """(흰테%, 떨어진조각수) — 둘 다 절대원칙이다."""
    a = np.array(Image.open(path).convert('RGBA'))
    al = a[..., 3]
    sil = al > 128
    if sil.sum() < 300:
        return None
    rgb = a[..., :3].astype(int)

    # ① 흰 테 두께 — 실루엣 «바깥»부터 링을 벗기며 「거의 다 흰」 링이 몇 겹인가
    #    ⚠️ 한 점이 아니라 «링 평균»으로 본다 — 그래야 그림 속 흰 부분(모자·접시)에 안 속는다.
    흰 = sil & (rgb.min(axis=2) > 235)
    cur, n = sil, 0
    while n < 40:
        er = ndimage.binary_erosion(cur, np.ones((3, 3)))
        band = cur & ~er
        if band.sum() == 0 or 흰[band].mean() < 0.6:
            break
        n += 1
        cur = er
    긴변 = max(a.shape[0], a.shape[1])
    두께 = n * 100.0 / 긴변

    # ② 본체에서 떨어진 조각
    lab, cnt = ndimage.label(al > 40)
    조각 = 0
    if cnt > 1:
        sz = ndimage.sum(al > 40, lab, range(1, cnt + 1))
        조각 = int(sum(1 for s in sz if s / sz.max() < 조각비율))

    # ③ ⭐⭐ [2026-08-15 신설] «붙어 있는» 돌기 — ②로는 절대 못 잡는다
    #    📮 창업자 *"수정할 거 다 끝난거야?"* 로 찾았다. 「소고기솥밥」의 **「솥」 글자 조각**이
    #       흰 다이컷으로 본체에 «이어져» 한 덩어리가 되어 ②의 「떨어진 조각 0개」를 통과했다.
    #    ⭐ 그래서 «모양»으로 본다 — 몸통이 끝난 아래로 **가늘게 길게 삐져나온 줄기**가 있나.
    #       (둥근 그릇의 아랫부분은 «짧게» 좁아진다. 글자 조각은 «길게» 이어진다.)
    #
    # 🐛🐛 [2026-08-17 고침] **잣대가 늑대를 외치고 있었다.**
    #    창업자 요리소품 시트 8장(32컷)을 자르는데 **7컷이 죽었다.** 눈으로 보니 일곱 다 «그림 자체»였다
    #    — 오븐장갑 손목고리 · 클립에 매달린 하트 · 깃발 냅킨 · 긴 토크 · 소금통 · 하트 씰 · 셰프모자.
    #    ⛔ **뿌리 = 꼬리에 «아래쪽 투명 여백»까지 넣고 셌다.**
    #       여백은 폭이 0 이라 전부 「가는 줄」로 잡힌다 → **몸통이 아래까지 꽉 찬 컷은
    #       여백만으로 비율이 1.0 이 된다.** 키가 클수록 잘 걸렸다(창업자 컷이 다 그랬다).
    #    🔢 앱 스티커 1940장으로 재보니 **옛 잣대는 811장(42%)**을 걸고 있었다.
    #       새 잣대는 131장이고 그 131은 줄기·끈·리본·북마크 탭·「집밥」「냉장」 글자 —
    #       **잡으라고 만든 바로 그 모양**이다.
    #    ⭐ 그리고 ⓑ를 «더» 붙여 잣대를 **강하게** 만들었다(느슨하게 한 게 아니다).
    #       ⓐ 만으로는 글자를 아주 작게(12px) 심으면 새어 나갔다.
    #    🧪 규칙 12 = `scripts/_repro-돌기잣대-0817.py`
    #       — 창업자 32컷 **거짓 경보 0** · 라벨 조각을 심으면 글자 12px 까지 **32/32 잡는다**
    w = sil.sum(axis=1).astype(float)
    돌기 = 0
    있는줄 = np.where(w > 0)[0]
    if len(있는줄):
        맨아래 = int(있는줄.max())          # ⭐ 여백은 «꼬리»가 아니다. 여기까지만 본다
        몸통끝 = int(np.where(w > w.max() * 0.50)[0].max())
        꼬리 = w[몸통끝 + 1:맨아래 + 1]
        if len(꼬리) >= 4:
            # ⓐ 가늘고 «길게» 이어진다 — 원래 뜻 그대로
            가는줄 = int((꼬리 < w.max() * 0.22).sum())
            if len(꼬리) >= 12 and 가는줄 >= len(꼬리) * 0.7:
                돌기 = 1
            # ⓑ ⭐ 「가는 목」 아래에 **다시 넓어지는 것**이 있다
            #    둥근 바닥은 끝까지 «좁아지기만» 한다. 다이컷 다리에 매달린 글자는 목 밑에서 «부푼다».
            i = int(꼬리.argmin())
            목 = max(꼬리[i], 1.0)
            남은 = 꼬리[i + 1:]
            if len(남은) and int((남은 > 목 * 1.3).sum()) >= 8:
                돌기 = 1
    return 두께, 조각, 돌기


def sheet(paths, out, panel, cell=200, cols=None, labels=None):
    """컨택트시트 한 장을 만든다."""
    if not paths:
        return None
    cols = cols or min(16, max(4, int(len(paths) ** 0.5) + 2))
    rows = (len(paths) + cols - 1) // cols
    img = Image.new('RGB', (cell * cols, cell * rows), panel)
    d = ImageDraw.Draw(img)
    ink = (255, 235, 150) if panel == DARK_PANEL else (60, 50, 40)
    for i, p in enumerate(paths):
        im = Image.open(p).convert('RGBA')
        im.thumbnail((cell - 16, cell - 30))
        x, y = (i % cols) * cell + 8, (i // cols) * cell + 24
        img.paste(im, (x, y), im)
        d.text(((i % cols) * cell + 8, (i // cols) * cell + 6),
               (labels[i] if labels else os.path.basename(p)[:-4])[:22], fill=ink)
    img.save(out)
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        sys.exit(1)
    src = args[0]
    out_dir = args[1] if len(args) > 1 else os.path.join(os.path.dirname(src.rstrip('/')) or '.', '_검수')
    top = 24
    if '--top' in sys.argv:
        top = int(sys.argv[sys.argv.index('--top') + 1])
    os.makedirs(out_dir, exist_ok=True)

    files = sorted(glob.glob(os.path.join(src, '*.png')) if os.path.isdir(src) else glob.glob(src))
    if not files:
        print(f'❌ 볼 게 없다: {src}')
        sys.exit(1)

    rows = []
    for p in files:
        m = measure(p)
        if m:
            rows.append((m[0], m[1], m[2], p))

    # 🚫🚫 **0단계 — 절대원칙 두 가지.** 어기면 여기서 «죽는다»(검수판도 안 만든다).
    #   창업자 2026-08-13 *"규칙만들어. 어기는일 없게."*
    관대 = '--allow-thick' in sys.argv        # 띠부씰 팩으로 «일부러» 두껍게 낼 때만
    두꺼움, 조각들, 돌기들 = [], [], []
    for p in files:
        r = 원칙검사(p)
        if not r:
            continue
        t, c, g = r
        if not 관대 and not (테두께_최소 <= t <= 테두께_최대):
            두꺼움.append((os.path.basename(p), round(t, 2)))
        if c:
            조각들.append((os.path.basename(p), c))
        if g:
            돌기들.append(os.path.basename(p))
    if 두꺼움 or 조각들 or 돌기들:
        print('\n🚫🚫 **절대원칙 위반 — 자르기를 다시 한다.** (창업자 2026-08-13)')
        if 두꺼움:
            print(f'   ① 흰 테 두께가 규칙({테두께_최소}~{테두께_최대}%) 밖 — {len(두꺼움)}컷')
            print(f'      {두꺼움[:8]}')
            print('      📌 문서 규칙 = 긴변의 0.7%(--diecut auto) · 기존 앱 99컷 실측 0.61%')
            print('      👉 두께를 「정하지」 말고 문서 값으로 자른다. 원본에 흰 테가 이미 있으면')
            print('         그걸 «살리지» 말고 «버리고» 우리 두께로 다시 두른다(두 겹 방지).')
            print('      ⚠️ 띠부씰 팩으로 일부러 두껍게 낼 때만 --allow-thick')
        if 조각들:
            총 = sum(c for _, c in 조각들)
            print(f'   ② 본체에서 떨어진 조각 {총}개 — {len(조각들)}컷')
            print(f'      {조각들[:8]}')
            print('      📌 창업자 *"옆에 하트나 그런거 달린거는 떼고 쓰자. 흰색이 연결되어 보이니까 이상해"*')
            print('      👉 조각은 «최종 알파»에서도 한 번 더 턴다 — reg 단계만으론 모자란다.')
        if 돌기들:
            print(f'   ③ 몸통 아래로 «붙어 있는» 돌기 — {len(돌기들)}컷')
            print(f'      {돌기들[:8]}')
            print('      📌 2026-08-15 「소고기솥밥」의 **「솥」 글자 조각**이 이 모양이었다.')
            print('         흰 다이컷으로 본체에 «이어져» 한 덩어리라 ②로는 못 잡는다.')
            print('      👉 자르기 «전»에 라벨을 제대로 지운다 — tools/시트-라벨지우기.py 에')
            print('         **행수·열수를 반드시** 준다(칸마다 봐야 라벨 자리가 맞는다).')
        sys.exit(1)

    print(f'\n🔍 1단계(숫자) — {len(rows)}컷 측정')
    grids = [r[0] for r in rows]
    dims = [r[1] for r in rows]
    touched = [r for r in rows if r[2]]
    print(f'   격자 찌꺼기  평균 {sum(grids)/len(grids):5.1f}%   최대 {max(grids):5.1f}%')
    print(f'   회갈색 잔재  평균 {sum(dims)/len(dims):5.1f}%   최대 {max(dims):5.1f}%')
    if touched:
        print(f'   ⚠️ 가장자리에 닿은 컷 {len(touched)}개 — 잘렸을 수 있다:')
        for r in touched[:8]:
            print(f'      {os.path.basename(r[3])}')

    # 의심 = 격자 8%↑ 또는 회갈색 45%↑ (닿은 건 무조건 맨 위로)
    suspect = sorted([r for r in rows if r[0] >= 8 or r[1] >= 45 or r[2]],
                     key=lambda r: (not r[2], -(r[0] + r[1])))
    print(f'   → 눈으로 볼 의심 컷 {len(suspect)}개')

    base = os.path.basename(src.rstrip('/')) or 'cut'
    p1 = sheet(files, os.path.join(out_dir, f'{base}-전체-진한판.png'), DARK_PANEL)
    p3 = sheet(files, os.path.join(out_dir, f'{base}-전체-빨간판.png'), RED_PANEL)
    p2 = sheet([r[3] for r in suspect[:top]],
               os.path.join(out_dir, f'{base}-의심-밝은판.png'), LIGHT_PANEL,
               cell=430, cols=4,
               labels=[f'{os.path.basename(r[3])[:-4]}  격자{r[0]:.0f}% 어둠{r[1]:.0f}%' for r in suspect[:top]])
    # 🔍🔍 **까만 판 «크게»** — 2026-08-12 창업자 *"까만판에 올려봐. 테두리가 이상해"*
    #   ⛔ 그날 나는 밝은 판만 보고 「깨끗하다」고 보고했고, 접시·냄비 아래 흰 얼룩을 통째로 놓쳤다.
    #   📌 위 `-전체-진한판` 은 셀 200px 이라 **한 컷이 엄지손톱만 하다** — 잔재가 그 크기론 안 보인다.
    #      그래서 「만들어는 놨는데 봐도 못 잡는」 판이 된다.
    #   ⭐ 셀을 460px 로 크게 잡은 판을 «따로» 만든다. 열자마자 보인다.
    #      (컷 수가 많으면 앞 24장만 — 다 넣으면 판이 너무 커져 아무도 안 연다)
    p4 = sheet(files[:24], os.path.join(out_dir, f'{base}-진한판-크게.png'), DARK_PANEL,
               cell=460, cols=4)

    print('\n👁 2단계(눈) — 이 두 장을 열어서 본다')
    print(f'   ⭐⭐ ① 진한 판 «크게»  {p4}')
    print('      → **여기부터 연다.** 흰 잔재·바닥 그림자는 «까만 판을 키워야» 보인다.')
    print('      ⛔ 2026-08-12 — 밝은 판만 보고 「깨끗하다」고 했다가 창업자가 잡았다')
    print('         (*"지금 지저분하게 잘렸어"* → *"까만판에 올려봐"*). 접시·냄비 아래 흰 얼룩이었다.')
    print(f'   ①-a 전체(진한 판)  {p1}')
    print('      → 흰 그림이 안 보이거나 투명이 안 된 컷이 여기서 드러난다')
    print(f'   ①-b 전체(빨간 판) {p3}')
    print('      → **그림 안에 갇힌 흰 판**(바구니 손잡이 속)이 여기서만 모양째로 드러난다')
    if p2:
        print(f'   ② 의심(밝은 판)  {p2}')
        print('      → 테두리에 삐죽삐죽한 잔재·점점이가 있는지 본다')
    print('   ⚠️ 어두운 선이 있다고 다 잘못된 게 아니다 —')
    print('      우리 진갈색 마감·검은 뚝배기·수박 껍질은 **그림 자체**다. 그건 그대로 둔다.')

    # ══════════ 3단계 — **실제 앱에서 보일 크기로** 본다 ══════════
    # ⚠️ 1·2단계는 **원본 픽셀**을 본다. 그런데 유저는 원본을 안 본다.
    #    2026-07-31 창업자 제보(마늘·셰프모자)가 정확히 이 구멍이었다 —
    #    **파일은 0%로 깨끗한데 화면은 지저분했다.** 원인은 확대였다.
    # 📌 그래서 3단계는 **앱과 같은 크기·같은 배경**으로 다시 그려서 본다.
    #    + 알파 품질(반투명 픽셀 비율)도 같이 본다. 알파가 0/255뿐이면 키울 때 **계단**이 진다.
    STICKER_PX, FRAME_PX = 238, 626
    hard = []
    shots = []
    for _, _, _, p in rows:
        im = Image.open(p).convert('RGBA')
        a = np.array(im)
        al = a[..., 3]
        soft = ((al > 0) & (al < 255)).sum() * 100.0 / max((al > 0).sum(), 1)
        if soft < 2.0:
            hard.append((soft, os.path.basename(p)[:-4]))
        show = FRAME_PX if 'frame' in p or os.path.basename(p).startswith('nf') else STICKER_PX
        im2 = im.resize((max(1, round(im.width * show / max(im.size))),
                         max(1, round(im.height * show / max(im.size)))), Image.LANCZOS)
        shots.append((im2, os.path.basename(p)[:-4]))

    print(f'\n📐 3단계(실제 크기) — 앱에 보일 크기로 다시 그려서 본다')
    if hard:
        print(f'   ⚠️ 알파가 0/255뿐인 컷 {len(hard)}개 — 키우면 **계단**이 진다:')
        for s, n in sorted(hard)[:8]:
            print(f'      {n}  (반투명 {s:.1f}%)')
    else:
        print('   ✅ 알파 품질 OK — 반투명 가장자리가 살아 있다(계단 안 진다)')

    cell = 260
    cols = min(10, len(shots))
    rws = (len(shots) + cols - 1) // cols
    canvas = Image.new('RGB', (cell * cols, cell * rws), LIGHT_PANEL)
    dd = ImageDraw.Draw(canvas)
    for i, (im2, nm) in enumerate(shots):
        t = im2.copy(); t.thumbnail((cell - 12, cell - 26))
        canvas.paste(t, ((i % cols) * cell + 6, (i // cols) * cell + 20), t)
        dd.text(((i % cols) * cell + 6, (i // cols) * cell + 4), nm[:20], fill=(120, 110, 100))
    p3 = os.path.join(out_dir, f'{base}-실제크기.png')
    canvas.save(p3)
    print(f'   ③ 실제 크기   {p3}')
    print('      → 앱에서 보일 크기 그대로다. 여기서 안 지저분하면 유저도 안 지저분하다.\n')


if __name__ == '__main__':
    main()
