<script lang="ts">
  import { onMount } from 'svelte';
  import type { Train } from '$lib/types';
  import { formatTime, formatTimeOnly, formatDuration, getTrainDurationMinutes } from '$lib/utils';
  import { page } from '$app/stores';
    import { goto } from '$app/navigation';

  let train: Train | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const trainId = $page.params.id;
      const response = await fetch('/data/trains.json');
      if (!response.ok) throw new Error('Failed to load trains');
      const trains: Train[] = await response.json();
      train = trains.find(t => t.id === trainId);
      if (!train) throw new Error('Train not found');
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });

  function handleBooking() {
    if (train) {
      goto(`/booking/${train.id}`);
    }
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-700 p-4">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <button
        on:click={goBack}
        class="text-green-100 hover:text-white mb-4 flex items-center gap-2 transition-colors"
      >
        ← 返回
      </button>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <p class="text-white text-xl">加载中...</p>
      </div>
    {:else if error}
      <div class="bg-red-500/20 border border-red-400 text-red-100 p-4 rounded-lg">
        <p>错误: {error}</p>
      </div>
    {:else if train}
      <!-- Train Info Card -->
      <div class="bg-gradient-to-r from-green-700 to-green-600 rounded-lg p-6 mb-6 border-2 border-green-800 shadow-lg">
        <h1 class="text-3xl font-bold text-white mb-2">{train.name}</h1>
        <p class="text-green-100 text-lg mb-4">{train.theme}</p>
        <p class="text-green-50">{train.description}</p>
      </div>

      <!-- Train Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-green-400/30 text-center">
          <p class="text-green-100 text-sm mb-1">车厢数</p>
          <p class="text-white text-2xl font-bold">{train.carriages}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-green-400/30 text-center">
          <p class="text-green-100 text-sm mb-1">每节座位</p>
          <p class="text-white text-2xl font-bold">{train.rows_per_carriage * 5}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-green-400/30 text-center">
          <p class="text-green-100 text-sm mb-1">旅程时长</p>
          <p class="text-white text-2xl font-bold">{formatDuration(getTrainDurationMinutes(train))}</p>
        </div>
      </div>

      <!-- Stations Timeline -->
      <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-green-400/30 mb-6">
        <h2 class="text-xl font-bold text-white mb-6">🚉 站点信息</h2>
        <div class="space-y-4">
          {#each train.stations as station, index}
            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-4 h-4 bg-green-300 rounded-full border-2 border-white"></div>
                {#if index < train.stations.length - 1}
                  <div class="w-1 h-12 bg-green-400/50"></div>
                {/if}
              </div>
              <div class="flex-1 pb-4">
                <h3 class="text-white font-bold text-lg">{station.name}</h3>
                <p class="text-green-100 text-sm mb-2">{station.description}</p>
                <div class="flex gap-4 text-sm text-green-200">
                  {#if station.departure_time}
                    <span>🚂 发车: {formatTimeOnly(station.departure_time)}</span>
                  {/if}
                  {#if station.arrival_time}
                    <span>🛑 到站: {formatTimeOnly(station.arrival_time)}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Booking Button -->
      <button
        on:click={handleBooking}
        class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-4 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        🎫 立即购票
      </button>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>

