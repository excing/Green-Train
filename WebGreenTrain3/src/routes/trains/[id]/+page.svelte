<script lang="ts">
  import { page } from '$app/stores';
  import { trains } from '$lib/stores/trains';
  import { toLocalAbsoluteTime } from '$lib/utils/time';
  import { getSalesStatus, getTimeUntilClose } from '$lib/utils/sales';
  import { Card, Button, Badge, Alert } from '$lib/components';
  import type { ServiceDate } from '$lib/types';

  let train = $derived($trains.find(t => t.id === $page.params.id));
  let serviceDate = $derived(($page.url.searchParams.get('date') || '') as ServiceDate);
  let now = $state(new Date().toISOString());

  // 更新当前时间
  $effect(() => {
    const interval = setInterval(() => {
      now = new Date().toISOString();
    }, 1000);
    return () => clearInterval(interval);
  });

  function formatTime(relTime: string, date: ServiceDate) {
    try {
      return toLocalAbsoluteTime(date, relTime as any, train?.timezone as any);
    } catch {
      return relTime;
    }
  }

  function getSalesStatusInfo(status: string) {
    const statusMap: Record<string, { color: string; icon: string; text: string }> = {
      available: { color: 'text-green-600', icon: '✓', text: '可购票' },
      'not_started': { color: 'text-yellow-600', icon: '⏳', text: '未开售' },
      closed: { color: 'text-red-600', icon: '✕', text: '已停售' },
      paused: { color: 'text-yellow-600', icon: '⏸', text: '暂停售卖' },
      unavailable: { color: 'text-red-600', icon: '✕', text: '不可用' }
    };
    return statusMap[status] || { color: 'text-gray-600', icon: '?', text: status };
  }
</script>

{#if !train}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-gray-600 text-lg">列车不存在</p>
      <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">返回列表</a>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- 头部 -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{train.name}</h1>
          <p class="text-gray-600 text-sm mt-1">{train.theme}</p>
        </div>
        <a href="/" class="text-blue-600 hover:underline">← 返回</a>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- 基本信息 -->
      <Card class="mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-gray-500 text-sm">车次ID</p>
            <p class="font-semibold text-gray-900">{train.id}</p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">时区</p>
            <p class="font-semibold text-gray-900">{train.timezone || 'Asia/Shanghai'}</p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">车厢数</p>
            <p class="font-semibold text-gray-900">{train.carriages}</p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">每排座位</p>
            <p class="font-semibold text-gray-900">{train.rows_per_carriage} 排 × 5 座</p>
          </div>
        </div>
      </Card>

      <!-- 售卖状态 -->
      {#if serviceDate}
        <Card class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">售卖状态</p>
              <p class="text-lg font-semibold text-gray-900 mt-1">
                {serviceDate}
              </p>
            </div>
            {#if train.stations[0]}
              {@const status = getSalesStatus(train, now as any, serviceDate, 0)}
              {@const statusInfo = getSalesStatusInfo(status)}
              <div class="text-right">
                <Badge variant={status === 'available' ? 'success' : status === 'not_started' ? 'warning' : 'error'}>
                  <span class={statusInfo.color}>{statusInfo.icon} {statusInfo.text}</span>
                </Badge>
                {#if status === 'available'}
                  <p class="text-sm text-gray-600 mt-2">
                    距停售 {Math.floor(getTimeUntilClose(train, now as any, serviceDate, 0) / 60)} 分钟
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        </Card>
      {/if}

      <!-- 站点信息 -->
      <Card class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">站点信息</h2>
        <div class="space-y-4">
          {#each train.stations as station, index (index)}
            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                {#if index < train.stations.length - 1}
                  <div class="w-0.5 h-12 bg-gray-300 my-2"></div>
                {/if}
              </div>
              <div class="flex-1 pb-4">
                <h3 class="font-semibold text-gray-900">{station.name}</h3>
                {#if station.description}
                  <p class="text-sm text-gray-600">{station.description}</p>
                {/if}
                <div class="flex gap-4 mt-2 text-sm">
                  {#if station.departure_time && serviceDate}
                    <div>
                      <span class="text-gray-500">发车:</span>
                      <span class="font-mono text-gray-900">{formatTime(station.departure_time, serviceDate)}</span>
                    </div>
                  {/if}
                  {#if station.arrival_time && serviceDate}
                    <div>
                      <span class="text-gray-500">到达:</span>
                      <span class="font-mono text-gray-900">{formatTime(station.arrival_time, serviceDate)}</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </Card>

      <!-- 购票按钮 -->
      {#if serviceDate && train.stations[0]}
        {@const status = getSalesStatus(train, now as any, serviceDate, 0)}
        <div class="flex gap-4">
          <Button
            variant={status === 'available' ? 'primary' : 'secondary'}
            size="lg"
            disabled={status !== 'available'}
            class="flex-1"
          >
            {status === 'available' ? '购买车票' : status === 'not_started' ? '未开售' : '已停售'}
          </Button>
        </div>
      {/if}
    </main>
  </div>
{/if}

