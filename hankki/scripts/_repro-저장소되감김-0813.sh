#!/usr/bin/env bash
# 🔬 2026-08-13 아침 사고 재현 — 「fetch 실패 → 옛 origin ref → BEHIND=0 → 안 낡았다」
#    규칙 12: 옛 코드로 «진짜 걸리는지» 먼저 확인하고, 그 다음 새 코드가 잡는지 본다.
set -u
# 시험용 저장소는 «저장소 밖»에 만든다 — 여기 만들면 git status 가 지저분해진다
T="${TMPDIR:-/tmp}/hankki-t-repo-sync"
DEPLOY=claude/chatgpt-conversation-link-kvn5ph
REAL=/home/user/hankki

rm -rf "$T"; mkdir -p "$T/home"
git init -q --bare "$T/remote.git"
git init -q "$T/repo"
cd "$T/repo"
git config user.email a@b.c; git config user.name t; git config commit.gpgsign false
mkdir -p hankki/src .claude/hooks
printf "export const APP_VERSION = 'v10.34'\n" > hankki/src/version.js
git add -A >/dev/null; git commit -qm "옛판"
git branch -M "$DEPLOY"
git remote add origin "$T/remote.git"
git push -q origin "$DEPLOY"
OLD=$(git rev-parse HEAD)
printf "export const APP_VERSION = 'v10.48'\n" > hankki/src/version.js
git commit -qam "새판(원격에만)"
git push -q origin "$DEPLOY"
NEW=$(git rev-parse HEAD)

# ── 되감김 재현 ────────────────────────────────────────────────────────────
#    ⑴ 로컬이 hold/* 브랜치에 옛 커밋으로 서 있다  ⑵ origin/ref 도 «옛 디스크의 낡은 값»
#    ⑶ 네트워크가 막혀 fetch 가 실패한다
git checkout -q -b hold/테스트 "$OLD"
git update-ref "refs/remotes/origin/$DEPLOY" "$OLD"
git branch -q -f "$DEPLOY" "$OLD"
git remote set-url origin "$T/없는곳.git"

echo "─── 재현 상태 ───"
echo "  로컬 HEAD      = ${OLD:0:7} (v10.34)"
echo "  진짜 원격 tip  = ${NEW:0:7} (v10.48)"
echo "  로컬 origin/ref= $(git rev-parse --short "refs/remotes/origin/$DEPLOY")  ← 낡음"
echo "  fetch          = 막힘"
echo

run_one() { # $1=이름 $2=스크립트
  printf '{"source":"resume"}' | HOME="$T/home" CLAUDE_PROJECT_DIR="$T/repo" bash "$2" >"$T/$1.out" 2>&1
  echo "$1: exit=$? · 출력=[$(tr '\n' ' ' < "$T/$1.out" | cut -c1-70)]"
}

echo "─── ① 옛 판 (원격 = 배포된 것) ───"
git -C "$REAL" show "origin/$DEPLOY:.claude/hooks/repo-sync.sh" > "$T/old.sh"
run_one old "$T/old.sh"
echo "   로그 마지막 = $(tail -1 /tmp/hankki-sync.log)"
echo "   → 이 판이 「안 낡았다」로 끝나면 «오늘 아침 그대로 재현된 것»"
echo

echo "─── ② 새 판 ───"
run_one new "$REAL/.claude/hooks/repo-sync.sh"
echo "   로그 마지막 = $(tail -1 /tmp/hankki-sync.log)"
echo "   → exit=3 이라야 한다 (원격을 못 봤으니 «판단하지 않는다»)"
echo

# ── ③ 훅 복사가 낡은 판을 덮지 않나 ───────────────────────────────────────
echo "─── ③ 낡은 훅이 git 밖 훅을 덮나 ───"
rm -rf "$T/home/.claude"; mkdir -p "$T/home/.claude/hooks"
printf '좋은판\n' > "$T/home/.claude/hooks/base-guard.sh"
printf '낡은판\n' > "$T/repo/.claude/hooks/base-guard.sh"
for n in old new; do
  cp "$T/home/.claude/hooks/base-guard.sh" "$T/home/.claude/hooks/.bak" 2>/dev/null
  printf '좋은판\n' > "$T/home/.claude/hooks/base-guard.sh"
  S="$T/old.sh"; [ "$n" = new ] && S="$REAL/.claude/hooks/repo-sync.sh"
  printf '{"source":"resume"}' | HOME="$T/home" CLAUDE_PROJECT_DIR="$T/repo" bash "$S" >/dev/null 2>&1
  echo "   $n → git 밖 base-guard = $(cat "$T/home/.claude/hooks/base-guard.sh")"
done
echo "   → 새 판은 «좋은판» 그대로라야 한다 (낡은 저장소 판으로 안 덮음)"
echo

# ── ④ 2차 그물 표식 ───────────────────────────────────────────────────────
echo "─── ④ sync-guard 표식 ───"
G="$REAL/.claude/hooks/sync-guard.sh"
BOOT="$(cat /proc/sys/kernel/random/boot_id)"
GOOD="$(git -C "$REAL" rev-parse HEAD)"
chk() { # $1=이름 $2=표식내용
  printf '%s' "$2" > /tmp/hankki-synced
  local t0 t1
  t0=$(date +%s%N)
  printf '{}' | timeout 5 bash -c "MARK=/tmp/hankki-synced; source /dev/stdin" </dev/null >/dev/null 2>&1
  # 실제 훅을 돌리되 «즉시 통과하나»만 본다 — 통과하면 아주 빠르다
  printf '{}' | CLAUDE_PROJECT_DIR="$REAL" timeout 30 bash "$G" >/dev/null 2>&1
  t1=$(date +%s%N)
  echo "   $1 → $(( (t1-t0)/1000000 ))ms  $( [ $(( (t1-t0)/1000000 )) -lt 200 ] && echo '(즉시 통과)' || echo '(재검사 돎)' )"
}
chk "옛 형식(시각만) '1754901234'" "1754901234"
chk "새 형식·유효한 sha" "$BOOT $GOOD"
chk "새 형식·없는 sha" "$BOOT 0000000000000000000000000000000000000000"
echo "   → 옛 형식과 «없는 sha»는 재검사가 돌아야 한다(＝되감김을 잡는다)"
