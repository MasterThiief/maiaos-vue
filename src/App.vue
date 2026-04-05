<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useDesktopStore }  from '@/stores/desktop'
import { useTwitchAuth }    from '@/composables/useTwitchAuth'

import BootScreen        from '@/components/system/BootScreen.vue'
import LoginScreen       from '@/components/system/LoginScreen.vue'
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

const isOAuthCallback = window.location.hash.includes('access_token')

// Checa se já tem sessão salva
const savedUser = localStorage.getItem('maiaos_user')

// Se voltou do OAuth ou tem sessão salva, pula boot e login
const phase = ref(
  isOAuthCallback || savedUser ? 'processing' : 'boot'
)

function onResize() { isMobile.value = window.innerWidth < 768 }

function onLoggedIn() {
  phase.value = 'desktop'
  store.boot()
  setTimeout(() => store.showToast('🤖', 'Bem-vindo ao MaiaOS Professional!'), 300)
}

watch(() => store.booted, (booted) => {
  if (!booted && phase.value === 'desktop') {
    phase.value = 'login'
  }
})


onMounted(async () => {
  window.addEventListener('resize', onResize)

  // Callback do OAuth
  if (isOAuthCallback) {
    const loggedIn = await handleCallback()
    if (loggedIn) { onLoggedIn(); return }
    phase.value = 'login'
    return
  }

  // Sessão salva — restaura sem precisar logar de novo
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser)
      store.setUser(user)
      onLoggedIn()
    } catch {
      localStorage.removeItem('maiaos_user')
      phase.value = 'boot'
    }
    return
  }
})

onUnmounted(() => window.removeEventListener('resize', onResize))

store.$onBootReady = () => { phase.value = 'login' }
</script>

<template>
  <MobileBlock v-if="isMobile && !mobileDismissed" @dismiss="mobileDismissed = true" />

  <template v-else>
    <div v-if="phase === 'processing'" class="processing-screen">
      <div class="processing-dots">
        <div class="boot-dot"></div>
        <div class="boot-dot"></div>
        <div class="boot-dot"></div>
      </div>
    </div>

    <BootScreen  v-if="phase === 'boot'" />
    <LoginScreen v-if="phase === 'login'" @logged-in="onLoggedIn" />

    <template v-if="phase === 'desktop'">
      <Desktop />
      <Taskbar />
      <StartMenu />
      <ContextMenu />
    </template>

    <ToastNotification />
  </template>
</template>

<style>
.processing-screen {
  position: fixed;
  inset: 0;
  background: #0a0d14;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.processing-dots {
  display: flex;
  gap: 8px;
}
.boot-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9146ff;
  animation: bounce 1.2s infinite ease-in-out;
}
.boot-dot:nth-child(1) { animation-delay: 0s; }
.boot-dot:nth-child(2) { animation-delay: 0.2s; }
.boot-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%            { opacity: 1;   transform: scale(1.2); }
}
</style>