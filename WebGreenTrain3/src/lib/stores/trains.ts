import { writable } from 'svelte/store';
import type { Train } from '$lib/types';

export const trains = writable<Train[]>([]);
export const loading = writable(false);
export const error = writable<string | null>(null);

export async function loadTrains() {
  loading.set(true);
  error.set(null);
  
  try {
    const response = await fetch('/data/trains.json');
    if (!response.ok) {
      throw new Error('Failed to load trains');
    }
    
    const data = await response.json();
    trains.set(data);
  } catch (err) {
    error.set(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    loading.set(false);
  }
}

