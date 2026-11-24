import { useCallback, useEffect, useState } from 'react';

export interface Stepper {
  step: number;
  setStep: (n: number) => void;
  playing: boolean;
  togglePlay: () => void;
  reset: () => void;
}

/** Навигация по шагам визуализации с автопроигрыванием. */
export function useStepper(total: number, intervalMs = 900): Stepper {
  const [step, setRaw] = useState(0);
  const [playing, setPlaying] = useState(false);

  const setStep = useCallback(
    (n: number) => setRaw(Math.max(0, Math.min(Math.max(total - 1, 0), n))),
    [total],
  );

  useEffect(() => {
    if (step > total - 1) setRaw(Math.max(total - 1, 0));
  }, [total, step]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setRaw((s) => s + 1), intervalMs);
    return () => clearTimeout(t);
  }, [playing, step, total, intervalMs]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && step >= total - 1) setRaw(0);
      return !p;
    });
  }, [step, total]);

  const reset = useCallback(() => {
    setPlaying(false);
    setRaw(0);
  }, []);

  return { step, setStep, playing, togglePlay, reset };
}
