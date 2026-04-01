import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Lock, Mail } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock Login logic for testing UI without backend
      if (password === 'password') {
        let role = 'user';
        if (email.includes('admin')) role = 'admin';
        else if (email.includes('security')) role = 'security_officer';
        
        // Creating a structurally valid Mock JWT so AuthContext decode parses it
        const payload = window.btoa(JSON.stringify({ id: 'mock-1', email, role }));
        const mockToken = `header.${payload}.signature`;
        
        login(mockToken);
        if (role === 'admin') navigate('/admin');
        else if (role === 'security_officer') navigate('/security');
        else navigate('/dashboard');
        return;
      }
      
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token);
      const role = data.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'security_officer') navigate('/security');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">Secure Access</h2>
        {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
            </div>
          </div>
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-cyan-900/20">
            Authenticate System
          </button>
        </form>
      </div>
    </div>
  );
};
