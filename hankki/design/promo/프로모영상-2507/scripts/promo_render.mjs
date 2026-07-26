// promo.html → 녹화(webm) → mp4 인코딩 → 검수 프레임 6장
import fs from 'fs'
import { execFileSync, execSync } from 'child_process'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/vid'
const ffmpeg = (await import(`${OUT}/node_modules/ffmpeg-static/index.js`)).default
const REC = `${OUT}/rec`; fs.rmSync(REC, { recursive: true, force: true }); fs.mkdirSync(REC, { recursive: true })
const FR = `${OUT}/frames`; fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true })

console.log('녹화 시작…')
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] })
const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, recordVideo: { dir: REC, size: { width: 1080, height: 1920 } } })
const page = await ctx.newPage()
await page.goto(`file://${OUT}/promo.html`)
await page.waitForFunction(() => window.__ready === 1, { timeout: 15000 })
await page.waitForTimeout(1000) // 컴포지터가 밋밋카드 첫 프레임 그릴 시간
await page.evaluate(() => window.__go()) // 이제 애니 시작 (오프셋 0)
await page.waitForTimeout(29300)
await page.close()
await ctx.close(); await br.close()
const webm = fs.readdirSync(REC).find(f => f.endsWith('.webm'))
console.log('녹화 완료:', webm)

// 시작 검은화면 자동 감지 → 잘라낼 지점 결정
// ⚠️ blackdetect 로그는 stderr로 나온다 → execFileSync(stdout만 받음)로 파싱하면 항상 실패(=기본값).
//    그 버그로 검은 리드인이 남던 것 → execSync(...2>&1)로 stderr까지 받고, 검은구간 '끝난 뒤'(+0.04)부터 사용.
let trim = 1.7 // 파싱 실패시 안전 기본값(로드 리드인 대략)
try {
  const bd = execSync(`"${ffmpeg}" -i "${REC}/${webm}" -vf "blackdetect=d=0.05:pix_th=0.10" -an -f null - 2>&1`, { encoding: 'utf8' })
  const m = bd.match(/black_start:0[.\d]*\s+black_end:([\d.]+)/)
  if (m) trim = parseFloat(m[1]) + 0.04 // 검은구간 끝나고 살짝 뒤 = 첫 프레임이 검지 않게
} catch (e) { /* 파싱 실패해도 기본값 1.7 사용 */ }
console.log('검은화면 끝:', trim, 's → 여기부터 사용')

// mp4 인코딩 (H.264 · yuv420p · 30fps · 유튜브/인스타 호환)
const mp4 = `${OUT}/한끼-프로모-2507.mp4`
execFileSync(ffmpeg, ['-y', '-i', `${REC}/${webm}`, '-ss', String(trim),
  '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
  '-maxrate', '12M', '-bufsize', '20M', // 유튜브가 재압축해도 덜 뭉개지게 소스 비트레이트 여유
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
const sz = (fs.statSync(mp4).size / 1024 / 1024).toFixed(1)
let dur = '?'; try { execFileSync(ffmpeg, ['-i', mp4], { encoding: 'utf8' }) } catch (e) { const m = String(e.stderr || '').match(/Duration: ([0-9:.]+)/); if (m) dur = m[1] }
console.log(`mp4 완료: ${mp4} (${sz}MB, ${dur})`)

// 검수 프레임 6장 (각 장면 중간 지점)
const ts = [3.8, 7.5, 12.5, 18.0, 22.5, 28.0]
ts.forEach((t, i) => {
  execFileSync(ffmpeg, ['-y', '-ss', String(t), '-i', mp4, '-frames:v', '1', `${FR}/f${i}_${t}s.png`], { stdio: 'ignore' })
})
console.log('검수 프레임 6장 추출 완료 →', FR)
