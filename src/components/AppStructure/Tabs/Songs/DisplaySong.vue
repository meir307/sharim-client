<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  linkUrl: { type: String, default: '' },
  songTitle: { type: String, default: '' },
  cords: { type: [Object, String], default: null },
})

const emit = defineEmits(['closed'])

function cordsTextFromSong(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string') {
    const t = raw.trim()
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
        return cordsTextFromSong(JSON.parse(t))
      } catch {
        return raw
      }
    }
    return raw
  }
  if (typeof raw === 'object' && raw !== null) {
    const direct =
      raw.cordsText ?? raw.CordsText ?? raw.cords_text ?? raw.Cords_Text
    if (direct != null) return String(direct)
    const inner = raw.cords ?? raw.Cords
    if (inner != null && inner !== raw) return cordsTextFromSong(inner)
    return JSON.stringify(raw)
  }
  return ''
}

const cordsDisplayText = computed(() => cordsTextFromSong(props.cords))
const showCordsPanel = computed(() => cordsDisplayText.value.trim() !== '')

const GOOGLE_EMBED = [
  [/\/document\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/document/d/${id}/preview`],
  [/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/spreadsheets/d/${id}/htmlview`],
  [/\/presentation\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/presentation/d/${id}/embed`],
]

function embedUrlForLinkPreview(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'docs.google.com') return s
    for (const [re, toUrl] of GOOGLE_EMBED) {
      const m = u.pathname.match(re)
      if (m) return toUrl(m[1])
    }
    return s
  } catch {
    return s
  }
}

const embedSrc = computed(() => embedUrlForLinkPreview(props.linkUrl))

const SCROLL_LINE_PX = 1
const SCROLL_INTERVAL_MS = 130

const iframeScrollerRef = ref(null)
let scrollTimer = null

function stopAutoScroll() {
  if (scrollTimer != null) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
}

function scrollWrapperOneLine() {
  const wrap = iframeScrollerRef.value
  if (!wrap) return
  const max = wrap.scrollHeight - wrap.clientHeight
  if (max <= 0) return
  let next = wrap.scrollTop + SCROLL_LINE_PX
  if (next >= max - 1) next = 0
  wrap.scrollTop = next
}

function startAutoScroll() {
  stopAutoScroll()
  scrollTimer = setInterval(scrollWrapperOneLine, SCROLL_INTERVAL_MS)
}

watch([open, embedSrc], async ([isOpen, src]) => {
  stopAutoScroll()
  if (!isOpen || !String(src ?? '').trim()) return
  await nextTick()
  const sc = iframeScrollerRef.value
  if (sc) sc.scrollTop = 0
  startAutoScroll()
})

onBeforeUnmount(stopAutoScroll)

function close() {
  open.value = false
}
</script>

<template>
  <v-dialog
    v-model="open"
    width="95vw"
    max-width="95vw"
    height="95vh"
    max-height="95vh"
    scrollable
    @after-leave="emit('closed')"
  >
    <v-card class="display-song__card" rounded="lg">
      <v-card-title class="popup-title display-song__head d-flex flex-wrap align-center gap-2">
        <span class="text-truncate flex-grow-1 min-w-0">{{ songTitle }}</span>
        <v-btn icon="mdi-close" variant="text" class="flex-shrink-0" aria-label="סגור" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text class="display-song__card-text pa-0">
        <div class="display-song__body" dir="ltr">
          <div v-if="showCordsPanel" class="display-song__cords-wrap">
            <pre class="display-song__cords-pre text-body-2" dir="rtl">{{ cordsDisplayText }}</pre>
          </div>
          <div class="display-song__shell">
            <div ref="iframeScrollerRef" class="display-song__iframe-scroller">
              <iframe
                v-if="open && linkUrl"
                :key="embedSrc"
                class="display-song__iframe"
                :src="embedSrc"
                :title="songTitle"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.display-song__card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 95vw;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.display-song__head {
  flex-shrink: 0;
  margin-bottom: 0;
  padding-inline: 12px 4px;
}

.display-song__card-text {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.display-song__body {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
  width: 100%;
  background: rgb(var(--v-theme-surface));
}

.display-song__cords-wrap {
  flex: 0 0 clamp(220px, 36vw, 420px);
  max-width: 45%;
  min-width: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.display-song__cords-pre {
  margin: 0;
  padding: 12px 16px;
  box-sizing: border-box;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: rgb(var(--v-theme-on-surface));
}

.display-song__shell {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.display-song__iframe-scroller {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.display-song__iframe {
  display: block;
  width: 100%;
  height: min(320vh, 9600px);
  min-height: min(180vh, 4800px);
  border: 0;
}

@media (max-width: 720px) {
  .display-song__body {
    flex-direction: column;
  }

  .display-song__cords-wrap {
    flex: 0 0 auto;
    max-width: 100%;
    max-height: min(32vh, 280px);
    border-inline-end: none;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .display-song__iframe {
    min-height: 360px;
  }
}
</style>
