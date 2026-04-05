<template>
  <OsWindow id="perfil" icon="👤" title="Meu Perfil">
    <template #toolbar>
      <button class="win-toolbar-btn">Arquivo</button>
      <button class="win-toolbar-btn">Personalizar</button>
    </template>

    <!-- Não autenticado -->
    <div v-if="!store.user" class="win-content" style="text-align:center;padding:32px 16px">
      <div style="font-size:40px;margin-bottom:12px">👤</div>
      <div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:6px">Conta não conectada</div>
      <div style="color:#666;font-size:11px;margin-bottom:20px;max-width:220px;margin-inline:auto">
        Conecte sua conta Twitch para ver Tokoins, ranking e perks ativos.
      </div>
      <button class="twitch-login-btn" style="margin:0 auto" @click="login()">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
        </svg>
        Entrar com Twitch
      </button>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="win-content" style="text-align:center;padding:32px 16px">
      <div style="color:#555;font-size:11px">Carregando perfil...</div>
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="win-content" style="text-align:center;padding:32px 16px">
      <div style="font-size:28px;margin-bottom:8px">⚠️</div>
      <div style="color:#e05c5c;font-size:11px">{{ error }}</div>
      <button class="rifa-btn" style="margin-top:12px" @click="load">Tentar novamente</button>
    </div>

    <!-- Autenticado com dados -->
    <div v-else class="win-content">
      <div class="profile-card">
        <div class="avatar" style="background:none;padding:0;overflow:hidden">
          <img
            v-if="store.user.profileImage"
            :src="store.user.profileImage"
            :alt="store.user.displayName"
            style="width:56px;height:56px;border-radius:50%;object-fit:cover"
          />
          <span v-else style="font-size:24px">🎮</span>
        </div>
        <div class="profile-info">
          <h3>{{ store.user.displayName }}</h3>
          <div class="tag">@{{ store.user.login }} • Twitch</div>
          <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
            <span v-if="profile.isSubscriber" style="font-size:9px;background:rgba(145,70,255,0.2);color:#9146FF;padding:1px 6px;border-radius:3px">⭐ Inscrito</span>
            <span v-if="profile.isVip"        style="font-size:9px;background:rgba(255,140,0,0.15);color:#FF8C00;padding:1px 6px;border-radius:3px">👑 VIP</span>
            <span v-if="profile.isMod"        style="font-size:9px;background:rgba(0,173,58,0.15);color:#00ad3a;padding:1px 6px;border-radius:3px">🔨 Mod</span>
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-val">⚡ {{ profile.tokoins.balance.toLocaleString('pt-BR') }}</div>
          <div class="stat-lbl">Tokoins</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">#{{ rankPosition }}</div>
          <div class="stat-lbl">Posição no Ranking</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ profile.visits }}</div>
          <div class="stat-lbl">Visitas à Live</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ profile.tokoins.totalEarned.toLocaleString('pt-BR') }}</div>
          <div class="stat-lbl">Total Ganho</div>
        </div>
      </div>

      <!-- Histórico recente -->
      <div style="margin-top:2px">
        <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;padding:0 2px">
          Histórico recente
        </div>
        <div v-if="transactions.length === 0" style="color:#444;font-size:11px;text-align:center;padding:12px 0">
          Nenhuma transação ainda
        </div>
        <div
          v-for="tx in transactions"
          :key="tx._id"
          style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:4px;margin-bottom:3px;background:rgba(255,255,255,0.03)"
        >
          <div style="color:#aaa;font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">
            {{ tx.description }}
          </div>
          <div :style="{ color: tx.amount > 0 ? '#4caf50' : '#e05c5c', fontSize:'11px', fontWeight:'700', flexShrink:0, marginLeft:'8px' }">
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }} ⚡
          </div>
        </div>
      </div>
    </div>
  </OsWindow>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import OsWindow            from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop'
import { useTwitchAuth }   from '@/composables/useTwitchAuth'
import { useApi }          from '@/composables/useApi'

const store = useDesktopStore()
const { login }  = useTwitchAuth()
const { getUser, getUserTransactions, getRanking } = useApi()

const profile      = ref(null)
const transactions = ref([])
const rankPosition = ref('—')
const loading      = ref(false)
const error        = ref(null)

async function load() {
  if (!store.user?.id) return
  loading.value = true
  error.value   = null
  try {
    const [prof, txs, ranking] = await Promise.all([
      getUser(store.user.id),
      getUserTransactions(store.user.id, 8),
      getRanking(50),
    ])
    profile.value      = prof
    transactions.value = txs
    const pos = ranking.findIndex(r => r.twitchId === store.user.id)
    rankPosition.value = pos >= 0 ? pos + 1 : '—'
  } catch (e) {
    error.value = e.message || 'Erro ao carregar perfil'
  } finally {
    loading.value = false
  }
}

// Busca quando usuário loga ou janela abre
watch(() => store.user?.id, (id) => { if (id) load() }, { immediate: true })
watch(() => store.windows.perfil.open, (open) => { if (open && store.user?.id) load() })
</script>
