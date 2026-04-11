// Input: swipe on canvas, on-screen d-pad buttons, device tilt, and keyboard.
// Dispatches direction strings ('up' | 'down' | 'left' | 'right') via onDir.

export function bindInput({ canvas, onDir }) {
  // --- D-pad buttons (any element with data-dir, anywhere in the page) --
  // There can be multiple d-pads (portrait + two landscape clusters).
  const buttons = document.querySelectorAll('[data-dir]');
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

  // --- Device tilt ------------------------------------------------------
  // Reads DeviceOrientationEvent. The first sample becomes the baseline
  // (however the kid is holding the tablet = neutral), and subsequent
  // tilts beyond a threshold emit a direction. Throttled so we don't
  // spam the queue faster than Pac-Man can turn.
  let baseline = null;
  let lastTiltEmit = 0;
  const TILT_THRESHOLD = 14;    // degrees from baseline
  const TILT_COOLDOWN = 0.14;   // seconds

  function handleTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    // Compensate for device orientation so tilt always maps to screen
    // coordinates (up-on-screen = tilt top away).
    const angle =
      (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;
    let pitch, roll;
    switch (angle) {
      case 90:  pitch = -e.gamma; roll = e.beta;   break;
      case 180: pitch = -e.beta;  roll = -e.gamma; break;
      case 270: pitch = e.gamma;  roll = -e.beta;  break;
      default:  pitch = e.beta;   roll = e.gamma;  break;
    }
    if (baseline === null) {
      baseline = { pitch, roll };
      return;
    }
    const dp = pitch - baseline.pitch;
    const dr = roll - baseline.roll;
    const now = performance.now() / 1000;
    if (now - lastTiltEmit < TILT_COOLDOWN) return;
    const absP = Math.abs(dp);
    const absR = Math.abs(dr);
    if (absP < TILT_THRESHOLD && absR < TILT_THRESHOLD) return;
    if (absP > absR) {
      onDir(dp > 0 ? 'down' : 'up');
    } else {
      onDir(dr > 0 ? 'right' : 'left');
    }
    lastTiltEmit = now;
  }

  let tiltEnabled = false;
  async function enableTilt() {
    if (tiltEnabled) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;
    // iOS 13+ requires an explicit permission request from a user gesture.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return;
      } catch {
        return;
      }
    }
    window.addEventListener('deviceorientation', handleTilt);
    tiltEnabled = true;
  }

  // Reset baseline when orientation changes so the new neutral hold
  // position is captured automatically.
  window.addEventListener('orientationchange', () => {
    baseline = null;
  });

  // Try to enable tilt on the first interaction (satisfies iOS permission
  // gesture requirement). Fires exactly once.
  const enableOnce = () => {
    enableTilt();
    window.removeEventListener('pointerdown', enableOnce);
    window.removeEventListener('keydown', enableOnce);
  };
  window.addEventListener('pointerdown', enableOnce);
  window.addEventListener('keydown', enableOnce);
}
