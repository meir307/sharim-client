import { defineStore } from 'pinia'
import axios from 'axios'
import { useLoaderStore } from './LoaderStore'
import { nextLandingPageId } from '@/components/AppStructure/Tabs/Settings/landingPageModel.js'

/**
 * Ensure `user.playLists` is a mutable array (parse JSON string from API / DB).
 * Ensures `user.emitCode` is a string and `user.sharingActive` is a boolean (guest sharing on/off).
 * @param {Record<string, unknown>} user
 */
export function normalizeUserPlaylistsAndEmitCode(user) {
  if (!user || typeof user !== 'object') return
  let pl = user.playLists ?? user.playlists ?? user.PlayLists
  if (typeof pl === 'string') {
    try {
      const parsed = JSON.parse(pl)
      pl = Array.isArray(parsed) ? parsed : []
    } catch {
      pl = []
    }
  }
  user.playLists = Array.isArray(pl) ? pl : []
  user.emitCode = user.emitCode == null ? '' : String(user.emitCode)
  const sa = user.sharingActive
  user.sharingActive =
    sa === true || sa === 1 || String(sa).toLowerCase() === 'true'
}

/**
 * Ensure `user.feedbackQuestions` is a mutable array (parse JSON string from API / DB).
 * @param {Record<string, unknown>} user
 */
export function normalizeUserFeedbackQuestions(user) {
  if (!user || typeof user !== 'object') return
  let fq = user.feedbackQuestions ?? user.FeedbackQuestions
  if (typeof fq === 'string') {
    try {
      const parsed = JSON.parse(fq)
      fq = Array.isArray(parsed) ? parsed : []
    } catch {
      fq = []
    }
  }
  user.feedbackQuestions = Array.isArray(fq) ? fq : []
}

/**
 * Ensure `user.landingPages` is a mutable array (parse JSON string from API / DB).
 * @param {Record<string, unknown>} user
 */
export function normalizeUserLandingPages(user) {
  if (!user || typeof user !== 'object') return
  let lp = user.landingPages ?? user.LandingPages
  if (typeof lp === 'string') {
    try {
      const parsed = JSON.parse(lp)
      lp = Array.isArray(parsed) ? parsed : []
    } catch {
      lp = []
    }
  }
  user.landingPages = Array.isArray(lp) ? lp : []
}

/** Run all user JSON-field normalizers after login or profile saves. */
export function normalizeUserProfileFields(user) {
  normalizeUserPlaylistsAndEmitCode(user)
  normalizeUserFeedbackQuestions(user)
  normalizeUserLandingPages(user)
}

/**
 * @param {unknown[]} questions
 * @returns {Array<{ id: number|string, text: string, type: 'stars'|'text' }>}
 */
function normalizeFeedbackQuestionsForStorage(questions) {
  if (!Array.isArray(questions)) return []
  return questions
    .map((q, index) => {
      if (!q || typeof q !== 'object') return null
      const text = String(q.text ?? q.Text ?? '').trim()
      if (!text) return null
      const type =
        String(q.type ?? q.Type ?? 'stars').toLowerCase() === 'text' ? 'text' : 'stars'
      let id = q.id ?? q.Id
      if (id == null || String(id).trim() === '') {
        id = index + 1
      }
      const idStr = String(id).trim()
      return {
        id: /^\d+$/.test(idStr) ? Number(idStr) : id,
        text,
        type,
      }
    })
    .filter(Boolean)
}

/**
 * @param {unknown[]} pages
 * @returns {Array<Record<string, unknown>>}
 */
function normalizeLandingPagesForStorage(pages) {
  if (!Array.isArray(pages)) return []
  return pages
    .map((p, index) => {
      if (!p || typeof p !== 'object') return null
      const name = String(p.name ?? p.Name ?? '').trim()
      const title = String(p.title ?? p.Title ?? '').trim()
      if (!name || !title) return null
      let id = p.id ?? p.Id
      if (id == null || String(id).trim() === '') {
        id = index + 1
      }
      const idStr = String(id).trim()
      return {
        id: /^\d+$/.test(idStr) ? Number(idStr) : id,
        name,
        title,
        body: String(p.body ?? p.Body ?? '').trim(),
        icon: String(p.icon ?? p.Icon ?? 'mdi-clock-outline').trim() || 'mdi-clock-outline',
        showSpinner: Boolean(p.showSpinner ?? p.ShowSpinner),
      }
    })
    .filter(Boolean)
}

