#!/usr/bin/env bash
# 💰 유튜브 데이터 창구 사용량 — [절대원칙 · 창업자 2026-10-28]
#    *"이 금액은 네가 체크하지 않으면 내가 몰라. 중요하니까 절대원칙으로 규칙넣고 검색할때마다 체크해줘."*
# 막는 것 = hankki/scripts/yt.mjs 를 «안 거치고» www.googleapis.com/youtube 를 부르는 명령
#   (yt.mjs 만 장부 hankki/docs/유튜브-사용량.json 에 적고 «절반 선»에서 멈춘다)
# ⛔ bash 변수명은 ASCII 로 (CLAUDE.md 규칙 24)
set -u
IN=$(cat)
CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || true)
printf '%s' "$CMD" | grep -q 'googleapis.com/youtube' || exit 0
printf '%s' "$CMD" | grep -q 'yt\.mjs' && exit 0
cat >&2 <<'MSG'
💰⛔ 유튜브 창구를 «장부 없이» 부르려 한다 — 막았다.
   절대원칙(창업자 2026-10-28) = 부를 때마다 사용량을 세고 창업자에게 말한다.
   👉 node hankki/scripts/yt.mjs video <id> | search "<검색어>" [--after YYYY-MM-DD] | usage
MSG
exit 2
