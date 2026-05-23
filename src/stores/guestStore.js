import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './UserStore'
import {
  broadcastModeFromSharingParams,
  eventIdFromSharingParams,
  eventNameFromSharingParams,
  parseSharingParams,
  secondsToSleepFromSharingParams,
  feedbackSessionFromSharingParams,
  votingSessionFromSharingParams,
} from '@/utils/eventSharingModel.js'

/** @type {ReturnType<typeof setInterval> | null} */
let broadcastPollTimerId = null

/**
 * @param {unknown} data
 * @returns {Record<string, unknown>}
 */
function sharingParamsFromResponseData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('תשובה לא תקינה מהשרת')
  }
  if (data.success === false || data.Success === false) {
    const message =
      data.errorMessage ?? data.ErrorMessage ?? data.message ?? data.Message ?? 'הפעולה נכשלה'
    throw new Error(String(message))
  }
  const parsed = parseSharingParams(data.sharingParams ?? data.SharingParams)
  if (!parsed) {
    throw new Error('שידור לא נמצא או לא פעיל')
  }
  return parsed
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string}
 */
function sharingParamsFingerprint(sharingParams) {
  if (!sharingParams || typeof sharingParams !== 'object') return ''
  try {
    return JSON.stringify(sharingParams)
  } catch {
    return ''
  }
}

