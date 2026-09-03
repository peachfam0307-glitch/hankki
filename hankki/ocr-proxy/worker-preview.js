// 🖼🖼 한끼 «표지 그림 찾기» — Cloudflare Worker  (`hankki-preview`)
//
// ═══ 이 워커가 하는 일 = 딱 하나 ═══════════════════════════════════
//   SNS 글 주소를 주면 **그 글의 표지 그림 주소**를 돌려준다. 그게 전부다.
//   ⛔ 그림을 «옮겨 담지» 않는다 — 주소만 돌려주고, 그림은 유저 폰이 인스타에서 직접 받는다.
//      (우리 서버로 그림을 통과시키면 그때부터 그건 «퍼가기»가 되고 비용도 우리가 낸다)
//
// 📮 창업자 = *"인스타는 유튜브처럼 미리보기 안돼??"* → *"다른앱들은 미리보기 되던데 인스타"*
//    → 경쟁 앱 화면을 보여줬다. **애둘핑 광어깻잎무침 표지가 실제로 떠 있었다.**
//    ⭐ 그래서 「인스타가 안 준다」가 아니라 **「서버로 받으면 준다」**가 맞다.
//    ⛔ 내가 앞서 *"서버가 없어서 못 한다"* 고 말한 건 틀렸다 — 워커를 이미 둘 갖고 있었다.
//
// ⛔⛔ **왜 유튜브처럼 못 하나** (이걸 모르면 「그냥 주소 만들면 되잖아」로 되돌아온다)
//    · 유튜브 = 영상 번호만 알면 그림 주소가 «계산된다» — `i.ytimg.com/vi/<번호>/hqdefault.jpg`
//    · 인스타 = 그런 규칙이 **없다.** 표지 주소는 서명이 붙어 매번 다르고 며칠 뒤 만료된다.
//      ＋ Meta 가 **2025-11-03 부터** oEmbed 응답에서 `thumbnail_url` 을 **뺐다**
//        (공식 안내 = *"직접 만들어 쓰라"*). 그래서 **글 페이지를 열어 집는 길**뿐이다.
//    · 브라우저가 직접 열면 막힌다(교차출처) → **서버가 대신 연다.** 다른 앱이 하는 게 그거다.
//
// ═══ 왜 «따로» 워커인가 (⭐창업자 물음 = *"tidy? ocr?"* 에 대한 답) ═══
//   ⛔ `hankki-ocr` 에 얹으면 안 된다 — 거긴 **돈을 막는 요새**다.
//      Vision 키·앱 토큰·운영자 열쇠를 갖고 있고 월 900 통을 센다.
//      거기에 «로그인 없이 아무나 부르는 길»을 뚫으면, 이 코드에 구멍 하나만 나도
//      **비밀키를 가진 워커**가 노출된다. 성격이 다른 둘을 한 집에 두지 않는다.
//   ⛔ `hankki-tidy` 도 아니다 — 거긴 AI 예산이 걸려 있다.
//   ✅ 그래서 **세 번째 워커**. 여긴 **비밀키가 하나도 없다** — 새어도 잃을 게 없다.
//      ＋ 인스타가 우리를 차단하거나 누가 두들겨도 **OCR·AI 는 멀쩡하다.**
//      ＋ 새 워커라 **기존 것을 덮어쓸 위험이 0** (CLAUDE.md 규칙 36 이 걱정하는 사고가 안 난다).
//
// ═══ 안전 ═══════════════════════════════════════════════════════
//   🔒 **SSRF 방어 = 받은 주소를 그대로 열지 않는다.**
//      인스타 «글 번호»만 뽑아 **우리가 주소를 만든다.**
//      ⛔ 이게 없으면 이 워커가 「아무 데나 열어주는 도구」가 된다(사내망·클라우드 메타데이터).
//   🚪 우리 앱 주소에서 온 것만 답한다(＋창업자가 폰 브라우저로 재볼 수 있게 Origin 없는 GET 은 허용).
//   ⏱ 한 번 열 때 8초까지만 기다린다 — 인스타가 늘어지면 우리 화면까지 늘어진다.
//
// ═══ 규모 (절대원칙 32 — 수만 명이어도 되나) ═══════════════════════
//   📦 **KV 에 7일 담는다.** 그래서 인스타를 두드리는 횟수는 «유저 수»가 아니라 «글 수»에 붙는다.
//      SNS 편이 100개여도 일주일에 100번이다. 유저가 만 명이든 십만 명이든 같다.
//   ⏰ **왜 7일인가** = 인스타 표지 주소는 서명이 붙어 «며칠 뒤 만료»된다.
//      영구 저장하면 나중에 **깨진 그림**을 주게 된다. 오래 담는 게 이득이 아니다.
//      ⛔ 숫자를 늘리는 걸로 문제를 풀지 않는다(절대원칙 34) — 만료가 «성질»이라 짧게 담는 게 맞다.
//   💰 Cloudflare 요청은 하루 10만까지 공짜. 이 길은 **돈이 붙는 API 를 하나도 안 부른다.**
//
// ═══ 안 됐을 때 (⭐이게 설계의 절반이다) ═══════════════════════════
//   인스타가 로그인 창을 내밀거나 우리를 막으면 `{"ok":false}` 를 준다.
//   앱은 그걸 받으면 **지금 화면 그대로**다(문 한 줄). ⛔깨진 그림은 절대 안 뜬다.
//   📌 그 «바닥»을 2026-09-04 에 **먼저 깔아 뒀다** — 그래서 이 길이 언제 무너져도 화면이 안 깨진다.
//
// ═══ 만드는 법 ═══════════════════════════════════════════════════
//   ① Cloudflare → Workers → Create Worker → 이름 `hankki-preview`
//   ② 이 파일을 통째로 붙여넣고 Deploy
//   ③ Settings → Bindings → KV namespace 추가: 이름 `PREV_KV` (새 네임스페이스 하나 만들면 된다)
//      ⚠️ KV 를 안 붙여도 «돌아간다» — 담아두기만 안 될 뿐이다(그럼 인스타를 매번 두드린다).
//   ④ 재보기 = 폰 브라우저로
//      `https://hankki-preview.<계정>.workers.dev/?u=https://www.instagram.com/reel/<글번호>/`
//      · `{"ok":true,"thumb":"https://..."}` → 된다
//      · `{"ok":false,...}` → 인스타가 서버엔 안 준다 → 앱은 지금 화면 그대로 둔다
//   ⛔ 내가 있는 곳은 `workers.dev` 도 `instagram.com` 도 막혀 있다(실측 = 둘 다 000).
//      **그래서 되는지는 창업자 폰에서만 알 수 있다.** 재보기 전엔 「된다」고 말하지 않는다.

