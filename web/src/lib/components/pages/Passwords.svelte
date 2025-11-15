<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import { authStore } from '$lib/stores/auth';
  import { passwordsApi } from '$lib/api/passwords';
  import { toastStore } from '$lib/utils/toast';
  import type { Password } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Label from '$lib/components/ui/Label.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  let allPasswords: Password[] = [];
  let currentCategory = 'all';
  let currentPage = 1;
  const itemsPerPage = 10;

  // 响应式声明
  $: filteredPasswords = currentCategory === 'all'
    ? allPasswords
    : allPasswords.filter(p => p.category === currentCategory);

  $: totalPages = Math.ceil(filteredPasswords.length / itemsPerPage);

  $: paginatedPasswords = filteredPasswords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: categories = ['all', ...new Set(allPasswords.map(p => p.category).filter(c => c))].map(cat => ({
    name: cat === 'all' ? '全部' : cat,
    value: cat,
    count: cat === 'all' ? allPasswords.length : allPasswords.filter(p => p.category === cat).length
  }));

  // 模态框状态
  let modalOpen = false;
  let modalTitle = '添加新密码';
  let editingId: number | null = null;

  // 表单字段
  let formTitle = '';
  let formUrl = '';
  let formUsername = '';
  let formPassword = '';
  let formCategory = '';
  let formNotes = '';

  // 密码生成器设置
  let passwordLength = 16;
  let includeNumbers = true;
  let includeSymbols = true;

  // onMount(() => {
  //   console.log("fuck")
  //   checkAuth();
  //   fetchPasswords();
  // });

  checkAuth();
  fetchPasswords();

  function checkAuth() {
    if (!$authStore.isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }

  async function fetchPasswords() {
    try {
      console.log('开始获取密码列表...');
      const response = await passwordsApi.getAll();
      console.log('API 响应:', response);
      console.log('密码列表:', response.passwords);
      console.log('密码数量:', response.passwords?.length);
      allPasswords = response.passwords || [];
      console.log('allPasswords 已更新:', allPasswords.length);
    } catch (error: any) {
      console.error('获取密码失败:', error);
      toastStore.show(error.message || '获取密码列表失败', 'error');
      if (error.message?.includes('401')) {
        authStore.logout();
        navigate('/auth', { replace: true });
      }
    }
  }

  function selectCategory(category: string) {
    currentCategory = category;
    currentPage = 1;
  }

  function showAddModal() {
    editingId = null;
    modalTitle = '添加新密码';
    resetForm();
    modalOpen = true;
  }

  async function showEditModal(id: number) {
    try {
      const password = await passwordsApi.getById(id);
      editingId = id;
      modalTitle = '编辑密码';
      formTitle = password.title || '';
      formUrl = password.url || '';
      formUsername = password.username || '';
      formPassword = password.password || '';
      formCategory = password.category || '';
      formNotes = password.notes || '';
      modalOpen = true;
    } catch (error: any) {
      toastStore.show(error.message || '获取密码详情失败', 'error');
    }
  }

  async function handleSave() {
    if (!formTitle || !formPassword) {
      toastStore.show('标题和密码为必填项', 'error');
      return;
    }

    try {
      if (editingId) {
        const result = await passwordsApi.update(editingId, {
          title: formTitle,
          url: formUrl,
          username: formUsername,
          password: formPassword,
          category: formCategory,
          notes: formNotes,
        });
        console.log('更新结果:', result);
        toastStore.show('密码更新成功', 'success');
      } else {
        const result = await passwordsApi.create({
          title: formTitle,
          url: formUrl,
          username: formUsername,
          password: formPassword,
          category: formCategory,
          notes: formNotes,
        });
        console.log('创建结果:', result);
        toastStore.show('密码添加成功', 'success');
      }
      modalOpen = false;
      resetForm();
      console.log('准备刷新密码列表...');
      await fetchPasswords();
    } catch (error: any) {
      toastStore.show(error.message || '保存失败', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定要删除这个密码吗？')) {
      return;
    }

    try {
      await passwordsApi.delete(id);
      toastStore.show('密码删除成功', 'success');
      fetchPasswords();
    } catch (error: any) {
      toastStore.show(error.message || '删除失败', 'error');
    }
  }

  async function copyPassword(id: number) {
    try {
      const password = await passwordsApi.getById(id);
      await navigator.clipboard.writeText(password.password || '');
      toastStore.show('密码已复制到剪贴板', 'success');
    } catch (error: any) {
      toastStore.show('复制密码失败', 'error');
    }
  }

  async function copyUsername(username: string) {
    if (username && username !== '-') {
      try {
        await navigator.clipboard.writeText(username);
        toastStore.show('用户名已复制到剪贴板', 'success');
      } catch (error: any) {
        toastStore.show('复制用户名失败', 'error');
      }
    }
  }

  function generatePassword() {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let password = '';
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars.charAt(randomIndex);
    }

    formPassword = password;
  }

  function resetForm() {
    formTitle = '';
    formUrl = '';
    formUsername = '';
    formPassword = '';
    formCategory = '';
    formNotes = '';
  }

  function handleLogout() {
    authStore.logout();
    navigate('/auth', { replace: true });
  }
</script>

<div class="bg-gray-900 text-gray-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <!-- 页面标题和导航 -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-4">
        <h1 class="text-3xl font-bold text-blue-400">PMER 密码管理器</h1>
        <div class="flex space-x-2">
          <a href="/" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">密码管理</a>
          <a href="/commands" class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">命令管理</a>
        </div>
      </div>
      <Button variant="danger" on:click={handleLogout}>退出登录</Button>
    </div>

    <!-- 主内容区域 -->
    <div class="flex gap-6">
      <!-- 左侧分类导航栏 -->
      <div class="w-64 bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 h-fit">
        <h2 class="text-lg font-semibold text-blue-400 mb-4">密码分类</h2>
        <ul class="space-y-2">
          {#each categories as category}
            <li
              class="px-4 py-3 cursor-pointer hover:bg-gray-700 rounded transition-colors {currentCategory === category.value ? 'bg-gray-700 border-l-4 border-blue-500' : ''}"
              on:click={() => selectCategory(category.value)}
            >
              <div class="flex justify-between items-center">
                <span class="text-gray-200">{category.name}</span>
                <span class="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">{category.count}</span>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <!-- 右侧密码列表 -->
      <div class="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div class="mb-6">
          <Button variant="success" on:click={showAddModal}>添加新密码</Button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
            <thead>
              <tr class="bg-gray-700 text-left">
                <th class="py-3 px-4 font-semibold">标题</th>
                <th class="py-3 px-4 font-semibold">URL</th>
                <th class="py-3 px-4 font-semibold">用户名</th>
                <th class="py-3 px-4 font-semibold">分类</th>
                <th class="py-3 px-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {#if paginatedPasswords.length === 0}
                <tr>
                  <td colspan="5" class="text-center py-4 text-gray-400">没有保存的密码</td>
                </tr>
              {:else}
                {#each paginatedPasswords as password}
                  <tr class="border-b border-gray-700 hover:bg-gray-700">
                    <td class="py-3 px-4">{password.title}</td>
                    <td class="py-3 px-4 text-center">
                      {#if password.url}
                        <a href={password.url} target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 inline-flex items-center" title={password.url}>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      {:else}
                        <span class="text-gray-500">-</span>
                      {/if}
                    </td>
                    <td class="py-3 px-4 cursor-pointer" on:click={() => copyUsername(password.username || '-')} title="点击复制用户名">{password.username || '-'}</td>
                    <td class="py-3 px-4">{password.category || '-'}</td>
                    <td class="py-3 px-4 flex space-x-3">
                      <button on:click={() => copyPassword(password.id)} class="text-blue-400 hover:text-blue-300" title="复制密码">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button on:click={() => showEditModal(password.id)} class="text-green-400 hover:text-green-300" title="编辑">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button on:click={() => handleDelete(password.id)} class="text-red-400 hover:text-red-300" title="删除">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        <!-- 分页控件 -->
        {#if totalPages > 1}
          <div class="mt-6 flex justify-center">
            <div class="flex items-center space-x-2">
              <Button
                size="sm"
                disabled={currentPage <= 1}
                on:click={() => currentPage--}
              >
                上一页
              </Button>
              <span class="text-gray-300">第 {currentPage} / {totalPages} 页 (共 {filteredPasswords.length} 条)</span>
              <Button
                size="sm"
                disabled={currentPage >= totalPages}
                on:click={() => currentPage++}
              >
                下一页
              </Button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- 添加/编辑密码模态框 -->
<Modal bind:open={modalOpen} title={modalTitle}>
  <form class="grid grid-cols-2 gap-6" on:submit|preventDefault={handleSave}>
    <div>
      <Label for="password-title" required>标题</Label>
      <Input id="password-title" type="text" bind:value={formTitle} required />
    </div>
    <div>
      <Label for="password-url">URL</Label>
      <Input id="password-url" type="text" bind:value={formUrl} />
    </div>
    <div>
      <Label for="password-username">用户名</Label>
      <Input id="password-username" type="text" bind:value={formUsername} />
    </div>
    <div>
      <Label for="password-value" required>密码</Label>
      <div class="flex gap-2">
        <Input id="password-value" type="password" bind:value={formPassword} required />
        <Button type="button" on:click={generatePassword}>生成</Button>
      </div>
    </div>
    <div class="col-span-2 bg-gray-750 p-5 rounded-lg border border-gray-600">
      <h3 class="text-base font-semibold text-gray-200 mb-4">密码生成器</h3>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <Label for="password-length">密码长度</Label>
          <Input id="password-length" type="number" bind:value={passwordLength} min="8" max="32" />
        </div>
        <div class="flex items-center gap-6 mt-8">
          <div class="flex items-center">
            <input type="checkbox" id="include-numbers" bind:checked={includeNumbers} class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-opacity-30" />
            <label for="include-numbers" class="ml-2 text-sm text-gray-300">数字</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="include-symbols" bind:checked={includeSymbols} class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-opacity-30" />
            <label for="include-symbols" class="ml-2 text-sm text-gray-300">特殊符号</label>
          </div>
        </div>
      </div>
    </div>
    <div>
      <Label for="password-category">分类</Label>
      <Input id="password-category" type="text" bind:value={formCategory} />
    </div>
    <div>
      <Label for="password-notes">备注</Label>
      <Textarea id="password-notes" bind:value={formNotes} />
    </div>
    <div class="col-span-2 flex justify-end gap-3 mt-4">
      <Button type="button" variant="secondary" on:click={() => modalOpen = false}>取消</Button>
      <Button type="submit" variant="primary">保存</Button>
    </div>
  </form>
</Modal>
