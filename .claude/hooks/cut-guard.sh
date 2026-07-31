#!/usr/bin/env bash
# 🔒 자르기 훅 — cut.py / recut.py 를 «먼저읽기 + 시트검사» 없이 못 돌리게 막는다.
#
# 왜 (창업자 2026-07-31): "왜 네 기억에 맡기냐고 우리 규칙이 있는데. 그럼 규칙을 왜 정한거야?"
#   규칙은 문서에 있었지만 «지킬 장치»가 없어서, 옛 격자 시트로 자르는 사고가 났다.
#   문서를 "읽기로 약속"하는 건 결국 기억이다. 훅은 잊어도 하네스가 막는다.
#
# 통과 조건 = 오늘 날짜(KST)로 표시 파일이 있어야 한다.
#   `python3 tools/sheet-index.py --check <시트>` 를 돌리면 만들어진다.
set -u
IN=$(cat)
CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || true)

case "$CMD" in
  *tools/cut.py*|*tools/recut.py*) ;;
  *) exit 0 ;;
esac
# 검사 도구 자신은 통과
case "$CMD" in *sheet-index.py*) exit 0 ;; esac

STAMP="/tmp/hankki-cut-ok-$(TZ='Asia/Seoul' date +%Y%m%d)"
if [ -f "$STAMP" ]; then exit 0; fi

cat >&2 <<'MSG'
⛔ 자르기 전 절차를 안 밟았다.

  ① docs/자르기-먼저읽기.md 를 읽는다  (또는 /자르기)
  ② python3 tools/sheet-index.py                      # 원본 우선순위 표 갱신
  ③ python3 tools/sheet-index.py --check <시트.png>   # 격자·컷크기·흰다이컷 검사

  ⭐ 특히 ③ — «가장 최근에 받은 시트»를 쓰는지, 늘려 쓰는 건 아닌지 여기서 걸린다.
     (2026-07-31: 큰 4컷 시트가 있는데 옛 16종 격자 시트로 잘라 하루를 버렸다)

  ③ 을 돌리면 오늘치 통과 표시가 생기고 이 훅이 열린다.
MSG
exit 2
