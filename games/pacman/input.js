// Input: swipe on canvas, on-screen d-pad, and keyboard.
// Dispatches direction strings ('up' | 'down' | 'left' | 'right') via onDir.

export function bindInput({ canvas, dpad, onDir }) {
  // --- D-pad ------------------------------------------------------------
  const buttons = dpad.querySelectorAll('[data-dir]');
  buttons.forEach((btn) => {
    const dir = btn.getAttribute('data-dir');
    const press = (e) => {
      e.preventDefault();
      onDir(dir);
      btn.setAttribute('data-active', 'true');
    };
    const release = () => btn.removeAttribute('data-active');
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
    // Prevent accidental text selection / long-press menus.
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // --- Swipe ------------------------------------------------------------
  let touchStart = null;
  const SWIPE_THRESHOLD = 20;

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  canvas.addEventListener(
    'touchend',
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        onDir(dx > 0 ? 'right' : 'left');
      } else {
        onDir(dy > 0 ? 'down' : 'up');
      }
    },
    { passive: true }
  );

  // --- Keyboard ---------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        onDir('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        onDir('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        onDir('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        onDir('right');
        break;
      default:
        return;
    }
    e.preventDefault();
  });
}
