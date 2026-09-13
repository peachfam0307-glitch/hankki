#!/usr/bin/env bash
# 🍎🛟 되감기 훅(repo-sync.sh) 갈래 재현판 — 2026-09-08 (창업자 "훅 고쳐도 돼")
#
# 12:24 사고 = 아이폰 갈래에서 일하는 중에 배포 갈래가 앞서자 훅이 배포 갈래로 갈아타 안 커밋 15개를 지웠다.
# 이 판은 «임시 저장소 둘»(가짜 origin ＋ 작업본)을 만들어 훅을 그대로 돌린다. 진짜 저장소는 «안» 건드린다.
#
# 재는 것
#   ① 다른 갈래(원격 있음) ＋ 배포 갈래가 앞섬 ＋ 안 커밋 파일 있음 → 갈래 그대로 · 파일 그대로 · 배포 갈래로 안 감
#   ② 다른 갈래(원격에 없음) ＋ 배포 갈래가 앞섬 → 갈래 그대로
#   ③ 다른 갈래가 «자기 원격»보다 뒤(되감김) ＋ 깨끗함 → 자기 원격으로 앞으로 당김(ff) · 여전히 그 갈래
#   ④ (회귀) 배포 갈래에 서 있고 뒤짐 ＋ 깨끗함 → 예전처럼 배포 갈래를 원격에 맞춤
set -u
HOOK="${1:-/home/user/hankki/.claude/hooks/repo-sync.sh}"
DEPLOY="claude/chatgpt-conversation-link-kvn5ph"
T="$(mktemp -d)"
export HOME="$T/home"; mkdir -p "$HOME"
bad=0
say() { printf '  %s %s\n' "$1" "$2"; [ "$1" = "✅" ] || bad=$((bad+1)); }

# 가짜 origin — 커밋 4개 · 배포 갈래
git init -q --bare "$T/o"
git init -q "$T/seed"; cd "$T/seed"
git config user.email t@t; git config user.name t
mkdir -p hankki/src
for i in 1 2 3 4; do echo "export const APP_VERSION = 'v0.$i'" > hankki/src/version.js; echo "$i" > f$i.txt; git add -A; git commit -q -m "c$i"; done
git branch -M "$DEPLOY"
git push -q "$T/o" "$DEPLOY"
git --git-dir="$T/o" symbolic-ref HEAD "refs/heads/$DEPLOY"   # clone 때 「remote HEAD 없음」 경고를 없앤다

fresh() {  # 작업본을 새로 깐다 — 배포 갈래 c2 에 서 있게(원격은 c4 → 2커밋 앞섬)
  cd "$T"; rm -rf "$T/r"; git clone -q "$T/o" "$T/r"; cd "$T/r"; git config user.email t@t; git config user.name t
  git checkout -q "$DEPLOY"; git reset -q --hard HEAD~2
}
runhook() { CLAUDE_PROJECT_DIR="$T/r" bash "$HOOK" <<<'{"source":"startup"}' >/dev/null 2>&1; echo $?; }

echo
echo "🍎🛟 되감기 훅 — 다른 갈래에서는 배포 갈래로 안 옮긴다"
echo

# ① 다른 갈래 · 원격 있음 · 배포 앞섬 · 안 커밋 있음
#    ⭐ 안 커밋 = «추적 중인 파일을 고친 것»(f1.txt) — 12:24 에 실제로 날아간 게 이 종류다(untracked 는 checkout -f 도 안 지운다)
fresh; git checkout -q -b feat/x; git push -q -u origin feat/x; echo dirty > f1.txt
rc=$(runhook)
[ "$(git branch --show-current)" = "feat/x" ] && say ✅ "① 갈래 그대로 (feat/x · rc=$rc)" || say ⛔ "① 갈래가 바뀌었다 → $(git branch --show-current)"
[ "$(cat f1.txt)" = "dirty" ] && say ✅ "  ①-b 안 커밋 «고침»이 살아 있다" || say ⛔ "  ①-b 안 커밋 고침이 지워졌다 (f1.txt=$(cat f1.txt))"

# ② 다른 갈래 · 원격 없음
fresh; git checkout -q -b local/only
rc=$(runhook)
[ "$(git branch --show-current)" = "local/only" ] && say ✅ "② 원격 없는 갈래도 그대로 (rc=$rc)" || say ⛔ "② 갈래가 바뀌었다 → $(git branch --show-current)"

# ③ 다른 갈래가 자기 원격보다 뒤 · 깨끗 → ff
fresh; git checkout -q -b feat/y; echo y > y.txt; git add -A; git commit -q -m y; git push -q -u origin feat/y
git reset -q --hard HEAD~1   # 되감김 흉내 (자기 원격보다 1 뒤)
rc=$(runhook)
[ "$(git branch --show-current)" = "feat/y" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/feat/y)" ] && say ✅ "③ 자기 원격으로 앞으로 당겼고 갈래 그대로 (rc=$rc)" || say ⛔ "③ 실패 — 갈래=$(git branch --show-current) HEAD≠origin"

# ⑤ 다른 갈래에 있어도 «로컬 배포 갈래 ref» 는 원격에 맞춰 둔다(base-guard 가 되감김으로 오해하지 않게) · 갈래·파일은 그대로
fresh; git checkout -q -b feat/z; git push -q -u origin feat/z; echo dirty > f2.txt
rc=$(runhook)
[ "$(git rev-parse "$DEPLOY")" = "$(git rev-parse "origin/$DEPLOY")" ] && [ "$(git branch --show-current)" = "feat/z" ] && [ "$(cat f2.txt)" = "dirty" ] && say ✅ "⑤ 로컬 배포 ref 만 ff (갈래 feat/z · 고침 그대로 · rc=$rc)" || say ⛔ "⑤ 실패 — 배포ref=$(git rev-parse --short "$DEPLOY") 원격=$(git rev-parse --short "origin/$DEPLOY") 갈래=$(git branch --show-current)"

# ④ 회귀 — 배포 갈래 · 뒤짐 · 깨끗 → 맞춘다
fresh
rc=$(runhook)
[ "$(git branch --show-current)" = "$DEPLOY" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/$DEPLOY)" ] && say ✅ "④ 배포 갈래에선 예전처럼 원격에 맞춘다 (rc=$rc)" || say ⛔ "④ 배포 갈래 맞추기가 깨졌다 (HEAD=$(git rev-parse --short HEAD))"

cd /; rm -rf "$T"
echo
[ "$bad" = 0 ] && echo "✅ 훅은 «지금 갈래»를 본다 — 다른 갈래에선 절대 배포 갈래로 안 옮긴다" || echo "⛔ ${bad}칸 실패"
exit $([ "$bad" = 0 ] && echo 0 || echo 1)
