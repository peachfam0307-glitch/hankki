#!/usr/bin/env bash
# 규칙 12 — archive-guard 가 «진짜» 막고 «진짜» 푸는지 일곱 갈래로 확인
H=/home/user/hankki/.claude/hooks/archive-guard.sh
VG='/home/user/hankki/hankki/docs/버전기록-전체.md'
rm -f /tmp/hankki-보관소-허가
ok=0; ng=0
t(){ # $1=설명 $2=기대exit $3=json
  printf '%s' "$3" | $H >/dev/null 2>&1; got=$?
  if [ "$got" = "$2" ]; then echo "   ✅ $1  (exit=$got)"; ok=$((ok+1))
  else echo "   ⛔ $1  기대 $2 인데 $got"; ng=$((ng+1)); fi
}
echo "▶ 막아야 하는 것"
t "보관소를 Read"            2 "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$VG\"}}"
t "보관소를 grep (옆문)"      2 "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"grep -n x $VG\"}}"
t "보관소를 sed 로 부분읽기"  2 "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"sed -n '1,20p' $VG\"}}"
t "_archive 경로 cat"        2 '{"tool_name":"Bash","tool_input":{"command":"cat hankki/docs/_archive/README.md"}}'
echo "▶ 통과해야 하는 것 (막히면 «막다른 길»)"
t "보통 문서 Read"           0 '{"tool_name":"Read","tool_input":{"file_path":"/home/user/hankki/CLAUDE.md"}}'
t "허가 표식 만들기"          0 '{"tool_name":"Bash","tool_input":{"command":"echo 지시 > /tmp/hankki-보관소-허가"}}'
t "git add (보관소 파일)"     0 "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git add $VG\"}}"
t "Edit 툴"                  0 "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$VG\"}}"
t "git add ＋ 여러 명령 이어붙임" 0 "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"cd /x \&\& cp a b \&\& git add $VG hankki/CLAUDE.md \&\& git commit -q -F m.txt\"}}"
echo "▶ 창업자가 지시하면 열리나"
echo '창업자: "버전기록 열어봐"' > /tmp/hankki-보관소-허가
t "허가 뒤 Read"             0 "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$VG\"}}"
rm -f /tmp/hankki-보관소-허가
echo ""
echo "   ── ${ok}칸 통과 · ${ng}칸 어긋남 ──"
exit $([ $ng -eq 0 ] && echo 0 || echo 1)
