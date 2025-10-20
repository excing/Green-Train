<script lang="ts">
  import { onMount } from 'svelte';
  import type { Train } from '$lib/types';
  import { getPublicTrains, searchTrains, sortTrainsByNextDeparture } from '$lib/trains';
  import { getNowISO } from '$lib/time';

  let trains: Train[] = [];
  let filteredTrains: Train[] = [];
  let searchQuery = '';
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      trains = await getPublicTrains();
      trains = await sortTrainsByNextDeparture(trains, getNowISO());
      filteredTrains = trains;
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load trains';
      loading = false;
    }
  });

  async function handleSearch() {
    if (!searchQuery.trim()) {
      filteredTrains = trains;
      return;
    }
    filteredTrains = await searchTrains(searchQuery);
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deprecated':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-red-100 text-red-800';
      case 'hidden':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return '运营中';
      case 'deprecated':
        return '即将下线';
      case 'paused':
        return '暂停中';
      case 'hidden':
        return '隐藏';
      default:
        return status;
    }
  }
</script>

<div class="min-h-screen" style="background-color: var(--color-train-cream);">
  <!-- 头部 -->
  <header class="sticky top-0 z-50 shadow-md" style="background-color: var(--color-train-green);">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold text-white mb-4">🚂 绿皮列车</h1>
      <p class="text-green-100">发现有趣的列车之旅</p>
    </div>
  </header>

  <!-- 搜索栏 -->
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="搜索列车主题、站点或时刻..."
        bind:value={searchQuery}
        on:input={handleSearch}
        class="flex-1 px-4 py-3 rounded-lg border-2"
        style="border-color: var(--color-train-light-green); background-color: white;"
      />
    </div>
  </div>

  <!-- 内容区域 -->
  <div class="max-w-6xl mx-auto px-4 pb-12">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-lg" style="color: var(--color-train-green);">加载中...</p>
      </div>
    {:else if error}
      <div class="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-red-800">
        <p>错误: {error}</p>
      </div>
    {:else if filteredTrains.length === 0}
      <div class="text-center py-12">
        <p class="text-lg" style="color: var(--color-train-green);">未找到匹配的列车</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredTrains as train (train.id)}
          <a href="/trains/{train.id}" class="block">
            <div
              class="rounded-lg shadow-lg overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all"
              style="background-color: white; border-left: 4px solid var(--color-train-light-green);"
            >
              <!-- 卡片头部 -->
              <div class="p-4" style="background-color: var(--color-train-lighter-green);">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-xl font-bold text-white">{train.name}</h3>
                  <span class="px-2 py-1 rounded text-xs font-semibold {getStatusBadgeClass(train.status)}">
                    {getStatusText(train.status)}
                  </span>
                </div>
                {#if train.status_note}
                  <p class="text-sm text-green-100">{train.status_note}</p>
                {/if}
              </div>

              <!-- 卡片内容 -->
              <div class="p-4">
                <p class="text-lg font-semibold mb-2" style="color: var(--color-train-green);">
                  {train.theme}
                </p>
                {#if train.description}
                  <p class="text-sm text-gray-600 mb-4 line-clamp-2">
                    {train.description}
                  </p>
                {/if}

                <!-- 站点信息 -->
                <div class="mb-4 text-sm">
                  <p class="font-semibold mb-1" style="color: var(--color-train-green);">路线</p>
                  <p class="text-gray-700">
                    {train.stations[0]?.name} → {train.stations[train.stations.length - 1]?.name}
                  </p>
                </div>

                <!-- 座位信息 -->
                <div class="text-xs text-gray-500 mb-4">
                  <p>{train.carriages} 节车厢 × {train.rows_per_carriage} 排</p>
                </div>

                <!-- 按钮 -->
                <button
                  class="w-full py-2 rounded-lg font-semibold text-white transition-colors"
                  style="background-color: var(--color-train-light-green);"
                  on:click|preventDefault={() => {}}
                >
                  查看详情
                </button>
              </div>
            </div>
          </a>
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

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
  }
</style>
