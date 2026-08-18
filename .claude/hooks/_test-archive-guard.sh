#!/usr/bin/env bash
# 🧪 보관소 지킴이 규칙 12 — «막혀야 하는 것»과 «통과해야 하는 것»을 둘 다 재본다.
#   ⛔ 게이트를 만들 때 「막히는 경우」만 보고 «푸는 길»을 안 봐서 2026-08-13·15·16 세 번 막다른 길이 났다.
#   👉 실행: bash .claude/hooks/_test-archive-guard.sh
# ⛔ 경로를 박지 않는다 — 「이 컨테이너에만 있는 길」을 박아 CI 배포를 죽인 적이 있다(2026-08-15).
#    자기 위치에서 뿌리를 찾는다. 훅이 없는 환경이면 조용히 통과한다.
HERE=$(cd "$(dirname "$0")" && pwd)
T="$HERE/guard-targets.py"
[ -f "$T" ] || { echo "🗄 보관소 지킴이 판정기가 없다 — 건너뛴다"; exit 0; }
cd "$HERE/../.." || exit 1
PASS=0; FAIL=0

# ⛔ 이 자리에 `python3 -c "…"` 를 두면 안 된다 — bash 큰따옴표 안이라 지뢰가 산다.
#    `check-hookinline` 게이트가 방금 그걸 잡아냈다(2026-08-16). 파일로 뺀다.
jin() { python3 "$HERE/_test-jin.py" "$1" "$2"; }

# 막혀야 한다 = 대상이 «나와야» 한다
must_block() {
  out=$(jin "$1" "$2" | python3 "$T")
  if [ -n "$out" ]; then PASS=$((PASS+1)); printf '  ✅ 막힘  %s\n' "$3"
  else FAIL=$((FAIL+1)); printf '  ⛔ 새어나감  %s\n' "$3"; fi
}
# 통과해야 한다 = 대상이 «없어야» 한다
must_pass() {
  out=$(jin "$1" "$2" | python3 "$T")
  if [ -z "$out" ]; then PASS=$((PASS+1)); printf '  ✅ 통과  %s\n' "$3"
  else FAIL=$((FAIL+1)); printf '  ⛔ 막다른 길  %s  → %s\n' "$3" "$out"; fi
}

echo "🗄 보관소 지킴이 — 규칙 12"
echo
echo "── 막혀야 하는 것 (보관소를 «읽는» 일) ──"
must_block Bash '{"command":"cat hankki/docs/_archive/버전기록-전체.md"}'                 "cat 보관소 문서"
must_block Bash '{"command":"grep -rn 곰 hankki/docs/_archive/"}'                        "grep 보관소 폴더"
must_block Bash '{"command":"git show HEAD:hankki/docs/_archive/버전기록-전체.md"}'       "git show 로 내용 읽기 (2026-08-16 메운 구멍)"
must_block Bash '{"command":"git log -p -- hankki/docs/_archive/버전기록-전체.md"}'       "git log -p 로 내용 읽기"
must_block Read '{"file_path":"hankki/docs/_archive/버전기록-전체.md"}'                   "Read 보관소 문서"
must_block Grep '{"path":"hankki/docs/_archive"}'                                        "Grep 보관소 폴더"

echo
echo "── 통과해야 하는 것 (푸는 길·정상 작업) ──"
must_pass Bash '{"command":"git add -A hankki/docs"}'                                    "git add (청소해서 담기)"
must_pass Bash '{"command":"git mv hankki/docs/a.md hankki/docs/_archive/작업복기/"}'      "git mv → 보관소로 «넣기»"
must_pass Bash '{"command":"git commit -q -m \"청소 = 복기 둘을 docs/_archive/작업복기/ 로\""}' "커밋 메시지에 보관소 경로"
must_pass Bash '{"command":"mkdir -p hankki/docs/_archive/작업복기"}'                      "보관소 폴더 만들기"
must_pass Read '{"file_path":"/home/user/hankki/.claude/hooks/guard-targets.py"}'          "훅 자기 부품 읽기 (2026-08-16 고친 막다른 길)"
must_pass Bash '{"command":"cat .claude/hooks/guard-targets.py"}'                          "훅 자기 부품 cat"
must_pass Bash '{"command":"echo 지시원문 > /tmp/hankki-보관소-허가"}'                     "허가 표식 만들기"
must_pass Bash '{"command":"node hankki/scripts/decided.mjs 가루육수"}'                    "평소 명령 (조용해야 한다)"
# ⭐ 2026-08-16 «진짜 원인» — 여기가 오래 못 찾던 자리다
must_pass Bash '{"command":"cat > /tmp/cm.txt <<EOF\n청소 = 복기 둘을 hankki/docs/_archive/작업복기/ 로\nEOF\ngit commit -F /tmp/cm.txt"}' "heredoc 으로 커밋메시지 쓰기 (보관소 경로 포함)"
must_pass Bash '{"command":"cat >> hankki/docs/복기.md <<EOF\n- 청소 = docs/_archive/ 로 옮김\nEOF"}' "문서에 「보관소로 옮겼다」고 «적기»"
must_pass Bash '{"command":"cat > /tmp/x.txt"}'                                            "cat > 파일 (쓰기)"
# ⭐ 2026-08-18 «세 번째» 같은 자리 — printf 로 허가 표식을 만드는 그 명령이 막혔다(창업자 "청소해")
must_pass Bash '{"command":"printf %s 청소=끝난것을 hankki/docs/_archive/ 로 git mv > /tmp/hankki-보관소-허가 && cat /tmp/hankki-보관소-허가"}' "printf 로 허가 표식 만들기 (글에 보관소 낱말 포함)"
must_block Bash '{"command":"printf hi > /tmp/x && cat hankki/docs/_archive/a.md"}'        "printf 로 지운 뒤에도 진짜 읽기는 막힌다"

echo
echo "──────────────────────────────"
echo "통과 $PASS / $((PASS+FAIL))"
[ "$FAIL" -eq 0 ] || exit 1
