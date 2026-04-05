<template>
  <div class="boot-screen" :class="{ 'fade-out': fading }">
    <div class="boot-logo">
  <img src="@/assets/logo-maiaos.png" alt="MaiaOS" class="boot-logo-img" />
</div>

    <div class="boot-loader">
      <div class="boot-loader-inner">
        <div class="boot-dot"></div>
        <div class="boot-dot"></div>
        <div class="boot-dot"></div>
      </div>
      <div class="boot-status">{{ statusMsg }}</div>
    </div>

    <div class="boot-copy">Copyright © MaxterLabs — MaiaOS Professional</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { API_URL }         from '@/config'

const store     = useDesktopStore()
const fading    = ref(false)
const statusMsg = ref('Iniciando sistema...')

const STATUS_MSGS = [
  'Iniciando sistema...',
  'Conectando aos servidores...',
  'Acordando os hamsters...',
  'Verificando permissões...',
  'Quase lá...',
]

async function wakeUpServer() {
  const maxTries = 15
  for (let i = 0; i < maxTries; i++) {
    statusMsg.value = STATUS_MSGS[Math.min(i, STATUS_MSGS.length - 1)]
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) })
      if (res.ok) return true
    } catch { /* tenta de novo */ }
    await new Promise(r => setTimeout(r, 2000))
  }
  return false
}

onMounted(async () => {
  const [serverOk] = await Promise.all([
    wakeUpServer(),
    new Promise(r => setTimeout(r, 2000)),
  ])

  if (!serverOk) {
    statusMsg.value = 'Servidor indisponível. Entrando offline...'
    await new Promise(r => setTimeout(r, 1500))
  } else {
    statusMsg.value = 'Sistema pronto.'
    await new Promise(r => setTimeout(r, 600))
  }

  fading.value = true
  setTimeout(() => {
    store.$onBootReady?.()
  }, 900)
})
</script>

<style scoped>
.boot-screen {
  position: fixed;
  inset: 0;
  background: #0a0d14;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  z-index: 9999;
  transition: opacity 0.9s ease;
}
.boot-screen.fade-out { opacity: 0; pointer-events: none; }

.boot-logo {
  display: flex;
  align-items: center;
  gap: 20px;
}

.boot-logo-img {
  width: 280px;
  height: auto;
  object-fit: contain;
}

.boot-name span { color: #9146ff; }

.boot-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.boot-loader-inner {
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
  40%           { opacity: 1;   transform: scale(1.2); }
}

.boot-status {
  font-size: 11px;
  color: #555;
  letter-spacing: 0.5px;
  min-height: 16px;
  transition: opacity 0.3s;
}

.boot-copy {
  position: absolute;
  bottom: 20px;
  font-size: 10px;
  color: #2a2a2a;
  letter-spacing: 0.5px;
}
</style>