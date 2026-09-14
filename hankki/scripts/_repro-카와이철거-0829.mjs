// 🧪 카와이 철거 재현판 (smoke) — 2026-08-29
//   ⭐ 심장 = ①제목을 쓰면 카와이가 «안» 붙나 ②이미 저장된 레시피가 «갈아끼워지나»
//            ③⛔창업자가 일부러 박은 값은 «안» 건드리나 (v11.34 사고 재발 방지)
//   ⛔ 소스를 grep 하지 않는다 — 실제 판정 함수를 부른다(규칙 18 ⓘ).
import fs from 'node:fs'
const src = fs.readFileSync('src/components/FoodIcon.jsx', 'utf8')

// ICON_RULES 를 파일 순서대로 읽어 「첫 매칭이 이긴다」를 그대로 흉내낸다
const 규칙 = []
for (const l of src.split('\n')) {
  const m = l.match(/^\s*\[\[(.*?)\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\]/)
  if (m) 규칙.push({ 낱말: [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]), 키: m[2] })
}
const guess = (t) => { for (const r of 규칙) for (const w of r.낱말) if (t.includes(w)) return r.키; return null }
const gi = src.indexOf('export const FOOD_ICON_GROUPS')
const picker = new Set()
for (const m of src.slice(gi, src.indexOf('\nexport const', gi + 10)).matchAll(/'([a-z]+_[A-Za-z0-9_]+)'/g)) picker.add(m[1])

const 카와이 = new Set('fb_b06 fb_b08 fe_100 fe_110 fe_126 fe_128 fe_129 fe_142 fe_144 fe_145 fe_149 fe_15 fe_154 fe_159 fe_160 fe_164 fe_185 fe_191 fe_203 fe_220 fe_265 fe_29 fe_36 fe_39 fe_51 fe_67 fe_68 fe_82 fe_83 fe_84 fe_86 fe_87 fh_k03 fh_k33 fi_j09 fj_jsk15'.split(' '))

let 죽음 = 0
const 칸 = (이름, 참) => { console.log(`${참 ? '  ✅' : '  ⛔'} ${이름}`); if (!참) 죽음++ }

// ① 제목으로 카와이가 붙지 않는다
console.log('① 제목을 써도 카와이가 «안» 붙는다')
for (const t of ['된장찌개','피자','솥밥','시금치나물','모둠회','군만두','오이무침','계란찜','브런치',
                 '쿠키','전복구이','소고기무국','묵은지볶음','소세지볶음','얼큰라면','뼈해장국',
                 '두루치기','돼지갈비','매운양념장','해물볶음','콩나물무침','스무디','레터스랩','감자튀김','차돌박이 볶음','짬뽕']) {
  const g = guess(t)
  칸(`「${t}」 → ${g || '(못 찾음)'}`, g !== null && !카와이.has(g))
}

// ② 규칙·픽커 어디에도 카와이가 없다
console.log('\n② 규칙·픽커에 카와이가 한 개도 없다')
const 규칙키 = new Set(규칙.map(r => r.키))
const 남규칙 = [...카와이].filter(k => 규칙키.has(k))
const 남픽커 = [...카와이].filter(k => picker.has(k))
칸(`규칙에 남은 것 ${남규칙.length}개 ${남규칙.join(' ')}`, 남규칙.length === 0)
칸(`픽커에 남은 것 ${남픽커.length}개 ${남픽커.join(' ')}`, 남픽커.length === 0)

// ③ ⛔ 창업자가 일부러 박은 값은 마이그레이션이 «안» 건드린다 (v11.34 사고)
console.log('\n③ 시드가 일부러 박은 값은 보호된다 (v11.34 사고 재발 방지)')
const b = fs.readFileSync('src/data/basics.js', 'utf8')
const 시드아이콘 = new Set()
for (const m of b.matchAll(/icon:\s*'([a-z]+_[A-Za-z0-9_]+)'/g)) 시드아이콘.add(m[1])
const 옛 = k => /^(fh_|fy_|fj_|fi_|fb_|fe_)/.test(k)
// store.jsx v96 조건을 그대로 흉내낸다
const 갈리나 = (icon, title) => {
  if (!옛(icon)) return false
  if (picker.has(icon)) return false
  if (시드아이콘.has(icon)) return false
  const g = guess(title)
  return !!(g && g !== icon && picker.has(g))
}
for (const [t, i] of [['해장 파스타','fe_436'],['새우 해장 파스타','fy_y03'],['해물오일파스타','fe_451'],
                      ['버섯 솥밥','fe_04'],['순두부조림','fe_35']]) {
  칸(`「${t}」(${i}) 는 안 건드린다`, 갈리나(i, t) === false)
}

// ④ ⭐ 창업자가 겪은 그 둘이 실제로 갈린다
console.log('\n④ 이미 저장된 레시피가 갈아끼워진다 (창업자 제보)')
칸(`「차돌박이 볶음」 fe_64 → ${guess('차돌박이 볶음')}`, 갈리나('fe_64','차돌박이 볶음'))
칸(`「짬뽕」 fj_jsk01 → ${guess('짬뽕')}`, 갈리나('fj_jsk01','짬뽕'))
칸(`「제육볶음」 fh_k13 → ${guess('제육볶음')}`, 갈리나('fh_k13','제육볶음'))

// ⑤ 대체 컷 파일이 실제로 있다
console.log('\n⑤ 규칙이 부르는 컷의 파일이 실제로 있다')
let 없는파일 = []
for (const r of 규칙) if (/^(fe_|fh_|fy_|fj_|fi_|fb_|gr_|n\d)/.test(r.키) && !fs.existsSync(`src/assets/stickers/photo/${r.키}.png`)) 없는파일.push(r.키)
칸(`깨진 참조 ${없는파일.length}개 ${없는파일.slice(0,5).join(' ')}`, 없는파일.length === 0)

console.log(`\n${죽음 ? `⛔ ${죽음}칸 실패` : '✅ 전부 통과'}`)
process.exit(죽음 ? 1 : 0)
