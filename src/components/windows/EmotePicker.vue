<template>
  <div class="emote-picker-wrapper" ref="wrapperRef">
    <!-- Botão -->
    <button
      class="emote-btn"
      @click="toggle"
      :aria-label="open ? 'Fechar emotes' : 'Abrir emotes'"
      title="Emotes"
    >
      😄
    </button>

    <!-- Painel flutuante -->
    <Transition name="picker-pop">
      <div v-if="open" class="emote-panel">
        <div class="emote-panel-header">
          <input
            v-model="search"
            ref="searchEl"
            class="emote-search"
            placeholder="Buscar emote..."
          />
        </div>

        <div class="emote-grid" v-if="filtered.length">
          <button
            v-for="emote in filtered"
            :key="emote.name"
            class="emote-item"
            :title="emote.name"
            @click="select(emote)"
          >
            <img :src="emote.url" :alt="emote.name" loading="lazy" />
          </button>
        </div>

        <p v-else-if="!hasEmotes" class="emote-empty">
          Nenhum emote disponível.<br/>Faça login com a Twitch para carregar seus emotes.
        </p>
        <p v-else class="emote-empty">Nenhum emote encontrado</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'

// ✅ Recebe o mapa já carregado pelo WinChat — sem chamada de API duplicada
const props = defineProps({
  emoteMap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['select'])

const open      = ref(false)
const search    = ref('')
const wrapperRef = ref(null)
const searchEl   = ref(null)

onClickOutside(wrapperRef, () => { open.value = false })

// ✅ Transforma { nome: url } em array de objetos para o template
const emoteList = computed(() =>
  Object.entries(props.emoteMap).map(([name, url]) => ({ name, url }))
)

const hasEmotes = computed(() => emoteList.value.length > 0)

const filtered = computed(() => {
  if (!search.value.trim()) return emoteList.value
  const q = search.value.toLowerCase()
  return emoteList.value.filter(e => e.name.toLowerCase().includes(q))
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    search.value = ''
    nextTick(() => searchEl.value?.focus())
  }
}

function select(emote) {
  emit('select', emote.name) // ✅ emite só o nome — WinChat insere no draft
  open.value = false
}
</script>

<style scoped>
.emote-picker-wrapper {
  position: relative;
  flex-shrink: 0;
}

.emote-btn {
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  font-size: 16px; line-height: 1;
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.emote-btn:hover { background: rgba(145,70,255,0.2); border-color: rgba(145,70,255,0.5); }

/* ── Painel ── */
.emote-panel {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  width: 260px;
  max-height: 300px;
  background: #1a1d26;
  border: 1px solid rgba(145,70,255,0.3);
  border-radius: 8px;
  overflow: hidden;
  display: flex; flex-direction: column;
  z-index: 20;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.5);
}

.emote-panel-header {
  padding: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.emote-search {
  width: 100%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  color: #fff; font-size: 11px;
  padding: 5px 8px; outline: none;
  transition: border-color 0.15s;
}
.emote-search:focus { border-color: rgba(145,70,255,0.5); }
.emote-search::placeholder { color: #555; }

.emote-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 6px;
  overflow-y: auto;
  flex: 1;
}
.emote-grid::-webkit-scrollbar       { width: 4px; }
.emote-grid::-webkit-scrollbar-track { background: transparent; }
.emote-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

.emote-item {
  width: 32px; height: 32px;
  background: transparent; border: none;
  border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 2px; transition: background 0.1s;
}
.emote-item:hover { background: rgba(145,70,255,0.25); }
.emote-item img   { width: 28px; height: 28px; object-fit: contain; }

.emote-empty {
  padding: 16px 12px; text-align: center;
  font-size: 11px; color: #555; line-height: 1.5;
}

/* ── Animação ── */
.picker-pop-enter-active,
.picker-pop-leave-active { transition: opacity 0.15s, transform 0.15s; }
.picker-pop-enter-from,
.picker-pop-leave-to     { opacity: 0; transform: translateY(4px) scale(0.97); }
</style>