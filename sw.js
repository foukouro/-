const CACHE='v4';

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll([
  '/',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json'
 ])));
});

self.addEventListener('activate',e=>{
 e.waitUntil(
  caches.keys().then(keys=>Promise.all(
    keys.map(k=>k!==CACHE && caches.delete(k))
  ))
 );
});

self.addEventListener('fetch',e=>{
 e.respondWith(
  caches.match(e.request).then(r=>r || fetch(e.request))
 );
});

// Обработчик для клика по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Если уже есть открытое окно, фокусируемся на нем
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// push (заготовка для будущих push-уведомлений с сервера)
self.addEventListener('push', event => {
 const data = event.data ? event.data.text() : "Новое уведомление";
 event.waitUntil(
   self.registration.showNotification("Push сообщение", {
     body: data,
     icon: 'icons/icon-128x128.png',
     badge: 'icons/icon-128x128.png',
     vibrate: [200, 100, 200],
     requireInteraction: true
   })
 );
});