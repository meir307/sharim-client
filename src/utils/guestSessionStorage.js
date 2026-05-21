/**
 * @param {string} sharingCode
 * @param {string} [playlistKey] — `playlistId` or `playlistName` from voting `sharingParams`
 */
export function guestVoteStorageKey(sharingCode, playlistKey) {
  const code = String(sharingCode ?? '').trim()
  const playlist = String(playlistKey ?? '').trim()
  if (!playlist) {
    return `sharim.guestVoted.${code}`
  }
  return `sharim.guestVoted.${code}.${playlist}`
}

export function guestFeedbackStorageKey(sharingCode) {
  return `sharim.guestFeedback.${String(sharingCode ?? '').trim()}`
}

/**
 * @param {string} sharingCode
 * @param {string} playlistKey
 */
export function hasGuestVoted(sharingCode, playlistKey) {
  if (!sharingCode || typeof window === 'undefined') return false
  const key = String(playlistKey ?? '').trim()
  if (!key) return false
  return window.localStorage.getItem(guestVoteStorageKey(sharingCode, key)) === '1'
}

/**
 * @param {string} sharingCode
 * @param {string} playlistKey
 */
export function markGuestVoted(sharingCode, playlistKey) {
  if (!sharingCode || typeof window === 'undefined') return
  const key = String(playlistKey ?? '').trim()
  if (!key) return
  window.localStorage.setItem(guestVoteStorageKey(sharingCode, key), '1')
}

export function hasGuestSubmittedFeedback(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return false
  return window.localStorage.getItem(guestFeedbackStorageKey(sharingCode)) === '1'
}

export function markGuestFeedbackSubmitted(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return
  window.localStorage.setItem(guestFeedbackStorageKey(sharingCode), '1')
}
