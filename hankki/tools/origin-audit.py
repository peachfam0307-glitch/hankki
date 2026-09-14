#!/usr/bin/env python3
"""📚 원본 감사 — 「앱에 들어간 컷을 다시 자를 수 있나」를 **픽셀로** 전수 확인한다.

왜 만들었나 (창업자 2026-07-31):
  *"우리 재료나 이모지 라벨도 다 원본에 들어가 있어? 오늘 내가 뽑아준 것들도 다??"*
  *"원본 폴더 다 확인해줘. 빠짐없이 ㅠ"*
  옛 컷 도구가 외곽선을 파먹은 걸 알게 된 뒤라 **다시 자를 수 있느냐가 전부**가 됐다.

⛔⛔ **이름으로 찾으면 안 된다.** 처음엔 접두어(`sk_`·`fe_`)로 팩을 찾았는데
   낱개 폴더마다 이름 규칙이 달라(`01.png`·`x11.png`·`nsf_01.png`) **631컷이 「모름」으로 나왔다.**
   원본이 없어서가 아니라 **이름이 안 걸려서**였다. 겁만 주는 숫자다.
   📌 우리 규칙 그대로다 — **이름 규칙·표시용 라벨로 분류하지 말 것.**

════════ 그래서 픽셀로 찾는다 ════════
① 앱 컷과 `docs/stickers` 의 모든 PNG를 **지문**으로 만든다
   (12×12로 줄인 밝기 + 알파 = 크기·이름과 무관하게 «같은 그림인가»만 본다)
② 앱 컷의 지문과 가장 가까운 낱개를 찾는다 → 그 파일이 속한 **팩**이 출처
③ 그 팩에 **큰 그림(짧은변 ≥ 800px)** 이 있으면 = **원본 시트가 있다 = 다시 자를 수 있다**
   (폴더 이름을 안 믿고 «크기»로 판단한다)

쓰기: python3 tools/origin-audit.py [--md docs/원본-감사.md]
"""
import os
import sys

import numpy as np
from PIL import Image

APP = 'src/assets/stickers/photo'
DOCS = 'docs/stickers'
SHEET_MIN = 800
FP = 12                  # 지문 해상도
NEAR = 0.055             # 이보다 가까우면 같은 그림으로 본다


def fingerprint(path):
    try:
        im = Image.open(path).convert('RGBA')
    except Exception:
        return None, None
    w, h = im.size
    a = np.asarray(im.resize((FP, FP), Image.BILINEAR), dtype=np.float32) / 255.0
    al = a[..., 3]
    lum = a[..., :3].mean(2) * al                    # 투명한 데는 0 — 배경색에 안 흔들리게
    v = np.concatenate([lum.ravel(), al.ravel()])
    n = np.linalg.norm(v)
    return (v / n if n > 1e-6 else v), (w, h)


