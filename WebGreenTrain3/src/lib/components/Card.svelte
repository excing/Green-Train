<script lang="ts">
  interface Props {
    class?: string;
    hoverable?: boolean;
    children?: any;
  }

  let { class: className = '', hoverable = false, children }: Props = $props();

  const baseClasses = 'bg-white rounded-lg shadow-md p-6 border border-gray-200';
  const hoverClasses = hoverable ? 'hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer' : '';
  const classes = `${baseClasses} ${hoverClasses} ${className}`;
</script>

<div class={classes}>
  {@render children?.()}
</div>

