<template>
  <OsWindow id="chat" icon="💬" title="Chat da Live">
    <template #toolbar>
      <button class="win-toolbar-btn" :class="{ active: aba === 'maia' }"   @click="aba = 'maia'">💬 MaiaChat</button>
      <button class="win-toolbar-btn" :class="{ active: aba === 'twitch' }" @click="aba = 'twitch'">🟣 TwitchChat</button>
    </template>

    <!-- ── MaiaChat ── -->
    <div v-if="aba === 'maia'" class="chat-root">

      <div class="messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="chat-empty">
          <span>💬</span>
          <span>Aguardando mensagens...</span>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="msg._key"
          class="msg-row"
          :class="{
            mention:  isMention(msg.message),
            own:      isOwn(msg.username),
            grouped:  isGrouped(idx),
            [ownPosition(idx)]: isOwn(msg.username),
          }"
        >
          <template v-if="!isGrouped(idx)">
            <img v-if="msg.avatarUrl" :src="msg.avatarUrl" class="msg-avatar" :alt="msg.username" loading="lazy" />
            <div v-else class="msg-avatar msg-avatar-fallback">{{ msg.username?.[0]?.toUpperCase() }}</div>
          </template>
          <div v-else class="msg-avatar-spacer" />

          <div class="msg-body">
            <div v-if="!isGrouped(idx)" class="msg-meta">
              <span v-if="msg.isMod" class="badge mod">MOD</span>
              <span v-if="msg.isSub" class="badge sub">SUB</span>
              <span class="msg-user" :style="{ color: msg.color || '#c084fc' }">{{ msg.username }}</span>
            </div>
            <div class="msg-text">
              <template v-for="(part, i) in parseMessage(msg.message, msg.emotes)" :key="i">
                <img v-if="part.type === 'emote'" :src="part.url" :alt="part.text" class="chat-emote" loading="lazy" />
                <span v-else-if="part.type === 'mention'" class="msg-mention" @click="insertMention(part.text)">{{ part.text }}</span>
                <span v-else>{{ part.text }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Emote Preview — speech bubble sem texto -->
      <div v-if="emotePreview" class="emote-preview" @mousedown.prevent="applyEmotePreview">
        <img :src="emotePreview.url" :alt="emotePreview.name" class="emote-preview-img" />
      </div>

      <!-- Autocomplete menções -->
      <div v-if="mentionSuggestions.length" class="mention-suggestions">
        <div
          v-for="(s, i) in mentionSuggestions"
          :key="s"
          class="mention-suggestion"
          :class="{ active: i === mentionIndex }"
          @mousedown.prevent="applyMention(s)"
        >
          @{{ s }}
        </div>
      </div>

      <!-- Input -->
      <div v-if="store.user" class="chat-input-bar">
        <img v-if="store.user.profileImage" :src="store.user.profileImage" class="input-avatar" :alt="store.user.displayName" />
        <!-- ✅ contenteditable em vez de input — permite renderizar emotes inline -->
        <div
          ref="inputEl"
          class="chat-input"
          :contenteditable="sending ? 'false' : 'true'"
          :data-placeholder="`Mensagem como ${store.user.displayName}…`"
          @keydown="onKeydown"
          @input="onInput"
          @paste="onPaste"
        ></div>
        <EmotePicker :emote-map="twitchEmoteMap" @select="onEmoteSelect" />
        <button class="send-btn" :disabled="!draft.trim() || sending" @click="sendMessage">
          {{ sending ? '…' : '▶' }}
        </button>
      </div>
      <div v-else class="chat-login-hint">Faça login com a Twitch para participar</div>

    </div>

    <!-- ── TwitchChat ── -->
    <div v-else class="twitch-chat-wrap">
      <div v-if="isBroadcaster" class="broadcaster-hint">
        ⚠️ O chat embed tem limitações para o broadcaster. Use o chat nativo da Twitch.
        <a :href="`https://www.twitch.tv/popout/${TWITCH_CHANNEL}/chat?darkpopout`" target="_blank" rel="noopener" class="hint-link">Abrir em nova aba ↗</a>
      </div>
      <iframe :src="twitchChatUrl" class="twitch-frame" frameborder="0" scrolling="yes" allowtransparency="true" sandbox="allow-scripts allow-same-origin allow-popups" />
    </div>

  </OsWindow>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { io }              from 'socket.io-client'
import OsWindow            from './OsWindow.vue'
import EmotePicker         from './EmotePicker.vue'
import { useDesktopStore } from '@/stores/desktop'
import { SOCKET_URL, TWITCH_CHANNEL, TWITCH_CLIENT_ID } from '@/config'

const store      = useDesktopStore()
const aba        = ref('maia')
const messagesEl = ref(null)
const inputEl    = ref(null)   // agora aponta pro div contenteditable
const messages   = ref([])
const draft      = ref('')     // usado só pro estado do botão enviar
const sending    = ref(false)
const broadcasterID  = ref('')
const seenUsers      = ref(new Set())
const twitchEmoteMap = ref({})
const emotePreview   = ref(null)

const MAX_MESSAGES  = 150
const GROUP_TIMEOUT = 2 * 60 * 1000
let socket = null

// ── TwitchChat ───────────────────────────────────────────────────────────────
const parent        = window.location.hostname || 'localhost'
const twitchChatUrl = computed(() =>
  `https://www.twitch.tv/embed/${TWITCH_CHANNEL}/chat?parent=${parent}&darkpopout`
)
const isBroadcaster = computed(() =>
  store.user?.login?.toLowerCase() === TWITCH_CHANNEL.toLowerCase()
)

// ── Helpers ──────────────────────────────────────────────────────────────────
function isOwn(username) {
  return store.user?.login?.toLowerCase() === username?.toLowerCase()
}
function isGroupBreak(idx) {
  if (idx === 0) return true
  const curr = messages.value[idx]
  const prev = messages.value[idx - 1]
  return curr.username !== prev.username || (curr._ts - prev._ts) >= GROUP_TIMEOUT
}
function isGrouped(idx) {
  if (idx === 0) return false
  const curr = messages.value[idx]
  const prev = messages.value[idx - 1]
  if (curr.username !== prev.username) return false
  return (curr._ts - prev._ts) < GROUP_TIMEOUT
}
function ownPosition(idx) {
  const curr = messages.value[idx]
  if (!isOwn(curr.username)) return ''
  const prevOwn = idx > 0 && isOwn(messages.value[idx - 1].username) && !isGroupBreak(idx)
  const nextOwn = idx < messages.value.length - 1 && isOwn(messages.value[idx + 1].username) && !isGroupBreak(idx + 1)
  if (!prevOwn && !nextOwn) return 'own-only'
  if (!prevOwn && nextOwn)  return 'own-first'
  if (prevOwn && nextOwn)   return ''
  return 'own-last'
}

// ── Parser (mensagens recebidas) ──────────────────────────────────────────────
function parseMessage(text, emotes) {
  if (!text) return [{ type: 'text', text: '' }]
  const emoteMap = {}
  if (emotes && typeof emotes === 'object') {
    for (const [emoteId, positions] of Object.entries(emotes)) {
      for (const pos of positions) {
        let start, end
        if (Array.isArray(pos)) { [start, end] = pos }
        else if (typeof pos === 'string') { [start, end] = pos.split('-').map(Number) }
        if (start !== undefined) emoteMap[start] = { end, emoteId }
      }
    }
  }
  const parts = []
  let i = 0
  while (i < text.length) {
    if (emoteMap[i]) {
      const { end, emoteId } = emoteMap[i]
      parts.push({ type: 'emote', text: text.slice(i, end + 1), url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0` })
      i = end + 1
    } else {
      let j = i + 1
      while (j < text.length && !emoteMap[j]) j++
      const chunk = text.slice(i, j)
      const mentionRegex = /(@\w+)/g
      let last = 0, match
      while ((match = mentionRegex.exec(chunk)) !== null) {
        if (match.index > last) parts.push({ type: 'text', text: chunk.slice(last, match.index) })
        parts.push({ type: 'mention', text: match[1] })
        last = match.index + match[1].length
      }
      if (last < chunk.length) parts.push({ type: 'text', text: chunk.slice(last) })
      i = j
    }
  }
  return parts.length ? parts : [{ type: 'text', text }]
}

function isMention(text) {
  if (!store.user?.login || !text) return false
  return text.toLowerCase().includes(`@${store.user.login.toLowerCase()}`)
}

// ── Conteúdo do contenteditable ───────────────────────────────────────────────
// Converte o innerHTML (com <img> de emotes) em texto puro pra envio
function getMessageText() {
  if (!inputEl.value) return ''
  let text = ''
  inputEl.value.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent
    } else if (node.nodeName === 'IMG') {
      // emote: usa o alt (nome do emote) com espaço
      const alt = node.getAttribute('alt') || ''
      text += text.endsWith(' ') ? alt + ' ' : ' ' + alt + ' '
    }
  })
  return text.trim()
}

// Sincroniza draft ref (usado só pro :disabled do botão)
function syncDraft() {
  draft.value = inputEl.value?.innerText?.trim() || ''
}

// Limpa o contenteditable após envio
function clearInput() {
  if (inputEl.value) inputEl.value.innerHTML = ''
  draft.value = ''
  emotePreview.value = null
}

// ── Emotes do viewer ──────────────────────────────────────────────────────────
async function fetchUserEmotes() {
  if (!store.user?.token || !store.user?.id) return
  try {
    const resUser = await fetch(
      `https://api.twitch.tv/helix/chat/emotes/user?user_id=${store.user.id}`,
      { headers: { 'Authorization': `Bearer ${store.user.token}`, 'Client-Id': TWITCH_CLIENT_ID }}
    )
    const dataUser = await resUser.json()

    const resGlobal = await fetch(
      `https://api.twitch.tv/helix/chat/emotes/global`,
      { headers: { 'Authorization': `Bearer ${store.user.token}`, 'Client-Id': TWITCH_CLIENT_ID }}
    )
    const dataGlobal = await resGlobal.json()

    const resChan = await fetch(
      `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${broadcasterID.value}`,
      { headers: { 'Authorization': `Bearer ${store.user.token}`, 'Client-Id': TWITCH_CLIENT_ID }}
    )
    const dataChan = await resChan.json()

    const chanEmotes = store.user.id === broadcasterID.value
      ? (dataChan.data ?? [])
      : (dataChan.data ?? []).filter(e => e.emote_type === 'follower')

    const map = {}
    for (const e of [...(dataGlobal.data ?? []), ...(dataUser.data ?? []), ...chanEmotes]) {
      const hasAnimated = Array.isArray(e.format) ? e.format.includes('animated') : false
      const format = hasAnimated ? 'animated' : 'static'
      map[e.name] = `https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/${format}/dark/2.0`
    }
    twitchEmoteMap.value = map
  } catch (e) {
    console.error('[Emotes] erro:', e.message)
  }
}

// ── Emote Preview — detecta palavra e auto-seleciona ─────────────────────────
function checkEmotePreview() {
  const sel = window.getSelection()
  if (!sel?.rangeCount) { emotePreview.value = null; return }
  const range = sel.getRangeAt(0)
  const node  = range.startContainer
  if (node.nodeType !== Node.TEXT_NODE) { emotePreview.value = null; return }

  const offset = range.startOffset
  const before = node.textContent.slice(0, offset)
  const wordMatch = before.match(/(\S+)$/)
  if (!wordMatch || wordMatch[1].length < 2) { emotePreview.value = null; return }

  const word = wordMatch[1]
  const url  = twitchEmoteMap.value[word]
  if (url) {
    emotePreview.value = { name: word, url }
    // Auto-seleciona a palavra
    const wordStart = offset - word.length
    const selectRange = document.createRange()
    selectRange.setStart(node, wordStart)
    selectRange.setEnd(node, offset)
    sel.removeAllRanges()
    sel.addRange(selectRange)
  } else {
    emotePreview.value = null
  }
}

// ✅ Substitui a palavra selecionada por uma <img> do emote
function applyEmotePreview() {
  if (!emotePreview.value) return

  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  const range = sel.getRangeAt(0)

  // Apaga a palavra selecionada
  range.deleteContents()

  // Insere a imagem do emote
  const img = document.createElement('img')
  img.src       = emotePreview.value.url
  img.alt       = emotePreview.value.name
  img.className = 'input-emote'
  img.setAttribute('draggable', 'false')
  range.insertNode(img)

  // Move cursor para depois da imagem + espaço
  const space = document.createTextNode('\u00A0') // non-breaking space
  img.after(space)
  const newRange = document.createRange()
  newRange.setStartAfter(space)
  newRange.collapse(true)
  sel.removeAllRanges()
  sel.addRange(newRange)

  emotePreview.value = null
  syncDraft()
  inputEl.value?.focus()
}

// Handler do EmotePicker — insere emote na posição do cursor
function onEmoteSelect(emoteName) {
  const url = twitchEmoteMap.value[emoteName]
  if (!url || !inputEl.value) return

  inputEl.value.focus()

  const img = document.createElement('img')
  img.src       = url
  img.alt       = emoteName
  img.className = 'input-emote'
  img.setAttribute('draggable', 'false')

  const sel = window.getSelection()
  const space = document.createTextNode('\u00A0')

  if (sel?.rangeCount && inputEl.value.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(space)
    range.insertNode(img)
  } else {
    inputEl.value.appendChild(img)
    inputEl.value.appendChild(space)
  }

  // Move cursor pra depois do espaço
  const newRange = document.createRange()
  newRange.setStartAfter(space)
  newRange.collapse(true)
  sel?.removeAllRanges()
  sel?.addRange(newRange)

  syncDraft()
}

// ── Autocomplete menções ──────────────────────────────────────────────────────
const mentionSuggestions = ref([])
const mentionIndex       = ref(0)

function onInput() {
  syncDraft()
  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  const range = sel.getRangeAt(0)
  const node  = range.startContainer
  if (node.nodeType !== Node.TEXT_NODE) {
    mentionSuggestions.value = []
    emotePreview.value = null
    return
  }
  const offset = range.startOffset
  const before = node.textContent.slice(0, offset)

  const mentionMatch = before.match(/@(\w*)$/)
  if (mentionMatch) {
    const query = mentionMatch[1].toLowerCase()
    mentionSuggestions.value = [...seenUsers.value].filter(u => u.toLowerCase().startsWith(query)).slice(0, 5)
    mentionIndex.value = 0
    emotePreview.value = null
    return
  }
  mentionSuggestions.value = []
  checkEmotePreview()
}

function applyMention(username) {
  if (!inputEl.value) return
  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  const range = sel.getRangeAt(0)
  const node  = range.startContainer
  if (node.nodeType !== Node.TEXT_NODE) return

  const offset  = range.startOffset
  const before  = node.textContent.slice(0, offset)
  const after   = node.textContent.slice(offset)
  const replaced = before.replace(/@\w*$/, `@${username} `)
  node.textContent = replaced + after

  const newRange = document.createRange()
  newRange.setStart(node, replaced.length)
  newRange.collapse(true)
  sel.removeAllRanges()
  sel.addRange(newRange)

  mentionSuggestions.value = []
  syncDraft()
}

function insertMention(text) {
  if (!inputEl.value) return
  inputEl.value.focus()
  const name    = text.replace('@', '')
  const mention = `@${name} `
  document.execCommand('insertText', false, mention)
  syncDraft()
}

// Impede colar HTML — aceita só texto puro
function onPaste(e) {
  e.preventDefault()
  const text = e.clipboardData.getData('text/plain')
  document.execCommand('insertText', false, text)
  syncDraft()
}

function onKeydown(e) {
  if (emotePreview.value) {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      applyEmotePreview()
      return
    }
    if (e.key === 'Escape') { emotePreview.value = null; return }
  }
  if (mentionSuggestions.value.length) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); mentionIndex.value = (mentionIndex.value + 1) % mentionSuggestions.value.length; return }
    if (e.key === 'ArrowUp')    { e.preventDefault(); mentionIndex.value = (mentionIndex.value - 1 + mentionSuggestions.value.length) % mentionSuggestions.value.length; return }
    if (e.key === 'Tab' || (e.key === 'Enter' && mentionSuggestions.value.length)) { e.preventDefault(); applyMention(mentionSuggestions.value[mentionIndex.value]); return }
    if (e.key === 'Escape') { mentionSuggestions.value = []; return }
  }
  if (e.key === 'Enter') { e.preventDefault(); sendMessage() }
}

