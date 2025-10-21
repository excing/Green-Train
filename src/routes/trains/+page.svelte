<script lang="ts">
  import type { Train } from '$lib/types/trains';
  import { computeNextDeparture } from '$lib/utils/trains';
  import { formatHM, defaultTZ } from '$lib/utils/datetime';
  import { isOnSale } from '$lib/utils/sales';
  let { data } = $props<{ data: { trains: Train[] } }>();

  const visibleStatuses: Set<Train['status']> = new Set(['active', 'deprecated', 'hidden', 'paused']);
  let showHidden = false;
  let q = '';

  function matchTrain(t: Train, q: string) {
    if (!q) return true;
    const kw = q.trim().toLowerCase();
    if (!kw) return true;
    if (t.theme.toLowerCase().includes(kw) || t.name.toLowerCase().includes(kw) || t.id.toLowerCase().includes(kw)) return true;
    return t.stations.some((s) => s.name.toLowerCase().includes(kw));
  }

  var enriched = $derived(data.trains
    .filter((t) => visibleStatuses.has(t.status) && (showHidden || t.status !== 'hidden'))
    .filter((t) => matchTrain(t, q))
    .map((t) => {
      const nd = computeNextDeparture(t, Date.now());
      return { train: t, next: nd };
    })
    .sort((a, b) => (a.next?.epochMs ?? Infinity) - (b.next?.epochMs ?? Infinity))
  );
</script>

<section class="max-w-4xl mx-auto p-6 space-y-6">
  <header class="flex items-center justify-between gap-4">
    <h1 class="text-2xl font-semibold">列车列表</h1>
    <div class="flex items-center gap-3">
      <input placeholder="搜索主题/站名/车次" bind:value={q} class="px-2 py-1 border rounded text-sm w-56" />
      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" bind:checked={showHidden} /> 显示隐藏
      </label>
    </div>
  </header>

  {#if enriched.length === 0}
    <p class="text-gray-500">暂无可显示的列车。</p>
  {:else}
    <ul class="grid gap-4">
      {#each enriched as item}
        {#key item.train.id}
          <li class="border rounded-lg p-4 hover:bg-gray-50 transition">
            <a class="block" href={`/trains/${encodeURIComponent(item.train.id)}`}>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-lg font-medium">{item.train.theme}</div>
                  <div class="text-sm text-gray-600">{item.train.name} · {item.train.id}</div>
                </div>
                <div class="text-right text-sm">
                  {#if item.next}
                    <div class="flex items-center gap-2 justify-end">
                      <span class="font-medium">下次发车</span>
                      <span class="tabular-nums">{formatHM(item.next.epochMs)}</span>
                      <span class="text-gray-500 text-xs">({formatHM(item.next.epochMs, defaultTZ(item.train))})</span>
                    </div>
                    {#if isOnSale(Date.now(), item.train, item.next.service_date, 0).onSale}
                      <div class="text-emerald-700">可购</div>
                    {:else}
                      {#if isOnSale(Date.now(), item.train, item.next.service_date, 0).reason === 'BEFORE_OPEN'}
                        <div class="text-amber-600">未开售</div>
                      {:else if isOnSale(Date.now(), item.train, item.next.service_date, 0).reason === 'AFTER_CLOSE'}
                        <div class="text-gray-500">已停售</div>
                      {:else if isOnSale(Date.now(), item.train, item.next.service_date, 0).reason === 'PAUSED'}
                        <div class="text-amber-700">暂停</div>
                      {:else}
                        <div class="text-gray-500">不可售</div>
                      {/if}
                    {/if}
                  {:else}
                    <div class="text-gray-500">暂无运行日</div>
                  {/if}
                  <div class="uppercase tracking-wide text-gray-500">{item.train.status}</div>
                </div>
              </div>
            </a>
          </li>
        {/key}
      {/each}
    </ul>
  {/if}
</section>
