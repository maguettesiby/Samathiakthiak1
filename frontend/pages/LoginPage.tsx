import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockDb';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'client' | 'rider'>('client');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'client') {
        const response = await mockApi.loginClient(identifier, password);
        login(response.user, response.token, rememberMe);
        navigate('/client');
      } else {
        const response = await mockApi.login(identifier, password);
        login(response.user, response.token, rememberMe);
        navigate(response.user.role === 'admin' ? '/admin' : '/rider-dashboard');
      }
    } catch (err: any) {
      setError(err.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-8 sm:py-12 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      </div>

      <div className="max-w-md w-full card-modern p-6 sm:p-8 relative z-10 animate-fade-in-up mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl">
              <LogIn size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-blue-900 mb-2">
            {t('auth.title')}
          </h2>
          <p className="text-gray-600">{t('auth.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-scale-in">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('client')}
            className={`px-4 py-2 rounded-xl font-bold border transition-colors ${
              mode === 'client'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t('auth.client')}
          </button>
          <button
            type="button"
            onClick={() => setMode('rider')}
            className={`px-4 py-2 rounded-xl font-bold border transition-colors ${
              mode === 'rider'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t('auth.riderAdmin')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              {mode === 'client' ? t('auth.email') : t('auth.emailOrPhone')}
            </label>
            <input
              type={mode === 'client' ? 'email' : 'text'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={
                mode === 'client'
                  ? t('auth.emailPlaceholder')
                  : t('auth.emailOrPhonePlaceholder')
              }
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t('auth.passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? t('common.loading') : t('auth.submit')}
            <LogIn size={20} />
          </button>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-blue-600"
            />
            {t('auth.rememberMe')}
          </label>
        </form>

        <p className="mt-8 text-center text-gray-600">
          {mode === 'client' ? (
            <>
              {t('auth.noAccount')}{' '}
              <Link to="/register-client" className="text-blue-600 font-bold hover:underline">
                {t('auth.createClient')}
              </Link>
            </>
          ) : (
            <>
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                {t('auth.becomeRider')}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
