export const playTickSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Quick burst oscillator for tactile switch "click"
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // High frequency drop simulates mechanical switch actuation
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      300,
      audioCtx.currentTime + 0.04
    );

    // Ultra-fast decay gives crisp "tik" sensation
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch {
    // AudioContext blocked before first user interaction
  }
};
