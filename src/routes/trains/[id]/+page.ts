import type { PageLoad } from './$types';
import type { Train } from '$lib/types';

export const load: PageLoad = async ({ fetch, params, url }) => {
  const res = await fetch('/data/trains.json');
  const trains: Train[] = await res.json();
  const train = trains.find((t) => t.id === params.id);
  return { train, query: Object.fromEntries(url.searchParams) };
};
