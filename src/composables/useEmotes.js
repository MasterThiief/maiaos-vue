// composables/useEmotes.js
import { ref } from 'vue'
import { useAPI } from './useAPI'

const emotes = ref([])
const emoteMap = ref({}) // { 'LUL': 'https://...' } para renderizar no chat
const loaded = ref(false)

export function useEmotes() {
  const { get } = useAPI()

  async function loadEmotes(broadcasterId) {
    if (loaded.value) return

    try {
      const [global, channel] = await Promise.all([
        get('/helix/chat/emotes/global'),
        get(`/helix/chat/emotes?broadcaster_id=${broadcasterId}`)
      ])

      const all = [...(global.data || []), ...(channel.data || [])]

      emotes.value = all
      emoteMap.value = Object.fromEntries(
        all.map(e => [e.name, e.images?.url_2x || e.images?.url_1x])
      )
      loaded.value = true
    } catch (err) {
      console.error('Erro ao carregar emotes:', err)
    }
  }

  // Substitui nomes de emote no texto por <img> — resolve o bug de exibição
  function parseEmotesInText(text) {
    if (!text) return text
    return text.split(' ').map(word => {
      const url = emoteMap.value[word]
      return url
        ? `<img src="${url}" alt="${word}" title="${word}" class="chat-emote" />`
        : word
    }).join(' ')
  }

  return { emotes, emoteMap, loaded, loadEmotes, parseEmotesInText }
}