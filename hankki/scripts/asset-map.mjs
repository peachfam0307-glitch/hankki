// 🗂 꾸미기 자산 현황 — **코드와 파일을 직접 세어서** 한 장으로 보여준다.
//
// 왜 만들었나 (창업자 2026-07-30):
//   *"나는 네가 재고나 우리꾸미기 들어간 현황을 다 파악하고 있으면 좋겠어. 지금 뭔가 정리가 안된 느낌이야."*
//   맞는 지적이다. 그동안 개수를 **손으로 세고 문서에 적어뒀는데**, 자산이 바뀔 때마다 그 숫자가 낡았다.
//   → 사람이 세지 않는다. **이 스크립트가 그때그때 진짜 상태를 읽는다.**
//
// 무엇을 읽나
//   ① `src/components/Stickers.jsx` STICKER_GROUPS  = 앱 서랍에 실제로 실린 그룹·컷·자물쇠
//   ② `src/assets/stickers/**`                       = 앱이 들고 있는 실제 파일
//   ③ `docs/stickers/**/낱개*`                       = 아직 안 넣은 재고
//
// 무엇을 잡아내나 (이게 핵심)
//   ⚠️ **깨진 참조** — 서랍엔 있는데 파일이 없는 것 (앱에서 빈칸으로 뜬다)
//   📦 **미등록 재고** — 파일은 있는데 서랍엔 없는 것 (유료팩이거나, 그냥 잊힌 것)
//
// 쓰기:  npm run assets        (표만)
//        npm run assets -- --md > docs/자산현황.md   (문서로 저장)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { join } from 'node:path'

// PNG 알파 채널만 필요해서 최소 디코더를 직접 짰다(의존성 없이 CI에서도 돌게).
// 우리 스티커는 전부 8비트 RGBA(color type 6) — 그 외 형식이면 조용히 건너뛴다.
// 반환 = 그림이 닿은 가장자리 목록. 닿았으면 시트에서 자를 때 잘렸거나 옆 컷이 붙어 들어온 것.
const edgeTouch = (file) => {
  let buf
  try { buf = readFileSync(file) } catch { return null }
  let w = 0, h = 0, depth = 0, ctype = 0, idat = []
  for (let o = 8; o + 8 <= buf.length; ) {
    const len = buf.readUInt32BE(o)
    const type = buf.toString('latin1', o + 4, o + 8)
    const data = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    o += 12 + len
  }
  if (ctype !== 6 || depth !== 8 || !w || !h) return null    // 알파 없는 형식은 검사 대상 아님
  let raw
  try { raw = inflateSync(Buffer.concat(idat)) } catch { return null }
  const BPP = 4, stride = w * BPP
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride)
  const A = 24                                               // 이 값 이하 알파는 '없는 것'으로 본다
  let top = false, bottom = false, left = false, right = false
  const MIN = Math.max(2, Math.round(Math.min(w, h) * 0.02)) // 점 하나로 오탐하지 않게
  let topN = 0, botN = 0, leftN = 0, rightN = 0
  for (let y = 0; y < h; y += 1) {
    const off = y * (stride + 1)
    if (off + stride >= raw.length + 1) break
    const filter = raw[off]
    raw.copy(cur, 0, off + 1, off + 1 + stride)
    for (let i = 0; i < stride; i += 1) {                    // PNG 스캔라인 필터 되돌리기
      const a = i >= BPP ? cur[i - BPP] : 0, b = prev[i], c = i >= BPP ? prev[i - BPP] : 0
      if (filter === 1) cur[i] = (cur[i] + a) & 255
      else if (filter === 2) cur[i] = (cur[i] + b) & 255
      else if (filter === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
    }
    if (cur[3] > A) leftN += 1
    if (cur[stride - 1] > A) rightN += 1
    if (y === 0 || y === h - 1) {
      let n = 0
      for (let x = 0; x < w; x += 1) if (cur[x * BPP + 3] > A) n += 1
      if (y === 0) topN = n; else botN = n
    }
    cur.copy(prev)
  }
  top = topN >= MIN; bottom = botN >= MIN; left = leftN >= MIN; right = rightN >= MIN
  return [top && '위', bottom && '아래', left && '왼', right && '오른'].filter(Boolean)
}

