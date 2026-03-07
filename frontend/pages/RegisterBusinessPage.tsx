import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import { useTranslation } from 'react-i18next';

export default function RegisterBusinessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Company info
  const [companyName, setCompanyName] = useState('');
  const [ninea, setNinea] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  
  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validateStep1 = () => {
    if (!companyName.trim()) {
      setError(t('registerBusiness.errors.companyNameRequired'));
      return false;
    }
    if (!companyAddress.trim()) {
      setError(t('registerBusiness.errors.companyAddressRequired'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!email.trim()) {
      setError(t('registerBusiness.errors.emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('registerBusiness.errors.invalidEmail'));
      return false;
    }
    if (!password) {
      setError(t('registerBusiness.errors.passwordRequired'));
      return false;
    }
    if (password.length < 6) {
      setError(t('registerBusiness.errors.passwordMin'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('registerBusiness.errors.passwordMismatch'));
      return false;
    }
    if (!acceptTerms) {
      setError(t('registerBusiness.errors.termsRequired'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Simuler API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Stocker utilisateur business dans localStorage
      const businessUser = {
        id: 'biz_' + Date.now(),
        role: 'user' as const,
        type: UserType.BUSINESS,
        companyName,
        ninea: ninea.trim() || undefined,
        companyAddress,
        email,
        createdAt: new Date().toISOString(),
        emailVerified: false
      };

      localStorage.setItem('user', JSON.stringify(businessUser));
      localStorage.setItem('isAuthenticated', 'true');
      
      navigate('/business');
    } catch (err) {
      setError(t('registerBusiness.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('registerBusiness.back')}
            </Link>
            <div className="flex items-center space-x-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? t('registerBusiness.step1Title') : t('registerBusiness.step2Title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {step === 1 
              ? t('registerBusiness.step1Subtitle')
              : t('registerBusiness.step2Subtitle')
            }
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registerBusiness.companyName')}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerBusiness.companyNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registerBusiness.ninea')}
                </label>
                <input
                  type="text"
                  value={ninea}
                  onChange={(e) => setNinea(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerBusiness.nineaPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registerBusiness.companyAddress')}
                </label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerBusiness.companyAddressPlaceholder')}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registerBusiness.professionalEmail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerBusiness.professionalEmailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registerBusiness.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerBusiness.passwordPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('registerBusiness.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerBusiness.confirmPasswordPlaceholder')}
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                  {t('registerBusiness.acceptPrefix')}{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">
                    {t('registerBusiness.terms')}
                  </Link>{' '}
                  {t('registerBusiness.and')}{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">
                    {t('registerBusiness.privacy')}
                  </Link>
                </label>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('registerBusiness.previous')}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? t('registerBusiness.creating')
                : step === 1
                  ? t('registerBusiness.next')
                  : t('registerBusiness.createAccount')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-center text-sm text-gray-600">
            {t('registerBusiness.alreadyAccount')}{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              {t('registerBusiness.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
