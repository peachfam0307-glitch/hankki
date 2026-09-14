#!/usr/bin/env python3
"""안 바뀌면 «죽는» 문자열 치환 — 조용한 실패를 없앤다.

왜 있나 (2026-08-02 사고):
  창업자가 두부 양을 고치라 했고 나는 파이썬으로 `s.replace(옛것, 새것)` 을 돌렸다.
  그런데 찾을 문자열이 화면과 «한 글자» 달랐다(`\\n\\n` 이 글자로 새어 있었다).
  → **`str.replace` 는 못 찾아도 아무 말 없이 원문을 그대로 돌려준다.**
  → 파일은 멀쩡히 저장됐고, 나는 "고쳤어"라고 말했고, 실제로는 안 고쳐졌다.
  창업자가 화면에서 발견할 때까지 아무도 몰랐다.

⭐ 뿌리 = 「실패가 성공처럼 보인다」. 그래서 도구가 대신 소리를 지른다.
   - 못 찾으면 → **exit 1** (＋ 비슷한 줄을 찾아 「이거 아니냐」고 보여준다)
   - 찾은 개수가 기대와 다르면 → **exit 1**
   - 바꾼 뒤 파일이 그대로면 → **exit 1**

쓰는 법:
    python3 tools/subst.py <파일> --old '옛 문자열' --new '새 문자열' [--count N]
    python3 tools/subst.py <파일> --old-file a.txt --new-file b.txt      # 여러 줄일 때
    python3 tools/subst.py <파일> --old '…' --new '…' --dry             # 미리보기만

⛔ 이 도구를 안 쓰고 파이썬·sed 로 맨손 치환하면 `.claude/hooks/subst-guard.sh` 가 막는다.
   (Edit 툴은 못 찾으면 스스로 에러를 내니까 그대로 써도 된다 — 막는 건 «조용한» 쪽뿐이다)
"""
import argparse, difflib, io, sys


def read(p):
    return io.open(p, encoding='utf-8').read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--old'); ap.add_argument('--new')
    ap.add_argument('--old-file'); ap.add_argument('--new-file')
    ap.add_argument('--count', type=int, default=None, help='몇 군데 바뀌어야 하는지(기본: 1개 이상이면 통과)')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    old = read(a.old_file) if a.old_file else a.old
    new = read(a.new_file) if a.new_file else (a.new if a.new is not None else '')
    if old is None:
        print('⛔ --old 나 --old-file 이 있어야 한다', file=sys.stderr); return 2

    src = read(a.file)
    hits = src.count(old)

    if hits == 0:
        print(f'\n⛔ 못 찾았다 — {a.file} 에 그 문자열이 없다.\n', file=sys.stderr)
        print(f'   찾던 것: {old[:120]!r}\n', file=sys.stderr)
        # 「비슷한 줄」을 보여준다. 사고의 실체가 대개 «한 글자 차이» 라서 이게 바로 답이 된다.
        head = old.strip().splitlines()[0][:40] if old.strip() else ''
        if head:
            lines = [l.strip() for l in src.splitlines() if l.strip()]
            # ⭐ 두 갈래로 찾는다. 사고의 실체가 대개 «앞부분은 맞고 뒤가 다르다» 라서
            #    ①「줄 전체가 비슷한가」만 보면 못 찾는다(긴 줄에 파묻힌다) → ②「그 토막을 품고 있는 줄」도 본다.
            near = [l for l in lines if head[:12] and head[:12] in l][:3]
            if not near:
                near = difflib.get_close_matches(head, lines, n=3, cutoff=0.4)
            if near:
                print('   혹시 이거였나 (파일에 실제로 있는 줄):', file=sys.stderr)
                for n in near:
                    print(f'     {n[:150]!r}', file=sys.stderr)
                print('   ↑ 여기 `\\n` 같은 게 «글자로» 박혀 있으면 그게 범인이다.', file=sys.stderr)
        print('\n👉 파일을 «먼저 읽어» 실제 글자를 확인하고 다시 시도할 것.', file=sys.stderr)
        print('   특히 `\\n`·`\\t` 가 글자로 새어 있는지 — 그게 2026-08-02 사고의 정체였다.\n', file=sys.stderr)
        return 1

    if a.count is not None and hits != a.count:
        print(f'\n⛔ 개수가 다르다 — {hits}군데 있는데 {a.count}군데를 기대했다.', file=sys.stderr)
        print('   너무 많으면 앞뒤를 더 붙여 «한 군데만» 집히게 하고,', file=sys.stderr)
        print('   일부러 여러 군데면 --count 를 실제 수로 줄 것.\n', file=sys.stderr)
        return 1

    out = src.replace(old, new)
    if out == src:
        print(f'\n⛔ 바꿨는데 파일이 그대로다 — 옛것과 새것이 같은 것 아닌가.\n', file=sys.stderr)
        return 1

    if a.dry:
        print(f'🔎 미리보기 — {a.file} 에서 {hits}군데 바뀐다 (저장 안 함)')
        for l in difflib.unified_diff(src.splitlines(), out.splitlines(), lineterm='', n=1):
            if l.startswith(('+', '-')) and not l.startswith(('+++', '---')):
                print('  ' + l[:200])
        return 0

    io.open(a.file, 'w', encoding='utf-8').write(out)
    print(f'✅ {a.file} — {hits}군데 바꿨다 ({len(src)} → {len(out)}자)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
