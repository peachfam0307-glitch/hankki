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
// 🍎 [09-13 밤] Share Extension 이 들어와 아이폰 안내가 «공유 → 한끼 → 한끼를 열어요»를 가르친다(안드로이드 말 「더보기」·「갤러리」는 여전히 없어야).
잰다(!/「더보기」|갤러리/.test(iosBlock), '① 가져오기: 아이폰 안내에 안드로이드 말(「더보기」·갤러리)이 없다')
잰다(/<Icon name="share"/.test(iosBlock) && /한끼에 담았어요<\/b>가 뜨면 <b>한끼를 열어요/.test(iosBlock), '① 가져오기: 아이폰 안내 = 공유 단추 아이콘 + 「담았어요 → 한끼를 열어요」(Apple 제한을 정직하게)')
잰다(/사진 고르기/.test(iosBlock), '① 가져오기: 아이폰 안내가 「사진 고르기」도 남겨 둔다')
// ⑮ Share Extension 부품 — 파일·타깃·서명·워크플로 검사·웹 다리가 «한 벌»로 있나
const root = (p) => fs.readFileSync(path.join(여기, '..', '..', p), 'utf8')
const pbx = root('ios-app/ios/App/App.xcodeproj/project.pbxproj')
잰다(/productType = "com\.apple\.product-type\.app-extension"/.test(pbx) && /PRODUCT_BUNDLE_IDENTIFIER = kr\.hankki\.app\.share;/.test(pbx), '⑮ 부품: pbxproj 에 ShareExtension 타깃(kr.hankki.app.share)이 있다')
잰다(/Embed Foundation Extensions/.test(pbx) && /dstSubfolderSpec = 13;/.test(pbx), '⑮ 부품: 앱에 Embed Foundation Extensions(PlugIns) 단계가 있다')
잰다(/ShareIntakePlugin\.swift in Sources/.test(pbx) && /HankkiViewController\.swift in Sources/.test(pbx), '⑮ 부품: 앱 타깃 Sources 에 플러그인·VC 가 들어 있다')
const extPlist = root('ios-app/ios/App/ShareExtension/Info.plist')
잰다(/com\.apple\.share-services/.test(extPlist) && /NSExtensionActivationSupportsImageWithMaxCount/.test(extPlist) && !/TRUEPREDICATE/.test(extPlist), '⑮ 부품: Info.plist = share-services · 사진 규칙 · TRUEPREDICATE 없음')
잰다(/\$\(PRODUCT_MODULE_NAME\)\.ShareViewController/.test(extPlist) && !/NSExtensionMainStoryboard/.test(extPlist), '⑮ 부품: principal class 방식(스토리보드 없음)')
잰다(/group\.kr\.hankki\.app/.test(root('ios-app/ios/App/ShareExtension/ShareExtension.entitlements')) && /group\.kr\.hankki\.app/.test(root('ios-app/ios/App/App/App.entitlements')), '⑮ 부품: App Group 권한이 앱·부품 «양쪽»에 있다')
잰다(/<string>hankki<\/string>/.test(root('ios-app/ios/App/App/Info.plist')), '⑮ 부품: 앱 Info.plist 에 hankki:// 스킴이 있다')
잰다(/HankkiViewController\(\)/.test(root('ios-app/ios/App/App/SceneDelegate.swift')) && /registerPluginInstance\(ShareIntakePlugin\(\)\)/.test(root('ios-app/ios/App/App/HankkiViewController.swift')), '⑮ 부품: 로컬 플러그인이 손으로 등록된다(Capacitor 6+ 자동 등록 없음)')
잰다(!/import Capacitor/.test(root('ios-app/ios/App/ShareExtension/ShareViewController.swift')), '⑮ 부품: 확장은 Capacitor 를 import 하지 않는다(API_ONLY)')
const ff = root('ios-app/fastlane/Fastfile')
잰다(/app_identifier: APP_IDS/.test(ff) && /targets: \["ShareExtension"\]/.test(ff) && /EXT_ID => ext_profile/.test(ff), '⑮ 부품: Fastfile 이 두 ID 로 프로필을 만들고 타깃마다 서명한다')
잰다(/PlugIns\/\*\.appex/.test(root('.github/workflows/release-ios.yml')), '⑮ 부품: 워크플로 서명 확인이 .appex 까지 본다')
const app = 읽기('src/App.jsx')
잰다(/from '\.\/iosShare'/.test(app) && /consumeSharedIntake\(\)\.then\(공유담기\)/.test(app) && /visibilitychange', 앞으로오면/.test(app), '⑮ 다리: App.jsx 가 안드로이드·iOS 를 한 함수로 담고, 앞으로 올 때도 꺼낸다')
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

// 빌드 15 딸 폰 실물(20:1x)에서 잡은 둘
const ed = 읽기('src/screens/EditorScreen.jsx')
잰다(/onConfirm=\{\(\) => \{\s*try \{ localStorage\.removeItem\(DRAFT_KEY\) \} catch \{[^}]*\}\s*nav\.popAll\(\)/.test(ed), '⑬ 편집 「버리기」 = popAll 한 번(back 둘 겹침 ✕ · 아이폰 웹뷰가 하나 삼킴)')
const w1 = 읽기('ocr-proxy/worker.js'), w2 = 읽기('ocr-proxy/worker-tidy.js')
잰다(/ALLOWED_ORIGINS = \[[\s\S]*?'capacitor:\/\/localhost'[\s\S]*?\]/.test(w1), '⑭ OCR 워커 허용 주소에 capacitor://localhost')
잰다(/ALLOWED_ORIGINS = \[[\s\S]*?'capacitor:\/\/localhost'[\s\S]*?\]/.test(w2), '⑭ AI 워커 허용 주소에 capacitor://localhost')

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 아이폰 앱에서 없는 길·안 되는 부품을 가르치지 않는다 · 안드로이드 글자는 그대로\n')
process.exit(나쁨 ? 1 : 0)
