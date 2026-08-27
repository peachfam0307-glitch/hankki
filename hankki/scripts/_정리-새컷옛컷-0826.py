# 🗂 오늘 반영한 «새 컷»은 이름표를 붙여 따로 저장하고, «옛 컷»은 보관소로 갈라 놓는다 (2026-08-26)
# 📮 창업자 = "오늘 반영한 새컷은 이름표 붙여서 따로 저장해. 옛컷은 보관소에 쑤셔넣어놔 안섞이게"
#
# ⛔⛔ 앱 소스(`src/assets/stickers/photo/`)는 «건드리지 않는다» —
#    옛 컷이라도 그 키로 저장한 레시피가 부른다. 파일을 옮기면 그 레시피가 깨진다.
#    ✅ 그래서 갈라 놓는 것은 `docs/stickers/` 의 «원본»과 «목록»이다.
#
# 실행 = python3 scripts/_정리-새컷옛컷-0826.py [--진짜옮김]
# 🏷 이름표 = 반영됨
import os, sys, re, json, glob, hashlib, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _이름표읽기 import 이름표, 픽커

앱 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = os.path.dirname(앱)
진짜 = '--진짜옮김' in sys.argv

def sha(p):
    try: return hashlib.sha1(open(p, 'rb').read()).hexdigest()
    except Exception: return None

# ── 8/24 이후 창업자 시트에서 온 것 = 오늘 반영한 새 컷 ──
새폴더 = ('음식-창업자-2026-08-24', '음식-창업자-2026-08-25', '음식-창업자-2026-08-26',
          '창업자-2026-08-24', '음식-창업자-2608', '음식-창업자-2608b')
새해시 = {}
for f in 새폴더:
    for p in glob.glob(f'{앱}/docs/stickers/{f}/**/*.png', recursive=True):
        if '원본시트' in p or os.path.basename(p).startswith('_'): continue
        h = sha(p)
        if h: 새해시.setdefault(h, p)

src = open(f'{앱}/src/components/FoodIcon.jsx', encoding='utf-8').read()
nm, pk = 이름표(src), 픽커(src)
사진 = re.compile(r'^(fe|fh|fy|fj|fi|fb|gr)_')
새, 옛 = [], []
for k in sorted(pk):
    if not 사진.match(k): continue
    p = f'{앱}/src/assets/stickers/photo/{k}.png'
    if not os.path.exists(p): continue
    h = sha(p)
    row = {'키': k, '이름': nm.get(k, ''), '갈래': pk[k]}
    if h in 새해시:
        row['원본'] = 새해시[h].split('docs/stickers/')[1]
        새.append(row)
    else:
        옛.append(row)

# ── ① 새 컷 이름표 ──
f1 = f'{앱}/docs/stickers/새컷-이름표-2026-08-26.json'
json.dump({
    '_': '🆕 2026-08-26 에 앱에 «반영된» 새 컷. 앱키 → 이름 · 갈래 · 창업자 원본 시트 경로.',
    '_왜': '창업자 = "오늘 반영한 새컷은 이름표 붙여서 따로 저장해. 옛컷은 보관소에 쑤셔넣어놔 안섞이게"',
    '_이름은': '앱의 FOOD_NAMES 와 «같은 우선순위»로 읽었다(규칙 첫 낱말이 EXTRA 를 덮는다). 흉내가 아니다.',
    '_주의': '⛔ 이 목록에도 «옛 톤» 컷이 섞여 있다 — 창업자가 8/24 이후 준 시트 안에 일러스트풍이 있었다. 판정 = _판정-바꿀컷-0826.json',
    '_개수': len(새), '컷': 새,
}, open(f1, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── ② 옛 컷 목록은 보관소로 ──
f2 = f'{앱}/docs/_archive/옛컷-다시뽑을것-2026-08-26.json'
os.makedirs(os.path.dirname(f2), exist_ok=True)
json.dump({
    '_': '🕰 2026-08-26 기준 앱 픽커에 «남아 있는 옛 세대» 컷. 일러스트풍(얼굴 그릇·손잡이 냄비·꽃무늬 접시).',
    '_왜': '새 컷(흰 접시 사진풍) 옆에 놓이면 톤이 튄다 → 다시 뽑을 목록.',
    '_주의': '⛔ 앱 파일은 «옮기지 않았다» — 그 키로 저장한 레시피가 깨진다. 목록으로만 갈라 둔다.',
    '_개수': len(옛), '컷': 옛,
}, open(f2, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print(f'✅ 새 컷 {len(새)}개 → docs/stickers/새컷-이름표-2026-08-26.json')
print(f'✅ 옛 컷 {len(옛)}개 → docs/_archive/옛컷-다시뽑을것-2026-08-26.json')

# ── ③ 옛 컷 «원본»을 보관소로 (앱 소스는 안 건드린다) ──
옛해시 = {}
for r in 옛:
    h = sha(f'{앱}/src/assets/stickers/photo/{r["키"]}.png')
    if h: 옛해시[h] = r['키']
옮길 = []
for p in glob.glob(f'{앱}/docs/stickers/**/*.png', recursive=True):
    if '_archive' in p or '원본시트' in p: continue
    if sha(p) in 옛해시: 옮길.append(p)

보관 = f'{앱}/docs/_archive/옛컷-원본-2026-08-26'
print(f'\n📦 옛 컷 «원본» {len(옮길)}장 → docs/_archive/옛컷-원본-2026-08-26/')
if not 진짜:
    print('   (미리보기 — 진짜 옮기려면 --진짜옮김)')
    for p in 옮길[:8]: print('   ', p.split('docs/stickers/')[1])
    if len(옮길) > 8: print(f'    … 그리고 {len(옮길)-8}장')
else:
    os.makedirs(보관, exist_ok=True)
    옮김 = 0
    for p in 옮길:
        rel = p.split('docs/stickers/')[1]
        dst = os.path.join(보관, '__'.join(rel.split('/')))
        r = subprocess.run(['git', 'mv', p, dst], cwd=뿌리, capture_output=True, text=True)
        if r.returncode == 0: 옮김 += 1
        else: print(f'   ⚠️ 못 옮김: {rel} — {r.stderr.strip()[:80]}')
    print(f'   ✅ {옮김}/{len(옮길)}장 옮김 (git mv — 히스토리 유지)')
