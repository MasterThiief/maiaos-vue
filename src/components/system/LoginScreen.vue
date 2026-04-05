<template>
  <div class="login-screen" :class="{ 'fade-out': fading }">

    <!-- Lado esquerdo — branding -->
    <div class="login-left">
      <div class="login-logo">
        <img src="@/assets/logo-maiaos.png" alt="MaiaOS" class="login-logo-img" />
      </div>
      <div class="login-tagline">Para começar,<br>escolha seu perfil</div>
    </div>

    <!-- Divisor -->
    <div class="login-divider" />

    <!-- Lado direito — cards -->
    <div class="login-right">

      <!-- Card Twitch -->
      <div
        class="login-card"
        :class="{ loading: loggingIn }"
        @click="loginTwitch"
      >
        <div class="login-card-avatar twitch-avatar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#9146FF">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
        </div>
        <div class="login-card-info">
          <div class="login-card-name">Entrar com Twitch</div>
          <div class="login-card-sub">Acesso completo</div>
        </div>
        <div v-if="loggingIn" class="login-spinner" />
        <div v-else class="login-arrow">▶</div>
      </div>

      <!-- Card Convidado -->
      <div class="login-card guest" @click="loginGuest">
        <div class="login-card-avatar guest-avatar">👤</div>
        <div class="login-card-info">
          <div class="login-card-name">Convidado</div>
          <div class="login-card-sub">Acesso limitado</div>
        </div>
        <div class="login-arrow">▶</div>
      </div>

    </div>

    <!-- Rodapé -->
    <div class="login-footer">
      <span>MaiaOS Professional © MaxterLabs {{ year }}</span>
      <span class="footer-dot">·</span>
      <span class="server-status" :class="serverOk ? 'online' : 'offline'">
        {{ serverOk ? '● Servidores online' : '● Servidores offline' }}
      </span>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTwitchAuth }   from '@/composables/useTwitchAuth'
import { useDesktopStore } from '@/stores/desktop'
import { API_URL }         from '@/config'

const emit = defineEmits(['logged-in'])

const { login } = useTwitchAuth()
const store     = useDesktopStore()

const loggingIn = ref(false)
const fading    = ref(false)
const year      = new Date().getFullYear()
const serverOk  = ref(true)

fetch(`${API_URL}/health`).catch(() => { serverOk.value = false })

function loginTwitch() {
  loggingIn.value = true
  setTimeout(() => login(), 400)
}

function loginGuest() {
  fading.value = true
  store.setUser(null)
  setTimeout(() => emit('logged-in'), 700)
}
</script>

<style scoped>
.login-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: row;
  background: linear-gradient(135deg, #0a0d14 0%, #0d1220 50%, #0a0d14 100%);
  z-index: 9999;
  transition: opacity 0.7s ease;
}
.login-screen.fade-out { opacity: 0; pointer-events: none; }

/* ── Esquerda ── */
.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 40px;
  background: linear-gradient(160deg,
    rgba(0,120,215,0.12) 0%,
    rgba(145,70,255,0.08) 100%
  );
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 20px;
}

.login-logo-img {
  width: 240px;
  height: auto;
  object-fit: contain;
}

.login-brand {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.login-os {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  letter-spacing: -1px;
}
.login-os span { color: #9146ff; }
.login-os sup  { font-size: 14px; color: #666; vertical-align: super; }

.login-edition {
  font-size: 12px;
  color: #0078D7;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 2px;
}

.login-tagline {
  font-size: 18px;
  color: #ccc;
  text-align: center;
  line-height: 1.2;
  font-weight: 300;
}

/* ── Divisor ── */
.login-divider {
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255,255,255,0.12) 20%,
    rgba(255,255,255,0.12) 80%,
    transparent 100%
  );
  margin: 40px 0;
}

/* ── Direita ── */
.login-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

/* ── Cards ── */
.login-card {
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  user-select: none;
}
.login-card:hover {
  background: rgba(145,70,255,0.12);
  border-color: rgba(145,70,255,0.35);
  transform: translateX(4px);
}
.login-card:active  { transform: translateX(2px); }
.login-card.loading { opacity: 0.7; pointer-events: none; }

.login-card.guest:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.15);
}

.login-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}
.twitch-avatar {
  background: rgba(145,70,255,0.15);
  border: 1px solid rgba(145,70,255,0.3);
}
.guest-avatar {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
}

.login-card-info { flex: 1; min-width: 0; }
.login-card-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.login-card-sub {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.login-arrow {
  font-size: 11px;
  color: #555;
  flex-shrink: 0;
}

.login-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(145,70,255,0.3);
  border-top-color: #9146ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Rodapé ── */
.login-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(0,0,0,0.4);
  border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 10.5px;
  color: #444;
}

.footer-dot { color: #333; }

.server-status { font-weight: 600; }
.server-status.online  { color: #4ade80; }
.server-status.offline { color: #f87171; }
</style>