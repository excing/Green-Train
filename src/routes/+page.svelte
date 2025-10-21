<script lang="ts">
  import type { Train, TimeMode } from '$lib/types';
  import { timeMode } from '$lib/stores/timeMode';
  import { getServiceDates, isServiceDay } from '$lib/calendar';
  import { computeStationDateTimes, formatLocal, formatTrainTz } from '$lib/time';
  import { computeSalesOpenAt, computeSalesCloseAt, isOnSale } from '$lib/sales';

  export const load = async ({ fetch }) => {
    const res = await fetch('/data/trains.json');
    const trains: Train[] = await res.json();
    return { trains };
  };

  let { data } = $props<{ data: { trains: Train[] } }>();
  let trains: Train[] = data.trains;
  const FUTURE_DAYS = 30;

  // 搜索状态
  let from = '';
  let to = '';
  let date = '';
  let timeRange: 'any' | 'morning' | 'afternoon' | 'evening' = 'any';
  let theme = '';
  let expanded: Record<string, boolean> = {};

  // 站点聚合
  const allStations = Array.from(new Set(trains.flatMap((t) => t.stations.map((s) => s.name)))).sort();

  function swap() { const tmp = from; from = to; to = tmp; }

  type Row = {
    train: Train;
    fromIndex: number;
    toIndex: number;
    date: string;
    dep: Date;
    arr: Date;
    durationMin: number;
    points: number;
    onSale: boolean;
    openAt: Date;
    closeAt: Date | null;
    times: ReturnType<typeof computeStationDateTimes>;
  };

  let results: Row[] = [];

  function refresh() {
    results = trains
      .filter((t) => t.status !== 'hidden')
      .filter((t) => {
        if (theme && !(t.theme?.includes(theme) || t.name.includes(theme))) return false;
        const names = t.stations.map((s) => s.name);
        const i = from ? names.indexOf(from) : 0;
        const j = to ? names.indexOf(to) : names.length - 1;
        if (from && i < 0) return false;
        if (to && j < 0) return false;
        if (i >= j) return false;
        const ds = date || getServiceDates(t, FUTURE_DAYS)[0];
        if (!ds) return false;
        if (!isServiceDay(t, ds)) return false;
        const times = computeStationDateTimes(t, ds);
        const dep = times[i].departureAt;
        const arr = times[j].arrivalAt;
        if (!dep || !arr) return false;
        const hour = parseInt(formatTrainTz(dep, t).split(' ')[1].slice(0, 2));
        if (timeRange === 'morning' && !(hour < 12)) return false;
        if (timeRange === 'afternoon' && !(hour >= 12 && hour < 18)) return false;
        if (timeRange === 'evening' && !(hour >= 18 || hour < 6)) return false;
        return true;
      })
      .map((t) => {
        const ds = date || getServiceDates(t, FUTURE_DAYS)[0];
        const times = computeStationDateTimes(t, ds);
        const names = t.stations.map((s) => s.name);
        const i = from ? names.indexOf(from) : 0;
        const j = to ? names.indexOf(to) : names.length - 1;
        const dep = times[i].departureAt!;
        const arr = times[j].arrivalAt!;
        const durationMin = Math.round((arr.getTime() - dep.getTime()) / 60000);
        const points = (t.stations[j].points ?? 0) - (t.stations[i].points ?? 0);
        const onSale = isOnSale(t, ds, i, new Date());
        const openAt = computeSalesOpenAt(t, ds);
        const closeAt = computeSalesCloseAt(t, ds, i);
        return { train: t, fromIndex: i, toIndex: j, date: ds, dep, arr, durationMin, points, onSale, openAt, closeAt, times } as Row;
      })
      .sort((a, b) => a.dep.getTime() - b.dep.getTime());
  }

  $effect(() => { refresh(); });

  function fmtTime(d: Date, t: Train, mode: TimeMode) {
    return mode === 'local' ? formatLocal(d) : formatTrainTz(d, t);
  }
</script>

