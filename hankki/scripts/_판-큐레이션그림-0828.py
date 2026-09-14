# 🛒🖼 「주부의 장바구니 새 갈래 그림」 확인판 (2026-08-28)
#
# 📮 창업자 = *"갈래그림 다 그렸었는데 찾아봐."* → 있었다.
#    `docs/stickers/장바구니아이콘-창업자-2026-08-12/낱개/` 에 **59컷 ＋ 이름표.json** 이 잘려 있었는데
#    **2주 넘게 앱에 한 컷도 안 들어가 있었다.** 뿌리 = `docs/stickers/README.md` 에 그 폴더가 없어서
#    마스터 인덱스로 찾을 수가 없었다(그래서 나는 「새로 뽑아 달라」고 할 뻔했다).
#
# ⭐⭐ 이 판의 심장 = **「앱에 실제로 그려지는 크기」로 보여준다.**
#    ⛔ 원본은 200px 인데 앱은 19px(칩)·22px(칸 제목)·**42px(카드)** 로 줄여 그린다.
#       크게 뽑아 보여주면 창업자가 «안 보이는 크기»를 보고 판정하게 된다(v8.95 스티커 사고와 같은 뿌리).
#    ⭐ 그래서 19·22·42 를 «그대로» 놓고, 판정용 확대(126px)는 맨 오른쪽에 따로 둔다.
#
# ⛔ 이 판은 `check-curicon` 게이트를 «넘기는 도구»가 아니다 — 창업자가 보고 OK 해야
#    `scripts/curation-icons.json` 에 줄이 들어가고, 그때 배포가 열린다.
#
# 실행: cd /home/user/hankki/hankki && python3 scripts/_판-큐레이션그림-0828.py
#       → /tmp/curicon판.html · node scripts/_shot-판-0828.mjs 로 찍는다
import base64, os, io
D='src/assets/curation'
컷=[('cu_tteok','떡'),('cu_bread','빵'),('cu_milk','우유·유제품'),('cu_yogurt','요거트'),
    ('cu_kimchi','김치·절임'),('cu_meal','간편식'),('cu_salad','샐러드'),('cu_coffee','커피·차'),
    ('cu_spread','잼·스프레드'),('cu_granola','그래놀라'),('cu_egg','계란'),
    ('cu_mushroom','버섯·채소'),('cu_pizza4','피자')]
rows=[]
for k,n in 컷:
    b=base64.b64encode(open(f'{D}/{k}.png','rb').read()).decode()
    u=f'data:image/png;base64,{b}'
    rows.append(f'''<tr><td class="nm"><b>{n}</b><br><span class=k>{k}</span></td>
<td><img src="{u}" style="height:19px"></td>
<td><img src="{u}" style="height:22px"></td>
<td><img src="{u}" style="height:42px"></td>
<td><img src="{u}" style="height:126px"></td></tr>''')
html=f'''<meta charset=utf-8><style>
body{{background:#faf7f2;font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif;padding:20px;color:#3b2c1e}}
h1{{font-size:22px;margin:0 0 4px}} .sub{{font-size:14px;color:#7a6a58;margin-bottom:14px}}
table{{border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.07)}}
th{{background:#efe7db;font-size:13px;padding:8px 10px;color:#5d3410;font-weight:800}}
td{{border-top:1px solid #f0eae0;padding:9px 12px;text-align:center;vertical-align:middle}}
td.nm{{text-align:left;font-size:15px;min-width:150px}} .k{{font-size:11px;color:#a2937f}}
</style>
<h1>🛒 주부의 장바구니 — 새 갈래 그림 13개</h1>
<div class=sub>창업자가 2026-08-12 에 뽑아준 59컷 중 13개 · <b>앱에 실제로 그려지는 크기</b>가 19 · 22 · 42px 이다.<br>
맨 오른쪽 126px 은 <b>판정용 확대</b>(실제로는 저만큼 안 크다).</div>
<table><tr><th>갈래</th><th>19px<br>칩</th><th>22px<br>칸 제목</th><th>42px<br>카드 ⭐</th><th>126px 확대</th></tr>
{''.join(rows)}</table>'''
open('/tmp/curicon판.html','w').write(html)
print('ok')
