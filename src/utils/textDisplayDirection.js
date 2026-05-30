const HEBREW_LETTER = /[\u0590-\u05FF\uFB1D-\uFB4F]/g
const LATIN_LETTER = /[A-Za-z]/g

/**
 * @param {string} [html]
 * @returns {string}
 */
export function plainTextFromHtml(html) {
  const raw = String(html ?? '')
  if (!raw.trim()) return ''
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * True when Hebrew letters dominate (or tie / no letters — default Hebrew UI).
 * @param {string} [text]
 */
export function isPrimarilyHebrewText(text) {
  const s = String(text ?? '').trim()
  if (!s) return true
  const heCount = (s.match(HEBREW_LETTER) || []).length
  const latCount = (s.match(LATIN_LETTER) || []).length
  if (heCount === 0 && latCount === 0) return true
  return heCount >= latCount
}

/**
 * @param {string} [text]
 * @returns {'rtl' | 'ltr'}
 */
export function textDisplayDirection(text) {
  return isPrimarilyHebrewText(text) ? 'rtl' : 'ltr'
}

/**
 * @param {string} [text]
 * @returns {'he' | 'en'}
 */
export function textDisplayLang(text) {
  return textDisplayDirection(text) === 'rtl' ? 'he' : 'en'
}

/**
 * Sample text for direction detection: plain → stripped HTML → title fallback.
 * @param {{ plainText?: string, htmlText?: string, fallbackTitle?: string }} [sources]
 * @returns {string}
 */
export function lyricsTextForDirection(sources = {}) {
  const plain = String(sources.plainText ?? '').trim()
  if (plain) return plain
  const html = String(sources.htmlText ?? '').trim()
  if (html) return plainTextFromHtml(html)
  return String(sources.fallbackTitle ?? '').trim()
}

/**
 * @param {string} [text]
 * @returns {{ dir: 'rtl' | 'ltr', lang: 'he' | 'en' }}
 */
export function lyricsDisplayAttrs(text) {
  const dir = textDisplayDirection(text)
  return { dir, lang: dir === 'rtl' ? 'he' : 'en' }
}
