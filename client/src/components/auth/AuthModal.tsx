import React, { useState } from 'react';
import { apiLogin, apiRegister } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useTrainStore } from '../../stores/trainStore';
import { X, Lock, Mail, User as UserIcon, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'railfan' | 'admin'>('railfan');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const { theme } = useTrainStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const data = await apiRegister(email, password, name, role);
        setAuth(data.user, data.token);
        onClose();
      } else {
        const data = await apiLogin(email, password);
        setAuth(data.user, data.token);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsRegister(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative transition-all ${
          theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#141B2D] border-slate-700 text-slate-100'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-500/20 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accentBlue to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-accentBlue/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">{isRegister ? 'Join TrackPulse' : 'Sign In to TrackPulse'}</h2>
            <p className="text-xs text-slate-400">Indian Railway Spatial Intelligence Platform</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-700/40 mb-5">
          <button
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
              !isRegister ? 'border-accentBlue text-accentBlue' : 'border-transparent text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
              isRegister ? 'border-accentBlue text-accentBlue' : 'border-transparent text-slate-400'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajat Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-accentBlue ${
                    theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700'
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="railfan@trackpulse.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-accentBlue ${
                  theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-accentBlue ${
                  theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700'
                }`}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-accentBlue ${
                  theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700'
                }`}
              >
                <option value="railfan">Railfan (Full Kinematics)</option>
                <option value="user">Passenger</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-accentBlue text-slate-950 font-bold text-xs shadow-lg shadow-accentBlue/20 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-5 pt-4 border-t border-slate-700/40 text-[11px]">
          <span className="text-slate-400 font-semibold block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Demo Credentials:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickLogin('railfan@trackpulse.in', 'trackpulse123')}
              className="flex-1 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-amber-300">Railfan Account</div>
              <div className="font-mono text-[9px] text-slate-400">railfan@trackpulse.in</div>
            </button>
            <button
              onClick={() => handleQuickLogin('admin@trackpulse.in', 'admin123')}
              className="flex-1 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 text-left transition-colors"
            >
              <div className="font-bold text-emerald-300">Admin Account</div>
              <div className="font-mono text-[9px] text-slate-400">admin@trackpulse.in</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
