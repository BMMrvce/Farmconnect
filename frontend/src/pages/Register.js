import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Sprout } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'subscriber'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.name, formData.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
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
          <CardTitle className="text-3xl font-bold text-[#2d5016]">Create Account</CardTitle>
          <CardDescription className="text-[#5a7c3b]">Join our farm management platform</CardDescription>
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
              <Label htmlFor="name" className="text-[#2d5016] font-medium">Full Name</Label>
              <Input
                id="name"
                data-testid="register-name-input"
                type="text"
                placeholder="John Farmer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-[#8bc34a]/40 focus:border-[#558b2f] focus:ring-[#558b2f]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#2d5016] font-medium">Email</Label>
              <Input
                id="email"
                data-testid="register-email-input"
                type="email"
                placeholder="farmer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-[#8bc34a]/40 focus:border-[#558b2f] focus:ring-[#558b2f]/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#2d5016] font-medium">Password</Label>
              <Input
                id="password"
                data-testid="register-password-input"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="border-[#8bc34a]/40 focus:border-[#558b2f] focus:ring-[#558b2f]/20"
              />
              <p className="text-xs text-[#5a7c3b]">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#2d5016] font-medium">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="register-role-select" className="border-[#8bc34a]/40 focus:border-[#558b2f] focus:ring-[#558b2f]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Farm Owner</SelectItem>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="subscriber">Subscriber</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#5a7c3b]">Select your role in the farm management system</p>
            </div>

            <Button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#558b2f] to-[#7cb342] hover:from-[#33691e] hover:to-[#558b2f] text-white font-semibold py-6 shadow-lg transition-all duration-300"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-[#5a7c3b]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#558b2f] hover:text-[#33691e] hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
