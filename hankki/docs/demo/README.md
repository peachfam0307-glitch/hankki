# 🎬 표본집 (창업자에게 보여주는 페이지)

말로 설명해도 안 보이는 것들 — **움직임·색·질감** — 은 만들어서 보여준다.
전부 **자기완결 HTML 한 장**이라 링크만 열면 폰에서도 그대로 움직인다.

| 파일 | 무엇 | 링크 |
|---|---|---|
| `build.py` → `motion-catalog.html` | 모션 16 · 효과 13을 **축별로** 묶어 실제로 움직여 보여줌 | https://claude.ai/code/artifact/260d0f69-342d-41a8-bd95-01f0e6e7daaa |
| `bg-build.py` → `background-catalog.html` | 배경 24종(그림 파일 0장) | https://claude.ai/code/artifact/91ad26bb-6be6-4a38-b8d5-32ff214a9afe |
| `bgpack-build.py` → *(생성물)* | 유료팩 배경 — 추석 3안 · 가을다꾸 3안. **실제 가을 스티커로 꾸민 표지**를 얹어 본다 | 아직 안 올림 |

## 쓰는 법
```
python3 docs/demo/build.py        # 모션·효과 표본집
python3 docs/demo/bg-build.py     # 배경 표본집
python3 docs/demo/bgpack-build.py # 유료팩 배경 (1.2MB — 생성물은 커밋 안 함)
```

## 규칙
- ⭐ **모션·효과 CSS 는 `src/styles.css` 에서 그대로 떠 온다.** 손으로 옮겨 적으면 언젠가
  앱과 어긋나서 *"데모에선 예뻤는데 앱에선 다르다"* 가 된다.
- 글꼴은 우리 앱 글꼴(주아·고운돋움)을 **그 페이지에 쓰인 글자만** 잘라 넣는다(수십 KB).
- 같은 그림이 여러 칸에 나와도 **CSS 클래스로 한 번만** 넣는다(안 그러면 파일이 몇 배가 된다).
- `bgpack-catalog.html` 은 1.2MB라 **커밋하지 않는다** — 필요할 때 위 명령으로 다시 만든다.
