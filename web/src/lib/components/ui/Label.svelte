<script lang="ts">
  export let required: boolean = false;
  let htmlFor: string | undefined = undefined;
  export { htmlFor as for };
  let className: string = '';
  export { className as class };
</script>

<label
  for={htmlFor}
  class="block text-sm font-medium text-gray-300 mb-2 {className}"
>
  <slot />
  {#if required}
    <span class="text-red-400 ml-1">*</span>
  {/if}
</label>
