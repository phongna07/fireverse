// Ringing sounds generated with Web Audio, so no audio assets are needed.
// Browsers may block audio until the user has interacted with the page; the
// tone is then silent and the call UI still shows.

let context: AudioContext | null = null;

const getContext = () => {
  if (!context) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === "suspended") void context.resume().catch(() => {});
  return context;
};

const beep = (
  ctx: AudioContext,
  frequencies: number[],
  start: number,
  duration: number,
  volume: number,
) => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.setValueAtTime(volume, start + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  gain.connect(ctx.destination);

  for (const frequency of frequencies) {
    const oscillator = ctx.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
};

const PATTERNS = {
  // Heard by the person receiving the call
  ringtone: {
    period: 3000,
    play: (ctx: AudioContext, at: number) => {
      beep(ctx, [880, 1320], at, 0.35, 0.12);
      beep(ctx, [880, 1320], at + 0.5, 0.35, 0.12);
    },
  },
  // Heard by the caller while waiting for an answer
  ringback: {
    period: 4000,
    play: (ctx: AudioContext, at: number) =>
      beep(ctx, [440, 480], at, 1.5, 0.06),
  },
};

export type ToneKind = keyof typeof PATTERNS;

/** Starts a repeating tone and returns a function that stops it. */
export const playTone = (kind: ToneKind) => {
  const ctx = getContext();
  if (!ctx) return () => {};

  const pattern = PATTERNS[kind];
  const play = () => {
    try {
      pattern.play(ctx, ctx.currentTime + 0.05);
    } catch {
      // Audio is best-effort
    }
  };

  play();
  const interval = window.setInterval(play, pattern.period);
  return () => window.clearInterval(interval);
};
