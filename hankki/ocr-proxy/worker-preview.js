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

const 담는기간 = 7 * 24 * 3600   // 초 — 인스타 표지 주소가 만료되는 결을 따라간다
const 기다림 = 8000              // ms — 인스타가 늘어져도 우리 화면은 안 늘어지게

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600',
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
        const 글 = await r.text()
        const m = 글.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || 글.match(/"display_url"\s*:\s*"([^"]+)"/)
          || 글.match(/<img[^>]+class="[^"]*EmbeddedAsset[^"]*"[^>]+src="([^"]+)"/i)
        if (m) {
          그림 = m[1].replace(/\\u0026/g, '&').replace(/&amp;/g, '&')
          // ⛔ 「그림 주소처럼 생긴 것」이 아니라 «인스타 것»인지 본다 — 아무 주소나 앱에 넘기지 않는다.
          if (!/^https:\/\/[\w.-]*(cdninstagram\.com|fbcdn\.net)\//.test(그림)) { 발자국.push('낯선주소'); 그림 = ''; continue }
          break
        }
        발자국.push('og없음')
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
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  })
}