const ROOT = process.cwd()
const MD = process.argv.includes('--md')

// ── ① 서랍(코드)에 실린 그룹 ──────────────────────────────────────────────
const src = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
// ⚠️ 필드를 한 덩어리 정규식으로 잡으면 안 된다 — 실제로 그렇게 짰다가 **음식 탭 6그룹과
//    `부엌 식구들`을 통째로 놓쳤다.** 음식 그룹은 `label` 없이 `chip` 만 쓰고,
//    `부엌 식구들`은 `items: kfItems('kf_')` 라 배열 리터럴이 아니다.
//    → 줄을 먼저 고르고 **필드를 하나씩** 뽑는다.
const KF_NAMES = (src.match(/const KF_NAMES = \[([\s\S]*?)\n\]/) || [, ''])[1]
  .match(/\['([a-z0-9_]+)'/g)?.map((s) => s.slice(2, -1)) || []
const groups = []
// ⚠️ **여러 줄에 걸쳐 쓴 그룹도 있다** — `꼬르곰·펭펭`(`gompeng`)은 items 가 4줄로 나뉘어 있어서
//    "한 줄 = 한 그룹" 으로 읽다가 **통째로 놓쳤다**(창업자가 앱에서 그 그룹을 보고 발견).
//    → 줄바꿈을 지우고 `{ key:` 단위로 잘라 읽는다.
const FLAT = src.replace(/\n\s*/g, ' ')
for (const line of FLAT.split(/(?=\{ key: ')/)) {
  if (!/^\{ key: '[^']+', tab: '/.test(line)) continue   // key 바로 뒤 tab — 색상표 등이 섞이지 않게
  const f = (re) => (line.match(re) || [, ''])[1]
  const key = f(/key: '([^']+)'/)
  const rawItems = (line.match(/items: (\[[^\]]*\]|\w+\([^)]*\))/) || [, ''])[1]
  let items
  const call = rawItems.match(/^kfItems\('([^']*)'\)/)
  if (call) items = KF_NAMES.map((n) => call[1] + n)
  else items = (rawItems.match(/'([^']+)'/g) || []).map((s) => s.slice(1, -1))
  groups.push({
    key, tab: f(/tab: '([^']+)'/), season: f(/season: '([^']+)'/), from: f(/from: '([^']+)'/),
    label: f(/label: '([^']+)'/) || f(/chip: '([^']+)'/) || key, items,
  })
}
if (!groups.some((g) => g.tab === 'food')) { console.error('❌ 음식 탭을 못 읽었다 — 파서가 코드 변화를 못 따라감'); process.exit(1) }
const usedIds = new Set(groups.flatMap((g) => g.items))

// ── ② 앱이 들고 있는 파일 ────────────────────────────────────────────────
const ASSET_DIR = join(ROOT, 'src/assets/stickers')
const assetFiles = {} // 폴더 → [id]
for (const d of readdirSync(ASSET_DIR)) {
  const p = join(ASSET_DIR, d)
  if (!statSync(p).isDirectory()) continue
  assetFiles[d] = readdirSync(p).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''))
}
const photoIds = new Set(assetFiles.photo || [])

// ── ③ 재고(문서 폴더) ────────────────────────────────────────────────────
const DOC_DIR = join(ROOT, 'docs/stickers')
const stock = []
const walkStock = (dir, top) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { walkStock(p, top || e.name); continue }
    if (!e.name.endsWith('.png')) continue
    const rel = p.slice(DOC_DIR.length + 1)
    // '원본시트'는 낱개로 자르기 전 원본이라 재고 수량에서 뺀다(중복 집계 방지)
    if (rel.includes('원본시트')) continue
    stock.push(rel)
  }
}
for (const e of readdirSync(DOC_DIR, { withFileTypes: true })) {
  if (e.isDirectory()) walkStock(join(DOC_DIR, e.name), e.name)
}
const stockByTop = {}
for (const rel of stock) {
  const top = rel.split('/')[0]
  ;(stockByTop[top] = stockByTop[top] || []).push(rel)
}

// ── 계산 ─────────────────────────────────────────────────────────────────
const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
const ymd = (d) => d.toISOString().slice(0, 10)
const locked = (g) => g.from && g.from > ymd(today)

