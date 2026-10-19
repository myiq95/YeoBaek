const CACHE='yeobaek-v8-clean';
const CORE=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const req=e.request;
  const url=new URL(req.url);
  const isCDN=url.hostname.includes('cdnjs.cloudflare.com')||url.hostname.includes('fonts.googleapis.com')||url.hostname.includes('fonts.gstatic.com');
  if(req.mode==='navigate' || req.destination==='document' || (req.headers.get('accept')||'').includes('text/html')){
    e.respondWith(fetch(req).then(r=>{ if(r&&r.ok){ const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(req,c)); } return r; }).catch(()=>caches.match('./index.html').then(m=>m||caches.match('./'))));
    return;
  }
  if(isCDN){
    e.respondWith(caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(r=>{ if(r){ const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(req,c)); } return r; }).catch(()=>caches.match(req));
    }));
    return;
  }
  e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{ if(r&&r.ok){ caches.open(CACHE).then(cache=>cache.put(req,r.clone())); } return r; }).catch(()=>cached)));
});