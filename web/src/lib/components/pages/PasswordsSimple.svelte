<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import { authStore } from '$lib/stores/auth';
  import Button from '$lib/components/ui/Button.svelte';

  onMount(() => {
    if (!$authStore.isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  });

  function handleLogout() {
    authStore.logout();
    navigate('/auth', { replace: true });
  }
</script>

<div class="bg-gray-900 text-gray-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-blue-400">PMER 密码管理器</h1>
      <Button variant="danger" on:click={handleLogout}>退出登录</Button>
    </div>

    <div class="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <p>✅ Svelte 4 渲染正常！</p>
      <p class="mt-2">✅ Button 组件工作正常！</p>
    </div>
  </div>
</div>
