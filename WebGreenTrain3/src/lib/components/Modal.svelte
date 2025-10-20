<script lang="ts">
  interface Props {
    open: boolean;
    title?: string;
    onClose?: () => void;
    children?: any;
    footer?: any;
  }

  let { open, title, onClose, children, footer }: Props = $props();

  function handleBackdropClick() {
    onClose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose?.();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
      on:click={handleBackdropClick}
      role="presentation"
    />
    
    <!-- 模态框 -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
      <!-- 头部 -->
      {#if title}
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            on:click={onClose}
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      {/if}
      
      <!-- 内容 -->
      <div class="p-6">
        {@render children?.()}
      </div>
      
      <!-- 底部 -->
      {#if footer}
        <div class="flex gap-3 p-6 border-t border-gray-200">
          {@render footer?.()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>

