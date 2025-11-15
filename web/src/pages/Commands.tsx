import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Edit, Trash2, Plus } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/stores/auth';
import { commandsApi } from '@/lib/api/commands';
import { toast } from '@/lib/stores/toast';
import type { Command } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

export function Commands() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [currentType, setCurrentType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    command_type: '',
    command_text: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      fetchCommands();
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (currentType === 'all') {
      setFilteredCommands(commands);
    } else {
      setFilteredCommands(
        commands.filter((c) => c.command_type === currentType)
      );
    }
    setCurrentPage(1);
  }, [currentType, commands]);

  const fetchCommands = async () => {
    try {
      const response = await commandsApi.getAll();
      setCommands(response.commands || []);
    } catch (error: any) {
      toast.error(error.message || '获取命令列表失败');
      if (error.message?.includes('401')) {
        navigate('/auth');
      }
    }
  };

  const types = [
    {
      name: '全部',
      value: 'all',
      count: commands.length,
    },
    ...Array.from(new Set(commands.map((c) => c.command_type).filter(Boolean)))
      .map((type) => ({
        name: type as string,
        value: type as string,
        count: commands.filter((c) => c.command_type === type).length,
      })),
  ];

  const totalPages = Math.ceil(filteredCommands.length / itemsPerPage);
  const paginatedCommands = filteredCommands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const showAddModal = () => {
    setEditingId(null);
    resetForm();
    setModalOpen(true);
  };

  const showEditModal = (command: Command) => {
    setEditingId(command.id);
    setFormData({
      name: command.name || '',
      command_type: command.command_type || '',
      command_text: command.command_text || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.command_text) {
      toast.error('名称和命令文本为必填项');
      return;
    }

    try {
      if (editingId) {
        await commandsApi.update(editingId, formData);
        toast.success('命令更新成功');
      } else {
        await commandsApi.create(formData);
        toast.success('命令添加成功');
      }
      setModalOpen(false);
      resetForm();
      fetchCommands();
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个命令吗？')) {
      return;
    }

    try {
      await commandsApi.delete(id);
      toast.success('命令删除成功');
      fetchCommands();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const copyCommand = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('命令已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      command_type: '',
      command_text: '',
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <Layout>
      <div className="flex gap-6">
        {/* 左侧类型导航 */}
        <Card className="w-64 h-fit">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">命令类型</h2>
            <div className="space-y-1">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setCurrentType(type.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between',
                    currentType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <span>{type.name}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {type.count}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 右侧命令列表 */}
        <div className="flex-1">
          <div className="mb-6">
            <Button onClick={showAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              添加新命令
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">名称</th>
                      <th className="text-left p-4 font-semibold">类型</th>
                      <th className="text-left p-4 font-semibold">命令</th>
                      <th className="text-left p-4 font-semibold">创建时间</th>
                      <th className="text-left p-4 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCommands.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          没有保存的命令
                        </td>
                      </tr>
                    ) : (
                      paginatedCommands.map((command) => (
                        <tr key={command.id} className="border-b hover:bg-accent/50">
                          <td className="p-4">{command.name}</td>
                          <td className="p-4">{command.command_type || '-'}</td>
                          <td
                            className="p-4 font-mono text-sm cursor-pointer hover:text-primary max-w-xs truncate"
                            onClick={() => copyCommand(command.command_text)}
                            title={`点击复制\n${command.command_text}`}
                          >
                            {command.command_text.length > 50
                              ? command.command_text.substring(0, 50) + '...'
                              : command.command_text}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatDate(command.created_at)}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyCommand(command.command_text)}
                                title="复制命令"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => showEditModal(command)}
                                title="编辑"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(command.id)}
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} / {totalPages} 页 (共 {filteredCommands.length} 条)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加/编辑命令模态框 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑命令' : '添加新命令'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name" required>
                  名称
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">类型</Label>
                <Input
                  id="type"
                  value={formData.command_type}
                  onChange={(e) =>
                    setFormData({ ...formData, command_type: e.target.value })
                  }
                  placeholder="如: bash, docker, git 等"
                />
              </div>

              <div>
                <Label htmlFor="command" required>
                  命令文本
                </Label>
                <Textarea
                  id="command"
                  value={formData.command_text}
                  onChange={(e) =>
                    setFormData({ ...formData, command_text: e.target.value })
                  }
                  rows={6}
                  className="font-mono text-sm"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
