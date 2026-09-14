# 🔍 전수 대조 — 픽커에 실린 요리 컷 «전부»를 창업자가 붙인 이름과 1:1로 맞춘다
# 📮 창업자 2026-08-26 = "전수로해 하나하나 다 대조해서 하라고!!!
#    니가 기존에 앱에 비슷한 음식은 어떻게 선별해서 넣는다는 값도 있을거 아냐. 다 고려해서 넣으라고"
# ⭐ 「선별하는 값」 = ICON_RULES — 제목의 어느 낱말이 이 컷을 부르는지까지 같이 찍는다
# 🏷 이름표 = 반영됨
import sys, os, re, json, glob, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _이름표읽기 import 이름표, 픽커
앱 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sha(p):
    try: return hashlib.sha1(open(p,'rb').read()).hexdigest()
    except: return None

# ── 창업자가 붙인 이름 (해시 → 이름) · ⛔짐작 금지 ──
창, 출처 = {}, {}
def put(p, nm, src):
    # ⛔ 파일명 앞에 붙은 «번호·앱키»는 이름이 아니다 — 안 떼면 「fe_287-고구마전」이 이름이 되어
    #    앱의 「고구마전」과 다르다고 잘못 잡는다(2026-08-26 실제로 12건 오탐).
    nm = (nm or '').strip()
    nm = re.sub(r'^(fe|fh|fy|fj|fi|fb|gr|ig)_[0-9A-Za-z]+[-_]', '', nm)
    nm = re.sub(r'^\d{2}-\d{2}-', '', nm)
    nm = re.sub(r'[-_]?\d+$', '', nm).strip()
    if not nm or not re.search(r'[가-힣A-Za-z]', nm): return
    h = sha(p)
    if h and h not in 창: 창[h], 출처[h] = nm, src

S = f'{앱}/docs/stickers'
for folder in ('음식-창업자-2026-08-24','음식-창업자-2026-08-26'):
    f = f'{S}/{folder}/이름표.json'
    if not os.path.exists(f): continue
    for 시트, names in json.load(open(f,encoding='utf-8')).items():
        if 시트.startswith('_') or not isinstance(names, list): continue
        for p in glob.glob(f'{S}/{folder}/낱개/{시트}/*.png') + glob.glob(f'{S}/{folder}/낱개/{시트}*.png'):
            m = re.search(r'(\d\d)$', os.path.basename(p)[:-4])
            if m and 1 <= int(m.group(1)) <= len(names): put(p, names[int(m.group(1))-1], f'{folder}/{시트}')
f = f'{S}/창업자-2026-08-24/음식96-이름표.json'
if os.path.exists(f):
    for r in json.load(open(f,encoding='utf-8')):
        for p in glob.glob(f'{S}/창업자-2026-08-24/**/{r["칸"]}*.png', recursive=True): put(p, r['이름'], '음식96-이름표')
# ⭐ 보관소도 훑는다 — 창업자 허락 2026-08-26 ("응 아카이브 열어서 101컷 마저 찾아").
#    앱에 든 옛 컷 59개의 출처가 거기 있었다.
for pat in (f'{S}/**/*.png', f'{앱}/docs/_archive/**/*.png', f'{앱}/../_archive/**/*.png'):
    for p in glob.glob(pat, recursive=True):
        if '원본시트' in p: continue
        b = os.path.basename(p)[:-4]
        if re.search(r'[가-힣]', b) and not b.startswith('_'):
            put(p, b, '보관소' if '_archive' in p else p.split('docs/stickers/')[1].split('/')[0])
old = json.load(open(f'{S}/아이콘-이름표-창업자.json', encoding='utf-8')).get('컷', {})

# ── 앱 ──
src = open(f'{앱}/src/components/FoodIcon.jsx', encoding='utf-8').read()
nm, pk = 이름표(src), 픽커(src)
규칙 = {}
r = src[src.index('const ICON_RULES = ['):]
for m in re.finditer(r"\[\[([^\]]*)\],\s*'([^']+)'\]", r):
    규칙.setdefault(m.group(2), []).extend(re.findall(r"'([^']*)'", m.group(1)))
