<script lang="ts">
  interface Props {
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    class?: string;
    children?: any;
  }

  let { type = 'info', title, dismissible = false, onDismiss, class: className = '', children }: Props = $props();
  let visible = $state(true);

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  function handleDismiss() {
    visible = false;
    onDismiss?.();
  }
</script>

{#if visible}
  <div class={`border rounded-lg p-4 flex gap-3 ${typeClasses[type]} ${className}`}>
    <div class="flex-shrink-0 text-lg font-bold">
      {icons[type]}
    </div>
    <div class="flex-1">
      {#if title}
        <h3 class="font-semibold mb-1">{title}</h3>
      {/if}
      <div class="text-sm">
        {@render children?.()}
      </div>
    </div>
    {#if dismissible}
      <button
        on:click={handleDismiss}
        class="flex-shrink-0 text-lg hover:opacity-70 transition-opacity"
        aria-label="关闭"
      >
        ✕
      </button>
    {/if}
  </div>
{/if}

