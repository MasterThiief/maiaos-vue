<template>
  <div class="toast" :class="{ show: store.toast.visible }">
    <div class="t-icon">{{ store.toast.icon }}</div>
    <div>
      <div class="t-title">{{ store.toast.title }}</div>
      <div>{{ store.toast.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { useDesktopStore } from '@/stores/desktop'
const store = useDesktopStore()
</script>
