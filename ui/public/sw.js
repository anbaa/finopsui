/* Service worker: polls /version.json every 60s and reloads clients when version changes */
let currentVersion = null;

async function checkVersion() {
  try {
    const resp = await fetch('/version.json', { cache: 'no-store' });
    if (!resp.ok) return;
    const { version } = await resp.json();
    if (currentVersion === null) {
      currentVersion = version;
      return;
    }
    if (version !== currentVersion) {
      currentVersion = version;
      await self.skipWaiting();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    }
  } catch {
    // Network error — ignore
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  setInterval(checkVersion, 60_000);
  checkVersion();
});
