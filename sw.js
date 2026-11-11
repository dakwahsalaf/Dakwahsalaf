// Versi cache ini tidak perlu dinaikkan lagi: berkas selalu diambil dari jaringan lebih dulu
// (dan diperiksa ulang ke server), cache hanya dipakai saat offline.
const V = "dakwah-shell";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Hanya berkas aplikasi (satu domain) yang disimpan. Video dan API GitHub langsung ke jaringan.
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin) return;
  e.respondWith(
    // no-cache: selalu tanya server dulu (murah bila tidak berubah), jadi tidak tertahan cache browser 10 menit milik GitHub Pages
    fetch(r, {cache: "no-cache"}).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(V).then(c => c.put(r, copy));
      }
      return res;
    }).catch(() => caches.match(r, {ignoreSearch: true}).then(m =>
      m || (r.mode === "navigate" ? caches.match("index.html") : Response.error())
    ))
  );
});
