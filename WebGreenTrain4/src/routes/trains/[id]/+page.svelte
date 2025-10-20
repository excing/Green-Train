<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Train, DateString } from '$lib/types';
  import { getTrainById } from '$lib/trains';
  import { computeServiceDates } from '$lib/calendar';
  import { toLocalAbsoluteTime, getTodayString } from '$lib/time';
  import { DateTime } from 'luxon';

  let train: Train | null = null;
  let loading = true;
  let error: string | null = null;
  let selectedDate: DateString | null = null;
  let serviceDates: DateString[] = [];

  onMount(async () => {
    try {
      const trainId = $page.params.id || '';
      train = await getTrainById(trainId);
      
      if (!train) {
        error = '列车不存在';
        loading = false;
        return;
      }

      // 计算未来 90 天的运行日
      const today = getTodayString(train.timezone);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 90);
      const endDateStr = endDate.toISOString().split('T')[0] as DateString;

      serviceDates = computeServiceDates(train, today, endDateStr);
      if (serviceDates.length > 0) {
        selectedDate = serviceDates[0];
      }

      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load train';
      loading = false;
    }
  });

  function formatTime(relativeTime: string, serviceDate: DateString, timezone: string): string {
    try {
      const iso = toLocalAbsoluteTime(serviceDate, relativeTime as any, timezone);
      const dt = DateTime.fromISO(iso);
      return dt.toFormat('HH:mm');
    } catch {
      return relativeTime;
    }
  }

  function formatDate(dateStr: DateString): string {
    const dt = DateTime.fromISO(dateStr);
    return dt.toFormat('yyyy-MM-dd (ccc)', { locale: 'zh-CN' });
  }
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--color-train-cream);">
    <p class="text-lg" style="color: var(--color-train-green);">加载中...</p>
  </div>
{:else if error || !train}
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--color-train-cream);">
    <div class="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-red-800">
      <p>错误: {error || '列车不存在'}</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen" style="background-color: var(--color-train-cream);">
    <!-- 返回按钮 -->
    <div class="max-w-4xl mx-auto px-4 py-4">
      <a href="/" class="text-blue-600 hover:text-blue-800">← 返回列表</a>
    </div>

    <!-- 列车信息头 -->
    <div class="max-w-4xl mx-auto px-4 mb-6">
      <div class="rounded-lg shadow-lg p-6" style="background-color: var(--color-train-light-green);">
        <h1 class="text-3xl font-bold text-white mb-2">{train.name}</h1>
        <p class="text-xl text-green-100 mb-4">{train.theme}</p>
        {#if train.description}
          <p class="text-green-50">{train.description}</p>
        {/if}
      </div>
    </div>

    <!-- 日期选择 -->
    <div class="max-w-4xl mx-auto px-4 mb-6">
      <h2 class="text-xl font-bold mb-3" style="color: var(--color-train-green);">选择出发日期</h2>
      <div class="flex gap-2 overflow-x-auto pb-2">
        {#each serviceDates.slice(0, 14) as date (date)}
          <button
            on:click={() => (selectedDate = date)}
            class="px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors"
            style={selectedDate === date
              ? `background-color: var(--color-train-light-green); color: white;`
              : `background-color: white; color: var(--color-train-green); border: 2px solid var(--color-train-light-green);`}
          >
            {formatDate(date)}
          </button>
        {/each}
      </div>
    </div>

    <!-- 站点时间轴 -->
    {#if selectedDate}
      <div class="max-w-4xl mx-auto px-4 mb-6">
        <h2 class="text-xl font-bold mb-4" style="color: var(--color-train-green);">站点信息</h2>
        <div class="space-y-4">
          {#each train.stations as station, index (index)}
            <div class="flex gap-4">
              <!-- 时间轴 -->
              <div class="flex flex-col items-center">
                <div
                  class="w-4 h-4 rounded-full"
                  style="background-color: var(--color-train-light-green);"
                ></div>
                {#if index < train.stations.length - 1}
                  <div
                    class="w-1 h-16"
                    style="background-color: var(--color-train-pale-green);"
                  ></div>
                {/if}
              </div>

              <!-- 站点信息 -->
              <div class="flex-1 pb-4">
                <h3 class="text-lg font-bold" style="color: var(--color-train-green);">
                  {station.name}
                </h3>
                {#if station.description}
                  <p class="text-sm text-gray-600 mb-2">{station.description}</p>
                {/if}

                <div class="flex gap-4 text-sm">
                  {#if station.arrival_time}
                    <div>
                      <span class="font-semibold" style="color: var(--color-train-green);">到达:</span>
                      <span>{formatTime(station.arrival_time, selectedDate, train.timezone)}</span>
                    </div>
                  {/if}
                  {#if station.departure_time}
                    <div>
                      <span class="font-semibold" style="color: var(--color-train-green);">发车:</span>
                      <span>{formatTime(station.departure_time, selectedDate, train.timezone)}</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- 购票按钮 -->
      <div class="max-w-4xl mx-auto px-4 mb-12">
        <a href="/trains/{train.id}/book?date={selectedDate}" class="block">
          <button
            class="w-full py-3 rounded-lg font-bold text-white text-lg transition-colors hover:opacity-90"
            style="background-color: var(--color-train-light-green);"
          >
            购票
          </button>
        </a>
      </div>
    {/if}
  </div>
{/if}

