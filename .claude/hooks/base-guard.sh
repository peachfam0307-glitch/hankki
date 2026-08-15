#!/usr/bin/env bash
# 🕳 **되감긴 디스크 위에서 커밋·브랜치 만들기를 막는다.**
#
# 왜 (2026-08-10 · 하루에 세 번 밟았다):
#   이 컨테이너는 작업 «중»에도 옛 스냅샷으로 되살아난다. 그러면 —
#   ① 로컬 배포 브랜치가 «며칠 전 커밋»으로 되감기고
#   ② 나는 그걸 모른 채 그 위에 `git checkout -b hold/…` 로 브랜치를 만들고
#   ③ 거기에 수정을 얹어 푸시한다 → **그 브랜치를 합치면 최근 작업이 통째로 되돌아간다.**
#
#   실제로 오늘 `hold/픽복구-0810` 이 v10.21 바닥 위에 세워졌다(진짜는 v10.24).
#   창업자가 잡았다 — *"자꾸 왜 낡은 데 들어가? 시스템으로 막아야 하는거 아냐?"*
#
#   ⛔ 기존 장치로는 못 잡았다:
#      · `repo-sync.sh` = **세션 시작 때만** 돈다. 되감김은 세션 «중»에 났다.
#      · `wip-snap.sh`  = 파일을 담기만 한다. «바닥이 낡았는지»는 안 본다.
#
# ⭐ 손해가 나는 순간은 딱 하나다 — **낡은 HEAD 위에서 커밋하거나 브랜치를 만들 때.**
#    그 순간에만 막는다. 그 전엔 조용하다(시끄러운 게이트는 죽은 게이트).
#
# 무엇을 보나 = **로컬 배포 브랜치 ref vs 원격 배포 브랜치 ref.**
#   원격 tip 이 로컬 tip 의 조상이 «아니면» = 로컬이 원격에 없는 것을 모른다 = 되감겼다.
#   ⭐ 이 잣대는 hold/* 브랜치에서 일할 때 거짓 경보를 안 낸다 — «지금 브랜치»가 아니라
#      «배포 브랜치 ref»를 보기 때문이다. 어제 만든 hold 브랜치가 배포보다 뒤에 있는 건 정상이다.
set -u
IN=$(cat)
CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || true)
[ -z "$CMD" ] && exit 0

DEPLOY=claude/chatgpt-conversation-link-kvn5ph
ROOT=/home/user/hankki
cd "$ROOT" 2>/dev/null || exit 0

# ⭐⭐ **모든 bash 명령에서 본다** — 커밋할 때만 보면 늦다.
#   2026-08-10 두 번째 사고: 나는 «커밋하기 훨씬 전에» 낡은 디스크에서 `grep -c` 로 주차를 세고
#   「4주뿐이라 8/31 부터 빈다」고 창업자를 놀라게 했다. **진짜는 13주였다.**
#   창업자 — *"왜 비지? 다 정했었는데"*. 그 «세는 순간»엔 아무것도 안 막고 있었다.
#   📌 되감김은 «커밋»만 망치는 게 아니라 **내가 읽는 숫자를 전부 거짓말로 만든다.**
#
# 💰 공짜로 만드는 법 = **fetch 를 안 한다.** 이미 받아둔 `refs/remotes/origin/…` 과 로컬 ref 만 견준다.
#   ref 두 개 읽기라 몇 밀리초다. 커밋·브랜치 만들기 «같은 위험한 명령»일 때만 fetch 로 최신을 확인한다.
RISKY=0
echo "$CMD" | grep -qE 'git +([a-z-]+ +)*(commit|checkout +-[bB]|switch +-c|push)' && RISKY=1

# 🚪🚪 **빠져나갈 문** — ⛔2026-08-12: 이 훅이 «자기가 안내한 복구 명령»까지 막았다.
#   되감기면 모든 bash 가 막히는데, 푸는 명령도 bash 라서 **순환에 갇혔다.**
#   창업자 작업이 통째로 멈췄다(그날 장바구니 그림 59컷 검수 중).
#   📌 게이트는 «틀린 길»을 막아야지 «옳은 길»까지 막으면 안 된다.
#   ✅ 통과시키는 것 = ⒜맞추는 명령(checkout -B ... origin/DEPLOY · reset --hard origin/DEPLOY)
#                    ⒝읽기만 하는 명령(status·log·diff·rev-parse·fetch·branch·show)
#   ⚠️ ⒝를 통과시켜도 안전하다 — 「읽은 숫자가 거짓」인 게 문제지만, 되감김을 «진단»하려면 읽어야 한다.
#   ⛔⛔ **[2026-08-13 정정] 08-12 판의 ⒝가 «너무 넓었다» — 이 훅의 본래 목적을 통째로 껐다.**
#      `git 이 없으면 무조건 통과` 라서 `grep -c … weekly.js` · `node scripts/check-*.mjs` ·
#      `cat` · `wc` 가 **전부 통과**했다. 그런데 이 훅을 만든 «이유»가 바로 그것이었다 —
#      2026-08-10 에 낡은 바닥에서 `grep -c` 로 주차를 세고 「4주뿐」이라 잘못 알린 사고(진짜 13주).
#      📌 **막다른 길을 푼다고 문을 다 떼어버렸다.** 재현판이 잡았다(⛔ 통과 (기대=막힘) 두 칸).
#   ✅✅ **그래서 방향을 바꾼다 — 「막기」 대신 「고치기」.**
#      되감김을 보면 **그 자리에서 `repo-sync.sh` 를 불러 맞춘다.** 맞춰지면 막을 이유가 없다.
#      정말 못 고쳤을 때(네트워크가 없을 때)만 막고, 그때도 ⒜⒝ 문은 열어 둔다.
#      ⭐ 이러면 창업자가 겪은 「똑같은 메시지가 계속」이 사라진다 — 알리는 대신 «해결»하니까.
if echo "$CMD" | grep -qE "git +(checkout +-[fqB ]*B|switch +-C) +[^ ]+ +origin/$DEPLOY|git +reset +--hard +origin/$DEPLOY"; then exit 0; fi
if echo "$CMD" | grep -qE '(^|[;&|]) *(cd [^;&|]* *(&&|;) *)*git +(status|log|diff|show|fetch|remote|branch|reflog|stash|rev-parse|rev-list|ls-remote|ls-tree|ls-files|merge-base|cat-file|describe|blame)\b'; then exit 0; fi
#   ⒞ **담아두는 push(`hold/`·`wip/`)는 통과** — 「잃지 않게 먼저 담는」 단계다. 막으면 안 된다.
#      ⛔ 배포 브랜치로 가는 push 는 여전히 막는다(낡은 바닥을 «원격에» 퍼뜨리는 유일한 길이라).
if echo "$CMD" | grep -qE 'git +push[^;&|]*(hold/|wip/)'; then exit 0; fi