사진 = re.compile(r'^(fe|fh|fy|fj|fi|fb|gr)_')
씻 = lambda s: re.sub(r'\([^)]*\)|[\s·]+', '', s or '')

# ⛔⛔ 「앱 이름 ≠ 시트 라벨」이지만 «사유가 확인된» 것 — 2026-08-26 전수로 하나씩 닫았다.
#    ⭐ 여기 «없는» 것이 새로 나오면 그건 진짜 어긋난 것이다.
사유 = {
    # ⑴ 창업자 판정 「설명이라 뗀다」 — 맛 수식어는 요리 이름이 아니다 (_판정-이름정리-0826.json)
    'fe_417': '설명뗌', 'fe_479': '설명뗌', 'fe_491': '설명뗌', 'fe_517': '설명뗌', 'fe_518': '설명뗌',
    'fe_519': '설명뗌', 'fe_520': '설명뗌', 'fe_521': '설명뗌', 'gr_003': '설명뗌', 'gr_056': '설명뗌',
    'gr_106': '설명뗌', 'gr_227': '설명뗌', 'gr_229': '설명뗌', 'gr_230': '설명뗌',
    'fe_522': '설명뗌', 'fe_523': '설명뗌', 'fe_524': '설명뗌',
    # ⑵ ⭐앱이 맞다 — 창업자 «원본 파일명»이 서로 뒤바뀌어 있었다(2026-08-14 픽셀로 확인)
    #    08-05-소스.png 안에 나물이, 08-06-궁채나물.png 안에 소스가 들어 있었다.
    'fe_128': '원본 라벨이 뒤바뀜 · 앱이 맞다',
    # ⑶ 시트 라벨을 그대로 쓰면 «다른 컷과 이름이 겹친다» → 구분되는 이름을 쓴다
    'fe_270': '겹침(fe_110 이 레터스랩)', 'gr_055': '겹침(gr_263 이 두부조림(간장))',
    'gr_221': '겹침(fe_119 가 해물전)',
}
같, 다, 모름, 사유있음 = [], [], [], []
for k in sorted(pk):
    if not 사진.match(k): continue
    p = f'{앱}/src/assets/stickers/photo/{k}.png'
    if not os.path.exists(p): continue
    a = nm.get(k, ''); h = sha(p)
    c, s = 창.get(h), 출처.get(h, '')
    if not c and k in old: c, s = old[k], '아이콘-이름표-창업자.json'
    row = {'키': k, '앱이름': a, '창업자이름': c, '출처': s, '갈래': pk[k], '규칙낱말': 규칙.get(k, [])}
    if not c: 모름.append(row)
    elif 씻(c) == 씻(a): 같.append(row)
    elif k in 사유: row['사유'] = 사유[k]; 사유있음.append(row)
    else: 다.append(row)

print(f'픽커에 실린 요리 컷 {len(같)+len(다)+len(모름)+len(사유있음)}개 전수 대조 (보관소 포함)')
print(f'  ✅ 창업자 이름과 같다        {len(같)}')
print(f'  ✅ 다르지만 «사유 확인됨»     {len(사유있음)}')
print(f'  ⛔ 사유 없이 «다르다»         {len(다)}   ← 0 이라야 한다')
print(f'  ❓ 원본에 이름이 없다(옛 컷)   {len(모름)}')
if 다:
    print('\n⛔ 사유 없이 어긋났다 — 확인이 필요하다')
    for x in 다: print(f"   {x['키']:9} 앱「{x['앱이름']}」 ↔ 원본「{x['창업자이름']}」  [{x['출처']}]")
json.dump({'다': 다, '사유있음': 사유있음, '모름': 모름, '같음수': len(같)},
          open(f'{앱}/scripts/_전수대조-0826.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
if '--다' in sys.argv:
    for x in 다: print(f"   {x['키']:8} 앱「{x['앱이름']}」 ↔ 창업자「{x['창업자이름']}」  [{x['갈래']}]")
if '--모름' in sys.argv:
    from collections import Counter
    print('\n❓ 못 찾은 것 갈래별:', Counter(x['갈래'] for x in 모름).most_common())
    for x in 모름: print(f"   {x['키']:8} 앱「{x['앱이름']}」  규칙낱말={x['규칙낱말'][:4]}")
