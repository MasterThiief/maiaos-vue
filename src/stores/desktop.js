import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDesktopStore = defineStore('desktop', () => {
  const booted = ref(false)
  const user   = ref(null)

  function setUser(userData) { user.value = userData }

const windows = ref({
  maia:    { open: false, minimized: false, maximized: false, z: 100, x: 120, y:  40, w: 380, h: null },
  perfil:  { open: false, minimized: false, maximized: false, z: 100, x: 200, y:  60, w: 340, h: null },
  emojis:  { open: false, minimized: false, maximized: false, z: 100, x: 240, y:  30, w: 420, h: null },
  ranking: { open: false, minimized: false, maximized: false, z: 100, x: 160, y:  50, w: 440, h: null },
  jogos:   { open: false, minimized: false, maximized: false, z: 100, x: 200, y: 100, w: 380, h: null },
  loja:    { open: false, minimized: false, maximized: false, z: 100, x: 220, y:  80, w: 380, h: null },
  rifa:    { open: false, minimized: false, maximized: false, z: 100, x: 180, y:  90, w: 380, h: null },
  live:    { open: false, minimized: false, maximized: false, z: 100, x:  80, y:  30, w: 560, h: 340 }, // h fixo inicial
  chat:    { open: false, minimized: false, maximized: false, z: 100, x: 660, y:  30, w: 320, h: 480 }, // [NOVO]
})

  const activeWindowId  = ref(null)
  let zTop = 100

  const startMenuOpen = ref(false)
  const contextMenu   = ref({ visible: false, x: 0, y: 0 })
  const selectedIcon  = ref(null)
  const toast         = ref({ visible: false, icon: '', title: 'MaiaOS', message: '' })
  let toastTimer = null

  function boot() { booted.value = true }

  function shutdown() {
  booted.value = false
  // Fecha todas as janelas
  Object.keys(windows.value).forEach(id => {
    windows.value[id].open = false
    windows.value[id].minimized = false
  })
}

  function openWindow(id) {
    if (!windows.value[id]) return
    windows.value[id].open      = true
    windows.value[id].minimized = false
    focusWindow(id)
  }
  function closeWindow(id) {
    if (!windows.value[id]) return
    windows.value[id].open      = false
    windows.value[id].minimized = false
    windows.value[id].maximized = false
    if (activeWindowId.value === id) activeWindowId.value = null
  }
  function minimizeWindow(id) {
    if (!windows.value[id]) return
    windows.value[id].minimized = true
    if (activeWindowId.value === id) activeWindowId.value = null
  }
  function toggleMaximize(id) {
    if (!windows.value[id]) return
    windows.value[id].maximized = !windows.value[id].maximized
    focusWindow(id)
  }
  function focusWindow(id) {
    if (!windows.value[id]) return
    activeWindowId.value  = id
    windows.value[id].z   = ++zTop
  }
  function restoreWindow(id) {
    if (!windows.value[id]) return
    windows.value[id].minimized = false
    focusWindow(id)
  }

  function toggleStartMenu()    { startMenuOpen.value = !startMenuOpen.value }
  function closeStartMenu()     { startMenuOpen.value = false }
  function showContextMenu(x,y) { contextMenu.value = { visible: true, x, y } }
  function hideContextMenu()    { contextMenu.value.visible = false }
  function selectIcon(id)       { selectedIcon.value = id }
  function clearIconSelection() { selectedIcon.value = null }

  function showToast(icon, message, title = 'MaiaOS') {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { visible: true, icon, title, message }
    toastTimer  = setTimeout(() => { toast.value.visible = false }, 3500)
  }

  return {
    booted, user,
    windows, activeWindowId, startMenuOpen, contextMenu, selectedIcon, toast,
    boot, setUser,
    openWindow, closeWindow, minimizeWindow, toggleMaximize, focusWindow, restoreWindow,
    toggleStartMenu, closeStartMenu, showContextMenu, hideContextMenu,
    selectIcon, clearIconSelection, showToast,shutdown,
  }
})
