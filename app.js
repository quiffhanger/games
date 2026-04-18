// Hub entry point. Registers the service worker and surfaces its version.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((err) => console.warn('SW registration failed:', err));

    navigator.serviceWorker.ready.then((reg) => {
      const sw = reg.active || navigator.serviceWorker.controller;
      if (!sw) return;
      const onMsg = (e) => {
        if (e.data && e.data.type === 'VERSION') {
          const el = document.getElementById('sw-version');
          if (el) el.textContent = `cache ${e.data.version}`;
          navigator.serviceWorker.removeEventListener('message', onMsg);
        }
      };
      navigator.serviceWorker.addEventListener('message', onMsg);
      sw.postMessage('GET_VERSION');
    });
  });
}
