#!/usr/bin/env python3
# 👀 [2겹 · 2026-11-23] 검수판·시안을 보낸 뒤 창업자 OK 가 오면 «그 자리에서» 기록하라고 띄운다.
#   📮 창업자 = "보고 확인한 것은 다시 보는 일 없도록 도구 만들어" · "이런 일 안 생기게 이중삼중으로"
#   뿌리 = 11/10 크리스마스 서랍·레꾸자랑 「좋아 이대로 가자」, 11/22 요거트 「그대로 둬」 → 안 적어서 11/23 또 물음
#   쓰임: PostToolUse(SendUserFile) 에 `after` · UserPromptSubmit 에 `prompt`
#   ⛔ 자동으로 적지 않는다(어느 칸인지 잘못 고를 수 있다) — «적어라 + 무엇을 보냈나»만 띄운다.
import json, os, re, sys, time
P = '/tmp/hankki-okledger-pending.json'
mode = sys.argv[1] if len(sys.argv) > 1 else ''
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)

def load():
    try: return json.load(open(P, encoding='utf8'))
    except Exception: return []

if mode == 'after':
    ti = d.get('tool_input', {}) or {}
    files = ti.get('files') or []
    cap = ti.get('caption') or ''
    names = ' '.join(os.path.basename(f) for f in files)
    if re.search(r'검수|시안|판|미리|비교|확인', names + ' ' + cap):
        L = [x for x in load() if time.time() - x['t'] < 86400]
        L.append({'t': time.time(), '파일': names, '설명': cap})
        json.dump(L[-10:], open(P, 'w', encoding='utf8'), ensure_ascii=False)
    sys.exit(0)

if mode == 'prompt':
    p = d.get('prompt', '') or ''
    L = [x for x in load() if time.time() - x['t'] < 86400]
    ok = re.search(r'좋아|그대로|이대로|확정|괜찮|ㅇㅋ|오케이|수정할\s*거\s*없|문제\s*없|넣어\s*줘|가자', p)
    pasted = re.search(r'^\[[^\]]*검수[^\]]*\]', p, re.M)   # 검수판 「복사」 붙여넣기
    if (ok and L) or pasted:
        sent = ' · '.join(f"{x['파일']}{(' — ' + x['설명'][:40]) if x['설명'] else ''}" for x in L[-3:]) or '(붙여넣은 검수 결과)'
        print('👀👀 **창업자 OK 신호다 — 지금 «바로» 기록한다 (다음에 또 묻지 않게).**')
        print(f'   최근 보낸 판 = {sent}')
        print('   👉 굽기 달력 칸이면: node hankki/scripts/release-calendar.mjs --검수 "<열쇠>" "<창업자 원문>"')
        print('   👉 그 밖(그림 그대로·링크 안 만듦·문구 OK 등): node hankki/scripts/본것.mjs --적기 "<열쇠 낱말>" "<창업자 원문>" "<무엇>"')
        print('   ⛔ 「안 봄」 칸도 창업자가 「그대로 하자」면 OK 다(2026-11-10 서랍판 사고).')
    sys.exit(0)
