import type { PageLoad } from './$types';
import type { Train } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/data/trains.json');
  const trains: Train[] = await res.json();
  return { trains };
};
