import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Calendar, MapPin, Phone, Receipt, User } from 'lucide-react';
import { mockApi } from '../services/mockDb';
import { Order, SenegalRegion, ServiceCategory } from '../types';
import { useTranslation } from 'react-i18next';

const regionOptions = Object.values(SenegalRegion);
const categoryOptions = Object.values(ServiceCategory);

const NewOrderPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [category, setCategory] = useState<ServiceCategory>(ServiceCategory.PHARMACY);

  const [pickupRegion, setPickupRegion] = useState<SenegalRegion>(SenegalRegion.DAKAR);
  const [dropoffRegion, setDropoffRegion] = useState<SenegalRegion>(SenegalRegion.DAKAR);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [scheduledMode, setScheduledMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canEstimate = useMemo(() => {
    return Boolean(category && pickupRegion && dropoffRegion);
  }, [category, pickupRegion, dropoffRegion]);

  useEffect(() => {
    if (!canEstimate) return;

    const run = async () => {
      setLoadingEstimate(true);
      try {
        const res = await (mockApi as any).estimatePrice({ category, pickupRegion, dropoffRegion });
        if (typeof res?.estimatedPrice === 'number') {
          setEstimatedPrice(res.estimatedPrice);
        }
      } catch {
        // ignore
      } finally {
        setLoadingEstimate(false);
      }
    };

    run();
  }, [canEstimate, category, pickupRegion, dropoffRegion]);

  const validate = () => {
    if (!customerName.trim()) return t('newOrder.errors.customerNameRequired');
    if (!customerPhone.trim()) return t('newOrder.errors.customerPhoneRequired');
    if (!pickupAddress.trim()) return t('newOrder.errors.pickupAddressRequired');
    if (!dropoffAddress.trim()) return t('newOrder.errors.dropoffAddressRequired');
    if (scheduledMode === 'later' && !scheduledAt) return t('newOrder.errors.scheduledAtRequired');
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSubmitting(true);

      const input: Omit<Order, 'id' | 'status' | 'estimatedPrice' | 'createdAt'> = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        category,
        pickupRegion,
        dropoffRegion,
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        notes: notes.trim() ? notes.trim() : undefined,
        scheduledAt: scheduledMode === 'later' ? new Date(scheduledAt).toISOString() : undefined,
        assignedRiderId: undefined,
      };

      const created = await (mockApi as any).createOrder(input);
      navigate(`/orders/${created.id}`);
    } catch (err: any) {
      setError(err?.message || t('newOrder.errors.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{t('newOrder.title')}</h1>
          <p className="text-slate-600">{t('newOrder.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 border border-red-200 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-modern p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-modern">{t('newOrder.customerName')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input-modern pl-10"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('newOrder.customerNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="label-modern">{t('newOrder.customerPhone')}</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input-modern pl-10"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t('newOrder.customerPhonePlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-modern">{t('newOrder.category')}</label>
              <select className="input-modern" value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)}>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-modern">{t('newOrder.scheduling')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={scheduledMode === 'now' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setScheduledMode('now')}
                >
                  {t('newOrder.now')}
                </button>
                <button
                  type="button"
                  className={scheduledMode === 'later' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setScheduledMode('later')}
                >
                  {t('newOrder.later')}
                </button>
              </div>

              {scheduledMode === 'later' && (
                <div className="mt-3 relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    className="input-modern pl-10"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-modern">{t('newOrder.pickupRegion')}</label>
              <select className="input-modern" value={pickupRegion} onChange={(e) => setPickupRegion(e.target.value as SenegalRegion)}>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-modern">{t('newOrder.dropoffRegion')}</label>
              <select className="input-modern" value={dropoffRegion} onChange={(e) => setDropoffRegion(e.target.value as SenegalRegion)}>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-modern">{t('newOrder.pickupAddress')}</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-4" />
                <textarea
                  className="input-modern pl-10 min-h-[84px]"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder={t('newOrder.addressPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="label-modern">{t('newOrder.dropoffAddress')}</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-4" />
                <textarea
                  className="input-modern pl-10 min-h-[84px]"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder={t('newOrder.addressPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label-modern">{t('newOrder.notes')}</label>
            <textarea
              className="input-modern min-h-[88px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('newOrder.notesPlaceholder')}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Receipt className="w-5 h-5 text-blue-600" />
                {t('newOrder.estimateTitle')}
              </div>
              <p className="text-slate-600 text-sm mt-1">{t('newOrder.estimateSubtitle')}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-slate-900 text-2xl font-black">
                {loadingEstimate
                  ? t('newOrder.estimateLoading')
                  : estimatedPrice !== null
                    ? `${estimatedPrice}${t('newOrder.currencySuffix')}`
                    : t('newOrder.estimateUnset')}
              </p>
              <p className="text-slate-500 text-xs">{t('newOrder.currencyLabel')}</p>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full btn-primary flex items-center justify-center gap-2">
            {submitting ? t('newOrder.submitting') : (
              <>
                {t('newOrder.submit')}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-xs text-slate-600 text-center">
            {t('newOrder.statusHint')}
          </p>
        </form>
      </div>
    </div>
  );
};

export default NewOrderPage;