const byTab = {}
for (const g of groups) (byTab[g.tab] = byTab[g.tab] || []).push(g)

// ⚠️ 깨진 참조 = 서랍이 부르는데 파일도 없고 벡터도 아닌 것
//    벡터·CSS 스티커(하트·별·마테 등)는 PNG 가 없는 게 정상이라, 코드 어딘가에 이름이 있으면 통과시킨다.
const codeAll = src
// ⚠️ **아이디와 파일 이름이 다른 경우가 있다** — `부엌 식구들`은 id 가 `kf_gomgom` 인데
//    파일은 `kitchen/gomgom.png` 다(폴더가 접두어 역할). 그래서 앞 토큰을 떼고도 찾아본다.
const hasFile = (id) => {
  const cands = [id, id.replace(/^[a-z]+_/, ''), id.replace(/^[a-z]+_[a-z]_/, '')]
  for (const d of Object.keys(assetFiles)) for (const c of cands) if (assetFiles[d].includes(c)) return true
  return false
}
const broken = [...usedIds].filter((id) => {
  if (photoIds.has(id) || hasFile(id)) return false
  // 벡터/CSS 스티커는 PNG 가 없는 게 정상 — 코드에 정의가 있으면 통과.
  //   ① 객체 키로 정의  ② `id === 'yum'` 처럼 특수 분기로 그려지는 것
  return !new RegExp(`['"\`]?\\b${id}\\b['"\`]?\\s*:`).test(codeAll)
    && !new RegExp(`===\\s*'${id}'`).test(codeAll)
})

// 📦 미등록 = photo 파일은 있는데 어떤 그룹도 안 부르는 것
// ⚠️ 단, **서랍에 없어도 쓰이는 곳이 있다** — 공유카드 뽑기 풀(`ShareDrawCard.jsx`)이 캐릭터 컷을
//    직접 참조한다. 그걸 '안 쓰는 재고'로 세면 숫자가 거짓말이 된다 → src 전체를 훑어 갈라낸다.
const SRC_ALL = readdirSync(join(ROOT, 'src'), { recursive: true })
  .filter((f) => typeof f === 'string' && /\.(jsx?|mjs)$/.test(f))
  .map((f) => readFileSync(join(ROOT, 'src', f), 'utf8')).join('\n')
const usedElsewhere = new Set()
const unregistered = []
for (const id of [...photoIds].sort()) {
  if (usedIds.has(id)) continue
  if (SRC_ALL.includes(`'${id}'`) || SRC_ALL.includes(`"${id}"`)) usedElsewhere.add(id)
  else unregistered.push(id)
}
// 접두어(첫 `_` 앞)로 묶어서 보여준다 — 낱개로 수백 개 나열하면 못 읽는다
const prefixOf = (id) => id.split('_')[0].replace(/\d+$/, '')
const unregByPrefix = {}
for (const id of unregistered) (unregByPrefix[prefixOf(id)] = unregByPrefix[prefixOf(id)] || []).push(id)

// ── 출력 ─────────────────────────────────────────────────────────────────
const out = []
const p = (s = '') => out.push(s)
const TABNAME = { bgtape: '배경', frame: '프레임', tape: '마테', deco: '데코', notetext: '글자', buddies: '친구들', food: '재료' }

p(`# 🗂 꾸미기 자산 현황 (${ymd(today)} KST · 자동 집계)`)
p()
p('> ⚠️ 이 문서는 **`npm run assets` 로 다시 뽑는다.** 손으로 고치지 말 것 — 코드·파일을 직접 센 값이다.')
p()

const shown = groups.filter((g) => !locked(g)).reduce((a, g) => a + g.items.length, 0)
const lockedCuts = groups.filter((g) => locked(g)).reduce((a, g) => a + g.items.length, 0)
p('## 📊 한 줄')
p()
p(`**지금 서랍에 보이는 컷 = ${shown}개** (그룹 ${groups.filter((g) => !locked(g)).length}개)`)
p(`· 자물쇠로 잠긴 컷 ${lockedCuts}개 · 파일은 있는데 안 넣은 것 **${unregistered.length}개**`)
p()

