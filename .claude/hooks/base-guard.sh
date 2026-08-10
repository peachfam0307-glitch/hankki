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

# 커밋하거나 «새 브랜치를 만드는» 명령일 때만 본다
echo "$CMD" | grep -qE 'git +([a-z-]+ +)*(commit|checkout +-[bB]|switch +-c)' || exit 0

DEPLOY=claude/chatgpt-conversation-link-kvn5ph
ROOT=/home/user/hankki
cd "$ROOT" 2>/dev/null || exit 0

# 원격을 «지금» 확인한다 — 캐시된 ref 자체가 되감겼을 수 있다.
# ⚠️ 네트워크가 막히면 조용히 통과한다(막는 게 목적이지 멈추는 게 목적이 아니다).
timeout 12 git fetch -q origin "$DEPLOY" 2>/dev/null || exit 0

LOCAL=$(git rev-parse --verify -q "refs/heads/$DEPLOY" 2>/dev/null) || exit 0
REMOTE=$(git rev-parse --verify -q FETCH_HEAD 2>/dev/null) || exit 0
[ "$LOCAL" = "$REMOTE" ] && exit 0
git merge-base --is-ancestor "$REMOTE" "$LOCAL" 2>/dev/null && exit 0

MISSING=$(git rev-list --count "$LOCAL..$REMOTE" 2>/dev/null || echo '?')
cat >&2 <<EOF
🕳 **디스크가 되감겼다 — 지금 커밋하면 낡은 바닥 위에 얹힌다.**

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
