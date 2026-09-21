// 🔒🔒 [2026-09-21] **계측 함수 이름이 같은 파일 안에서 «덮어써지면» 배포를 막는다.**
//
// 📮 창업자 = *"레꾸자랑도 제대로 설계해달라고 그렇게 말했는데"* · *"땜빵 절대 금지 절대원칙이야."*
//
// ⛔⛔ **무슨 일이 났나** — `BragScreen.jsx` 에서
//    13줄  import { 자랑보냄 } from '../stats'      ← 계측 함수
//    83줄  const 자랑보냄 = useRef(false)           ← 같은 이름의 useRef
//    190줄 try { 자랑보냄() } catch {}             ← useRef 객체를 부른다 → TypeError → catch 가 삼킨다
//    ＝ 레꾸자랑을 보내도 brag_shared 가 «한 번도» 안 나갔다. 문서엔 「며칠째 0」이라 적혀 있었고 「인기 없다」로 읽었다.
//
// 🌲 **뿌리 = 규칙을 어긴 게 아니라 «아무도 안 보고 있었다».** 린트도 안 잡는다(섀도잉은 문법상 합법이다).
//    그래서 규칙으로 부탁하지 않고 «장치»로 막는다(절대원칙 19).
//
// ⭐ 잣대 = `stats` 에서 들여온 이름이 **같은 파일에서 `const|let|var|function` 으로 다시 선언되면** ⛔.
//    ⛔ 목록을 손으로 적지 않는다 — import 문에서 «읽어서» 잰다. 새 관문을 더해도 저절로 지켜진다.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const SRC = join(여기, '..', 'src')

const 파일들 = []
const 걷기 = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) 걷기(p); else if (/\.(jsx?|mjs)$/.test(e)) 파일들.push(p) } }
걷기(SRC)

const 잡힘 = []
for (const f of 파일들) {
  const s = readFileSync(f, 'utf8')
  // import { a, b as c } from '../stats' / './stats.js'  — 로컬 이름만 뽑는다(as 뒤)
  const m = s.match(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*\/stats(?:\.js)?['"]/)
  if (!m) continue
  const 이름들 = m[1].split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+as\s+/).pop().trim())
  for (const 이름 of 이름들) {
    // 같은 파일에서 다시 선언하나 — const/let/var/function/class 뒤에 «그 이름»이 오는 줄
    // ⛔⛔ [2026-09-21 규칙 12 로 잡았다] 처음엔 `\b` 를 썼는데 **한글 뒤에선 경계가 안 잡힌다**(\b 는 ASCII \w 만 본다).
    //    그래서 옛 BragScreen(자랑보냄 = useRef)을 «못 잡았다» — 초록불인데 눈이 먼 게이트였다(규칙 18 ⓘ).
    //    ✅ 「뒤에 글자·숫자·_ 가 안 온다」를 유니코드로 직접 본다.
    const 다시 = new RegExp(`^[ \\t]*(?:const|let|var|function|class)\\s+${이름}(?![\\p{L}\\p{N}_])`, 'mu')
    const hit = s.match(다시)
    if (hit) {
      const 줄 = s.slice(0, hit.index).split('\n').length
      잡힘.push({ 파일: relative(join(여기, '..'), f), 이름, 줄 })
    }
  }
}

if (잡힘.length) {
  console.error('\n🔒 **계측 겹침 게이트 — stats 에서 들여온 이름을 같은 파일에서 다시 선언했다**\n')
  for (const x of 잡힘) console.error(`   ⛔ ${x.파일}:${x.줄}   「${x.이름}」 — 계측 함수가 덮여서 «조용히» 안 나간다`)
  console.error('\n   📮 2026-09-21 BragScreen 사고 = 이 꼴로 레꾸자랑이 «한 번도» 안 세어졌다.')
  console.error('   ✅ 둘 중 하나의 이름을 바꾼다(useRef 쪽을 「보냈나」처럼).\n')
  process.exit(1)
}
console.log(`✅ 계측 겹침 — ${파일들.length}개 파일 · stats 이름이 덮인 곳 0`)
