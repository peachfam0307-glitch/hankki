# 🛒 원재료 전사 «검수판» 생성기 (2026-09-17)
#
#   창업자가 찍어 준 포장 사진(업로드 폴더) 옆에 클로드가 옮겨 적은 글자를 놓고,
#   칸마다 「맞다 / 틀리다 / 빼자」 ＋ 한마디 → 맨 아래 「복사하기」(절대원칙 · 검수판은 체크＋복사).
#   ⛔ 사진은 저장소에 안 둔다(손·집이 찍혔다) → 결과 HTML 은 scratchpad 로만. 생성기만 저장소에(규칙 30).
#   데이터 = docs/장바구니-원재료-전사-2026-09-17.json  (검수 «전» 초안)
#
# 실행: python3 scripts/_판-원재료검수-0917.py <업로드폴더> <출력.html>
import json, base64, io, glob, os, sys, html as H
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UP, OUT = sys.argv[1].rstrip('/') + '/', sys.argv[2]
d = json.load(open(os.path.join(ROOT, 'docs/장바구니-원재료-전사-2026-09-17.json'), encoding='utf-8'))

# 사진 짝 — 업로드 파일 이름 앞 8자. ⚠️ 컨택트시트(scratchpad/contact.jpg)로 눈 대조한 값(2026-09-17 15:10).
PIC = {
 '성가정 우리콩 진간장': ['f59433f4', 'c611b03c'], '샘표 우리콩 양조간장': ['4ce8edce'], '홍영의 붉은대게 백간장': ['28b399ab', 'b98c3add'],
 '연두 우리콩 요리에센스': ['436422f7'], '요리맛샘 맛술': ['1364c775'], '모에솔트 대파소금': ['fd7746c3'], '아우노슈가': ['c6fb404d'], '아우노 흑당시럽': ['a56b6aa1'],
 '설성목장 한우 사골 곰탕 스틱': ['87c25e5b', '5c6e929c'], '복이네먹거리 고춧가루': ['38b31568'], '자연누리 훈제오리': ['145f44b6'],
 '우리별피자 작은사이즈 고르곤졸라 · 불고기피자': ['ef9de035', '60e931ab'], '빅마마 이혜정의 꽉찬 수제 영양밥': ['7408881f'],
 '굽네 닭가슴살 만두': ['0701fb2a'], '하남쭈꾸미': ['46b66a53'], '연세우유 소화가 잘되는 우유': ['f09883d6'], '연세 국산콩두유 약콩': ['9d3c8120'],
 '맥된장': ['960e4b31'], '백합된장': ['27a4c4cd'], '낫또': ['7659bde4'], '와촌식품 초피액젓': ['8afd535d'], '상하농원 버터치킨카레': ['6feaf9a3'],
 '치밀 유기농 골드퀸 현미밥 즉석밥': ['83c5e24b'], '참새우젓': ['d347c8f0'],
 '동트는농가 청국장찌개': ['ac58e407'], '면사랑 동치미맛 냉면육수': ['6f9e41c0'], '로다스 클로티드 크림 (영국 · 라구르망디즈 수입)': ['57820c1a'],
 '빠삐 게랑드버터 (PETIT BEURRE GUERANDE)': ['13aefa92', '264e9ef2'], '프레지덩 버터 (PRESIDENT BEURRE)': ['36f04c71'],
 '대상 매실(청?) — 라벨에 제품명 안 찍힘': ['81864d29'], '천년미인 다시마초': ['7913b5a5'], '호두 스프레드 (유리병 · 파주 ?)': ['544fa03d'],
 '레오나르디 화이트 발사믹 콘디멘토': ['40378a94'], '강동상회 들기름(국산)': ['42adf52d'], '정남진 장흥 건조 매생이': ['f7eb0d46', 'ace7aaa1'],
 '포트럭 국산 해물모듬': ['707f790f'], '하인즈 디스틸드 화이트 식초': ['d1252799'],
}
ROT = {'145f44b6': 90, '46b66a53': 90, '7408881f': -90, '57820c1a': -90, '544fa03d': -90, '0701fb2a': 180}

def img(h):
    fs = glob.glob(UP + h + '*')
    if not fs: return ''
    im = ImageOps.exif_transpose(Image.open(fs[0])).convert('RGB')
    if h in ROT: im = im.rotate(ROT[h], expand=True)
    im.thumbnail((1100, 1100)); b = io.BytesIO(); im.save(b, 'JPEG', quality=72)
    return '<img src="data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode() + '" loading="lazy">'

