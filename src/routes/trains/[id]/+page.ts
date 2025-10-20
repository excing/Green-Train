import type { PageLoad } from './$types';
import type { Train } from '$lib/types/trains';

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch('/data/trains.json');
  const trains = (await res.json()) as Train[];
  const train = trains.find((t) => t.id === params.id);
  return { train: train ?? null };
};
