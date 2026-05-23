import {
  feedbackSessionFromSharingParams,
  votingSessionFromSharingParams,
} from '@/utils/eventSharingModel.js'

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

/**
 * @param {string} eventId
 * @param {string} title
 */
export function guestFeedbackStorageKey(eventId, title) {
  const eid = String(eventId ?? '').trim()
  const sessionTitle = String(title ?? '').trim()
  if (!eid || !sessionTitle) return ''
  return `sharim.guestFeedback.${eid}.${encodeURIComponent(sessionTitle)}`
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

/** @param {Record<string, unknown> | null | undefined} sharingParams */
export function clearGuestVotedForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, playlistName } = votingSessionFromSharingParams(sharingParams)
  const key = guestVoteStorageKey(eventId, playlistName)
  if (!key) return
  window.localStorage.removeItem(key)
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 */
export function hasGuestSubmittedFeedbackForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return false
  const { eventId, title } = feedbackSessionFromSharingParams(sharingParams)
  const key = guestFeedbackStorageKey(eventId, title)
  if (!key) return false
  return window.localStorage.getItem(key) === '1'
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 */
export function markGuestSubmittedFeedbackForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, title } = feedbackSessionFromSharingParams(sharingParams)
  const key = guestFeedbackStorageKey(eventId, title)
  if (!key) return
  window.localStorage.setItem(key, '1')
}

/** @param {Record<string, unknown> | null | undefined} sharingParams */
export function clearGuestSubmittedFeedbackForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, title } = feedbackSessionFromSharingParams(sharingParams)
  const key = guestFeedbackStorageKey(eventId, title)
  if (!key) return
  window.localStorage.removeItem(key)
}
