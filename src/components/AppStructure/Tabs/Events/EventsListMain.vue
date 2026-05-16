<script setup>
import { computed } from 'vue'
import { formatHebrewDate } from '@/utils/formatHebrewDate'

const emit = defineEmits(['edit-event', 'view-event'])

const events = defineModel({ type: Array, default: () => [] })

const headers = [
  { title: 'שם האירוע', key: 'name', sortable: true, minWidth: 160 },
  { title: 'שלב', key: 'phase', sortable: true, width: 56, align: 'center' },
  { title: 'תאריך', key: 'date', sortable: true, width: 140 },
  { title: 'פלייליסט', key: 'playlistName', sortable: true, minWidth: 120 },
  { title: 'הצבעות', key: 'totalVotes', sortable: true, width: 100, align: 'center' },
  { title: 'תגובות', key: 'totalFeedback', sortable: true, width: 100, align: 'center' },
  { title: '', key: 'actions', sortable: false, width: 120, align: 'center' },
]

const phaseLabels = {
  draft: 'טיוטה',
  voting: 'הצבעה פעילה',
  live: 'שידור חי',
  feedback: 'משוב',
  closed: 'הסתיים',
}

const phaseColors = {
  draft: 'grey',
  voting: 'info',
  live: 'success',
  feedback: 'warning',
  closed: 'default',
}

const phaseIcons = {
  draft: 'mdi-pencil-outline',
  voting: 'mdi-vote-outline',
  live: 'mdi-broadcast',
  feedback: 'mdi-comment-text-outline',
  closed: 'mdi-check-circle-outline',
}

const tableItems = computed(() =>
  events.value.map((ev) => ({
    ...ev,
    dateFormatted: formatHebrewDate(ev.date),
  })),
)

function onEdit(event) {
  emit('edit-event', event)
}

function onView(event) {
  emit('view-event', event)
}

function onDelete(event) {
  // placeholder
}

function rowFromItem(item) {
  if (!item || typeof item !== 'object') return null
  const { dateFormatted: _d, ...rest } = item
  return rest
}
</script>

<template>
  <div class="events-list">
    <v-card v-if="events.length" variant="outlined" class="events-list__table-card">
      <v-data-table
        class="modern-table events-list__table"
        :headers="headers"
        :items="tableItems"
        item-value="id"
        :items-per-page="-1"
        density="comfortable"
        hide-default-footer
      >
        <template #item.name="{ item }">
          <button
            type="button"
            class="events-list__name-btn text-primary font-weight-medium text-decoration-none text-start"
            @click="onView(rowFromItem(item))"
          >
            {{ item.name }}
          </button>
        </template>

        <template #item.phase="{ item }">
          <v-tooltip location="top" :text="phaseLabels[item.phase] || item.phase">
            <template #activator="{ props: tipProps }">
              <v-icon
                v-bind="tipProps"
                :icon="phaseIcons[item.phase] || 'mdi-help-circle-outline'"
                :color="phaseColors[item.phase] || 'grey'"
                size="22"
                class="events-list__phase-icon"
                aria-hidden="true"
              />
            </template>
          </v-tooltip>
        </template>

        <template #item.date="{ item }">
          <span class="text-body-2">{{ item.dateFormatted }}</span>
        </template>

        <template #item.playlistName="{ item }">
          <span class="text-body-2">{{ item.playlistName || '—' }}</span>
        </template>

        <template #item.totalVotes="{ item }">
          <span class="tabular-nums text-body-2">{{ item.totalVotes }}</span>
        </template>

        <template #item.totalFeedback="{ item }">
          <span class="tabular-nums text-body-2">{{ item.totalFeedback }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="events-list__actions d-inline-flex align-center justify-center flex-wrap ga-1">
           
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              density="comfortable"
              color="error"
              aria-label="מחק אירוע"
              @click="onDelete(rowFromItem(item))"
            />
          </div>
        </template>

        <template #no-data>
          <div class="text-body-2 text-medium-emphasis pa-6 text-center">
            אין אירועים. צור אירוע חדש מהכפתור למעלה.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <div v-else class="events-list__empty text-body-2 text-medium-emphasis pa-6 text-center">
      אין אירועים. צור אירוע חדש מהכפתור למעלה.
    </div>
  </div>
</template>

<style scoped>
.events-list__table-card {
  overflow: hidden;
}

.events-list__table {
  background: transparent;
}

.events-list__name-btn {
  display: inline;
  max-width: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  line-height: inherit;
}

.events-list__name-btn:hover {
  text-decoration: underline;
}

.events-list__phase-icon {
  cursor: default;
}

.events-list__actions {
  white-space: nowrap;
}
</style>
