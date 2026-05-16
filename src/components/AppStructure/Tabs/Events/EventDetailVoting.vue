<script setup>
const votingHeaders = [
  { title: '#', key: 'rank', sortable: false, width: 48, align: 'center' },
  { title: 'שם השיר', key: 'name', sortable: false },
  { title: 'אמן', key: 'artistName', sortable: false },
  { title: 'הצבעות', key: 'votes', sortable: false, width: 100, align: 'center' },
]

const demoVotingResults = [
  { id: 1, name: 'אור הירח', artistName: 'קיצבי', votes: 18 },
  { id: 2, name: 'מקום לדאגה', artistName: 'שקט', votes: 14 },
  { id: 3, name: 'dfvdfv', artistName: '—', votes: 8 },
  { id: 4, name: 'fgb', artistName: '—', votes: 2 },
]

const tableItems = demoVotingResults.map((s, i) => ({ ...s, rank: i + 1 }))

const totalVotes = demoVotingResults.reduce((s, r) => s + r.votes, 0)
</script>

<template>
  <div class="tiles-container tab-panel-wrap">
    <div class="tab-panel-inner">
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-body-2 text-medium-emphasis">
          סה"כ {{ totalVotes }} הצבעות
        </span>
        <v-btn variant="text" size="small" prepend-icon="mdi-refresh" color="primary">רענן</v-btn>
      </div>
      <div v-if="!demoVotingResults.length" class="text-body-2 text-medium-emphasis text-center pa-6">
        עדיין אין הצבעות.
      </div>
      <v-data-table
        v-else
        class="modern-table"
        :headers="votingHeaders"
        :items="tableItems"
        :items-per-page="-1"
        density="compact"
        hide-default-footer
      >
        <template #item.rank="{ item }">
          <span class="tabular-nums text-medium-emphasis">{{ item.rank }}</span>
        </template>
        <template #item.name="{ item }">
          <span class="font-weight-medium">{{ item.name }}</span>
        </template>
        <template #item.votes="{ item }">
          <v-chip size="small" color="info" variant="tonal" class="tabular-nums">
            {{ item.votes }}
          </v-chip>
        </template>
      </v-data-table>
    </div>
  </div>
</template>
