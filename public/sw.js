// HireBuzz Service Worker — handles background push notifications

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = {
      title: 'HireBuzz',
      body: event.data.text(),
      url: '/',
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'HireBuzz', {
      body: data.body || 'New Biology teacher jobs in Dubai!',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'hirebuzz-job-alert',
      renotify: true,
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})
