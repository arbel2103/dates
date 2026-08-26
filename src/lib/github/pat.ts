/**
 * The publishing credential: a fine-grained GitHub token with
 * `Contents: read & write` on the one repo that holds the gifts. It lives in
 * this browser's localStorage and is never part of anything published — a
 * recipient's browser reads gifts anonymously.
 */
const PAT_KEY = 'dates-github-pat'
const REPO_KEY = 'dates-github-repo'

/** owner/repo the gifts are committed to. */
const DEFAULT_REPO = 'arbel2103/dates'

/** The branch the blobs live on. Deliberately not `main`: Pages builds on
    `main`, and a gift should be live in seconds rather than after a CI run. */
export const GIFT_BRANCH = 'gifts'

export const getPat = (): string => localStorage.getItem(PAT_KEY) ?? ''

export function setPat(token: string): void {
  const value = token.trim()
  if (value) localStorage.setItem(PAT_KEY, value)
  else localStorage.removeItem(PAT_KEY)
}

export const getRepo = (): string => localStorage.getItem(REPO_KEY) || DEFAULT_REPO

export function setRepo(repo: string): void {
  const value = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
  if (value) localStorage.setItem(REPO_KEY, value)
  else localStorage.removeItem(REPO_KEY)
}

export const hasPat = (): boolean => getPat().length > 0
