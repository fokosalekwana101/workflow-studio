import { useSyncExternalStore } from "react";

/**
 * Lightweight localStorage-backed store for settings, demo metrics and activity.
 * All data is local to this browser and clearly labelled as demo/estimated.
 */

export type Theme = "light" | "dark";
export type ResponseStyle = "concise" | "detailed";
export type EmailTone = "formal" | "direct" | "persuasive";

export type Settings = {
  theme: Theme;
  responseStyle: ResponseStyle;
  defaultTone: EmailTone;
  showNotice: boolean;
};

export type MetricKey = "emails" | "meetings" | "tasks" | "research";

export type Metrics = Record<MetricKey, number> & { minutesSaved: number };

export type Activity = {
  id: string;
  tool: MetricKey | "chat";
  title: string;
  at: number;
};

type State = {
  settings: Settings;
  metrics: Metrics;
  activity: Activity[];
};

/** Estimated minutes saved per generation. Labelled as an estimate in the UI. */
export const TIME_ESTIMATES: Record<MetricKey, number> = {
  emails: 12,
  meetings: 25,
  tasks: 18,
  research: 40,
};

const KEY = "workflow-studio:v1";

const defaultState: State = {
  settings: { theme: "light", responseStyle: "concise", defaultTone: "formal", showNotice: true },
  metrics: { emails: 0, meetings: 0, tasks: 0, research: 0, minutesSaved: 0 },
  activity: [],
};

let state: State = defaultState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = {
        settings: { ...defaultState.settings, ...parsed.settings },
        metrics: { ...defaultState.metrics, ...parsed.metrics },
        activity: parsed.activity ?? [],
      };
    }
  } catch {
    state = defaultState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function set(next: State) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return defaultState;
}

export function useAppStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateSettings(patch: Partial<Settings>) {
  set({ ...state, settings: { ...state.settings, ...patch } });
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: Theme) {
  updateSettings({ theme });
  applyTheme(theme);
}

export function recordGeneration(tool: MetricKey, title: string) {
  const metrics = {
    ...state.metrics,
    [tool]: state.metrics[tool] + 1,
    minutesSaved: state.metrics.minutesSaved + TIME_ESTIMATES[tool],
  };
  const activity = [
    { id: crypto.randomUUID(), tool, title, at: Date.now() },
    ...state.activity,
  ].slice(0, 12);
  set({ ...state, metrics, activity });
}

export function recordChat(title: string) {
  const activity = [
    { id: crypto.randomUUID(), tool: "chat" as const, title, at: Date.now() },
    ...state.activity,
  ].slice(0, 12);
  set({ ...state, activity });
}

export function clearActivityData() {
  set({ ...state, metrics: defaultState.metrics, activity: [] });
}
