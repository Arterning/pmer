<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import { authStore } from '$lib/stores/auth';
  import { commandsApi } from '$lib/api/commands';
  import { toastStore } from '$lib/utils/toast';
  import type { Command } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Label from '$lib/components/ui/Label.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  let allCommands: Command[] = [];
  let currentType = 'all';
  let currentPage = 1;
  const itemsPerPage = 10;

  // 响应式声明
  $: filteredCommands = currentType === 'all'
    ? allCommands
    : allCommands.filter(c => c.command_type === currentType);

  $: totalPages = Math.ceil(filteredCommands.length / itemsPerPage);

  $: paginatedCommands = filteredCommands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: types = ['all', ...new Set(allCommands.map(c => c.command_type).filter(t => t))].map(type => ({
    name: type === 'all' ? '全部' : type,
    value: type,
    count: type === 'all' ? allCommands.length : allCommands.filter(c => c.command_type === type).length
  }));

  // 模态框状态
  let modalOpen = false;
  let modalTitle = '添加新命令';
  let editingId: number | null = null;

  // 表单字段
  let formName = '';
  let formType = '';
  let formText = '';

  // onMount(() => {
  //   checkAuth();
  //   fetchCommands();
  // });

  checkAuth();
  fetchCommands();

  function checkAuth() {
    if (!$authStore.isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }

  async function fetchCommands() {
    try {
      const response = await commandsApi.getAll();
      allCommands = response.commands;
    } catch (error: any) {
      toastStore.show(error.message || '获取命令列表失败', 'error');
      if (error.message?.includes('401')) {
        authStore.logout();
        navigate('/auth', { replace: true });
      }
    }
  }

  function selectType(type: string) {
    currentType = type;
    currentPage = 1;
  }

  function showAddModal() {
    editingId = null;
    modalTitle = '添加新命令';
    resetForm();
    modalOpen = true;
  }

  function showEditModal(command: Command) {
    editingId = command.id;
    modalTitle = '编辑命令';
    formName = command.name || '';
    formType = command.command_type || '';
    formText = command.command_text || '';
    modalOpen = true;
  }

  async function handleSave() {
    if (!formName || !formText) {
      toastStore.show('名称和命令文本为必填项', 'error');
      return;
    }

    try {
      if (editingId) {
        await commandsApi.update(editingId, {
          name: formName,
          command_type: formType,
          command_text: formText,
        });
        toastStore.show('命令更新成功', 'success');
      } else {
        await commandsApi.create({
          name: formName,
          command_type: formType,
          command_text: formText,
        });
        toastStore.show('命令添加成功', 'success');
      }
      modalOpen = false;
      resetForm();
      fetchCommands();
    } catch (error: any) {
      toastStore.show(error.message || '保存失败', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定要删除这个命令吗？')) {
      return;
    }

    try {
      await commandsApi.delete(id);
      toastStore.show('命令删除成功', 'success');
      fetchCommands();
    } catch (error: any) {
      toastStore.show(error.message || '删除失败', 'error');
    }
  }

  async function copyCommand(commandText: string) {
    try {
      await navigator.clipboard.writeText(commandText);
      toastStore.show('命令已复制到剪贴板', 'success');
    } catch (error: any) {
      toastStore.show('复制命令失败', 'error');
    }
  }

  function resetForm() {
    formName = '';
    formType = '';
    formText = '';
  }

  function handleLogout() {
    authStore.logout();
    navigate('/auth', { replace: true });
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  }
</script>

<div class="bg-gray-900 text-gray-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <!-- 页面标题和导航 -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-4">
        <h1 class="text-3xl font-bold text-blue-400">PMER 命令管理器</h1>
        <div class="flex space-x-2">
          <a href="/" class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">密码管理</a>
          <a href="/commands" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">命令管理</a>
        </div>
      </div>
      <Button variant="danger" on:click={handleLogout}>退出登录</Button>
    </div>

    <!-- 主内容区域 -->
    <div class="flex gap-6">
      <!-- 左侧类型导航栏 -->
      <div class="w-64 bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 h-fit">
        <h2 class="text-lg font-semibold text-blue-400 mb-4">命令类型</h2>
        <ul class="space-y-2">
          {#each types as type}
            <li
              class="px-4 py-3 cursor-pointer hover:bg-gray-700 rounded transition-colors {currentType === type.value ? 'bg-gray-700 border-l-4 border-blue-500' : ''}"
              on:click={() => selectType(type.value)}
            >
              <div class="flex justify-between items-center">
                <span class="text-gray-200">{type.name}</span>
                <span class="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">{type.count}</span>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <!-- 右侧命令列表 -->
      <div class="flex-1 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div class="mb-6">
          <Button variant="success" on:click={showAddModal}>添加新命令</Button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
            <thead>
              <tr class="bg-gray-700 text-left">
                <th class="py-3 px-4 font-semibold">名称</th>
                <th class="py-3 px-4 font-semibold">类型</th>
                <th class="py-3 px-4 font-semibold">命令</th>
                <th class="py-3 px-4 font-semibold">创建时间</th>
                <th class="py-3 px-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {#if paginatedCommands.length === 0}
                <tr>
                  <td colspan="5" class="text-center py-4 text-gray-400">没有保存的命令</td>
                </tr>
              {:else}
                {#each paginatedCommands as command}
                  <tr class="border-b border-gray-700 hover:bg-gray-700">
                    <td class="py-3 px-4">{command.name}</td>
                    <td class="py-3 px-4">{command.command_type || '-'}</td>
                    <td class="py-3 px-4 font-mono text-sm cursor-pointer" on:click={() => copyCommand(command.command_text)} title="点击复制命令&#10;&#10;{command.command_text}">
                      {command.command_text.length > 50 ? command.command_text.substring(0, 50) + '...' : command.command_text}
                    </td>
                    <td class="py-3 px-4 text-sm text-gray-400">{formatDate(command.created_at)}</td>
                    <td class="py-3 px-4 flex space-x-3">
                      <button on:click={() => copyCommand(command.command_text)} class="text-blue-400 hover:text-blue-300" title="复制命令">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button on:click={() => showEditModal(command)} class="text-green-400 hover:text-green-300" title="编辑">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button on:click={() => handleDelete(command.id)} class="text-red-400 hover:text-red-300" title="删除">
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
              <span class="text-gray-300">第 {currentPage} / {totalPages} 页 (共 {filteredCommands.length} 条)</span>
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

<!-- 添加/编辑命令模态框 -->
<Modal bind:open={modalOpen} title={modalTitle}>
  <form class="space-y-5" on:submit={(e) => { e.preventDefault(); handleSave(); }}>
    <div>
      <Label for="command-name" required>名称</Label>
      <Input id="command-name" type="text" bind:value={formName} required />
    </div>

    <div>
      <Label for="command-type">类型</Label>
      <Input id="command-type" type="text" bind:value={formType} placeholder="如: bash, docker, git 等" />
    </div>

    <div>
      <Label for="command-text" required>命令文本</Label>
      <Textarea id="command-text" bind:value={formText} rows={6} class="font-mono text-sm" required />
    </div>

    <div class="flex justify-end gap-3 mt-4">
      <Button type="button" variant="secondary" on:click={() => modalOpen = false}>取消</Button>
      <Button type="submit" variant="primary">保存</Button>
    </div>
  </form>
</Modal>
