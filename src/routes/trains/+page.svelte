<script lang="ts">
  import type { Train } from '$lib/types/trains';
  let { data } = $props<{ data: { trains: Train[] } }>();

  const visibleStatuses: Set<Train['status']> = new Set(['active', 'deprecated', 'hidden', 'paused']);
  let showHidden = false;

  var filtered = $derived(data.trains.filter((t: any) => visibleStatuses.has(t.status) && (showHidden || t.status !== 'hidden')));
</script>

<section class="max-w-3xl mx-auto p-6 space-y-6">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold">列车列表</h1>
    <label class="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={showHidden} /> 显示隐藏
    </label>
  </header>

  {#if filtered.length === 0}
    <p class="text-gray-500">暂无可显示的列车。</p>
  {:else}
    <ul class="grid gap-4">
      {#each filtered as train}
        <li class="border rounded-lg p-4 hover:bg-gray-50 transition">
          <a class="block" href={`/trains/${encodeURIComponent(train.id)}`}>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-lg font-medium">{train.theme}</div>
                <div class="text-sm text-gray-600">{train.name} · {train.id}</div>
              </div>
              <div class="text-right text-sm">
                <div>{train.departure_time}</div>
                <div class="uppercase tracking-wide text-gray-500">{train.status}</div>
              </div>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>
