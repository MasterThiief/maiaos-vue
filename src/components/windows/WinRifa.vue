<template>
  <OsWindow id="rifa" icon="🎰" title="Rifas — Chaves de Jogos">
    <div class="rifa-container">
      <div v-for="rifa in rifas" :key="rifa.title" class="rifa-card">
        <div class="rc-header">
          <div class="rc-icon">{{ rifa.icon }}</div>
          <div>
            <div class="rc-title">{{ rifa.title }}</div>
            <div class="rc-sub">{{ rifa.sub }}</div>
          </div>
        </div>
        <div style="font-size:10.5px;color:#666">{{ rifa.tickets }} tickets vendidos de {{ rifa.max }}</div>
        <div class="rc-footer">
          <div class="rc-price">⚡ {{ rifa.price }} / ticket</div>
          <button class="rifa-btn" @click="store.showToast('🎰', 'Ticket para &quot;' + rifa.title + '&quot; — faça login para participar!')">Comprar Ticket</button>
        </div>
      </div>
      <div style="font-size:10px;color:#444;text-align:center;padding:4px 0">
        Tickets adquiridos com Tokoins. Sorteio no último dia do mês.
      </div>
    </div>
  </OsWindow>
</template>
<script setup>
import OsWindow from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop'
const store = useDesktopStore()
const rifas = [
  { icon:'🎮', title:'Chave Steam — Surpresa', sub:'Sorteio mensal',    tickets:47, max:100, price:200 },
  { icon:'👾', title:'Chave Epic — Surpresa',  sub:'Encerra em 8 dias', tickets:23, max:50,  price:300 },
]
</script>
