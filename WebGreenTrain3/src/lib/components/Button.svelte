<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    class: className = '',
    children,
    onclick,
    ...rest
  }: Props = $props();

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-900'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button
  {disabled}
  class={classes}
  {...rest}
>
  {#if loading}
    <span class="inline-block animate-spin mr-2">⏳</span>
  {/if}
  {@render children?.()}
</button>

<style>
  button {
    cursor: pointer;
  }
</style>

