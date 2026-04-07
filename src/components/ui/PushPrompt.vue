<!-- src/components/ui/PushPrompt.vue -->
<template>
  <Transition name="prompt">
    <div v-if="store.pushPrompt" class="push-prompt">
      <div class="prompt-icon">📺</div>
      <div class="prompt-content">
        <div class="prompt-title">Avisos de live</div>
        <div class="prompt-body">Quer ser avisado quando a live começar?</div>
      </div>
      <div class="prompt-actions">
        <button class="btn-allow" @click="allow">Permitir</button>
        <button class="btn-deny"  @click="deny">Agora não</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useDesktopStore } from '@/stores/desktop'
import { usePush }         from '@/composables/usePush'

const store = useDesktopStore()
const { subscribe } = usePush()

async function allow() {
  store.hidePushPrompt()
  const result = await subscribe(store.user?.id ?? null)
  if (result.ok) {
    store.showToast('🔔', 'Ativado! Você será avisado quando a live começar.')
  } else if (result.reason === 'denied') {
    store.showToast('🔕', 'Permissão negada. Você pode ativar nas configurações do browser.')
  }
}

function deny() {
  store.hidePushPrompt()
  // Não pergunta de novo nesta sessão
}
</script>

<style scoped>
.push-prompt {
  position: fixed;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1d26;
  border: 1px solid rgba(145,70,255,0.3);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 8000;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  min-width: 320px;
  max-width: 420px;
}

.prompt-icon { font-size: 28px; flex-shrink: 0; }

.prompt-content { flex: 1; min-width: 0; }
.prompt-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
}
.prompt-body {
  font-size: 11px;
  color: #888;
}

.prompt-actions { display: flex; gap: 8px; flex-shrink: 0; }

.btn-allow {
  background: rgba(145,70,255,0.8);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-allow:hover { background: #9146ff; }

.btn-deny {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #888;
  font-size: 11px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-deny:hover { background: rgba(255,255,255,0.1); color: #fff; }

/* Animação */
.prompt-enter-active { transition: all 0.3s ease; }
.prompt-leave-active { transition: all 0.2s ease; }
.prompt-enter-from   { opacity: 0; transform: translateX(-50%) translateY(20px); }
.prompt-leave-to     { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>