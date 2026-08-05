#!/usr/bin/env bash
# 🔒🔒 저장소 가드 — 세션이 「낡은 시점」으로 떴는지 본다. (2026-08-06 신설)
#
#   ⛔ 실제로 두 번 터졌다 (2026-08-06 새벽 1:40 · 아침 8:17):
#      컨테이너가 새로 뜨면서 로컬이 **hold/검수대기 · v9.52 · 어젯밤 커밋 0** 상태였다.
#      그 상태로 코드를 읽고 창업자에게 답할 뻔했다 — **읽은 줄 번호가 실제와 달랐다**(222 vs 267).
#      원격엔 전부 있었으니 잃은 건 없었지만, **틀린 답을 하는 건 잃는 것보다 나쁘다.**
#
#   📌 창업자 원칙(규칙 12) = *"규칙만 만들면 뭐해 안지키는데."* → 규칙이 아니라 **장치**로.
#   ⭐ 맞으면 **아무 말도 안 한다** — 시끄러운 게이트는 죽은 게이트다.
#   ⛔ **자동으로 안 고친다.** `reset --hard` 는 되돌릴 수 없고 안 커밋된 변경을 날린다.
#      알리기만 하고 «고칠지»는 클로드가 상태를 보고 정한다.
set -u
cat >/dev/null 2>&1 || true    # 표준입력 비우기(다른 훅과 같은 방식)

REPO="${CLAUDE_PROJECT_DIR:-/home/user/hankki}"
DEPLOY="claude/chatgpt-conversation-link-kvn5ph"

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

BR="$(git branch --show-current 2>/dev/null || true)"

# 원격 최신을 가져온다 — 느리거나 막히면 그냥 포기한다(세션 시작을 붙잡지 않는다)
if command -v timeout >/dev/null 2>&1; then
  timeout 20 git fetch origin "$DEPLOY" --quiet >/dev/null 2>&1 || true
else
  git fetch origin "$DEPLOY" --quiet >/dev/null 2>&1 || true
fi

LOCAL="$(git rev-parse HEAD 2>/dev/null || true)"
REMOTE="$(git rev-parse "origin/$DEPLOY" 2>/dev/null || true)"

# 원격을 못 봤으면 판단할 근거가 없다 → 조용히 통과 (⛔짐작해서 경고하지 않는다)
[ -n "$REMOTE" ] || exit 0
[ -n "$LOCAL" ] || exit 0

# ✅ 배포 브랜치 · 원격과 같음 → 아무 말 안 한다
if [ "$BR" = "$DEPLOY" ] && [ "$LOCAL" = "$REMOTE" ]; then exit 0; fi

# ── 어긋났다 ─────────────────────────────────────────────────────────────
VER="$(grep -o "v[0-9]\+\.[0-9]\+" hankki/src/version.js 2>/dev/null | head -1 || true)"
BEHIND="$(git rev-list --count "HEAD..origin/$DEPLOY" 2>/dev/null || echo '?')"
AHEAD="$(git rev-list --count "origin/$DEPLOY..HEAD" 2>/dev/null || echo '?')"
DIRTY="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

echo ""
echo "⛔⛔ **저장소가 「지금」이 아니다 — 코드를 읽기 전에 이것부터 고친다.**"
echo ""
echo "   지금 브랜치 = \`${BR:-(없음)}\`   ·   배포 브랜치 = \`$DEPLOY\`"
echo "   지금 앱 버전 = ${VER:-?}"
echo "   원격보다 뒤 = ${BEHIND}커밋   ·   원격에 없는 것 = ${AHEAD}커밋   ·   안 커밋된 변경 = ${DIRTY}개"
echo ""

if [ "$DIRTY" != "0" ]; then
  echo "   ⚠️⚠️ **안 커밋된 변경이 ${DIRTY}개 있다 — 먼저 살펴라.**"
  echo "      \`git status\` 로 보고, 살릴 것이면 커밋·푸시하거나 딴 데 옮긴 «뒤에» 아래를 한다."
  echo ""
fi

if [ "$AHEAD" != "0" ] && [ "$AHEAD" != "?" ]; then
  echo "   ⚠️⚠️ **원격에 없는 커밋이 ${AHEAD}개 있다 — 되돌리면 «사라진다».**"
  echo "      먼저 확인: \`git log --oneline origin/$DEPLOY..HEAD\`"
  echo "      다른 원격 브랜치에 있는지: \`git branch -r --contains <커밋>\`"
  echo "      ⛔ 확인 전엔 \`reset --hard\` 금지."
  echo ""
fi

echo "   👉 **안전하면 이렇게 되찾는다**"
echo "      git checkout $DEPLOY"
echo "      git reset --hard origin/$DEPLOY"
echo ""
echo "   📌 **읽은 줄 번호·버전·파일 유무를 여기서 판단하지 말 것** — 고친 «뒤에» 다시 본다."
echo "      (2026-08-06 실제 사고: 낡은 판을 읽고 267줄을 222줄이라 말할 뻔했다)"
echo ""

exit 0