const ALLOWED_ORIGINS = [
  'https://peachfam0307-glitch.github.io',
]

// 🔖🔖 **어느 판이 도는지 답에 찍는다** — 2026-09-04 에 이것 때문에 세 번 헛돌았다.
//   코드를 고쳐 올렸는데 옛 답이 나와서 「안 올라갔나 · 캐시인가 · 내 규칙이 틀렸나」를 구분 못 했다.
//   ⭐ 창업자 폰이 유일한 계기판인데 그 계기판이 «어느 판을 재는지»를 안 알려주고 있었다.
//   ⛔ 판을 고칠 때마다 이 글자도 «같이» 올린다. 안 올리면 이 장치가 거짓말을 한다.
const 판 = '0904-7'
const 담는기간 = 7 * 24 * 3600   // 초 — 인스타 표지 주소가 만료되는 결을 따라간다
const 기다림 = 8000              // ms — 인스타가 늘어져도 우리 화면은 안 늘어지게

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      // ⛔⛔ [2026-09-04] 여기에 한 시간 캐시를 걸어놨다가 «재보기가 막혔다» —
      //    코드를 고쳐 올려도 폰이 옛 답을 그대로 보여줘서 「안 고쳐졌다」로 보였다.
      //    ⭐ 성공한 답은 담아둘 값이 있지만 **실패한 답을 물고 있으면 안 된다** — 고칠 길이 막힌다.
      //       (성공 답은 아래에서 따로 캐시를 붙인다)
      'Cache-Control': 'no-store',
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    // ⛔ 우리 앱이 아닌 «다른 웹사이트»가 이 길을 쓰는 건 막는다.
    //    ⭐ Origin 이 «아예 없는» 것은 통과 — 폰 브라우저로 직접 열어 재보는 길이다(창업자용).
    //       브라우저가 붙이는 Origin 은 위조가 안 되므로, 남의 사이트는 여기서 걸린다.
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ ok: false, why: 'origin' }, 403, cors)
    }

    const 준주소 = new URL(request.url).searchParams.get('u') || ''
    // 🔒 인스타 «글 번호»만 뽑는다. 받은 주소는 여기서 버려진다(SSRF 방어의 전부다).
    const 뽑기 = String(준주소).match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,30})/)
    if (!뽑기) return json({ ok: false, why: 'not_instagram' }, 400, cors)
    const 갈래 = 뽑기[1] === 'p' ? 'p' : 'reel'
    const 번호 = 뽑기[2]

    const kv = env.PREV_KV || null
    const 칸 = `ig:${번호}`
    if (kv) {
      const 담긴것 = await kv.get(칸)
      // ⛔ 「못 찾았다」도 담는다(`-`) — 안 그러면 안 되는 글 하나가 «매번» 인스타를 두드린다.
      if (담긴것 === '-') return json({ ok: false, why: 'no_thumb', cached: true }, 200, cors)
      if (담긴것) return json({ ok: true, thumb: 담긴것, cached: true }, 200, cors)
    }

    // 🚪 문 둘을 순서대로 두드린다 — 하나가 막혀도 다른 하나가 열릴 수 있다.
    //    ⛔ 둘 다 «우리가 만든» 주소다(받은 주소를 그대로 쓰지 않는다).
    //    ⭐ embed 판을 «먼저» 본다 — 로그인 창을 덜 내밀고 답도 가볍다.
    const 문들 = [
      `https://www.instagram.com/${갈래}/${번호}/embed/captioned/`,
      `https://www.instagram.com/${갈래}/${번호}/`,
    ]
    let 그림 = ''
    let 발자국 = []
    for (const 문 of 문들) {
      try {
        const r = await fetch(문, {
          headers: {
            // 🕵️ 사람이 쓰는 브라우저처럼 물어본다 — 안 그러면 로그인 창을 내민다.
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          },
          signal: AbortSignal.timeout(기다림),
          cf: { cacheTtl: 3600, cacheEverything: true },
        })
        발자국.push(`${문.includes('embed') ? 'embed' : 'page'}=${r.status}`)
        if (!r.ok) continue
        const 날글 = await r.text()
        // 🔬🔬 [0904-6 · 창업자 폰 발자국이 «모양»을 알려줬다] 실측 =
        //    `og없음(og:image글자=N 창고주소=Y 길이=628068)`
        //    ⭐⭐ 읽는 법 = **og 태그는 아예 없고**(N), 인스타 창고 주소는 **있고**(Y), 628KB짜리 JS 덩어리다.
        //       → 사진 주소가 «태그»가 아니라 **페이지에 심어둔 JSON 안**에 들어 있다는 뜻이고,
        //         JSON 안에서는 빗금이 `\/` 로 escape 된다 — `https:\/\/scontent-…\/v\/t51.…`
        //    📌 그래서 0904-5 규칙이 못 집었다. 그리고 0904-4 가 집어 온 로고는
        //       «HTML 속성에 평문으로» 있던 것이라 잡혔던 것이다. 두 사실이 딱 맞아떨어진다.
        //    ✅ 그러니 찾기 «전»에 escape 를 풀어 놓는다 — 그러면 평문이든 JSON 안이든 같은 잣대로 잡힌다.
        //    ⛔ 잣대를 넓히는 게 아니다(그건 로고를 다시 부른다) — «같은 잣대»를 «글 전체»에 통하게 만든 것이다.
        const 글 = 날글.replace(/\\\//g, '/').replace(/\\u0026/g, '&')
        // 🔎🔎 [2026-09-04 · 1차 재보기 결과로 고침] 창업자 폰 실측 =
        //    `{"ok":false,"why":"no_thumb","발자국":["embed=200","og없음","page=200","og없음"]}`
        //    ⭐⭐ **둘 다 200 이다 — 인스타가 «막지 않았다».** 로그인 창이 아니라
        //       **내 뽑기 규칙이 못 집은 것**이다. 그러니 이건 「안 되는 길」이 아니라 「내가 틀린 것」이다.
        //    ⛔ 그래서 «태그 모양»에 기대는 걸 그만둔다 — 인스타는 화면을 자바스크립트로 그리고
        //       태그 순서·따옴표·클래스 이름을 수시로 바꾼다. 거기에 맞추면 **다음 달에 또 깨진다**(땜빵).
        //    ✅ 대신 **「인스타 그림 창고 주소가 글 안에 있나」**를 찾는다 — 그건 도메인이라 잘 안 바뀐다.
        //       ＋ 도메인 검사(`cdninstagram`·`fbcdn`)를 그대로 통과해야 하므로 아무거나 집히지 않는다.
        const 후보들 = [
          // ⓐ og:image — 속성 순서가 어떻든(content 가 먼저 와도) 잡히게
          (글.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || 글.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) || [])[1],
          (글.match(/"display_url"\s*:\s*"([^"]+)"/) || [])[1],
          (글.match(/"thumbnail_src"\s*:\s*"([^"]+)"/) || [])[1],
          // ⓑ ⭐마지막 그물 = 글 어디든 있는 «올린 사진» 주소를 집는다
          //    ⛔⛔ [0904-5 로 좁힘] 처음엔 「cdninstagram 이면 다 좋다」로 넓게 잡았는데
          //       static.cdninstagram.com/rsrc.php/…webp 를 집어 왔다 — 그건 «인스타 화면 부품(로고)»이다.
          //       📌 창업자 폰 실측이 잡았다: {"판":"0904-4","ok":true,"thumb":".../rsrc.php/yr/r/rzWiSjZRxk5.webp"}
          //       ⭐ 「되기만 하면 된다」로 넓히면 «엉뚱한 그림이 뜨는» 더 나쁜 실패가 된다.
          //          안 뜨는 건 유저가 알지만, 로고가 뜨면 «그게 그 요리인 줄» 안다.
          //    ✅ 유저가 «올린» 사진만 = scontent 서버 ＋ 경로에 /v/t51. 이 있는 자리
          //       (인스타는 사람이 올린 사진을 scontent-… 서버의 t51 자리에 둔다. 화면 부품은 static 서버다)
          (글.match(/https:\/\/scontent[\w.-]*\.(?:cdninstagram\.com|fbcdn\.net)\/v\/t51\.[^\s"'\\<>]+/i) || [])[0],
        ].filter(Boolean)
        for (const 후보 of 후보들) {
          const 값 = 후보.replace(/\\u0026/g, '&').replace(/&amp;/g, '&').replace(/\\\//g, '/')
          // ⛔ 「그림 주소처럼 생긴 것」이 아니라 «인스타 것»인지 본다 — 아무 주소나 앱에 넘기지 않는다.
          if (!/^https:\/\/[\w.-]*(cdninstagram\.com|fbcdn\.net)\//.test(값)) continue
          // ⛔ 프로필 사진·아이콘을 표지로 착각하지 않는다 — 그건 «이 요리»가 아니다.
          if (/\/s150x150\/|profile_pic|\/t51\.2885-19\//.test(값)) continue
          그림 = 값; break
        }
        if (그림) break
        // 🧭 못 찾았을 때 «왜»를 남긴다 — 다음에 또 짐작하지 않으려고.
        //    (창업자 폰이 유일한 계기판이라, 발자국이 곧 내 눈이다)
        // 🔬🔬 [0904-7 · 진단] **이번 한 번으로 「길이 있나 없나」를 끝낸다.**
        //    📌 여기까지 온 실측 = og:image 없음 · 인스타 주소는 있음 · **622KB**.
        //       ⭐ 622KB 는 embed 판 치고 «너무 크다» — 진짜 embed 는 그보다 훨씬 작다.
        //          그래서 우리가 받은 건 embed 가 아니라 **로그인·동의 화면(앱 껍데기)**일 가능성이 크다.
        //          ＝ `200` 으로 오는 «로그인 벽». 그러면 이 길은 «막힌 것»이지 내가 못 집는 게 아니다.
        //    ✅ 그걸 가르는 값만 찍는다 — 제목 · 로그인 낱말 · embed 표식 · 실제 주소 종류.
        //    ⛔ 주소를 통째로 안 찍는다(길고 서명이 붙어 있다) — 앞머리만 모아 센다.
        const 제목 = (글.match(/<title[^>]*>([^<]{0,60})/i) || [])[1] || '없음'
        const 로그인벽 = /loginForm|"LoginAndSignupPage"|accounts\/login|로그인|Log in to Instagram/i.test(글)
        const embed표식 = /EmbeddedAsset|embed_media|instagram-media/i.test(글)
        const 주소종류 = [...new Set((글.match(/https:\/\/[\w.-]*(?:cdninstagram\.com|fbcdn\.net)\/[^\s"'\\<>]{0,20}/gi) || [])
          .map((u) => u.replace(/^https:\/\//, '').slice(0, 42)))].slice(0, 4)
        발자국.push(`못찾음(제목="${제목}" 로그인벽=${로그인벽 ? 'Y' : 'N'} embed표식=${embed표식 ? 'Y' : 'N'} 길이=${글.length} 주소=${주소종류.join(' | ') || '없음'})`)
      } catch (e) {
        발자국.push(`err=${String(e).slice(0, 40)}`)
      }
    }

    if (!그림) {
      // ⭐ 못 찾은 것도 «짧게» 담는다(6시간) — 인스타가 나중에 열어줄 수도 있으니 영원히 포기하진 않는다.
      if (kv) { try { await kv.put(칸, '-', { expirationTtl: 6 * 3600 }) } catch { /* 담기 실패는 치명적이지 않다 */ } }
      return json({ ok: false, why: 'no_thumb', 발자국 }, 200, cors)
    }
    if (kv) { try { await kv.put(칸, 그림, { expirationTtl: 담는기간 }) } catch { /* 위와 같다 */ } }
    return json({ ok: true, thumb: 그림, cached: false }, 200, cors)
  },
}

function json (o, status, cors) {
  // 🔖 모든 답에 판 번호를 붙인다 — 「지금 도는 게 어느 코드인가」를 한눈에 본다.
  return new Response(JSON.stringify({ 판, ...o }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  })
}
