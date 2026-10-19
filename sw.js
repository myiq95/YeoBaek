const CACHE='yeobaek-v9-fix';
// 대문자 파일명(Iindex.html) 때문에 설치 실패하던 문제 해결: CORE는 ./ 만 사용, index.html 하드코딩 제거
const CORE=['./'];
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(async c=>{
      try{ await c.addAll(CORE); }catch(err){
        // 대문자 파일명이어도 ./ 만 캐시되면 됨, 실패시 현재 페이지라도 캐시
        try{ const r=await fetch('./'); if(r.ok) await c.put('./', r); }catch{}
      }
    }).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const req=e.request;
  const url=new URL(req.url);
  const isCDN=url.hostname.includes('cdnjs.cloudflare.com')||url.hostname.includes('fonts.googleapis.com')||url.hostname.includes('fonts.gstatic.com');
  // 네비게이션: 네트워크 우선, 실패시 캐시 - 대소문자 구분 없이 ./ 만 찾음
  if(req.mode==='navigate' || req.destination==='document' || (req.headers.get('accept')||'').includes('text/html')){
    e.respondWith(
      fetch(req).then(r=>{
        if(r&&r.ok){ const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(req,c)); caches.open(CACHE).then(cache=>cache.put('./',c.clone())); }
        return r;
      }).catch(()=>caches.match(req).then(m=>m||caches.match('./')).then(m=>m||caches.match('./index.html')).then(m=>m||caches.match('./Index.html')))
    );
    return;
  }
  if(isCDN){
    e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{ if(r){ caches.open(CACHE).then(cache=>cache.put(req,r.clone())); } return r; }).catch(()=>cached)));
    return;
  }
  e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{ if(r&&r.ok){ caches.open(CACHE).then(cache=>cache.put(req,r.clone())); } return r; }).catch(()=>cached)));
});