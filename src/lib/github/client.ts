import { toBase64, type Bytes } from '../bytes'
import { GIFT_BRANCH, getPat, getRepo } from './pat'

/**
 * The GitHub calls the studio makes, straight from the browser (these
 * endpoints send CORS headers). Writes go through the Git Data API rather than
 * the Contents API: it takes files of any size, and blob → tree → commit → ref
 * lands a publish as a single commit.
 */
const API = 'https://api.github.com'

export class GithubError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'GithubError'
    this.status = status
  }
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${getPat()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  }
}

async function fail(res: Response): Promise<never> {
  let detail = res.statusText
  try {
    const body = (await res.json()) as { message?: string }
    if (body.message) detail = body.message
  } catch {
    /* non-JSON error body */
  }
  throw new GithubError(res.status, detail)
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: headers(init?.body ? { 'Content-Type': 'application/json' } : undefined),
    cache: 'no-store',
  })
  if (!res.ok) await fail(res)
  return (await res.json()) as T
}

/** Check the token and repo. Returns the repo's default branch. */
export async function checkAccess(): Promise<string> {
  const repo = await call<{ default_branch?: string; permissions?: { push?: boolean } }>(
    `/repos/${getRepo()}`,
  )
  if (repo.permissions && !repo.permissions.push) {
    throw new GithubError(403, 'לטוקן אין הרשאת כתיבה על הריפו')
  }
  return repo.default_branch ?? 'main'
}

interface Ref {
  object: { sha: string }
}

async function getRef(branch: string): Promise<string | null> {
  const res = await fetch(`${API}/repos/${getRepo()}/git/ref/heads/${branch}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (res.status === 404) return null
  if (!res.ok) await fail(res)
  return ((await res.json()) as Ref).object.sha
}

/**
 * The gifts branch on first publish. It is created as an orphan — an empty
 * tree with no parent — so it never carries the app's own history and a
 * `git log` of the site stays readable.
 */
async function ensureGiftBranch(): Promise<string> {
  const existing = await getRef(GIFT_BRANCH)
  if (existing) return existing

  const tree = await call<{ sha: string }>(`/repos/${getRepo()}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ tree: [] }),
  })
  const commit = await call<{ sha: string }>(`/repos/${getRepo()}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: 'התחלת מדף המתנות', tree: tree.sha, parents: [] }),
  })
  await call(`/repos/${getRepo()}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${GIFT_BRANCH}`, sha: commit.sha }),
  })
  return commit.sha
}

async function commitTree(
  parent: string,
  message: string,
  tree: object[],
): Promise<void> {
  const repo = getRepo()
  for (let attempt = 0; attempt < 3; attempt++) {
    const tip = attempt === 0 ? parent : (await getRef(GIFT_BRANCH)) ?? parent
    try {
      const base = await call<{ tree: { sha: string } }>(
        `/repos/${repo}/git/commits/${tip}`,
      )
      const newTree = await call<{ sha: string }>(`/repos/${repo}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: base.tree.sha, tree }),
      })
      const commit = await call<{ sha: string }>(`/repos/${repo}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({ message, tree: newTree.sha, parents: [tip] }),
      })
      await call(`/repos/${repo}/git/refs/heads/${GIFT_BRANCH}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha, force: true }),
      })
      return
    } catch (err) {
      if (attempt >= 2) throw err
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }
}

/** Upload one encrypted gift. Returns the path it landed on. */
export async function uploadGift(id: string, blob: Bytes): Promise<string> {
  const parent = await ensureGiftBranch()
  const created = await call<{ sha: string }>(`/repos/${getRepo()}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: toBase64(blob), encoding: 'base64' }),
  })
  const path = `${id}.bin`
  await commitTree(parent, `מתנה ${id}`, [
    { path, mode: '100644', type: 'blob', sha: created.sha },
  ])
  return path
}

/** Take a published gift down. The link stops resolving immediately. */
export async function deleteGift(path: string): Promise<void> {
  const parent = await getRef(GIFT_BRANCH)
  if (!parent) return
  const repo = getRepo()
  const base = await call<{ tree: { sha: string } }>(`/repos/${repo}/git/commits/${parent}`)
  const oldTree = await call<{ tree: { path: string; mode: string; type: string; sha: string }[] }>(
    `/repos/${repo}/git/trees/${base.tree.sha}`,
  )
  const entries = oldTree.tree.filter((e) => e.path !== path)
  const newTree = await call<{ sha: string }>(`/repos/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ tree: entries.map((e) => ({ path: e.path, mode: e.mode, type: e.type, sha: e.sha })) }),
  })
  const commit = await call<{ sha: string }>(`/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message: `הסרת ${path}`, tree: newTree.sha, parents: [parent] }),
  })
  await call(`/repos/${repo}/git/refs/heads/${GIFT_BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  })
}

/**
 * Read a published gift. Deliberately unauthenticated: this is the call the
 * recipient's browser makes, and it must work for someone with no token. raw
 * is tried first (no rate limit worth worrying about); the API is the fallback
 * for the minutes while raw's CDN still has a miss cached.
 */
export async function fetchGiftBlob(repo: string, path: string): Promise<Bytes> {
  const sources = [
    `https://raw.githubusercontent.com/${repo}/${GIFT_BRANCH}/${path}`,
    `${API}/repos/${repo}/contents/${path}?ref=${GIFT_BRANCH}`,
  ]
  let lastStatus = 0
  for (const [index, url] of sources.entries()) {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: index === 0 ? undefined : { Accept: 'application/vnd.github.raw' },
    }).catch(() => null)
    if (res?.ok) return new Uint8Array(await res.arrayBuffer())
    lastStatus = res?.status ?? 0
  }
  throw new GithubError(lastStatus, 'המתנה לא נמצאה — אולי הקישור פג')
}
