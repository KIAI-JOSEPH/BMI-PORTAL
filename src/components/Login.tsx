import React, { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: User) => void;
  logo?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

const API_URL = 'http://localhost:3001/api/v1';

const Login: React.FC<LoginProps> = ({ onLogin, logo }) => {
  const [email, setEmail] = useState('admin@bmi.edu');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token
      localStorage.setItem('bmi_token', data.data.token);
      localStorage.setItem('bmi_user', JSON.stringify(data.data.user));
      
      // Call parent callback
      onLogin(data.data.token, data.data.user);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0033] via-[#4B0082] to-[#320064] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#FFD700] rounded-full mix-blend-overlay blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-[#6A0DAD] rounded-full mix-blend-overlay blur-[100px] opacity-40"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-[420px] p-8 md:p-12 relative z-10 border border-white/20">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4B0082] via-[#FFD700] to-[#4B0082]"></div>

        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-10">
            <div className="w-28 h-28 mb-4 relative drop-shadow-xl">
                 <img 
                    src={logo || "https://i.ibb.co/Gv2vPdJC/BMI-PNG.png"} 
                    alt="BMI University Logo" 
                    className="w-full h-full object-contain rounded-xl border-2 border-[#FFD700] bg-white"
                />
            </div>
            <h1 className="text-3xl font-bold text-[#4B0082] text-center tracking-tight">BMI University</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Faculty & Staff Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Authentication Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B0082] uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#FFD700] transition-colors" />
                    </div>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent text-gray-700 text-sm transition-all shadow-inner"
                        placeholder="name@university.edu"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B0082] uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#FFD700] transition-colors" />
                    </div>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent text-gray-700 text-sm transition-all shadow-inner"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                    <input id="remember-me" type="checkbox" className="h-4 w-4 text-[#4B0082] focus:ring-[#FFD700] border-gray-300 rounded cursor-pointer" />
                    <label htmlFor="remember-me" className="ml-2 block text-gray-600 cursor-pointer">Remember me</label>
                </div>
                <a href="#" className="font-semibold text-[#4B0082] hover:text-[#FFD700] transition-colors">Forgot password?</a>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#4B0082] bg-gradient-to-r from-[#FFD700] to-[#FDB931] hover:from-[#FFE033] hover:to-[#FFC44D] transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFD700] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
        </form>

        <div className="mt-8 text-center">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest">Powered by BMI Systems © 2024</span>
        </div>
      </div>
    </div>
  );
};

export default Login;