// ── Socket ───────────────────────────────────────────────────────────────────
function connect() {
  socket = io(SOCKET_URL, { transports: ['websocket'] })

  socket.on('chat-message', (data) => {
    let avatarUrl = data.avatarUrl
    if (!avatarUrl && store.user?.login?.toLowerCase() === data.username?.toLowerCase()) {
      avatarUrl = store.user.profileImage
    }
    messages.value.push({
      ...data,
      avatarUrl,
      _key: data.id || (Date.now() + Math.random()),
      _ts:  Date.now(),
    })
    if (messages.value.length > MAX_MESSAGES) {
      messages.value.splice(0, messages.value.length - MAX_MESSAGES)
    }
    if (data.username) seenUsers.value.add(data.username)
    autoScroll()
  })
}

async function autoScroll() {
  await nextTick()
  const el = messagesEl.value
  if (!el) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  if (nearBottom) el.scrollTop = el.scrollHeight
}

// ── Broadcaster ID ───────────────────────────────────────────────────────────
async function fetchBroadcasterId() {
  if (broadcasterID.value || !store.user?.token) return
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/users?login=${TWITCH_CHANNEL}`,
      { headers: { 'Authorization': `Bearer ${store.user.token}`, 'Client-Id': TWITCH_CLIENT_ID } }
    )
    const data = await res.json()
    broadcasterID.value = data.data?.[0]?.id ?? ''
  } catch { /* silencioso */ }
}

// ── Envio ────────────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = getMessageText()
  if (!text || sending.value || !store.user?.token) return
  sending.value = true
  try {
    if (!broadcasterID.value) await fetchBroadcasterId()
    const res = await fetch('https://api.twitch.tv/helix/chat/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${store.user.token}`,
        'Client-Id':     TWITCH_CLIENT_ID,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        broadcaster_id: broadcasterID.value,
        sender_id:      store.user.id,
        message:        text,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      store.showToast('❌', err.message || 'Erro ao enviar mensagem')
      return
    }
    clearInput()
  } catch {
    store.showToast('❌', 'Não foi possível enviar a mensagem')
  } finally {
    sending.value = false
    nextTick(() => inputEl.value?.focus())
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  connect()
  if (store.user?.token) {
    await fetchBroadcasterId()
    fetchUserEmotes()
  }
})
onUnmounted(() => {
  socket?.disconnect()
  socket = null
})
watch(() => store.user, async (u) => {
  if (u?.token) {
    await fetchBroadcasterId()
    fetchUserEmotes()
  }
})
</script>

