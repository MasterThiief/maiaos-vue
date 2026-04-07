<!-- src/components/windows/jogos/CaraOuCoroa.vue -->
<template>
  <div class="coc-root">

    <!-- Header -->
    <div class="coc-header">
      <button class="btn-voltar" @click="$emit('voltar')">◀ Voltar</button>
      <span class="coc-title">🪙 Cara ou Coroa</span>
      <span class="coc-saldo">⚡ {{ saldoLocal.toLocaleString('pt-BR') }}</span>
    </div>

    <!-- Moeda -->
    <div class="coc-moeda-wrap">
      <div class="coc-moeda" :class="moedaClass">
        <div class="moeda-face frente">👑</div>
        <div class="moeda-face verso">⭐</div>
      </div>
      <div class="coc-resultado-label" :class="resultadoClass">
        {{ resultadoLabel }}
      </div>
    </div>

    <!-- Escolha -->
    <div class="coc-escolha">
      <button
        class="btn-lado"
        :class="{ selected: opcao === 'cara', disabled: jogando }"
        @click="opcao = 'cara'"
      >
        👑 Cara
      </button>
      <button
        class="btn-lado"
        :class="{ selected: opcao === 'coroa', disabled: jogando }"
        @click="opcao = 'coroa'"
      >
        ⭐ Coroa
      </button>
    </div>

    <!-- Aposta -->
    <div class="coc-aposta">
      <div class="aposta-label">Aposta</div>
      <div class="aposta-controles">
        <button class="btn-aposta-quick" @click="setAposta(10)"   :disabled="jogando">10</button>
        <button class="btn-aposta-quick" @click="setAposta(50)"   :disabled="jogando">50</button>
        <button class="btn-aposta-quick" @click="setAposta(100)"  :disabled="jogando">100</button>
        <button class="btn-aposta-quick" @click="setAposta(500)"  :disabled="jogando">500</button>
        <button class="btn-aposta-quick" @click="apostarTudo"     :disabled="jogando">MAX</button>
      </div>
      <div class="aposta-input-wrap">
        <span class="aposta-icon">⚡</span>
        <input
          v-model.number="aposta"
          type="number"
          class="aposta-input"
          :min="10"
          :max="Math.min(1000, saldoLocal)"
          :disabled="jogando"
        />
      </div>
    </div>

    <!-- Botão jogar -->
    <button
      class="btn-jogar"
      :disabled="!podeJogar"
      @click="jogar"
    >
      {{ jogando ? 'Jogando...' : 'Jogar' }}
    </button>

    <!-- Histórico rápido -->
    <div class="coc-historico" v-if="historico.length">
      <span
        v-for="(h, i) in historico"
        :key="i"
        class="hist-item"
        :class="h.ganhou ? 'ganhou' : 'perdeu'"
        :title="h.ganhou ? `+${h.delta}` : `${h.delta}`"
      >
        {{ h.resultado === 'cara' ? '👑' : '⭐' }}
      </span>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDesktopStore } from '@/stores/desktop'
import { API_URL }         from '@/config'

const props = defineProps({
  saldo: { type: Number, default: 0 }
})
const emit = defineEmits(['resultado', 'voltar'])

const store      = useDesktopStore()
const saldoLocal = ref(props.saldo)
const opcao      = ref('cara')
const aposta     = ref(50)
const jogando    = ref(false)
const historico  = ref([])

// Estado da animação da moeda
// idle | girando | cara | coroa
const estadoMoeda = ref('idle')

const moedaClass = computed(() => ({
  'girando': estadoMoeda.value === 'girando',
  'cara':    estadoMoeda.value === 'cara',
  'coroa':   estadoMoeda.value === 'coroa',
}))

const resultadoLabel = computed(() => {
  if (estadoMoeda.value === 'idle')    return 'Escolha e aposte!'
  if (estadoMoeda.value === 'girando') return 'Girando...'
  if (ultimoResultado.value === null)  return ''
  return ultimoResultado.value.ganhou
    ? `✅ +${ultimoResultado.value.delta} Tokoins!`
    : `❌ -${Math.abs(ultimoResultado.value.delta)} Tokoins`
})

const resultadoClass = computed(() => ({
  'label-ganhou': ultimoResultado.value?.ganhou === true,
  'label-perdeu': ultimoResultado.value?.ganhou === false,
}))

const ultimoResultado = ref(null)

const podeJogar = computed(() =>
  !jogando.value &&
  !!store.user &&
  aposta.value >= 10 &&
  aposta.value <= Math.min(1000, saldoLocal.value) &&
  saldoLocal.value >= aposta.value
)

watch(() => props.saldo, (v) => { saldoLocal.value = v })

function setAposta(v) {
  aposta.value = Math.min(v, saldoLocal.value, 1000)
}
function apostarTudo() {
  aposta.value = Math.min(saldoLocal.value, 1000)
}

