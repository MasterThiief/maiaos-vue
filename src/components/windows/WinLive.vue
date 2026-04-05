<template>
  <OsWindow id="live" icon="📺" title="Live — maxterlabs">
    <template #toolbar>
      <button class="win-toolbar-btn" @click="reload">↺ Recarregar</button>
      <a
        :href="`https://twitch.tv/${TWITCH_CHANNEL}`"
        target="_blank" rel="noopener noreferrer"
        class="win-toolbar-btn"
        style="text-decoration:none"
      >↗ Abrir na Twitch</a>
    </template>

    <div class="live-container">
      <iframe
        v-if="loaded"
        :key="reloadKey"
        :src="playerUrl"
        allowfullscreen
        scrolling="no"
        frameborder="0"
        style="width:100%;aspect-ratio:16/9;display:block;background:#000"
        allow="autoplay; fullscreen"
      />
      <div v-else class="live-placeholder">
        <div style="font-size:40px;margin-bottom:12px">📺</div>
        <div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:6px">Live do maxterlabs</div>
        <div style="color:#666;font-size:11px;margin-bottom:20px">Clique para carregar o player</div>
        <button class="rifa-btn" style="font-size:12px;padding:6px 20px" @click="loaded = true">
          ▶ Assistir agora
        </button>
        <div style="color:#444;font-size:10px;margin-top:12px">
          O player só carrega quando a janela está aberta para não afetar a performance
        </div>
      </div>
    </div>
  </OsWindow>
</template>

<script setup>
import { ref, computed } from 'vue'
import OsWindow         from './OsWindow.vue'
import { TWITCH_CHANNEL } from '@/config'

const loaded    = ref(false)
const reloadKey = ref(0)

// window.location.hostname retorna 'localhost' em dev e o domínio em prod
const playerUrl = computed(() => {
  const parent = window.location.hostname || 'localhost'
  return `https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${parent}&autoplay=false`
})

function reload() {
  reloadKey.value++
}
</script>
