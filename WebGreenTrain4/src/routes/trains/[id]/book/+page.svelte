<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Train, DateString, Ticket } from '$lib/types';
  import { getTrainById } from '$lib/trains';
  import { getSeatLetters, formatRowNumber } from '$lib/room';
  import { toLocalAbsoluteTime } from '$lib/time';

  let train: Train | null = null;
  let loading = true;
  let error: string | null = null;
  let selectedDate: DateString | null = null;
  let fromStationIndex = 0;
  let toStationIndex = 1;
  let carriageNumber = 1;
  let row = 1;
  let seatLetter = 'A';
  let userName = '';
  let userId = '';
  let amount = 99; // 默认价格 9.9 元
  let submitting = false;
  let ticket: Ticket | null = null;

  const seatLetters = getSeatLetters();

  onMount(async () => {
    try {
      const trainId = $page.params.id || '';
      const dateParam = $page.url.searchParams.get('date');

      train = await getTrainById(trainId);
      if (!train) {
        error = '列车不存在';
        loading = false;
        return;
      }

      selectedDate = dateParam as DateString;
      if (!selectedDate) {
        error = '未指定日期';
        loading = false;
        return;
      }

      toStationIndex = Math.min(1, train.stations.length - 1);
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load train';
      loading = false;
    }
  });

  async function handleSubmit() {
    if (!train || !selectedDate || !userName || !userId) {
      error = '请填写所有必填字段';
      return;
    }

    submitting = true;
    error = null;

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          train_id: train.id,
          service_date: selectedDate,
          from_station_index: fromStationIndex,
          to_station_index: toStationIndex,
          carriage_number: carriageNumber,
          row,
          seat_letter: seatLetter,
          amount_fen: amount * 10,
          train_snapshot: train
        })
      });

      if (!response.ok) {
        throw new Error('购票失败');
      }

      ticket = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create ticket';
    } finally {
      submitting = false;
    }
  }

  function formatTime(relativeTime: string): string {
    if (!train || !selectedDate) return relativeTime;
    try {
      const iso = toLocalAbsoluteTime(selectedDate, relativeTime as any, train.timezone);
      const dt = new Date(iso);
      return dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return relativeTime;
    }
  }
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--color-train-cream);">
    <p class="text-lg" style="color: var(--color-train-green);">加载中...</p>
  </div>
{:else if error && !ticket}
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--color-train-cream);">
    <div class="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-red-800">
      <p>错误: {error}</p>
    </div>
  </div>
{:else if ticket}
  <!-- 购票成功页面 -->
  <div class="min-h-screen" style="background-color: var(--color-train-cream);">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="rounded-lg shadow-lg p-8" style="background-color: white;">
        <div class="text-center mb-6">
          <p class="text-4xl mb-2">✅</p>
          <h1 class="text-2xl font-bold mb-2" style="color: var(--color-train-green);">购票成功!</h1>
          <p class="text-gray-600">您的票据已生成，请妥善保管</p>
        </div>

        <!-- 票据信息 -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
          <div class="flex justify-between">
            <span class="font-semibold">票据号:</span>
            <span class="font-mono">{ticket.ticket_id}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">PNR 码:</span>
            <span class="font-mono text-lg font-bold" style="color: var(--color-train-light-green);">{ticket.pnr_code}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">列车:</span>
            <span>{ticket.train_snapshot.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">日期:</span>
            <span>{ticket.service_date}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">路线:</span>
            <span>{ticket.from_station_name} → {ticket.to_station_name}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">座位:</span>
            <span>{ticket.carriage_number}车厢 {formatRowNumber(ticket.row)}排{ticket.seat_letter}座</span>
          </div>
          <div class="flex justify-between">
            <span class="font-semibold">金额:</span>
            <span style="color: var(--color-train-light-green);">¥{(ticket.payment.amount_fen / 100).toFixed(2)}</span>
          </div>
        </div>

        <!-- 二维码 -->
        <div class="text-center mb-6">
          <p class="text-sm text-gray-600 mb-2">扫描二维码进入候车室</p>
          <div class="bg-white border-2 border-gray-300 rounded-lg p-4 inline-block">
            <p class="text-xs text-gray-500">[二维码]</p>
            <p class="text-xs text-gray-500 mt-2">{ticket.qrcode_payload}</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-4">
          <a href="/trains/{ticket.train_id}/room/{ticket.room_ids.seat}" class="flex-1">
            <button
              class="w-full py-3 rounded-lg font-bold text-white transition-colors hover:opacity-90"
              style="background-color: var(--color-train-light-green);"
            >
              进入候车室
            </button>
          </a>
          <a href="/" class="flex-1">
            <button
              class="w-full py-3 rounded-lg font-bold transition-colors hover:opacity-90"
              style="background-color: white; color: var(--color-train-light-green); border: 2px solid var(--color-train-light-green);"
            >
              返回首页
            </button>
          </a>
        </div>
      </div>
    </div>
  </div>
{:else if train && selectedDate}
  <!-- 购票表单 -->
  <div class="min-h-screen" style="background-color: var(--color-train-cream);">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <a href="/trains/{train.id}" class="text-blue-600 hover:text-blue-800 mb-4 inline-block">← 返回</a>

      <div class="rounded-lg shadow-lg p-6" style="background-color: white;">
        <h1 class="text-2xl font-bold mb-6" style="color: var(--color-train-green);">购票</h1>

        {#if error}
          <div class="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-red-800 mb-6">
            {error}
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- 用户信息 -->
          <div>
            <label for="userName" class="block font-semibold mb-2" style="color: var(--color-train-green);">用户名</label>
            <input
              id="userName"
              type="text"
              bind:value={userName}
              placeholder="请输入您的名字"
              class="w-full px-4 py-2 border-2 rounded-lg"
              style="border-color: var(--color-train-light-green);"
              required
            />
          </div>

          <div>
            <label for="userId" class="block font-semibold mb-2" style="color: var(--color-train-green);">用户 ID</label>
            <input
              id="userId"
              type="text"
              bind:value={userId}
              placeholder="请输入您的用户 ID"
              class="w-full px-4 py-2 border-2 rounded-lg"
              style="border-color: var(--color-train-light-green);"
              required
            />
          </div>

          <!-- 站点选择 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="fromStation" class="block font-semibold mb-2" style="color: var(--color-train-green);">上车站</label>
              <select
                id="fromStation"
                bind:value={fromStationIndex}
                class="w-full px-4 py-2 border-2 rounded-lg"
                style="border-color: var(--color-train-light-green);"
              >
                {#each train.stations as station, index (index)}
                  {#if index < train.stations.length - 1}
                    <option value={index}>{station.name}</option>
                  {/if}
                {/each}
              </select>
            </div>

            <div>
              <label for="toStation" class="block font-semibold mb-2" style="color: var(--color-train-green);">下车站</label>
              <select
                id="toStation"
                bind:value={toStationIndex}
                class="w-full px-4 py-2 border-2 rounded-lg"
                style="border-color: var(--color-train-light-green);"
              >
                {#each train.stations as station, index (index)}
                  {#if index > fromStationIndex}
                    <option value={index}>{station.name}</option>
                  {/if}
                {/each}
              </select>
            </div>
          </div>

          <!-- 座位选择 -->
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="carriage" class="block font-semibold mb-2" style="color: var(--color-train-green);">车厢</label>
              <input
                id="carriage"
                type="number"
                bind:value={carriageNumber}
                min="1"
                max={train.carriages}
                class="w-full px-4 py-2 border-2 rounded-lg"
                style="border-color: var(--color-train-light-green);"
              />
            </div>

            <div>
              <label for="row" class="block font-semibold mb-2" style="color: var(--color-train-green);">行号</label>
              <input
                id="row"
                type="number"
                bind:value={row}
                min="1"
                max={train.rows_per_carriage}
                class="w-full px-4 py-2 border-2 rounded-lg"
                style="border-color: var(--color-train-light-green);"
              />
            </div>

            <div>
              <label for="seat" class="block font-semibold mb-2" style="color: var(--color-train-green);">座位</label>
              <select
                id="seat"
                bind:value={seatLetter}
                class="w-full px-4 py-2 border-2 rounded-lg"
                style="border-color: var(--color-train-light-green);"
              >
                {#each seatLetters as letter (letter)}
                  <option value={letter}>{letter}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- 价格 -->
          <div>
            <label for="amount" class="block font-semibold mb-2" style="color: var(--color-train-green);">价格 (元)</label>
            <input
              id="amount"
              type="number"
              bind:value={amount}
              min="0"
              step="0.1"
              class="w-full px-4 py-2 border-2 rounded-lg"
              style="border-color: var(--color-train-light-green);"
            />
          </div>

          <!-- 提交按钮 -->
          <button
            type="submit"
            disabled={submitting}
            class="w-full py-3 rounded-lg font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style="background-color: var(--color-train-light-green);"
          >
            {submitting ? '处理中...' : '确认购票'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

