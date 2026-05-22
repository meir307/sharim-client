/**
 * Value for HTML `<input type="date">` (YYYY-MM-DD).
 * @param {unknown} value
 * @returns {string}
 */
export function toDateInputValue(value) {
  if (value == null || value === '') return ''

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const s = String(value).trim()
  if (!s) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const datePrefix = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (datePrefix) return datePrefix[1]

  const parsed = new Date(s)
  if (Number.isNaN(parsed.getTime())) return ''

  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
