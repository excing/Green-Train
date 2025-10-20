import type { PageLoad } from './$types';
import type { Train } from '$lib/types/trains';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/data/trains.json');
  if (!res.ok) {
    return { trains: [] as Train[] };
  }
  const trains = (await res.json()) as Train[];
  return { trains };
};
