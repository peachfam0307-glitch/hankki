// ⭐ 인기 레시피 계측 (창업자 2026-09-27 「인기있는 레시피가 뭔지 궁금해서」)
// 🔒 기본 레시피 번호(basic-…)만 나가고, 유저가 쓴 레시피(무작위 번호)·이상한 글자는 «안» 나간다.
globalThis.window = globalThis
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: '', language: 'ko' }, configurable: true })
globalThis.location = { origin: 'x', pathname: '/hankki/', search: '' }
globalThis.document = { referrer: '' }
const 보냄 = []
window.gtag = (a, b, c) => 보냄.push(c.page_title)
window.matchMedia = () => ({ matches: false })
const { 기본레시피표시 } = await import('../src/stats.js')
기본레시피표시('basic-ssal-sujebi-10min', 'view')
기본레시피표시('basic-deulkkae-sujebi', 'heart')
기본레시피표시('basic-deulkkae-sujebi', 'chef')
기본레시피표시('basic-deulkkae-sujebi', 'fav_on')
기본레시피표시('r_1695300000000_ab12', 'view')     // 유저가 쓴 레시피 — 안 나가야
기본레시피표시('basic-<script>', 'view')           // 이상한 글자 — 안 나가야
기본레시피표시('', 'view')
const 바람 = ['view:basic-ssal-sujebi-10min', 'pin_heart:basic-deulkkae-sujebi', 'pin_chef:basic-deulkkae-sujebi', 'fav_on:basic-deulkkae-sujebi']
const 맞나 = JSON.stringify(보냄) === JSON.stringify(바람)
console.log(맞나 ? '✅ 인기 레시피 — 기본 레시피 번호만 나간다 (4/4 · 유저 레시피 0)' : '⛔ 인기 레시피 어긋남 ' + JSON.stringify(보냄))
if (!맞나) process.exit(1)
