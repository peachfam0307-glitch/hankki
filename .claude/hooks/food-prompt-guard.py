#!/usr/bin/env python3
# 🍳 음식 그림 프롬프트 필수 문장 관문 (창업자 2026-11-23 「프롬프트에 필수로 넣어. 크레딧 낭비하지말고!」)
# 뿌리 = 11/23 새 레시피 32장을 밥알·면 금지 문장 없이 뽑아 김밥·죽 10장을 다시 뽑게 됐다.
# 힉스필드 그림 뽑기 호출에서 «음식 사진» 프롬프트인데 필수 문장이 빠지면 막는다(exit 2) — 크레딧이 나가기 «전»에.
# 전문 틀 = hankki/CLAUDE.md 「그릴 때 원칙」 ⑥
import json, sys

필수 = {
    'never like uniform beads': '밥알 구슬 무늬 금지',
    'no lattice or crisscross': '면·채 격자 금지',
    'No disturbing surface patterns on meat': '고기 표면 무늬 금지',
    'nothing stylized or patterned': '꾸민 무늬 금지',
    'No sesame seeds': '깨 금지',
}
틀 = ("Real food photograph, 3/4 angle, soft natural daylight, plain pure white background (#FFFFFF), isolated: <음식>. "
      "Looks exactly like real food in a real photo, natural textures, nothing stylized or patterned. "
      "Rice grains look soft, irregular and naturally clumped, never like uniform beads, dots or a repeating pattern. "
      "Noodles, strands and greens are simply scooped in loose natural clumps, no stacking, no lattice or crisscross, no repeating texture. "
      "No disturbing surface patterns on meat. No sesame seeds, no text. "
      "The whole dish is fully visible and centered, small in the frame with wide empty white margin on every side.")

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
inp = d.get('tool_input') or {}
글들 = []
if isinstance(inp.get('prompt'), str):
    글들.append(inp['prompt'])
reqs = inp.get('requests')
if isinstance(reqs, list):
    for r in reqs:
        p = (r or {}).get('params') or {}
        if isinstance(p.get('prompt'), str):
            글들.append(p['prompt'])
빠짐 = []
for g in 글들:
    if 'real food' not in g.lower() and 'food photograph' not in g.lower():
        continue
    없는 = [뜻 for 말, 뜻 in 필수.items() if 말 not in g]
    if 'porridge' in g.lower() and 'individual grains are barely visible' not in g:
        없는.append('죽 = 매끈하게(individual grains are barely visible)')
    if 없는:
        빠짐.append((g[:80], 없는))
if 빠짐:
    msg = ['⛔ 음식 그림 프롬프트에 필수 문장이 빠졌다 — 크레딧 나가기 전에 막음 (창업자 2026-11-23)']
    for 앞, 없는 in 빠짐[:5]:
        msg.append(f'  · 「{앞}…」 → 빠짐: ' + ', '.join(없는))
    msg.append('👉 이 틀을 그대로 쓴다:')
    msg.append(틀)
    msg.append('🍚 죽이면 추가: The porridge is silky and smooth, rice fully softened and melted into the porridge so individual grains are barely visible, not lumpy, not clumped.')
    msg.append('🥩 다진 고기면 추가: minced beef in tiny loose flecks, no meatballs, no round lumps.')
    msg.append('📖 재료는 node hankki/scripts/recipe.mjs <이름> 으로 열어 보고 그 모양대로 (다짐육을 썬 고기로 그리지 않는다)')
    print('\n'.join(msg), file=sys.stderr)
    sys.exit(2)
sys.exit(0)