async function jogar() {
  if (!podeJogar.value) return

  jogando.value    = true
  estadoMoeda.value = 'girando'
  ultimoResultado.value = null

  try {
    const res = await fetch(`${API_URL}/api/jogos/jogar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twitchId: store.user.id,
        jogo:     'caraouCoroa',
        aposta:   aposta.value,
        opcao:    opcao.value,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      store.showToast('❌', data.error || 'Erro ao jogar')
      estadoMoeda.value = 'idle'
      return
    }

    // Aguarda animação mínima de 1.5s
    await new Promise(r => setTimeout(r, 1500))

    estadoMoeda.value    = data.resultado   // 'cara' ou 'coroa'
    ultimoResultado.value = data
    saldoLocal.value      = data.newBalance

    historico.value.unshift(data)
    if (historico.value.length > 10) historico.value.pop()

    emit('resultado', data.newBalance)

    // Atualiza localStorage com novo saldo
    const saved = localStorage.getItem('maiaos_user')
    if (saved) {
      const u = JSON.parse(saved)
      localStorage.setItem('maiaos_user', JSON.stringify(u))
    }

    if (data.ganhou) {
      store.showToast('🎉', `Você ganhou ⚡ ${data.delta} Tokoins!`)
    } else {
      store.showToast('😢', `Perdeu ⚡ ${Math.abs(data.delta)} Tokoins...`)
    }

  } catch {
    store.showToast('❌', 'Não foi possível conectar ao servidor')
    estadoMoeda.value = 'idle'
  } finally {
    jogando.value = false
  }
}
</script>

<style scoped>
.coc-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 14px;
  height: 100%;
  overflow-y: auto;
}

/* ── Header ── */
.coc-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn-voltar {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 5px;
  color: #aaa;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-voltar:hover { background: rgba(255,255,255,0.12); color: #fff; }
.coc-title  { font-size: 13px; font-weight: 700; color: #fff; }
.coc-saldo  { font-size: 12px; color: #FF8C00; font-weight: 700; }

/* ── Moeda ── */
.coc-moeda-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
}

.coc-moeda {
  width: 90px;
  height: 90px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.1s;
}

.moeda-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  border-radius: 50%;
  backface-visibility: hidden;
  background: radial-gradient(circle at 35% 35%, #ffe066, #b8860b);
  border: 3px solid #ffe066;
  box-shadow: 0 4px 20px rgba(255,200,0,0.3);
}
.moeda-face.verso {
  transform: rotateY(180deg);
}

/* Animação de giro */
.coc-moeda.girando {
  animation: girarMoeda 1.4s ease-in-out infinite;
}
@keyframes girarMoeda {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(1080deg); }
}

/* Resultado cara — mostra frente */
.coc-moeda.cara {
  animation: pousarCara 0.4s ease-out forwards;
}
@keyframes pousarCara {
  0%   { transform: rotateY(900deg); }
  100% { transform: rotateY(0deg); }
}

/* Resultado coroa — mostra verso */
.coc-moeda.coroa {
  animation: pousarCoroa 0.4s ease-out forwards;
}
@keyframes pousarCoroa {
  0%   { transform: rotateY(900deg); }
  100% { transform: rotateY(180deg); }
}

.coc-resultado-label {
  font-size: 13px;
  font-weight: 700;
  color: #888;
  min-height: 20px;
  transition: color 0.3s;
}
.label-ganhou { color: #4ade80; }
.label-perdeu { color: #f87171; }

/* ── Escolha ── */
.coc-escolha {
  display: flex;
  gap: 12px;
  width: 100%;
}
.btn-lado {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #aaa;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-lado:hover:not(.disabled) {
  background: rgba(145,70,255,0.1);
  border-color: rgba(145,70,255,0.3);
  color: #fff;
}
.btn-lado.selected {
  background: rgba(145,70,255,0.2);
  border-color: #9146ff;
  color: #fff;
}
.btn-lado.disabled { opacity: 0.4; cursor: default; }

/* ── Aposta ── */
.coc-aposta {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.aposta-label { font-size: 11px; color: #666; font-weight: 600; }
.aposta-controles {
  display: flex;
  gap: 6px;
}
.btn-aposta-quick {
  flex: 1;
  padding: 5px 0;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #aaa;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-aposta-quick:hover:not(:disabled) {
  background: rgba(255,200,0,0.1);
  border-color: rgba(255,200,0,0.3);
  color: #facc15;
}
.btn-aposta-quick:disabled { opacity: 0.3; cursor: default; }

.aposta-input-wrap {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 0 10px;
  gap: 6px;
}
.aposta-icon  { color: #facc15; font-size: 13px; }
.aposta-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 0;
}
.aposta-input::-webkit-inner-spin-button,
.aposta-input::-webkit-outer-spin-button { -webkit-appearance: none; }

/* ── Botão jogar ── */
.btn-jogar {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #9146ff, #6a1fd1);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.5px;
}
.btn-jogar:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-jogar:active:not(:disabled) { transform: translateY(0); }
.btn-jogar:disabled { opacity: 0.3; cursor: default; }

/* ── Histórico ── */
.coc-historico {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 4px 0;
}
.hist-item {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 2px solid transparent;
}
.hist-item.ganhou { border-color: #4ade80; background: rgba(74,222,128,0.1); }
.hist-item.perdeu { border-color: #f87171; background: rgba(248,113,113,0.1); }
</style>