/**
 * Persist playlist `songs` as compact refs: `{ id }` when possible, else `{ name, url }`.
 * @param {unknown[]} songs
 * @returns {Array<Record<string, unknown>>}
 */
function normalizePlaylistSongsForStorage(songs) {
  if (!Array.isArray(songs)) return []
  return songs
    .map((s) => {
      if (!s || typeof s !== 'object') return null
      const id = s.id ?? s.Id
      if (id != null && String(id).trim() !== '') {
        const sn = String(id).trim()
        return Number.isFinite(Number(sn)) && /^\d+$/.test(sn) ? { id: Number(sn) } : { id: sn }
      }
      const o = {}
      const name = s.name ?? s.Name
      const url = s.url ?? s.Url ?? s.link ?? s.Link
      if (name != null && String(name).trim() !== '') o.name = String(name).trim()
      if (url != null && String(url).trim() !== '') o.url = String(url).trim()
      return Object.keys(o).length ? o : null
    })
    .filter(Boolean)
}

/** Next 1-based sequential id from existing `{ id }` rows (numeric only). */
function nextSequentialId(items) {
  const list = Array.isArray(items) ? items : []
  const nums = list
    .map((c) => Number(c?.id))
    .filter((n) => Number.isInteger(n) && n >= 1)
  if (nums.length === 0) return 1
  return Math.max(...nums) + 1
}

/** New playlist id: max numeric id + 1, or a string id if none are numeric. */
function nextPlaylistId(prev) {
  const list = Array.isArray(prev) ? prev : []
  const nums = list
    .map((p) => Number(p?.id ?? p?.Id))
    .filter((n) => Number.isInteger(n) && n >= 1)
  if (nums.length > 0) return Math.max(...nums) + 1
  return `pl_${Date.now()}`
}

