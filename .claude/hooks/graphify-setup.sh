#!/usr/bin/env bash
# 🗺 graphify — 클라우드 세션은 열 때마다 새 컴퓨터라 깔아둔 것이 사라진다 → 세션 시작에 «뒤에서» 깔고 앱 코드 지도를 만든다.
#    (창업자 2026-10-23 「세션이 끝나면 사라진다며」 → 「웅 그러자」)
# ⭐ 대상 = hankki/src «코드만»(AST · AI 안 씀 · 토큰 0) — 저장소 전체는 사진 1만 장이라 오히려 토큰을 먹는다
# ⭐ 밖으로 안 보낸다 = GRAPHIFY_BACKEND=none · 결과 graphify-out/ 은 커밋 안 한다(.git/info/exclude)
# ⭐ 세션 시작을 막지 않는다 — 전부 백그라운드 · 실패해도 조용히 넘어간다(로그 = graphify-out/setup.log)
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$ROOT" || exit 0
grep -qx 'graphify-out/' .git/info/exclude 2>/dev/null || echo 'graphify-out/' >> .git/info/exclude
mkdir -p graphify-out
(
  export GRAPHIFY_BACKEND=none
  command -v uv >/dev/null 2>&1 || exit 0
  command -v graphify >/dev/null 2>&1 || uv tool install -q graphifyy || exit 0
  [ -f "$HOME/.claude/skills/graphify/SKILL.md" ] || graphify install >/dev/null 2>&1
  PY=$(uv tool run --from graphifyy python -c "import sys; print(sys.executable)" 2>/dev/null) || exit 0
  printf '%s' "$PY" > graphify-out/.graphify_python
  "$PY" - <<'PYEOF'
import json
from pathlib import Path
from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster
from graphify.export import to_json
R = Path('hankki/src')
code = []
for f in detect(R)['files'].get('code', []):
    p = Path(f); code.extend(collect_files(p) if p.is_dir() else [p])
ex = extract(code, cache_root=R, root=R)
G = build_from_json(ex, root='hankki/src', directed=False)
to_json(G, cluster(G), 'graphify-out/graph.json')
print('graph', G.number_of_nodes(), 'nodes')
PYEOF
) > graphify-out/setup.log 2>&1 &
exit 0
