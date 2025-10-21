<script lang="ts">
  import type { Train } from '$lib/types/trains';
  import { computeNextDeparture, getTrainTz, isOnSale, computeServiceDates, openAt, closeAt } from '$lib/utils/time';
  import { DateTime } from 'luxon';
  let { data } = $props<{ data: { trains: Train[] } }>();

  const visibleStatuses: Set<Train['status']> = new Set(['active', 'deprecated', 'hidden', 'paused']);
  let showHidden = false;
  let keyword = '';

  function matchKeyword(t: Train, kw: string): boolean {
    if (!kw) return true;
    kw = kw.trim().toLowerCase();
    if (!kw) return true;
    if (t.theme.toLowerCase().includes(kw)) return true;
    if (t.name.toLowerCase().includes(kw)) return true;
    if (t.id.toLowerCase().includes(kw)) return true;
    // HH:mm 匹配 departure_time
    const hhmm = t.departure_time.slice(0,5);
    if (hhmm.includes(kw)) return true;
    // 站点
    if (t.stations.some(s => s.name.toLowerCase().includes(kw))) return true;
    return false;
  }

  function saleLabel(train: Train, now: DateTime): { label: string; tone: string } {
    // 取最近运行日
    const tz = getTrainTz(train);
    const today = now.setZone(tz).toISODate()!;
    const serviceDates = computeServiceDates(train, today, DateTime.fromISO(today, { zone: tz }).plus({ days: 90 }).toISODate()!);
    const d = serviceDates[0];
    if (!d) return { label: train.status === 'paused' ? '暂停' : '未安排', tone: 'gray' };
    if (train.status === 'paused') return { label: '暂停', tone: 'amber' };
    const open = openAt(train, d);
    const close = closeAt(train, d, 0);
    if (now >= close) return { label: '已停售', tone: 'gray' };
    if (open && now < open) return { label: `未开售（${open.setZone('local').toFormat('MM-dd HH:mm')}）`, tone: 'blue' };
    if (isOnSale(train, d, 0, now)) return { label: '可购', tone: 'green' };
    return { label: '不可购', tone: 'gray' };
  }

  $: filtered = data.trains
    .filter(t => visibleStatuses.has(t.status) && (showHidden || t.status !== 'hidden'))
    .filter(t => matchKeyword(t, keyword))
    .map(t => {
      const next = computeNextDeparture(t, DateTime.now());
      const tz = getTrainTz(t);
      const label = saleLabel(t, DateTime.now());
      return { t, next, tz, label };
    })
    .sort((a, b) => {
      const am = a.next?.depart.toMillis() ?? Number.MAX_SAFE_INTEGER;
      const bm = b.next?.depart.toMillis() ?? Number.MAX_SAFE_INTEGER;
      return am - bm;
    });
</script>

<section class="max-w-5xl mx-auto p-6 space-y-6">
  <header class="space-y-3">
    <h1 class="text-2xl font-semibold">列车列表</h1>
    <div class="flex flex-wrap gap-3 items-center">
      <input placeholder="搜索主题/车次/站点/HH:mm" bind:value={keyword} class="px-3 py-2 border rounded w-64" />
      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" bind:checked={showHidden} /> 显示隐藏
      </label>
    </div>
  </header>

  {#if filtered.length === 0}
    <p class="text-gray-500">暂无可显示的列车。</p>
  {:else}
    <ul class="grid gap-4">
      {#each filtered as item}
        {@const train = item.t}
        <li class="border rounded-lg p-4 hover:bg-gray-50 transition">
          <a class="block" href={`/trains/${encodeURIComponent(train.id)}`}>
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-lg font-medium truncate">{train.theme}</div>
                <div class="text-sm text-gray-600">{train.name} · {train.id}</div>
              </div>
              <div class="text-right text-sm">
                {#if item.next}
                  <div class="font-medium">下次发车</div>
                  <div class="text-gray-800">本地 {item.next.depart.setZone('local').toFormat('MM-dd HH:mm')}</div>
                  <div class="text-gray-500">{item.tz} {item.next.depart.toFormat('MM-dd HH:mm')}</div>
                {:else}
                  <div class="text-gray-500">未来暂无班次</div>
                {/if}
                <div class="mt-1 text-xs uppercase tracking-wide text-gray-500">{train.status}</div>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2 text-sm">
              {@const toneClass = item.label.tone === 'green' ? 'border-emerald-400 text-emerald-700' : item.label.tone === 'amber' ? 'border-amber-400 text-amber-700' : item.label.tone === 'blue' ? 'border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'}
              <span class={`px-2 py-0.5 rounded-full border ${toneClass}`}>{item.label.label}</span>
              <span class="text-gray-400">·</span>
              <span class="text-gray-600">始发 {train.stations[0].name} · 发车 {train.departure_time}</span>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>
