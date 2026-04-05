<!-- WinEmojis.vue -->
<template>
  <OsWindow id="emojis" icon="🎭" title="Emojis & Efeitos da Live">
    <template #toolbar>
      <button class="win-toolbar-btn" :class="{ active: filter === 'all' }"  @click="setFilter('all')">Todos</button>
      <button class="win-toolbar-btn" :class="{ active: filter === 'free' }" @click="setFilter('free')">Grátis</button>
      <button class="win-toolbar-btn" :class="{ active: filter === 'sub' }"  @click="setFilter('sub')">Sub Only</button>
    </template>

    <div v-if="loading" class="emoji-status">Carregando emotes...</div>
    <div v-else-if="error" class="emoji-status error">{{ error }}</div>

    <template v-else>
      <div class="emoji-grid">
        <div
          v-for="item in paginated"
          :key="item.trigger"
          class="emoji-item"
          :class="{ locked: isLocked(item) }"
          @click="handleClick(item)"
        >
          <!-- [NOVO] Overlay de cadeado para sub-only quando usuário não é inscrito -->
          <div v-if="isLocked(item)" class="lock-overlay">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Sub only</span>
          </div>

          <div class="e-wrap">
            <img v-if="item.imgUrl" :src="item.imgUrl" :alt="item.trigger"
                 class="e-img" loading="lazy" />
            <span v-else class="e-fallback">🎭</span>
          </div>
          <div class="trigger">{{ item.trigger }}</div>
          <div class="badges">
            <span v-if="item.subscriberOnly"          class="badge sub">SUB</span>
            <span v-if="item.floatEffect?.enabled"    class="badge float">FLOAT</span>
            <span v-if="item.confettiEffect?.enabled" class="badge confetti">🎊</span>
          </div>
          <div class="meta">
            <span class="cost">⚡ 5 Tokoins</span>
            <span class="uses">{{ item.timesUsed ?? 0 }}×</span>
          </div>
          <div class="limit-info" v-if="item.limitNonSub !== -1 || item.limitSub !== -1">
            <span v-if="item.limitNonSub !== -1">Geral: {{ item.limitNonSub }}×</span>
            <span v-if="item.limitSub !== -1">Sub: {{ item.limitSub }}×</span>
          </div>
        </div>

        <div
          v-for="n in emptySlots"
          :key="'empty-' + n"
          class="emoji-item ghost"
        ></div>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page === 1" @click="page--">◀</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">▶</button>
      </div>
    </template>
  </OsWindow>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import OsWindow            from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop' // [NOVO]
import { API_URL }         from '../../config.js'

const PAGE_SIZE = 9

const store   = useDesktopStore() // [NOVO]
const loading = ref(true)
const error   = ref('')
const emojis  = ref([])
const filter  = ref('all')
const page    = ref(1)

// [NOVO] Usuário é inscrito?
const isSub = computed(() => store.user?.isSubscriber ?? false)

// [NOVO] Item bloqueado = sub-only E usuário não é inscrito
function isLocked(item) {
  return item.subscriberOnly && !isSub.value
}

function handleClick(item) {
  if (isLocked(item)) {
    store.showToast('🔒', 'Este emote é exclusivo para Inscritos! ⭐')
    return
  }
  navigator.clipboard.writeText(item.trigger)
    .then(() => store.showToast('📋', `"${item.trigger}" copiado! Cole no chat da live.`))
    .catch(() => store.showToast('⚠️', 'Não foi possível copiar. Tente manualmente.'))
}

const filtered = computed(() => {
  if (filter.value === 'free') return emojis.value.filter(e => !e.subscriberOnly)
  if (filter.value === 'sub')  return emojis.value.filter(e =>  e.subscriberOnly)
  return emojis.value
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const emptySlots = computed(() => {
  const rem = paginated.value.length % 3
  return rem === 0 ? 0 : 3 - rem
})

function setFilter(f) {
  filter.value = f
  page.value   = 1
}

watch(totalPages, (n) => { if (page.value > n) page.value = n })

onMounted(async () => {
  try {
    const res = await fetch(`${API_URL}/api/emojis`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    emojis.value = await res.json()
  } catch (e) {
    error.value = 'Não foi possível carregar os emotes.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.emoji-status        { padding: 32px; text-align: center; color: #888; font-size: 13px; }
.emoji-status.error  { color: #f87171; }

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px;
}

.emoji-item {
  position: relative; /* [NOVO] necessário para o lock-overlay */
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: background 0.15s, border-color 0.15s;
  min-height: 130px;
  cursor: default;
}
.emoji-item:hover         { background: rgba(255,255,255,0.08); }
.emoji-item.ghost         { background: transparent; border-color: transparent; pointer-events: none; }
.emoji-item:not(.ghost):not(.locked) { cursor: copy; }

/* [NOVO] Estado bloqueado */
.emoji-item.locked        { cursor: pointer; opacity: 0.6; }
.emoji-item.locked:hover  {
  background: rgba(255,140,0,0.07);
  border-color: rgba(255,140,0,0.25);
}

/* [NOVO] Overlay de cadeado */
.lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: rgba(0,0,0,0.62);
  border-radius: 8px;
  color: #FF8C00;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  pointer-events: none;
  z-index: 1;
}

.e-wrap    { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
.e-img     { width: 48px; height: 48px; object-fit: contain; image-rendering: pixelated; }
.e-fallback{ font-size: 34px; }

.trigger {
  font-size: 10px;
  font-weight: 700;
  color: #c084fc;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}

.badges  { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; }
.badge   { font-size: 9px; font-weight: 800; padding: 2px 4px; border-radius: 3px; background: #000; color: #fff; }
.badge.sub      { background: #ffb86c; color: #000; }
.badge.float    { background: #38bdf8; color: #000; }
.badge.confetti { background: #f472b6; color: #000; }

.meta  { display: flex; gap: 6px; align-items: center; }
.cost  { font-size: 10px; color: #facc15; font-weight: 700; }
.uses  { font-size: 10px; color: #555; }

.limit-info {
  font-size: 9px;
  color: #555;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.page-btn {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  color: #ccc;
  width: 28px;
  height: 28px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.page-btn:hover:not(:disabled) { background: rgba(145,70,255,0.25); color: #c084fc; }
.page-btn:disabled { opacity: 0.3; cursor: default; }

.page-info { font-size: 12px; color: #888; min-width: 40px; text-align: center; }

.win-toolbar-btn.active {
  background: rgba(145,70,255,0.2);
  color: #c084fc;
  border-color: #9146ff;
}
</style>