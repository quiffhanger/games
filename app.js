// Hub entry point. Registers the service worker.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
