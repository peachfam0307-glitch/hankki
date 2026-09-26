# 🔔 알림 켜는 길 그림 — 창업자·딸 폰 실물 캡처(docs/알림안내-캡처-2026-09-26)를 «누를 줄만» 잘라 빨간 테두리를 친다.
# ⛔ 개인정보 = 캡처엔 설치 앱 목록이 보인다 → 누를 줄 둘레만 좁게 자른다(옆 앱 이름이 안 들어가게).
# 실행: python3 scripts/_그림-알림켜는길-0926.py
from PIL import Image, ImageDraw
import os
SRC = 'docs/알림안내-캡처-2026-09-26'
OUT = 'src/assets/pushguide'
# (파일, 자르기 x0,y0,x1,y1, 표시 x0,y0,x1,y1, 모양)
칸 = {
  'g1': ('갤럭시/1-설정앱.jpg',        (90, 900, 470, 1250),  (150, 930, 410, 1215), 'o'),
  'g2': ('갤럭시/2-애플리케이션.jpg',  (0, 800, 1080, 1060),  (40, 862, 1040, 998), 'r'),
  'g3': ('갤럭시/3-한끼찾기.jpg',      (0, 1110, 1080, 1340), (40, 1150, 1040, 1300), 'r'),
  'g4': ('갤럭시/4-알림.jpg',          (0, 590, 1080, 830),   (40, 630, 1040, 800), 'r'),
  'g5': ('갤럭시/5-알림허용.jpg',      (0, 270, 1080, 480),   (30, 295, 1050, 455), 'r'),
  'i1': ('아이폰/1-홈-설정앱.png',     (820, 180, 1170, 470), (870, 195, 1115, 445), 'o'),
  'i2': ('아이폰/2-설정-앱줄.png',     (0, 2020, 1170, 2260), (45, 2060, 1125, 2220), 'r'),
  'i3': ('아이폰/3-앱목록-한끼.png',   (0, 1010, 1170, 1215), (45, 1040, 1125, 1190), 'r'),
  'i4': ('아이폰/4-한끼-알림줄.png',   (0, 1055, 1170, 1270), (45, 1070, 1125, 1255), 'r'),
  'i5': ('아이폰/5-알림허용.png',      (0, 330, 1170, 545),   (45, 355, 1125, 520), 'r'),
}
os.makedirs(OUT, exist_ok=True)
for k, (f, c, m, 모양) in 칸.items():
  im = Image.open(os.path.join(SRC, f)).convert('RGB')
  d = ImageDraw.Draw(im)
  if 모양 == 'o': d.ellipse(m, outline=(232, 64, 52), width=12)
  else: d.rounded_rectangle(m, radius=40, outline=(232, 64, 52), width=12)
  cut = im.crop(c)
  w = 540; cut = cut.resize((w, round(cut.height * w / cut.width)), Image.LANCZOS)
  cut.save(os.path.join(OUT, f'{k}.webp'), 'WEBP', quality=82)
  print(k, cut.size, os.path.getsize(os.path.join(OUT, f'{k}.webp')))
