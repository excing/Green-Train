<script lang="ts">
  import { page } from '$app/stores';
  import { trains } from '$lib/stores/trains';
  import { toLocalAbsoluteTime } from '$lib/utils/time';
  import { Card, Button, SeatSelector, Badge } from '$lib/components';
  import type { Seat } from '$lib/utils/seat';

  let train = $derived($trains.find(t => t.id === $page.params.id));
  let fromStationIndex = $state(0);
  let toStationIndex = $state(train?.stations.length ? train.stations.length - 1 : 1);
  let selectedSeat: Seat | null = $state(null);
  let strategy = $state<'sequential' | 'smart_random'>('sequential');

  function formatTime(relTime: string) {
    if (!train) return relTime;
    const serviceDate = ($page.url.searchParams.get('date') || '') as any;
    try {
      return toLocalAbsoluteTime(serviceDate, relTime as any, train.timezone as any);
    } catch {
      return relTime;
    }
  }

  function handleAutoSelect() {
    if (!train) return;
    
    // 这里应该调用实际的选座算法
    // 现在只是演示
    const allSeats = [];
    for (let c = 1; c <= train.carriages; c++) {
      for (let r = 1; r <= train.rows_per_carriage; r++) {
        allSeats.push({ carriage: c, row: r, letter: 'A' as const });
      }
    }
    
    if (allSeats.length > 0) {
      selectedSeat = allSeats[0];
    }
  }

  function handleConfirm() {
    if (!selectedSeat) {
      alert('请选择座位');
      return;
    }
    // 跳转到确认页面
    const params = new URLSearchParams({
      date: $page.url.searchParams.get('date') || '',
      from: fromStationIndex.toString(),
      to: toStationIndex.toString(),
      seat: `${selectedSeat.carriage}-${selectedSeat.row}-${selectedSeat.letter}`
    });
    window.location.href = `/trains/${train?.id}/confirm?${params}`;
  }
</script>

{#if !train}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-600">列车不存在</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- 头部 -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">选择座位</h1>
        <a href="/trains/{train.id}" class="text-blue-600 hover:underline">← 返回</a>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：座位选择 -->
        <div class="lg:col-span-2">
          <SeatSelector
            {train}
            occupiedSeats={new Set()}
            {selectedSeat}
            onSelectSeat={(seat) => (selectedSeat = seat)}
          />
        </div>

        <!-- 右侧：订单摘要 -->
        <div>
          <Card class="sticky top-24">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">订单摘要</h2>

            <!-- 车次信息 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">车次</p>
              <p class="font-semibold text-gray-900">{train.name}</p>
              <p class="text-sm text-gray-600 mt-1">{train.theme}</p>
            </div>

            <!-- 站点信息 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">路线</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-medium text-gray-900">{train.stations[fromStationIndex]?.name}</span>
                <span class="text-gray-400">→</span>
                <span class="font-medium text-gray-900">{train.stations[toStationIndex]?.name}</span>
              </div>
            </div>

            <!-- 时间信息 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">发车时间</p>
              <p class="font-mono text-gray-900 mt-1">
                {formatTime(train.stations[fromStationIndex]?.departure_time || '')}
              </p>
            </div>

            <!-- 座位信息 -->
            <div class="mb-6 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">座位</p>
              {#if selectedSeat}
                <Badge variant="success" class="mt-2">
                  {selectedSeat.carriage} 号车 · {String(selectedSeat.row).padStart(2, '0')} 排 · {selectedSeat.letter} 座
                </Badge>
              {:else}
                <p class="text-sm text-gray-600 mt-2">未选择</p>
              {/if}
            </div>

            <!-- 选座策略 -->
            <div class="mb-6">
              <p class="text-sm text-gray-500 mb-2">选座策略</p>
              <div class="flex gap-2">
                <button
                  onclick={() => (strategy = 'sequential')}
                  class={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    strategy === 'sequential'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  顺序
                </button>
                <button
                  onclick={() => (strategy = 'smart_random')}
                  class={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    strategy === 'smart_random'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  智能
                </button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                class="w-full mt-2"
                onclick={handleAutoSelect}
              >
                自动选座
              </Button>
            </div>

            <!-- 确认按钮 -->
            <Button
              variant="primary"
              size="lg"
              class="w-full"
              disabled={!selectedSeat}
              onclick={handleConfirm}
            >
              确认选座
            </Button>
          </Card>
        </div>
      </div>
    </main>
  </div>
{/if}