<section class="max-w-6xl mx-auto p-6 space-y-6">
  <header class="space-y-1">
    <h1 class="text-3xl font-semibold text-slate-800">Green Train</h1>
    <p class="text-slate-600">12306/航班式查询（本地假数据）</p>
  </header>

  <div class="rounded-xl bg-white/80 border p-4 shadow-sm space-y-3">
    <div class="flex flex-wrap gap-3 items-end">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">出发</label>
        <input list="stations" class="border rounded-md px-3 py-2 min-w-48" bind:value={from} placeholder="选择或输入站点" />
      </div>
      <button class="button" on:click={swap}>交换</button>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">到达</label>
        <input list="stations" class="border rounded-md px-3 py-2 min-w-48" bind:value={to} placeholder="选择或输入站点" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">日期（未来{FUTURE_DAYS}天）</label>
        <input type="date" class="border rounded-md px-3 py-2" bind:value={date} />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">时段</label>
        <select class="border rounded-md px-3 py-2" bind:value={timeRange}>
          <option value="any">不限</option>
          <option value="morning">上午</option>
          <option value="afternoon">下午</option>
          <option value="evening">晚上/夜间</option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-600">主题</label>
        <input class="border rounded-md px-3 py-2 min-w-40" bind:value={theme} placeholder="关键词" />
      </div>
      <div class="flex-1" />
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600">时间显示</span>
        <button class="border rounded-md px-3 py-2" on:click={() => timeMode.set('local')}>本地</button>
        <button class="border rounded-md px-3 py-2" on:click={() => timeMode.set('train_tz')}>车次时区</button>
      </div>
    </div>
    <datalist id="stations">
      {#each allStations as s}
        <option value={s} />
      {/each}
    </datalist>
  </div>

  {#if results.length === 0}
    <div class="text-center text-slate-500 py-12">暂无符合条件的班次</div>
  {:else}
    <div class="rounded-xl bg-white/80 border p-4 shadow-sm overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>车次</th>
            <th>出发</th>
            <th>到达</th>
            <th>历时</th>
            <th>售卖</th>
            <th>积分</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each results as row}
            <tr class="hover:bg-slate-50 cursor-pointer" on:click={() => expanded[row.train.id] = !expanded[row.train.id]}>
              <td class="whitespace-nowrap font-medium">{row.train.id}</td>
              <td class="whitespace-nowrap">
                <div class="text-slate-800">
                  {$timeMode === 'local' ? formatLocal(row.dep) : formatTrainTz(row.dep, row.train)}
                </div>
                <div class="text-slate-500 text-xs">{row.train.stations[row.fromIndex].name}</div>
              </td>
              <td class="whitespace-nowrap">
                <div class="text-slate-800">
                  {$timeMode === 'local' ? formatLocal(row.arr) : formatTrainTz(row.arr, row.train)}
                </div>
                <div class="text-slate-500 text-xs">{row.train.stations[row.toIndex].name}</div>
              </td>
              <td class="whitespace-nowrap">{Math.floor(row.durationMin/60)}小时{row.durationMin%60}分</td>
              <td class="whitespace-nowrap">
                {#if row.onSale}
                  <span class="badge success">在售</span>
                {:else}
                  <span class="badge warning">未开售</span>
                {/if}
              </td>
              <td class="whitespace-nowrap">{row.points}</td>
              <td class="whitespace-nowrap">
                <a class="button" href={`/trains/${row.train.id}?date=${row.date}&from=${row.fromIndex}&to=${row.toIndex}`}>查看</a>
              </td>
            </tr>
            {#if expanded[row.train.id]}
              <tr>
                <td colspan="7">
                  <div class="p-3 bg-slate-50 rounded-md">
                    <div class="text-sm text-slate-600 mb-2">全时刻表（{$timeMode === 'local' ? '本地' : '车次时区'}时间）</div>
                    <div class="grid gap-1">
                      {#each row.times as t, idx}
                        <div class="flex items-center gap-3">
                          <div class="w-36 text-slate-700">{row.train.stations[idx].name}</div>
                          <div class="text-slate-500 text-sm">{t.arrivalAt ? ($timeMode === 'local' ? formatLocal(t.arrivalAt) : formatTrainTz(t.arrivalAt, row.train)) : '-'}</div>
                          <div class="text-slate-500 text-sm">{t.departureAt ? ($timeMode === 'local' ? formatLocal(t.departureAt) : formatTrainTz(t.departureAt, row.train)) : '-'}</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
