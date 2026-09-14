# 창업자 한글 레시피 → 앱 백업 파일에 «더하기»
#
# ⛔ 불러오기는 «덮어쓴다»(ProfileScreen.jsx 183줄) — 그래서 «기존 백업 위에» 얹는다. 잃는 것 0.
# 📏 단위 (창업자 2026-08-10) = 숫자만 = 큰술 · t = 작은술 · C = 컵
#    ⚠️ 「다 큰술」은 «양념» 얘기다 — 감자 1·대파 1 에 큰술을 붙이면 안 된다.
#       그래서 양념 낱말에만 붙이고 나머지는 원문 그대로 둔다.
# 🔁 이름이 같아도 «내용이 다르면» 넣는다 (창업자 *"레시피가 달라서 그래"*).
#    «내용까지 같으면» 뺀다 (창업자 *"완전히 같으면 빼줘"*).
#
# 쓰는 법:  python3 tools/내레시피-백업만들기.py <원문.txt> <지금백업.json> <낼파일.json>
# ⛔ 창업자 «원문»과 «만든 백업»은 저장소에 두지 않는다 — 이 저장소는 공개(public)이고
#    그 레시피는 아직 안 푼 재고다(CLAUDE.md 주간 레시피 절 「간판」). 도구만 남긴다.
# ✅ 만든 뒤 확인 = node scripts/_repro-내레시피백업-0810.mjs <낼파일.json>
import json, re, sys, time, unicodedata

if len(sys.argv) != 4:
    print('쓰는 법: python3 tools/내레시피-백업만들기.py <원문.txt> <지금백업.json> <낼파일.json>')
    raise SystemExit(1)
SRC, BAK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

SECTIONS = {'1': '소스', '2': '밥·면·덮밥', '3': '고기', '4': '해물', '5': '국·탕·찌개', '6': '반찬·기타'}

SEASON = ('간장 진간장 맛간장 백간장 국간장 양조간장 와촌간장소스 설탕 흑설탕 식초 고춧가루 고추씨 고추장 된장 '
          '마늘 다진마늘 통마늘 깨 깨소금 참기름 들기름 고추기름 마늘기름 올리브유 식용유 오일 맛술 미림 청주 '
          '매실 매실액 올리고당 물엿 꿀 알룰로스 액젓 초피액젓 초피 멸치액젓 까나리액젓 굴소스 쯔유 소금 맛소금 '
          '후추 통후추 마요네즈 머스타드 레몬즙 라임즙 와사비 연겨자 겨자 생강 생강청 다진생강 새우가루 참치액 '
          '발사믹 스리라차 땅콩버터 땅콩가루 전분 부침가루 튀김가루 요플레 피쉬소스 배즙 새우젓 딜 물 배').split()
UNITS = 'g|kg|ml|l|L|개|컵|C|c|t|T|대|쪽|마리|줄|봉|통|캔|포|묶음|인분|알|장|손|주먹|분|도|시간|번|스푼|큰술|작은술'
# ⛔⛔ 「맨숫자」의 판정 — 뒤에 «단위·한글·또 다른 숫자·빗금»이 오면 맨숫자가 아니다.
#    이걸 안 걸면 「배즙 1/2포」가 «1» 만 잡혀 «배즙 1큰술 /2포» 가 된다(2026-08-10 실제로 그랬다).
# ⚠️ `~`·`-` 도 막는다 — 「고춧가루 3~4」는 «범위»라 앞 숫자에만 큰술을 붙이면 「3큰술~4」가 된다
BARE = rf'(?![\d가-힣a-zA-Z]|[/~-]|\s*(?:{UNITS}))'

