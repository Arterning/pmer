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

export function SetupTwoFactor() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth, user } = useAuthStore();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // 检查是否有 temp_token 或已认证
    const tempToken = localStorage.getItem('temp_token');
    if (!isAuthenticated && !tempToken) {
      navigate('/auth');
    } else {
      setup2FA();
    }
  }, [isAuthenticated, navigate]);

  const setup2FA = async () => {
    try {
      const response = await authApi.setup2FA();
      setQrCode(response.qr_code);
      setSecret(response.secret);
    } catch (error: any) {
      toast.error(error.message || '获取二维码失败');
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast.error('请输入 6 位验证码');
      return;
    }

    try {
      const response = await authApi.enable2FA(verificationCode, password);

      // 如果返回了新 token，更新 auth store
      if (response.auto_login && response.token && response.user) {
        setAuth(response.user, response.token);
        localStorage.removeItem('temp_token');
      }

      toast.success(response.message || '双因素认证启用成功');
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || '启用失败');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>设置双因素认证</CardTitle>
            <CardDescription>
              使用认证器应用扫描二维码，然后输入生成的验证码
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qrCode ? (
              <div className="space-y-6">
                {/* 二维码 */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-lg">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      或手动输入密钥：
                    </p>
                    <code className="px-3 py-1 bg-accent rounded text-sm font-mono">
                      {secret}
                    </code>
                  </div>
                </div>

                {/* 验证表单 */}
                <form onSubmit={handleEnable2FA} className="space-y-4">
                  <div>
                    <Label htmlFor="code" required>
                      验证码
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      请输入认证器应用中显示的 6 位数字
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="password" required>
                      账户密码
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      为了安全起见，请输入您的账户密码
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/profile')}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button type="submit" className="flex-1">
                      启用双因素认证
                    </Button>
                  </div>
                </form>

                {/* 说明 */}
                <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
                  <p className="font-semibold">推荐的认证器应用：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
