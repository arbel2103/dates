/**
 * The behaviours unit tests cannot reach: dragging puzzle pieces until they
 * snap, a button that refuses to be pressed, and a gift going all the way from
 * the studio to a link that opens in a fresh browser — including the encrypted
 * route, with the ciphertext served the way raw.githubusercontent serves it.
 *
 *   npm run dev            # in one terminal
 *   npm i -D playwright    # once; deliberately not a dependency, so deploying
 *   node scripts/verify-gift.mjs   # the site never has to download a browser
 */
import { chromium } from 'playwright'
import { gzipSync } from 'node:zlib'

const BASE = 'http://localhost:5173/dates/'
const b64url = (b) => b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const link = (scenes) => `${BASE}#/v/${b64url(gzipSync(Buffer.from(JSON.stringify({ v: 1, scenes }), 'utf8')))}`

const PHOTO = 'data:image/svg+xml;base64,' + Buffer.from(
`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#7a3b2e"/><circle cx="300" cy="250" r="120" fill="#e8623a"/></svg>`).toString('base64')

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
const page = await ctx.newPage()
const fails = []
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); if (!ok) fails.push(name) }

/* ---------- puzzle: does a piece actually snap home? ---------- */
await page.goto(link([{ type: 'puzzle', title: 'תרכיבי אותנו מחדש', hint: 'גררי כל חלק למקום שלו',
  image: PHOTO, caption: 'אני ואגמי', rows: 2, cols: 2, doneText: 'אין עלייך', doneCta: 'גאה בך' }]))
await page.waitForTimeout(1200)

const counter = () => page.locator('.gift-stat').first().innerText()
check('puzzle starts empty', (await counter()).trim() === '0 / 4', await counter())

