<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  embedUrlForLinkPreview,
  fetchGoogleDocDisplayContent,
  googleDocsDocumentIdFromUrl,
} from '@/utils/googleDocLinkDisplay.js'

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
    <div ref="linkBodyScrollerRef" class="google-doc-link-pane__scroller">
      <div v-if="showPlainTextLoading" class="google-doc-link-pane__loading">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>
      <div
        v-else-if="linkPaneHtml"
        class="google-doc-link-pane__html-doc"
        dir="rtl"
        lang="he"
        v-html="linkPaneHtml"
      />
      <pre
        v-else-if="linkPanePlainText"
        class="google-doc-link-pane__plain-pre"
        dir="rtl"
        lang="he"
      >{{ linkPanePlainText }}</pre>
      <iframe
        v-else-if="showLinkIframe"
        :key="embedSrc"
        class="google-doc-link-pane__iframe google-doc-link-pane__iframe--dark"
        :src="embedSrc"
        :title="title"
        dir="rtl"
        lang="he"
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
  direction: rtl;
  container-type: inline-size;
  container-name: google-doc-link-pane-scroller;
  background: #111;
}

.google-doc-link-pane__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 24px;
  box-sizing: border-box;
  background: #111;
}

.google-doc-link-pane__plain-pre {
  margin: 0;
  padding: 12px 16px;
  min-height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 21px !important;
  line-height: 1.45;
  direction: rtl;
  text-align: right;
  unicode-bidi: plaintext;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  color: #e6e6e6;
  background-color: #1b1b1b;
}

.google-doc-link-pane__html-doc {
  margin: 12px 16px 16px;
  padding: 20px 24px 28px;
  min-height: calc(100% - 28px);
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  background-color: #1b1b1b;
  color: #e6e6e6;
  text-align: right !important;
  direction: rtl;
  unicode-bidi: plaintext;
  overflow-wrap: break-word;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.google-doc-link-pane__html-doc :deep(p),
.google-doc-link-pane__html-doc :deep(span),
.google-doc-link-pane__html-doc :deep(li),
.google-doc-link-pane__html-doc :deep(h1),
.google-doc-link-pane__html-doc :deep(h2),
.google-doc-link-pane__html-doc :deep(h3),
.google-doc-link-pane__html-doc :deep(h4),
.google-doc-link-pane__html-doc :deep(h5),
.google-doc-link-pane__html-doc :deep(h6),
.google-doc-link-pane__html-doc :deep(td),
.google-doc-link-pane__html-doc :deep(th),
.google-doc-link-pane__html-doc :deep(div) {
  text-align: right !important;
  direction: rtl;
  color: #e6e6e6 !important;
  background-color: transparent !important;
}

.google-doc-link-pane__html-doc :deep(a) {
  color: #90caf9 !important;
}

.google-doc-link-pane__html-doc :deep(hr) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.google-doc-link-pane__html-doc :deep(ul),
.google-doc-link-pane__html-doc :deep(ol) {
  padding-inline-start: 0;
  padding-inline-end: 24px;
  margin: 0.5em 0;
}

.google-doc-link-pane__html-doc :deep(img) {
  max-width: 100%;
  height: auto;
}

.google-doc-link-pane__iframe {
  display: block;
  width: 100%;
  height: min(320vh, 9600px);
  min-height: min(180vh, 4800px);
  border: 0;
}

@container google-doc-link-pane-scroller (max-width: 540px) {
  .google-doc-link-pane__iframe {
    min-width: 540px;
  }
}

.google-doc-link-pane__iframe--dark {
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.95);
  background: #111;
}
</style>