def main():
    mi = sys.argv.index('--md') + 1 if '--md' in sys.argv else None
    out_md = sys.argv[mi] if mi else None

    # ── 자료 쪽 지문 + 팩별 시트 유무
    src_fp, src_pack, pack_sheets = [], [], {}
    for dp, _dn, fn in os.walk(DOCS):
        rel = os.path.relpath(dp, DOCS).split(os.sep)
        pack = rel[0] if rel and rel[0] != '.' else '(루트)'
        pack_sheets.setdefault(pack, 0)
        for f in fn:
            if not f.lower().endswith('.png'):
                continue
            p = os.path.join(dp, f)
            v, size = fingerprint(p)
            if v is None:
                continue
            w, h = size
            is_cut_dir = any(s.startswith(('낱개', 'cut', '_검수')) for s in dp.split(os.sep))
            if min(w, h) >= SHEET_MIN and not is_cut_dir:
                pack_sheets[pack] += 1          # 시트
            else:
                src_fp.append(v)
                src_pack.append(pack)
    M = np.array(src_fp, dtype=np.float32)
    print(f'   자료 낱개 {len(M)}개 · 팩 {len(pack_sheets)}개 지문 완료', file=sys.stderr)

    ok, nosheet, miss = [], [], []
    for f in sorted(os.listdir(APP)):
        if not f.endswith('.png'):
            continue
        v, _ = fingerprint(os.path.join(APP, f))
        if v is None:
            continue
        d = np.linalg.norm(M - v, axis=1)
        i = int(d.argmin())
        if d[i] > NEAR:
            miss.append((f[:-4], round(float(d[i]), 3)))
        elif pack_sheets.get(src_pack[i], 0) > 0:
            ok.append((f[:-4], src_pack[i]))
        else:
            nosheet.append((f[:-4], src_pack[i]))

    tot = len(ok) + len(nosheet) + len(miss)
    lines = []
    lines.append(f'# 📚 원본 감사 — 다시 자를 수 있나 (앱 컷 {tot}개)\n')
    lines.append('> 이름이 아니라 **픽셀 지문**으로 찾았다. 낱개 폴더마다 이름 규칙이 달라서')
    lines.append('> 접두어로 찾으면 원본이 있는데도 「없음」으로 나온다.\n')
    lines.append(f'| 결과 | 컷 |')
    lines.append(f'|---|---:|')
    lines.append(f'| ✅ **원본 시트 있음 = 다시 자를 수 있다** | **{len(ok)}** |')
    lines.append(f'| ⚠️ 자료엔 있는데 그 팩에 큰 시트가 없음 | {len(nosheet)} |')
    lines.append(f'| ❓ 자료에서 못 찾음 | {len(miss)} |\n')

    by = {}
    for nm, pack in ok:
        by.setdefault(pack, []).append(nm)
    lines.append('## ✅ 팩별 (다시 자를 수 있는 것)\n')
    lines.append('| 컷 | 팩 | 시트 |')
    lines.append('|---:|---|---:|')
    for pack, names in sorted(by.items(), key=lambda t: -len(t[1])):
        lines.append(f'| {len(names)} | `{pack}` | {pack_sheets[pack]}장 |')
    # ⭐ 팩 단위 표도 남긴다 — 낱개가 없는 팩(`음식아이콘-2507` 등)은 지문 매칭이 안 되지만
    #   **시트는 멀쩡히 있다.** 컷 단위 「못 찾음」만 보면 없는 줄 알고 겁먹는다.
    lines.append('\n## 📦 팩 전체 — 시트가 있나 (30개 전부)\n')
    lines.append('| 팩 | 원본 시트 |')
    lines.append('|---|---:|')
    for pk in sorted(pack_sheets, key=lambda k: -pack_sheets[k]):
        mark = f'{pack_sheets[pk]}장' if pack_sheets[pk] else '**없음**'
        lines.append(f'| `{pk}` | {mark} |')
    if nosheet:
        by2 = {}
        for nm, pack in nosheet:
            by2.setdefault(pack, []).append(nm)
        lines.append('\n## ⚠️ 낱개는 있는데 큰 시트가 안 보이는 팩\n')
        for pack, names in sorted(by2.items(), key=lambda t: -len(t[1])):
            lines.append(f'- `{pack}` — {len(names)}컷 ({", ".join(names[:8])}{" …" if len(names) > 8 else ""})')
    if miss:
        lines.append('\n## ❓ 자료에서 못 찾은 것\n')
        lines.append('⚠️ **없다는 뜻이 아니다** — 앱에서 손본 컷이라 지문이 달라졌을 수 있다.\n')
        lines.append(', '.join(f'`{n}`' for n, _d in miss[:120]))
        if len(miss) > 120:
            lines.append(f'\n… 외 {len(miss) - 120}개')
    text = '\n'.join(lines) + '\n'

    print(f'\n📚 앱 컷 {tot}개')
    print(f'   ✅ 다시 자를 수 있다   {len(ok):4d}컷  ({100*len(ok)/max(tot,1):.0f}%)')
    print(f'   ⚠️ 시트가 안 보이는 팩 {len(nosheet):4d}컷')
    print(f'   ❓ 자료에서 못 찾음    {len(miss):4d}컷\n')
    for pack, names in sorted(by.items(), key=lambda t: -len(t[1]))[:14]:
        print(f'   {len(names):4d}컷  {pack}  (시트 {pack_sheets[pack]}장)')
    if out_md:
        open(out_md, 'w', encoding='utf-8').write(text)
        print(f'\n   → {out_md} 저장')
    return 0


if __name__ == '__main__':
    sys.exit(main())