// drag every piece onto its slot by walking the DOM for its live geometry
for (let id = 0; id < 4; id++) {
  const geo = await page.evaluate((pieceId) => {
    const board = document.querySelector('[data-board]')
    const svg = document.querySelectorAll('[data-piece]')[pieceId]
    if (!board || !svg) return null
    const b = board.getBoundingClientRect()
    const s = svg.getBoundingClientRect()
    const cell = b.width / 2
    const row = Math.floor(pieceId / 2)
    const col = pieceId % 2
    return {
      from: { x: s.left + s.width / 2, y: s.top + s.height / 2 },
      to: { x: b.left + col * cell + cell / 2, y: b.top + row * cell + cell / 2 },
    }
  }, id)
  if (!geo) { check(`piece ${id} found`, false); break }
  await page.mouse.move(geo.from.x, geo.from.y)
  await page.mouse.down()
  await page.mouse.move(geo.to.x, geo.to.y, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(200)
}
check('every piece snapped home', (await counter()).trim() === '4 / 4', await counter())
await page.waitForTimeout(900)
check('completion message appears', await page.getByText('אין עלייך').isVisible())
check('completion button appears', await page.getByRole('button', { name: 'גאה בך' }).isVisible())

/* ---------- letter: does a tap finish it early? ---------- */
await page.goto(link([{ type: 'letter', text: 'שלום אהבת חיי, הכנתי לך משהו נחמד מאוד ארוך', speed: 90, cta: 'המשך' }]))
await page.waitForTimeout(600)
await page.locator('.gift-stage').click({ position: { x: 30, y: 700 } })
await page.waitForTimeout(300)
check('tap reveals the whole letter', await page.getByRole('button', { name: /המשך/ }).isVisible())

/* ---------- the scene sequence and the skin dissolve ---------- */
await page.goto(link([
  { type: 'envelope', note: 'לאגמי', emoji: '💌', hint: 'פתחי אותו…' },
  { type: 'invite', lines: ['שורה'], question: 'תצאי איתי מחר?', hint: '', yesLabel: 'כן', noLabel: 'לא',
    celebration: 'תודה להשם!', detailsTitle: 'ככה זה ייראה:', details: [{ emoji: '📅', text: 'מחר' }],
    ctaLabel: '', ctaHref: '' },
]))
await page.waitForTimeout(1200)
check('both worlds are mounted for the dissolve', await page.locator('.skin').count() === 2)
await page.getByRole('button', { name: /פתחי|לאגמי/ }).click()
await page.waitForTimeout(3600)
check('advances into the next scene', await page.getByText('תצאי איתי מחר?').isVisible())

/* ---------- the runaway button ---------- */
const noBox = async () => (await page.getByRole('button', { name: 'לא' }).boundingBox())
const before = await noBox()
await page.getByRole('button', { name: 'לא' }).hover({ force: true })
await page.waitForTimeout(420)
const after = await noBox()
check('the no button runs away when reached for',
  Math.abs(after.x - before.x) > 8 || Math.abs(after.y - before.y) > 8,
  `moved ${Math.round(Math.abs(after.x - before.x))}px`)
check('the no button shrinks', after.width < before.width - 2, `${Math.round(before.width)}→${Math.round(after.width)}`)
await page.getByRole('button', { name: 'כן' }).click({ force: true })
await page.waitForTimeout(900)
check('yes is accepted', await page.getByText('תודה להשם!').isVisible())

/* ---------- publishing, all the way to a working link ---------- */
await page.goto(BASE)
await page.waitForTimeout(900)
await page.getByRole('button', { name: 'גלגל' }).last().click()
await page.waitForTimeout(900)
// every page stays mounted in the scroller, so the clicks must be scoped to
// the wheel's own panel or they land on the ideas list behind it
const wheelPage = page.locator('section').nth(1)
for (const label of ['דייט ים בשקיעה', 'טיול בוקר בשמורה קרובה', 'קייקים בנהר']) {
  await wheelPage.getByRole('button', { name: new RegExp(label) }).first().click()
  await page.waitForTimeout(200)
}
await wheelPage.getByRole('button', { name: 'הפוך לאתר' }).click()
await page.waitForTimeout(1600)
const url = (await page.locator('code').first().innerText()).trim()
check('a link was produced', url.includes('#/v/'), `${url.length} chars`)
check('the link is short enough to send', url.length < 2600)

const fresh = await ctx.newPage()
await fresh.goto(url)
await fresh.waitForTimeout(1400)
check('the published link opens the wheel', await fresh.getByText('גלגל הדייטים שלנו').isVisible())
check('every chosen idea is on the wheel', await fresh.locator('text=קייקים בנהר').count() > 0)

/* ---------- the encrypted path, end to end ---------- */
const SEALED_SCENES = [
  { type: 'letter', text: 'שלום אהבת חיי', speed: 10, cta: 'המשך' },
  { type: 'gallery', photos: [{ src: PHOTO, caption: 'זוכרת?' }], hint: 'לחצי על התמונה' },
]

// seal it with the app's own codec, in the app's own page
const maker = await ctx.newPage()
await maker.goto(BASE)
await maker.waitForTimeout(800)
const sealed = await maker.evaluate(async (scenes) => {
  const { sealPayload } = await import('/dates/src/lib/giftCodec.ts')
  const { toBase64 } = await import('/dates/src/lib/bytes.ts')
  const { blob, key } = await sealPayload({ v: 1, scenes })
  return { b64: toBase64(blob), key, bytes: blob.length }
}, SEALED_SCENES)
check('the gift was sealed', sealed.bytes > 100, `${sealed.bytes} bytes of ciphertext`)

const cipher = Buffer.from(sealed.b64, 'base64')
check('the ciphertext hides the letter', !cipher.toString('utf8').includes('אהבת'))

const RAW = 'https://raw.githubusercontent.com/arbel2103/dates/gifts/abc123.bin'
let served = 0
await ctx.route(RAW, (route) => {
  served++
  route.fulfill({ status: 200, body: cipher, headers: { 'content-type': 'application/octet-stream' } })
})

// open it as the recipient would
const her = await ctx.newPage()
await her.goto(`${BASE}#/g/arbel2103/dates/abc123/${sealed.key}`)
await her.waitForTimeout(2500)
// StrictMode double-invokes effects in dev, so one or two fetches are both fine
check('the blob was fetched from raw', served >= 1 && served <= 2, `${served} request(s)`)
check('the letter decrypts and plays', await her.getByText('שלום אהבת חיי').isVisible())
await her.getByRole('button', { name: /המשך/ }).click()
await her.waitForTimeout(900)
check('the photo scene follows', await her.getByText('זוכרת?').isVisible())

// the wrong key must not open it
const stranger = await ctx.newPage()
await stranger.goto(`${BASE}#/g/arbel2103/dates/abc123/${'A'.repeat(43)}`)
await stranger.waitForTimeout(2200)
check('a wrong key is refused', await stranger.getByText('משהו השתבש').isVisible())
check('and nothing of the letter leaks', !(await stranger.content()).includes('אהבת חיי'))

// a missing blob must fail cleanly rather than hang
await ctx.route('https://raw.githubusercontent.com/arbel2103/dates/gifts/gone.bin', (r) => r.fulfill({ status: 404, body: '' }))
await ctx.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, body: '{}' }))
const missing = await ctx.newPage()
await missing.goto(`${BASE}#/g/arbel2103/dates/gone/${sealed.key}`)
await missing.waitForTimeout(2200)
check('a dead link says so', await missing.getByText(/פג|נמצאה/).isVisible())


console.log(fails.length === 0 ? '\nALL CHECKS PASSED' : `\n${fails.length} FAILED: ${fails.join(', ')}`)
await browser.close()
process.exit(fails.length === 0 ? 0 : 1)
