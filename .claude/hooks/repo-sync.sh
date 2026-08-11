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

# ⛔⛔ **안전장치 ① — `compact` 때는 «절대» 손대지 않는다.**
#    SessionStart 훅은 세션이 새로 뜰 때만 도는 게 아니라 **대화가 길어져 압축될 때도 돈다.**
#    그건 «세션 도중»이라 워킹트리에 작업 «중»인 것이 있다. 거기서 되돌리면 그날 작업이 날아간다.
#    (2026-08-09 신설 직후 실측으로 잡았다 — 규칙 12)
INPUT="$(cat 2>/dev/null || true)"
SOURCE="$(printf '%s' "$INPUT" | tr ',{}' '\n\n\n' | grep '"source"' | head -1 | sed 's/.*"source"[[:space:]]*:[[:space:]]*"\([a-z]*\)".*/\1/' || true)"

# 🐾🐾 **발자국을 남긴다** (2026-08-11 신설)
#   ⛔⛔ 그날 아침 디스크가 되감겼는데 이 훅이 «안 돌았나 / 돌았는데 조용히 멈췄나»를 **가를 수가 없었다.**
#      `hold/자동회수` 에 그날 커밋이 없고 브리핑에 이 훅의 말이 한 줄도 없었지만, 그건 «안 돌았다»의
#      증거가 아니라 **「증거가 없다」** 였다. 장치가 있어도 «돌았는지»를 모르면 고칠 수가 없다.
#   ⭐ 그래서 **모든 갈림길에서 한 줄씩** 남긴다. 다음엔 이 파일만 보면 안다.
#   ⚠️ `/tmp` 에 두는 이유 = 컨테이너와 생명주기가 같다. 되감김 때 «이 파일이 비어 있는 것» 자체가 신호다.
SYNCLOG="/tmp/hankki-sync.log"
note() { printf '%s  %s\n' "$(TZ=Asia/Seoul date '+%m-%d %H:%M:%S' 2>/dev/null || date '+%m-%d %H:%M:%S')" "$1" >> "$SYNCLOG" 2>/dev/null || true; }
note "▶ 시작 (source=${SOURCE:-?})"

[ "$SOURCE" = "compact" ] && { note "· compact 라 비켜남"; exit 0; }

REPO="${CLAUDE_PROJECT_DIR:-/home/user/hankki}"
DEPLOY="claude/chatgpt-conversation-link-kvn5ph"

cd "$REPO" 2>/dev/null || { note "⛔ cd 실패 ($REPO)"; exit 0; }
git rev-parse --git-dir >/dev/null 2>&1 || { note "⛔ git 저장소가 아니다"; exit 0; }

# 🕳 base-guard 를 «git 밖»으로 복사한다 (2026-08-10) — ⭐일찍 끝나는 길보다 «위»에 둔다
#   ⛔ 훅을 저장소 «안»에만 두면 **브랜치를 옮기는 순간 꺼진다** — 실제로 그랬다.
#      `hold/…` 로 옮기니 그 브랜치 바닥엔 훅이 없어서 무방비가 됐다.
#   ⭐ 그래서 «도는 것»은 `~/.claude/hooks/`(git 밖 · `~/.claude/settings.json` 이 부른다),
#      «원본»은 저장소에 두어 버전 관리한다. 세션마다 여기서 덮어 써 둘이 안 어긋나게 한다.
#   ⚠️ 이 줄이 «BEHIND==0 이면 그냥 끝」보다 아래 있으면 평소엔 한 번도 안 돈다 — 그래서 여기다.
#   ⭐⭐ [2026-08-12 확장] base-guard «하나»만 복사하던 것을 **훅 셋 ＋ 부르는 설정까지**로 넓혔다.
#      ⛔ 어제까지는 파일만 복사하고 **`~/.claude/settings.json` 을 «안 만들었다»** →
#         git 밖 복사본이 있어도 **아무도 안 불러서 한 번도 안 돌았다.** 절반만 된 설계였다.
#         (2026-08-12 아침 실측 = `/root/.claude/settings.json` 이 아예 없었다)
#      📌 **「파일을 둔 것」과 「불리는 것」은 다른 말이다.**
for f in base-guard.sh sync-guard.sh repo-sync.sh; do
  if [ -f "$REPO/.claude/hooks/$f" ]; then
    mkdir -p "$HOME/.claude/hooks" 2>/dev/null
    cp -f "$REPO/.claude/hooks/$f" "$HOME/.claude/hooks/$f" 2>/dev/null
    chmod +x "$HOME/.claude/hooks/$f" 2>/dev/null
  fi
