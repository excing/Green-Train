<script lang="ts">
  import type { Train } from '$lib/types/trains';
  let { data } = $props<{ data: { train: Train | null } }>();

  const t = data.train;
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
      <div class="text-sm text-gray-600">{t.name} · {t.id} · {t.timezone ?? 'Asia/Shanghai'}</div>
      {#if t.status_note}
        <div class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-fit">{t.status_note}</div>
      {/if}
    </header>

    <div class="grid gap-3">
      <div class="text-sm text-gray-700">发车基准时刻：{t.departure_time}</div>
      <div class="text-sm">
        状态：<span class="uppercase tracking-wide">{t.status}</span>
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
