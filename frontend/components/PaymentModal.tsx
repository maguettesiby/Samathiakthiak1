import React, { useState } from 'react';
import { X, Loader2, ArrowRight, Smartphone, AlertCircle, Check, Zap, Calendar, Star, Lock } from 'lucide-react';
import { PaymentProvider, AccessTier } from '../types';
import { usePayment } from '../context/PaymentContext';
import { mockApi } from '../services/mockDb';
import { useTranslation } from 'react-i18next';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Plan {
  id: AccessTier;
  name: string;
  price: number;
  duration: string;
  durationDays: number;
  icon: React.ReactNode;
  popular?: boolean;
  savings?: string;
  benefits: string[];
}

const PLANS: Plan[] = [
  {
    id: AccessTier.FLASH,
    name: "Pass Flash",
    price: 150,
    duration: "1 Heure",
    durationDays: 1,
    icon: <Zap size={24} className="text-yellow-400" />,
    benefits: ["Accès illimité 1h", "Voir tous les numéros"]
  },
  {
    id: AccessTier.MONTHLY,
    name: "Pack Mensuel",
    price: 4500,
    duration: "30 Jours",
    durationDays: 30,
    icon: <Calendar size={24} className="text-blue-400" />,
    popular: true,
    benefits: ["Accès illimité 30j", "Support prioritaire", "Pas d'engagement"]
  },
  {
    id: AccessTier.YEARLY,
    name: "Pack Annuel",
    price: 27000,
    duration: "1 An",
    durationDays: 365,
    icon: <Star size={24} className="text-purple-400" />,
    savings: "Économisez 50%",
    benefits: ["Accès illimité 365j", "Support VIP 24/7", "Meilleur rapport qualité-prix"]
  }
];

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { grantAccess } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'selection' | 'provider' | 'form' | 'processing' | 'success'>('selection');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(PaymentProvider.PAYTECH);

  if (!isOpen) return null;

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedProvider(PaymentProvider.PAYTECH);
    setStep('form');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 9) {
      setError(t('paymentModal.errors.invalidPhone'));
      return;
    }
    setError('');
    setLoading(true);
    setStep('processing');

    try {
      const success = await mockApi.processPayment(
        selectedProvider,
        cleanPhone,
        selectedPlan.price,
        { purpose: `Accès ${selectedPlan.name}` }
      );
      
      if (success) {
        setStep('success');
        grantAccess(selectedPlan.id);
        
        setTimeout(() => {
          onClose();
          resetModal();
        }, 3000);
      } else {
        throw new Error(t('paymentModal.errors.notConfirmed'));
      }
    } catch (err: any) {
      setError(err.message || t('paymentModal.errors.failed'));
      setStep('form');
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('selection');
    setPhone('');
    setSelectedProvider(PaymentProvider.PAYTECH);
    setLoading(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-white/40 animate-scale-in">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-10 p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-10">
          {/* Header */}
          {step === 'selection' && (
            <div className="text-center mb-10 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent mb-3">
                {t('paymentModal.title')}
              </h2>
              <p className="text-gray-600 font-semibold text-lg">{t('paymentModal.subtitle')}</p>
            </div>
          )}

          {step === 'selection' && (
            <div className="space-y-4 animate-fade-in">
              {PLANS.map((plan, idx) => (
                <button
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all group relative overflow-hidden transform hover:scale-102 active:scale-95 ${
                    plan.popular 
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50/80 to-blue-100/50 shadow-lg shadow-blue-200/50' 
                      : 'border-gray-200 hover:border-blue-300 bg-white/60 hover:shadow-lg'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-2xl tracking-widest shadow-lg">
                      {t('paymentModal.popular')}
                    </div>
                  )}

                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`p-4 rounded-2xl flex-shrink-0 transition-all ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {plan.icon}
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-left">
                      <h4 className="font-black text-gray-900 text-lg mb-1">{t(`paymentModal.plans.${plan.id}.name`)}</h4>
                      <p className="text-3xl font-black text-blue-600 mb-2">{plan.price.toLocaleString()} F</p>
                      <p className="text-sm text-gray-500 font-semibold mb-3">
                        {t('paymentModal.accessFor', { duration: t(`paymentModal.plans.${plan.id}.duration`) })}
                      </p>
                      
                      {/* Benefits */}
                      <div className="space-y-1">
                        {plan.benefits.map((benefit, i) => (
                          <div key={i} className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            {t(`paymentModal.plans.${plan.id}.benefits.${i}`)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Savings Badge & Arrow */}
                    <div className="flex flex-col items-end gap-3">
                      {plan.savings && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black text-green-700 bg-green-100/80 border border-green-300">
                          <Zap size={14} />
                          {t(`paymentModal.plans.${plan.id}.savings`)}
                        </span>
                      )}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-400/50 transition-all">
                        <ArrowRight size={22} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mt-6 flex items-start gap-3">
                <Lock size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-green-700 leading-relaxed">
                  {t('paymentModal.securityNote')}
                </p>
              </div>
            </div>
          )}

          {step === 'provider' && (
            <div className="space-y-6 animate-fade-in">
              <button 
                type="button"
                onClick={() => {
                  setStep('selection');
                  setError('');
                }}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
              >
                <ArrowRight size={18} className="rotate-180" />
                {t('paymentModal.changePlan')}
              </button>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 mb-3">{t('paymentModal.chooseProviderTitle')}</h3>
                <p className="text-gray-600 font-semibold">{t('paymentModal.chooseProviderSubtitle')}</p>
              </div>

              {/* Plan Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-6 mb-6">
                <p className="text-xs font-black uppercase tracking-wider text-blue-100 mb-2">{t('paymentModal.selectedPlan')}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black">{t(`paymentModal.plans.${selectedPlan.id}.name`)}</p>
                    <p className="text-sm text-blue-100">{t('paymentModal.accessDuration', { duration: t(`paymentModal.plans.${selectedPlan.id}.duration`) })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{selectedPlan.price.toLocaleString()}</p>
                    <p className="text-xs font-bold text-blue-100">F CFA</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedProvider(PaymentProvider.PAYTECH);
                    setStep('form');
                    setError('');
                  }}
                  className={`w-full p-6 rounded-2xl border-2 transition-all group relative overflow-hidden transform hover:scale-102 active:scale-95 ${
                    selectedProvider === PaymentProvider.PAYTECH
                      ? 'border-orange-500 bg-gradient-to-br from-orange-50/80 to-orange-100/50 shadow-lg shadow-orange-200/50' 
                      : 'border-gray-200 hover:border-orange-300 bg-white/60 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 transition-all ${
                      selectedProvider === PaymentProvider.PAYTECH
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                    }`}>
                      <Zap size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-black text-gray-900 text-lg mb-1">PayTech SN</h4>
                      <p className="text-sm text-gray-600 font-semibold">{t('paymentModal.providerPaytech')}</p>
                    </div>
                    {selectedProvider === PaymentProvider.PAYTECH && (
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
                        <Check size={18} />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                <Lock size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-green-700 leading-relaxed">
                  {t('paymentModal.securityNoteShort')}
                </p>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <button 
                type="button"
                onClick={() => {
                  setStep('provider');
                  setError('');
                }}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
              >
                <ArrowRight size={18} className="rotate-180" />
                {t('paymentModal.changeProvider')}
              </button>

              {/* Plan Summary */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-6">
                <p className="text-xs font-black uppercase tracking-wider text-blue-100 mb-2">{t('paymentModal.selectedPlan')}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black">{t(`paymentModal.plans.${selectedPlan.id}.name`)}</p>
                    <p className="text-sm text-blue-100 mt-1">{t('paymentModal.accessDuration', { duration: t(`paymentModal.plans.${selectedPlan.id}.duration`) })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black">{selectedPlan.price.toLocaleString()}</p>
                    <p className="text-xs font-bold text-blue-100">F CFA</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm font-semibold flex items-start gap-3 animate-scale-in">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Phone Input */}
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">
                  {t('paymentModal.phoneLabel', { provider: selectedProvider })}
                </label>
                <div className="relative">
                  <Smartphone size={20} className="absolute left-4 top-4 text-blue-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('paymentModal.phonePlaceholder')}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl text-center font-mono text-xl font-bold tracking-widest outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span>{t('paymentModal.processing')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('paymentModal.confirmPayment')}</span>
                    <ArrowRight size={22} />
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-3 text-xs font-bold text-gray-500 pt-4 border-t border-gray-200">
                <Lock size={14} className="text-green-600" />
                {t('paymentModal.securedBy', { provider: selectedProvider })}
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              {/* Provider Logo Animation */}
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse opacity-75 blur-xl"></div>
                <div className="relative bg-white p-8 rounded-3xl border-4 border-blue-100 shadow-2xl flex items-center justify-center">
                  <Smartphone size={48} className="text-orange-600 animate-bounce" />
                </div>
              </div>
              
              <h3 className="text-3xl font-black text-gray-900 mb-3">{t('paymentModal.checkPhoneTitle')}</h3>
              <p className="text-gray-600 mb-8 px-4 font-semibold leading-relaxed">
                {t('paymentModal.requestSent', { amount: selectedPlan.price.toLocaleString(), phone })}
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 text-amber-900 p-6 rounded-2xl font-bold animate-pulse text-base max-w-xs leading-relaxed">
                {t('paymentModal.validateInApp', { provider: selectedProvider })}
              </div>

              <div className="mt-10 flex items-center gap-3 text-sm font-bold text-blue-600 uppercase tracking-wider">
                <Loader2 size={18} className="animate-spin" />
                <span>{t('paymentModal.verifying')}</span>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-8 text-white shadow-2xl shadow-green-400/50 animate-scale-in">
                <Check size={56} strokeWidth={3} />
              </div>
              
              <h3 className="text-4xl font-black text-gray-900 mb-3">{t('paymentModal.congrats')}</h3>
              <p className="text-lg text-gray-600 font-semibold mb-8 px-4">
                {t('paymentModal.subscriptionActive', { plan: t(`paymentModal.plans.${selectedPlan.id}.name`) })}
              </p>
              
              <div className="space-y-2 mb-8">
                <div className="flex items-center justify-center gap-3 text-green-700 font-bold">
                  <Check size={20} />
                  <span>{t('paymentModal.benefitImmediate')}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-green-700 font-bold">
                  <Check size={20} />
                  <span>{t('paymentModal.durationLine', { duration: t(`paymentModal.plans.${selectedPlan.id}.duration`) })}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-3 rounded-full text-green-700 text-sm font-black uppercase tracking-widest border border-green-200">
                {t('paymentModal.redirecting')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
