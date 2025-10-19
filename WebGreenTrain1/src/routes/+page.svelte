<script lang="ts">
  import { onMount } from 'svelte';
  import type { Train } from '$lib/types';
  import { searchTrains, sortTrainsByDeparture } from '$lib/utils';
  import TrainCard from '$lib/components/TrainCard.svelte';
    import { goto } from '$app/navigation';

  let trains: Train[] = [];
  let filteredTrains: Train[] = [];
  let searchQuery = '';
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await fetch('/data/trains.json');
      if (!response.ok) throw new Error('Failed to load trains');
      trains = await response.json();
      filteredTrains = sortTrainsByDeparture(trains);
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });

  function handleSearch() {
    const results = searchTrains(trains, searchQuery);
    filteredTrains = sortTrainsByDeparture(results);
  }

  function handleTrainClick(train: Train) {
    goto(`/train/${train.id}`);
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-700 p-4">
  <!-- Header -->
  <div class="max-w-4xl mx-auto mb-8">
    <div class="text-center py-8">
      <h1 class="text-4xl font-bold text-white mb-2">🚂 绿皮车</h1>
      <p class="text-green-100 text-lg">兴趣匹配的临时性陌生人聊天应用</p>
    </div>

    <!-- Search Bar -->
    <div class="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-green-400/30">
      <div class="flex gap-2">
        <input
          type="text"
          placeholder="搜索车次、主题或站点..."
          bind:value={searchQuery}
          on:input={handleSearch}
          class="flex-1 bg-white/20 text-white placeholder-green-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <button
          on:click={handleSearch}
          class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          搜索
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-4xl mx-auto">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-white text-xl">加载中...</p>
      </div>
    {:else if error}
      <div class="bg-red-500/20 border border-red-400 text-red-100 p-4 rounded-lg">
        <p>错误: {error}</p>
      </div>
    {:else if filteredTrains.length === 0}
      <div class="text-center py-12">
        <p class="text-green-100 text-xl">未找到匹配的车次</p>
      </div>
    {:else}
      <div class="space-y-4">
        <p class="text-green-100 text-sm mb-4">共 {filteredTrains.length} 班车次</p>
        {#each filteredTrains as train (train.id)}
          <TrainCard {train} onClick={() => handleTrainClick(train)} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
