# 🎨 AI 시트 프롬프트 모음 — 그대로 붙여넣어 쓰는 것

> 창업자 2026-07-31: *"다른 것도 내가 뽑아줄게. 프롬프트만줘"*
> 📌 채팅에 흩어지면 못 찾는다. **여기 하나만 보면 된다.**

---

## 0️⃣ ⛔ 모든 시트에 공통 — 이거 어기면 자를 때 사고 난다

| | 규칙 | 왜 |
|---|---|---|
| ⛔ | **`transparent background` 라고 쓰지 말 것** | AI가 **회색 체커 격자를 진짜로 그려 넣는다.** 그게 잘린 뒤 테두리에 검은 점선으로 남는다 (v9.00 사고) |
| ⛔ | **격자·행·열·개수를 지정하지 말 것** | 그걸 맞추느라 **그림 퀄이 떨어진다.** 우리 도구는 덩어리로 찾아 자르니 배치는 자유다 |
| ⛔ | 글자·숫자·로고·워터마크 금지 | AI가 이상한 글자를 넣는다. 이름은 **코드 글자**로 붙인다 |
| ✅ | **배경은 완전한 순백 `#FFFFFF`** | 회색기가 있으면 그 얼룩이 그림으로 잡혀 흰 네모가 남는다 |
| ✅ | **서로 닿지 않게 띄워서** | 닿으면 한 덩어리로 잘려 옆 그림이 딸려온다 |
| ✅ | **크게** | 늘려 쓰면 반드시 톱니가 난다 |

### 📏 컷 크기 기준 (앱 표시 크기에서 나온 값)

| 쓰임 | 앱에서 보이는 크기 | 원본 컷 긴변 | 한 장에 |
|---|---:|---:|---|
| 프레임·표지 | 626px | **600px 이상** | 4컷 (2×2) |
| 데코·소품·글자 | 84~240px | 250px 이상 | 12~20컷 |
| 캐릭터(친구들) | 238px | 400px 이상 | 4~6컷 |
| **배경** | 1170px | **정사각 1254×1254 한 장에 하나** | 1개 |

---

## 1️⃣ 🖼 배경 (유료팩)

### 공통 꼬리말 — 아래 모든 배경 프롬프트 뒤에 붙인다
```
Square 1:1, full-bleed, seamless whole-image background.
Center area left plain and pale so stickers placed on top stay readable —
keep the strongest colors and busiest detail near the edges and corners.
Muted low-contrast palette, soft natural light, subtle grain.
Flat illustration, no characters, no text, no letters, no numbers,
no logo, no watermark, no border frame, no vignette, no drop shadows.
```

⚠️ **꼬르곰이 주황갈색이다** — 배경에 주황이 세면 곰이 묻힌다.
   그래서 꼬리말에 *"strongest colors near the edges"* 가 들어 있다. 빼지 말 것.

### 🍂 추석 팩 (9월 — 제일 먼저 나간다)

**① 조각보** ✅ **2026-07-31 합격본 확보**
```
Korean traditional jogakbo patchwork fabric, irregular patches of hand-dyed ramie
and silk cloth stitched together — different sizes, not a neat grid.
Warm muted palette only: cream, oatmeal, soft ochre, dusty persimmon, faded camel,
warm ivory. Visible woven thread texture in every patch, thread direction differs
per patch. Hand-stitched seams with small uneven running stitches, slightly raised.
Gentle fabric wrinkles.
```

**② 한지**
```
Korean hanji mulberry paper, natural long fibers visible lying with the grain,
warm cream to soft ivory, uneven handmade edges of pulp, very calm and quiet,
faint deckle texture.
```

**③ 달빛 밤**
```
Deep autumn night sky before a harvest moon, dusky indigo-grey blending to warm
charcoal, a soft full moon glow in one upper corner with a faint halo ring,
thin drifting clouds lying horizontally, quiet and dim.
```
⚠️ 어두운 배경엔 **글자를 밝은 색으로** 써야 한다.

### 🍁 가을 다꾸 팩 (10월)

**④ 크라프트**
```
Kraft paper, warm tan and light brown, visible paper pulp flecks and short fibers,
slightly uneven tone, matte recycled paper.
```

**⑤ 비 오는 창**
```
Looking through a rainy window on an autumn afternoon, soft blurred warm bokeh
outside in amber and ochre, raindrops and gentle streaks running down the glass,
misty fogged glass, muted warm grey.
```

**⑥ 단풍길**
```
Autumn ground seen from above, fallen maple and ginkgo leaves scattered on soft
earth, muted orange, ochre and dusty green, soft watercolor painterly,
leaves gathered thickly at the edges and corners.
```

