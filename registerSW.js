// Old build loaded this to register the PWA worker. Now it does the opposite.
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){ r.unregister(); }); });
}
