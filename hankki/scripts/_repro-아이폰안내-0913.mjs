// 🍎 재현판 — 아이폰 앱(껍데기 안)에서 «없는 길·안 되는 부품»을 가르치지 않나 (2026-09-13 · 심사 제출 뒤 잡아 다시 제출)
//   ⛔ 사고 = 가져오기 화면이 아이폰에서도 「공유 → 더보기 → 한끼」를 가르쳤다(아이폰 껍데기엔 share_target 이 없다).
//      같은 결로 Play 리뷰 주소 · 표지 알약 「Play스토어」 · <a download> 백업 「저장했어요」 · 「소리와 진동」 · 「최신 버전 확인」이 있었다.
//   잣대 = 소스 글자(빌드 없이) — 각 자리가 `앱안인가()` 로 갈라져 있나. ⛔ 웹·안드로이드 쪽 글자는 그대로 남아 있어야 한다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (ok, 말, 값) => { console.log(`  ${ok ? '✅' : '⛔'} ${말}${값 === undefined ? '' : ` — ${值(값)}`}`); if (!ok) 나쁨++ }
const 值 = (v) => (typeof v === 'string' ? v.slice(0, 60) : String(v))

const imp = 읽기('src/screens/ImportScreen.jsx')
잰다(/const OPTIONS_IOS = \[/.test(imp), '① 가져오기: 아이폰용 카드 묶음(OPTIONS_IOS)이 있다')
잰다(/\(앱안인가\(\) \? OPTIONS_IOS : OPTIONS\)\.map/.test(imp), '① 가져오기: 카드 목록이 앱안인가() 로 갈린다')
const iosBlock = (imp.match(/const 안내들 = 앱안인가\(\) \? \{([\s\S]*?)\} : 안내들기본/) || [])[1] || ''
잰다(iosBlock.length > 200, '① 가져오기: 아이폰 안내 블록이 있다', iosBlock.length)
잰다(!/더보기|「공유」|갤러리/.test(iosBlock), '① 가져오기: 아이폰 안내에 「더보기·공유·갤러리」가 없다')
잰다(/사진 고르기/.test(iosBlock), '① 가져오기: 아이폰 안내가 「사진 고르기」로 이끈다')
잰다(/강조\('「더보기」를 누르고 「한끼」를 찾아요'\)/.test(imp), '① 가져오기: 안드로이드 안내(더보기 → 한끼)는 그대로 남아 있다')

const cover = 읽기('src/shareCover.js')
잰다(/앱안인가\(\) \? '나도 꾸미러 가기  ·  App Store ‘한끼’ 검색' : '나도 꾸미러 가기  ·  Play스토어 ‘한끼’ 검색'/.test(cover), '② 표지 알약: 앱이면 App Store · 아니면 Play스토어')

const nud = 읽기('src/nudges.js')
잰다(/export const STORE_URL = 앱안인가\(\)\s*\? 'https:\/\/apps\.apple\.com\/kr\/app\/id6811288851\?action=write-review'/.test(nud), '③ 리뷰 주소: 앱이면 App Store 리뷰 쓰기(id6811288851)')
잰다(/: 'https:\/\/play\.google\.com\/store\/apps\/details\?id=io\.github\.peachfam0307_glitch\.twa'/.test(nud), '③ 리뷰 주소: 아니면 Play 그대로')

const prof = 읽기('src/screens/ProfileScreen.jsx')
잰다(/const downloadBackup = async \(\) => \{[\s\S]{0,400}if \(앱안인가\(\)\) \{ nav\.showToast\(/.test(prof), '④ 백업: 앱이면 <a download> 대신 정직한 안내(저장했어요 ✕)')
잰다(/\? <button className="btn-primary press" onClick=\{shareBackup\}>백업 보내서 저장하기 \(추천\)<\/button>/.test(prof), '④ 백업: 앱이면 추천 단추 = 공유 창')
잰다(/if \(앱안인가\(\)\) \{ nav\.showToast\('아이폰 앱은 App Store 에서 업데이트돼요/.test(prof), '⑤ 최신 버전 확인: 앱이면 App Store 안내')

const timer = 읽기('src/components/TimerSheet.jsx')
잰다(/\{앱안인가\(\) \? '소리' : '소리와 진동'\}/.test(timer), '⑥ 타이머: 앱이면 「소리」만(진동 없음)')

const sdc = 읽기('src/components/ShareDrawCard.jsx')
잰다(/if \(앱안인가\(\)\) \{ setBusy\('공유 창을 못 열었어요/.test(sdc), '⑦ 카드: 앱이면 저장 폴백 대신 정직한 안내')
잰다(/\{!앱안인가\(\) && <button className="press"\s*onClick=\{\(\) => \{ ready\.forEach/.test(sdc), '⑦ 카드: 「사진으로 저장할게요」는 앱 밖에서만')

const pantry = 읽기('src/components/PantryView.jsx')
잰다(/\{앱안인가\(\) \? '사진에서 영수증 고르기' : '갤러리에서 영수증 고르기'\}/.test(pantry), '⑧ 냉장고: 앱이면 「사진」')

// 2차 점검(09-13 19:4x)에서 더 잡은 넷
잰다(/\{!앱안인가\(\) && <div className="imp-tip">/.test(imp), '⑨ 가져오기 도움말: 「앱 설치하면 공유로 바로 담기」 팁은 앱 밖에서만')
잰다(/\{앱안인가\(\) \? '아이폰 앱은 App Store 에서 업데이트돼요' : '설치한 앱이 옛 버전에서 멈췄을 때 눌러요'\}/.test(prof), '⑩ 최신 버전 확인 설명 줄: 앱이면 App Store')
잰다(/if \(앱안인가\(\)\) \{ nav\.showToast\('저장한 게 많아 복사가 안 돼요/.test(prof), '⑪ 백업 복사 폴백: 앱이면 「파일로 저장했어요」라고 안 한다')
const prev = 읽기('src/components/PreviewSheet.jsx')
잰다(/\{앱안인가\(\) \? '아이패드에서도 써요' : '패드·폴드에서도 써요'\}/.test(prev), '⑫ 소식 팝업: 앱이면 「폴드」 대신 「아이패드」')

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 아이폰 앱에서 없는 길·안 되는 부품을 가르치지 않는다 · 안드로이드 글자는 그대로\n')
process.exit(나쁨 ? 1 : 0)
