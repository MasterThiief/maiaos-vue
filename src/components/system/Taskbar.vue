<template>
  <div class="taskbar">
    <button class="start-btn" @click="store.toggleStartMenu()">
      <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="none">
        <rect x="2"  y="2"  width="30" height="30" rx="4" fill="rgba(255,255,255,0.9)"/>
        <rect x="40" y="2"  width="30" height="30" rx="4" fill="rgba(255,255,255,0.9)"/>
        <rect x="2"  y="40" width="30" height="30" rx="4" fill="rgba(255,255,255,0.9)"/>
        <rect x="40" y="40" width="30" height="30" rx="4" fill="rgba(255,255,255,0.9)"/>
      </svg>
      Iniciar
    </button>

    <div class="taskbar-windows">
      <button
        v-for="id in openWindowIds"
        :key="id"
        class="tb-btn"
        :class="{ active: store.activeWindowId === id && !store.windows[id].minimized }"
        @click="onTaskbarClick(id)"
      >
        {{ winMeta[id]?.[0] }} {{ winMeta[id]?.[1] }}
      </button>
    </div>

    <div class="taskbar-tray">
      <span class="tray-icon">🔊</span>
      <span class="tray-icon">📡</span>
      <span class="tray-clock">{{ time }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { useClock } from '@/composables/useClock'

const store = useDesktopStore()
const { time } = useClock()

const winMeta = {
  maia:    ['🤖', 'Maia'],
  perfil:  ['👤', 'Meu Perfil'],
  emojis:  ['🎭', 'Emojis'],
  ranking: ['🏆', 'Ranking'],
  jogos:   ['🎮', 'Jogos'],
  loja:    ['🛒', 'Loja'],
  rifa:    ['🎰', 'Rifas'],
  live:    ['📺', 'Live'], 
  chat:    ['💬', 'Chat'], 
  cmd:    ['⌨️', 'Terminal'],
}

const openWindowIds = computed(() =>
  Object.keys(store.windows).filter(id => store.windows[id].open)
)

function onTaskbarClick(id) {
  const win = store.windows[id]
  if (win.minimized) {
    store.restoreWindow(id)
  } else if (store.activeWindowId === id) {
    store.minimizeWindow(id)
  } else {
    store.focusWindow(id)
  }
}
</script>
