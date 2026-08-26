/**
 * Photos are re-encoded in the browser before they ever reach a payload: a
 * phone picture is several megabytes, and a gift carries its pictures inside
 * the encrypted blob. Everything here works on data: URIs so a gift stays one
 * self-contained object.
 */
const MAX_EDGE = 1400
const QUALITY = 0.78

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('לא הצלחתי לפתוח את התמונה'))
    img.src = src
  })
}

const readAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(new Error('לא הצלחתי לקרוא את הקובץ'))
    fr.readAsDataURL(file)
  })

function draw(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('הדפדפן לא תומך בעיבוד תמונות')
  paint(ctx)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

/** Shrink to fit MAX_EDGE and re-encode as JPEG. */
export async function shrinkImage(file: Blob): Promise<string> {
  const img = await loadImage(await readAsDataUrl(file))
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  const w = img.width * scale
  const h = img.height * scale
  return draw(w, h, (ctx) => ctx.drawImage(img, 0, 0, w, h))
}

/**
 * Centre-crop to a square. The puzzle board is square, so cropping here means
 * the pieces never have to letterbox.
 */
export async function squareImage(file: Blob): Promise<string> {
  const img = await loadImage(await readAsDataUrl(file))
  const edge = Math.min(img.width, img.height)
  const size = Math.min(edge, MAX_EDGE)
  const sx = (img.width - edge) / 2
  const sy = (img.height - edge) / 2
  return draw(size, size, (ctx) =>
    ctx.drawImage(img, sx, sy, edge, edge, 0, 0, size, size),
  )
}

/** Rough byte size of a data: URI, for the "this gift needs hosting" decision. */
export const dataUrlBytes = (src: string): number =>
  Math.round(((src.length - (src.indexOf(',') + 1)) * 3) / 4)
