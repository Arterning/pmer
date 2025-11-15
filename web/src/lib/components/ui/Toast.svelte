<script lang="ts">
  import { toastStore } from '$lib/utils/toast';
  import { fly } from 'svelte/transition';

  const toasts = toastStore;

  function getBgColor(type: string) {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }
</script>

<div class="fixed bottom-4 right-4 z-50 space-y-2">
  {#each $toasts as toast (toast.id)}
    <div
      transition:fly={{ y: 50, duration: 300 }}
      class="{getBgColor(toast.type)} text-white px-6 py-3 rounded-lg shadow-lg"
    >
      {toast.message}
    </div>
  {/each}
</div>
