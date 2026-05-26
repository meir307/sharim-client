import {
  feedbackSessionFromSharingParams,
  votingSessionFromSharingParams,
} from '@/utils/eventSharingModel.js'

/**
 * @param {string} eventId
 * @param {string} sessionId — `guestVoteSessionId` or legacy playlist name
 */
export function guestVoteStorageKey(eventId, sessionId) {
  const eid = String(eventId ?? '').trim()
  const sid = String(sessionId ?? '').trim()
  if (!eid || !sid) return ''
  return `sharim.guestVoted.${eid}.${encodeURIComponent(sid)}`
}

/**
 * @param {string} eventId
 */
export function guestVoteLastSessionMetaKey(eventId) {
  const eid = String(eventId ?? '').trim()
  if (!eid) return ''
  return `sharim.guestVotedLastSession.${eid}`
}

/**
 * When `guestVoteSessionId` changes (host allowed vote again), remove the previous vote mark.
 * @param {Record<string, unknown> | null | undefined} sharingParams
 */
export function syncGuestVoteSessionFromSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, sessionId } = votingSessionFromSharingParams(sharingParams)
  if (!eventId || !sessionId) return

  const metaKey = guestVoteLastSessionMetaKey(eventId)
  if (!metaKey) return

  const prev = String(window.localStorage.getItem(metaKey) ?? '').trim()
  const current = sessionId

  if (prev && prev !== current) {
    const oldVoteKey = guestVoteStorageKey(eventId, prev)
    if (oldVoteKey) window.localStorage.removeItem(oldVoteKey)
  }

  if (prev !== current) {
    window.localStorage.setItem(metaKey, current)
  }
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
  const { eventId, sessionId } = votingSessionFromSharingParams(sharingParams)
  const key = guestVoteStorageKey(eventId, sessionId)
  if (!key) return false
  return window.localStorage.getItem(key) === '1'
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 */
export function markGuestVotedForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, sessionId } = votingSessionFromSharingParams(sharingParams)
  const key = guestVoteStorageKey(eventId, sessionId)
  if (!key) return
  window.localStorage.setItem(key, '1')
}

/** @param {Record<string, unknown> | null | undefined} sharingParams */
export function clearGuestVotedForSharingParams(sharingParams) {
  if (typeof window === 'undefined') return
  const { eventId, sessionId } = votingSessionFromSharingParams(sharingParams)
  const key = guestVoteStorageKey(eventId, sessionId)
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
