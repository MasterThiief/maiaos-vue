<template>
  <div
    v-if="store.contextMenu.visible"
    class="ctx-menu"
    :style="{ left: store.contextMenu.x + 'px', top: store.contextMenu.y + 'px' }"
  >
    <div class="ctx-item" @click="act('🖼️', 'Papéis de parede em breve na Loja!')">Mudar papel de parede</div>
    <div class="ctx-item" @click="act('🔄', 'Área de trabalho atualizada!')">Atualizar</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" @click="act('⚙️', 'Configurações em breve!')">Propriedades</div>
  </div>
</template>

<script setup>
import { useDesktopStore } from '@/stores/desktop'
const store = useDesktopStore()

function act(icon, msg) {
  store.hideContextMenu()
  store.showToast(icon, msg)
}
</script>
