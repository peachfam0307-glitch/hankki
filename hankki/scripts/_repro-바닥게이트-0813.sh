#!/usr/bin/env bash
# 🔬 base-guard 탈출구 검증 — 「막아야 할 것은 막고, 복구 명령은 통과하나」
#    ⛔ 2026-08-13 아침엔 되감긴 «옛 판»(탈출구 없음)이 돌아 복구 명령까지 전부 막혔다.
set -u
# 시험용 저장소는 «저장소 밖»에 만든다
T="${TMPDIR:-/tmp}/hankki-t-baseguard"
DEPLOY=claude/chatgpt-conversation-link-kvn5ph
REAL=/home/user/hankki

rm -rf "$T"; mkdir -p "$T"
git init -q --bare "$T/remote.git"
git init -q "$T/repo"; cd "$T/repo"
git config user.email a@b.c; git config user.name t
mkdir -p hankki/src; printf "v10.34\n" > hankki/src/version.js
git add -A >/dev/null; git commit -qm 옛판; git branch -M "$DEPLOY"
git remote add origin "$T/remote.git"; git push -q origin "$DEPLOY"
OLD=$(git rev-parse HEAD)
printf "v10.48\n" > hankki/src/version.js; git commit -qam 새판; git push -q origin "$DEPLOY"
NEW=$(git rev-parse HEAD)
git reset -q --hard "$OLD"          # ← 되감김: 로컬만 옛 커밋, origin/ref 는 진짜(NEW)

echo "되감김 재현: 로컬 ${OLD:0:7} · 원격 ${NEW:0:7} (원격에만 1커밋)"; echo

# base-guard 를 재현 저장소를 보도록 «복사본»에서만 바꾼다(진짜 훅은 안 건드림)
sed "s#^ROOT=/home/user/hankki#ROOT=$T/repo#" "$REAL/.claude/hooks/base-guard.sh" > "$T/bg.sh"

mkdir -p "$T/nohome"   # ⛔ 진짜 repo-sync 를 못 찾게 한다 — 「고치기 실패」 경로를 시험하는 것이다
                       #    (안 그러면 테스트가 «진짜 저장소»를 건드린다)
try() { # $1=기대(통과/막힘) $2=명령
  printf '{"tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$2")" \
    | HOME="$T/nohome" bash "$T/bg.sh" >/dev/null 2>&1
  local rc=$? got=통과
  [ "$rc" = 2 ] && got=막힘
  [ "$got" = "$1" ] && echo "  ✅ $got  $2" || echo "  ⛔ $got (기대=$1)  $2"
}

echo "── 통과해야 하는 것 (진단·복구) ──"
try 통과 "git status --short"
try 통과 "git diff hankki/src/data/basics.js"
try 통과 "git log --oneline -1"
try 통과 "git fetch origin"
try 통과 "git push -f origin HEAD:refs/heads/hold/자동회수"
try 통과 "git checkout -B $DEPLOY origin/$DEPLOY"
try 통과 "git reset --hard origin/$DEPLOY"
echo
echo "── 막아야 하는 것 (낡은 바닥을 퍼뜨림) ──"
try 막힘 "git commit -m '고침'"
try 막힘 "git checkout -b hold/새것"
try 막힘 "grep -c 주 hankki/src/data/weekly.js"
try 막힘 "node scripts/check-weekly.mjs"
try 막힘 "cp a.png b.png"
try 막힘 "git push origin claude/chatgpt-conversation-link-kvn5ph"
