<script lang="ts">
  import { navigate } from 'svelte-routing';
  import { authStore } from '$lib/stores/auth';
  import { authApi } from '$lib/api/auth';
  import { toastStore } from '$lib/utils/toast';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Label from '$lib/components/ui/Label.svelte';

  let activeTab: 'login' | 'register' = 'login';
  let loading = false;

  // 登录表单
  let loginUsername = '';
  let loginPassword = '';

  // 注册表单
  let registerUsername = '';
  let registerEmail = '';
  let registerPassword = '';

  async function handleLogin() {
    if (!loginUsername || !loginPassword) {
      toastStore.show('请填写用户名和密码', 'error');
      return;
    }

    loading = true;
    try {
      const response = await authApi.login(loginUsername, loginPassword);
      authStore.login(response.token, response.user);
      toastStore.show('登录成功', 'success');
      navigate('/', { replace: true });
    } catch (error: any) {
      toastStore.show(error.message || '登录失败', 'error');
    } finally {
      loading = false;
    }
  }

  async function handleRegister() {
    if (!registerUsername || !registerEmail || !registerPassword) {
      toastStore.show('请填写所有必填字段', 'error');
      return;
    }

    loading = true;
    try {
      await authApi.register(registerUsername, registerEmail, registerPassword);
      toastStore.show('注册成功，请登录', 'success');
      activeTab = 'login';
      // 清空注册表单
      registerUsername = '';
      registerEmail = '';
      registerPassword = '';
    } catch (error: any) {
      toastStore.show(error.message || '注册失败', 'error');
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-gray-900 text-gray-200 min-h-screen flex items-center justify-center">
  <div class="container mx-auto px-6 py-12 max-w-md">
    <div class="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
      <!-- 标签页 -->
      <div class="flex mb-8">
        <button
          class="flex-1 py-3 text-center rounded-l-lg transition-colors duration-200 {activeTab === 'login'
            ? 'bg-blue-600 text-white'
            : 'bg-dark-300 text-gray-300'}"
          on:click={() => (activeTab = 'login')}
        >
          登录
        </button>
        <button
          class="flex-1 py-3 text-center rounded-r-lg transition-colors duration-200 {activeTab === 'register'
            ? 'bg-blue-600 text-white'
            : 'bg-dark-300 text-gray-300'}"
          on:click={() => (activeTab = 'register')}
        >
          注册
        </button>
      </div>

      {#if activeTab === 'login'}
        <!-- 登录表单 -->
        <form class="space-y-5" on:submit|preventDefault={handleLogin}>
          <div>
            <Label for="login-username" required>用户名</Label>
            <Input
              id="login-username"
              type="text"
              bind:value={loginUsername}
              required
            />
          </div>
          <div>
            <Label for="login-password" required>密码</Label>
            <Input
              id="login-password"
              type="password"
              bind:value={loginPassword}
              required
            />
          </div>
          <div class="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              class="w-full"
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </div>
        </form>
      {:else}
        <!-- 注册表单 -->
        <form class="space-y-5" on:submit|preventDefault={handleRegister}>
          <div>
            <Label for="reg-username" required>用户名</Label>
            <Input
              id="reg-username"
              type="text"
              bind:value={registerUsername}
              required
            />
          </div>
          <div>
            <Label for="reg-email" required>邮箱</Label>
            <Input
              id="reg-email"
              type="email"
              bind:value={registerEmail}
              required
            />
          </div>
          <div>
            <Label for="reg-password" required>密码</Label>
            <Input
              id="reg-password"
              type="password"
              bind:value={registerPassword}
              required
            />
          </div>
          <div class="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              class="w-full"
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