rows, n, missing = [], 0, []
for sec, items in (('목록에 있는 편', d['목록에_있는_편']), ('목록에 «없는» 편 (넣을지 창업자가 정한다)', d['목록에_없는_편'])):
    rows.append(f'<h2>{sec}</h2>')
    for it in items:
        n += 1
        hs = PIC.get(it['name'])
        if not hs: missing.append(it['name'])
        imgs = ''.join(img(h) for h in (hs or []))
        warn = ' ⚠️' if ('?' in it.get('ingredients', '') + it.get('allergen', '') or '잘림' in json.dumps(it, ensure_ascii=False)) else ''
        def blk(k, label, cls=''):
            v = it.get(k, '')
            return f'<b>{label}</b><p class="{cls}">{H.escape(v)}</p>' if v else ''
        rows.append(f'''<section class="it" data-n="{n}" data-name="{H.escape(it['name'])}"><h3>{n}. {H.escape(it['name'])}{warn}</h3><div class="pics">{imgs}</div>
<div class="txt">{blk('ingredients','원재료명')}{blk('allergen','알레르기')}{blk('nutrition','영양·용량')}{blk('메모','메모','memo')}</div>
<div class="btns"><button data-v="맞다">맞다</button><button data-v="틀리다">틀리다</button><button data-v="빼자">빼자</button></div><textarea placeholder="틀린 곳 · 한마디"></textarea></section>''')

page = '''<!doctype html><html lang=ko><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>원재료 전사 검수판 2026-09-17</title>
<style>body{font-family:-apple-system,"Noto Sans KR",sans-serif;margin:0;padding:14px;background:#faf6f0;color:#2b2118;font-size:16px}h1{font-size:19px}h2{font-size:16px;background:#f0e4d2;padding:6px 10px;border-radius:8px;margin:22px 0 8px}
.it{background:#fff;border-radius:14px;padding:12px;margin-bottom:14px;box-shadow:0 1px 3px #0001}.it h3{font-size:17px;margin:0 0 8px}.pics img{width:100%;border-radius:10px;margin-bottom:6px}
.txt b{display:block;font-size:13px;color:#8a6a3e;margin-top:8px}.txt p{margin:2px 0;line-height:1.55;font-size:15.5px}.memo{color:#a0522d;font-size:14px}
.btns{display:flex;gap:6px;margin-top:10px}.btns button{flex:1;padding:11px 0;border:1.5px solid #c9b8a0;border-radius:10px;background:#fff;font-size:16px;font-weight:700;color:#5b4632}.btns button.on{background:#6b4f2e;color:#fff;border-color:#6b4f2e}
textarea{width:100%;box-sizing:border-box;margin-top:8px;border:1px solid #ddd;border-radius:8px;padding:8px;font-size:15px;min-height:40px}
.foot{position:sticky;bottom:0;background:#faf6f0;padding:10px 0}.foot button{width:100%;padding:14px;border:0;border-radius:12px;background:#6b4f2e;color:#fff;font-size:17px;font-weight:800}
.cnt{font-size:14px;color:#666;margin-bottom:6px}#out{white-space:pre-wrap;font-size:13px;background:#fff;border:1px solid #ddd;padding:8px;border-radius:8px;display:none}</style></head><body>
<h1>🛒 원재료 전사 검수판 · 2026-09-17 (''' + str(n) + '''편)</h1><p class=cnt>사진과 글자를 견줘 <b>맞다 / 틀리다 / 빼자</b>. ⚠️ 표시 = 사진에서 못 읽은 곳이 있음. 맨 아래 「복사하기」로 결과를 나한테.</p>
''' + '\n'.join(rows) + '''
<div class=foot><div class=cnt id=c></div><button id=copy>복사하기</button><div id=out></div></div>
<script>
const K='hankki:원재료검수:0917';let st={};try{st=JSON.parse(localStorage.getItem(K)||'{}')}catch{}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(st))}catch{}};
const TOTAL=''' + str(n) + ''';
document.querySelectorAll('.it').forEach(s=>{const n=s.dataset.n;const r=st[n]||{};s.querySelectorAll('button').forEach(b=>{if(r.v===b.dataset.v)b.classList.add('on');b.onclick=()=>{s.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');st[n]={...(st[n]||{}),v:b.dataset.v,name:s.dataset.name};save();cnt()}});const t=s.querySelector('textarea');t.value=r.memo||'';t.oninput=()=>{st[n]={...(st[n]||{}),memo:t.value,name:s.dataset.name};save()}});
function cnt(){const v=Object.values(st).filter(x=>x.v);document.getElementById('c').textContent=`판정 ${v.length} / ${TOTAL}`}cnt();
document.getElementById('copy').onclick=async()=>{const lines=Object.entries(st).sort((a,b)=>a[0]-b[0]).map(([n,r])=>`${n}. ${r.name} = ${r.v||'(아직)'}${r.memo?' · '+r.memo:''}`);const txt='원재료 검수 2026-09-17\\n'+lines.join('\\n');const o=document.getElementById('out');o.style.display='block';o.textContent=txt;try{await navigator.clipboard.writeText(txt);alert('복사됐어')}catch{const rg=document.createRange();rg.selectNodeContents(o);const s=getSelection();s.removeAllRanges();s.addRange(rg);alert('길게 눌러 복사해줘')}};
</script></body></html>'''
open(OUT, 'w', encoding='utf-8').write(page)
print('items', n, 'missing pics', missing, 'KB', os.path.getsize(OUT) // 1024)
