// 🍎 애플 출시기념 캐러셀 4:5 (1080×1350) — 「아이폰 유저분들 많이 기다리셨죠?」 (2026-09-13)
//
// 📮 창업자 = *"이거하구 인스타 출시기념 캐러셀+릴스만들어야해."* · *"아! 애플스토어"*
//   · *"웅 많이 기다리셨죠/. 하나 훅에 넣자"* · *"폭죽같은거 터지는 효과? 도 좋고"*
//   · *"「아이폰에서도, 오늘도 한끼하세요」 ← 고정멘트를 그대로 쓰면서 기념을 얹어"*
//   · *"잘보이게 적어줘 이 캐러셀은 아이폰출시가 제일 중요하니까"*
//   · *"아! 로그인화면도 하나 캐러셀에 넣자"*
//
// ⛔⛔ **승인 나기 전엔 올리지 않는다** (절대원칙 39 — 없는 것을 있다고 하지 않는다).
//    ⏳ 2026-09-13 현재 = 창업자가 애플 심사를 «취소하고 다시» 넣는 중. 올리는 날은 승인 뒤에 정한다.
// 🏪 창업자 = *"승인되면 우리가 만드는 모든 캐러셀과 릴스에 구글스토어+애플스토어 다 넣어줘야해"*
//    → 그래서 이 판은 **끝 장에 두 스토어를 «나란히»** 적는다(추석 캐러셀 6장 끝도 승인 뒤 같이 고친다).
//
// ⛔ 장마다 «짜임»을 가른다 — 같은 틀에 글자만 바꾸지 않는다(창업자 = *"네가준시안2개 똑같아보여"*).
// 📌 화면 넉 장 = `scripts/_shot-애플기념화면-0913.mjs` 가 찍는다(아이폰 393×852 · 3배).
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))   // ⛔컨테이너 경로를 박지 않는다
const 낼곳 = process.env.OUT || '/tmp/claude-0/애플기념캐러셀'
const 화면곳 = process.env.SHOTS || '/tmp/claude-0/애플기념화면'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
// 🎉 축하 컷 = `docs/stickers/여름-창업자-2507/낱개-콤비축하/` (⛔앱 자산 폴더엔 없다 — 여긴 판 전용)
//    01 꼬르곰 만세 · 02 폭죽 터뜨리는 둘 · 03 주스로 건배 · 04 병 들고 만세
const 축하 = (n) => 짐(join(R, `docs/stickers/여름-창업자-2507/낱개-콤비축하/${n}.png`))
// ⛔ 04(술병 든 꼬르곰)는 «안 쓴다» — 요리 앱 홍보에 술을 들리지 않는다.
// ⛔⛔ [눈으로 잡았다 2026-09-13] 01·02 는 «꼬르곰 혼자»다(낱개로 자를 때 갈렸다).
//    처음 판에서 둘을 나란히 놨더니 **꼬르곰이 둘**이라 이상했다 — 펭펭이 없다.
//    ✅ 훅에는 «둘이 같이 나온» 컷을 쓴다 → 불꽃놀이 씬(sn_06). 폭죽이 그림 «안»에 들어 있다.
const 씬 = (k) => 짐(join(R, `docs/stickers/콤비-씬-정본-2026-09-05/낱개-씬/${k}.png`))
const 화면 = (f) => { const p = join(화면곳, f); if (!existsSync(p)) throw new Error(`⛔ 화면이 없다 → ${p} (먼저 _shot-애플기념화면-0913.mjs 를 돌린다)`); return 짐(p) }

const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

