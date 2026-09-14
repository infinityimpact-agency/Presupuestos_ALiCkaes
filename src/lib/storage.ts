import { createSeedState } from "./seed";
import type { AppState } from "../types";

const KEY = "alicakes.v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.ingredients)) return createSeedState();
    return {
      ...createSeedState(),
      ...parsed,
      settings: { ...createSeedState().settings, ...parsed.settings },
      salary: { ...createSeedState().salary, ...parsed.salary },
    };
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const next = createSeedState();
  saveState(next);
  return next;
}