<style>
#win-chat .win-body {
  padding: 0 !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
</style>

<style scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0c0f14;
  position: relative;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  scroll-behavior: smooth;
}
.messages::-webkit-scrollbar       { width: 4px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #444;
  font-size: 12px;
}
.chat-empty span:first-child { font-size: 28px; }

.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 3px 6px;
  border-radius: 6px;
  transition: background 0.1s;
  margin-bottom: 2px;
}
.msg-row:hover { background: rgba(255,255,255,0.03); }
.msg-row.grouped { padding-top: 1px; padding-bottom: 1px; margin-bottom: 0; }

.msg-row.mention {
  background: rgba(145,70,255,0.12);
  border-left: 2px solid #9146ff;
  padding-left: 4px;
}
.msg-row.mention:hover { background: rgba(145,70,255,0.18); }

.msg-row.own {
  background: rgba(145,70,255,0.06);
  border-left: 2px solid rgba(145,70,255,0.4);
  padding-left: 4px;
  border-radius: 0;
  margin-bottom: 0;
}
.msg-row.own:hover { background: rgba(145,70,255,0.1); }
.msg-row.own-only  { border-radius: 6px; margin-top: 2px; margin-bottom: 2px; }
.msg-row.own-first { border-radius: 6px 6px 0 0; margin-top: 2px; }
.msg-row.own-last  { border-radius: 0 0 6px 6px; margin-bottom: 2px; }

