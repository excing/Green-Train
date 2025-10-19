<script lang="ts">
  import { onMount } from 'svelte';
  import type { Train, ChatMessage, Ticket } from '$lib/types';
  import { generateChatRoomId } from '$lib/utils';
  import { currentTicket, userProfile, chatMessages } from '$lib/store';
  import { page } from '$app/stores';
  import ChatMessageComponent from '$lib/components/ChatMessage.svelte';

  let train: Train | null = null;
  let ticket: Ticket | null = null;
  let profile: any = null;
  let loading = true;
  let error = '';
  let messages: ChatMessage[] = [];
  let messageInput = '';
  let currentRoomType: 'train' | 'carriage' | 'seat' = 'train';
  let currentRoomId = '';
  let messagesContainer: HTMLDivElement;

  // Simulated online users
  let onlineUsers = [
    { id: '1', name: '旅客A', status: 'online' },
    { id: '2', name: '旅客B', status: 'online' },
    { id: '3', name: '旅客C', status: 'online' },
    { id: '4', name: '旅客D', status: 'away' }
  ];

  onMount(async () => {
    try {
      const trainId = $page.params.id;
      const response = await fetch('/data/trains.json');
      if (!response.ok) throw new Error('Failed to load trains');
      const trains: Train[] = await response.json();
      train = trains.find(t => t.id === trainId);
      if (!train) throw new Error('Train not found');

      // Get ticket and profile from stores
      currentTicket.subscribe(t => {
        ticket = t;
      });

      userProfile.subscribe(p => {
        profile = p;
      });

      chatMessages.subscribe(msgs => {
        messages = msgs;
      });

      if (!ticket) throw new Error('No ticket found');

      // Initialize room
      updateRoom('train');
      loading = false;

      // Add some simulated messages
      addSimulatedMessages();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      loading = false;
    }
  });

  function updateRoom(roomType: 'train' | 'carriage' | 'seat') {
    if (!train || !ticket) return;

    currentRoomType = roomType;

    if (roomType === 'train') {
      currentRoomId = generateChatRoomId(train.id, 'train');
    } else if (roomType === 'carriage') {
      currentRoomId = generateChatRoomId(train.id, 'carriage', ticket.seat.carriage);
    } else if (roomType === 'seat') {
      const seatNumber = `${ticket.seat.carriage}-${ticket.seat.row}-${ticket.seat.seat}`;
      currentRoomId = generateChatRoomId(train.id, 'seat', undefined, seatNumber);
    }

    // Clear messages when switching rooms
    messages = [];
    addSimulatedMessages();
  }

  function addSimulatedMessages() {
    const simMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'user1',
        userName: '旅客A',
        content: '大家好！这是一个很有趣的主题',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        roomId: currentRoomId
      },
      {
        id: '2',
        userId: 'user2',
        userName: '旅客B',
        content: '是啊，我也很感兴趣！',
        timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
        roomId: currentRoomId
      },
      {
        id: '3',
        userId: 'user3',
        userName: '旅客C',
        content: '有人看过最新的电影吗？',
        timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
        roomId: currentRoomId
      }
    ];
    messages = simMessages;
    chatMessages.set(simMessages);
  }

  function sendMessage() {
    if (!messageInput.trim() || !profile) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: profile.id,
      userName: profile.name,
      content: messageInput,
      timestamp: new Date().toISOString(),
      roomId: currentRoomId
    };

    messages = [...messages, newMessage];
    chatMessages.set(messages);
    messageInput = '';

    // Auto scroll to bottom
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 0);

    // Simulate response
    setTimeout(() => {
      const responses = [
        '很同意你的看法！',
        '这个观点很有意思',
        '我也是这么想的',
        '你说得太对了！',
        '完全赞同！'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const respondingUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];

      const responseMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: respondingUser.id,
        userName: respondingUser.name,
        content: randomResponse,
        timestamp: new Date().toISOString(),
        roomId: currentRoomId
      };

      messages = [...messages, responseMessage];
      chatMessages.set(messages);

      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 1000);
  }

  function goBack() {
    window.history.back();
  }

  function getRoomName(): string {
    if (currentRoomType === 'train') return '车次频道';
    if (currentRoomType === 'carriage') return `${ticket?.seat.carriage}号车厢`;
    return '邻座频道';
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-700 flex flex-col">
  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <p class="text-white text-xl">加载中...</p>
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center">
      <div class="bg-red-500/20 border border-red-400 text-red-100 p-4 rounded-lg max-w-md">
        <p>错误: {error}</p>
      </div>
    </div>
  {:else if train && ticket && profile}
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-800 to-green-700 border-b-2 border-green-600 p-4 shadow-lg">
      <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h1 class="text-2xl font-bold text-white">{train.name}</h1>
            <p class="text-green-100 text-sm">{train.theme}</p>
          </div>
          <button
            on:click={goBack}
            class="text-green-100 hover:text-white transition-colors"
          >
            ← 返回
          </button>
        </div>

        <!-- Room Tabs -->
        <div class="flex gap-2 flex-wrap">
          <button
            on:click={() => updateRoom('train')}
            class="px-4 py-2 rounded-lg font-semibold transition-all {currentRoomType === 'train'
              ? 'bg-yellow-500 text-white'
              : 'bg-white/10 text-green-100 hover:bg-white/20'}"
          >
            🚂 车次频道
          </button>
          <button
            on:click={() => updateRoom('carriage')}
            class="px-4 py-2 rounded-lg font-semibold transition-all {currentRoomType === 'carriage'
              ? 'bg-yellow-500 text-white'
              : 'bg-white/10 text-green-100 hover:bg-white/20'}"
          >
            🚪 {ticket.seat.carriage}号车厢
          </button>
          <button
            on:click={() => updateRoom('seat')}
            class="px-4 py-2 rounded-lg font-semibold transition-all {currentRoomType === 'seat'
              ? 'bg-yellow-500 text-white'
              : 'bg-white/10 text-green-100 hover:bg-white/20'}"
          >
            👥 邻座频道
          </button>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex gap-4 p-4 max-w-6xl mx-auto w-full">
      <!-- Messages Area -->
      <div class="flex-1 flex flex-col bg-white/10 backdrop-blur-md rounded-lg border border-green-400/30 overflow-hidden">
        <!-- Room Info -->
        <div class="bg-green-900/50 border-b border-green-400/30 p-3">
          <p class="text-green-100 text-sm font-semibold">{getRoomName()}</p>
          <p class="text-green-200 text-xs">{currentRoomId}</p>
        </div>

        <!-- Messages -->
        <div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-4 space-y-2">
          {#each messages as message (message.id)}
            <ChatMessageComponent
              {message}
              isCurrentUser={message.userId === profile.id}
            />
          {/each}
        </div>

        <!-- Input Area -->
        <div class="border-t border-green-400/30 p-4 bg-green-900/30">
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="输入消息..."
              bind:value={messageInput}
              on:keydown={(e) => e.key === 'Enter' && sendMessage()}
              class="flex-1 bg-white/20 text-white placeholder-green-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <button
              on:click={sendMessage}
              class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar - Online Users -->
      <div class="w-48 bg-white/10 backdrop-blur-md rounded-lg border border-green-400/30 overflow-hidden flex flex-col">
        <div class="bg-green-900/50 border-b border-green-400/30 p-3">
          <p class="text-green-100 text-sm font-semibold">在线用户 ({onlineUsers.length})</p>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          {#each onlineUsers as user (user.id)}
            <div class="flex items-center gap-2 p-2 bg-green-900/30 rounded-lg">
              <div class="w-3 h-3 rounded-full {user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}"></div>
              <p class="text-green-100 text-sm flex-1 truncate">{user.name}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>

