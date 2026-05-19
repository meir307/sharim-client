export function guestVoteStorageKey(sharingCode) {
  return `sharim.guestVoted.${String(sharingCode ?? '').trim()}`
}

export function guestFeedbackStorageKey(sharingCode) {
  return `sharim.guestFeedback.${String(sharingCode ?? '').trim()}`
}

export function hasGuestVoted(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return false
  return window.localStorage.getItem(guestVoteStorageKey(sharingCode)) === '1'
}

export function markGuestVoted(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return
  window.localStorage.setItem(guestVoteStorageKey(sharingCode), '1')
}

export function hasGuestSubmittedFeedback(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return false
  return window.localStorage.getItem(guestFeedbackStorageKey(sharingCode)) === '1'
}

export function markGuestFeedbackSubmitted(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return
  window.localStorage.setItem(guestFeedbackStorageKey(sharingCode), '1')
}
