# 🛒🖼 「주부의 장바구니 제품 그림 23개」 확인판 (2026-09-17) — 0828 판과 같은 꼴(앱 실제 크기 19·22·42px)
# 📮 창업자 = *"주부의장바구니 아이콘 다른게 좀 있어"* → *"더 찾아봐 내가 많이 뽑아줬어"* → 8/12 59컷 중 «안 쓴 46컷»에서 22 ＋ 9/4 보류 시럽 1.
# 실행: python3 scripts/_판-큐레이션그림-0917.py → /tmp/claude-0/curicon판-0917.html · _shot-판-0828.mjs 로 찍는다
import base64
D='src/assets/curation'
컷=[('cu_bacon','무설탕 삼겹 베이컨','s506'),('cu_tortilla','우리밀 또띠아 2종','s503'),('cu_kongguk','콩국물 2종','s314'),
    ('cu_saewoojeot','참새우젓','s513'),('cu_furikake','감태랑 해물이랑 · 밥꾸러기 해물','s107'),('cu_syrup','흑당시럽(아우노)','9/4 보류'),
    ('cu_jelly','젤리스틱','s514'),('cu_nugget','꼬꼬너겟','s204'),('cu_nuts','하루견과블랙','s504'),('cu_dessert','생크림 우유롤 · 기리쉬케이크','s110'),
    ('cu_snack','초코크림파이 · 쇼콜라비스큐','s508'),('cu_mandu','물만두 · 닭가슴살 만두','s105'),('cu_rice','현미밥 즉석밥 · 곤드레나물밥','s114'),
    ('cu_friedrice','차돌듬뿍 묵은지볶음밥','s203'),('cu_jjukkumi','하남쭈꾸미','s505'),('cu_tteokgalbi','남도떡갈비','s510'),('cu_jeon','해물파전 · 김치전','s113'),
    ('cu_soup','섬진강재첩국','s305'),('cu_tang','수제 김치찌개','s306'),('cu_ciabatta','오리지널 치아바타','s515'),('cu_gim','올리브 김','s309'),
    ('cu_jam','알룰로스 딸기잼','s303'),('cu_tea','타타리메밀차','s104')]
rows=[]
for k,n,s in 컷:
    u='data:image/png;base64,'+base64.b64encode(open(f'{D}/{k}.png','rb').read()).decode()
    rows.append(f'<tr><td class="nm"><b>{n}</b><br><span class=k>{k} · {s}</span></td><td><img src="{u}" style="height:19px"></td><td><img src="{u}" style="height:22px"></td><td><img src="{u}" style="height:42px"></td><td><img src="{u}" style="height:126px"></td></tr>')
html=f'''<meta charset=utf-8><style>
body{{background:#faf7f2;font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;padding:20px;color:#3b2c1e}}
h1{{font-size:22px;margin:0 0 4px}} .sub{{font-size:14px;color:#7a6a58;margin-bottom:14px}}
table{{border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.07)}}
th{{background:#efe7db;font-size:13px;padding:8px 10px;color:#5d3410;font-weight:800}}
td{{border-top:1px solid #f0eae0;padding:9px 12px;text-align:center;vertical-align:middle}}
td.nm{{text-align:left;font-size:15px;min-width:150px}} .k{{font-size:11px;color:#a2937f}}
</style><h1>🛒 주부의 장바구니 — 제품 그림 23개 (9/17)</h1>
<div class=sub>창업자가 8/12 에 뽑아준 59컷 중 «안 쓰던» 22 ＋ 9/4 보류 시럽 1 · <b>앱에 실제로 그려지는 크기</b> 19 · 22 · 42px.<br>맨 오른쪽 126px 은 판정용 확대.</div>
<table><tr><th>제품</th><th>19px<br>칩</th><th>22px<br>칸 제목</th><th>42px<br>카드 ⭐</th><th>126px 확대</th></tr>{''.join(rows)}</table>'''
open('/tmp/claude-0/curicon판-0917.html','w').write(html); print('ok')