done
# 🔗 부르는 설정도 «git 밖»에 유지한다 — 없으면 만들고, 있으면 빠진 것만 채운다(덮어쓰지 않는다).
if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PYEOF' >/dev/null 2>&1 || true
import json, os
p = os.path.expanduser('~/.claude/settings.json')
d = {}
if os.path.exists(p):
    try: d = json.load(open(p))
    except Exception: d = {}
h = d.setdefault('hooks', {})
def put(evt, matcher, cmd):
    lst = h.setdefault(evt, [])
    if any(cmd in hk.get('command','') for i in lst for hk in i.get('hooks',[])): return
    lst.append({"matcher": matcher, "hooks": [{"type":"command","command":cmd}]})
home = os.path.expanduser('~/.claude/hooks')
put('PreToolUse', 'Bash|Read|Edit|Write|Glob|Grep', home + '/sync-guard.sh')
put('PreToolUse', 'Bash', home + '/base-guard.sh')
put('SessionStart', '', home + '/repo-sync.sh')
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2)
PYEOF
fi

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
if [ "$BR" = "$DEPLOY" ] && [ "$LOCAL" = "$REMOTE" ] && [ "$DIRTY" = "0" ]; then note "✅ 이미 맞다 ($LOCAL)"; exit 0; fi

BEHIND="$(git rev-list --count "HEAD..origin/$DEPLOY" 2>/dev/null || echo 0)"

# ⛔⛔ **안전장치 ② — 원격이 «앞서 있지 않으면» 손대지 않는다.**
#    「낡았다」의 정의 = **원격에 있는 커밋이 여기 없다.** 그게 아니면 낡은 게 아니라 **작업 중**이다.
#    ⭐ 이 한 줄이 없으면 «방금 만든 안 커밋된 작업»을 낡은 것으로 착각해 되돌린다.
#       2026-08-09 신설 직후 실제로 그랬다 — 이 훅 파일 자체가 날아갔다(담아둔 덕에 되살렸다).
#    ⛔ 그러니 `hold/*` 에서 검수 대기 중이거나 뭔가 쓰던 중이면 이 훅은 조용히 비켜난다.
[ "${BEHIND:-0}" = "0" ] && { note "· 안 낡았다 (BEHIND=0 · @${BR:-?})"; exit 0; }

# ── 낡았다 ───────────────────────────────────────────────────────────────
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
SAVE_BR="hold/자동회수"
if [ "$DIRTY" != "0" ] || [ "$ORPHAN" != "0" ]; then
  STAMP="$(TZ=Asia/Seoul date '+%m-%d %H:%M' 2>/dev/null || date '+%m-%d %H:%M')"

  # ⛔⛔ **브랜치를 «날짜마다» 새로 만들지 않는다 — 이 환경은 원격 브랜치를 «못 지운다».**
  #    `git push origin --delete` 가 **403** 이다(2026-08-09 실측 · `wip-snap.sh` 주석에도 같은 기록).
  #    날짜별로 만들면 한 달에 수십 개가 영영 쌓인다.
  #    ⭐ 그래서 **브랜치 하나(`hold/자동회수`)에 force push 로 «히스토리를 쌓는다»** —
  #       새 커밋의 부모를 ⑴직전 자동회수 ⑵지금 HEAD **둘 다** 잡으므로 **옛 스냅샷도 그대로 산다.**
  #       되살릴 땐 `git log hold/자동회수` 로 날짜를 보고 고른다.
  #
  # ⭐⭐ **브랜치도 인덱스도 안 건드린다**(`wip-snap.sh` 와 같은 방식) — 임시 인덱스로 트리만 만든다.
  #    checkout 을 안 하니 담는 동안 워킹트리가 흔들리지 않는다.
  # ⚠️ 임시 인덱스는 **저장소 «밖»** 에 둔다 — 안에 두면 남은 `.lock` 이 그 뒤 전부를 막는다(실제 사고).
  IDX="/tmp/hankki-rescue-index"; rm -f "$IDX" "$IDX.lock"
  TREE=""
  if GIT_INDEX_FILE="$IDX" git read-tree HEAD 2>/dev/null \
     && GIT_INDEX_FILE="$IDX" git add -A 2>/dev/null; then
    TREE="$(GIT_INDEX_FILE="$IDX" git write-tree 2>/dev/null || true)"
  fi
  rm -f "$IDX" "$IDX.lock"

  C=""
  if [ -n "$TREE" ]; then
    PREV="$(git rev-parse --verify --quiet "origin/$SAVE_BR" 2>/dev/null || true)"
    MSG="🛟 낡은 디스크 자동 보관 ($STAMP KST · @${BR:-detached} · ${VER:-?})