p('## 🎨 앱 서랍 (탭별)')
p()
for (const tab of Object.keys(byTab)) {
  const gs = byTab[tab]
  const tot = gs.reduce((a, g) => a + g.items.length, 0)
  p(`### ${TABNAME[tab] || tab} 탭 — 그룹 ${gs.length}개 · ${tot}컷`)
  p()
  p('| 컷 | 그룹 | 계절 | 언제부터 |')
  p('|---:|---|---|---|')
  for (const g of gs) {
    p(`| ${g.items.length} | ${g.label} | ${g.season || '사철'} | ${g.from ? (locked(g) ? `🔒 ${g.from}` : g.from) : '지금'} |`)
  }
  p()
}

p('## 📦 파일은 있는데 서랍엔 없는 것 (재고 · 유료팩)')
p()
p('| 컷 | 접두어 | 무엇 |')
p('|---:|---|---|')
const KNOWN = {
  // 💰 유료팩 — **서랍에 없는 게 정상.** 결제 붙기 전엔 안 넣는다(팔 수 없는데 보이면 안 됨).
  cs: '💰추석 한복 캐릭터·소품', ci: '💰추석 소품', cp: '💰추석 종이·라벨',
  cf: '💰추석 프레임', cm: '💰추석 메모지', ct: '💰추석 마테',
  hw: '💰핼러윈 캐릭터', hp: '💰핼러윈 종이·라벨', hs: '💰핼러윈 띠부씰',
  hf: '💰핼러윈 프레임', ht: '💰핼러윈 마테',
  pp: '💰가을 다꾸 종이', pi: '💰가을 다꾸 소품', pt: '💰가을 다꾸 마테',
  wm: '💰수채화 마테·씰', wc: '💰수채화 추석 음식', wh: '💰수채화 가을 수확', ws: '💰수채화 가을 소품',
  xm: '💰크리스마스 — ⚠️**4컷뿐이라 팩이 안 된다**',
  // 🍂 무료인데 아직 안 넣은 것
  nai: '🍂가을 기본 소품 (무료 · 등록 대기)', naf: '🍂가을 기본 프레임 (무료 · 등록 대기)',
  nat: '🍂가을 기본 마테 (무료 · 등록 대기)', nsf: '🏖여름 프레임 재제작 (기존 흐린 것 교체용)',
  au: '🍂가을 기본 (일부만 등록됨)',
  // ⛔ 해상도 미달로 되돌린 것 — **다시 넣지 말 것** (v8.95 당일 롤백)
  mn: '⛔미니아이콘 94px — 캔버스 238px라 뭉갠다',
  ps: '⛔파스텔무선 141px — 뭉갠다 (📅 심플 다꾸 세트로 언젠가)',
  sd: '⛔여름다꾸 85px — 뭉갠다',
  // 그 밖
  fh: '음식 아이콘 라이브러리 (칩에 일부만 실림)', fb: '음식 아이콘 라이브러리', fy: '음식 아이콘 라이브러리',
  fj: '음식 아이콘 라이브러리', fi: '음식 아이콘 라이브러리', fe: '음식 아이콘 라이브러리', ig: '재료 아이콘 라이브러리',
  wt: '마스킹테이프 (일부만 실림)',
}
for (const [pre, ids] of Object.entries(unregByPrefix).sort((a, b) => b[1].length - a[1].length)) {
  p(`| ${ids.length} | \`${pre}\` | ${KNOWN[pre] || '❓ **분류 안 됨 — 확인 필요**'} |`)
}
p()

