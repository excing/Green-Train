<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { trains } from '$lib/stores/trains';
  import { Card, Button, Input, ChatMessage, Alert } from '$lib/components';

  let train = $derived($trains.find(t => t.id === $page.params.id));
  let serviceDate = $derived($page.url.searchParams.get('date') || '');

  let messages = $state<Array<{ author: string; content: string; timestamp: string; isOwn: boolean }>>([]);
  let messageInput = $state('');
  let messagesContainer = $state<HTMLDivElement | null>(null);
  let currentUser = $state('User' + Math.floor(Math.random() * 10000));
  let roomStatus = $state<'waiting' | 'active' | 'closed'>('active');
  let timeRemaining = $state(3600); // 1小时

  onMount(() => {
    // 模拟接收消息
    const mockMessages = [
      { author: 'User123', content: '大家好！', timestamp: new Date(Date.now() - 300000).toISOString(), isOwn: false },
      { author: 'User456', content: '你好呀！', timestamp: new Date(Date.now() - 240000).toISOString(), isOwn: false },
      { author: currentUser, content: '大家好，很高兴认识你们！', timestamp: new Date(Date.now() - 180000).toISOString(), isOwn: true }
    ];
    messages = mockMessages;

    // 更新倒计时
    const interval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        roomStatus = 'closed';
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  function sendMessage() {
    if (!messageInput.trim()) return;

    messages = [
      ...messages,
      {
        author: currentUser,
        content: messageInput,
        timestamp: new Date().toISOString(),
        isOwn: true
      }
    ];

    messageInput = '';

    // 滚动到底部
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 0);
  }

  function formatTimeRemaining(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

{#if !train}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-600">列车不存在</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- 头部 -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{train.name}</h1>
          <p class="text-gray-600 text-sm mt-1">{train.theme}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">聊天室关闭倒计时</p>
          <p class="text-2xl font-bold text-blue-600 font-mono">{formatTimeRemaining(timeRemaining)}</p>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <!-- 左侧：聊天区域 -->
        <div class="lg:col-span-3 flex flex-col">
          <!-- 消息区域 -->
          <Card class="flex-1 flex flex-col mb-4">
            {#if roomStatus === 'closed'}
              <Alert type="warning" title="聊天室已关闭">
                <p>感谢您的参与！聊天室已关闭，所有消息已清除。</p>
              </Alert>
            {:else}
              <div
                bind:this={messagesContainer}
                class="flex-1 overflow-y-auto p-4 space-y-2"
              >
                {#each messages as msg (msg.timestamp)}
                  <ChatMessage
                    author={msg.author}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    isOwn={msg.isOwn}
                  />
                {/each}
              </div>
            {/if}
          </Card>

          <!-- 输入区域 -->
          {#if roomStatus !== 'closed'}
            <Card>
              <div class="flex gap-2">
                <Input
                  placeholder="输入消息..."
                  bind:value={messageInput}
                  onkeydown={handleKeydown}
                  class="flex-1"
                />
                <Button
                  variant="primary"
                  onclick={sendMessage}
                  disabled={!messageInput.trim()}
                >
                  发送
                </Button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                💡 提示：所有消息在聊天室关闭后将被清除（阅后即焚）
              </p>
            </Card>
          {/if}
        </div>

        <!-- 右侧：信息面板 -->
        <div class="lg:col-span-1">
          <Card class="sticky top-24">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">聊天室信息</h2>

            <!-- 用户信息 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">您的昵称</p>
              <p class="font-mono text-gray-900 mt-1">{currentUser}</p>
            </div>

            <!-- 房间类型 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">房间类型</p>
              <p class="font-semibold text-gray-900 mt-1">全车聊天室</p>
            </div>

            <!-- 在线人数 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">在线人数</p>
              <p class="text-2xl font-bold text-blue-600 mt-1">
                {messages.filter(m => !m.isOwn).length + 1}
              </p>
            </div>

            <!-- 车次信息 -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm text-gray-500">出发日期</p>
              <p class="font-semibold text-gray-900 mt-1">{serviceDate}</p>
            </div>

            <!-- 操作按钮 -->
            <Button
              variant="secondary"
              size="sm"
              class="w-full"
              onclick={() => window.location.href = '/'}
            >
              返回首页
            </Button>
          </Card>
        </div>
      </div>
    </main>
  </div>
{/if}

