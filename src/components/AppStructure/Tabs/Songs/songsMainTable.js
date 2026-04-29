import { computed, onMounted, reactive } from 'vue'

function looksLikeNumericId(value) {
  if (value == null || value === '') return false
  if (typeof value === 'number' && Number.isFinite(value)) return true
  const s = String(value).trim()
  return s !== '' && /^\d+$/.test(s)
}

function categoryNameForSong(song, catList) {
  const v = song?.category
  if (v == null || v === '') return ''
  if (looksLikeNumericId(v)) {
    const c = catList.find((x) => String(x?.id) === String(v).trim())
    return c?.name != null ? String(c.name).trim() : String(v)
  }
  return String(v).trim()
}

/** Song is tied to this category if `song.category` is its id or its name (same as list / save resolution). */
function songUsesCategory(song, category) {
  const idStr = category?.id != null ? String(category.id).trim() : ''
  const catName = category?.name != null ? String(category.name).trim() : ''
  const v = song?.category
  if (v == null || v === '') return false
  const s = String(v).trim()
  if (s === '') return false
  if (idStr !== '' && s === idStr) return true
  if (catName !== '' && s === catName) return true
  return false
}

function songsUsingCategory(userStore, category) {
  const songs = Array.isArray(userStore.songs) ? userStore.songs : []
  return songs.filter((song) => songUsesCategory(song, category))
}

function artistNameForSong(song, artList) {
  const v = song?.artist
  if (v == null || v === '') return ''
  if (looksLikeNumericId(v)) {
    const a = artList.find((x) => String(x?.id) === String(v).trim())
    return a?.name != null ? String(a.name).trim() : String(v)
  }
  return String(v).trim()
}

/** Song is tied to this artist if `song.artist` is its id or its name (same as list / save resolution). */
function songUsesArtist(song, artist) {
  const idStr = artist?.id != null ? String(artist.id).trim() : ''
  const artName = artist?.name != null ? String(artist.name).trim() : ''
  const v = song?.artist
  if (v == null || v === '') return false
  const s = String(v).trim()
  if (s === '') return false
  if (idStr !== '' && s === idStr) return true
  if (artName !== '' && s === artName) return true
  return false
}

function songsUsingArtist(userStore, artist) {
  const songs = Array.isArray(userStore.songs) ? userStore.songs : []
  return songs.filter((song) => songUsesArtist(song, artist))
}

/** External URL for the song name cell (supports common API casings). */
export function songListUrl(row) {
  if (!row || typeof row !== 'object') return ''
  const keys = ['url', 'Url', 'link', 'Link', 'songUrl', 'SongUrl']
  for (const k of keys) {
    if (!(k in row)) continue
    const v = row[k]
    if (v != null && String(v).trim() !== '') {
      return String(v).trim()
    }
  }
  return ''
}

/** Table row shape for songs (name, categoryName, artistName, linkUrl, plus raw song fields). */
export function songRowForTable(s, catList, artList) {
  const linkUrl = songListUrl(s)
  const row = Object.assign({}, s)
  row.categoryName = categoryNameForSong(s, catList)
  row.artistName = artistNameForSong(s, artList)
  row.linkUrl = linkUrl
  return row
}

function createSongTableItemsComputed(userStore, categories, artists) {
  return computed(() => {
    const catList = categories.value
    const artList = artists.value
    return userStore.songs.map((s) => songRowForTable(s, catList, artList))
  })
}

/** Table rows + initial fetch + `loadSongs` for refresh (keeps async logic out of the `.vue` script for tooling). */
export function useSongsMainList(userStore, categories, artists, songsLoading) {
  const songTableItems = createSongTableItemsComputed(userStore, categories, artists)

  async function loadSongs() {
    songsLoading.value = true
    try {
      await userStore.fetchSongs()
    } catch {
      // `fetchSongs` clears `userStore.songs` on failure
    } finally {
      songsLoading.value = false
    }
  }

  onMounted(() => {
    loadSongs()
  })

  return reactive({ songTableItems, loadSongs })
}

const SONGS_MAIN_TAB_TITLES = Object.freeze({
  songs: 'שירים',
  categories: 'קטגוריות',
  artists: 'אמנים',
})

/**
 * Header title for the active songs / categories / artists tab, with the current list size.
 * @param {import('vue').Ref<string>} activeTab
 * @param {ReturnType<import('@/stores/UserStore').useUserStore>} userStore
 */
export function useSongsMainActiveTitle(activeTab, userStore) {
  return computed(() => {
    const tab = activeTab.value
    const base = SONGS_MAIN_TAB_TITLES[tab] ?? 'שירים'
    let count = 0
    if (tab === 'songs') {
      count = Array.isArray(userStore.songs) ? userStore.songs.length : 0
    } else if (tab === 'categories') {
      count = Array.isArray(userStore.user?.categories) ? userStore.user.categories.length : 0
    } else if (tab === 'artists') {
      count = Array.isArray(userStore.user?.artists) ? userStore.user.artists.length : 0
    }
    return `${base} - ${count}`
  })
}

export function runDeleteCategoryConfirmed(userStore, category) {
  const using = songsUsingCategory(userStore, category)
  if (using.length > 0) {
    const n = using.length
    const songPhrase = n === 1 ? 'שיר אחד' : `${n} שירים`
    window.alert(`לא ניתן למחוק: הקטגוריה בשימוש ב־${songPhrase}.`)
    return
  }
  const name = category?.name ?? ''
  if (!window.confirm(`למחוק את הקטגוריה "${name}"?`)) {
    return
  }
  userStore.deleteCategory(category.id).catch(() => {
    // errors surfaced in store
  })
}

export function runDeleteArtistConfirmed(userStore, artist) {
  const using = songsUsingArtist(userStore, artist)
  if (using.length > 0) {
    const n = using.length
    const songPhrase = n === 1 ? 'שיר אחד' : `${n} שירים`
    window.alert(`לא ניתן למחוק: האמן בשימוש ב־${songPhrase}.`)
    return
  }
  const name = artist?.name ?? ''
  if (!window.confirm(`למחוק את האמן "${name}"?`)) {
    return
  }
  userStore.deleteArtist(artist.id).catch(() => {
    // errors surfaced in store
  })
}
