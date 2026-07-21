// Self-destroying service worker — replaces the old cached PWA worker.
// Every device that opens the app re-downloads this, unregisters itself,
// clears all caches, and reloads pages with the fresh version.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll({type:'window'}); })
      .then(function(clients){ clients.forEach(function(c){ c.navigate(c.url); }); })
  );
});
