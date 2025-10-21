<script lang="ts">
  import type { Train } from '$lib/types/trains';
  import { clampServiceWindow, mergeServiceDays } from '$lib/utils/calendar';
  import { defaultTZ, formatHM, formatDurationMinutes, relativeToAbs } from '$lib/utils/datetime';
  import { computePointsCost } from '$lib/utils/points';
  import { isOnSale, openAt, closeAt } from '$lib/utils/sales';

  let { data } = $props<{ data: { train: Train | null } }>();

  const t = data.train;
  let tz = $derived(t ? defaultTZ(t) : 'Asia/Shanghai');
  let primary: 'local' | 'train' = $state('local');

  // service dates within window
  let serviceDates: string[] = $state([]);
  let selectedDate: string = $state('');

  // stations selection
  let fromIndex = $state(0);
  let toIndex = $state(t ? (t.stations.length - 1) : 1);

  $effect(() => {
    if (!t) return;
    const w = clampServiceWindow(t, 90);
    serviceDates = mergeServiceDays(t, w.from, w.to);
    selectedDate = serviceDates[0] || '';
    fromIndex = 0;
    toIndex = Math.max(1, t.stations.length - 1);
  });

  function departEpoch(): number | null {
    if (!t || !selectedDate) return null;
    const rel = t.stations[fromIndex]?.departure_time;
    if (!rel) return null;
    return relativeToAbs(selectedDate, rel, tz).epochMs;
  }
  function arrivalEpoch(): number | null {
    if (!t || !selectedDate) return null;
    const rel = t.stations[toIndex]?.arrival_time;
    if (!rel) return null;
    return relativeToAbs(selectedDate, rel, tz).epochMs;
  }

  var departMs = $derived(departEpoch());
  var arriveMs = $derived(arrivalEpoch());
  var duration = $derived(departMs && arriveMs ? Math.round((arriveMs - departMs) / 60000) : 0);
  var points = $derived(t ? computePointsCost(t.stations, fromIndex, toIndex) : 0);

  var sale = $derived(() => {
    if (!t || !selectedDate) return null;
    return isOnSale(Date.now(), t, selectedDate, fromIndex);
  });

  var openInfo = $derived(() => (t && selectedDate ? openAt(t, selectedDate) : null));
  var closeInfo = $derived(() => (t && selectedDate ? closeAt(t, selectedDate, fromIndex) : null));
</script>

{#if !t}
  <section class="max-w-3xl mx-auto p-6">
    <p class="text-gray-500">未找到该列车。</p>
    <a href="/trains" class="text-blue-600 underline">返回列表</a>
  </section>
{:else}
  <section class="max-w-4xl mx-auto p-6 space-y-6">
    <a href="/trains" class="text-blue-600 underline">← 返回列表</a>

    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">{t.theme}</h1>
      <div class="text-sm text-gray-600">{t.name} · {t.id} · {tz}</div>
      {#if t.status_note}
        <div class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-fit">{t.status_note}</div>
      {/if}
    </header>

    <div class="flex items-center gap-4 text-sm">
      <div>发车基准：{t.departure_time}</div>
      <div>状态：<span class="uppercase tracking-wide">{t.status}</span></div>
      <div class="ml-auto">主时区：
        <select bind:value={primary} class="border rounded px-2 py-1">
          <option value="local">本地</option>
          <option value="train">车次（{tz}）</option>
        </select>
      </div>
    </div>

    <div class="grid gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm">选择日期：</label>
        <select bind:value={selectedDate} class="border rounded px-2 py-1">
          {#each serviceDates as d}
            <option value={d}>{d}</option>
          {/each}
        </select>
        {#if !selectedDate}
          <span class="text-xs text-gray-500">暂无可运行日</span>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <label class="text-sm">上车站：</label>
        <select bind:value={fromIndex} class="border rounded px-2 py-1">
          {#each t.stations as s, i}
            {#if i < toIndex}
              <option value={i}>{i === 0 ? '始发' : '经停'} · {s.name}</option>
            {/if}
          {/each}
        </select>
        <label class="text-sm">到达站：</label>
        <select bind:value={toIndex} class="border rounded px-2 py-1">
          {#each t.stations as s, i}
            {#if i > fromIndex}
              <option value={i}>{i === t.stations.length - 1 ? '终到' : '经停'} · {s.name}</option>
            {/if}
          {/each}
        </select>
      </div>

      <div class="grid gap-1 text-sm">
        <div class="flex items-center gap-3">
          <span class="text-gray-500">发车</span>
          {#if departMs}
            {#if primary === 'local'}
              <span class="tabular-nums font-medium">{formatHM(departMs)}</span>
              <span class="text-gray-500 text-xs">({formatHM(departMs, tz)})</span>
            {:else}
              <span class="tabular-nums font-medium">{formatHM(departMs, tz)}</span>
              <span class="text-gray-500 text-xs">({formatHM(departMs)})</span>
            {/if}
          {:else}
            <span class="text-gray-500">—</span>
          {/if}
        </div>
        <div class="flex items-center gap-3">
          <span class="text-gray-500">到达</span>
          {#if arriveMs}
            {#if primary === 'local'}
              <span class="tabular-nums font-medium">{formatHM(arriveMs)}</span>
              <span class="text-gray-500 text-xs">({formatHM(arriveMs, tz)})</span>
            {:else}
              <span class="tabular-nums font-medium">{formatHM(arriveMs, tz)}</span>
              <span class="text-gray-500 text-xs">({formatHM(arriveMs)})</span>
            {/if}
          {:else}
            <span class="text-gray-500">—</span>
          {/if}
        </div>
        <div class="text-gray-700">历时：{formatDurationMinutes(duration)}</div>
        <div class="text-gray-700">积分：{points}</div>
      </div>

      <div class="grid gap-1 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">开售：</span>
          {#if openInfo}
            <span>{openInfo.localIso}</span>
          {:else}
            <span>随时可买</span>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-500">停售：</span>
          {#if closeInfo}
            <span>{closeInfo.localIso}</span>
          {:else}
            <span>—</span>
          {/if}
        </div>
        <div>
          {#if sale?.onSale}
            <span class="text-emerald-700">当前可购</span>
          {:else}
            {#if sale?.reason === 'BEFORE_OPEN'}
              <span class="text-amber-600">未开售</span>
            {:else if sale?.reason === 'AFTER_CLOSE'}
              <span class="text-gray-500">已停售</span>
            {:else if sale?.reason === 'PAUSED'}
              <span class="text-amber-700">暂停</span>
            {:else}
              <span class="text-gray-500">不可售</span>
            {/if}
          {/if}
        </div>
      </div>
    </div>

    <div>
      <h2 class="font-medium mb-2">站点一览（相对时刻）</h2>
      <ol class="space-y-2">
        {#each t.stations as s, i}
          <li class="border rounded p-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">{i === 0 ? '始发' : i === t.stations.length - 1 ? '终到' : '经停'} · {s.name}</div>
                {#if s.description}
                  <div class="text-sm text-gray-600">{s.description}</div>
                {/if}
              </div>
              <div class="text-right text-sm text-gray-700">
                {#if s.arrival_time}<div>到达 {s.arrival_time}</div>{/if}
                {#if s.departure_time}<div>发车 {s.departure_time}</div>{/if}
              </div>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </section>
{/if}
