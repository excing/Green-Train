<script lang="ts">
  import { onMount } from 'svelte';
  import type { Train, Seat } from '$lib/types';
  import { formatTimeOnly, createTicket, getRandomSeat } from '$lib/utils';
  import { currentTicket } from '$lib/store';
  import { page } from '$app/stores';
    import { goto } from '$app/navigation';

  let train: Train | null = null;
  let loading = true;
  let error = '';
  let selectedBoardingIndex = 0;
  let selectedAlightingIndex = 1;
  let selectedSeat: Seat | null = null;
  let showSeatSelector = false;

  onMount(async () => {
    try {
      const trainId = $page.params.id;
      const response = await fetch('/data/trains.json');
      if (!response.ok) throw new Error('Failed to load trains');
      const trains: Train[] = await response.json();
      train = trains.find(t => t.id === trainId);
      if (!train) throw new Error('Train not found');
      selectedSeat = getRandomSeat(train);
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });

  function handleRandomSeat() {
    if (train) {
      selectedSeat = getRandomSeat(train);
    }
  }

  function handleBooking() {
    if (!train || selectedSeat === null) return;

    const boardingStation = train.stations[selectedBoardingIndex];
    const alightingStation = train.stations[selectedAlightingIndex];

    const ticket = createTicket(
      train.id,
      train.name,
      train.theme,
      boardingStation.name,
      alightingStation.name,
      boardingStation.departure_time || train.departure_time,
      alightingStation.arrival_time || train.departure_time,
      selectedSeat
    );

    currentTicket.set(ticket);
    goto(`/waiting/${train.id}`);
  }

  function goBack() {
    window.history.back();
  }

  $: if (selectedAlightingIndex <= selectedBoardingIndex && train) {
    selectedAlightingIndex = selectedBoardingIndex + 1;
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-700 p-4">
  <div class="max-w-2xl mx-auto">
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
      <h1 class="text-3xl font-bold text-white mb-6">🎫 购票</h1>

      <!-- Train Info -->
      <div class="bg-gradient-to-r from-green-700 to-green-600 rounded-lg p-4 mb-6 border-2 border-green-800">
        <h2 class="text-xl font-bold text-white">{train.name}</h2>
        <p class="text-green-100">{train.theme}</p>
      </div>

      <!-- Station Selection -->
      <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-green-400/30 mb-6">
        <h3 class="text-lg font-bold text-white mb-4">选择上下车站</h3>

        <div class="space-y-4">
          <!-- Boarding Station -->
          <div>
            <label class="block text-green-100 text-sm font-semibold mb-2">上车站</label>
            <select
              bind:value={selectedBoardingIndex}
              class="w-full bg-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {#each train.stations as station, index}
                <option value={index} class="bg-green-900">
                  {station.name} - {station.description}
                </option>
              {/each}
            </select>
          </div>

          <!-- Alighting Station -->
          <div>
            <label class="block text-green-100 text-sm font-semibold mb-2">下车站</label>
            <select
              bind:value={selectedAlightingIndex}
              class="w-full bg-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {#each train.stations as station, index}
                {#if index > selectedBoardingIndex}
                  <option value={index} class="bg-green-900">
                    {station.name} - {station.description}
                  </option>
                {/if}
              {/each}
            </select>
          </div>
        </div>

        <!-- Journey Summary -->
        <div class="mt-4 p-3 bg-green-900/50 rounded-lg border border-green-400/30">
          <p class="text-green-100 text-sm">
            <span class="font-semibold">{train.stations[selectedBoardingIndex].name}</span>
            <span class="mx-2">→</span>
            <span class="font-semibold">{train.stations[selectedAlightingIndex].name}</span>
          </p>
        </div>
      </div>

      <!-- Seat Selection -->
      <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-green-400/30 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-white">选择座位</h3>
          <button
            on:click={handleRandomSeat}
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            🎲 随机分配
          </button>
        </div>

        {#if selectedSeat}
          <div class="bg-green-900/50 rounded-lg p-4 border-2 border-green-400">
            <p class="text-green-100 text-sm mb-2">当前座位</p>
            <p class="text-white text-2xl font-bold">
              {selectedSeat.carriage}车厢 {String(selectedSeat.row).padStart(2, '0')}{selectedSeat.seat}
            </p>
            <p class="text-green-200 text-sm mt-2">
              第 {selectedSeat.carriage} 节车厢，第 {selectedSeat.row} 排，{selectedSeat.seat} 座
            </p>
          </div>
        {/if}
      </div>

      <!-- Booking Summary -->
      <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-green-400/30 mb-6">
        <h3 class="text-lg font-bold text-white mb-4">预订摘要</h3>
        <div class="space-y-2 text-green-100 text-sm">
          <p><span class="font-semibold">车次:</span> {train.name}</p>
          <p><span class="font-semibold">主题:</span> {train.theme}</p>
          <p><span class="font-semibold">上车:</span> {train.stations[selectedBoardingIndex].name}</p>
          <p><span class="font-semibold">下车:</span> {train.stations[selectedAlightingIndex].name}</p>
          {#if selectedSeat}
            <p><span class="font-semibold">座位:</span> {selectedSeat.carriage}车厢 {String(selectedSeat.row).padStart(2, '0')}{selectedSeat.seat}</p>
          {/if}
        </div>
      </div>

      <!-- Booking Button -->
      <button
        on:click={handleBooking}
        disabled={!selectedSeat}
        class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        ✓ 确认购票
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

