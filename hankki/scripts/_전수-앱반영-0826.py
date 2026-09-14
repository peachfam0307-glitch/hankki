# 🔎 「창업자가 준 음식 컷 중 «실제로 앱에 들어간 것»이 몇 개인가」 — 전수 대조 (2026-08-26)
#
# 📮 창업자 = *"앱에 지금까지 몇컷 반영되었는데 전수검사해. 내가 보기에 많이 반영안 된 것 같고,
#            **소스그릇도 그대로야.**"*
#
# ⛔ 손으로 세지 않는다 · 문서에 적힌 개수도 믿지 않는다(반드시 낡는다).
#    **파일 내용(sha1)** 으로 «앱 폴더에 그 그림이 있나»를 본다 — 이름표도 키도 못 속인다.
#
# ⛔⛔ 첫 판이 «검수판까지 컷으로 셌다»(`-진한판`·`-빨간판`·`-실제크기`·`_판-`).
#    그건 앱에 들어갈 물건이 아니다 — **통과했는데 엉뚱한 걸 재고 있었다**(규칙 18 ⓘ).
#
# ⚠️ 8/24 폴더가 «둘»이다. 이름이 비슷해서 여태 헷갈렸다:
#    · `음식-창업자-2026-08-24/낱개/`  = 사진 시트 32장 × 6칸 = 192컷
#    · `창업자-2026-08-24/음식-유지70/` = **다른 96컷 시트**에서 갈라낸 70컷 (이름이 곧 파일명)
import glob, hashlib, json, os, re, sys
from collections import defaultdict

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
스티커 = f'{APP}/docs/stickers'
앱컷 = f'{APP}/src/assets/stickers/photo'

# ⛔ 검수판·중간산출물은 «컷»이 아니다
버릴것 = re.compile(r'(-진한판|-빨간판|-실제크기|-크게|^_판-|^_|-원본$)')


def 해시(p):
    return hashlib.sha1(open(p, 'rb').read()).hexdigest()


def 낱개들(폴더):
    out = []
    for p in sorted(glob.glob(f'{폴더}/**/*.png', recursive=True)):
        if 버릴것.search(os.path.basename(p)[:-4]):
            continue
        out.append(p)
    return out


# ── ① 앱에 든 컷 전부를 해시로
앱파일 = glob.glob(f'{앱컷}/*.png')
앱해시 = defaultdict(list)
for p in 앱파일:
    앱해시[해시(p)].append(os.path.basename(p)[:-4])
print(f'📱 앱 photo 폴더 = {len(앱파일)}장 · 서로 다른 그림 {len(앱해시)}가지\n')


def 이름표읽기(폴더):
    """시트별 6칸 이름표 → {'01_03': '김치전'} 로 편다."""
    for 후보 in ('이름표.json', '../이름표.json', '../../이름표.json'):
        q = os.path.normpath(f'{폴더}/{후보}')
        if not os.path.exists(q):
            continue
        생 = json.load(open(q))
        표 = {}
        for k, v in 생.items():
            if k.startswith('_') or not isinstance(v, list):
                continue
            for i, 이름 in enumerate(v):
                표[f'{k}_{i + 1:02d}'] = 이름      # 8/24 = 01_03
                표[f'{k}{i + 1:02d}'] = 이름       # 8/26 = 0226080b01
        return 표
    return {}


묶음 = [
    ('8/24 사진시트 192', f'{스티커}/음식-창업자-2026-08-24/낱개'),
    ('8/24 유지70', f'{스티커}/창업자-2026-08-24/음식-유지70'),
    ('8/24 다시뽑을것26', f'{스티커}/창업자-2026-08-24/음식-다시뽑을것26'),
    ('8/25', f'{스티커}/음식-창업자-2026-08-25/낱개'),
    ('8/26 그릇 108', f'{스티커}/음식-창업자-2026-08-26/낱개'),
    ('2608', f'{스티커}/음식-창업자-2608/낱개'),
    ('2608b', f'{스티커}/음식-창업자-2608b/낱개'),
]

합계, 합든것 = 0, 0
안든것전체 = {}
for 이름, 폴더 in 묶음:
    컷 = 낱개들(폴더)
    if not 컷:
        print(f'   {이름:18s} — 폴더 없음')
        continue
    표 = 이름표읽기(폴더)
    든것, 안든것 = [], []
    for p in 컷:
        k = os.path.basename(p)[:-4]
        (든것 if 해시(p) in 앱해시 else 안든것).append(표.get(k, k))
    합계 += len(컷)
    합든것 += len(든것)
    비 = len(든것) / len(컷) * 100
    표시 = '✅' if 비 == 100 else ('⚠️' if 비 > 0 else '⛔')
    print(f'{표시} {이름:18s} {len(든것):4d} / {len(컷):4d} 컷 반영 ({비:5.1f}%)')
    if 안든것:
        안든것전체[이름] = 안든것

print(f'\n📊 창업자가 준 컷 {합계}개 중 «그대로» 앱에 든 것 = {합든것}개 '
      f'({합든것 / 합계 * 100:.1f}%) · 안 든 것 {합계 - 합든것}개')

print('\n' + '─' * 62)
for 이름, 컷들 in 안든것전체.items():
    print(f'\n⛔ {이름} — 앱에 없는 {len(컷들)}개')
    for i in range(0, len(컷들), 6):
        print('   ' + ' · '.join(컷들[i:i + 6]))
