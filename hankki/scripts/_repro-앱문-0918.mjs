// 📱🔬 「앱으로 열리나」 재현판 (2026-09-18) — 창업자 *"쿠팡이츠 눌러봤는데 그냥 대표홈페이지였어. 배민도 그렇고"*
//   ⭐ 안드로이드면 intent:// 로 앱을 열고, 아이폰·컴퓨터면 그대로 웹이라야 한다.
//   ⛔ 꾸러미 이름이 틀리면 앱이 있어도 안 열린다 — 그래서 «적힌 그대로» 나오는지 글자로 잰다.
import { 앱문 } from '../src/utils.js'
const 안드 = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'
const 아이폰 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1'
let 통과 = 0; const 실패 = []
const 본다 = (n, 참) => { if (참) { 통과++; console.log('  ✓', n) } else { 실패.push(n); console.log('  ✗', n) } }
const 쿠팡이츠 = 앱문('https://www.coupangeats.com', 안드)
본다('쿠팡이츠 = intent 로 바뀐다', 쿠팡이츠.startsWith('intent://'))
본다('쿠팡이츠 꾸러미 = com.coupang.mobile.eats', 쿠팡이츠.includes('package=com.coupang.mobile.eats'))
본다('앱이 없으면 웹으로 떨어진다', 쿠팡이츠.includes('browser_fallback_url=' + encodeURIComponent('https://www.coupangeats.com')))
const 배민 = 앱문('https://baemin.com', 안드)
본다('배민 꾸러미 = com.sampleapp', 배민.includes('package=com.sampleapp'))
본다('컬리 꾸러미 = com.dbs.kurly.m2', 앱문('https://www.kurly.com', 안드).includes('package=com.dbs.kurly.m2'))
본다('아이폰은 그대로 웹', 앱문('https://www.coupangeats.com', 아이폰) === 'https://www.coupangeats.com')
본다('모르는 곳은 그대로 웹', 앱문('https://shopping.naver.com', 안드) === 'https://shopping.naver.com')
본다('요기요는 꾸러미를 «못 찾아» 그대로 웹', 앱문('https://www.yogiyo.co.kr/mobile/', 안드).startsWith('https://'))
본다('주소가 이상해도 안 죽는다', 앱문('그냥글자', 안드) === '그냥글자')
console.log(`\n${실패.length ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패.length}`)
if (실패.length) process.exit(1)
