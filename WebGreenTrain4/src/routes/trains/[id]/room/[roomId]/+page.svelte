<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import type { RealtimeMessage } from '$lib/types';
  import { initFCM, subscribeToRoom, unsubscribeFromRoom, listenToMessages, sendMessageToRoom } from '$lib/fcm-client';

  let roomId: string = '';
  let messages: RealtimeMessage[] = [];
  let messageInput = '';
  let userName = 'Anonymous';
  let userId = 'user_' + Math.random().toString(36).substring(7);
  let loading = true;
  let error: string | null = null;
  let unsubscribeListener: (() => void) | null = null;
  let messagesContainer: HTMLDivElement;

  onMount(async () => {
    try {
      roomId = $page.params.roomId || '';
      
      // 初始化 FCM
      await initFCM();
      
      // 订阅房间
      await subscribeToRoom(roomId);
      
      // 监听消息
      unsubscribeListener = listenToMessages((message) => {
        messages = [...messages, message];
        // 自动滚动到底部
        setTimeout(() => {
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 0);
      });

      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to initialize room';
      loading = false;
    }
  });

  onDestroy(async () => {
    if (unsubscribeListener) {
      unsubscribeListener();
    }
    try {
      await unsubscribeFromRoom(roomId);
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  });

  async function handleSendMessage() {
    if (!messageInput.trim()) return;

    const content = messageInput;
    messageInput = '';

    try {
      await sendMessageToRoom(roomId, userId, userName, content);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to send message';
    }
  }

  function formatTime(isoString: string): string {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  }
</script>

<div class="min-h-screen flex flex-col" style="background-color: var(--color-train-cream);">
  <!-- 头部 -->
  <header class="sticky top-0 z-50 shadow-md" style="background-color: var(--color-train-green);">
    <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-white">候车室</h1>
        <p class="text-sm text-green-100">房间 ID: {roomId}</p>
      </div>
      <a href="/" class="text-white hover:text-green-100">← 返回</a>
    </div>
  </header>

  <!-- 消息区域 -->
  <div class="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto" bind:this={messagesContainer}>
    {#if loading}
      <div class="text-center py-12">
        <p class="text-lg" style="color: var(--color-train-green);">连接中...</p>
      </div>
    {:else if error}
      <div class="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-red-800 mb-4">
        <p>错误: {error}</p>
      </div>
    {/if}

    {#if messages.length === 0 && !loading}
      <div class="text-center py-12">
        <p class="text-lg text-gray-500">暂无消息，开始聊天吧！</p>
      </div>
    {/if}

    <div class="space-y-4">
      {#each messages as message (message.id)}
        <div class="flex gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style="background-color: var(--color-train-light-green);"
          >
            {message.user_name.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1">
            <div class="flex items-baseline gap-2 mb-1">
              <span class="font-semibold" style="color: var(--color-train-green);">
                {message.user_name}
              </span>
              <span class="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            </div>
            <div
              class="rounded-lg px-4 py-2 inline-block max-w-xs"
              style={message.user_id === userId
                ? `background-color: var(--color-train-light-green); color: white;`
                : `background-color: white; color: var(--color-train-green); border: 1px solid var(--color-train-pale-green);`}
            >
              <p class="break-words">{message.content}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 输入区域 -->
  <div class="sticky bottom-0 border-t-2" style="border-color: var(--color-train-pale-green); background-color: white;">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <div class="mb-3">
        <input
          type="text"
          placeholder="输入您的名字"
          bind:value={userName}
          class="w-full px-3 py-2 border-2 rounded-lg text-sm"
          style="border-color: var(--color-train-light-green);"
        />
      </div>
      <div class="flex gap-2">
        <input
          type="text"
          placeholder="输入消息..."
          bind:value={messageInput}
          on:keydown={(e) => e.key === 'Enter' && handleSendMessage()}
          class="flex-1 px-4 py-2 border-2 rounded-lg"
          style="border-color: var(--color-train-light-green);"
        />
        <button
          on:click={handleSendMessage}
          class="px-6 py-2 rounded-lg font-bold text-white transition-colors hover:opacity-90"
          style="background-color: var(--color-train-light-green);"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>

