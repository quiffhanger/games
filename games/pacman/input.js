// Input: swipe on canvas, on-screen d-pad buttons, device tilt, and keyboard.
// Dispatches direction strings ('up' | 'down' | 'left' | 'right') via onDir.
//
// Tilt is an explicit toggle (controlled by pacman.js). When tilt is on,
// d-pad buttons are hidden by CSS and canvas swipes are ignored — it's
// tilt or controls, never both.

export function bindInput({ canvas, onDir }) {
  // --- D-pad buttons (any [data-dir] on the page) ----------------------
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

  // --- Swipe (canvas only; suppressed when tilt is on) -----------------
  let touchStart = null;
  const SWIPE_THRESHOLD = 20;

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (tiltEnabled) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  canvas.addEventListener(
    'touchend',
    (e) => {
      if (tiltEnabled || !touchStart) return;
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
  // Baseline-relative: the current hold angle is treated as neutral, and
  // only tilts beyond a threshold from that neutral emit a direction.
  // The baseline slowly drifts toward the current reading whenever the
  // player is "at rest" (below the threshold), so natural hand movement
  // doesn't require re-calibration — you can hold the phone at whatever
  // angle feels comfortable and tilt from there.
  let baseline = null;
  let lastTiltEmit = 0;
  let tiltEnabled = false;
  const TILT_THRESHOLD = 11;    // degrees from drifting baseline
  const TILT_COOLDOWN = 0.14;   // seconds between emitted directions
  const BASELINE_DRIFT = 0.06;  // per-sample low-pass toward current reading

  function handleTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    // Compensate for screen orientation so pitch/roll are in screen space.
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
    const absP = Math.abs(dp);
    const absR = Math.abs(dr);

    // Below threshold: slowly drift the baseline toward the current
    // reading so the player's current hold becomes the new neutral.
    if (absP < TILT_THRESHOLD && absR < TILT_THRESHOLD) {
      baseline.pitch += (pitch - baseline.pitch) * BASELINE_DRIFT;
      baseline.roll  += (roll  - baseline.roll)  * BASELINE_DRIFT;
      return;
    }

    const now = performance.now() / 1000;
    if (now - lastTiltEmit < TILT_COOLDOWN) return;
    if (absP > absR) {
      onDir(dp > 0 ? 'down' : 'up');
    } else {
      onDir(dr > 0 ? 'right' : 'left');
    }
    lastTiltEmit = now;
  }

  async function enableTilt() {
    if (tiltEnabled) return true;
    if (typeof DeviceOrientationEvent === 'undefined') return false;
    // iOS 13+ requires an explicit permission request. Must be called
    // from a user gesture, which the button click qualifies as.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return false;
      } catch {
        return false;
      }
    }
    baseline = null;                     // re-capture on next sample
    window.addEventListener('deviceorientation', handleTilt);
    tiltEnabled = true;
    return true;
  }

  function disableTilt() {
    if (!tiltEnabled) return;
    window.removeEventListener('deviceorientation', handleTilt);
    tiltEnabled = false;
    baseline = null;
  }

  // Reset baseline when orientation flips so the new hold position is
  // captured fresh.
  window.addEventListener('orientationchange', () => {
    baseline = null;
  });

  return { enableTilt, disableTilt };
}
