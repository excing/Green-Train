<script lang="ts">
  interface Props {
    author: string;
    content: string;
    timestamp: string;
    isOwn?: boolean;
  }

  let { author, content, timestamp, isOwn = false }: Props = $props();

  function formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  }
</script>

<div class={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
  <!-- 头像 -->
  <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
    isOwn ? 'bg-blue-600' : 'bg-gray-400'
  }`}>
    {author.charAt(0).toUpperCase()}
  </div>

  <!-- 消息内容 -->
  <div class={`flex-1 ${isOwn ? 'text-right' : ''}`}>
    <div class="flex items-center gap-2" class:flex-row-reverse={isOwn}>
      <span class="text-sm font-medium text-gray-900">{author}</span>
      <span class="text-xs text-gray-500">{formatTime(timestamp)}</span>
    </div>
    <div class={`mt-1 inline-block px-3 py-2 rounded-lg max-w-xs break-words ${
      isOwn
        ? 'bg-blue-600 text-white rounded-br-none'
        : 'bg-gray-100 text-gray-900 rounded-bl-none'
    }`}>
      {content}
    </div>
  </div>
</div>

