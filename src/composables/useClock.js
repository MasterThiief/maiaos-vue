import { ref, onMounted, onUnmounted } from 'vue'

export function useClock() {
  const time = ref('')
  function update() {
    const n = new Date()
    time.value = String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0')
  }
  let iv
  onMounted(()   => { update(); iv = setInterval(update, 1000) })
  onUnmounted(() => clearInterval(iv))
  return { time }
}
