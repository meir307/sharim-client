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

function artistNameForSong(song, artList) {
  const v = song?.artist
  if (v == null || v === '') return ''
  if (looksLikeNumericId(v)) {
    const a = artList.find((x) => String(x?.id) === String(v).trim())
    return a?.name != null ? String(a.name).trim() : String(v)
  }
  return String(v).trim()
}

/** External URL for the song name cell (supports common API casings). */
function songListUrl(row) {
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

function songRowForTable(s, catList, artList) {
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

/** Header title for the active songs / categories / artists tab. */
export function useSongsMainActiveTitle(activeTab) {
  return computed(() => SONGS_MAIN_TAB_TITLES[activeTab.value] ?? 'שירים')
}

export function runDeleteCategoryConfirmed(userStore, category) {
  const name = category?.name ?? ''
  if (!window.confirm(`למחוק את הקטגוריה "${name}"?`)) {
    return
  }
  userStore.deleteCategory(category.id).catch(() => {
    // errors surfaced in store
  })
}

export function runDeleteArtistConfirmed(userStore, artist) {
  const name = artist?.name ?? ''
  if (!window.confirm(`למחוק את האמן "${name}"?`)) {
    return
  }
  userStore.deleteArtist(artist.id).catch(() => {
    // errors surfaced in store
  })
}
