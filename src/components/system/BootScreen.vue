<template>
  <div class="boot-screen" :class="{ 'fade-out': fading }">
    <div class="boot-logo">
      <div class="boot-icon">
        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="none">
          <rect x="2"  y="2"  width="30" height="30" rx="5" fill="#0078D7"/>
          <line x1="12" y1="12" x2="22" y2="12" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <line x1="12" y1="17" x2="22" y2="17" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <line x1="12" y1="22" x2="18" y2="22" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <circle cx="12" cy="12" r="2" fill="#fff"/>
          <circle cx="22" cy="22" r="2" fill="#fff"/>
          <rect x="40" y="2"  width="30" height="30" rx="5" fill="#0078D7"/>
          <circle cx="50" cy="12" r="3" stroke="#fff" stroke-width="1.5"/>
          <line x1="50" y1="16" x2="50" y2="26" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <line x1="50" y1="22" x2="60" y2="22" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <circle cx="60" cy="22" r="2" fill="#fff"/>
          <rect x="2"  y="40" width="30" height="30" rx="5" fill="#0078D7"/>
          <line x1="12" y1="50" x2="22" y2="50" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <line x1="22" y1="50" x2="22" y2="62" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <circle cx="12" cy="62" r="2" fill="#fff"/>
          <rect x="40" y="40" width="30" height="30" rx="5" fill="#0078D7"/>
          <line x1="50" y1="50" x2="60" y2="50" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <line x1="50" y1="50" x2="50" y2="62" stroke="#fff" stroke-width="1.5" opacity="0.8"/>
          <circle cx="60" cy="62" r="2" fill="#fff"/>
          <circle cx="50" cy="56" r="2" fill="#fff"/>
        </svg>
      </div>
      <div class="boot-text">
        <span class="boot-brand">MaxterLabs</span>
        <div style="display:flex;align-items:baseline;gap:0">
          <span class="boot-name">Maia<span>OS</span></span>
          <sup style="color:#888;font-size:12px;margin-left:2px">™</sup>
        </div>
        <span class="boot-edition">Professional</span>
      </div>
    </div>

    <div class="boot-loader">
      <div class="boot-loader-inner">
        <div class="boot-dot"></div>
        <div class="boot-dot"></div>
        <div class="boot-dot"></div>
      </div>
    </div>

    <div class="boot-copy">Copyright © MaxterLabs — MaiaOS Professional</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDesktopStore } from '@/stores/desktop'

const store  = useDesktopStore()
const fading = ref(false)

onMounted(() => {
  setTimeout(() => {
    fading.value = true
    setTimeout(() => {
      store.boot()
      setTimeout(() => store.showToast('🤖', 'Bem-vindo ao MaiaOS Professional!'), 300)
    }, 900)
  }, 3200)
})
</script>
