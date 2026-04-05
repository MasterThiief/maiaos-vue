<template>
  <div
    class="desktop"
    :class="{ visible: store.booted }"
    @contextmenu.prevent="onRightClick"
    @click="onDesktopClick"
  >
    <div class="icon-grid">
      <div
        v-for="icon in icons"
        :key="icon.id"
        class="desk-icon"
        :class="{ selected: store.selectedIcon === icon.id }"
        @click.stop="store.selectIcon(icon.id)"
        @dblclick="store.openWindow(icon.id)"
      >
        <div class="icon-img" :style="{ background: icon.bg }">{{ icon.emoji }}</div>
        <div class="icon-label">{{ icon.label }}</div>
      </div>
    </div>

    <!-- Janelas -->
    <WinMaia />
    <WinPerfil />
    <WinEmojis />
    <WinRanking />
    <WinJogos />
    <WinLoja />
    <WinRifa />
    <WinLive />
	<WinChat />
  </div>
</template>

<script setup>
import { useDesktopStore } from '@/stores/desktop'
import WinMaia    from '@/components/windows/WinMaia.vue'
import WinPerfil  from '@/components/windows/WinPerfil.vue'
import WinEmojis  from '@/components/windows/WinEmojis.vue'
import WinRanking from '@/components/windows/WinRanking.vue'
import WinJogos   from '@/components/windows/WinJogos.vue'
import WinLoja    from '@/components/windows/WinLoja.vue'
import WinRifa    from '@/components/windows/WinRifa.vue'
import WinLive    from '@/components/windows/WinLive.vue'
import WinChat    from '@/components/windows/WinChat.vue'

const store = useDesktopStore()

const icons = [
  { id: 'live',    label: 'Live',                emoji: '📺', bg: 'rgba(145,70,255,0.2)'  },
  { id: 'maia',    label: 'Maia — IA',           emoji: '🤖', bg: 'rgba(0,120,215,0.2)'   },
  { id: 'perfil',  label: 'Meu Perfil',          emoji: '👤', bg: 'rgba(0,120,215,0.15)'  },
  { id: 'emojis',  label: 'Emojis & Efeitos',    emoji: '🎭', bg: 'rgba(120,0,215,0.15)'  },
  { id: 'ranking', label: 'Ranking',             emoji: '🏆', bg: 'rgba(215,150,0,0.2)'   },
  { id: 'jogos',   label: 'Jogos',               emoji: '🎮', bg: 'rgba(0,180,100,0.15)'  },
  { id: 'loja',    label: 'Loja',                emoji: '🛒', bg: 'rgba(215,100,0,0.15)'  },
  { id: 'rifa',    label: 'Rifas',               emoji: '🎰', bg: 'rgba(215,0,100,0.15)'  },
  { id: 'chat',    label: 'Chat',                 emoji: '💬', bg: 'rgba(145,70,255,0.2)' }
]

function onRightClick(e) {
  const mx = Math.min(e.clientX, window.innerWidth  - 180)
  const my = Math.min(e.clientY, window.innerHeight - 120)
  store.showContextMenu(mx, my)
}

function onDesktopClick(e) {
  if (!e.target.closest('.desk-icon'))  store.clearIconSelection()
  if (!e.target.closest('.ctx-menu'))   store.hideContextMenu()
  if (!e.target.closest('.start-menu') && !e.target.closest('.start-btn')) {
    store.closeStartMenu()
  }
}
</script>
