import { computed, toValue } from 'vue'
import { lyricsDisplayAttrs, lyricsTextForDirection } from '@/utils/textDisplayDirection.js'

/**
 * Direction/lang from plain lyrics, HTML export, or title fallback (iframe loading).
 * @param {import('vue').MaybeRefOrGetter<string>} plainText
 * @param {import('vue').MaybeRefOrGetter<string>} htmlText
 * @param {import('vue').MaybeRefOrGetter<string>} fallbackTitle
 */
export function useLyricsDisplayDirection(plainText, htmlText, fallbackTitle) {
  const sampleText = computed(() =>
    lyricsTextForDirection({
      plainText: toValue(plainText),
      htmlText: toValue(htmlText),
      fallbackTitle: toValue(fallbackTitle),
    }),
  )

  const lyricsDisplayDir = computed(() => lyricsDisplayAttrs(sampleText.value).dir)
  const lyricsDisplayLang = computed(() => lyricsDisplayAttrs(sampleText.value).lang)

  return { lyricsDisplayDir, lyricsDisplayLang, sampleText }
}

/**
 * Direction/lang from a single text source (e.g. chords panel).
 * @param {import('vue').MaybeRefOrGetter<string>} textSource
 */
export function useTextDisplayDirection(textSource) {
  const lyricsDisplayDir = computed(() => lyricsDisplayAttrs(toValue(textSource)).dir)
  const lyricsDisplayLang = computed(() => lyricsDisplayAttrs(toValue(textSource)).lang)
  return { lyricsDisplayDir, lyricsDisplayLang }
}
