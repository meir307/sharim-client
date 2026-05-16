/**
 * @param {string | null | undefined} dateStr ISO date or parseable date string
 * @returns {string}
 */
export function formatHebrewDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}
