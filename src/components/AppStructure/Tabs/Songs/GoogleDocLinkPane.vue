<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  embedUrlForLinkPreview,
  fetchGoogleDocDisplayContent,
  googleDocsDocumentIdFromUrl,
} from '@/utils/googleDocLinkDisplay.js'
import { useLyricsDisplayDirection } from '@/composables/useLyricsDisplayDirection.js'

const props = defineProps({
  linkUrl: { type: String, default: '' },
  title: { type: String, default: 'מילות שיר' },
  /** When false, abort fetch and stop auto-scroll (e.g. dialog closed). */
  active: { type: Boolean, default: true },
  autoScroll: { type: Boolean, default: true },
  /** Fill parent flex column so the scroller overflows and auto-scroll can run. */
  fillHeight: { type: Boolean, default: false },
})

const displayLinkUrl = computed(() => String(props.linkUrl ?? '').trim())
const embedSrc = computed(() => embedUrlForLinkPreview(displayLinkUrl.value))

const remotePlainText = ref('')
const remoteDocHtml = ref('')
const remotePlainLoading = ref(false)
let remotePlainAbort = null

const linkPanePlainText = computed(() => remotePlainText.value)
const linkPaneHtml = computed(() => String(remoteDocHtml.value ?? '').trim())

const { lyricsDisplayDir, lyricsDisplayLang } = useLyricsDisplayDirection(
  linkPanePlainText,
  linkPaneHtml,
  () => props.title,
)

const showPlainTextLoading = computed(
  () =>
    props.active &&
    remotePlainLoading.value &&
    Boolean(googleDocsDocumentIdFromUrl(displayLinkUrl.value)),
)

const showLinkIframe = computed(
  () =>
    props.active &&
    Boolean(displayLinkUrl.value) &&
    Boolean(embedSrc.value) &&
    !linkPaneHtml.value &&
    !String(linkPanePlainText.value ?? '').trim() &&
    !remotePlainLoading.value,
)

async function tryLoadGoogleDocRemoteContent() {
  remotePlainAbort?.abort()
  remotePlainText.value = ''
  remoteDocHtml.value = ''
  remotePlainLoading.value = false

  if (!props.active || !displayLinkUrl.value) {
    remotePlainAbort = null
    return
  }
  if (!googleDocsDocumentIdFromUrl(displayLinkUrl.value)) {
    remotePlainAbort = null
    return
  }

  const ac = new AbortController()
  remotePlainAbort = ac
  remotePlainLoading.value = true

  try {
    const { html, plainText } = await fetchGoogleDocDisplayContent(displayLinkUrl.value, ac.signal)
    if (remotePlainAbort !== ac) return
    remoteDocHtml.value = html
    remotePlainText.value = plainText
  } catch (e) {
    if (e?.name !== 'AbortError') {
      remotePlainText.value = ''
      remoteDocHtml.value = ''
    }
  } finally {
    if (remotePlainAbort === ac) {
      remotePlainLoading.value = false
      remotePlainAbort = null
    }
  }
}

watch(
  () => [props.active, displayLinkUrl.value],
  () => {
    void tryLoadGoogleDocRemoteContent()
  },
  { immediate: true },
)

const SCROLL_LINE_PX = 1
const SCROLL_INTERVAL_MS = 130

const linkBodyScrollerRef = ref(null)
let scrollTimer = null

function stopAutoScroll() {
  if (scrollTimer != null) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
}

function scrollWrapperOneLine() {
  const wrap = linkBodyScrollerRef.value
  if (!wrap) return
  const max = Math.max(0, wrap.scrollHeight - wrap.clientHeight)
  if (max <= 0) return
  const cur = wrap.scrollTop
  if (cur >= max - SCROLL_LINE_PX) {
    wrap.scrollTop = max
    stopAutoScroll()
    return
  }
  wrap.scrollTop = Math.min(max, cur + SCROLL_LINE_PX)
}

function startAutoScroll() {
  if (!props.autoScroll) return
  stopAutoScroll()
  scrollTimer = setInterval(scrollWrapperOneLine, SCROLL_INTERVAL_MS)
}

watch(
  () => [
    props.active,
    embedSrc.value,
    linkPanePlainText.value,
    linkPaneHtml.value,
    displayLinkUrl.value,
    remotePlainLoading.value,
    lyricsDisplayDir.value,
  ],
  async ([isActive]) => {
    stopAutoScroll()
    if (!isActive || !props.autoScroll) return
    const hasPlain = Boolean(String(linkPanePlainText.value ?? '').trim())
    const hasHtml = Boolean(linkPaneHtml.value)
    const hasEmbed =
      Boolean(embedSrc.value) && Boolean(displayLinkUrl.value) && !remotePlainLoading.value
    if (!hasPlain && !hasHtml && !hasEmbed) return
    await nextTick()
    const sc = linkBodyScrollerRef.value
    if (sc) sc.scrollTop = 0
    startAutoScroll()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopAutoScroll()
  remotePlainAbort?.abort()
})
</script>

<template>
  <div class="google-doc-link-pane" :class="{ 'google-doc-link-pane--fill': fillHeight }">
    <div
      ref="linkBodyScrollerRef"
      class="google-doc-link-pane__scroller doc-link-scroller"
      :dir="lyricsDisplayDir"
    >
      <div v-if="showPlainTextLoading" class="doc-link-body-loading">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>
      <div
        v-else-if="linkPaneHtml"
        class="doc-link-html-doc"
        :dir="lyricsDisplayDir"
        :lang="lyricsDisplayLang"
        v-html="linkPaneHtml"
      />
      <pre
        v-else-if="linkPanePlainText"
        class="doc-link-plain-pre"
        :dir="lyricsDisplayDir"
        :lang="lyricsDisplayLang"
      >{{ linkPanePlainText }}</pre>
      <iframe
        v-else-if="showLinkIframe"
        :key="embedSrc"
        class="doc-link-iframe doc-link-iframe--dark"
        :src="embedSrc"
        :title="title"
        :dir="lyricsDisplayDir"
        :lang="lyricsDisplayLang"
        referrerpolicy="no-referrer-when-downgrade"
      />
    </div>
  </div>
</template>

<style scoped>
.google-doc-link-pane {
  background: #111;
  min-height: min(70dvh, 560px);
  margin: 0;
  padding: 0;
}

.google-doc-link-pane.google-doc-link-pane--fill {
  min-height: 0;
}

.google-doc-link-pane--fill {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.google-doc-link-pane--fill .google-doc-link-pane__scroller {
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
}

.google-doc-link-pane__scroller {
  min-height: min(70dvh, 560px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: #111;
}
</style>
