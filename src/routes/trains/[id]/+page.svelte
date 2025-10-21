<!--
  单车次详情页
  功能：
  - 展示列车基本信息和可运行日期
  - 选择服务日期、上车站、下车站
  - 显示区间时刻、积分和全部站点详细时刻表
  - 提供购票入口
-->
<script lang="ts">
  import type { Train, TimeMode } from '$lib/types';
  import { timeMode } from '$lib/stores/timeMode';
  import { getServiceDates } from '$lib/calendar';
  import { computeStationDateTimes, formatLocal, formatTrainTz } from '$lib/time';

  let { data } = $props<{ data: { train?: Train; query: Record<string, string> } }>();
  let train = data.train;
  // 如果未找到列车，显示错误信息
  if (!train) {
    // fallback empty view
  }

  const FUTURE_DAYS = 30; // 查询未来天数
  // 获取列车的可运行日期列表
  let serviceDates = $state<string[]>(train ? getServiceDates(train, FUTURE_DAYS) : []);

  // 从 URL 查询参数恢复选择状态
  let date = $state<string>((data.query['date'] as string) || ''); // 服务日期
  let fromIndex = $state<number>(parseInt((data.query['from'] as string) ?? '0', 10)); // 上车站索引
  let toIndex = $state<number>(parseInt((data.query['to'] as string) ?? String((train?.stations.length ?? 1) - 1), 10)); // 下车站索引

  /**
   * 响应式更新服务日期和站点选择
   */
  $effect(() => {
    if (!train) return;
    // 重新计算服务日期列表
    serviceDates = getServiceDates(train, FUTURE_DAYS);
    // 如果当前日期无效，自动选择首个服务日
    if (!date || !serviceDates.includes(date)) date = serviceDates[0];
    // 防止站点选择顺序错误
    if (fromIndex >= toIndex) toIndex = Math.min((train?.stations.length ?? 1) - 1, fromIndex + 1);
  });

  /**
   * 格式化时间显示
   * @param d Date 实例
   * @param mode 时间显示模式
   */
  function fmtTime(d: Date, mode: TimeMode) {
    return mode === 'local' ? formatLocal(d) : (train ? formatTrainTz(d, train) : '');
  }
</script>

<!-- 错误状态：未找到车次 -->
{#if !train}
  <section class="max-w-4xl mx-auto p-6">
    <div class="text-slate-600">未找到该车次</div>
  </section>
{:else}
  <!-- 车次详情主容器 -->
  <section class="max-w-5xl mx-auto p-6 space-y-6">
    <!-- 车次标题 -->
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-slate-800">{train.name} <span class="text-slate-500 text-base">({train.id})</span></h1>
      <p class="text-slate-600">{train.theme} · {train.description}</p>
    </header>

    <!-- 详情卡片 -->
    <div class="rounded-xl bg-white/80 border p-4 shadow-sm space-y-4">
      <!-- 服务日期选择 -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="text-sm text-slate-600">可运行日（未来{FUTURE_DAYS}天）：</div>
        <div class="flex gap-2 flex-wrap">
          {#each serviceDates as d}
            <button class={`px-3 py-1 rounded-md border ${d === date ? 'bg-[--gt-green] text-white' : ''}`} on:click={() => (date = d)}>{d}</button>
          {/each}
        </div>
        <div class="flex-1" />
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">时间显示</span>
          <button class="border rounded-md px-3 py-1" on:click={() => timeMode.set('local')}>本地</button>
          <button class="border rounded-md px-3 py-1" on:click={() => timeMode.set('train_tz')}>车次时区</button>
        </div>
      </div>

      <!-- 站点选择 -->
      <div class="flex items-end gap-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">上车站</label>
          <select class="border rounded-md px-3 py-2 min-w-40" bind:value={fromIndex}>
            {#each train.stations as s, i}
              <option value={i} disabled={i >= toIndex}>{s.name}</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">到达站</label>
          <select class="border rounded-md px-3 py-2 min-w-40" bind:value={toIndex}>
            {#each train.stations as s, i}
              <option value={i} disabled={i <= fromIndex}>{s.name}</option>
            {/each}
          </select>
        </div>
        <div class="flex-1" />
        <a class="button" href={`/checkout?train=${train.id}&date=${date}&from=${fromIndex}&to=${toIndex}`}>购票确认（占位）</a>
      </div>

      <!-- 详细行程信息 -->
      {#if date}
        {#key `${train.id}-${date}-${fromIndex}-${toIndex}`}
          {#await Promise.resolve(computeStationDateTimes(train, date)) then times}
            <!-- 出发与到达站点信息 -->
            <div class="space-y-2">
              <div class="text-sm text-slate-600">行程</div>
              <div class="rounded-lg border bg-slate-50">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  <div>
                    <div class="text-slate-500 text-sm mb-1">出发</div>
                    <div class="text-lg text-slate-800">{train.stations[fromIndex].name}</div>
                    {#if times[fromIndex].departureAt}
                      <div class="text-slate-600">{$timeMode === 'local' ? formatLocal(times[fromIndex].departureAt!) : formatTrainTz(times[fromIndex].departureAt!, train)}</div>
                    {/if}
                  </div>
                  <div>
                    <div class="text-slate-500 text-sm mb-1">到达</div>
                    <div class="text-lg text-slate-800">{train.stations[toIndex].name}</div>
                    {#if times[toIndex].arrivalAt}
                      <div class="text-slate-600">{$timeMode === 'local' ? formatLocal(times[toIndex].arrivalAt!) : formatTrainTz(times[toIndex].arrivalAt!, train)}</div>
                    {/if}
                  </div>
                </div>
              </div>
              <div class="text-sm text-slate-600">积分预估：{(train.stations[toIndex].points ?? 0) - (train.stations[fromIndex].points ?? 0)}</div>
            </div>

            <!-- 全部站点时刻表 -->
            <div class="space-y-2">
              <div class="text-sm text-slate-600">全时刻表</div>
              <div class="grid gap-1">
                {#each times as t, idx}
                  <div class="flex items-center gap-3">
                    <div class="w-36 text-slate-700">{train.stations[idx].name}</div>
                    <div class="text-slate-500 text-sm">{t.arrivalAt ? ($timeMode === 'local' ? formatLocal(t.arrivalAt) : formatTrainTz(t.arrivalAt, train)) : '-'}</div>
                    <div class="text-slate-500 text-sm">{t.departureAt ? ($timeMode === 'local' ? formatLocal(t.departureAt) : formatTrainTz(t.departureAt, train)) : '-'}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/await}
        {/key}
      {/if}
    </div>
  </section>
{/if}
