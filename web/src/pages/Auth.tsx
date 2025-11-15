import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { authApi } from '@/lib/api/auth';
import { toast } from '@/lib/stores/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

export function Auth() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    try {
      if (isLogin) {
        const response = await authApi.login(formData.username, formData.password);

        if (response.requires_2fa) {
          setTempToken(response.token || '');
          setShowTwoFactor(true);
          toast.info('请输入双因素认证码');
        } else {
          const token = response.access_token || response.token;
          if (token && response.user) {
            setAuth(response.user, token);
            toast.success('登录成功');
            navigate('/');
          }
        }
      } else {
        const response = await authApi.register(
          formData.username,
          formData.email,
          formData.password
        );
        toast.success(response.message || '注册成功，请登录');
        setIsLogin(true);
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } catch (error: any) {
      toast.error(error.message || (isLogin ? '登录失败' : '注册失败'));
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authApi.verify2FA(tempToken, twoFactorCode);
      const token = response.access_token || response.token;
      if (token && response.user) {
        setAuth(response.user, token);
        toast.success('验证成功');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || '验证失败');
    }
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>双因素认证</CardTitle>
            <CardDescription>请输入您的认证器应用中的 6 位验证码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code" required>
                  验证码
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowTwoFactor(false)} className="flex-1">
                  返回
                </Button>
                <Button type="submit" className="flex-1">
                  验证
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? '登录' : '注册'} PMER</CardTitle>
          <CardDescription>
            {isLogin ? '欢迎回来' : '创建您的账户'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" required>
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="email" required>
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="password" required>
                密码
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword" required>
                  确认密码
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              {isLogin ? '登录' : '注册'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? '还没有账户？' : '已有账户？'}
              <Button
                type="button"
                variant="link"
                className="p-0 ml-1"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                  });
                }}
              >
                {isLogin ? '立即注册' : '立即登录'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
