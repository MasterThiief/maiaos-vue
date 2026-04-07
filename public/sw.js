// public/sw.js
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || '/logo-maiaos.png',
      badge:   '/logo-maiaos.png',
      data:    { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma aba do MaiaOS aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes('maxterlabs.pages.dev') && 'focus' in client) {
          return client.focus()
        }
      }
      // Senão abre uma nova aba
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})