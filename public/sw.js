// Seret — Service Worker for Web Push + minimal offline shell

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first for navigation; pass-through otherwise.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => new Response(
        '<!doctype html><meta charset=utf-8><title>Seret — offline</title><body style="background:#000;color:#fff;font-family:sans-serif;padding:40px;text-align:center"><h1>Offline</h1><p>Check your connection and reload.</p>',
        { headers: { 'Content-Type': 'text/html' } }
      ))
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Seret', body: event.data?.text() || '' }; }
  const title = data.title || 'Seret';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/favicon-32.png',
    data: { url: data.url || '/' },
    tag: data.tag || 'seret',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) { if (c.url.includes(target)) return c.focus(); }
      return clients.openWindow(target);
    })
  );
});
