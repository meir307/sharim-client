import { defineStore } from 'pinia'
import axios from 'axios'
import { useLoaderStore } from './LoaderStore'

/** Next 1-based sequential id from existing `{ id }` rows (numeric only). */
function nextSequentialId(items) {
  const list = Array.isArray(items) ? items : []
  const nums = list
    .map((c) => Number(c?.id))
    .filter((n) => Number.isInteger(n) && n >= 1)
  if (nums.length === 0) return 1
  return Math.max(...nums) + 1
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
      }
      return user
    })(),
    error: null,
    /** Songs from `song/fetchSongs` — not persisted to localStorage */
    songs: [],
  }),

  getters: {
    apiUrl1: (state) => state.apiUrl,
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
