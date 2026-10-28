#!/usr/bin/env node
// 🔔 폰 알림(웹 푸시) 리스너를 «지키는» 판 — 2026-09-19
//
// 📮 창업자 = *"월,수 레시피 토 장바구니 올라갈때 · 새 꾸미기 오픈 … 알람보내는거 어때"*
// 📄 설계 = `docs/알림-설계-2026-09-19.md` (설계 관문 통과판)
//
// ⛔⛔ 왜 = `src/sw.js` 는 **유저 242명 폰에서 지금 돌고 있고**, `skipWaiting()`＋`clientsClaim()` 이라
//    새 판이 «즉시» 모든 탭을 장악한다. 여기가 깨지면 흰 화면이 뜨고 유저는 앱을 지워야 복구된다.
//    그리고 이 파일은 **공유받기(share_target)**도 처리한다 — 푸시를 얹다 그게 깨지면
//    인스타에서 레시피를 공유하는 길이 통째로 죽는데, 앱은 «멀쩡히» 돌아서 아무도 모른다.
//
// ⭐ 그래서 이 판은 둘을 같이 본다 = ①푸시가 제대로 얹혔나 ②원래 있던 것이 «그대로»인가.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => readFileSync(join(뿌리, p), 'utf8')
let 나쁨 = 0
const 잰다 = (참, 무엇, 값 = '') => { console.log(`  ${참 ? '✅' : '⛔'} ${무엇}${값 ? '  ' + 값 : ''}`); if (!참) 나쁨++ }

console.log('\n🔔 폰 알림(웹 푸시)\n')
const sw = 읽기('src/sw.js')

// ── ① 리스너 둘이 있다
잰다(/self\.addEventListener\('push'/.test(sw), "① push 리스너가 있다")
잰다(/self\.addEventListener\('notificationclick'/.test(sw), '① notificationclick 리스너가 있다')
잰다(/showNotification\(/.test(sw), '① showNotification 으로 그린다')

// ── ② ⛔ 못 읽어도 «앱이 멎지 않는다» (절대원칙 34)
const push몸 = (/addEventListener\('push', \(event\) => \{([\s\S]*?)\n\}\)/.exec(sw) || [])[1] || ''
const 문구몸 = (/async function 오늘문구\(event\) \{([\s\S]*?)\n\}/.exec(sw) || [])[1] || ''
잰다(/try \{[\s\S]*event\.data[\s\S]*\} catch/.test(문구몸), '② event.data 를 try/catch 로 읽는다 (이상한 게 와도 안 멎는다)')
잰다(/fetch\(PUSH_URL \+ '\/today'/.test(문구몸) && /return \{\}/.test(문구몸), '② 빈 푸시면 /today 로 문구를 가져오고, 그것도 실패하면 «빈 값»으로라도 띄운다')
잰다(/hankki-push\.annyeong-hankki\.workers\.dev/.test(sw) && 읽기('src/pushSubscribe.js').includes('hankki-push.annyeong-hankki.workers.dev'), '② 워커 주소가 sw.js 와 pushSubscribe.js 에서 «같다»')
잰다(/제목 \|\| '한끼'/.test(push몸) && /본문 \|\| '새로운 소식이 있어요'/.test(push몸), '② 제목이 비어도 기본 문구로 띄운다')
잰다(/event\.waitUntil\(/.test(push몸), '② waitUntil 로 감싼다 (안 감싸면 그리기 전에 워커가 잠든다)')

// ── ③ ⛔ 같은 알림이 두 번 와도 폰엔 «하나»만 (마지막 그물 · 두 번 보내기는 워커가 막는다)
잰다(/tag:/.test(push몸), '③ tag 를 준다 — 같은 이름이면 덮어쓴다')

// ── ④ 👆 눌렀을 때 탭이 쌓이지 않는다
const 클릭몸 = (/addEventListener\('notificationclick', \(event\) => \{([\s\S]*?)\n\}\)/.exec(sw) || [])[1] || ''
잰다(/matchAll\(/.test(클릭몸) && /focus\(\)/.test(클릭몸), '④ 열려 있는 한끼가 있으면 «그걸» 띄운다 (matchAll → focus)')
잰다(/openWindow/.test(클릭몸), '④ 없을 때만 새로 연다 (openWindow)')
잰다(/event\.notification\.close\(\)/.test(클릭몸), '④ 누른 알림은 닫는다')

// ── ⑤ ⛔⛔ 원래 있던 것이 «그대로»인가 — 여기가 이 판의 진짜 일이다
잰다(/precacheAndRoute\(self\.__WB_MANIFEST \|\| \[\]\)/.test(sw), '⑤ precache 그대로')
잰다(/self\.skipWaiting\(\)/.test(sw) && /clientsClaim\(\)/.test(sw), '⑤ skipWaiting ＋ clientsClaim 그대로')
잰다(/endsWith\('\/share-target'\)/.test(sw) && /handleShare\(req\)/.test(sw), '⑤ 공유받기(share_target) 가로채기 그대로')
잰다(/form\.getAll\('image'\)/.test(sw), '⑤ 공유 사진을 «여러 장» 받는 것 그대로 (2026-08-28 사고)')
잰다(/shared-image-\$\{i\}/.test(sw), '⑤ 사진마다 다른 칸에 담는 것 그대로 (덮어쓰기 사고)')
for (const 캐시 of ['hankki-art', 'hankki-font', 'jsdelivr-cache', 'recipe-images', 'ocr-assets']) {
  잰다(sw.includes(`cacheName: '${캐시}'`), `⑤ 캐시 «${캐시}» 그대로`)
}

// ── ⑥ 🖼 아이콘을 두 곳에 적지 않는다 — 매니페스트가 쓰는 그 파일이어야 한다
const vite = 읽기('vite.config.js')
const 아이콘 = (/icon:\s*new URL\('([^']+)'/.exec(sw) || [])[1] || ''
잰다(!!아이콘 && vite.includes(아이콘), `⑥ 알림 아이콘이 매니페스트와 같은 파일이다`, 아이콘)

// ── ⑦ 🍎 아이폰은 이 길로 «못 온다»고 적혀 있나 (다음 세션이 또 헤매지 않게)
잰다(/Capacitor|WKWebView/.test(sw), '⑦ 아이폰이 왜 안 되는지 파일에 적혀 있다 (Capacitor·WKWebView)')

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 푸시 리스너 제자리 · 원래 있던 것 그대로')
process.exit(나쁨 ? 1 : 0)
