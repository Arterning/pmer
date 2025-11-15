import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth';
import { authApi } from '@/lib/api/auth';
import { toast } from '@/lib/stores/toast';
import type { User } from '@/lib/types';

export function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, user: storeUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      fetchProfile();
    }
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.user);
    } catch (error: any) {
      toast.error(error.message || '获取用户信息失败');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('新密码长度至少为 6 位');
      return;
    }

    try {
      await authApi.changePassword(oldPassword, newPassword);
      toast.success('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    }
  };

  const handle2FASetup = () => {
    navigate('/setup-2fa');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 用户信息 */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
            <CardDescription>查看您的账户信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>用户名</Label>
              <div className="mt-1 text-sm">{user?.username || storeUser?.username || '-'}</div>
            </div>
            <div>
              <Label>邮箱</Label>
              <div className="mt-1 text-sm">{user?.email || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* 修改密码 */}
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>更改您的账户密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="oldPassword" required>
                  当前密码
                </Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword" required>
                  新密码
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" required>
                  确认新密码
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit">修改密码</Button>
            </form>
          </CardContent>
        </Card>

        {/* 双因素认证 */}
        <Card>
          <CardHeader>
            <CardTitle>双因素认证</CardTitle>
            <CardDescription>
              为您的账户添加额外的安全保护
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handle2FASetup}>设置双因素认证</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
