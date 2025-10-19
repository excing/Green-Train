<script lang="ts">
  import type { Train } from '../types';
  import { formatTime, formatTimeOnly, formatDuration, getTrainDurationMinutes, isTrainDeparted } from '../utils';

  export let train: Train;
  export let onClick: () => void;

  const firstStation = train.stations[0];
  const lastStation = train.stations[train.stations.length - 1];
  const duration = getTrainDurationMinutes(train);
  const departed = isTrainDeparted(train);
</script>

<button
  on:click={onClick}
  class="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white p-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 text-left border-2 border-green-800"
>
  <div class="flex justify-between items-start mb-2">
    <div>
      <h3 class="text-lg font-bold">{train.name}</h3>
      <p class="text-sm text-green-100">{train.theme}</p>
    </div>
    <div class="text-right">
      <p class="text-2xl font-bold">{formatTimeOnly(train.departure_time)}</p>
      <p class="text-xs text-green-100">{departed ? '已发车' : '即将发车'}</p>
    </div>
  </div>

  <div class="flex justify-between items-center text-sm mb-3">
    <div class="flex-1">
      <p class="font-semibold">{firstStation.name}</p>
      <p class="text-xs text-green-100">{firstStation.description}</p>
    </div>
    <div class="px-3 text-center">
      <p class="text-xs text-green-100">↓</p>
      <p class="text-xs font-semibold">{formatDuration(duration)}</p>
    </div>
    <div class="flex-1 text-right">
      <p class="font-semibold">{lastStation.name}</p>
      <p class="text-xs text-green-100">{lastStation.description}</p>
    </div>
  </div>

  <div class="flex justify-between items-center text-xs text-green-100">
    <span>🚂 {train.carriages}节车厢</span>
    <span>💺 {train.rows_per_carriage}排座位</span>
    <span class="text-green-200 font-semibold">点击查看详情 →</span>
  </div>
</button>

<style>
  button {
    transition: all 0.3s ease;
  }

  button:active {
    transform: scale(0.98);
  }
</style>

