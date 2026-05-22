<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useEventStore } from '@/stores/eventStore'

const props = defineProps({
  event: { type: Object, default: null },
  selectedSessionId: { type: Number, default: null },
})

const emit = defineEmits([
  'update:selectedSessionId',
  'update:playlistItems',
  'update:totalVotes',
  'update:loading',
])

const eventStore = useEventStore()

/** Column layout aligned with Settings → Playlists → שירים בפלייליסט (`PlaylistsMain`). */
const votingHeaders = [
  { title: '#', key: 'rank', sortable: false, width: 64, align: 'center', minWidth: 64 },
  { title: 'שם השיר', key: 'name', sortable: false, minWidth: 120 },
  { title: 'אמן', key: 'artistName', sortable: false, minWidth: 100 },
  { title: 'הצבעות', key: 'votes', sortable: false, width: 100, align: 'center', minWidth: 80 },
]

const loading = ref(false)
/** @type {import('vue').Ref<Array<{ id: number, playlistName: string, totalVotes: number, lines: Array<{ songId: number, songName: string, artist: string, votes: number }> }>>} */
const votingSessions = ref([])
/** @type {import('vue').Ref<Array<{ id: string | number, name: string, artistName: string, votes: number }>>} */
const results = ref([])
const totalBallots = ref(0)

const playlistSelectItems = computed(() =>
  votingSessions.value.map((s) => ({
    title: s.playlistName || `סבב #${s.id}`,
    value: s.id,
  })),
)

const tableItems = computed(() =>
  results.value.map((s, i) => ({ ...s, rank: i + 1 })),
)

const hasResults = computed(() => tableItems.value.length > 0)

const eventId = computed(() => {
  const id = props.event?.id ?? props.event?.Id
  if (id == null || String(id).trim() === '') return null
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : null
})

const activeSession = computed(() => {
  const id = props.selectedSessionId
  if (id != null) {
    const found = votingSessions.value.find((s) => s.id === id)
    if (found) return found
  }
  return votingSessions.value[0] ?? null
})

function syncPlaylistItemsToParent() {
  emit('update:playlistItems', playlistSelectItems.value)
}

function ensureSelectedSession() {
  const sessions = votingSessions.value
  if (!sessions.length) {
    if (props.selectedSessionId != null) emit('update:selectedSessionId', null)
    return
  }
  const currentValid =
    props.selectedSessionId != null &&
    sessions.some((s) => s.id === props.selectedSessionId)
  if (!currentValid) {
    emit('update:selectedSessionId', sessions[0].id)
  }
}

function applySessionToTable(session) {
  if (!session) {
    results.value = []
    totalBallots.value = 0
    emit('update:totalVotes', 0)
    return
  }
  totalBallots.value = session.totalVotes
  emit('update:totalVotes', totalBallots.value)
  results.value = session.lines.map((line) => ({
    id: line.songId,
    name: line.songName,
    artistName: line.artist || '—',
    votes: line.votes,
  }))
}

watch(loading, (v) => emit('update:loading', v), { immediate: true })

watch(playlistSelectItems, syncPlaylistItemsToParent, { immediate: true })

watch(
  () => [props.selectedSessionId, votingSessions.value],
  () => {
    applySessionToTable(activeSession.value)
  },
  { immediate: true, deep: true },
)

async function loadVotingResults() {
  if (eventId.value == null) return
  loading.value = true
  try {
    const sessions = await eventStore.fetchVotingResults(eventId.value)
    votingSessions.value = sessions
    ensureSelectedSession()
    syncPlaylistItemsToParent()
    applySessionToTable(activeSession.value)
  } catch (err) {
    votingSessions.value = []
    emit('update:selectedSessionId', null)
    syncPlaylistItemsToParent()
    applySessionToTable(null)
    const message = String(err?.message ?? 'טעינת תוצאות ההצבעה נכשלה').trim()
    if (message) alert(message)
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadVotingResults()
}

defineExpose({ refresh })

onMounted(() => {
  loadVotingResults()
})
</script>

<template>
  <div class="tiles-container tab-panel-wrap tab-panel-wrap--fill event-detail-voting">
    <div class="tab-panel-inner tab-panel-inner--fill event-detail-voting__inner">
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3 flex-shrink-0" />

      <div
        v-else-if="!hasResults"
        class="text-body-2 text-medium-emphasis text-center pa-6 flex-shrink-0"
      >
        עדיין אין הצבעות.
      </div>

      <div v-else class="event-detail-voting__table-scroll">
        <v-card variant="outlined" class="event-detail-voting__table-card">
          <v-data-table
            class="event-detail-voting__songs-table"
            :headers="votingHeaders"
            :items="tableItems"
            :items-per-page="-1"
            item-value="id"
            density="compact"
            hide-default-footer
            fixed-header
          >
            <template #item.rank="{ item }">
              <span class="tabular-nums text-medium-emphasis">{{ item.rank }}</span>
            </template>
            <template #item.name="{ item }">
              <span class="font-weight-medium">{{ item.name }}</span>
            </template>
            <template #item.artistName="{ item }">
              <span class="text-body-2">{{ item.artistName || '—' }}</span>
            </template>
            <template #item.votes="{ item }">
              <span class="text-body-2 tabular-nums">{{ item.votes }}</span>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Parent `.tab-panel-wrap--fill` already adds padding; avoid double inset from `.tiles-container`. */
.event-detail-voting.tiles-container {
  padding: 0;
  gap: 0;
}

.event-detail-voting {
  min-height: 0;
}

.event-detail-voting__inner {
  gap: 0;
  box-sizing: border-box;
}

.event-detail-voting__table-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: 2px;
  padding-bottom: 6px;
}

/* Match `playlists-main__songs-table-card` / `playlists-main__songs-table` */
.event-detail-voting__table-card {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.event-detail-voting__songs-table {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.event-detail-voting__table-card :deep(.v-data-table) {
  height: 100%;
}

.event-detail-voting__table-card :deep(.v-table__wrapper) {
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
</style>
