import { useState, useMemo, useCallback } from 'react';
import {
  ScamOMeterState,
  INITIAL_SCAMOMETER_STATE,
  evaluateTransactionRisk,
} from '../domain/scamometer.calculator';

export function useScamOMeter() {
  const [state, setState] = useState<ScamOMeterState>(INITIAL_SCAMOMETER_STATE);

  const updateField = useCallback(<K extends keyof ScamOMeterState>(key: K, value: ScamOMeterState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setState(INITIAL_SCAMOMETER_STATE);
  }, []);

  const diagnostic = useMemo(() => evaluateTransactionRisk(state), [state]);

  return {
    state,
    updateField,
    resetAll,
    diagnostic,
  };
}
