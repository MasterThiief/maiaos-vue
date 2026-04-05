<template>
  <div class="mobile-block">
    <div class="mobile-dialog">
      <div class="md-titlebar">
        <svg viewBox="0 0 72 72" fill="none" style="width:16px;height:16px">
          <rect x="2" y="2" width="30" height="30" rx="5" fill="rgba(255,255,255,0.9)"/>
          <rect x="40" y="2" width="30" height="30" rx="5" fill="rgba(255,255,255,0.9)"/>
          <rect x="2" y="40" width="30" height="30" rx="5" fill="rgba(255,255,255,0.9)"/>
          <rect x="40" y="40" width="30" height="30" rx="5" fill="rgba(255,255,255,0.9)"/>
        </svg>
        <span>MaiaOS Professional</span>
      </div>

      <div class="md-icon">🖥️</div>
      <h3>Dispositivo não suportado</h3>
      <p>
        O MaiaOS foi projetado para desktops e notebooks.<br><br>
        Acesse em um computador para a experiência completa do sistema.
      </p>
      <button class="md-ok" @click="dismiss">OK</button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['dismiss'])
function dismiss() { emit('dismiss') }
</script>
