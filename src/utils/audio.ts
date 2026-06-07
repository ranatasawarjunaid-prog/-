// Simple robust Web Audio API sound generator for cute retro micro-game sounds.
let audioCtx: AudioContext | null = null;
let isMutedValue = false;

// Initialize context lazily on user gesture
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Suppress typescript warning for webkitAudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const setMuted = (muted: boolean) => {
  isMutedValue = muted;
  localStorage.setItem('game_audio_muted', muted ? 'true' : 'false');
};

export const isMuted = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('game_audio_muted');
    if (saved === 'true') {
      isMutedValue = true;
    } else if (saved === 'false') {
      isMutedValue = false;
    }
  }
  return isMutedValue;
};

// Play a perfect synth tone with customizable parameters (frequency, duration, type, glide, envelope)
const playTone = (
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1,
  freqEnd?: number
) => {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

export const playTapSound = () => {
  // Sparky little blip for tapping moving targets
  playTone(800, 0.08, 'sine', 0.15, 1200);
};

export const playCorrectSound = () => {
  // Rising double chime for correct answers
  playTone(523.25, 0.1, 'sine', 0.15); // C5
  setTimeout(() => {
    playTone(659.25, 0.15, 'sine', 0.15); // E5
  }, 100);
};

export const playWrongSound = () => {
  // Downward buzzy tone
  playTone(220, 0.25, 'triangle', 0.2, 110);
};

export const playMatchSound = () => {
  // Chime for memory card match
  playTone(587.33, 0.08, 'sine', 0.1, 880); // D5 to A5 glide
};

export const playUnmatchSound = () => {
  // Dull plastic pop
  playTone(180, 0.1, 'triangle', 0.15, 80);
};

export const playCardFlipSound = () => {
  // Tiny soft flip rustle
  playTone(400, 0.05, 'sine', 0.05, 200);
};

export const playTickSound = () => {
  // Countdown ticker sound
  playTone(1200, 0.03, 'sine', 0.08);
};

export const playSuccessSound = () => {
  // Arpeggio for winning a game
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 0.2, 'sine', 0.15, freq * 1.2);
    }, idx * 100);
  });
};

export const playGameOverSound = () => {
  // Downward sad scale
  const notes = [392.00, 349.23, 311.13, 261.63]; 
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 0.25, 'triangle', 0.15, freq * 0.8);
    }, idx * 150);
  });
};
