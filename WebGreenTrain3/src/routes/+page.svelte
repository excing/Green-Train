<script lang="ts">
  import { onMount } from 'svelte';
  import { trains, loading, error, loadTrains } from '$lib/stores/trains';
  import { getTodayInTimezone, addDays } from '$lib/utils/time';
  import { getUpcomingServiceDates } from '$lib/utils/calendar';
  import { Card, Button, Select, Badge, Alert } from '$lib/components';
  import type { ServiceDate } from '$lib/types';

  let selectedDate: string = getTodayInTimezone() as ServiceDate;
  let dateOptions: { value: string; label: string }[] = [];

  onMount(async () => {
    await loadTrains();
    generateDateOptions();
  });

  function generateDateOptions() {
    const options = [];
    for (let i = 0; i < 30; i++) {
      const date = addDays(getTodayInTimezone() as ServiceDate, i);
      options.push({
        value: date,
        label: new Date(date + 'T00:00:00Z').toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          weekday: 'short'
        })
      });
    }
    dateOptions = options;
  }

  function getTrainsForDate(date: string) {
    return $trains.filter(train => {
      if (train.status === 'draft' || train.status === 'archived') return false;
      const serviceDates = getUpcomingServiceDates(train, 30);
      return serviceDates.includes(date as ServiceDate);
    });
  }

  $: trainsForDate = getTrainsForDate(selectedDate);
</script>

<div class="min-h-screen bg-gray-50">
  <!-- 头部 -->
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-4">
      <h1 class="text-2xl font-bold text-gray-900">🚂 绿色列车</h1>
      <p class="text-gray-600 text-sm mt-1">临时陌生人聊天平台</p>
    </div>
  </header>

  <!-- 主内容 -->
  <main class="max-w-6xl mx-auto px-4 py-8">
    <!-- 日期选择 -->
    <div class="mb-8">
      <Select
        label="选择出发日期"
        options={dateOptions}
        bind:value={selectedDate}
      />
    </div>

    <!-- 加载状态 -->
    {#if $loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin text-4xl">⏳</div>
        <p class="text-gray-600 mt-4">加载列车中...</p>
      </div>
    {:else if $error}
      <Alert type="error" title="加载失败">
        {$error}
      </Alert>
    {:else if trainsForDate.length === 0}
      <Alert type="info" title="暂无列车">
        该日期暂无可用列车，请选择其他日期
      </Alert>
    {:else}
      <!-- 列车列表 -->
      <div class="grid gap-4">
        {#each trainsForDate as train (train.id)}
          <Card hoverable class="cursor-pointer hover:shadow-lg transition-shadow">
            <a href="/trains/{train.id}?date={selectedDate}" class="block">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h2 class="text-xl font-bold text-gray-900">{train.name}</h2>
                  <p class="text-gray-600 text-sm mt-1">{train.theme}</p>
                </div>
                <Badge variant="info">
                  {train.status === 'active' ? '运营中' : train.status === 'paused' ? '暂停' : '隐藏'}
                </Badge>
              </div>

              <!-- 站点信息 -->
              <div class="flex items-center gap-4 mb-4 text-sm">
                <div>
                  <p class="text-gray-500">始发站</p>
                  <p class="font-medium text-gray-900">{train.stations[0]?.name}</p>
                </div>
                <div class="text-gray-400">→</div>
                <div>
                  <p class="text-gray-500">终点站</p>
                  <p class="font-medium text-gray-900">{train.stations[train.stations.length - 1]?.name}</p>
                </div>
              </div>

              <!-- 座位和售卖状态 -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div class="text-sm text-gray-600">
                  {train.carriages} 节车厢 · {train.rows_per_carriage} 排 · 5 座/排
                </div>
                <Button size="sm" variant="primary">
                  查看详情
                </Button>
              </div>
            </a>
          </Card>
        {/each}
      </div>
    {/if}
  </main>
</div>


