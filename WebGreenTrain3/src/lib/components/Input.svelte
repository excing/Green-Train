<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    hint?: string;
    value?: string | number;
  }

  let {
    label,
    error,
    hint,
    value = $bindable(''),
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  {#if label}
    <label for="input-{Math.random()}" class="text-sm font-medium text-gray-700">
      {label}
    </label>
  {/if}

  <input
    id="input-{Math.random()}"
    bind:value
    class={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
      error ? 'border-red-500 focus:ring-red-500' : ''
    } ${className}`}
    {...rest}
  />
  
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if hint}
    <p class="text-sm text-gray-500">{hint}</p>
  {/if}
</div>

