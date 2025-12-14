import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { ScanFace, Fingerprint } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const user: User = {
        id: crypto.randomUUID(),
        name: isLogin ? (email.split('@')[0]) : name,
        email: email,
      };
      // Persist to local storage for persistence across reloads (in a real app)
      localStorage.setItem('fingerprint_user', JSON.stringify(user));
      onLogin(user);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6 text-bio-500">
            <div className="bg-bio-950/50 p-4 rounded-full ring-1 ring-bio-500/30">
              <Fingerprint size={48} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-slate-400 mb-8">
            {isLogin ? 'Enter your credentials to access the biometric lab.' : 'Sign up to start tracing fingerprints.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-bio-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-bio-500 focus:border-transparent outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-bio-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full mt-6" loading={loading} size="lg">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-bio-500 hover:text-bio-400 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
        
        {/* Decorative footer */}
        <div className="bg-slate-900/50 p-4 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <ScanFace size={14} />
            Secure Biometric Processing Environment
          </p>
        </div>
      </div>
    </div>
  );
};