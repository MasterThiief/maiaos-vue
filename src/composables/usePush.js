// src/composables/usePush.js
import { API_URL } from '@/config'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePush() {

  // Verifica se o browser suporta push
  function isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Verifica se já está inscrito
  async function isSubscribed() {
    if (!isSupported()) return false
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      return !!sub
    } catch {
      return false
    }
  }

  // Registra o service worker e pede permissão
  async function subscribe(twitchId = null) {
    if (!isSupported()) return { ok: false, reason: 'not_supported' }

    try {
      // Registra o service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Pede permissão
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return { ok: false, reason: 'denied' }

      // Cria a subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Envia para a API
      await fetch(`${API_URL}/api/push/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription, twitchId }),
      })

      return { ok: true }
    } catch (e) {
      console.error('[Push] subscribe error:', e)
      return { ok: false, reason: 'error' }
    }
  }

  // Cancela a subscription
  async function unsubscribe() {
    if (!isSupported()) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    } catch (e) {
      console.error('[Push] unsubscribe error:', e)
    }
  }

  return { isSupported, isSubscribed, subscribe, unsubscribe }
}