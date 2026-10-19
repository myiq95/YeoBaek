const CACHE='yeobaek-v16-overflow-fix';
const CORE=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(async c=>{
      try{
        // force fresh fetch for core
        const reqs = CORE.map(u => new Request(u, {cache:'reload'}));
        for(const r of reqs){
          try{
            const res = await fetch(r);
            if(res && res.ok) await c.put(r, res.clone());
          }catch{}
        }
      }catch{}
    }).then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const req=e.request;
  const url=new URL(req.url);
  const isCDN=url.hostname.includes('cdnjs.cloudflare.com')||url.hostname.includes('fonts.googleapis.com')||url.hostname.includes('fonts.gstatic.com');
  const isHTML = req.mode==='navigate' || req.destination==='document' || (req.headers.get('accept')||'').includes('text/html') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if(isHTML){
    // Network first for HTML - critical for delete button fix
    e.respondWith(
      fetch(new Request(req, {cache:'no-store'})).then(r=>{
        if(r&&r.ok){
          const cl=r.clone();
          caches.open(CACHE).then(c=>{c.put(req,cl); c.put('./index.html',cl.clone()); c.put('./',cl.clone());});
        }
        return r;
      }).catch(()=>caches.match(req).then(m=>m||caches.match('./index.html')).then(m=>m||caches.match('./')).then(m=>m))
    );
    return;
  }
  if(isCDN){
    e.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{ if(r&&r.ok) caches.open(CACHE).then(ca=>ca.put(req,r.clone())); return r; }).catch(()=>c)));
    return;
  }
  e.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{ if(r&&r.ok) caches.open(CACHE).then(ca=>ca.put(req,r.clone())); return r; }).catch(()=>c)));
});