// ── ⭐ 정원(定員) 대조 ─────────────────────────────────────────────────────
// 창업자 2026-07-30: *"기준이 없이 일을 하고있어 … 딱 들어갈 아이템 종류별로 몇개 이렇게
//   정했으면 좋겠다고"* · *"매달 이걸 어떻게 계속 정하고 또 물어보고 해…"*
// → **한 번 정하고 다시 안 묻는다.** 아래 표가 그 기준이고, 이 대조표가 매번 자동으로 확인한다.
const CAT = (g) => {
  // ⚠️ **탭으로 먼저 판단한다.** 라벨로만 보다가 프레임 탭을 만들면서 라벨에서 '프레임 ·' 접두어를
  //    떼자, `소품·꽃` 같은 프레임이 '소품'으로 잡혀 숫자가 통째로 틀어졌다(기본 프레임 0 · 소품 44).
  if (g.tab === 'frame') return 'frame'
  if (g.tab === 'tape') return 'tape'
  if (g.tab === 'buddies') return 'char'
  const l = g.label
  if (l.includes('마스킹테이프')) return 'tape'
  if (l.includes('프레임')) return 'frame'
  if (/메모|씰|라벨/.test(l)) return 'paper'
  if (/소품|데코/.test(l)) return 'item'
  return 'etc'
}
const CATNAME = { frame: '프레임', item: '소품', paper: '메모·씰·라벨', tape: '마스킹테이프', char: '캐릭터', etc: '그 밖' }
// ⭐ 두 층으로 나눠 본다 (창업자 2026-07-30 *"우선 기본제공(4계절)할 것부터 정리를 해야 계절을 올릴수가 있어"*)
//   **기본(사철)** = 사계절 내내 깔려 있는 바탕. 여기가 뚱뚱하면 계절을 얹을 자리가 없다.
//   **계절 세트**  = 그 위에 3개월씩 얹혔다 밀려나는 것.
// ⭐ **종류마다 정원이 다른 이유** (창업자 2026-07-30 *"스티커는 꾸미기라 사실 많아도..
//    여기저기 붙이기 좋아서"*): **프레임은 한 장에 하나만 깐다** → 많으면 고르기가 힘들다.
//    **소품은 여러 개를 여기저기 붙인다** → 가짓수가 많을수록 좋다. 그래서 소품 정원이 제일 크다.
const BASE_QUOTA = { frame: 24, item: 32, paper: 12, tape: 12, char: 24 } // 캐릭터는 우리 핵심 자산이라 넉넉히
const QUOTA = { frame: 12, item: 24, paper: 8, tape: 6, char: 12 } // 한 계절 세트 (3파로 나눠 푼다)
const seasons = [...new Set(groups.map((g) => g.season).filter(Boolean))]
const SEASONKO = { summer: '여름', autumn: '가을', winter: '겨울', spring: '봄' }
const DECO_TABS = new Set(['deco', 'frame', 'tape', 'buddies']) // 음식·라이프·글자 탭은 성격이 달라 정원 밖

p('## ⭐ 정원 대조 — 기준표')
p()
p('**두 층이다.** 기본(사철)은 사계절 내내 깔린 바탕이고, 계절 세트가 그 위에 3개월씩 얹혔다 밀려난다.')
p('👉 **기본이 뚱뚱하면 계절을 얹을 자리가 없다** — 그래서 기본부터 정원을 잡는다.')
p()
const cell = (n, q) => (n > q ? `**${n}** ⚠️` : n < q ? `${n} ↓` : `${n} ✅`)
const sum = (f) => groups.filter((g) => DECO_TABS.has(g.tab) && f(g)).reduce((a, g) => a + g.items.length, 0)
const over = []
p('| 종류 | 🧱기본 정원 | 기본 지금 | 🍃계절 정원 | 한 파(달) | ' + seasons.map((s) => `${SEASONKO[s] || s} 지금`).join(' | ') + ' |')
p('|---|---:|---:|---:|---:|' + seasons.map(() => '---:|').join(''))
for (const c of Object.keys(QUOTA)) {
  const base = sum((g) => !g.season && CAT(g) === c)
  if (base > BASE_QUOTA[c]) over.push(`기본 ${CATNAME[c]} ${base}/${BASE_QUOTA[c]}`)
  const cells = seasons.map((s) => {
    const n = sum((g) => g.season === s && CAT(g) === c)
    if (n > QUOTA[c]) over.push(`${SEASONKO[s] || s} ${CATNAME[c]} ${n}/${QUOTA[c]}`)
    return cell(n, QUOTA[c])
  })
  p(`| ${CATNAME[c]} | ${BASE_QUOTA[c]} | ${cell(base, BASE_QUOTA[c])} | ${QUOTA[c]} | ${Math.round(QUOTA[c] / 3)} | ${cells.join(' | ')} |`)
}
const bq = Object.values(BASE_QUOTA).reduce((a, b) => a + b, 0)
const qtot = Object.values(QUOTA).reduce((a, b) => a + b, 0)
p(`| **합계** | **${bq}** | **${sum((g) => !g.season)}** | **${qtot}** | **${Math.round(qtot / 3)}** | `
  + seasons.map((s) => `**${sum((g) => g.season === s)}**`).join(' | ') + ' |')
