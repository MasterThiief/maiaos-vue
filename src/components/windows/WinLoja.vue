<template>
  <OsWindow id="loja" icon="🛒" title="Loja de Tokoins">
    <template #toolbar>
      <button class="win-toolbar-btn" :class="{ active: cat==='' }"       @click="cat=''">Todos</button>
      <button class="win-toolbar-btn" :class="{ active: cat==='tema' }"   @click="cat='tema'">Temas</button>
      <button class="win-toolbar-btn" :class="{ active: cat==='perk' }"   @click="cat='perk'">Perks</button>
      <button class="win-toolbar-btn" :class="{ active: cat==='icone' }"  @click="cat='icone'">Ícones</button>
    </template>

    <div v-if="loading" style="text-align:center;padding:32px;color:#555;font-size:11px">
      Carregando loja...
    </div>

    <div v-else>
      <!-- Saldo -->
		 <div
	  v-if="store.user"
	  style="background:rgba(0,120,215,0.1);border-bottom:1px solid rgba(0,120,215,0.2);
			 padding:6px 14px;font-size:11px;color:#aaa;display:flex;
			 justify-content:space-between;align-items:center;gap:8px"
	>
	  <span style="display:flex;align-items:center;gap:6px">
		Seu saldo

		<!-- [NOVO] Badge de inscrito -->
		<span
		  v-if="store.user.isSubscriber"
		  style="background:rgba(255,184,108,0.15);border:1px solid rgba(255,184,108,0.35);
				 color:#ffb86c;font-size:9px;font-weight:800;padding:2px 6px;
				 border-radius:20px;text-transform:uppercase;letter-spacing:0.5px"
		>
		  ⭐ Inscrito
		</span>
	  </span>

	  <span style="color:#FF8C00;font-weight:700">
		⚡ {{ balance.toLocaleString('pt-BR') }} Tokoins
	  </span>
	</div>

      <div class="shop-grid">
        <div
          v-for="item in filtered"
          :key="item.id"
          class="shop-item"
          :class="{
            'shop-item-owned':    item.owned,
            'shop-item-disabled': store.user && !item.owned && balance < item.price,
          }"
          @click="tentarCompra(item)"
        >
          <div class="sh-icon">{{ item.icon }}</div>
          <div class="sh-name">{{ item.name }}</div>

          <!-- Já possui -->
          <div v-if="item.owned" style="color:#4caf50;font-size:10px;font-weight:700;margin:4px 0">
            ✓ Você possui
          </div>
          <div v-if="item.owned && item.expiresAt" style="color:#666;font-size:9.5px">
            Expira {{ formatDate(item.expiresAt) }}
          </div>

          <!-- Disponível para compra -->
          <template v-else>
            <div class="sh-price">⚡ {{ item.price.toLocaleString('pt-BR') }}</div>
            <div class="sh-desc">{{ item.desc }}</div>
            <div v-if="store.user && balance < item.price" style="color:#e05c5c;font-size:9.5px;margin-top:4px">
              Faltam ⚡ {{ (item.price - balance).toLocaleString('pt-BR') }}
            </div>
            <div v-if="item.renewable" style="color:#888;font-size:9.5px;margin-top:4px">
              🔄 Renovável mensalmente
            </div>
          </template>
        </div>
      </div>

      <div v-if="!store.user" style="text-align:center;padding:12px;font-size:11px;color:#555">
        Faça login com a Twitch para comprar itens
      </div>
    </div>
  </OsWindow>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import OsWindow            from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop'
import { useApi }          from '@/composables/useApi'

const store = useDesktopStore()
const { getLojaItems, comprarItem, getUser } = useApi()

const items   = ref([])
const cat     = ref('')
const loading = ref(false)
const balance = ref(0)

const filtered = computed(() =>
  cat.value ? items.value.filter(i => i.category === cat.value) : items.value
)

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    // Passa twitchId pra API retornar ownership
    const twitchId = store.user?.id ?? ''
    const url = twitchId
      ? `${(await import('@/config')).API_URL}/api/loja/items?twitchId=${twitchId}`
      : `${(await import('@/config')).API_URL}/api/loja/items`

    const res = await fetch(url)
    items.value = await res.json()

    if (store.user?.id) {
      const u = await getUser(store.user.id)
      balance.value = u.tokoins.balance
    }
  } finally {
    loading.value = false
  }
}

async function tentarCompra(item) {
  if (item.owned && !item.renewable) {
    store.showToast('ℹ️', 'Você já possui este item')
    return
  }
  if (!store.user) {
    store.showToast('🔒', 'Faça login com a Twitch para comprar')
    return
  }
  if (balance.value < item.price) {
    store.showToast('❌', `Saldo insuficiente. Faltam ⚡ ${item.price - balance.value}`)
    return
  }
  try {
    const res = await comprarItem(store.user.id, item.id)
    balance.value = res.newBalance
    store.showToast('✅', `${item.name} comprado! Saldo: ⚡ ${res.newBalance}`)
    await load() // Atualiza ownership
  } catch (e) {
    store.showToast('❌', e.error || 'Erro ao comprar item')
  }
}

watch(() => store.windows.loja.open, (open) => { if (open) load() })
load()
</script>
