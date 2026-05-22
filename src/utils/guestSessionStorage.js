import { votingSessionFromSharingParams } from '@/utils/eventSharingModel.js'

/**
 * @param {string} eventId
 * @param {string} playlistName
 */
export function guestVoteStorageKey(eventId, playlistName) {
  const eid = String(eventId ?? '').trim()
  const name = String(playlistName ?? '').trim()
  if (!eid || !name) return ''
  return `sharim.guestVoted.${eid}.${encodeURIComponent(name)}`
}

export function guestFeedbackStorageKey(sharingCode) {
  return `sharim.guestFeedback.${String(sharingCode ?? '').trim()}`
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 */
export function hasGuestVotedForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return false
  const { eventId, playlistName } = votingSessionFromSharingParams(sharingParams)
  const key = guestVoteStorageKey(eventId, playlistName)
  if (!key) return false
  return window.localStorage.getItem(key) === '1'
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 */
export function markGuestVotedForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, playlistName } = votingSessionFromSharingParams(sharingParams)
  const key = guestVoteStorageKey(eventId, playlistName)
  if (!key) return
  window.localStorage.setItem(key, '1')
}

export function hasGuestSubmittedFeedback(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return false
  return window.localStorage.getItem(guestFeedbackStorageKey(sharingCode)) === '1'
}

export function markGuestFeedbackSubmitted(sharingCode) {
  if (!sharingCode || typeof window === 'undefined') return
  window.localStorage.setItem(guestFeedbackStorageKey(sharingCode), '1')
}
