<script lang="ts">
  import { onMount } from 'svelte';
  import type { Train, Ticket } from '$lib/types';
  import { formatTimeOnly } from '$lib/utils';
  import { currentTicket } from '$lib/store';
  import { page } from '$app/stores';
    import { goto } from '$app/navigation';

  let train: Train | null = null;
  let ticket: Ticket | null = null;
  let loading = true;
  let error = '';
  let countdown = 5;
  let boardingStarted = false;

  onMount(async () => {
    try {
      const trainId = $page.params.id;
      const response = await fetch('/data/trains.json');
      if (!response.ok) throw new Error('Failed to load trains');
      const trains: Train[] = await response.json();
      train = trains.find(t => t.id === trainId);
      if (!train) throw new Error('Train not found');

      // Get ticket from store
      currentTicket.subscribe(t => {
        ticket = t;
      });

      if (!ticket) throw new Error('No ticket found');

      loading = false;

      // Start countdown
      const interval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(interval);
          boardingStarted = true;
          setTimeout(() => {
            goto(`/chat/${train?.id}`);
          }, 1000);
        }
      }, 1000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });

  function handleBoardNow() {
    if (train) {
      goto(`/chat/${train.id}`);
    }
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-700 p-4 flex items-center justify-center">
  <div class="max-w-2xl mx-auto w-full">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-white text-xl">加载中...</p>
      </div>
    {:else if error}
      <div class="bg-red-500/20 border border-red-400 text-red-100 p-4 rounded-lg">
        <p>错误: {error}</p>
      </div>
    {:else if train && ticket}
      <div class="text-center">
        <!-- Waiting Room Header -->
        <h1 class="text-4xl font-bold text-white mb-2">🚂 候车室</h1>
        <p class="text-green-100 text-lg mb-8">列车即将发车，请准备上车</p>

        <!-- Ticket Display -->
        <div class="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg p-8 mb-8 shadow-2xl border-4 border-yellow-400 transform perspective">
          <!-- Ticket Header -->
          <div class="text-center mb-6 pb-6 border-b-2 border-dashed border-yellow-400">
            <p class="text-yellow-800 font-bold text-sm">绿皮车 纪念车票</p>
            <p class="text-yellow-600 text-xs">SOUVENIR TICKET</p>
          </div>

          <!-- Train Info -->
          <div class="mb-6">
            <p class="text-yellow-600 text-xs font-semibold mb-1">车次</p>
            <p class="text-2xl font-bold text-yellow-900">{ticket.trainName}</p>
            <p class="text-yellow-700 text-sm mt-2">{ticket.theme}</p>
          </div>

          <!-- Journey Info -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p class="text-yellow-600 text-xs font-semibold mb-1">上车站</p>
              <p class="text-lg font-bold text-yellow-900">{ticket.boardingStation}</p>
              <p class="text-yellow-700 text-xs">{formatTimeOnly(ticket.boardingTime)}</p>
            </div>
            <div class="flex items-center justify-center">
              <p class="text-2xl text-yellow-600">→</p>
            </div>
            <div>
              <p class="text-yellow-600 text-xs font-semibold mb-1">下车站</p>
              <p class="text-lg font-bold text-yellow-900">{ticket.alightingStation}</p>
              <p class="text-yellow-700 text-xs">{formatTimeOnly(ticket.alightingTime)}</p>
            </div>
          </div>

          <!-- Seat Info -->
          <div class="bg-yellow-200/50 rounded-lg p-4 mb-6 border-2 border-yellow-400">
            <p class="text-yellow-600 text-xs font-semibold mb-2">座位</p>
            <p class="text-3xl font-bold text-yellow-900">{ticket.seatDisplay}</p>
          </div>

          <!-- Ticket Footer -->
          <div class="text-center pt-6 border-t-2 border-dashed border-yellow-400">
            <p class="text-yellow-600 text-xs">票号: {ticket.id}</p>
            <p class="text-yellow-600 text-xs">购票时间: {new Date(ticket.bookingTime).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        <!-- Boarding Status -->
        {#if boardingStarted}
          <div class="bg-green-500/20 border border-green-400 text-green-100 p-4 rounded-lg mb-8 animate-pulse">
            <p class="text-lg font-semibold">🚪 列车已开门，请上车！</p>
          </div>
        {:else}
          <div class="bg-blue-500/20 border border-blue-400 text-blue-100 p-4 rounded-lg mb-8">
            <p class="text-lg font-semibold mb-2">列车将在 {countdown} 秒后发车</p>
            <div class="w-full bg-blue-900 rounded-full h-2 overflow-hidden">
              <div
                class="bg-blue-400 h-full transition-all duration-1000"
                style="width: {(countdown / 5) * 100}%"
              ></div>
            </div>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            on:click={handleBoardNow}
            class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🚪 立即上车
          </button>
          <button
            on:click={goBack}
            class="w-full bg-white/10 hover:bg-white/20 text-green-100 font-semibold py-3 rounded-lg transition-colors"
          >
            ← 返回
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>

