<template>
  <MobileBlock v-if="isMobile && !mobileDismissed" @dismiss="mobileDismissed = true" />

  <template v-else>
    <BootScreen   v-if="!store.booted" />
    <Desktop />
    <Taskbar      v-if="store.booted" />
    <StartMenu    v-if="store.booted" />
    <ContextMenu  v-if="store.booted" />
    <ToastNotification />
  </template>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useDesktopStore }  from '@/stores/desktop'
import { useTwitchAuth }    from '@/composables/useTwitchAuth'

import BootScreen        from '@/components/system/BootScreen.vue'
import Desktop           from '@/components/system/Desktop.vue'
import Taskbar           from '@/components/system/Taskbar.vue'
import StartMenu         from '@/components/system/StartMenu.vue'
import ContextMenu       from '@/components/system/ContextMenu.vue'
import MobileBlock       from '@/components/system/MobileBlock.vue'
import ToastNotification from '@/components/ui/ToastNotification.vue'

const store = useDesktopStore()
const { handleCallback } = useTwitchAuth()

const isMobile        = ref(window.innerWidth < 768)
const mobileDismissed = ref(false)

function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(()   => {
  window.addEventListener('resize', onResize)
  // Detecta retorno do OAuth da Twitch
  handleCallback()
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>
