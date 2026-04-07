<!-- src/components/windows/WinJogos.vue -->
<template>
  <OsWindow id="jogos" icon="🎮" title="Jogos — MaiaOS Games">

    <!-- Lobby -->
    <template v-if="!jogoAtivo">
      <div class="lobby">

        <!-- Saldo -->
        <div class="lobby-saldo" v-if="store.user">
          <span class="saldo-label">Seu saldo</span>
          <span class="saldo-valor">⚡ {{ saldo.toLocaleString('pt-BR') }} Tokoins</span>
        </div>

        <!-- Grid de jogos -->
        <div class="jogos-grid">
          <div
            v-for="jogo in jogos"
            :key="jogo.id"
            class="jogo-card"
            :class="{ disabled: !store.user }"
            @click="abrirJogo(jogo.id)"
          >
            <div class="jogo-icon">{{ jogo.icon }}</div>
            <div class="jogo-nome">{{ jogo.nome }}</div>
            <div class="jogo-desc">{{ jogo.desc }}</div>
            <div class="jogo-meta">
              <span class="jogo-bet">⚡ {{ jogo.minBet }}–{{ jogo.maxBet }}</span>
              <span class="jogo-mult">×{{ jogo.multiplier }}</span>
            </div>
          </div>
        </div>

        <div v-if="!store.user" class="lobby-hint">
          Faça login com a Twitch para jogar
        </div>

      </div>
    </template>

    <!-- Jogo ativo -->
    <template v-else>
      <CaraOuCoroa
        v-if="jogoAtivo === 'caraouCoroa'"
        :saldo="saldo"
        @resultado="onResultado"
        @voltar="jogoAtivo = null"
      />
    </template>

  </OsWindow>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import OsWindow     from './OsWindow.vue'
import CaraOuCoroa  from './jogos/CaraOuCoroa.vue'
import { useDesktopStore } from '@/stores/desktop'
import { useApi }          from '@/composables/useApi'

const store = useDesktopStore()
const { getUser } = useApi()

const jogoAtivo = ref(null)
const saldo     = ref(0)

const jogos = [
  {
    id:         'caraouCoroa',
    icon:       '🪙',
    nome:       'Cara ou Coroa',
    desc:       'Escolha um lado e dobre seus Tokoins!',
    minBet:     10,
    maxBet:     1000,
    multiplier: 2,
  },
  // Futuros jogos aqui
]

async function carregarSaldo() {
  if (!store.user?.id) return
  try {
    const u = await getUser(store.user.id)
    saldo.value = u.tokoins.balance
  } catch { /* silencioso */ }
}

function abrirJogo(id) {
  if (!store.user) return
  jogoAtivo.value = id
}

function onResultado(novoSaldo) {
  saldo.value = novoSaldo
}

watch(() => store.windows.jogos?.open, (open) => {
  if (open) carregarSaldo()
})

onMounted(() => {
  if (store.windows.jogos?.open) carregarSaldo()
})
</script>

<style scoped>
.lobby {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  height: 100%;
}

.lobby-saldo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,120,215,0.1);
  border: 1px solid rgba(0,120,215,0.2);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 11px;
  color: #aaa;
}
.saldo-valor { color: #FF8C00; font-weight: 700; font-size: 13px; }

.jogos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.jogo-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-align: center;
}
.jogo-card:hover:not(.disabled) {
  background: rgba(145,70,255,0.12);
  border-color: rgba(145,70,255,0.35);
  transform: translateY(-2px);
}
.jogo-card.disabled { opacity: 0.4; cursor: default; }

.jogo-icon { font-size: 32px; }
.jogo-nome { font-size: 13px; font-weight: 700; color: #fff; }
.jogo-desc { font-size: 10px; color: #666; line-height: 1.4; }
.jogo-meta { display: flex; gap: 8px; align-items: center; margin-top: 2px; }
.jogo-bet  { font-size: 10px; color: #facc15; font-weight: 700; }
.jogo-mult { font-size: 10px; color: #4ade80; font-weight: 800; }

.lobby-hint {
  text-align: center;
  font-size: 11px;
  color: #444;
  padding: 8px;
}
</style>