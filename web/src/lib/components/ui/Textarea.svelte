<script lang="ts">
  export let value: string = '';
  export let placeholder: string = '';
  export let rows: number = 3;
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;
  let className: string = '';
  export { className as class };
</script>

<textarea
  bind:value
  {placeholder}
  {rows}
  {required}
  {disabled}
  {id}
  class="block w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed {className}"
></textarea>
