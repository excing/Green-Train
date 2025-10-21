<script lang="ts">
  import type { Train } from '$lib/types/trains';
  import { getTrainTz, computeServiceDates, departAbsTrainTZ, arrivalAbsTrainTZ, openAt, closeAt, isOnSale, humanizeDurationMinutes, pointsCost } from '$lib/utils/time';
  import { DateTime } from 'luxon';
  let { data } = $props<{ data: { train: Train | null } }>();

  const t = data.train;
  let tz = t ? getTrainTz(t) : 'Asia/Shanghai';
  let todayTz = t ? DateTime.now().setZone(tz).toISODate()! : '';
  let serviceDates: string[] = t ? computeServiceDates(t, todayTz, DateTime.fromISO(todayTz, { zone: tz }).plus({ days: 90 }).toISODate()!) : [];
  let dateSel = serviceDates[0];
  let fromIndex = 0;
  let toIndex = t ? Math.max(1, t.stations.length - 1) : 1;

  $: depart = t && dateSel != null ? departAbsTrainTZ(t, dateSel, fromIndex) : null;
  $: arrive = t && dateSel != null ? arrivalAbsTrainTZ(t, dateSel, toIndex) : null;
  $: duration = depart && arrive ? arrive.diff(depart, 'minutes').minutes : 0;
  $: open = t && dateSel ? openAt(t, dateSel) : null;
  $: close = t && dateSel ? closeAt(t, dateSel, fromIndex) : null;
  $: onSale = t && dateSel ? isOnSale(t, dateSel, fromIndex, DateTime.now()) : false;
  $: pts = t ? pointsCost(t, fromIndex, toIndex) : 0;

  function clampTo() {
    if (!t) return;
    if (toIndex <= fromIndex) toIndex = Math.min(t.stations.length - 1, fromIndex + 1);
  }
</script>

{#if !t}
  <section class="max-w-3xl mx-auto p-6">
    <p class="text-gray-500">未找到该列车。</p>
    <a href="/trains" class="text-blue-600 underline">返回列表</a>
  </section>
{:else}
  <section class="max-w-3xl mx-auto p-6 space-y-6">
    <a href="/trains" class="text-blue-600 underline">← 返回列表</a>

    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">{t.theme}</h1>
      <div class="text-sm text-gray-600">{t.name} · {t.id} · {tz}</div>
      {#if t.status_note}
        <div class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-fit">{t.status_note}</div>
      {/if}
    </header>

    <div class="grid gap-3">
      <div class="text-sm text-gray-700">发车基准时刻：{t.departure_time}</div>
      <div class="text-sm">状态：<span class="uppercase tracking-wide">{t.status}</span></div>
    </div>

    <div class="space-y-3">
      <h2 class="font-medium">选择行程</h2>
      <div class="grid gap-3 md:grid-cols-3">
        <label class="text-sm grid gap-1">
          <span>运行日</span>
          <select bind:value={dateSel} class="border rounded px-2 py-1">
            {#each serviceDates as d}
              <option value={d}>{d}</option>
            {/each}
          </select>
        </label>
        <label class="text-sm grid gap-1">
          <span>上车站</span>
          <select bind:value={fromIndex} on:change={clampTo} class="border rounded px-2 py-1">
            {#each t.stations as s, i}
              {#if i < toIndex}
                <option value={i}>{i === 0 ? '始发' : '经停'} · {s.name}</option>
              {/if}
            {/each}
          </select>
        </label>
        <label class="text-sm grid gap-1">
          <span>到达站</span>
          <select bind:value={toIndex} class="border rounded px-2 py-1">
            {#each t.stations as s, i}
              {#if i > fromIndex}
                <option value={i}>{i === t.stations.length - 1 ? '终到' : '经停'} · {s.name}</option>
              {/if}
            {/each}
          </select>
        </label>
      </div>

      <div class="border rounded p-3 text-sm grid gap-1">
        {#if depart && arrive}
          <div>发车：本地 {depart.setZone('local').toFormat('yyyy-LL-dd HH:mm')} ｜ {tz} {depart.toFormat('yyyy-LL-dd HH:mm')}</div>
          <div>到达：本地 {arrive.setZone('local').toFormat('yyyy-LL-dd HH:mm')} ｜ {tz} {arrive.toFormat('yyyy-LL-dd HH:mm')}</div>
          <div>历时：{humanizeDurationMinutes(Math.round(duration))}</div>
          <div>积分预估：{pts}</div>
          <div>开售：{open ? `本地 ${open.setZone('local').toFormat('MM-dd HH:mm')} ｜ ${tz} ${open.toFormat('MM-dd HH:mm')}` : '随时可买'}</div>
          <div>停售：本地 {close?.setZone('local').toFormat('MM-dd HH:mm')} ｜ {tz} {close?.toFormat('MM-dd HH:mm')}</div>
          <div>售卖状态：{onSale ? '可购' : (open && DateTime.now() < open) ? '未开售' : (close && DateTime.now() >= close) ? '已停售' : t.status === 'paused' ? '暂停' : '不可购'}</div>
        {:else}
          <div>请选择合法的上/下车站与日期</div>
        {/if}
      </div>
    </div>

    <div>
      <h2 class="font-medium mb-2">站点</h2>
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
