import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockDb';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

export default function RegisterClientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('registerClient.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await mockApi.registerClient({ name, email, password });
      // Ne pas connecter automatiquement après inscription : l'utilisateur doit se connecter.
      // On conserve le compte créé côté mock DB, puis on redirige vers la page de connexion.
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || t('registerClient.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-8 sm:py-12 px-4">
      <div className="max-w-md w-full card-modern p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-3xl font-black text-blue-900 mb-2">{t('registerClient.title')}</h2>
          <p className="text-gray-600">{t('registerClient.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('registerClient.fullName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t('registerClient.fullNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('registerClient.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t('registerClient.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('registerClient.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('registerClient.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? t('registerClient.creating') : t('registerClient.createAccount')}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          {t('registerClient.alreadyAccount')}{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            {t('registerClient.signIn')}
          </Link>
        </p>

        <p className="mt-3 text-center text-gray-600">
          {t('registerClient.areYouRider')}{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            {t('registerClient.becomeRider')}
          </Link>
        </p>
      </div>
    </div>
  );
}
