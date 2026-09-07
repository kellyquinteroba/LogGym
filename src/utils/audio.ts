/**
 * Web Audio API audio engine for gym rest timer
 */

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Resumes / unlocks audio context on user gesture (click, tap, touch)
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Auto-attach unlock listeners on first user gesture
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
  const handleUnlock = () => {
    unlockAudio();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, handleUnlock));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, handleUnlock, { passive: true }));
}

/**
 * Plays an individual beep
 */
export function playBeep(
  freq = 650,
  duration = 0.12,
  type: OscillatorType = 'triangle',
  volume = 0.35
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.debug('Audio not allowed or failed to play', e);
  }
}

/**
 * Plays a loud, clear, musical gym chime signaling rest is complete.
 * Uses a crisp harmonic fanfare: D5 -> F#5 -> A5 -> D6 with natural bell decay.
 */
export function playRestCompleteSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const notes = [
      { freq: 587.33, delay: 0, duration: 0.18, vol: 0.4 },     // D5
      { freq: 739.99, delay: 140, duration: 0.18, vol: 0.45 },  // F#5
      { freq: 880.00, delay: 280, duration: 0.3, vol: 0.55 },   // A5
      { freq: 1174.66, delay: 420, duration: 0.8, vol: 0.65 },  // D6 (high bell ring)
    ];

    notes.forEach(({ freq, delay, duration, vol }) => {
      setTimeout(() => {
        try {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(vol, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + duration);
        } catch (err) {
          console.debug('Chime note error', err);
        }
      }, delay);
    });
  } catch (e) {
    console.debug('Could not play rest complete sound', e);
  }
}

