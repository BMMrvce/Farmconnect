import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Sprout } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1e8] via-[#e8f5e9] to-[#f1f8e9] px-4">
      <Card className="w-full max-w-md shadow-2xl border-[#8bc34a]/20">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#558b2f] to-[#8bc34a] rounded-2xl flex items-center justify-center shadow-lg">
            <Sprout className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-[#2d5016]">Farm Management</CardTitle>
          <CardDescription className="text-[#5a7c3b]">Sign in to manage your agricultural operations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#2d5016] font-medium">Email</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#8bc34a]/40 focus:border-[#558b2f] focus:ring-[#558b2f]/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#2d5016] font-medium">Password</Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#8bc34a]/40 focus:border-[#558b2f] focus:ring-[#558b2f]/20"
              />
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#558b2f] to-[#7cb342] hover:from-[#33691e] hover:to-[#558b2f] text-white font-semibold py-6 shadow-lg transition-all duration-300"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-[#5a7c3b]">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#558b2f] hover:text-[#33691e] hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
