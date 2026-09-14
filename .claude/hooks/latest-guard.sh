#!/usr/bin/env bash
# 🔒 최신 가드 — 「옛 문서·옛 파일 먼저 보는 것」을 막고, 주제의 최신 문서를 먼저 들이민다.
#   창업자 2026-07-31: "규칙만 만들면 뭐해 안지키는데."  "어떤 문서든 관련된 최신문서 미리 읽고 시작하도록"
#   속은 hankki/scripts/latest-hook.mjs 가 다 한다. 여기선 못 찾거나 터져도 «조용히 통과»만 보장한다.
set -u
NODE_SCRIPT="${CLAUDE_PROJECT_DIR:-.}/hankki/scripts/latest-hook.mjs"
[ -f "$NODE_SCRIPT" ] || { cat >/dev/null; exit 0; }
exec node "$NODE_SCRIPT"
