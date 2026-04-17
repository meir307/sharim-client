import { defineStore } from 'pinia'
import axios from 'axios'
import { useLoaderStore } from './LoaderStore'

/** Next 1-based sequential id from existing category ids (numeric only). */
function nextCategorySequentialId(categories) {
  const list = Array.isArray(categories) ? categories : []
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
      if (user && typeof user === 'object' && !Array.isArray(user.categories)) {
        user.categories = []
      }
      return user
    })(),
    error: null,
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
        localStorage.setItem('user', JSON.stringify(this.user))
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
        localStorage.setItem('user', JSON.stringify(this.user))
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
        const newId = nextCategorySequentialId(prev)
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

    async upsertSong(songData) {
      this.preAction()
      try {
        const payload = {
          ...songData,
          cords: typeof songData.cords === 'string' ? JSON.parse(songData.cords) : songData.cords,
        }

        const response = await axios.post(this.apiUrl + 'song/upsert', payload, {
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
