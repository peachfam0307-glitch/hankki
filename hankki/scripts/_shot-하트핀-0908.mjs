import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const R='/home/user/hankki/hankki'
const b64=(p)=>'data:image/png;base64,'+readFileSync(p).toString('base64')
const CK=(n)=>b64(`${R}/docs/stickers/요리소품-창업자-2026-08-17/낱개/ck_${n}.png`)
const 모자=b64(`${R}/src/assets/ui/idx_chef.png`), 연한=b64(`${R}/src/assets/ui/idx_chef_faint.png`)
const 후보=[['ㄱ','ck_19 클립＋하트',CK(19)],['ㄴ','ck_18 하트 씰',CK(18)],['ㄷ','ck_05 하트모자',CK('05')]]
const 카드=(그림,h,w,ht)=>`<div style="position:relative;width:${w}px"><div style="height:${ht}px;border-radius:16px;background:#f2ede3;border:1px solid #e3dccd"></div>
<img src="${그림}" style="position:absolute;top:-14px;right:12px;height:${h}px;width:auto;z-index:3">
<div style="font-size:12px;color:#5b5346;margin-top:5px">들깨나물무침</div></div>`
const 줄=(제목,h,w,ht)=>`<div style="margin:26px 0 0"><div style="font-size:13px;color:#8a8172;margin-bottom:20px">${제목}</div>
<div style="display:flex;gap:16px">${카드(모자,h,w,ht)}${카드(연한,h,w,ht)}${후보.map(([,,s])=>카드(s,h,w,ht)).join('')}</div></div>`
const html=`<body style="margin:0;padding:18px 20px;background:#e7ebe0;font-family:-apple-system,'Noto Sans KR',sans-serif">
<div style="display:flex;gap:16px;font-size:12.5px;color:#4a4438;font-weight:700">
<div style="width:111px">지금 모자(걸림)</div><div style="width:111px">지금 연한(안걸림)</div>
${후보.map(([k,n])=>`<div style="width:111px">${k} ${n}</div>`).join('')}</div>
${줄('작은 격자 3열 — 30px (실제 값)',30,111,131)}
${줄('큰 격자 2열 — 36px (실제 값)',36,168,211)}
</body>`
const br=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const p=await br.newPage({viewport:{width:720,height:520},deviceScaleFactor:2})
await p.setContent(html); await p.waitForTimeout(300)
await p.screenshot({path:'/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/pin.png',fullPage:true})
await br.close(); console.log('ok')
