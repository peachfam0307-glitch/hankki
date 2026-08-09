#!/usr/bin/env bash
# 🔄🔄 저장소 자동 맞추기 — 「낡은 디스크」를 세션 시작에 «고쳐준다». (2026-08-09 신설)
#
# 📮 창업자 2026-08-09 — *"왜 저장소는 맨날 낡아?"* · *"이거 해결하자. 매번 낡는다고 하니까. 시스템만들어"*
#
# ⛔ 무슨 일이 나는가 = **컨테이너가 옛 스냅샷으로 되살아난다.**
#    2026-08-09 11:36 KST 에 세션을 열었더니 디스크의 마지막 활동이 **2026-08-07 08:05 KST** 였다.
#    이틀 낡았고, 그동안 나간 v9.88~v10.06 이 디스크엔 «하나도» 없었다.
#    reflog 에 8/7 커밋이 그대로 살아 있다 → **새로 받아오는 게 아니라 옛 디스크를 되살린다.**
#    ⚠️ **「왜 하필 그 시점인가」는 우리가 모른다.** 그건 우리가 못 건드리는 쪽이다.
#    ⭐ **몰라도 해결은 된다** — 원격(GitHub)이 항상 맞고, 우리는 매일 push 하니까.
#
# 📌 **왜 「알려주기」로는 부족한가** (규칙 19 — 「알려주는 것」과 「지켜주는 것」은 다르다)
#    `repo-guard.sh` 가 이미 «알려주고» 있었다. 그런데 알려주기만 하니 **매 세션 클로드가 손으로**
#    ①상태 재고 ②잃을 게 있나 확인하고 ③보험 브랜치에 담고 ④되돌린다 — 2026-08-09 에 10분 걸렸다.
#    그게 매번이면 그건 고쳐진 게 아니다.
#
# 🔒 **왜 이제는 자동으로 고쳐도 되는가**
#    `repo-guard.sh` 는 *"⛔자동으로 안 고친다 — reset --hard 는 안 커밋된 변경을 날린다"* 고 적어뒀고
#    **그때는 맞았다.** 지금은 **버리기 전에 «먼저 담는» 단계**가 이 훅 안에 있다.
#    ⭐ **담는 게 먼저면 `reset` 은 되돌릴 수 있는 일이 된다.**
#    ⛔⛔ **담기(push)에 실패하면 «절대» reset 하지 않는다.** 담지 못했으면 버리지 않는다.
#
# ⭐ 맞으면 **아무 말도 안 한다** — 시끄러운 게이트는 죽은 게이트다.
set -u
cat >/dev/null 2>&1 || true    # 표준입력 비우기(다른 훅과 같은 방식)

REPO="${CLAUDE_PROJECT_DIR:-/home/user/hankki}"
DEPLOY="claude/chatgpt-conversation-link-kvn5ph"

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# ⏱ 세션 시작을 붙잡지 않는다 — 느리거나 막히면 포기하고 옛 훅(repo-guard)에 넘긴다
run() { if command -v timeout >/dev/null 2>&1; then timeout "$1" "${@:2}"; else "${@:2}"; fi; }

# 원격 «전부»를 가져온다 — 「이 커밋이 다른 브랜치에 이미 있나」를 정확히 보려면 전부 필요하다
#   (배포 브랜치만 가져오면 hold/* 에 이미 올려둔 커밋을 「잃을 것」으로 잘못 세어 브랜치가 쌓인다)
run 30 git fetch origin --quiet >/dev/null 2>&1 || run 20 git fetch origin "$DEPLOY" --quiet >/dev/null 2>&1 || true

REMOTE="$(git rev-parse --verify --quiet "origin/$DEPLOY" 2>/dev/null || true)"
[ -n "$REMOTE" ] || exit 0        # 원격을 못 봤다 → 판단 근거가 없다. ⛔짐작으로 손대지 않는다

BR="$(git branch --show-current 2>/dev/null || true)"
LOCAL="$(git rev-parse HEAD 2>/dev/null || true)"
[ -n "$LOCAL" ] || exit 0
DIRTY="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

# ✅ 이미 맞다 → 조용히 통과
if [ "$BR" = "$DEPLOY" ] && [ "$LOCAL" = "$REMOTE" ] && [ "$DIRTY" = "0" ]; then exit 0; fi

# ── 어긋났다 ─────────────────────────────────────────────────────────────
BEHIND="$(git rev-list --count "HEAD..origin/$DEPLOY" 2>/dev/null || echo 0)"
AHEAD="$(git rev-list --count "origin/$DEPLOY..HEAD" 2>/dev/null || echo 0)"
VER="$(grep -o "v[0-9]\+\.[0-9]\+" hankki/src/version.js 2>/dev/null | head -1 || true)"