export const useUserStore = defineStore('UserStore', {
  state: () => ({
    apiUrl: import.meta.env.VITE_APP_API_ADDRESS ?? import.meta.env.VITE_API_ADDRESS ?? '',
    loaderStore: useLoaderStore(),
    user: (() => {
      const stored = localStorage.getItem('user')
      if (!stored || stored === 'undefined') return {}
      const user = JSON.parse(stored)
      if (user && typeof user === 'object') {
        if (!Array.isArray(user.categories)) user.categories = []
        if (!Array.isArray(user.artists)) user.artists = []
        normalizeUserProfileFields(user)
      }
      return user
    })(),
    error: null,
    /** Songs from `song/fetchSongs` — not persisted to localStorage */
    songs: [],
  }),

  getters: {
    apiUrl1: (state) => state.apiUrl,
    /** Local-only: host marked guest lyrics sharing as active (no server round-trip). */
    sharingActive: (state) =>
      Boolean(state.user && typeof state.user === 'object' && state.user.sharingActive === true),
  },

  actions: {
    async login(credentials) {
      this.preAction()
      try {
        const response = await axios.post(this.apiUrl + 'user/login', credentials)
        this.user = response.data.user
        if (!Array.isArray(this.user.categories)) {
          this.user.categories = []
        }
        if (!Array.isArray(this.user.artists)) {
          this.user.artists = []
        }
        normalizeUserProfileFields(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        this.songs = []
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    async register(userData) {
      this.preAction()
      try {
        const response = await axios.post(this.apiUrl + 'user/register', userData)
        this.user = response.data.user
        if (!Array.isArray(this.user.categories)) {
          this.user.categories = []
        }
        if (!Array.isArray(this.user.artists)) {
          this.user.artists = []
        }
        normalizeUserProfileFields(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        this.songs = []
        alert('הרשמה בוצעה בהצלחה.')
        console.log(response)
        return response
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed'
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * POST full category list to `user/SaveCategories` and merge response into `user` + localStorage.
     * @param {Array<{ id: number|string, name: string }>} next
     */
    async _saveCategoriesList(next) {
      this.preAction()
      try {
        const response = await axios.post(
          this.apiUrl + 'user/SaveCategories',
          { categories: next },
          {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          },
        )

        const resUser = response.data?.user
        const resCategories = response.data?.categories
        if (resUser && typeof resUser === 'object') {
          this.user = {
            ...this.user,
            ...resUser,
            categories: Array.isArray(resCategories)
              ? resCategories
              : Array.isArray(resUser.categories)
                ? resUser.categories
                : next,
          }
        } else if (Array.isArray(resCategories)) {
          this.user = { ...this.user, categories: resCategories }
        } else {
          this.user = { ...this.user, categories: next }
        }

        if (!Array.isArray(this.user.categories)) {
          this.user.categories = []
        }

        normalizeUserProfileFields(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * Add or update a category, POST full list to `user/SaveCategories`, then sync `user` + localStorage.
     * @param {{ id?: number|string|null, name: string }} payload
     * @returns {Promise<{ id: number|string, name: string } | null>}
     */
    async upsertCategory(payload) {
      const trimmed = String(payload?.name ?? '').trim()
      if (!trimmed) {
        return null
      }

      const prev = Array.isArray(this.user.categories) ? [...this.user.categories] : []
      let saved
      const next = [...prev]

      if (payload.id != null && payload.id !== '') {
        const idx = next.findIndex((c) => String(c.id) === String(payload.id))
        saved = { id: payload.id, name: trimmed }
        if (idx >= 0) {
          next[idx] = saved
        } else {
          next.push(saved)
        }
      } else {
        const newId = nextSequentialId(prev)
        saved = { id: newId, name: trimmed }
        next.push(saved)
      }

      await this._saveCategoriesList(next)
      const merged = this.user.categories
      return merged.find((c) => String(c.id) === String(saved.id)) ?? saved
    },

    /**
     * Remove a category by id and sync the remaining list to the server.
     * @param {number|string} categoryId
     * @returns {Promise<boolean>} true if a row was removed
     */
    async deleteCategory(categoryId) {
      const prev = Array.isArray(this.user.categories) ? [...this.user.categories] : []
      const next = prev.filter((c) => String(c.id) !== String(categoryId))
      if (next.length === prev.length) {
        return false
      }
      await this._saveCategoriesList(next)
      return true
    },

    /**
     * POST full artist list to `user/SaveArtists` and merge response into `user` + localStorage.
     * @param {Array<{ id: number|string, name: string }>} next
     */
    async _saveArtistsList(next) {
      this.preAction()
      try {
        const response = await axios.post(
          this.apiUrl + 'user/SaveArtists',
          { artists: next },
          {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          },
        )

        const resUser = response.data?.user
        const resArtists = response.data?.artists
        if (resUser && typeof resUser === 'object') {
          this.user = {
            ...this.user,
            ...resUser,
            artists: Array.isArray(resArtists)
              ? resArtists
              : Array.isArray(resUser.artists)
                ? resUser.artists
                : next,
          }
        } else if (Array.isArray(resArtists)) {
          this.user = { ...this.user, artists: resArtists }
        } else {
          this.user = { ...this.user, artists: next }
        }

        if (!Array.isArray(this.user.artists)) {
          this.user.artists = []
        }

        normalizeUserProfileFields(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * Add or update an artist, POST full list to `user/SaveArtists`, then sync `user` + localStorage.
     * @param {{ id?: number|string|null, name: string }} payload
     * @returns {Promise<{ id: number|string, name: string } | null>}
     */
    async upsertArtist(payload) {
      const trimmed = String(payload?.name ?? '').trim()
      if (!trimmed) {
        return null
      }

      const prev = Array.isArray(this.user.artists) ? [...this.user.artists] : []
      let saved
      const next = [...prev]

      if (payload.id != null && payload.id !== '') {
        const idx = next.findIndex((a) => String(a.id) === String(payload.id))
        saved = { id: payload.id, name: trimmed }
        if (idx >= 0) {
          next[idx] = saved
        } else {
          next.push(saved)
        }
      } else {
        const newId = nextSequentialId(prev)
        saved = { id: newId, name: trimmed }
        next.push(saved)
      }

      await this._saveArtistsList(next)
      const merged = this.user.artists
      return merged.find((a) => String(a.id) === String(saved.id)) ?? saved
    },

    /**
     * Remove an artist by id and sync the remaining list to the server.
     * @param {number|string} artistId
     * @returns {Promise<boolean>}
     */
    async deleteArtist(artistId) {
      const prev = Array.isArray(this.user.artists) ? [...this.user.artists] : []
      const next = prev.filter((a) => String(a.id) !== String(artistId))
      if (next.length === prev.length) {
        return false
      }
      await this._saveArtistsList(next)
      return true
    },

    /**
     * POST full playlists array to `user/SavePlaylists` and merge response into `user` + localStorage.
     * @param {Array<Record<string, unknown>>} next
     */
    async _savePlaylistsList(next) {
      this.preAction()
      try {
        const response = await axios.post(
          this.apiUrl + 'user/SavePlaylists',
          { playLists: next },
          {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          },
        )

        const d = response.data ?? {}
        const failed = d.success === false || d.Success === false
        if (failed) {
          const message = d.errorMessage || 'שמירת הפלייליסטים נכשלה'
          alert(message)
          this.error = message
          throw new Error(message)
        }

        // API does not return updated lists — keep the payload we posted.
        this.user = { ...this.user, playLists: Array.isArray(next) ? [...next] : [] }

        normalizeUserProfileFields(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * Add or update a playlist (name + ordered songs), POST full list, then sync `user` + localStorage.
     * @param {{ id?: number|string|null, name: string, songs: unknown[] }} payload
     * @returns {Promise<Record<string, unknown> | null>}
     */
    async upsertPlaylist(payload) {
      const trimmed = String(payload?.name ?? '').trim()
      if (!trimmed) {
        return null
      }

      const prev = Array.isArray(this.user.playLists) ? [...this.user.playLists] : []
      const storedSongs = normalizePlaylistSongsForStorage(payload?.songs)
      const next = [...prev]
      const pid = payload?.id ?? payload?.Id
      let targetId

      if (pid != null && String(pid).trim() !== '') {
        const idStr = String(pid).trim()
        const idx = next.findIndex((p) => String(p?.id ?? p?.Id) === idStr)
        const row = { id: /^\d+$/.test(idStr) ? Number(idStr) : pid, name: trimmed, songs: storedSongs }
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...row }
        } else {
          next.push(row)
        }
        targetId = idStr
      } else {
        const newId = nextPlaylistId(prev)
        targetId = String(newId)
        next.push({ id: newId, name: trimmed, songs: storedSongs })
      }

      await this._savePlaylistsList(next)
      const merged = Array.isArray(this.user.playLists) ? this.user.playLists : []
      return merged.find((p) => String(p?.id ?? p?.Id) === targetId) ?? null
    },

    /**
     * Remove a playlist by index and POST the remaining list to `user/SavePlaylists`.
     * @param {number} index
     * @returns {Promise<boolean>} true if a row was removed
     */
    async deletePlaylistAt(index) {
      const prev = Array.isArray(this.user.playLists) ? [...this.user.playLists] : []
      if (typeof index !== 'number' || index < 0 || index >= prev.length) {
        return false
      }
      const next = prev.filter((_, i) => i !== index)
      await this._savePlaylistsList(next)
      return true
    },

    /**
     * POST feedback questions JSON to `user/SaveFeedbackQuestions` and update `user.feedbackQuestions`.
     * @param {Array<Record<string, unknown>>} next
     */
    async _saveFeedbackQuestionsList(next) {
      this.preAction()
      try {
        const response = await axios.post(
          this.apiUrl + 'user/SaveFeedbackQuestions',
          { FeedbackQuestions: next },
          {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          },
        )

        const d = response.data ?? {}
        const failed = d.success === false || d.Success === false
        if (failed) {
          const message = d.errorMessage || 'שמירת שאלות המשוב נכשלה'
          alert(message)
          this.error = message
          throw new Error(message)
        }

        this.user = {
          ...this.user,
          feedbackQuestions: Array.isArray(next) ? [...next] : [],
        }

        normalizeUserFeedbackQuestions(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * Save the full feedback-questions list on the user profile.
     * @param {unknown[]} questions
     * @returns {Promise<Array<{ id: number|string, text: string, type: 'stars'|'text' }>>}
     */
    async saveFeedbackQuestions(questions) {
      const next = normalizeFeedbackQuestionsForStorage(questions)
      await this._saveFeedbackQuestionsList(next)
      return Array.isArray(this.user.feedbackQuestions) ? [...this.user.feedbackQuestions] : []
    },

    /**
     * POST landing pages JSON to `user/SaveLandingPages` and update `user.landingPages`.
     * @param {Array<Record<string, unknown>>} next
     */
    async _saveLandingPagesList(next) {
      this.preAction()
      try {
        const response = await axios.post(
          this.apiUrl + 'user/SaveLandingPages',
          { LandingPages: next },
          {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          },
        )

        const d = response.data ?? {}
        const failed = d.success === false || d.Success === false
        if (failed) {
          const message = d.errorMessage || 'שמירת דפי הנחיתה נכשלה'
          alert(message)
          this.error = message
          throw new Error(message)
        }

        this.user = {
          ...this.user,
          landingPages: Array.isArray(next) ? [...next] : [],
        }

        normalizeUserLandingPages(this.user)
        localStorage.setItem('user', JSON.stringify(this.user))
        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * Save the full landing-pages list on the user profile.
     * @param {unknown[]} pages
     */
    async saveLandingPages(pages) {
      const next = normalizeLandingPagesForStorage(pages)
      await this._saveLandingPagesList(next)
      return Array.isArray(this.user.landingPages) ? [...this.user.landingPages] : []
    },

    /**
     * Add or update a landing page, POST full list, then sync `user` + localStorage.
     * @param {Record<string, unknown>} payload
     * @returns {Promise<Record<string, unknown> | null>}
     */
    async upsertLandingPage(payload) {
      if (!payload || typeof payload !== 'object') return null

      const name = String(payload.name ?? payload.Name ?? '').trim()
      const title = String(payload.title ?? payload.Title ?? '').trim()
      if (!name) {
        alert('יש להזין שם תבנית')
        return null
      }
      if (!title) {
        alert('יש להזין כותרת לאורח')
        return null
      }

      const prev = Array.isArray(this.user.landingPages) ? [...this.user.landingPages] : []
      const next = [...prev]
      const pid = payload.id ?? payload.Id
      const row = {
        name,
        title,
        body: String(payload.body ?? payload.Body ?? '').trim(),
        icon: String(payload.icon ?? payload.Icon ?? 'mdi-clock-outline').trim() || 'mdi-clock-outline',
        showSpinner: Boolean(payload.showSpinner ?? payload.ShowSpinner),
      }

      let targetId
      if (pid != null && String(pid).trim() !== '') {
        const idStr = String(pid).trim()
        const idx = next.findIndex((p) => String(p?.id ?? p?.Id) === idStr)
        const id = /^\d+$/.test(idStr) ? Number(idStr) : pid
        const merged = { ...row, id }
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...merged }
        } else {
          next.push(merged)
        }
        targetId = idStr
      } else {
        const newId = nextLandingPageId(next)
        targetId = String(newId)
        next.push({ ...row, id: newId })
      }

      const stored = normalizeLandingPagesForStorage(next)
      await this._saveLandingPagesList(stored)
      const merged = Array.isArray(this.user.landingPages) ? this.user.landingPages : []
      return merged.find((p) => String(p?.id ?? p?.Id) === targetId) ?? null
    },

    /**
     * Remove a landing page by index and POST the remaining list.
     * @param {number} index
     * @returns {Promise<boolean>}
     */
    async deleteLandingPageAt(index) {
      const prev = Array.isArray(this.user.landingPages) ? [...this.user.landingPages] : []
      if (typeof index !== 'number' || index < 0 || index >= prev.length) {
        return false
      }
      const next = prev.filter((_, i) => i !== index)
      await this._saveLandingPagesList(normalizeLandingPagesForStorage(next))
      return true
    },

    /**
     * Load all songs for the current session.
     * @returns {Promise<Array>}
     */
    async fetchSongs() {
      this.preAction()
      try {
        const response = await axios.post(
          this.apiUrl + 'song/fetchSongs',
          {},
          {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          },
        )
        const raw = response.data?.songs ?? response.data?.data ?? response.data
        const list = Array.isArray(raw) ? raw : []
        this.songs = list
        return list
      } catch (error) {
        this.songs = []
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    /**
     * Upsert a song. When `songData.__cordsFileUpload` is a `File`, sends `multipart/form-data`:
     * - `song`: JSON string of the song (same shape as the JSON body without the upload key)
     * - `cordsFile`: the binary file part
     * Otherwise sends a normal JSON body. Strip `__cordsFileUpload` before serializing.
     */
    async upsertSong(songData) {
      this.preAction()
      try {
        const file = songData?.__cordsFileUpload
        const { __cordsFileUpload: _omit, ...songWithoutUpload } = songData || {}
        const cords =
          typeof songWithoutUpload.cords === 'string'
            ? JSON.parse(songWithoutUpload.cords)
            : songWithoutUpload.cords
        const body = { ...songWithoutUpload, cords }

        if (file instanceof File) {
          const formData = new FormData()
          formData.append('song', JSON.stringify(body))
          formData.append('cordsFile', file, file.name)

          const response = await axios.post(this.apiUrl + 'song/upsert', formData, {
            headers: {
              sessionId: this.user.sessionId || '',
            },
          })
          return response
        }

        const response = await axios.post(this.apiUrl + 'song/upsert', body, {
          headers: {
            sessionId: this.user.sessionId || '',
          },
        })

        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    logout() {
      this.user = {}
      this.songs = []
      localStorage.removeItem('user')
    },

    preAction() {
      this.loaderStore.show()
    },

    postAction() {
      this.loaderStore.hide()
    },
  },
})