.msg-avatar {
  width: 28px; height: 28px;
  border-radius: 50%; object-fit: cover;
  flex-shrink: 0; margin-top: 1px;
}
.msg-avatar-fallback {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(145,70,255,0.25);
  color: #c084fc; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.msg-avatar-spacer { width: 28px; flex-shrink: 0; }

.msg-body  { flex: 1; min-width: 0; }
.msg-meta  { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; flex-wrap: wrap; }

.badge { font-size: 8.5px; font-weight: 800; padding: 1px 4px; border-radius: 3px; flex-shrink: 0; }
.badge.mod { background: #4ade80; color: #000; }
.badge.sub { background: #ffb86c; color: #000; }

.msg-user {
  font-size: 11.5px; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.msg-text {
  font-size: 12px; color: #d4d4d4;
  line-height: 1.45; word-break: break-word;
  display: flex; flex-wrap: wrap; align-items: center; gap: 2px;
}
.chat-emote {
  width: 24px; height: 24px;
  object-fit: contain; vertical-align: middle; display: inline-block;
}
.msg-mention {
  color: #9146ff; font-weight: 700; cursor: pointer;
  border-radius: 3px; padding: 0 2px; transition: background 0.1s;
}
.msg-mention:hover { background: rgba(145,70,255,0.2); }

/* ── Emote Preview — speech bubble ── */
.emote-preview {
  position: absolute;
  bottom: 52px; left: 8px;
  background: #1a1d26;
  border: 1px solid rgba(145,70,255,0.4);
  border-radius: 8px;
  padding: 6px;
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.5);
  cursor: pointer;
}
.emote-preview::after {
  content: '';
  position: absolute;
  bottom: -7px; left: 14px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 7px solid rgba(145,70,255,0.4);
}
.emote-preview::before {
  content: '';
  position: absolute;
  bottom: -5px; left: 14px;
  z-index: 1;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1a1d26;
}
.emote-preview:hover { background: rgba(145,70,255,0.15); }
.emote-preview-img   { width: 40px; height: 40px; object-fit: contain; }

/* ── Autocomplete ── */
.mention-suggestions {
  position: absolute;
  bottom: 48px; left: 8px; right: 8px;
  background: #1a1d26;
  border: 1px solid rgba(145,70,255,0.3);
  border-radius: 6px; overflow: hidden;
  z-index: 10;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.4);
}
.mention-suggestion {
  padding: 7px 12px; font-size: 12px; color: #ccc;
  cursor: pointer; transition: background 0.1s;
}
.mention-suggestion:hover,
.mention-suggestion.active { background: rgba(145,70,255,0.2); color: #fff; }

/* ── Input contenteditable ── */
.chat-input-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px;
  border-top: 1px solid rgba(255,255,255,0.07);
  background: #111419; flex-shrink: 0;
}
.input-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.chat-input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px; color: #fff;
  font-size: 12px; padding: 6px 8px;
  outline: none; min-width: 0;
  min-height: 30px; max-height: 80px;
  overflow-y: auto;
  line-height: 1.5;
  word-break: break-word;
  display: flex; align-items: center; flex-wrap: wrap;
  transition: border-color 0.15s;
  cursor: text;
}
.chat-input:focus { border-color: rgba(145,70,255,0.5); }
/* Placeholder via CSS */
.chat-input:empty::before {
  content: attr(data-placeholder);
  color: rgba(255,255,255,0.25);
  pointer-events: none;
  font-size: 12px;
}
/* ✅ Emote inline no input */
:deep(.input-emote) {
  width: 22px; height: 22px;
  object-fit: contain;
  vertical-align: middle;
  display: inline-block;
  margin: 0 1px;
  user-select: none;
}

.send-btn {
  background: rgba(145,70,255,0.7); border: none;
  border-radius: 4px; color: #fff;
  font-size: 12px; font-weight: 700;
  width: 30px; height: 30px; cursor: pointer;
  flex-shrink: 0; display: flex;
  align-items: center; justify-content: center;
  transition: background 0.15s;
}
.send-btn:hover:not(:disabled) { background: rgba(145,70,255,1); }
.send-btn:disabled { opacity: 0.3; cursor: default; }

.chat-login-hint {
  padding: 10px; text-align: center;
  font-size: 11px; color: #444;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

/* ── TwitchChat ── */
.twitch-chat-wrap { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.broadcaster-hint {
  padding: 8px 12px; font-size: 10.5px; color: #888;
  background: rgba(255,140,0,0.07);
  border-bottom: 1px solid rgba(255,140,0,0.15);
  display: flex; align-items: center;
  justify-content: space-between; gap: 8px; flex-shrink: 0;
}
.hint-link { color: #9146ff; text-decoration: none; font-weight: 700; white-space: nowrap; }
.hint-link:hover { text-decoration: underline; }
.twitch-frame { flex: 1; width: 100%; border: none; display: block; min-height: 0; }
.win-toolbar-btn.active { background: rgba(145,70,255,0.2); color: #c084fc; border-color: #9146ff; }
</style>