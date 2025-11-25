// midiUtils.js

// Smooths a MIDI value (0–127) toward a target
export function stepTowardMIDI(cur, target, step) {
  const delta = target - cur;
  if (delta === 0) return cur;
  const dir = Math.sign(delta);
  const dist = Math.abs(delta);
  const move = Math.min(Math.abs(step), dist);
  return cur + dir * move;
}

// Clamp any number to MIDI range
export function clampMIDI(value) {
  return Math.max(0, Math.min(127, Math.round(value)));
}
