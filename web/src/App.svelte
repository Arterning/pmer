<script lang="ts">
  import { Router, Route, navigate } from 'svelte-routing';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import Toast from '$lib/components/ui/Toast.svelte';
  import Auth from '$lib/components/pages/Auth.svelte';
  import Passwords from '$lib/components/pages/Passwords.svelte';
  import Commands from '$lib/components/pages/Commands.svelte';

  onMount(() => {
    // 检查初始路由
    const isAuthenticated = $authStore.isAuthenticated;
    const currentPath = window.location.pathname;

    if (!isAuthenticated && currentPath !== '/auth') {
      navigate('/auth', { replace: true });
    } else if (isAuthenticated && currentPath === '/auth') {
      navigate('/', { replace: true });
    }
  });
</script>

<Router>
  <div>
    <Route path="/auth" component={Auth} />
    <Route path="/" component={Passwords} />
    <Route path="/commands" component={Commands} />
  </div>
</Router>

<Toast />