### ❄️🌸 다음 계절 (미리 적어둠 — 확정된 축은 계절마다 대표 팩 하나)
**⑦ 크리스마스** — `Soft winter knit blanket texture, chunky wool cable knit, cream and dusty sage and faded red, cozy and warm`
**⑧ 벚꽃** — `Pale spring sky with drifting cherry blossom petals, soft pink and warm white, watercolor wash, petals gathered at the edges`
**⑨ 물놀이** — `Sunlit swimming pool water seen from above, gentle caustic light ripples, muted aqua and cream, calm and shallow`

---

## 2️⃣ 🐻🐧 캐릭터 (꼬르곰·펭펭과 친구들)

### 공통 꼬리말
```
White #FFFFFF background. Characters clearly separated, not touching each other.
Thin white die-cut outline around each character (sticker style).
Soft rounded kawaii style, warm muted colors, clean dark brown outline.
No text, no letters, no logo, no watermark, no border frame.
```

⭐ **흰 다이컷 테두리를 꼭 넣어달라고 할 것** — 그게 있으면 자를 때 **진갈색 외곽선이 안 파먹힌다.**
   (꼬르곰·펭펭 옛 컷이 멀쩡했던 이유가 이거다)

### 계절 포즈 시트 (한 장 4~6컷)
```
Four full-body poses of the same two characters in one image:
a plump light-brown bear in a chef hat and cream apron with a fried-egg pocket,
and a small penguin with a black bob haircut, cream beret and BEIGE trench coat.
Autumn scene props: maple leaves, chestnuts, a basket, a paper coffee cup.
```
⚠️ **트렌치는 반드시 `BEIGE`** — 흰색으로 나오면 흰 배경에서 옷이 안 보인다(2026-07-31 다시 뽑음).
⚠️ **펭펭 머리는 회색-검정, 얼굴만 흰색** — 머리까지 희면 펭귄으로 안 읽힌다.

### 얼굴 시트 (아바타용)
```
Five character faces only, head and hat, facing front, evenly spaced.
```
⚠️ 아바타는 **동그라미 32~56px**이다 → **얼굴만.** 전신을 넣으면 얼굴이 12px가 된다.
⚠️ **목 아래 장식(리본·목도리)은 넣지 말 것** — 원에 넣으면 잘리고 머리가 작아진다.

---

## 3️⃣ 🍰 소품·데코 시트

```
Autumn scrapbook stickers on white #FFFFFF background, clearly separated,
each with a thin white die-cut outline.
Maple leaves, ginkgo, acorns, chestnuts, persimmons, a woven basket,
a thermos, a knitted scarf.
Soft flat illustration, warm muted colors, clean outline, no gradients.
No text, no letters, no logo, no watermark.
```

⚠️ **바구니 손잡이처럼 「그림 안에 갇힌 구멍」**이 있으면 말해줄 것 → 자를 때 `--punch` 를 켠다.
   안 켜면 손잡이 안쪽이 **흰 판으로 막힌다**(어두운 배경에서만 보인다).

---

## 4️⃣ 🖼 프레임 시트

```
Four decorative photo frames in one image, 2 by 2, large.
Each frame is a complete closed loop with a big empty white center.
Soft rounded kawaii style, warm muted colors, clean outline.
White #FFFFFF background, frames not touching each other.
No text, no letters, no logo, no watermark.
```

⚠️ **한 장에 4컷까지만** — 프레임은 앱에서 626px로 크게 쓰인다. 12컷으로 뽑으면 컷이 280px라 늘려 쓰게 되고 톱니가 난다.
⚠️ **가운데가 완전히 뚫려 있어야** 창을 뚫을 수 있다. 안쪽에 그림이 있으면 그게 같이 지워진다(조개 진주 사고).

---

## 5️⃣ 🎀 마스킹테이프

```
Washi tape strips laid flat, each a long horizontal band with torn deckled ends,
repeating small autumn pattern inside. White #FFFFFF background,
strips clearly separated and not touching.
```
⚠️ 마테는 **양 끝이 잘린 게 정상**이다(디자인) — 컷 검수에서 예외로 둔다.

---

## 6️⃣ 📮 받은 뒤 클로드가 하는 일 (창업자는 안 해도 됨)

1. **그날 바로 저장** → `docs/stickers/<팩이름>/원본시트/`
2. `python3 tools/sheet-index.py --check <시트>` — 격자·컷크기·흰다이컷 검사
3. `python3 tools/cut.py <시트> <폴더> <접두어> --diecut auto|keep --drop 0` — 자르기 + 3단계 검수 자동
4. 앱 등록(`Stickers.jsx` + `PHOTO_RATIO`) → `npm run smoke`
5. **곰펭 얹은 실제 표지**로 보여주기 → 창업자는 그것만 보고 판단

📌 **창업자는 「완성본 판단」만 한다.** 반복·시행착오는 전부 클로드가 (CLAUDE.md 규칙8).
