<script lang="ts">
  export let type: string = 'text';
  export let value: string | number = '';
  export let placeholder: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;
  export let min: string | number | undefined = undefined;
  export let max: string | number | undefined = undefined;
  export let step: string | number | undefined = undefined;
  let className: string = '';
  export { className as class };
</script>

{#if type === 'text'}
  <input
    type="text"
    bind:value
    {placeholder}
    {required}
    {disabled}
    {id}
    class="block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed {className}"
  />
{:else if type === 'password'}
  <input
    type="password"
    bind:value
    {placeholder}
    {required}
    {disabled}
    {id}
    class="block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed {className}"
  />
{:else if type === 'email'}
  <input
    type="email"
    bind:value
    {placeholder}
    {required}
    {disabled}
    {id}
    class="block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed {className}"
  />
{:else if type === 'number'}
  <input
    type="number"
    bind:value
    {placeholder}
    {required}
    {disabled}
    {id}
    {min}
    {max}
    {step}
    class="block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed {className}"
  />
{:else}
  <!-- 其他类型的 input，不使用 bind:value -->
  <input
    type={type}
    value={value}
    on:input={(e) => value = e.currentTarget.value}
    {placeholder}
    {required}
    {disabled}
    {id}
    class="block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed {className}"
  />
{/if}