p()
p('⚠️ 정원을 넘은 것: ' + (over.length ? over.join(' · ') : '없음'))
p()
p('⛔ **넘었다고 무조건 빼지는 않는다** — *"한 번 준 것은 빼앗지 않는다."*')
p('**정원은 「앞으로 새로 넣을 때」의 기준.** 다만 창업자가 *"정리하자"* 라고 하면 그때 줄인다')
p('(여름 프레임 24→12 처럼). ⚠️뺄 때도 **파일과 비율은 남긴다** — 이미 그걸로 꾸며 저장한 표지가 깨지면 안 된다.')
p()
p('> 음식·라이프·메모글자 탭은 정원 밖이다 — 꾸미기 재료가 아니라 **레시피를 나타내는 아이콘**이라 성격이 다르다.')
p()

p('## 🎴 서랍엔 없지만 **카드 뽑기에서 쓰는 것**')
p()
p(`**${usedElsewhere.size}컷.** 유료팩 자산이 여기 많다 — 서랍엔 안 넣되(못 파니까) **카드에는 나오게** 해서`)
p('팩을 미리 보여주는 홍보 효과를 노린 것. (`docs/꾸미기팩-출시계획-한눈에-2026-07-30.md`)')
p()
const elseByPrefix = {}
for (const id of usedElsewhere) (elseByPrefix[prefixOf(id)] = elseByPrefix[prefixOf(id)] || []).push(id)
p('| 컷 | 접두어 | 무엇 |')
p('|---:|---|---|')
for (const [pre, ids] of Object.entries(elseByPrefix).sort((a, b) => b[1].length - a[1].length)) {
  p(`| ${ids.length} | \`${pre}\` | ${KNOWN[pre] || '—'} |`)
}
p()

p('## 🗃 문서 폴더 재고 (아직 앱에 안 들어간 낱개)')
p()
p('| 컷 | 폴더 |')
p('|---:|---|')
for (const [top, list] of Object.entries(stockByTop).sort((a, b) => b[1].length - a[1].length)) {
  p(`| ${list.length} | \`${top}\` |`)
}
p()

// ── ✂️ 잘림 검사 ─────────────────────────────────────────────────────────
// 창업자가 시안을 보고 *"아래보니까 잘못잘린것들도 보인다"* 라고 잡아냈다(2026-07-30, 맞았다).
// **눈으로 잡아야 하는 검사는 언젠가 놓친다** → 픽셀로 못 박는다.
// 그림이 이미지 가장자리에 닿아 있으면 = 시트에서 자를 때 잘렸거나 옆 컷 조각이 붙어 들어온 것.
// ⚠️ 마스킹테이프(`wt_`)는 **양끝이 잘린 게 정상**(길게 이어 붙이는 테이프) → 뺀다.
const clipped = []
for (const id of [...usedIds].sort()) {
  if (!photoIds.has(id) || id.startsWith('wt_')) continue
  const sides = edgeTouch(join(ASSET_DIR, 'photo', `${id}.png`))
  if (sides && sides.length) clipped.push({ id, sides })
}
if (clipped.length) {
  p('## ✂️ 가장자리에 닿은 컷 — **잘렸거나 옆 컷 조각이 붙었을 가능성**')
  p()
  p('| 컷 | 닿은 쪽 |')
  p('|---|---|')
  clipped.forEach(({ id, sides }) => p(`| \`${id}\` | ${sides.join('·')} |`))
  p()
} else {
  p('## ✅ 잘린 컷 없음 — 등록된 사진 스티커가 가장자리에 닿지 않는다')
  p()
}

if (broken.length) {
  p('## ⚠️ 깨진 참조 — 서랍이 부르는데 그림이 없다')
  p()
  broken.forEach((id) => p(`- \`${id}\``))
  p()
} else {
  p('## ✅ 깨진 참조 없음 — 서랍이 부르는 그림이 전부 있다')
  p()
}

console.log(out.join('\n'))
if (broken.length && !MD) process.exit(1)