# 🔎 **정말 잃을 게 있나** — 원격 «어디에도» 없는 커밋만 센다.
#    (2026-08-09 실제: 원격에 없어 보이던 커밋이 배포 브랜치에 이미 들어가 있었다)
ORPHAN=0
if [ "${AHEAD:-0}" != "0" ]; then
  for c in $(git rev-list "origin/$DEPLOY..HEAD" 2>/dev/null); do
    [ -n "$(git branch -r --contains "$c" 2>/dev/null | head -1)" ] || ORPHAN=$((ORPHAN + 1))
  done
fi

# 디스크가 몇 시간 낡았나 — 마지막 커밋 시각으로 잰다(창업자에게 보여줄 «사실» 한 줄)
AGE="$(git log -1 --format=%cr 2>/dev/null || true)"

SAVED=""
NOTE=""

# ── ① 잃을 게 있으면 «먼저 담는다» ────────────────────────────────────────
if [ "$DIRTY" != "0" ] || [ "$ORPHAN" != "0" ]; then
  STAMP="$(TZ=Asia/Seoul date +%m%d-%H%M 2>/dev/null || date +%m%d-%H%M)"
  SAVE="hold/자동회수-$STAMP"
  # ⛔ hold/* 는 배포 워크플로가 안 본다 → 이 push 로 «배포가 돌지 않는다»(규칙 13과 같은 자리)
  # ⭐ `-B` 는 «지금 HEAD 에서» 브랜치를 만들고 워킹트리를 그대로 둔다 — 그래서 안 커밋된 것도 같이 담긴다
  git checkout -q -B "$SAVE" >/dev/null 2>&1
  git add -A >/dev/null 2>&1
  git -c user.email=noreply@anthropic.com -c user.name=Claude \
      commit -q -m "🛟 낡은 디스크 워킹트리 자동 보관 (버리기 전 보험 · $STAMP KST)

세션 시작에 저장소가 원격보다 낡아 있어서 원격으로 맞추기 «전»에 통째로 담아둔다.
안 커밋된 변경 ${DIRTY}개 · 원격 어디에도 없던 커밋 ${ORPHAN}개.
⛔ 되살릴 게 있으면: git checkout $SAVE" >/dev/null 2>&1 || true

  if run 90 git push -q -u origin "$SAVE" >/dev/null 2>&1; then
    SAVED="$SAVE"
  else
    # ⛔⛔ 담지 못했다 → **버리지 않는다.** 옛 훅(repo-guard)이 손으로 하라고 안내한다.
    echo ""
    echo "⚠️⚠️ **저장소가 낡았는데 «담기»에 실패했다 — 자동으로 안 맞췄다.**"
    echo "   잃을 것 = 안 커밋된 변경 ${DIRTY}개 · 원격에 없는 커밋 ${ORPHAN}개 (브랜치 \`$SAVE\` 에 커밋은 됐다)"
    echo "   👉 손으로: \`git push -u origin $SAVE\` 로 담은 «뒤에» 배포 브랜치로 되돌린다."
    echo ""
    exit 0
  fi
fi

# ── ② 원격으로 맞춘다 ────────────────────────────────────────────────────
LOCK_BEFORE="$(git rev-parse "HEAD:hankki/package-lock.json" 2>/dev/null || true)"
git checkout -q "$DEPLOY" >/dev/null 2>&1 || git checkout -q -B "$DEPLOY" "origin/$DEPLOY" >/dev/null 2>&1
git reset --hard "origin/$DEPLOY" >/dev/null 2>&1 || { echo ""; echo "⚠️ 저장소 자동 맞추기 실패 — 손으로 확인할 것."; echo ""; exit 0; }
LOCK_AFTER="$(git rev-parse "HEAD:hankki/package-lock.json" 2>/dev/null || true)"

NEWVER="$(grep -o "v[0-9]\+\.[0-9]\+" hankki/src/version.js 2>/dev/null | head -1 || true)"

# ── ③ 한 줄로 보고 (⛔길게 쓰지 않는다 — 세션 시작마다 읽는 글이다) ────────
echo ""
echo "🔄 **저장소가 낡아 있어서 원격으로 맞췄다.**"
echo "   전 = \`${BR:-(없음)}\` · ${VER:-?} · 마지막 커밋 ${AGE:-?}   →   후 = \`$DEPLOY\` · ${NEWVER:-?}"
[ "${BEHIND:-0}" != "0" ] && echo "   원격이 ${BEHIND}커밋 앞서 있었다."
if [ -n "$SAVED" ]; then
  echo "   💾 버리기 «전»에 통째로 담아뒀다 → \`$SAVED\` (되살리려면 \`git checkout $SAVED\`)"
else
  echo "   ✅ 잃을 것 0 — 안 커밋된 변경도 원격에 없던 커밋도 없었다."
fi
if [ -n "$LOCK_BEFORE" ] && [ -n "$LOCK_AFTER" ] && [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  echo "   ⚠️ \`package-lock.json\` 이 바뀌었다 → 빌드 전에 \`cd hankki && npm ci\`"
fi
echo "   📌 이제 이 저장소는 「지금」이다. 줄 번호·버전·파일 유무를 여기서부터 판단해도 된다."
echo ""

exit 0
