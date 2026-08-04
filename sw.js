// HELL CHANG GO 서비스 워커 — 오프라인 지원
const CACHE = 'hcg-v1';
const CORE = ['./', './index.html', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // 버전 확인 요청은 항상 네트워크 직행 (캐시 개입 금지)
  if (url.searchParams.has('vcheck')) {
    e.respondWith(fetch(e.request));
    return;
  }

  const isIndex = url.origin === location.origin &&
    (url.pathname.endsWith('/') || url.pathname.endsWith('index.html'));

  if (isIndex) {
    // 앱 본체: 네트워크 우선(항상 최신) → 실패 시 캐시(오프라인)
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) {
          const cl = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', cl));
        }
        return res;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    // 아이콘/폰트 등: 캐시 우선 → 백그라운드 갱신
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(cached => {
        const fetchP = fetch(e.request).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const cl = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, cl));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchP;
      })
    );
  }
});

self.addEventListener('message', e => {
  if (e.data === 'clear') {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))));
  }
});
