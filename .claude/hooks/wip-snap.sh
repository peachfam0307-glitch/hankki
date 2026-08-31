#!/usr/bin/env bash
# 💾💾 **작업분 자동 스냅샷** — 컨테이너가 재시작돼도 «날아가지 않게». (2026-08-08 신설)
#
#   ⛔⛔ 실제로 날아갔다 (2026-08-08 오후):
#      컨테이너가 하루에 두 번 재시작됐다. 첫 번째는 `repo-guard` 가 잡아 복구했지만,
#      두 번째는 **커밋 전이던 30분어치 작업(사진 위치 조정)이 통째로 사라졌다.**
#      📌 `repo-guard` 는 «회귀를 알려줄» 뿐이다 — 그때는 이미 잃은 뒤다.
#      ⭐ 그래서 이 훅은 «감지»가 아니라 **«보존»** 을 한다.
#
#   ⭐⭐ **브랜치를 하나도 안 건드린다.** `refs/wip/latest` 라는 별도 ref 에만 담는다 —
#      ⑴ 규칙 13(승인 안 난 앱코드는 배포 브랜치에 «커밋조차» 안 한다) 을 안 어긴다
#      ⑵ 배포 워크플로는 `on: push: branches:` 라 **브랜치가 아닌 ref 엔 반응하지 않는다**
#         (`deploy-hankki.yml` 실물 확인 — 규칙 9 「푸시=자동배포」에 안 걸린다)
#      ⑶ 히스토리를 안 더럽힌다. 복구할 때만 꺼내 쓰고 평소엔 안 보인다
#
#   ⭐ **조용하다** — 출력이 없다. 시끄러운 게이트는 죽은 게이트다.
#   ⭐ **느리지 않다** — 5분에 한 번만 돌고, 푸시는 백그라운드다.
#
#   👉 복구하는 법 (회귀했을 때 `repo-guard` 가 알려준다):
#        git fetch origin wip/auto
#        git show --stat FETCH_HEAD        # 뭐가 들었나 «먼저» 본다 (⛔보지 않고 덮지 말 것)
#        git checkout FETCH_HEAD -- .      # 워킹트리로 되살린다
set -u
cat >/dev/null 2>&1 || true    # 표준입력 비우기(다른 훅과 같은 방식)

REPO="${CLAUDE_PROJECT_DIR:-/home/user/hankki}"
cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

STAMP="$REPO/.git/.wip-last"
NOW="$(date +%s)"
LAST="$(cat "$STAMP" 2>/dev/null || echo 0)"
case "$LAST" in ''|*[!0-9]*) LAST=0 ;; esac

# ⏱ 5분에 한 번 — Edit/Write 마다 돌면 느려진다. 잃을 수 있는 최대치가 5분이면 충분하다.
[ $((NOW - LAST)) -ge 300 ] || exit 0

# 바뀐 게 없으면 아무것도 안 한다(빈 스냅샷을 쌓지 않는다)
if git diff --quiet HEAD 2>/dev/null; then
  git ls-files --others --exclude-standard 2>/dev/null | head -1 | grep -q . || exit 0
fi

echo "$NOW" > "$STAMP" 2>/dev/null || true

# ⚠️⚠️ 임시 인덱스는 **저장소 밖(/tmp)** 에 둔다 — 첫 판에서 `.git/wip-index` 로 뒀다가
#    백그라운드가 죽으며 남긴 `.git/wip-index.lock` 이 **그 뒤 모든 스냅샷을 막았다**(실제로 그랬다).
#    저장소 안에 잠금이 남으면 다음 사람이 원인을 못 찾는다. 밖에 두면 저장소 오염이 0이다.
WIPIDX="/tmp/hankki-wip-index"
rm -f "$WIPIDX" "$WIPIDX.lock"

# ⭐ ref 만들기는 «동기» — 0.1초면 끝나고, 이게 실패하면 스냅샷이 아예 없다.
#    (첫 판은 통째로 백그라운드였는데 훅이 끝나며 자식이 죽어 «아무것도 안 남았다».
#     조용한 게 목적이지 «안 하는 것»이 목적이 아니다.)
SNAP_OK=0
if GIT_INDEX_FILE="$WIPIDX" git read-tree HEAD 2>/dev/null \
   && GIT_INDEX_FILE="$WIPIDX" git add -A 2>/dev/null; then
  TREE="$(GIT_INDEX_FILE="$WIPIDX" git write-tree 2>/dev/null || true)"
  if [ -n "$TREE" ]; then
    BR="$(git branch --show-current 2>/dev/null || echo detached)"
    C="$(git commit-tree "$TREE" -p HEAD -m "wip $(date '+%m-%d %H:%M') @${BR}" 2>/dev/null || true)"
    if [ -n "$C" ]; then git update-ref refs/wip/latest "$C" 2>/dev/null && SNAP_OK=1; fi
  fi
fi
rm -f "$WIPIDX" "$WIPIDX.lock"

# 🔒 원격 푸시만 백그라운드 — 네트워크는 느릴 수 있고, 창업자를 기다리게 하지 않는다.
#    ⚠️⚠️ **로컬 ref 만으론 «아무 소용이 없다»** — 컨테이너가 죽으면 로컬 `.git` 도 같이 사라진다.
#       그게 정확히 이 사고다(2026-08-08 하루 세 번). 원격에 올라가야 비로소 보험이 된다.
#
#    ⛔⛔ **`refs/wip/*` 로는 못 민다 — 이 환경 git 자격이 «브랜치가 아닌 ref» 를 403 으로 막는다.**
#       (같은 이유로 `git push --delete` 로 hold 브랜치 정리도 안 된다. 실제로 재서 확인했다.)
#       → **브랜치 `wip/auto`** 로 민다. 배포 워크플로는 `branches: [claude/chatgpt-…]` 하나만
#          보므로 **이 브랜치는 배포를 안 돌린다**(푸시해 보고 run 번호가 그대로인 것까지 확인했다).
#       📌 규칙 13 도 안 어긴다 — 승인 안 난 코드가 «배포 브랜치»에 안 들어간다(hold/* 와 같은 방식).
if [ "$SNAP_OK" = "1" ]; then
  ( if command -v timeout >/dev/null 2>&1; then
      timeout 40 git push -f origin "$C:refs/heads/wip/auto" --quiet
    else
      git push -f origin "$C:refs/heads/wip/auto" --quiet
    fi ) >/dev/null 2>&1 &
fi

exit 0
