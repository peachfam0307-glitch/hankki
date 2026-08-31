#!/usr/bin/env bash
# 규칙 12 — cut-guard 가 «진짜 자르기»만 잡고 «heredoc 안의 글자»는 안 잡는지
H=/home/user/hankki/.claude/hooks/cut-guard.sh
M=/tmp/hankki-cut-unseen
ok=0; ng=0
chk(){ if [ "$2" = "$3" ]; then echo "   ✅ $1"; ok=$((ok+1)); else echo "   ⛔ $1  (기대 $3 · 실제 $2)"; ng=$((ng+1)); fi; }

rm -f $M
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"python3 tools/cut.py sheet.png out xx --diecut auto"}}' | $H >/dev/null 2>&1
[ -f $M ] && r=생김 || r=없음
chk "① 진짜 자르는 명령 → 표식" "$r" "생김"

rm -f $M
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"python3 - <<PY\ns = 1  # 표준 = python3 tools/cut.py <시트>\nPY"}}' | $H >/dev/null 2>&1
[ -f $M ] && r=생김 || r=없음
chk "② heredoc 안의 «글자» → 표식 없어야 (오늘 낸 거짓 표식)" "$r" "없음"

echo "자름: 시험" > $M
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}' | $H >/dev/null 2>&1
chk "③ 표식 있으면 커밋이 막힌다 (게이트가 죽지 않았나)" "$?" "2"

printf '%s' '{"tool_name":"Read","tool_input":{"file_path":"/x/_검수/낱개-전체-진한판.png"}}' | $H >/dev/null 2>&1
[ -f $M ] && r=남음 || r=풀림
chk "④ 진한 판을 열면 풀린다" "$r" "풀림"

rm -f $M
echo ""
echo "   ── ${ok}칸 통과 · ${ng}칸 어긋남 ──"
exit $([ $ng -eq 0 ] && echo 0 || echo 1)
