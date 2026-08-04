#!/usr/bin/env bash
# 📍 위치 착각 훅 — 「없다」고 말하기 전에 «어디서 찾았는지»를 되묻는다.
#
# 왜 (2026-08-04 사고 두 건):
#   ① `ls hankki/docs/stickers/겨울…` → No such file → 나는 **"낱개 67컷이 날아갔다"** 고 말했다.
#      실제로는 cwd 가 이미 `/home/user/hankki/hankki` 라서 `hankki/hankki/docs/…` 를 찾은 것이었다.
#      **91개 파일이 멀쩡히 있었다.** 창업자에게 「작업이 날아갔다」고 잘못 알렸다.
#   ② `npm run build` → package.json 없음 (cwd 가 저장소 루트였다) → 빌드가 통째로 헛돌았다.
#
#   ⭐ 뿌리 = **이 저장소는 뿌리가 둘이다.**
#      `/home/user/hankki`        ← git 루트 (README·android·tools·_archive)
#      `/home/user/hankki/hankki` ← 앱 루트 (package.json·src·docs·scripts)
#      백그라운드 명령·컨테이너 재시작·`cd` 가 섞이면 cwd 가 둘 사이를 오간다.
#      그래서 «같은 상대경로»가 어떤 때는 맞고 어떤 때는 없다.
#
#   ⛔ 제일 나쁜 건 「없다」가 «사실»처럼 보인다는 것이다 — 오늘 그래서 잘못 보고했다.
#
# 무엇을 하나 = **막지 않는다. 알려준다.**
#   상대경로가 «지금 cwd 기준으로는 없는데» 다른 뿌리 기준으로는 «있으면» → 올바른 절대경로를 찍어준다.
#   📌 시끄러운 게이트는 죽은 게이트다 — **둘 다 없거나 둘 다 있으면 조용하다.**
set -u
IN=$(cat)
CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || true)
[ -z "$CMD" ] && exit 0

# 명령 안에 `cd` 가 이미 있으면 스스로 뿌리를 정한 것 → 통과
case "$CMD" in *"cd "*) exit 0 ;; esac

python3 - "$CMD" <<'PY'
import os, re, sys
cmd = sys.argv[1] if len(sys.argv) > 1 else ''
cwd = os.getcwd()
ROOTS = ['/home/user/hankki', '/home/user/hankki/hankki']

# 앱/저장소에서 실제로 쓰는 첫 마디만 본다 (아무 낱말이나 경로로 보지 않게)
PREF = r'(?:hankki|src|docs|scripts|tools|public|design|android|_archive|dist)'
cands = set(re.findall(r'(?<![\w./-])(' + PREF + r'/[^\s\'"|;)&]+)', cmd))
# npm/node 처럼 «경로가 안 적힌» 명령은 package.json 유무로 본다
if re.search(r'(?<![\w-])(npm|npx|pnpm|yarn)\s', cmd):
    cands.add('package.json')

msgs = []
for rel in sorted(cands):
    here = os.path.join(cwd, rel)
    if os.path.exists(here):
        continue                      # 지금 자리에서 잘 찾힌다 → 조용
    hit = [r for r in ROOTS if os.path.exists(os.path.join(r, rel))]
    if hit:
        msgs.append(f'   ⛔ `{rel}` — 지금 자리엔 «없다». 있는 곳 → {os.path.join(hit[0], rel)}')

if msgs:
    print('📍 **위치가 어긋났다 — 「없다」고 판단하기 전에 읽을 것.**\n')
    print(f'   지금 cwd = `{cwd}`')
    print('   이 저장소는 뿌리가 둘이다 — `/home/user/hankki`(git) · `/home/user/hankki/hankki`(앱)\n')
    for m in msgs:
        print(m)
    print('\n   👉 **절대경로로 쓰거나 `cd` 를 명시**할 것.')
    print('   ⛔ 2026-08-04 에 이걸로 «작업이 날아갔다»고 잘못 보고했다(멀쩡히 있었다).')
    sys.exit(2)      # 막는다 — 잘못된 「없다」가 창업자에게 나가는 것보다 낫다
PY
