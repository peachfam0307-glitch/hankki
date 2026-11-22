#!/usr/bin/env python3
# 🇰🇷 [절대원칙 · 창업자 2026-11-22 「왜 자꾸 영어 쓰는 거야? 보고 전에 한글인지 확인하는 도구 만들어」]
#   답을 끝내기 «직전»(Stop)에 내 마지막 답 글을 읽어, 영어 문장이 있으면 «돌려보낸다»(exit 2 → 한국어로 다시 쓴다).
#   ⭐ 왜 장치인가 = 규칙(CLAUDE.md 3번 · 2026-11-22 절대원칙)은 이미 있었는데 같은 날 두 번 더 영어로 보고했다.
#   ✅ 영어로 안 치는 것 = 코드 블록 · `백틱` · 주소 · 파일 경로 · 고유명(유튜브 채널명·제품명 같은 짧은 낱말)
#   ⛔ 막는 것 = 영어 낱말이 «4개 이상 이어진» 문장 조각 · 또는 글자 중 영어가 한글보다 많을 때
#   🔁 끝없는 되풀이 막기 = 연달아 2번까지만 돌려보낸다(그 뒤엔 통과 · 표식 파일)
import json, re, sys, os

표식 = '/tmp/hankki-korean-guard-count'

def 끝(코드, 말=''):
    if 말:
        sys.stderr.write(말)
    sys.exit(코드)

try:
    입력 = json.load(sys.stdin)
except Exception:
    끝(0)
경로 = 입력.get('transcript_path') or ''
if not 경로 or not os.path.exists(경로):
    끝(0)

# 마지막 «사람 말» 뒤의 내 글만 모은다
줄들 = []
with open(경로, encoding='utf-8') as f:
    for l in f:
        try:
            줄들.append(json.loads(l))
        except Exception:
            pass
글 = []
for e in reversed(줄들):
    t = e.get('type')
    m = e.get('message') or {}
    if t == 'user':
        c = m.get('content')
        # 도구 결과(tool_result)는 사람 말이 아니다 — 건너뛴다
        if isinstance(c, str) or (isinstance(c, list) and any(isinstance(x, dict) and x.get('type') == 'text' for x in c)):
            break
        continue
    if t == 'assistant':
        for x in (m.get('content') or []):
            if isinstance(x, dict) and x.get('type') == 'text':
                글.insert(0, x.get('text') or '')
본문 = '\n'.join(글)
if not 본문.strip():
    끝(0)

깨끗 = re.sub(r'<system-reminder>.*?</system-reminder>', ' ', 본문, flags=re.S)   # 시스템이 붙인 알림 = 내 글 아님(2026-11-22 헛경보)
깨끗 = re.sub(r"(?m)^.*(The task tools haven't been used|consider using TaskCreate|This is just a gentle reminder).*$", ' ', 깨끗)
깨끗 = re.sub(r'```.*?```', ' ', 깨끗, flags=re.S)          # 코드 블록
깨끗 = re.sub(r'`[^`\n]*`', ' ', 깨끗)                         # 백틱
깨끗 = re.sub(r'\]\([^)]*\)', ']', 깨끗)                        # 링크 주소
깨끗 = re.sub(r'https?://\S+', ' ', 깨끗)                       # 주소
깨끗 = re.sub(r'[\w./-]*/[\w./-]+', ' ', 깨끗)                  # 파일 경로
영 = len(re.findall(r'[A-Za-z]', 깨끗))
한 = len(re.findall(r'[가-힣]', 깨끗))
조각 = [m.group(0) for m in re.finditer(r"\b[A-Za-z][A-Za-z'’-]*(?:[ ,]+[A-Za-z][A-Za-z'’-]*){3,}", 깨끗)]

# 비율 잣대는 «긴 영어 글»만 — 짧은 답에 고유명(채널·제품)이 끼면 영어 글자가 한글보다 많을 수 있다(2026-11-22 헛경보)
if not 조각 and not (영 > 40 and 영 > 한 * 2):
    try: os.remove(표식)
    except Exception: pass
    끝(0)

n = 0
try: n = int(open(표식).read().strip() or 0)
except Exception: n = 0
if n >= 2:
    try: os.remove(표식)
    except Exception: pass
    끝(0)
open(표식, 'w').write(str(n + 1))
보기 = ' / '.join(s[:60] for s in 조각[:3]) or f'영어 {영}자 > 한글 {한}자'
끝(2, f"🇰🇷⛔ [절대원칙 · 창업자 2026-11-22] 마지막 답에 영어 문장이 있다 — 「{보기}」\n"
      f"👉 같은 내용을 «한국어로» 다시 써서 답한다(반말 · 쉽게). 코드·주소·고유명만 영어로 둔다.\n")
