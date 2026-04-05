<template>
  <Transition name="window">
    <div
      v-if="win && win.open && !win.minimized"
      :id="'win-' + id"
      class="os-window"
      :class="{ inactive: store.activeWindowId !== id, maximized: win.maximized }"
      :style="windowStyle"
      @mousedown="store.focusWindow(id)"
    >
      <div class="win-titlebar" @mousedown="onTitlebarMousedown">
        <span class="win-title-icon">{{ icon }}</span>
        <span class="win-title-text">{{ title }}</span>
        <div class="win-controls">
          <button class="win-btn min" @mousedown.stop @click="store.minimizeWindow(id)">&#x2212;</button>
          <button class="win-btn max" @mousedown.stop @click="store.toggleMaximize(id)">&#x25A1;</button>
          <button class="win-btn cls" @mousedown.stop @click="store.closeWindow(id)">&#x2715;</button>
        </div>
      </div>

      <div v-if="$slots.toolbar" class="win-toolbar">
        <slot name="toolbar" />
      </div>

      <div class="win-body">
        <slot />
      </div>

      <!-- [NOVO] Handle de resize — só aparece quando não está maximizado -->
      <div
        v-if="!win.maximized"
        class="win-resize-handle"
        @mousedown.stop="onResizeMousedown"
      />
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useDesktopStore } from '@/stores/desktop'

const props = defineProps({
  id:    { type: String, required: true },
  title: { type: String, default: 'Janela' },
  icon:  { type: String, default: '📄' },
  minW:  { type: Number, default: 260 },  // [NOVO] largura mínima
  minH:  { type: Number, default: 180 },  // [NOVO] altura mínima
})

const store = useDesktopStore()
const win   = computed(() => store.windows[props.id])

const windowStyle = computed(() => {
  if (!win.value) return {}
  if (win.value.maximized) return { zIndex: win.value.z }
  return {
    left:   win.value.x + 'px',
    top:    win.value.y + 'px',
    width:  win.value.w + 'px',
    height: win.value.h ? win.value.h + 'px' : undefined, // [NOVO]
    zIndex: win.value.z,
  }
})

// ── Drag ────────────────────────────────────────────────────────────────────
let offX = 0, offY = 0

function onTitlebarMousedown(e) {
  if (e.button !== 0 || e.target.closest('.win-btn') || win.value.maximized) return
  const el = document.getElementById('win-' + props.id)
  if (!el) return
  store.focusWindow(props.id)
  const r = el.getBoundingClientRect()
  offX = e.clientX - r.left
  offY = e.clientY - r.top
  e.preventDefault()
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onMove(e) {
  const el = document.getElementById('win-' + props.id)
  if (!el) return
  store.windows[props.id].x = Math.max(0, Math.min(e.clientX - offX, window.innerWidth  - el.offsetWidth))
  store.windows[props.id].y = Math.max(0, Math.min(e.clientY - offY, window.innerHeight - 30 - el.offsetHeight))
}

function onUp() {
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', onUp)
}

// ── Resize [NOVO] ────────────────────────────────────────────────────────────
let resizeStartX = 0, resizeStartY = 0, resizeStartW = 0, resizeStartH = 0

function onResizeMousedown(e) {
  if (e.button !== 0) return
  store.focusWindow(props.id)
  const el = document.getElementById('win-' + props.id)
  if (!el) return
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeStartW = el.offsetWidth
  resizeStartH = el.offsetHeight
  e.preventDefault()
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup',  onResizeUp)
}

function onResizeMove(e) {
  const dw = e.clientX - resizeStartX
  const dh = e.clientY - resizeStartY
  store.windows[props.id].w = Math.max(props.minW, resizeStartW + dw)
  store.windows[props.id].h = Math.max(props.minH, resizeStartH + dh)
}

function onResizeUp() {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup',  onResizeUp)
}
</script>

<style scoped>
/* Handle de resize — canto inferior direito */
.win-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
  /* Visual sutil: 3 linhas diagonais estilo XP */
  background-image:
    linear-gradient(135deg,
      transparent 33%, rgba(255,255,255,0.18) 33%, rgba(255,255,255,0.18) 44%,
      transparent 44%, transparent 56%, rgba(255,255,255,0.18) 56%, rgba(255,255,255,0.18) 67%,
      transparent 67%, transparent 78%, rgba(255,255,255,0.18) 78%, rgba(255,255,255,0.18) 89%,
      transparent 89%
    );
}
</style>