def unit_up(seg):
    """양념 낱말 뒤 맨숫자에 큰술 · t→작은술 · C→컵"""
    s = re.sub(r'(\d+(?:\.\d+|/\d+)?)\s*[tT](?![a-zA-Z가-힣])', r'\1작은술', seg)
    s = re.sub(r'(\d+(?:\.\d+|/\d+)?)\s*[Cc](?![a-zA-Z가-힣])', r'\1컵', s)
    def one(m):
        name, num = m.group(1), m.group(2)
        if name not in SEASON:
            return m.group(0)
        return f'{name} {num}큰술'
    return re.sub(rf'([가-힣]{{1,8}})\s+(\d+(?:\.\d+|/\d+)?){BARE}', one, s)

# ── ① 한글 파일 가르기 ─────────────────────────────────
items, sec, cur = [], None, None
for raw in open(SRC, encoding='utf-8'):
    l = raw.strip()
    if not l:
        cur = None          # ⛔ 빈 줄 = 편이 끊긴다. 안 끊으면 「제육볶음(a)」가 「(b)」까지 삼킨다
        continue
    m = re.match(r'^([1-6])\.\s*(.+)$', l)
    if m and len(l) < 30:
        sec, cur = SECTIONS[m.group(1)], None
        continue
    if re.match(r'^\[.+\]$', l):
        continue
    m = re.match(r'^([^:：]{2,28})\s*[:：]\s*(.+)$', l)
    if m and not (cur and l.startswith('(')):
        이름 = m.group(1).strip()
        # ⭐ 빈 줄 뒤에 「(b, 고추장): …」 이 오면 «바로 앞 편의 b안»이다 → 앞 이름을 물려받는다.
        #    안 그러면 제목이 「(b, 고추장)」 이 되어 앱에서 무슨 요리인지 알 수 없다.
        if 이름.startswith('(') and items:
            앞 = re.sub(r'\(.*$', '', items[-1]['name']).strip()
            if 앞:
                이름 = 앞 + 이름
        cur = {'sec': sec, 'name': 이름, 'body': [m.group(2).strip()], 'raw': [l]}
        items.append(cur)
        continue
    body_like = l.startswith('(') or len(re.findall(r'\d', l)) >= 3 or l.count(',') >= 2
    if cur and body_like:
        cur['body'].append(l)
        cur['raw'].append(l)
        continue
    cur = {'sec': sec, 'name': l, 'body': [], 'raw': [l]}
    items.append(cur)
items = [i for i in items if i['name'] and i['sec']]

# ── ② 재료 / 만드는 법 가르기 ───────────────────────────
VERB = re.compile(r'(볶|끓|넣|삶|굽|썰|씻|담|졸|조리|불리|섞|버무|재우|올리|빼|뿌|덮|헹|갈라|묻히|거르|절임|짓|붓|친다|빼기|치기|하기|되도록|자작)')
RATIO = re.compile(r'[가-힣)]\s*\d[^:：]*[:：]\s*[가-힣]')   # 「부침가루 1 : 튀김가루 0.5」 = 비율이라 큰술이 아니다

def pieces(line):
    """조각내기 — ⛔ `/` 는 «양쪽에 공백»이 있을 때만 구분자다.
       공백 없는 `/` 는 분수(1/2)라 자르면 «배즙 1/2포»가 «1큰술 + 2포» 가 된다(2026-08-10 실제로 그랬다)."""
    return re.split(r'(?<=[다요기])\.\s+|\.\s+(?=[가-힣(])|\s+/\s+', line)

def split_body(body):
    ing, steps = [], []
    for line in body:
        for seg in pieces(line):
            seg = seg.strip(' .')
            if not seg:
                continue
            nums = len(re.findall(r'\d', seg))
            if VERB.search(seg) and not (seg.count(',') >= 3 and not RATIO.search(seg) and nums >= 3):
                steps.append(seg)
                continue
            if seg.count(',') == 0 and nums == 0 and len(seg) > 12:
                steps.append(seg)
                continue
            ratio = bool(RATIO.search(seg))
            for p in comma_split(seg):
                p = p.strip()
                if p:
                    ing.append(p if ratio else unit_up(p))
    return ing, steps

