const CACHE='yeobaek-v6';
const CORE=[
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Serif+KR:wght@300;400;600&family=Pretendard:wght@300;400;500&display=swap'
];
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(CORE).catch(err=>{
      // 일부 실패해도 설치 계속 - 폰트 등
      return c.addAll(CORE.slice(0,3));
    })).then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const req=e.request;
  // 네비게이션 요청은 네트워크 우선, 실패시 캐시
  if(req.mode==='navigate' || req.headers.get('accept')?.includes('text/html')){
    e.respondWith(
      fetch(req).then(res=>{
        const clone=res.clone();
        caches.open(CACHE).then(c=>c.put(req, clone));
        return res;
      }).catch(()=>caches.match('./index.html').then(m=>m||caches.match('./')))
    );
    return;
  }
  // 그 외는 캐시 우선, 없으면 네트워크 후 캐시
  e.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(net=>{
        // 유효한 응답만 캐시
        if(net && net.ok){
          const clone=net.clone();
          caches.open(CACHE).then(c=>c.put(req, clone));
        }
        return net;
      }).catch(()=>cached);
    })
  );
});