export const useGuestStore = defineStore('GuestStore', {
  state: () => ({
    loading: false,
    error: '',
    sharingCode: '',
    sharingParams: null,
    broadcastMode: 'landing',
    /** Set when a silent poll detects a new broadcastMode (for snackbar). */
    broadcastModeJustChanged: false,
    _sharingParamsFingerprint: '',
    _pollSecondsToSleep: null,
    /** While > 0, `FetchGuestEvent` interval is stopped (guest voting / feedback in progress). */
    broadcastPollPauseCount: 0,
  }),

  getters: {
    eventName(state) {
      const name = eventNameFromSharingParams(state.sharingParams)
      return name || 'אירוע'
    },
  },

  actions: {
    /**
     * @param {Record<string, unknown>} parsed
     * @returns {boolean} true if state updated
     */
    applySharingParams(parsed) {
      const fp = sharingParamsFingerprint(parsed)
      if (fp === this._sharingParamsFingerprint) {
        return false
      }

      const hadParams = this.sharingParams != null
      const prevMode = this.broadcastMode
      const nextMode = broadcastModeFromSharingParams(parsed)

      this.sharingParams = parsed
      this.broadcastMode = nextMode
      this._sharingParamsFingerprint = fp

      if (hadParams && prevMode !== nextMode) {
        this.broadcastModeJustChanged = true
      }

      return true
    },

    clearBroadcastModeJustChanged() {
      this.broadcastModeJustChanged = false
    },

    stopBroadcastPolling() {
      if (broadcastPollTimerId != null) {
        clearInterval(broadcastPollTimerId)
        broadcastPollTimerId = null
      }
      this._pollSecondsToSleep = null
    },

    pauseBroadcastPolling() {
      this.broadcastPollPauseCount += 1
      this.stopBroadcastPolling()
    },

    resumeBroadcastPolling() {
      if (this.broadcastPollPauseCount > 0) {
        this.broadcastPollPauseCount -= 1
      }
      if (this.broadcastPollPauseCount === 0) {
        this.startBroadcastPolling()
      }
    },

    restartBroadcastPolling() {
      this.stopBroadcastPolling()
      if (this.broadcastPollPauseCount === 0) {
        this.startBroadcastPolling()
      }
    },

    startBroadcastPolling() {
      if (this.broadcastPollPauseCount > 0) {
        return
      }
      this.stopBroadcastPolling()
      if (!String(this.sharingCode ?? '').trim() || !this.sharingParams) {
        return
      }

      const seconds = secondsToSleepFromSharingParams(this.sharingParams)
      this._pollSecondsToSleep = seconds
      const intervalMs = seconds * 1000

      broadcastPollTimerId = setInterval(() => {
        this.refreshSharingParams({ silent: true }).catch(() => {})
      }, intervalMs)
    },

    /**
     * `POST event/FetchGuestEvent` — in-memory broadcast snapshot (no DB on server).
     * @param {{ silent?: boolean }} [options]
     */
    async refreshSharingParams(options = {}) {
      const silent = Boolean(options.silent)
      const userStore = useUserStore()
      const code = String(this.sharingCode ?? '').trim()
      if (!code) return false

      try {
        const response = await axios.post(userStore.apiUrl + 'event/FetchGuestEvent', {
          sharingCode: code,
        })
        const parsed = sharingParamsFromResponseData(response.data)
        const prevSeconds = this._pollSecondsToSleep
        const nextSeconds = secondsToSleepFromSharingParams(parsed)
        const updated = this.applySharingParams(parsed)

        if (updated && prevSeconds != null && prevSeconds !== nextSeconds) {
          this.restartBroadcastPolling()
        }

        return updated
      } catch (err) {
        if (!silent) {
          throw err
        }
        return false
      }
    },

    /**
     * Initial load by sharing code (`?ev=`).
     * @param {string} sharingCode
     */
    /**
     * Submit guest ballot for the live voting broadcast.
     * @param {Array<{ id: string | number, songName: string, artist?: string }>} selections
     */
    async guestVote(selections) {
      const userStore = useUserStore()
      const code = String(this.sharingCode ?? '').trim()
      if (!code) {
        throw new Error('חסר קוד שיתוף')
      }

      const sp = this.sharingParams
      if (!sp || typeof sp !== 'object') {
        throw new Error('שידור לא פעיל')
      }

      const eventId = eventIdFromSharingParams(sp)
      const { playlistName } = votingSessionFromSharingParams(sp)
      const rawHeaderId = sp.votingHeaderId ?? sp.VotingHeaderId
      const votingHeaderId =
        rawHeaderId != null && String(rawHeaderId).trim() !== '' ? Number(rawHeaderId) : NaN

      if (!eventId) {
        throw new Error('מזהה אירוע חסר — הפעילו מחדש את ההצבעה מהמארח')
      }
      if (!playlistName) {
        throw new Error('שם פלייליסט חסר')
      }
      if (!Number.isFinite(votingHeaderId) || votingHeaderId <= 0) {
        throw new Error('מזהה סבב הצבעה חסר — הפעילו מחדש את ההצבעה מהמארח')
      }

      const picks = Array.isArray(selections)
        ? selections
            .filter((s) => s && String(s.songName ?? '').trim())
            .map((s) => ({
              id: s.id,
              songName: String(s.songName).trim(),
              artist: String(s.artist ?? '').trim() || undefined,
            }))
        : []
      if (!picks.length) {
        throw new Error('יש לבחור לפחות שיר אחד')
      }

      const response = await axios.post(userStore.apiUrl + 'event/SubmitGuestVote', {
        sharingCode: code,
        eventId: Number(eventId) || eventId,
        playlistName,
        votingHeaderId,
        selections: picks,
      })

      const data = response.data
      if (!data || typeof data !== 'object') {
        throw new Error('תשובה לא תקינה מהשרת')
      }
      if (data.success === false || data.Success === false) {
        const message =
          data.errorMessage ?? data.ErrorMessage ?? data.message ?? data.Message ?? 'שליחת ההצבעה נכשלה'
        throw new Error(String(message))
      }
    },

    /**
     * Submit guest feedback for the live feedback broadcast.
     * @param {Array<{ id: string | number, type: 'stars' | 'text', answer: number | string }>} questions
     */
    async guestFeedback(questions) {
      const userStore = useUserStore()
      const code = String(this.sharingCode ?? '').trim()
      if (!code) {
        throw new Error('חסר קוד שיתוף')
      }

      const sp = this.sharingParams
      if (!sp || typeof sp !== 'object') {
        throw new Error('שידור לא פעיל')
      }

      const eventId = eventIdFromSharingParams(sp)
      const { title } = feedbackSessionFromSharingParams(sp)
      const rawHeaderId = sp.feedbackHeaderId ?? sp.FeedbackHeaderId
      const feedbackHeaderId =
        rawHeaderId != null && String(rawHeaderId).trim() !== '' ? Number(rawHeaderId) : NaN

      if (!eventId) {
        throw new Error('מזהה אירוע חסר — הפעילו מחדש את המשוב מהמארח')
      }
      if (!title) {
        throw new Error('כותרת משוב חסרה')
      }
      if (!Number.isFinite(feedbackHeaderId) || feedbackHeaderId <= 0) {
        throw new Error('מזהה סבב משוב חסר — הפעילו מחדש את המשוב מהמארח')
      }

      const MAX_ANSWER_TEXT_LEN = 45
      const answers = []
      const list = Array.isArray(questions) ? questions : []

      for (const q of list) {
        const questionId = Number(q?.id)
        if (!Number.isFinite(questionId)) {
          throw new Error('שאלת משוב לא תקינה')
        }

        const type = q?.type === 'text' ? 'text' : 'stars'
        if (type === 'stars') {
          const stars = Math.floor(Number(q?.answer))
          if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
            throw new Error('יש לדרג את כל שאלות הכוכבים (1–5)')
          }
          answers.push({ questionId, stars })
        } else {
          let answerText = String(q?.answer ?? '').trim()
          if (!answerText) {
            throw new Error('יש למלא את כל שאלות הטקסט')
          }
          if (answerText.length > MAX_ANSWER_TEXT_LEN) {
            answerText = answerText.slice(0, MAX_ANSWER_TEXT_LEN)
          }
          answers.push({ questionId, answerText })
        }
      }

      if (!answers.length) {
        throw new Error('אין שאלות משוב לשליחה')
      }

      const response = await axios.post(userStore.apiUrl + 'event/SubmitGuestFeedback', {
        sharingCode: code,
        eventId: Number(eventId) || eventId,
        title,
        feedbackHeaderId,
        answers,
      })

      const data = response.data
      if (!data || typeof data !== 'object') {
        throw new Error('תשובה לא תקינה מהשרת')
      }
      if (data.success === false || data.Success === false) {
        const message =
          data.errorMessage ??
          data.ErrorMessage ??
          data.message ??
          data.Message ??
          'שליחת המשוב נכשלה'
        throw new Error(String(message))
      }
    },

    async loadBySharingCode(sharingCode) {
      const userStore = useUserStore()
      const code = String(sharingCode ?? '').trim()
      if (!code) {
        this.stopBroadcastPolling()
        this.error = 'חסר קוד שיתוף בקישור'
        this.sharingParams = null
        this._sharingParamsFingerprint = ''
        return
      }

      this.loading = true
      this.error = ''
      this.sharingCode = code
      this.broadcastModeJustChanged = false

      try {
        const response = await axios.post(userStore.apiUrl + 'event/FetchGuestEvent', {
          sharingCode: code,
        })
        const sharingParams = sharingParamsFromResponseData(response.data)
        this.applySharingParams(sharingParams)
        this.startBroadcastPolling()
      } catch (err) {
        this.stopBroadcastPolling()
        const resData = err?.response?.data ?? {}
        this.error = String(
          resData.message ?? resData.errorMessage ?? err?.message ?? 'לא ניתן לטעון את האירוע',
        ).trim()
        this.sharingParams = null
        this._sharingParamsFingerprint = ''
        this.broadcastMode = 'landing'
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.broadcastPollPauseCount = 0
      this.stopBroadcastPolling()
      this.loading = false
      this.error = ''
      this.sharingCode = ''
      this.sharingParams = null
      this.broadcastMode = 'landing'
      this.broadcastModeJustChanged = false
      this._sharingParamsFingerprint = ''
    },
  },
})
