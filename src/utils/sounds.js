/**
 * Sound notifications using the Web Audio API — no external files needed.
 * All tones are synthesised in-browser.
 */

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume context if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const note = (ctx, freq, startTime, duration, volume = 0.22, type = 'sine') => {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
};

/**
 * Plays a pleasant two-note ping when a customer message arrives.
 * C5 → E5 arpeggio (200ms total, soft sine)
 */
export const playMessageTone = () => {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;
    note(ctx, 523, t,        0.18);  // C5
    note(ctx, 659, t + 0.12, 0.20);  // E5
  } catch (e) {
    // Silently fail on unsupported browsers
  }
};

/**
 * Plays a gentle notification pop for non-urgent alerts.
 */
export const playNotifPop = () => {
  try {
    const ctx = getCtx();
    note(ctx, 880, ctx.currentTime, 0.12, 0.15);
  } catch (e) {}
};

/**
 * Plays an "assigned" confirmation sound.
 * Three ascending notes.
 */
export const playAssignTone = () => {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;
    note(ctx, 440, t,        0.12, 0.18);  // A4
    note(ctx, 550, t + 0.1,  0.12, 0.18);  // C#5
    note(ctx, 660, t + 0.2,  0.18, 0.20);  // E5
  } catch (e) {}
};