def comma_split(seg):
    """쉼표로 쪼개되 ⛔«괄호 안 쉼표»는 안 쪼갠다 — 「(a-1, 900g)」이 둘로 갈리면 안 된다"""
    out, buf, depth = [], '', 0
    for ch in seg:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth = max(0, depth - 1)
        if ch == ',' and depth == 0:
            out.append(buf)
            buf = ''
        else:
            buf += ch
    out.append(buf)
    return out

# ── ③ 이미 있는 것과 «내용»으로 대조 ────────────────────
bak = json.load(open(BAK, encoding='utf-8'))
def key(text):
    t = unicodedata.normalize('NFKC', text)
    return re.sub(r'[^0-9가-힣a-zA-Z]', '', t)

have = {}
for r in bak['recipes']:
    blob = key(r.get('title', '') + ''.join(r.get('ingredients') or []) + ''.join(r.get('steps') or []))
    have.setdefault(blob, r.get('title'))
have_title = {}
for r in bak['recipes']:
    have_title.setdefault(key(r.get('title', '')), []).append(r)

now = int(time.time() * 1000)
add, skipped, folders = [], [], set()
for i, it in enumerate(items):
    ing, steps = split_body(it['body'])
    blob = key(it['name'] + ''.join(ing) + ''.join(steps))
    if blob in have:
        skipped.append((it['name'], have[blob], '통째로 같음'))
        continue
    # 이름이 같은 것들과 내용을 견준다 — 「완전히 같으면」만 뺀다
    same = None
    for r in have_title.get(key(it['name']), []):
        a = key(''.join(ing) + ''.join(steps))
        b = key(''.join(r.get('ingredients') or []) + ''.join(r.get('steps') or []))
        if a and b and (a == b or (len(a) > 20 and (a in b or b in a))):
            same = r.get('title')
            break
    if same:
        skipped.append((it['name'], same, '내용 같음'))
        continue
    folders.add(it['sec'])
    add.append({
        'savedAt': now - i * 60000, 'id': f'my-{now}-{i}', 'favorite': False, 'cooked': 0,
        'title': it['name'], 'thumb': 'icon', 'emoji': '🍽️', 'label': '', 'image': None,
        'category': it['sec'], 'folder': it['sec'], 'time': 0, 'servings': 0, 'difficulty': '쉬움',
        'ingredients': ing, 'steps': steps, 'tags': [],
        # ⭐⭐ 안전망 — 재료/만드는 법 가르기가 어긋나도 «원문 한 줄»이 여기 그대로 산다.
        #    창업자 노트는 재료와 조리가 한 줄에 섞여 있어 기계가 완벽히 못 가른다.
        #    앱 상세 「메모」 칸이 pre-line 이라 줄바꿈도 그대로 보인다.
        'memo': '내가 적어둔 그대로\n' + '\n'.join(it['raw']),
        'sourceUrl': '', 'source': 'manual', 'status': 'sorted',
    })

out = dict(bak)
out['recipes'] = add + bak['recipes']
out['folders'] = list(bak['folders']) + [f for f in ['밥·면·덮밥', '고기', '해물', '국·탕·찌개', '반찬·기타'] if f in folders and f not in bak['folders']]
out['_at'] = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False)

print(f'가른 편수 {len(items)} → 새로 넣는 것 {len(add)} · 뺀 것 {len(skipped)}')
print(f'백업 레시피 {len(bak["recipes"])} → {len(out["recipes"])} · 폴더 {out["folders"]}')
print('\n── 뺀 것(내용까지 같아서) ──')
for a, b, why in skipped:
    print(f'   {a}  ←→ 앱: {b}  ({why})')
print('\n── 새로 들어갈 것 미리보기 5편 ──')
for r in add[:5]:
    print(f'\n▪ {r["title"]}  [{r["folder"]}]')
    print(f'   재료: {" · ".join(r["ingredients"])}')
    if r['steps']:
        print(f'   순서: {" / ".join(r["steps"])}')
print(f'\n저장 → {OUT}')
