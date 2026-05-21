/**
 * Google Docs link display helpers (shared by DisplaySong and guest lyrics view).
 */

function googleDocumentPreviewUrl(docId) {
  const u = new URL(`https://docs.google.com/document/d/${encodeURIComponent(docId)}/preview`)
  u.searchParams.set('rm', 'minimal')
  return u.toString()
}

const GOOGLE_EMBED = [
  [/\/document\/d\/([a-zA-Z0-9_-]+)/, (id) => googleDocumentPreviewUrl(id)],
  [/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/spreadsheets/d/${id}/htmlview`],
  [/\/presentation\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/presentation/d/${id}/embed`],
]

/**
 * @param {string} [url]
 * @returns {string}
 */
export function embedUrlForLinkPreview(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'docs.google.com') return s

    const pathNoTrail = u.pathname.replace(/\/+$/, '')
    if (pathNoTrail.endsWith('/pub')) {
      u.searchParams.set('embedded', 'true')
      return u.toString()
    }

    for (const [re, toUrl] of GOOGLE_EMBED) {
      const m = u.pathname.match(re)
      if (m) return toUrl(m[1])
    }
    return s
  } catch {
    return s
  }
}

/**
 * @param {string} [url]
 * @returns {string | null}
 */
export function googleDocsDocumentIdFromUrl(url) {
  const s = String(url ?? '').trim()
  if (!s) return null
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'docs.google.com') return null
    const m = u.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/**
 * @param {string} [html]
 */
export function looksLikeGoogleLoginOrBlockedHtml(html) {
  const h = String(html ?? '').slice(0, 12000).toLowerCase()
  if (h.includes('accounts.google.com')) return true
  if (h.includes('sign in</title>') || h.includes('sign_in')) return true
  if (h.includes('access denied') && h.includes('google')) return true
  return false
}

/**
 * @param {string} rawHtml
 * @returns {string}
 */
export function buildGoogleDocDisplayHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return ''
  if (looksLikeGoogleLoginOrBlockedHtml(rawHtml)) return ''

  let doc
  try {
    doc = new DOMParser().parseFromString(rawHtml, 'text/html')
  } catch {
    return ''
  }

  doc.querySelectorAll('script').forEach((el) => el.remove())
  doc.querySelectorAll('iframe, object, embed').forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const n = attr.name.toLowerCase()
      if (n.startsWith('on')) el.removeAttribute(attr.name)
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href')
      if (href != null && /^\s*javascript:/i.test(href)) el.removeAttribute('href')
    }
  })

  const headBits = [...doc.head.querySelectorAll('link[rel="stylesheet"], style')]
    .map((el) => el.outerHTML)
    .join('')

  const bodyHtml = doc.body?.innerHTML?.trim() ?? ''
  if (!bodyHtml) return ''
  return headBits + bodyHtml
}

/**
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ html: string, plainText: string }>}
 */
export async function fetchGoogleDocDisplayContent(url, signal) {
  const id = googleDocsDocumentIdFromUrl(url)
  if (!id) return { html: '', plainText: '' }

  const base = `https://docs.google.com/document/d/${encodeURIComponent(id)}`
  const htmlUrl = `${base}/export?format=html`
  const txtUrl = `${base}/export?format=txt`

  try {
    const resH = await fetch(htmlUrl, { credentials: 'omit', mode: 'cors', signal })
    if (resH.ok) {
      const raw = await resH.text()
      const built = buildGoogleDocDisplayHtml(raw)
      if (built) return { html: built, plainText: '' }
    }
  } catch (e) {
    if (e?.name === 'AbortError') throw e
  }

  try {
    const resT = await fetch(txtUrl, { credentials: 'omit', mode: 'cors', signal })
    if (!resT.ok) return { html: '', plainText: '' }
    const text = await resT.text()
    const start = text.trimStart()
    if (start.startsWith('<!') || start.toLowerCase().startsWith('<html')) {
      return { html: '', plainText: '' }
    }
    return { html: '', plainText: text }
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    return { html: '', plainText: '' }
  }
}
