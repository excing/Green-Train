<!--
  车次查询主页
  功能：
  - 根据出发站、到达站、日期、时段、主题筛选列车
  - 展示符合条件的列车及其时刻、积分、售票状态
  - 支持展开显示全部站点的详细时刻表
-->
<script lang="ts">
  import type { Train, TimeMode } from '$lib/types';
  import { timeMode } from '$lib/stores/timeMode';
  import { getServiceDates, isServiceDay } from '$lib/calendar';
  import { computeStationDateTimes, formatLocal, formatTrainTz } from '$lib/time';
  import { computeSalesOpenAt, computeSalesCloseAt, isOnSale } from '$lib/sales';

  let { data } = $props<{ data: { trains: Train[] } }>();
  let trains: Train[] = data.trains;
  const FUTURE_DAYS = 30; // 搜索未来天数

  // 搜索条件状态
  let from = $state(''); // 出发站
  let to = $state(''); // 到达站
  let date = $state(''); // 服务日期
  let timeRange = $state<'any' | 'morning' | 'afternoon' | 'evening'>('any'); // 时段筛选
  let theme = $state(''); // 主题关键词
  let expanded = $state<Record<string, boolean>>({}); // 展开的车次详情状态

  // 聚合所有列车的站点名称
  const allStations = Array.from(new Set(trains.flatMap((t) => t.stations.map((s) => s.name)))).sort();

  /**
   * 交换出发站和到达站
   */
  function swap() { const tmp = from; from = to; to = tmp; }

  /**
   * 搜索结果行数据结构
   */
  type Row = {
    train: Train; // 列车对象
    fromIndex: number; // 上车站索引
    toIndex: number; // 下车站索引
    date: string; // 服务日期
    dep: Date; // 出发时间
    arr: Date; // 到达时间
    durationMin: number; // 历时（分钟）
    points: number; // 区间积分
    onSale: boolean; // 是否在售
    openAt: Date; // 开售时间
    closeAt: Date | null; // 停售时间
    times: ReturnType<typeof computeStationDateTimes>; // 全部站点时刻
  };

  let results = $state<Row[]>([]); // 搜索结果列表

  /**
   * 响应式计算搜索结果
   * 根据筛选条件过滤并排序列车
   */
  $effect(() => {
    results = trains
      // 过滤隐藏的列车
      .filter((t) => t.status !== 'hidden')
      // 根据搜索条件筛选
      .filter((t) => {
        // 主题筛选
        if (theme && !(t.theme?.includes(theme) || t.name.includes(theme))) return false;
        // 站点匹配检查
        const names = t.stations.map((s) => s.name);
        const i = from ? names.indexOf(from) : 0; // 上车站索引
        const j = to ? names.indexOf(to) : names.length - 1; // 下车站索引
        if (from && i < 0) return false; // 未找到出发站
        if (to && j < 0) return false; // 未找到到达站
        if (i >= j) return false; // 站点顺序错误
        // 日期检查：使用指定日期或首个服务日
        const ds = date || getServiceDates(t, FUTURE_DAYS)[0];
        if (!ds) return false; // 无服务日
        if (!isServiceDay(t, ds)) return false; // 日期不在服务范围
        // 计算时刻
        const times = computeStationDateTimes(t, ds);
        const dep = times[i].departureAt;
        const arr = times[j].arrivalAt;
        if (!dep || !arr) return false; // 无效时刻
        // 时段筛选
        const hour = parseInt(formatTrainTz(dep, t).split(' ')[1].slice(0, 2));
        if (timeRange === 'morning' && !(hour < 12)) return false;
        if (timeRange === 'afternoon' && !(hour >= 12 && hour < 18)) return false;
        if (timeRange === 'evening' && !(hour >= 18 || hour < 6)) return false;
        return true;
      })
      // 构建搜索结果行数据
      .map((t) => {
        const ds = date || getServiceDates(t, FUTURE_DAYS)[0];
        const times = computeStationDateTimes(t, ds);
        const names = t.stations.map((s) => s.name);
        const i = from ? names.indexOf(from) : 0;
        const j = to ? names.indexOf(to) : names.length - 1;
        const dep = times[i].departureAt!;
        const arr = times[j].arrivalAt!;
        // 计算历时
        const durationMin = Math.round((arr.getTime() - dep.getTime()) / 60000);
        // 计算区间积分
        const points = (t.stations[j].points ?? 0) - (t.stations[i].points ?? 0);
        // 检查售票状态
        const onSale = isOnSale(t, ds, i, new Date());
        const openAt = computeSalesOpenAt(t, ds);
        const closeAt = computeSalesCloseAt(t, ds, i);
        return { train: t, fromIndex: i, toIndex: j, date: ds, dep, arr, durationMin, points, onSale, openAt, closeAt, times } as Row;
      })
      // 按发车时间排序
      .sort((a, b) => a.dep.getTime() - b.dep.getTime());
  });

  /**
   * 格式化时间显示
   * @param d Date 实例
   * @param t 列车对象
   * @param mode 时间显示模式
   */
  function fmtTime(d: Date, t: Train, mode: TimeMode) {
    return mode === 'local' ? formatLocal(d) : formatTrainTz(d, t);
  }
</script>

<!-- 主容器 -->
<section class="max-w-6xl mx-auto p-6 space-y-6">
  <!-- 页面标题 -->
  <header class="space-y-1">
    <h1 class="text-3xl font-semibold text-slate-800">Green Train</h1>
    <p class="text-slate-600">12306/航班式查询（本地假数据）</p>
  </header>

  <!-- 搜索过滤器 -->
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

  <!-- 搜索结果 -->
  {#if results.length === 0}
    <div class="text-center text-slate-500 py-12">暂无符合条件的班次</div>
  {:else}
    <div class="rounded-xl bg-white/80 border p-4 shadow-sm overflow-x-auto">
      <!-- 结果表格 -->
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
            <!-- 列车行，点击展开/折叠详情 -->
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
            <!-- 展开的详细时刻表 -->
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
