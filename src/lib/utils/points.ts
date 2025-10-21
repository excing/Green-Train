import type { TrainStation } from '$lib/types/trains';

export function computePointsCost(stations: TrainStation[], fromIndex: number, toIndex: number): number {
  let sum = 0;
  for (let k = fromIndex + 1; k <= toIndex; k++) {
    const p = stations[k]?.points ?? 0;
    sum += p;
  }
  return sum;
}
