<template>
  <OsWindow id="ranking" icon="🏆" title="Ranking — Top Viewers">
    <template #toolbar>
      <button class="win-toolbar-btn" :class="{ active: tab==='tokoins' }" @click="tab='tokoins'">Tokoins</button>
      <button class="win-toolbar-btn" :class="{ active: tab==='visitas' }" @click="tab='visitas'">Visitas</button>
    </template>

    <!-- Loading -->
    <div v-if="loading" style="text-align:center;padding:32px;color:#555;font-size:11px">
      Carregando ranking...
    </div>

    <!-- Erro -->
    <div v-else-if="error" style="text-align:center;padding:32px">
      <div style="font-size:24px;margin-bottom:8px">⚠️</div>
      <div style="color:#e05c5c;font-size:11px">{{ error }}</div>
      <button class="rifa-btn" style="margin-top:12px" @click="load">Tentar novamente</button>
    </div>

    <!-- Dados -->
    <table v-else class="ranking-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Viewer</th>
          <th>{{ tab === 'tokoins' ? 'Tokoins' : 'Visitas' }}</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in sorted"
          :key="row.twitchId"
          :style="row.twitchId === store.user?.id ? { background: 'rgba(0,120,215,0.12)' } : {}"
        >
          <td>
            <span class="rank-badge" :class="['rank-1','rank-2','rank-3'][i] || 'rank-n'">{{ i + 1 }}</span>
          </td>
          <td>
            {{ row.displayName }}
            <span v-if="row.twitchId === store.user?.id" style="color:#0078D7;font-size:9px;margin-left:4px">◀ você</span>
          </td>
          <td class="tokoins">
            {{ tab === 'tokoins'
              ? '⚡ ' + row.balance.toLocaleString('pt-BR')
              : row.visits.toLocaleString('pt-BR') + ' visitas' }}
          </td>
          <td style="font-size:12px">
            <span v-if="row.isVip">👑</span>
            <span v-if="row.isSubscriber">⭐</span>
          </td>
        </tr>
      </tbody>
    </table>
  </OsWindow>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import OsWindow            from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop'
import { useApi }          from '@/composables/useApi'

const store = useDesktopStore()
const { getRanking } = useApi()

const ranking = ref([])
const tab     = ref('tokoins')
const loading = ref(false)
const error   = ref(null)

const sorted = computed(() =>
  [...ranking.value].sort((a, b) =>
    tab.value === 'tokoins' ? b.balance - a.balance : b.visits - a.visits
  )
)

async function load() {
  loading.value = true
  error.value   = null
  try {
    ranking.value = await getRanking(20)
  } catch (e) {
    error.value = e.message || 'Erro ao carregar ranking'
  } finally {
    loading.value = false
  }
}

watch(() => store.windows.ranking.open, (open) => { if (open) load() }, { immediate: false })
load()
</script>
