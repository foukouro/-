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

// push (заготовка)
self.addEventListener('push', event => {
 const data = event.data ? event.data.text() : "Новое уведомление";
 event.waitUntil(
   self.registration.showNotification("Push сообщение", {
     body: data,
     icon: 'icons/icon-128x128.png'
   })
 );
});
