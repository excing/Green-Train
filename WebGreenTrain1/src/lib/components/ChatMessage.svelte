<script lang="ts">
  import type { ChatMessage } from '../types';

  export let message: ChatMessage;
  export let isCurrentUser: boolean = false;

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="flex {isCurrentUser ? 'justify-end' : 'justify-start'} mb-4">
  <div class="flex gap-2 max-w-xs {isCurrentUser ? 'flex-row-reverse' : 'flex-row'}">
    <!-- Avatar -->
    <div class="w-8 h-8 rounded-full {isCurrentUser ? 'bg-blue-500' : 'bg-green-500'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
      {message.userName.charAt(0)}
    </div>

    <!-- Message Bubble -->
    <div class="flex flex-col {isCurrentUser ? 'items-end' : 'items-start'}">
      <p class="text-xs text-gray-500 mb-1 px-2">
        {message.userName}
        <span class="ml-2">{formatTime(message.timestamp)}</span>
      </p>
      <div class="px-3 py-2 rounded-lg {isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}">
        <p class="text-sm break-words">{message.content}</p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional styling if needed */
</style>

