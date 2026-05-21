import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './UserStore'
import {
  broadcastModeFromSharingParams,
  eventNameFromSharingParams,
  parseSharingParams,
  secondsToSleepFromSharingParams,
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
