const CACHE='yeobaek-v11-yeobaek';
const CORE=['./'];
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(async c=>{
      try{ await c.addAll(CORE); }catch{
        try{ const r=await fetch('./'); if(r.ok) await c.put('./', r); }catch{}
      }
    }).then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const req=e.request;
  const url=new URL(req.url);
  const isCDN=url.hostname.includes('cdnjs.cloudflare.com')||url.hostname.includes('fonts.googleapis.com')||url.hostname.includes('fonts.gstatic.com');
  if(req.mode==='navigate' || req.destination==='document' || (req.headers.get('accept')||'').includes('text/html')){
    e.respondWith(
      fetch(req).then(r=>{
        if(r&&r.ok){ const cl=r.clone(); caches.open(CACHE).then(c=>{c.put(req,cl.clone()); c.put('./',cl.clone());}); }
        return r;
      }).catch(()=>caches.match(req).then(m=>m||caches.match('./')).then(m=>m||caches.match('./index.html')).then(m=>m||caches.match('./Index.html')))
    );
    return;
  }
  if(isCDN){
    e.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{ if(r) caches.open(CACHE).then(ca=>ca.put(req,r.clone())); return r; }).catch(()=>c)));
    return;
  }
  e.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{ if(r&&r.ok) caches.open(CACHE).then(ca=>ca.put(req,r.clone())); return r; }).catch(()=>c)));
});
