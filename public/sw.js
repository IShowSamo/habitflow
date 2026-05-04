// HabitFlow Service Worker - handles push notifications

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'HabitFlow', {
      body:  data.body  || '',
      icon:  data.icon  || '/icon-192.png',
      badge: '/icon-192.png',
      data:  { url: data.url || '/' },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open',    title: 'Öffnen' },
        { action: 'dismiss', title: 'Schließen' },
      ]
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(wins => {
      const w = wins.find(w => w.url.includes(self.location.origin))
      if (w) { w.focus(); w.navigate(url) }
      else clients.openWindow(url)
    })
  )
})

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))