안 커밋된 변경 ${DIRTY}개 · 원격 어디에도 없던 커밋 ${ORPHAN}개
되살리기: git checkout $SAVE_BR -- <파일>   (통째로는 -- .)"
    if [ -n "$PREV" ]; then
      C="$(git commit-tree "$TREE" -p "$PREV" -p "$LOCAL" -m "$MSG" 2>/dev/null || true)"
    else
      C="$(git commit-tree "$TREE" -p "$LOCAL" -m "$MSG" 2>/dev/null || true)"
    fi
  fi

  # ⛔ hold/* 는 배포 워크플로가 안 본다 → 이 push 로 «배포가 돌지 않는다»(규칙 13과 같은 자리)
  if [ -n "$C" ] && run 90 git push -f -q origin "$C:refs/heads/$SAVE_BR" >/dev/null 2>&1; then
    SAVED="$SAVE_BR"
  else
    # ⛔⛔ 담지 못했다 → **버리지 않는다.** 옛 훅(repo-guard)이 손으로 하라고 안내한다.
    echo ""
    echo "⚠️⚠️ **저장소가 낡았는데 «담기»에 실패했다 — 그래서 자동으로 «안» 맞췄다.**"
    echo "   버리면 잃을 것 = 안 커밋된 변경 ${DIRTY}개 · 원격 어디에도 없는 커밋 ${ORPHAN}개"
    echo "   👉 손으로 담은 «뒤에» 배포 브랜치로 되돌린다 (담기 전엔 \`reset --hard\` 금지)."
    echo ""
    exit 0
  fi
fi

# ── ② 원격으로 맞춘다 ────────────────────────────────────────────────────
LOCK_BEFORE="$(git rev-parse "HEAD:hankki/package-lock.json" 2>/dev/null || true)"

# ⛔⛔ **옮기기와 맞추기를 «한 번에» 한다.**
#    첫 판은 `checkout` 과 `reset --hard` 를 따로 했는데, 안 커밋된 변경이 있으면
#    **checkout 이 조용히 실패하고 reset 만 돌아 — 그때 서 있던 `hold/*` 브랜치를
#    배포 브랜치 자리로 끌고 갔다.** (2026-08-09 재현으로 잡았다. 원격에 있어 되살렸지만
#    로컬 hold 브랜치가 통째로 뒤바뀌는 건 «고치러 온 훅이 새 사고를 내는» 것이다.)
# ⭐ `-f`(로컬 변경 무시)는 «이미 담은 뒤»라 안전하다 — 담기에 실패하면 위에서 이미 멈춘다.
if ! git checkout -f -q -B "$DEPLOY" "origin/$DEPLOY" >/dev/null 2>&1; then
  echo ""
  echo "⚠️⚠️ **저장소가 낡았는데 배포 브랜치로 못 옮겼다 — 손으로 확인할 것.**"
  [ -n "$SAVED" ] && echo "   (담아두기는 했다 → \`$SAVED\`)"
  echo ""
  exit 0
fi
LOCK_AFTER="$(git rev-parse "HEAD:hankki/package-lock.json" 2>/dev/null || true)"

NEWVER="$(grep -o "v[0-9]\+\.[0-9]\+" hankki/src/version.js 2>/dev/null | head -1 || true)"
note "🔄 맞췄다 — ${BEHIND}커밋 뒤처져 있었다 (${VER:-?} → ${NEWVER:-?})${SAVED:+ · 담아둠=$SAVED}"

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
