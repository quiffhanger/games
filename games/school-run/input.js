// Input handling for School Run platformer.
// Landscape layout: left/right buttons on left thumb, jump button on right thumb.
// Also supports keyboard (arrows + space/Z).
//
// Exposes a live state object: { left, right, jump, jumpPressed }
// jumpPressed stays true for a short buffer window so rapid/early taps aren't lost.

export function bindInput() {
  const JUMP_BUFFER = 0.12; // seconds to buffer a jump press

  const state = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,   // true when a jump was recently requested
    _jumpBuffer: 0,       // remaining buffer time (seconds)
    _jumpWas: false,       // previous raw jump state (for edge detect)
  };

  // --- D-pad / action buttons (any [data-action] on the page) -----------
  function applyBtn(action, down) {
    if (action === 'left')  state.left  = down;
    if (action === 'right') state.right = down;
    if (action === 'jump')  state.jump  = down;
  }

  // Use pointer events for buttons. Track per-pointer for multi-touch.
  const activePointers = new Map(); // pointerId -> action

  document.querySelectorAll('[data-action]').forEach((btn) => {
    const action = btn.dataset.action;

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, action);
      applyBtn(action, true);
      btn.setAttribute('data-active', 'true');
    });

    const release = (e) => {
      if (activePointers.get(e.pointerId) === action) {
        activePointers.delete(e.pointerId);
        applyBtn(action, false);
        btn.removeAttribute('data-active');
      }
    };

    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // --- Keyboard ----------------------------------------------------------
  function keyAction(e, down) {
    switch (e.key) {
      case 'ArrowLeft':  case 'a': case 'A': state.left  = down; break;
      case 'ArrowRight': case 'd': case 'D': state.right = down; break;
      case 'ArrowUp': case 'w': case 'W':
      case ' ': case 'z': case 'Z':          state.jump  = down; break;
      default: return;
    }
    e.preventDefault();
  }

  window.addEventListener('keydown', (e) => { if (!e.repeat) keyAction(e, true); });
  window.addEventListener('keyup',   (e) => keyAction(e, false));

  // --- Per-frame update (call at start of each game frame) ---------------
  // dt = frame delta in seconds
  state.update = function (dt) {
    // Edge-detect: new press starts/restarts the buffer
    const justPressed = state.jump && !state._jumpWas;
    if (justPressed) {
      state._jumpBuffer = JUMP_BUFFER;
    }
    state._jumpWas = state.jump;

    // jumpPressed is true while the buffer is active
    state.jumpPressed = state._jumpBuffer > 0;

    // Tick down buffer
    if (state._jumpBuffer > 0) {
      state._jumpBuffer -= (dt || 0.016);
    }
  };

  // Called by physics after a jump is consumed so the buffer doesn't re-trigger
  state.consumeJump = function () {
    state._jumpBuffer = 0;
    state.jumpPressed = false;
  };

  return state;
}
