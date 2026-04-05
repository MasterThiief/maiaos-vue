<template>
  <OsWindow id="chat" icon="💬" title="Chat da Live" :minW="260" :minH="300">
    <div class="chat-root">

      <!-- Lista de mensagens -->
      <div class="messages" ref="messagesEl">
        <div v-if="messages.length === 0" class="chat-empty">
          <span>💬</span>
          <span>Aguardando mensagens...</span>
        </div>

        <div v-for="msg in messages" :key="msg.id" class="msg-row">
          <!-- Avatar -->
          <img
            v-if="msg.avatarUrl"
            :src="msg.avatarUrl"
            class="msg-avatar"
            :alt="msg.username"
            loading="lazy"
          />
          <div v-else class="msg-avatar msg-avatar-fallback">
            {{ msg.username?.[0]?.toUpperCase() }}
          </div>

          <!-- Conteúdo -->
          <div class="msg-body">
            <div class="msg-meta">
              <!-- Badges -->
              <span v-if="msg.isMod" class="badge mod" title="Moderador">MOD</span>
              <span v-if="msg.isSub" class="badge sub" title="Inscrito">SUB</span>
              <!-- Nome colorido -->
              <span class="msg-user" :style="{ color: msg.color || '#c084fc' }">
                {{ msg.username }}
              </span>
            </div>
            <div class="msg-text">{{ msg.message }}</div>
          </div>
        </div>
      </div>

      <!-- Barra de envio — só para logados -->
      <div v-if="store.user" class="chat-input-bar">
        <img
          v-if="store.user.profileImage"
          :src="store.user.profileImage"
          class="input-avatar"
          :alt="store.user.displayName"
        />
        <input
          v-model="draft"
          class="chat-input"
          :placeholder="`Mensagem como ${store.user.displayName}…`"
          maxlength="500"
          :disabled="sending"
          @keydown.enter.prevent="sendMessage"
        />
        <button
          class="send-btn"
          :disabled="!draft.trim() || sending"
          @click="sendMessage"
        >
          {{ sending ? '…' : '▶' }}
        </button>
      </div>

      <div v-else class="chat-login-hint">
        Faça login com a Twitch para participar
      </div>

    </div>
  </OsWindow>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { io }            from 'socket.io-client'
import OsWindow          from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop'
import { SOCKET_URL, TWITCH_CHANNEL, TWITCH_CLIENT_ID } from '@/config'

const store      = useDesktopStore()
const messagesEl = ref(null)
const messages   = ref([])
const draft      = ref('')
const sending    = ref(false)
const broadcasterID = ref('')

const MAX_MESSAGES = 150
let socket = null

// ── Socket ──────────────────────────────────────────────────────────────────
function connect() {
  socket = io(SOCKET_URL, { transports: ['websocket'] })

  socket.on('chat-message', (data) => {
    messages.value.push({ ...data, _key: data.id || (Date.now() + Math.random()) })
    if (messages.value.length > MAX_MESSAGES) {
      messages.value.splice(0, messages.value.length - MAX_MESSAGES)
    }
    autoScroll()
  })
}

// ── Auto-scroll inteligente: só rola se o usuário já estava no fundo ─────────
async function autoScroll() {
  await nextTick()
  const el = messagesEl.value
  if (!el) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  if (nearBottom) el.scrollTop = el.scrollHeight
}

// ── Broadcaster ID (necessário para envio via API) ───────────────────────────
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

// ── Envio de mensagem via Twitch Helix ───────────────────────────────────────
async function sendMessage() {
  const text = draft.value.trim()
  if (!text || sending.value || !store.user?.token) return

  sending.value = true
  try {
    if (!broadcasterID.value) await fetchBroadcasterId()

    const res = await fetch('https://api.twitch.tv/helix/chat/messages', {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${store.user.token}`,
        'Client-Id':      TWITCH_CLIENT_ID,
        'Content-Type':   'application/json',
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

    draft.value = ''
  } catch {
    store.showToast('❌', 'Não foi possível enviar a mensagem')
  } finally {
    sending.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  connect()
  if (store.user?.token) fetchBroadcasterId()
})

onUnmounted(() => {
  socket?.disconnect()
  socket = null
})

watch(() => store.user, (u) => {
  if (u?.token) fetchBroadcasterId()
})
</script>

<style>
/* Não-scoped: precisa estilizar win-body para o chat preencher a janela */
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
}

/* ── Mensagens ── */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
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

/* ── Linha de mensagem ── */
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.1s;
}
.msg-row:hover { background: rgba(255,255,255,0.03); }

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 1px;
}
.msg-avatar-fallback {
  background: rgba(145,70,255,0.25);
  color: #c084fc;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-body  { flex: 1; min-width: 0; }
.msg-meta  { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; flex-wrap: wrap; }

.badge {
  font-size: 8.5px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  flex-shrink: 0;
}
.badge.mod { background: #4ade80; color: #000; }
.badge.sub { background: #ffb86c; color: #000; }

.msg-user {
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-text {
  font-size: 12px;
  color: #d4d4d4;
  line-height: 1.45;
  word-break: break-word;
}

/* ── Input ── */
.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid rgba(255,255,255,0.07);
  background: #111419;
  flex-shrink: 0;
}

.input-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  padding: 6px 8px;
  outline: none;
  min-width: 0;
  transition: border-color 0.15s;
}
.chat-input:focus   { border-color: rgba(145,70,255,0.5); }
.chat-input:disabled { opacity: 0.4; cursor: default; }

.send-btn {
  background: rgba(145,70,255,0.7);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  width: 30px;
  height: 30px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.send-btn:hover:not(:disabled) { background: rgba(145,70,255,1); }
.send-btn:disabled { opacity: 0.3; cursor: default; }

.chat-login-hint {
  padding: 10px;
  text-align: center;
  font-size: 11px;
  color: #444;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
</style>