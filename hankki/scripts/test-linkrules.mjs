// 링크 읽기 규칙 검증 — URL 정리 + 쓰레기글 거르기 (네트워크 없이 순수 함수만)
import { youtubeId, isYouTube, looksLikeJunk, looksLikeJunkTitle, fetchLinkRecipe } from '../src/linkReader.js'

let fail = 0
const eq = (got, want, label) => {
  const ok = got === want
  if (!ok) fail++
  console.log(`${ok ? '  ok' : 'FAIL'}  ${label}  →  ${JSON.stringify(got)}${ok ? '' : ` (기대: ${JSON.stringify(want)})`}`)
}

console.log('── 유튜브 주소 정리 (숏츠·youtu.be·파라미터 다 같은 ID로) ──')
const ID = 'dQw4w9WgXcQ'
eq(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), ID, '일반 영상')
eq(youtubeId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s'), ID, '시작시간 t=')
eq(youtubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ'), ID, '모바일 m.')
eq(youtubeId('https://youtu.be/dQw4w9WgXcQ'), ID, '단축 youtu.be')
eq(youtubeId('https://youtu.be/dQw4w9WgXcQ?si=AbCdEf12'), ID, '단축+공유파라미터 si=')
eq(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), ID, '숏츠')
eq(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share'), ID, '숏츠+공유')
eq(youtubeId('https://www.youtube.com/live/dQw4w9WgXcQ'), ID, '라이브')
eq(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), ID, '임베드')
eq(youtubeId('youtube.com/watch?v=dQw4w9WgXcQ'), ID, 'http 없이 붙여넣기')
eq(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc'), ID, '재생목록 포함')
console.log('  — 유튜브 아닌 것은 걸러야 함 —')
eq(youtubeId('https://blog.naver.com/hong/12345'), '', '네이버 블로그')
eq(youtubeId('https://www.instagram.com/p/Cabc123/'), '', '인스타')
eq(youtubeId('https://myyoutube.com/watch?v=dQw4w9WgXcQ'), '', '비슷한 이름 사칭 도메인')
eq(youtubeId(''), '', '빈 값')
eq(youtubeId('그냥 글자'), '', '주소 아님')
eq(isYouTube('https://youtu.be/dQw4w9WgXcQ'), true, 'isYouTube 참')
eq(isYouTube('https://naver.com'), false, 'isYouTube 거짓')

console.log('\n── 본문 아닌 글 거르기 (예전엔 이게 재료칸에 박혔음) ──')
const YT_CONSENT = `Before you continue to YouTube
We use cookies and data to Deliver and maintain Google services, Track outages and protect against spam, fraud, and abuse, Measure audience engagement and site statistics to understand how our services are used and enhance the quality of those services. If you choose to Accept all, we will also use cookies and data to develop and improve new services. Sign in. Accept all. Reject all. More options.`
eq(looksLikeJunk(YT_CONSENT), true, '유튜브 쿠키 동의문 (창업자가 본 그 영어)')
eq(looksLikeJunk('Just a moment... Checking your browser before accessing the site.'), true, '봇 검사 페이지')
eq(looksLikeJunk('Please enable JavaScript to view this page.'), true, '자바스크립트 안내')
eq(looksLikeJunk('Access Denied. You do not have permission.'), true, '접근 거부')
eq(looksLikeJunk(''), true, '빈 글')
eq(looksLikeJunk('   \n  '), true, '공백만')
console.log('  — 진짜 레시피는 통과해야 함 —')
eq(looksLikeJunk('재료: 김치 300g, 돼지고기 200g, 두부 반모\n만드는 법\n1. 냄비에 기름을 두르고 볶는다\n2. 물을 붓고 끓인다'), false, '한글 레시피')
eq(looksLikeJunk('Ingredients: 2 cups flour, 1 tbsp sugar. Instructions: preheat oven to 180C and bake 25 minutes.'), false, '영어 레시피 (낱말로 통과)')
eq(looksLikeJunk('오늘은 엄마표 김치찌개를 끓여봤어요. 신김치가 있어서 딱 좋았답니다. 국물이 진하게 우러나요.'), false, '한글 블로그 본문')

console.log('\n── 껍데기 제목 거르기 (Inbox에 "YouTube" 레시피 쌓이던 것) ──')
eq(looksLikeJunkTitle('YouTube'), true, '"YouTube"')
eq(looksLikeJunkTitle('Just a moment...'), true, '"Just a moment..."')
eq(looksLikeJunkTitle('Before you continue to YouTube'), true, '동의문 제목')
eq(looksLikeJunkTitle(''), true, '빈 제목')
eq(looksLikeJunkTitle('엄마표 김치찌개 황금레시피'), false, '진짜 제목은 통과')

console.log('\n── 유튜브 링크는 아예 읽지 않는다 (준비 중) ──')
let netCalls = 0
globalThis.fetch = async (u) => { netCalls++; throw new Error('네트워크 호출됨: ' + u) }
for (const u of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ']) {
  eq(await fetchLinkRecipe(u), null, `읽기 시도 안 함: ${u.slice(8, 40)}`)
}
eq(netCalls, 0, '유튜브엔 바깥 요청 0건')

console.log(fail ? `\n❌ 실패 ${fail}건` : '\n✅ 전부 통과')
process.exit(fail ? 1 : 0)
