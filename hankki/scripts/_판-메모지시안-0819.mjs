// 🎨 「지난번 메모」 종이 × 글씨체 시안 — 창업자가 «눈으로» 고르게 (2026-08-19)
//
// 📮 창업자 = *"포스트잇 넘 안예쁜데..ㅠ"* · *"글씨체두 별로고.."* ·
//    *"예뻐야해 ㅋㅋ 그리고 너무 밋밋하면 눈에 안띄어"* ·
//    *"1번째줄에서는3번(노랑)포함해서 네가 고른거까지 만들자"*
//
// ⭐ 글꼴·그림을 **앱 자산 그대로** 쓴다 — 흉내내면 다른 글씨가 나온다(절대원칙 30의 뜻).
// ⛔ 결과 HTML 은 scratchpad 에만 둔다 — 저장소는 공개(public)라 시안을 안 올린다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const b64 = (p, mime) => `data:${mime};base64,` + readFileSync(join(ROOT, p)).toString('base64')

// 🎨 종이 일곱 = 창업자가 콕 집은 dlb11(노란 라벨) ＋ 내가 고른 여섯
const 종이들 = [
  ['dlb11', '노란 라벨 ＋ 하트', '창업자 고름'],
  ['dc_dma01', '모눈 노트 ＋ 형광펜', '레시피 노트 느낌'],
  ['dc_dma05', '체크 테이프로 붙인 종이', '냉장고에 붙인 메모'],
  ['dgn06', '집게로 집은 종이 ＋ 하트', '요리책에 끼운 메모'],
  ['dgn02', '마스킹테이프 ＋ 반짝이', '창업자 고름'],
  ['dgn05', '하트 ＋ 모서리 접힘', '조용하고 부드럽게'],
  ['dgn12', '리본 ＋ 하트 ＋ 점선', '제일 화사'],
]
// ✍️ 손글씨 여섯 (`Stickers.jsx` TEXT_FONTS 와 같은 값 · `sz` 보정도 그대로)
const 글씨들 = [
  ['귀염체', 'Gaegu', 'gaegu-korean-400.woff2', 700, 1.0],
  ['삐뚤체', 'Gamja Flower', 'gamjaflower-korean-400.woff2', 400, 1.08],
  ['연필체', 'Poor Story', 'poorstory-korean-400.woff2', 400, 1.02],
  ['몽글체', 'Hi Melody', 'himelody-korean-400.woff2', 400, 1.13],
  ['가는체', 'Single Day', 'singleday-korean-400.woff2', 400, 1.04],
  ['펜글씨', 'Nanum Pen Script', 'nanumpen-korean-400.woff2', 400, 1.12],
]

const 폰트face = 글씨들.map(([, fam, file, w]) =>
  `@font-face{font-family:'${fam}';src:url('${b64('src/assets/fonts/' + file, 'font/woff2')}') format('woff2');font-weight:${w};font-display:block}`
).join('\n')

