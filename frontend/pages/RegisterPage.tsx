import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockDb';
import { RiderFunction } from '../types';
import Modal from '../components/Modal';
import { AlertCircle, CheckCircle, FileUp, Loader, ArrowRight, CreditCard, Shield, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    riderFunction: RiderFunction.MOTO,
    password: '',
    confirmPassword: '',
    email: '',
    gender: 'male'
  });
  const [files, setFiles] = useState({
    profilePhoto: null as File | null,
    idCard: null as File | null,
    license: null as File | null
  });
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
      setFileError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFileError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('registerRider.passwordMismatch'));
      return;
    }

    if (!files.profilePhoto || !files.idCard || !files.license) {
      setFileError(t('registerRider.filesRequired'));
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      if (files.profilePhoto) submitData.append('profilePhoto', files.profilePhoto);
      if (files.idCard) submitData.append('idCard', files.idCard);
      if (files.license) submitData.append('license', files.license);

      await mockApi.registerRider(submitData);
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      setError(`❌ Erreur lors de l'inscription: ${err.message || 'Une erreur est survenue. Veuillez réessayer.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            {t('registerRider.title')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">{t('registerRider.subtitle')}</p>
        </div>

        {/* Main Form Card */}
        <div className="card-modern p-6 sm:p-8 md:p-10 animate-scale-in">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 flex items-start gap-3 animate-scale-in">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {fileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 flex items-start gap-3 animate-scale-in">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{fileError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">1</div>
                {t('registerRider.sectionPersonal')}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label-modern">{t('registerRider.firstName')}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label className="label-modern">{t('registerRider.lastName')}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="label-modern">{t('registerRider.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-modern"
                  placeholder="votre@email.com"
                />
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label-modern">{t('registerRider.gender')}</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                  >
                    <option value="male">{t('registerRider.genderMale')}</option>
                    <option value="female">{t('registerRider.genderFemale')}</option>
                  </select>
                </div>

                <div>
                  <label className="label-modern">{t('registerRider.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="77 000 00 00"
                  />
                </div>
              </div>
            </div>

            {/* Adresse et Type */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">2</div>
                {t('registerRider.sectionProfessional')}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="label-modern">{t('registerRider.address')}</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="Votre adresse"
                  />
                </div>

                <div>
                  <label className="label-modern">{t('registerRider.riderType')}</label>
                  <select
                    name="riderFunction"
                    value={formData.riderFunction}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                  >
                    {Object.values(RiderFunction).map((func) => (
                      <option key={func} value={func}>{func}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sécurité */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">3</div>
                {t('registerRider.sectionSecurity')}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label-modern">{t('registerRider.password')}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="label-modern">{t('registerRider.confirmPassword')}</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">4</div>
                {t('registerRider.sectionDocs')}
              </h3>

              <div className="space-y-4">
                {[ 
                  { name: 'profilePhoto', label: t('registerRider.docProfilePhoto'), icon: '📷' },
                  { name: 'idCard', label: t('registerRider.docIdCard'), icon: '🆔' },
                  { name: 'license', label: t('registerRider.docLicense'), icon: '🚗' }
                ].map((field) => (
                  <div key={field.name} className="relative">
                    <label className="label-modern flex items-center gap-2">
                      <span>{field.icon}</span>
                      {field.label} *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name={field.name}
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full px-4 py-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl transition-all flex items-center gap-3 cursor-pointer hover:bg-slate-100">
                        <FileUp size={24} className="text-yellow-400" />
                        <span className="text-slate-900 font-semibold">
                          {files[field.name as keyof typeof files]
                            ? (files[field.name as keyof typeof files] as File).name
                            : t('registerRider.chooseDoc', { label: field.label })}
                        </span>
                      </div>
                    </div>
                    <p className="text-blue-200 text-xs">{t('registerRider.formatHint')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    {t('registerRider.processing')}
                  </>
                ) : (
                  <>
                    <ArrowRight size={20} />
                    {t('registerRider.submit')}
                  </>
                )}
              </button>
              <div className="mt-4 space-y-2">
                <p className="text-center text-slate-600 text-xs">
                  {t('registerRider.legal')}
                </p>
                <div className="flex items-center justify-center gap-4 text-slate-600 text-xs">
                  <div className="flex items-center gap-1">
                    <Shield size={12} className="text-blue-600" />
                    <span>{t('registerRider.secure')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-blue-600" />
                    <span>{t('registerRider.instantValidation')}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        title=""
        onClose={() => {}}
      >
        <div className="text-center space-y-6">
          {/* Célébration animée */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse opacity-30"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center animate-scale-in">
              <CheckCircle size={48} className="text-white animate-bounce" />
            </div>
          </div>

          {/* Message de succès */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{t('registerRider.successTitle')}</h2>
            <p className="text-slate-600 font-semibold">{t('registerRider.welcome')}</p>
          </div>

          {/* Détails de la confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CreditCard size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-green-800 font-bold">{t('registerRider.accountCreated')}</p>
                <p className="text-green-700 text-sm">{t('registerRider.youCanLogin')}</p>
              </div>
            </div>
            
            <div className="border-t border-green-400/30 pt-4">
              <p className="text-green-700 text-xs">
                {t('registerRider.nextSteps')}
              </p>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-slate-900 text-sm font-semibold mb-2">{t('registerRider.nextSteps')}</p>
            <div className="space-y-2 text-slate-600 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">1</span>
                </div>
                <span>{t('registerRider.step1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">2</span>
                </div>
                <span>{t('registerRider.step2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">3</span>
                </div>
                <span>{t('registerRider.step3')}</span>
              </div>
            </div>
          </div>

          {/* Timer de redirection */}
          <div className="flex items-center justify-center gap-2">
            <Clock size={16} className="text-slate-500 animate-pulse" />
            <p className="text-slate-600 text-sm">
              {t('registerRider.redirecting', { seconds: 5 })}
            </p>
          </div>

          {/* Bouton pour aller directement */}
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <ArrowRight size={20} />
            {t('registerRider.goLoginNow')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage;
