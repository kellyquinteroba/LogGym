/**
 * Simple Web Audio API beeper for gym rest timer
 */
export function playBeep(freq = 600, duration = 0.15) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.debug('Audio not allowed or not supported yet', e);
  }
}

export function playRestCompleteSound() {
  playBeep(523.25, 0.12); // C5
  setTimeout(() => playBeep(659.25, 0.12), 140); // E5
  setTimeout(() => playBeep(783.99, 0.25), 280); // G5
}