// 📐 종이 «원래 비율»을 지킨다 — 늘리면 스프링·테이프가 뭉개지고 글자가 장식에 겹친다.
//    ⛔ 첫 판이 정확히 그 사고였다 — 정사각 종이(0.97~1.17)를 가로 5배로 늘려
//       스프링이 뭉개지고 글자가 장식 위에 얹혔다. 창업자도 바로 봤다 = *"길쭉하니까 다깨지는데?"*
//    ⭐ 진짜 포스트잇도 정사각이다. 그래서 «카드»가 아니라 «종이 조각»으로 놓는다.
//    ⭐ 그림 크기는 PNG 에서 «직접 읽는다» — 손으로 적으면 그림을 갈 때 낡는다.
const 크기표 = {}
{
  const 읽기 = (p) => {
    const buf = readFileSync(join(ROOT, p))
    // PNG IHDR = 8바이트 시그니처 뒤 (길이4 + 'IHDR'4) 다음에 width4·height4
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  for (const [k] of 종이들) 크기표[k] = 읽기(`src/assets/stickers/photo/${k}.png`)
}
const 메모 = (종이, 글씨, 크기, 별 = 4, 폭 = 230) => {
  const [, fam, , w, sz] = 글씨
  const { width, height } = 크기표[종이]
  return `<div class="memo" style="background-image:url(${b64('src/assets/stickers/photo/' + 종이 + '.png', 'image/png')});width:${폭}px;aspect-ratio:${width}/${height}">
    <div class="inner">
      <div class="head"><span>지난번에 내가 남긴 것</span></div>
      <div class="body" style="font-family:'${fam}',sans-serif;font-weight:${w};font-size:${Math.round(크기 * sz)}px">“간장 반만 · 마지막에 참기름”</div>
      <div class="stars">${'★'.repeat(별)}<i>${'★'.repeat(5 - 별)}</i></div>
    </div>
  </div>`
}

const 종이줄 = 종이들.map(([k, 설명, 누가]) => `
  <div class="cell">
    ${메모(k, 글씨들[2], 15)}
    <div class="cap"><b>${k}</b> · ${설명}<span class="who">${누가}</span></div>
  </div>`).join('')

const 글씨줄 = 글씨들.map((g) => `
  <div class="cell">
    ${메모('dc_dma01', g, 15)}
    <div class="cap"><b>${g[0]}</b></div>
  </div>`).join('')

const html = `<title>지난번 메모 종이 고르기</title>
<style>
${폰트face}
:root{--bg:#f3f2ef;--card:#fff;--ink:#3d3830;--sub:#6f6a62;--line:#e6e4df}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733}}
:root[data-theme="dark"]{--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;line-height:1.6}
.wrap{max-width:560px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:21px;margin:0 0 4px}
.sub{color:var(--sub);font-size:14px;margin:0 0 6px}
h2{font-size:15px;margin:26px 0 2px}
.h2sub{color:var(--sub);font-size:12.5px;margin:0 0 12px}
.cell{margin:0 0 18px}
/* 📐 비율 고정 — 늘리지 않는다. 글자는 «가운데 안전지대»에만 놓는다(가장자리 장식을 피해) */
.memo{background-repeat:no-repeat;background-size:100% 100%;transform:rotate(-1.2deg);color:#4a4030;
  display:flex;align-items:center;justify-content:center}
.inner{width:74%;text-align:center}
.head{font-size:10.5px;font-weight:800;opacity:.55}
.stars{margin-top:5px;letter-spacing:1px;color:#e0a83a;font-size:11px}
.stars i{opacity:.26;font-style:normal}
.body{margin-top:4px;line-height:1.4}
.cap{font-size:12px;color:var(--sub);margin-top:7px;display:flex;align-items:center;gap:6px}
.cap b{color:var(--ink)}
.who{margin-left:auto;font-size:11px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:2px 8px}
.note{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:13px;font-size:13px;color:var(--sub);margin-top:22px}
</style><div class="wrap">
<h1>지난번 메모 — 종이 고르기</h1>
<p class="sub">레시피 상세와 요리 모드(재료 준비)에 자동으로 붙는 그 메모야.</p>

<h2>① 종이 일곱</h2>
<p class="h2sub">글씨체는 «연필체»로 고정해서 종이만 견주게 했어.</p>
${종이줄}

<h2>② 글씨체 여섯</h2>
<p class="h2sub">종이는 «모눈 노트»로 고정해서 글씨만 견주게 했어.</p>
${글씨줄}

<div class="note">⛔ 글씨가 길면 종이가 세로로 늘어나. 그래서 한 줄 메모를 전제로 잡았어 —
길게 쓰면 종이도 같이 커져(모눈·점선은 조금 늘어난 티가 날 수 있어).</div>
</div>`

const 낼곳 = join(OUT, '메모지시안.html')
writeFileSync(낼곳, html)
console.log('만들었다 →', 낼곳, `(${Math.round(html.length / 1024)}KB)`)
