import { alloc, type Bytes } from './bytes'

/**
 * gzip via the platform's CompressionStream. Every browser that can run this
 * app has it, and it turns a wheel's JSON into a few hundred bytes — which is
 * what lets a small gift ride entirely inside its own link.
 */
async function pump(bytes: Bytes, stream: GenericTransformStream): Promise<Bytes> {
  const out = new Blob([bytes]).stream().pipeThrough(stream)
  const buf = await new Response(out).arrayBuffer()
  return new Uint8Array(buf)
}

export async function gzip(bytes: Bytes): Promise<Bytes> {
  return pump(bytes, new CompressionStream('gzip'))
}

export async function gunzip(bytes: Bytes): Promise<Bytes> {
  return pump(bytes, new DecompressionStream('gzip'))
}

export function encodeText(text: string): Bytes {
  const encoded = new TextEncoder().encode(text)
  const out = alloc(encoded.length)
  out.set(encoded)
  return out
}

export const decodeText = (bytes: Bytes): string => new TextDecoder().decode(bytes)
