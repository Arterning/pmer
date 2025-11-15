import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Edit, Trash2, Plus, ExternalLink, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/stores/auth';
import { passwordsApi } from '@/lib/api/passwords';
import { toast } from '@/lib/stores/toast';
import type { Password } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

export function Passwords() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const itemsPerPage = 10;

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    username: '',
    password: '',
    category: '',
    notes: '',
  });

  // 密码生成器状态
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      fetchPasswords();
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (currentCategory === 'all') {
      setFilteredPasswords(passwords);
    } else {
      setFilteredPasswords(
        passwords.filter((p) => p.category === currentCategory)
      );
    }
    setCurrentPage(1);
  }, [currentCategory, passwords]);

  const fetchPasswords = async () => {
    try {
      const response = await passwordsApi.getAll();
      setPasswords(response.passwords || []);
    } catch (error: any) {
      toast.error(error.message || '获取密码列表失败');
      if (error.message?.includes('401')) {
        navigate('/auth');
      }
    }
  };

  const categories = [
    {
      name: '全部',
      value: 'all',
      count: passwords.length,
    },
    ...Array.from(new Set(passwords.map((p) => p.category).filter(Boolean)))
      .map((cat) => ({
        name: cat as string,
        value: cat as string,
        count: passwords.filter((p) => p.category === cat).length,
      })),
  ];

  const totalPages = Math.ceil(filteredPasswords.length / itemsPerPage);
  const paginatedPasswords = filteredPasswords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const showAddModal = () => {
    setEditingId(null);
    resetForm();
    setModalOpen(true);
  };

  const showEditModal = async (id: number) => {
    try {
      const password = await passwordsApi.getById(id);
      setEditingId(id);
      setFormData({
        title: password.title || '',
        url: password.url || '',
        username: password.username || '',
        password: password.password || '',
        category: password.category || '',
        notes: password.notes || '',
      });
      setModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || '获取密码详情失败');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.password) {
      toast.error('标题和密码为必填项');
      return;
    }

    try {
      if (editingId) {
        await passwordsApi.update(editingId, formData);
        toast.success('密码更新成功');
      } else {
        await passwordsApi.create(formData);
        toast.success('密码添加成功');
      }
      setModalOpen(false);
      resetForm();
      fetchPasswords();
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个密码吗？')) {
      return;
    }

    try {
      await passwordsApi.delete(id);
      toast.success('密码删除成功');
      fetchPasswords();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label}已复制到剪贴板`);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const generatePassword = () => {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let password = '';
    for (let i = 0; i < passwordLength; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setFormData({ ...formData, password });
    toast.success('密码已生成');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      username: '',
      password: '',
      category: '',
      notes: '',
    });
    setShowPassword(false);
  };

  return (
    <Layout>
      <div className="flex gap-6">
        {/* 左侧分类导航 */}
        <Card className="w-64 h-fit">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">密码分类</h2>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setCurrentCategory(category.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between',
                    currentCategory === category.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 右侧密码列表 */}
        <div className="flex-1">
          <div className="mb-6">
            <Button onClick={showAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              添加新密码
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">标题</th>
                      <th className="text-left p-4 font-semibold">URL</th>
                      <th className="text-left p-4 font-semibold">用户名</th>
                      <th className="text-left p-4 font-semibold">分类</th>
                      <th className="text-left p-4 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPasswords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          没有保存的密码
                        </td>
                      </tr>
                    ) : (
                      paginatedPasswords.map((password) => (
                        <tr key={password.id} className="border-b hover:bg-accent/50">
                          <td className="p-4">{password.title}</td>
                          <td className="p-4">
                            {password.url ? (
                              <a
                                href={password.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td
                            className="p-4 cursor-pointer hover:text-primary"
                            onClick={() =>
                              password.username &&
                              copyToClipboard(password.username, '用户名')
                            }
                          >
                            {password.username || '-'}
                          </td>
                          <td className="p-4">{password.category || '-'}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(password.password || '', '密码')}
                                title="复制密码"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => showEditModal(password.id)}
                                title="编辑"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(password.id)}
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
                    第 {currentPage} / {totalPages} 页 (共 {filteredPasswords.length} 条)
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

      {/* 添加/编辑密码模态框 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑密码' : '添加新密码'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="title" required>标题</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password" required>密码</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成
                  </Button>
                </div>
              </div>

              {/* 密码生成器设置 */}
              <div className="col-span-2 border rounded-lg p-4 bg-accent/50">
                <h3 className="font-semibold mb-3">密码生成器</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="length">长度</Label>
                    <Input
                      id="length"
                      type="number"
                      min={8}
                      max={32}
                      value={passwordLength}
                      onChange={(e) => setPasswordLength(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeNumbers}
                        onChange={(e) => setIncludeNumbers(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">数字</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSymbols}
                        onChange={(e) => setIncludeSymbols(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">特殊符号</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
