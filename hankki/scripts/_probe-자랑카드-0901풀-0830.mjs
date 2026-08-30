// 🎴📐 「9/1 에 레꾸자랑 카드 풀에 뭐가 들어가나」 — 앱과 «같은 모듈»로 계산한다 (2026-08-30)
//   📮 창업자 = *"레꾸자랑카드 여름한정만 9월1일에빼고 나머지 뼈대는 넣자. 다양하게.
//      캐릭터는 가을컷+기본만 넣고. 여름은 빼고."*
//   ⛔ 짐작하지 않는다 — `season.js`·`cardSeasons.js` 를 실제로 불러 판정한다(절대원칙 30).
import fs from 'node:fs'
import { isPeakSeason, inCardWindow, seasonsNow } from '../src/season.js'
import { SEASON_CUTS } from '../src/data/cardSeasons.js'

const 파일 = fs.readdirSync('src/assets/sharepool').filter(f => f.endsWith('.png')).map(f => f.replace(/\.png$/, ''))
const src = fs.readFileSync('src/components/ShareDrawCard.jsx', 'utf8')
const 뽑기 = (이름) => new RegExp(src.match(new RegExp(`const ${이름} = (/\\^.*?/)`))[1].slice(1, -1))
const COOK = 뽑기('COOK'), SUMMER = 뽑기('SUMMER'), HALLOWEEN = 뽑기('HALLOWEEN'), HANBOK = 뽑기('HANBOK')

const 날 = (s) => new Date(s + 'T09:00:00+09:00')
for (const 날짜 of ['2026-08-31', '2026-09-01', '2026-09-20', '2026-10-05', '2026-11-15']) {
  const now = 날(날짜)
  const 여름스킨 = isPeakSeason('summer', now)
  const 열린세트 = SEASON_CUTS.filter(s => inCardWindow(s, now))
  const hwOpen = 열린세트.some(s => s.key === 'hw'), csOpen = 열린세트.some(s => s.key === 'cs')
  const 뼈대 = ['warm','panel','pola','mag','arch','night',
    ...(여름스킨 ? ['summer'] : []), ...(hwOpen ? ['halloween'] : []), ...(csOpen ? ['chuseok'] : [])]

  // 기본 풀 = COOK 만 통과 (withSummer 안 줌)
  const 기본 = (re) => { const h = 파일.filter(n => re.test(n) && COOK.test(n)); return h.length ? h : 파일.filter(n => re.test(n)) }
  const 계절 = (kind) => 열린세트.flatMap(s => s[kind]).filter(k => fs.existsSync(`src/assets/stickers/photo/${k}.png`))
  const notHw = (a) => a.filter(k => !HALLOWEEN.test(k) && !HANBOK.test(k))
  const gom = [...기본(/^gom_/), ...notHw(계절('gom'))]
  const peng = [...기본(/^(peng_|pn_)/), ...notHw(계절('peng'))]
  const duo = [...기본(/^duo_/), ...notHw(계절('duo'))]
  const 여름섞임 = [...gom, ...peng, ...duo].filter(k => SUMMER.test(k))

  console.log(`\n【${날짜}】 계절=${seasonsNow(now).join('+')}`)
  console.log(`  뼈대 ${뼈대.length}종: ${뼈대.join(' ')}`)
  console.log(`  캐릭터 = 곰 ${gom.length} · 펭 ${peng.length} · 콤비 ${duo.length}  (계절컷 ${계절('gom').length + 계절('peng').length + 계절('duo').length})`)
  console.log(`  ⛔ 기본 풀에 섞인 여름 컷 = ${여름섞임.length}개 ${여름섞임.join(' ')}`)
}
console.log('\n🏖 여름 전용 컷(여름 스킨에서만 쓰인다) =', 파일.filter(n => SUMMER.test(n)).sort().join(' '))
