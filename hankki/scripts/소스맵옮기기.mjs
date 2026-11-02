// 🗺 숨긴 소스맵을 dist 밖으로 옮긴다 (운영 2단계 · 2026-11-02)
//   왜 = 지도(.map)가 dist 에 남으면 사이트에 그대로 올라간다. 위치 풀기엔 «우리만» 있으면 된다.
//   어디로 = hankki/.sourcemaps/<APP_VERSION>/  (판마다 따로 — 옛 판 오류를 새 지도로 풀면 틀린다)
//   ⛔ 판 10개만 남긴다(오래된 것부터 지움) · CI 는 deploy 워크플로가 아티팩트로 90일 보관한다
import { readdirSync, mkdirSync, renameSync, statSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const 앱 = new URL('..', import.meta.url).pathname
const { APP_VERSION } = await import(join(앱, 'src/version.js'))
const 밖 = join(앱, '.sourcemaps'), 여기 = join(밖, APP_VERSION)
mkdirSync(여기, { recursive: true })
let n = 0
const 훑기 = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) 훑기(p); else if (f.endsWith('.map')) { renameSync(p, join(여기, f)); n++ } } }
훑기(join(앱, 'dist'))
const 판들 = readdirSync(밖).filter((f) => statSync(join(밖, f)).isDirectory()).sort((a, b) => statSync(join(밖, a)).mtimeMs - statSync(join(밖, b)).mtimeMs)
for (const 옛 of 판들.slice(0, Math.max(0, 판들.length - 10))) rmSync(join(밖, 옛), { recursive: true })
console.log(`🗺 소스맵 ${n}개 → .sourcemaps/${APP_VERSION}/ (dist 에 남은 .map = 0)`)
if (!existsSync(join(앱, 'dist'))) process.exit(1)
