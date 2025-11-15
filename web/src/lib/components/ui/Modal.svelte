<script lang="ts">
  export let open: boolean = false;
  export let title: string = '';
  export let onClose: (() => void) | undefined = undefined;

  function handleClose() {
    open = false;
    onClose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
</script>

<div
  class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-200 {open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"
  on:click={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-hidden={!open}
>
  <div class="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 border border-gray-600 transition-transform duration-200 {open ? 'scale-100' : 'scale-95'}">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-blue-400">{title}</h2>
      <button
        class="text-gray-400 hover:text-white text-3xl leading-none transition-colors"
        on:click={handleClose}
        aria-label="关闭"
        type="button"
      >
        &times;
      </button>
    </div>
    <div>
      <slot />
    </div>
  </div>
</div>
