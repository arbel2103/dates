/**
 * Deterministic randomness for decoration.
 *
 * Hearts, stars and confetti are generated once and must keep their places
 * across re-renders — a star that jumps every time React repaints reads as a
 * glitch. Seeding by a fixed number also keeps screenshots comparable.
 */
export const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Build `count` decorations up front, each from the same seeded stream. */
export function generate<T>(count: number, seed: number, make: (rand: () => number, i: number) => T): T[] {
  const rand = seeded(seed)
  return Array.from({ length: count }, (_, i) => make(rand, i))
}