const 바탕 = '#FFFDF7'
const 진 = '#5d3410'
const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative}
  .알약{display:inline-flex;align-items:center;gap:10px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:14px 26px;font-size:30px;color:#7a5a3a}
</style>`

// 📱 폰 틀 — 찍은 화면(393×852 비율)을 둥근 테두리에 앉힌다.
//   ⭐ 높이만 주면 폭은 비율대로 따라온다(393/852 = 0.4613). 장마다 크기를 달리 쓴다.
const 폰 = (파일, 높이, 자리, 기울기 = 0) => {
  const 폭 = Math.round(높이 * 393 / 852)
  return `<div style="position:absolute;${자리};width:${폭}px;height:${높이}px;border-radius:${Math.round(높이 * 0.055)}px;
    border:${Math.max(6, Math.round(높이 / 110))}px solid #3a2a1c;overflow:hidden;background:#fff;
    box-shadow:0 30px 60px rgba(93,52,16,.22);transform:rotate(${기울기}deg)">
    <img src="${화면(파일)}" style="width:100%;height:100%;object-fit:cover;object-position:top">
  </div>`
}
// 🐻🐧 축하 컷 — ⛔«높이»로 맞춘다(컷마다 가로세로 비율이 다르다 · 추석 캐러셀에서 값을 치르고 배운 것)
const 컷 = (n, 높이, 자리) => `<img src="${축하(n)}" style="position:absolute;${자리};height:${높이}px;object-fit:contain">`

const 장 = []

// ① 훅 — ⭐이 캐러셀의 «전부». 글씨가 제일 크고, 폰은 안 넣는다(말이 먼저다).
장.push({ 이름: '1-훅', html: `
  <div style="position:absolute;left:0;right:0;top:150px;text-align:center;font-size:44px;color:#a98a6b">2026.09 · 애플 앱스토어 출시</div>
  <div style="position:absolute;left:0;right:0;top:250px;text-align:center;font-size:92px;line-height:1.3;font-weight:700">아이폰 유저분들<br>많이 기다리셨죠?</div>
  <!-- 🎆 폭죽 = 창업자 *"폭죽같은거 터지는 효과? 도 좋고"* — 불꽃놀이 씬컷을 통째로 쓴다(꼬르곰·펭펭 둘 다 있다) -->
  <!-- ⛔ [눈으로 잡았다] 700px 로 두니 아래 알약이 그림 «위»에 얹혀 꼬르곰 다리를 가렸다 → 660px 로 줄이고 위로 -->
  <div style="position:absolute;left:230px;top:515px;width:620px;height:620px;border-radius:56px;overflow:hidden;box-shadow:0 24px 50px rgba(93,52,16,.18)">
    <img src="${씬('sn_06')}" style="width:100%;height:100%;object-fit:cover">
  </div>
  <div style="position:absolute;left:0;right:0;bottom:110px;text-align:center"><span class="알약" style="font-size:38px">이제 아이폰에서도 한끼</span></div>` })

// ② 뭐가 되나 — 홈 화면을 «크게». 글은 왼쪽 위, 폰은 오른쪽 아래로 흘린다.
장.push({ 이름: '2-홈', html: `
  <div style="position:absolute;left:80px;top:130px;font-size:64px;line-height:1.3;font-weight:700">이제 어느 폰이든<br>한끼</div>
  <div style="position:absolute;left:80px;top:310px;font-size:36px;color:#a98a6b">흩어진 레시피를, 한곳에</div>
  <!-- ⛔ [눈으로 잡았다] 900px 로 두니 가운데가 휑했다 — 폰을 키워 화면을 채운다 -->
  ${폰('2-홈.png', 1020, 'right:40px;bottom:-110px', -3)}
  ${컷('01', 380, 'left:80px;bottom:230px')}` })

// ③ 담아두기 — ②의 좌우를 «뒤집는다». 폰이 왼쪽, 글이 오른쪽.
장.push({ 이름: '3-담아두기', html: `
  <!-- ⛔ [눈으로 잡았다] 제목을 네 줄로 흘렸더니 오른쪽 아래가 통째로 비었다 → 두 줄로 묶고 알약을 받쳤다 -->
  <div style="position:absolute;right:70px;top:150px;text-align:right;font-size:56px;line-height:1.4;font-weight:700">인스타에서 본 레시피,<br>담아두면 안 사라져요</div>
  <!-- ⛔⛔ [창업자가 잡았다 2026-09-13] = *"블로그 글씨는 긁어서 붙여야하지않아?? 캡쳐는 인스타랑 유튜브 캡션만"*
       내가 처음에 「링크만 넣으면 재료·순서가 들어와요」라고 썼는데 **그건 되는 척이다.**
       🔢 실측(src/screens/ImportScreen.jsx) — 「link」 갈래 = *"주소만 저장해요 · 재료·순서는 안 담겨요"*
          ＋ 「readLink」(링크 본문 자동 읽기)는 「서버 되면 되살릴 것」으로 «빠져 있다».
       ✅ 진짜 되는 길은 둘 = ⑴캡처해서 공유(사진 글씨를 읽어 재료·순서 자동) ⑵글 붙여넣기(무료).
          블로그는 ⑵다 — 창업자 말이 맞다. -->
  <!-- ⛔⛔ [2026-09-13 · 두 번째 고침] 「캡처해서 한끼로 «보내면»」도 아이폰에선 «틀린 말»이다.
       🔢 아이폰 세션 실측 = iOS 껍데기에 Share Extension 이 없다(확장 타깃 0 · Info.plist NSExtension 0건).
          안드로이드가 되는 건 웹 매니페스트의 share_target 덕인데 «iOS는 그걸 안 읽는다».
          실물 = 딸 폰 09-13 12:09 사진첩 공유 시트에 「한끼」 없음.
       ✅ 아이폰에서 되는 길 = 캡처해 두고 → 한끼에서 「사진 가져오기」로 «불러온다»(사진 고르기는 실물 확인됨).
       ⭐ 그래서 「보내면」을 빼고 «불러오면»으로. 두 폰 다 맞는 말이 된다.
       📌 Share Extension 은 승인 뒤 1.1 에서 만든다(네이티브라 딸 폰 시험까지 하고 낸다). -->
  <div style="position:absolute;right:70px;top:340px;text-align:right;font-size:34px;color:#a98a6b;line-height:1.55">캡처해 두고 불러오면<br>재료·순서까지 정리돼요</div>
  <div style="position:absolute;right:70px;top:520px"><span class="알약">캡처한 사진에서 읽어와요</span></div>
  <div style="position:absolute;right:70px;top:610px"><span class="알약">블로그 글은 복사해서 붙여넣기</span></div>
  ${폰('3a-레시피탭.png', 1000, 'left:40px;bottom:-90px', 3)}` })

// ④ 꾸미기 — 배경을 «진하게» 뒤집는다(앞 셋과 확 다르게). 폰은 가운데.
장.push({ 이름: '4-꾸미기', html: `
  <div style="position:absolute;inset:0;background:#f3e6d2"></div>
  <div style="position:absolute;left:0;right:0;top:110px;text-align:center;font-size:60px;font-weight:700">내 한 끼를 꾸며서</div>
  <div style="position:absolute;left:0;right:0;top:200px;text-align:center;font-size:34px;color:#a0805c">표지로 저장하고, 친구한테 자랑해요</div>
  <!-- ⛔ [눈으로 잡았다] 880px 은 제목과 폰 사이가 400px 넘게 비었다 → 키워서 위로 붙인다 -->
  <!-- ⛔ [창업자 2026-09-13] "내한끼꾸며서에 아래부분잘렸엉 랜덤뽑기" — bottom:-110px 이라 폰 아래가
       화면 밖으로 나가 「랜덤 카드로 뽑기」 칸이 통째로 잘렸다. ⭐폰을 «통째로» 화면 안에 넣는다. -->
  ${폰('4b-꾸민표지-상세.png', 1000, 'left:309px;bottom:40px')}
  ${컷('02', 300, 'right:40px;bottom:120px')}` })

// ⑤ 로그인 — ⭐«아이폰만의» 화면이다(Apple로 로그인). 이 캐러셀에서 제일 중요한 증거.
장.push({ 이름: '5-로그인', html: `
  <div style="position:absolute;left:80px;top:130px;font-size:58px;line-height:1.35;font-weight:700">폰이 바뀌어도<br>그대로 있어요</div>
  <div style="position:absolute;left:80px;top:310px;font-size:34px;color:#a98a6b;line-height:1.5">Apple로 로그인하면<br>레시피가 따라와요</div>
  <!-- ⛔ 여긴 캐릭터를 «안» 넣는다 — 애플 단추가 보이는 폰이 이 장의 주인공이고, 곰을 넣으면 글씨와 만난다 -->
  <!-- ⛔ [눈으로 잡았다] 왼쪽 아래가 통째로 비고 애플 단추가 작았다 — 이 장의 주인공이 그 단추다 -->
  <div style="position:absolute;left:80px;top:530px"><span class="알약" style="background:#111;border-color:#111;color:#fff;font-size:34px">Apple로 로그인</span></div>
  <div style="position:absolute;left:80px;top:625px"><span class="알약" style="font-size:34px">Google 계정으로도</span></div>
  <div style="position:absolute;left:80px;top:740px;font-size:30px;color:#a98a6b;line-height:1.6">새 폰으로 바꿔도<br>담아둔 레시피가 그대로 있어요</div>
  ${폰('5-로그인.png', 1020, 'right:30px;bottom:-110px', 3)}` })

// ⑥ 끝 — 고정멘트에 기념을 얹는다 ＋ 두 스토어
장.push({ 이름: '6-끝', html: `
  <div style="position:absolute;left:0;right:0;top:230px;text-align:center;font-size:76px;line-height:1.35;font-weight:700">아이폰에서도,<br>오늘도 한끼하세요</div>
  ${컷('03', 430, 'left:290px;top:520px')}
  <div style="position:absolute;left:0;right:0;bottom:150px;text-align:center;font-size:42px;line-height:1.6;color:#7a5a3a">
    앱스토어 · 구글 플레이에서<br><b style="color:${진};font-size:68px;letter-spacing:-1px">한끼 레시피북</b> 검색</div>` })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage()
for (const s of 장) {
  await p.setContent(`<!doctype html><html><head>${머리}</head><body>${s.html}</body></html>`)
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${낼곳}/${s.이름}.png` })
}
await b.close()
console.log(`📸 ${장.length}장 →`, 낼곳)
