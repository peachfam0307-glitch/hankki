#!/usr/bin/env python3
"""🔤 글자체를 «우리 방식»으로 만든다 — 원본 TTF → 라틴/한글 두 벌 woff2

⛔ 왜 필요한가 (2026-08-07)
   꾸미기 글씨체는 여섯인데 **파일이 넷뿐이었다.**
   「임팩트」(Black Han Sans)·「라운드」(Do Hyeon)는 `index.html` 의 **구글 폰트 CDN 링크**로만 왔다.
   → ⑴오프라인이면 안 뜬다(우리는 PWA 다) ⑵**공유 카드에 안 실린다**
     (`fontEmbed.js` 가 심는 건 로컬 4종뿐 — 그 글씨체로 쓴 글자는 친구한테 다른 글씨로 나간다.
      2026-08-05 에 「한끼」가 두 줄로 깨진 그 사고와 «같은 종류»다)

⭐ 왜 구글 폰트 CSS 를 그대로 안 쓰나
   구글은 한글을 **93조각**으로 쪼개 준다(브라우저가 필요한 조각만 받게).
   우리 기존 파일은 **한 덩어리**(개구 284KB·주아 360KB)라 방식이 다르다.
   → 원본 TTF 를 받아 **우리가 직접 자른다.** 그래야 기존 넷과 같은 모양이 된다.

📐 자르는 기준 = 기존 파일 실측
   · 라틴 = 아스키 94자 (＋있으면 라틴-1 보충)
   · 한글 = 나머지 전부 (완성형 음절 ＋ 자모)
   ⚠️ 원본이 이미 작다(Black Han Sans 2733자·Do Hyeon 3093자) → 통째로 담아도 안 크다.
      **일부러 더 깎지 않는다** — 깎으면 흔한 글자에서 갑자기 다른 글씨체로 새어 한 낱말이 두 글씨가 된다.

사용:
    python3 tools/font-subset.py <원본.ttf> <낼이름> [--out src/assets/fonts]
    예) python3 tools/font-subset.py DoHyeon-Regular.ttf dohyeon
        → dohyeon-latin-400.woff2 · dohyeon-korean-400.woff2
"""
import argparse
import json
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont


def ranges_to_str(codes):
    """유니코드 코드포인트 목록 → pyftsubset 이 받는 문자열"""
    return ','.join(f'U+{c:04X}' for c in sorted(codes))


def cut(src, codes, out_path, name):
    if not codes:
        print(f'   ⛔ {name} — 담을 글자가 0개다. 안 만든다.')
        return None
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.desubroutinize = False
    opts.layout_features = ['*']          # 합자·커닝 유지
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    opts.recalc_bounds = True
    font = subset.load_font(src, opts)
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(unicodes=codes)
    subsetter.subset(font)
    subset.save_font(font, out_path, opts)
    font.close()
    n = os.path.getsize(out_path)
    print(f'   ✅ {name:8} {len(codes):5}자 → {n / 1024:7.1f}KB  {os.path.basename(out_path)}')
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src', help='원본 폰트 (.ttf / .otf)')
    ap.add_argument('key', help='낼 이름 앞머리 (예: dohyeon)')
    ap.add_argument('--out', default='src/assets/fonts', help='낼 폴더')
    ap.add_argument('--weight', default='400')
    # 🏷🏷 **고르는 칸(칩)용 아주 작은 벌** — 2026-08-07 신설
    #    ⛔ 왜 필요한가: 글씨체 고르는 칸은 «이름을 그 글씨체로» 보여준다.
    #       그래서 「글자」 탭을 여는 순간 **열두 벌을 다 내려받는다 — 실측 4.45MB**
    #       (`scripts/_measure-글씨무게.mjs`). 아직 쓰지도 않았는데 데이터를 다 쓴다.
    #    ⭐ 칸에 필요한 건 «그 이름 몇 글자»뿐이다 → 그 글자만 담은 벌을 따로 만든다(벌당 몇 KB).
    #       진짜 글씨체는 **그 글씨로 글자를 놓을 때** 받는다.
    ap.add_argument('--chars', default='', help='이 글자들만 담은 «칩» 벌도 만든다 (예: 귀염체)')
    # 📌 이미 잘라 둔 woff2 에서 «칩만» 더 뽑을 때 쓴다 — 원본 TTF 를 다시 받을 필요가 없고,
    #    **앱에 실제로 실린 그 글꼴에서** 뽑는 것이라 모양이 어긋날 수가 없다.
    ap.add_argument('--only', default='', choices=['', 'chip'], help="'chip' 이면 칩 벌만 만든다")
    a = ap.parse_args()

    if not os.path.exists(a.src):
        sys.exit(f'⛔ 원본이 없다 — {a.src}')
    os.makedirs(a.out, exist_ok=True)

    f = TTFont(a.src)
    full = f['name'].getDebugName(4) or '(이름 없음)'
    cmap = set(f.getBestCmap())
    f.close()

    # 라틴 = 아스키 ＋ 라틴-1 보충 ／ 한글 = 나머지 (원본에 있는 것만)
    latin = {c for c in cmap if c < 0x0250}
    korean = cmap - latin
    print(f'\n🔤 {full}  —  원본 {len(cmap)}자 ({os.path.getsize(a.src) / 1024:.0f}KB)')

    jobs = [] if a.only == 'chip' else [('latin', latin), ('korean', korean)]
    chip_chars = None
    if a.chars:
        want = {ord(c) for c in a.chars if not c.isspace()}
        miss = want - cmap
        if miss:
            # ⛔ 없는 글자를 조용히 넘기면 칸에서 그 글자만 다른 글씨로 나온다 — 여기서 말한다
            print('   ⚠️ 원본에 없는 글자 —', ''.join(chr(c) for c in sorted(miss)))
        got = want & cmap
        jobs.append(('chip', got))
        chip_chars = ''.join(chr(c) for c in sorted(got))

    tot = 0
    for tag, codes in jobs:
        p = os.path.join(a.out, f'{a.key}-{tag}-{a.weight}.woff2')
        n = cut(a.src, codes, p, tag)
        tot += n or 0

    # 🗂🗂 **칩 벌에 «무슨 글자»가 들었는지 옆에 적어 둔다** (2026-08-07)
    #    ⛔ 왜 = 검사(`check-fontchip.mjs`)가 woff2 를 읽으려고 파이썬 fontTools 를 불렀는데
    #       **CI(깃허브)엔 fontTools 가 없다** → 로컬만 통과하고 **배포가 죽었다**(run 1128).
    #    ⭐ 만든 «그 자리»에서 적어두면 검사는 이 파일만 읽으면 된다(노드만으로 된다).
    #       손으로 적는 목록이 아니라 **자를 때 자동으로 써지는 것**이라 어긋날 수가 없다.
    if chip_chars is not None:
        man = os.path.join(a.out, 'chip-chars.json')
        try:
            with open(man, encoding='utf-8') as fp:
                data = json.load(fp)
        except Exception:
            data = {}
        data[a.key] = chip_chars
        with open(man, 'w', encoding='utf-8') as fp:
            json.dump(data, fp, ensure_ascii=False, indent=1, sort_keys=True)
            fp.write('\n')
        print(f'   🗂 chip-chars.json 갱신 — {a.key} {len(chip_chars)}자')

    print(f'   📦 합계 {tot / 1024:.1f}KB\n')


if __name__ == '__main__':
    main()