if [ "$RISKY" = 1 ]; then
  # ⚠️ 네트워크가 막히면 조용히 통과한다(막는 게 목적이지 멈추는 게 목적이 아니다).
  timeout 12 git fetch -q origin "$DEPLOY" 2>/dev/null || true
fi

LOCAL=$(git rev-parse --verify -q "refs/heads/$DEPLOY" 2>/dev/null) || exit 0
REMOTE=$(git rev-parse --verify -q "refs/remotes/origin/$DEPLOY" 2>/dev/null) || exit 0
[ "$LOCAL" = "$REMOTE" ] && exit 0
git merge-base --is-ancestor "$REMOTE" "$LOCAL" 2>/dev/null && exit 0

# ── 🔧 되감겼다 → **먼저 스스로 고쳐본다** (2026-08-13 신설) ──────────────
#   ⭐ `repo-sync.sh` 가 하는 일을 여기 베끼지 않는다 — **부르기만 한다**(둘이 어긋나면 안 된다).
#      그 안에 이미 안전장치가 다 있다: 버리기 «전»에 `hold/자동회수` 에 담고 · 담기 실패하면 안 되돌리고.
#   ⚠️ 네트워크가 없으면 매 명령마다 20초씩 먹으면 안 된다 → **실패를 60초 기억한다.**
FIXED=0
COOL=/tmp/hankki-fix-cooldown
NOW=$(date +%s 2>/dev/null || echo 0)
LAST=$(cat "$COOL" 2>/dev/null || echo 0)
if [ $(( NOW - LAST )) -gt 60 ]; then
  for c in "$ROOT/.claude/hooks/repo-sync.sh" "$HOME/.claude/hooks/repo-sync.sh"; do
    [ -x "$c" ] || continue
    printf '{"source":"net"}' | timeout 90 "$c" >/dev/null 2>&1
    break
  done
  LOCAL=$(git rev-parse --verify -q "refs/heads/$DEPLOY" 2>/dev/null || echo x)
  REMOTE=$(git rev-parse --verify -q "refs/remotes/origin/$DEPLOY" 2>/dev/null || echo y)
  if [ "$LOCAL" = "$REMOTE" ] || git merge-base --is-ancestor "$REMOTE" "$LOCAL" 2>/dev/null; then
    FIXED=1
  else
    printf '%s' "$NOW" > "$COOL" 2>/dev/null || true
  fi
fi
# ✅ 고쳐졌으면 «조용히» 통과한다 — 작업을 끊지 않는 게 목적이다.
[ "$FIXED" = 1 ] && exit 0

MISSING=$(git rev-list --count "$LOCAL..$REMOTE" 2>/dev/null || echo '?')
cat >&2 <<EOF
🕳 **디스크가 되감겼고 «자동으로 맞추는 것도 실패»했다 (원격을 못 봤다).**
   ⭐ 아래 명령들은 **이 게이트를 통과한다** — `git status`·`git diff`·`git log` 같은 읽기와
      `origin/$DEPLOY` 로 맞추는 명령은 안 막힌다. 막히는 건 «낡은 바닥을 퍼뜨리는» 것뿐이다.

   ⛔ 커밋만 문제가 아니다. **파일을 읽고 세는 것부터 전부 틀린다.**
      2026-08-10 에 낡은 바닥에서 주차를 세고 「4주뿐이라 8/31 부터 빈다」고 잘못 알렸다(진짜는 13주).

   로컬 배포 브랜치 = $(git log --oneline -1 "$LOCAL" 2>/dev/null)
   원격 배포 브랜치 = $(git log --oneline -1 "$REMOTE" 2>/dev/null)
   ⛔ 원격에만 있는 커밋 **${MISSING}개** — 이 상태에서 만든 브랜치를 합치면 그게 통째로 되돌아간다.

👉 **먼저 맞추고 나서 다시 하라** (안 커밋된 변경이 있으면 «먼저» 담을 것):

     cd $ROOT
     git status --short                    # 안 커밋된 게 있나 먼저 본다
     git checkout -B $DEPLOY origin/$DEPLOY

   ⚠️ 지금 hold/* 브랜치에서 일하는 중이었다면, 그 브랜치도 **원격 바닥 위에 다시 세워야** 한다:
     git checkout -B hold/새이름 origin/$DEPLOY
     git checkout <낡은브랜치> -- <내가 고친 파일들>

   📌 2026-08-10 에 이걸로 브랜치 하나를 통째로 다시 세웠다. 잃은 건 없었지만 30분이 갔다.
EOF
exit 2
