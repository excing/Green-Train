<script lang="ts">
  interface Option {
    value: string | number;
    label: string;
  }

  interface Props {
    label?: string;
    options: Option[];
    value?: string | number;
    error?: string;
    hint?: string;
    class?: string;
    disabled?: boolean;
  }

  let {
    label,
    options,
    value = $bindable(''),
    error,
    hint,
    class: className = '',
    disabled = false
  }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  {#if label}
    <label for="select-{Math.random()}" class="text-sm font-medium text-gray-700">
      {label}
    </label>
  {/if}

  <select
    id="select-{Math.random()}"
    bind:value
    {disabled}
    class={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
      error ? 'border-red-500 focus:ring-red-500' : ''
    } ${className}`}
  >
    <option value="">-- 请选择 --</option>
    {#each options as option (option.value)}
      <option value={option.value}>
        {option.label}
      </option>
    {/each}
  </select>
  
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if hint}
    <p class="text-sm text-gray-500">{hint}</p>
  {/if}
</div>

