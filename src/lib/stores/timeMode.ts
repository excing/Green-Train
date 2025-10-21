import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { TimeMode } from '$lib/types';

const KEY = 'gt-time-mode';

function createStore() {
  let initial: TimeMode = 'local';
  if (browser) {
    const saved = window.localStorage.getItem(KEY) as TimeMode | null;
    if (saved === 'local' || saved === 'train_tz') initial = saved;
  }
  const store = writable<TimeMode>(initial);
  if (browser) {
    store.subscribe((v) => {
      window.localStorage.setItem(KEY, v);
    });
  }
  return store;
}

export const timeMode = createStore();
